/* Teacher Payments — ported from public/prototype/js/render-teacherpay.js (renderTeacherPayments,
   wireTeacherPayTabs, teacherPayPane and the pay-rate / raise / reject / disburse / voucher modals).
   The data-action handlers reproduce the matching cases in the prototype's app.js click delegation. */

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    DB,
    PAY_RATE_TYPE_LABELS,
    approveTeacherPayment,
    batchName,
    computeEarnedForTeacherBatch,
    fmtMoney,
    isTeacherRole,
    markTeacherPaymentPaid,
    outstandingForTeacherBatch,
    payRateFor,
    rejectTeacherPayment,
    requestTeacherPayment,
    scopedBatchesForUser,
    sum,
    teacherBatchPairs,
    teacherPaymentsScopedForUser,
    totalPaidToTeacherForBatch,
    userName,
} from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { useIdentity } from '../../lib/identity';
import { Icon, KpiCard, Tabs } from '../../lib/ui';
import { useUi } from '../../lib/UiProvider';
import DisburseForm from './teacherpay/DisburseForm';
import HistoryPane from './teacherpay/HistoryPane';
import { useSetPayRateModal } from './teacherpay/PayRateForm';
import RaisePaymentForm from './teacherpay/RaisePaymentForm';
import RatesPane from './teacherpay/RatesPane';
import RejectForm from './teacherpay/RejectForm';
import RequestsPane from './teacherpay/RequestsPane';
import { TeacherPaymentVoucher, VOUCHER_STATUS_TEXT, printTeacherPaymentVoucher } from './teacherpay/Voucher';

export default function TeacherPayments({ view }) {
    const { userId } = useIdentity();
    const { openModal, closeModal, toast } = useUi();
    const refresh = useRefresh();
    const [tab, setTab] = useState('rates');

    const isTeacher = isTeacherRole(userId);
    const scopedBatchIds = scopedBatchesForUser(userId).map((b) => b.id);
    const pairs = teacherBatchPairs(scopedBatchIds);
    const payments = teacherPaymentsScopedForUser(userId).filter((p) => scopedBatchIds.includes(p.batch_id));

    const totalEarned = sum(pairs, (pr) => computeEarnedForTeacherBatch(pr.teacher_id, pr.batch_id));
    const totalPaid = sum(pairs, (pr) => totalPaidToTeacherForBatch(pr.teacher_id, pr.batch_id));
    const totalOutstanding = sum(pairs, (pr) => outstandingForTeacherBatch(pr.teacher_id, pr.batch_id));
    const pendingCount = payments.filter((p) => p.status === 'pending').length;
    const approvedCount = payments.filter((p) => p.status === 'approved').length;

    /* ---- view-teacher-payment ---- */
    const openVoucher = (id) => {
        const p = DB.teacherPayments.find((x) => x.id === Number(id));

        if (!p) {
            return;
        }

        openModal({
            size: 'lg',
            title: 'Teacher Payment Voucher',
            sub: `${p.voucher_no} — ${VOUCHER_STATUS_TEXT[p.status] || p.status}`,
            body: <TeacherPaymentVoucher id={id} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => printTeacherPaymentVoucher(p.id, toast)}>
                        <Icon name="printer" /> Print Voucher
                    </button>
                </>
            ),
        });
    };

    /* ---- open-set-payrate / save-payrate ---- */
    const openSetPayRate = useSetPayRateModal(refresh);

    /* ---- open-raise-teacher-payment / save-teacher-payment ---- */
    const openRaisePayment = (teacherId, batchId) => {
        const b = DB.batches.find((x) => x.id === batchId);

        if (!b) {
            return;
        }

        const rate = payRateFor(teacherId, batchId);

        if (!rate) {
            toast('Set a pay rate first', 'error');

            return;
        }

        const submitRef = { current: () => {} };
        const suffix = rate.rate_type === 'per_session' ? '/class' : rate.rate_type === 'per_hour' ? '/hr' : '';

        openModal({
            title: 'Raise Payment Request',
            sub: `${userName(teacherId)} — ${b.name} · ${PAY_RATE_TYPE_LABELS[rate.rate_type]} @ ${fmtMoney(rate.rate_amount)}${suffix}`,
            body: (
                <RaisePaymentForm
                    teacherId={teacherId}
                    batchId={batchId}
                    submitRef={submitRef}
                    onSubmit={({ type, periodLabel, amount, computedAmount, notes }) => {
                        if (amount <= 0 || !periodLabel) {
                            toast('Amount and period/description are required', 'error');

                            return;
                        }

                        requestTeacherPayment({ teacherId, batchId, type, periodLabel, amount, computedAmount, notes, requestedBy: userId });
                        closeModal();
                        toast('Payment request submitted for approval');
                        refresh();
                    }}
                />
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => submitRef.current()}>
                        <Icon name="send" /> Submit Request
                    </button>
                </>
            ),
        });
    };

    /* ---- approve-teacher-payment ---- */
    const approve = (id) => {
        const p = approveTeacherPayment(id, userId);

        if (p) {
            toast(`${p.voucher_no} approved — ready for disbursement`);
        }

        refresh();
    };

    /* ---- open-reject-teacher-payment / save-reject-teacher-payment ---- */
    const openReject = (id) => {
        const p = DB.teacherPayments.find((x) => x.id === id);

        if (!p) {
            return;
        }

        const submitRef = { current: () => {} };

        openModal({
            title: 'Reject Payment Request',
            sub: `${p.voucher_no} — ${userName(p.teacher_id)} · ${fmtMoney(p.amount)}`,
            body: (
                <RejectForm
                    submitRef={submitRef}
                    onSubmit={({ reason }) => {
                        if (!reason) {
                            toast('Please provide a reason', 'error');

                            return;
                        }

                        rejectTeacherPayment(id, userId, reason);
                        closeModal();
                        toast('Payment request rejected', 'error');
                        refresh();
                    }}
                />
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => submitRef.current()}>
                        <Icon name="close" /> Reject Request
                    </button>
                </>
            ),
        });
    };

    /* ---- open-pay-teacher-payment / save-pay-teacher-payment ---- */
    const openMarkPaid = (id) => {
        const p = DB.teacherPayments.find((x) => x.id === id);

        if (!p) {
            return;
        }

        const submitRef = { current: () => {} };

        openModal({
            title: 'Disburse Payment',
            sub: `${p.voucher_no} — ${userName(p.teacher_id)} · ${batchName(p.batch_id)} · ${fmtMoney(p.amount)}`,
            body: (
                <DisburseForm
                    submitRef={submitRef}
                    onSubmit={({ method, txnRef }) => {
                        const paid = markTeacherPaymentPaid(id, { paidBy: userId, method, txnRef });
                        closeModal();

                        if (paid) {
                            toast('Payment disbursed & voucher generated');
                            refresh();
                            openVoucher(paid.id);
                        }
                    }}
                />
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => submitRef.current()}>
                        <Icon name="wallet" /> Confirm Disbursement
                    </button>
                </>
            ),
        });
    };

    const tabs = [
        { id: 'rates', label: 'Pay Rates & Earnings' },
        {
            id: 'requests',
            label: (
                <>
                    Payment Requests
                    {pendingCount + approvedCount > 0 ? (
                        <>
                            {' '}
                            <span className="badge badge-amber">{pendingCount + approvedCount}</span>
                        </>
                    ) : null}
                </>
            ),
        },
        { id: 'history', label: 'Payment History' },
    ];

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>{isTeacher ? 'My Batch Payments' : 'Teacher Payments'}</h1>
                    <p>
                        {isTeacher
                            ? 'Your pay rate, earnings & payment history for your assigned batches'
                            : 'Per-batch pay rates, payment requests, approvals & disbursement vouchers'}
                    </p>
                </div>
            </div>

            {isTeacher ? (
                <div className="badge badge-amber" style={{ whiteSpace: 'normal', marginBottom: 16 }}>
                    <Icon name="shield" /> Showing only your own assigned batches — read-only. Contact Admin/Accounts for payment queries.
                </div>
            ) : null}

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard
                    icon="graduationCap"
                    label={isTeacher ? 'Total Earned (My Batches)' : 'Total Earned (Computed)'}
                    value={fmtMoney(totalEarned)}
                    color="#8b5cf6"
                />
                <KpiCard icon="checkCircle" label="Total Paid" value={fmtMoney(totalPaid)} color="#10b981" />
                <KpiCard
                    icon="wallet"
                    label="Outstanding Payable"
                    value={fmtMoney(totalOutstanding)}
                    color={totalOutstanding > 0 ? '#ef4444' : '#10b981'}
                />
                <KpiCard icon="clock" label="Pending Approval" value={pendingCount} color="#f59e0b" />
            </div>

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            <div id="tpPane">
                {tab === 'requests' ? (
                    <RequestsPane onView={openVoucher} onApprove={approve} onReject={openReject} onPay={openMarkPaid} />
                ) : tab === 'history' ? (
                    <HistoryPane onView={openVoucher} />
                ) : (
                    <RatesPane onSetRate={openSetPayRate} onRaise={openRaisePayment} />
                )}
            </div>
        </AdminLayout>
    );
}
