/* My Payments — ported from renderTpPayments() and the 'tp-view-voucher' action in
   public/prototype/js/teacherportal.js. */

import {
    PAY_RATE_TYPE_LABELS,
    TEACHER_PAY_TYPE_LABELS,
    batchName,
    computeEarnedForTeacherBatch,
    courseName,
    fmtMoney,
    payRateFor,
    teacherPaymentsForTeacher,
    totalPaidToTeacherForBatch,
} from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { TeacherPaymentVoucher, VOUCHER_STATUS_TEXT, printTeacherPaymentVoucher } from './TeacherPaymentVoucher';

export default function PaymentsScreen({ teacher, batches }) {
    const { openModal, closeModal, toast } = useUi();
    const myPayments = teacherPaymentsForTeacher(teacher.id).slice().reverse();

    const viewVoucher = (payment) =>
        openModal({
            size: 'lg',
            title: 'Teacher Payment Voucher',
            sub: `${payment.voucher_no} — ${VOUCHER_STATUS_TEXT[payment.status] || payment.status}`,
            body: <TeacherPaymentVoucher paymentId={payment.id} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => printTeacherPaymentVoucher(payment.id, toast)}>
                        <Icon name="printer" /> Print Voucher
                    </button>
                </>
            ),
        });

    return (
        <>
            <h3 className="report-section-title" style={{ marginTop: 0 }}>
                Pay Rate &amp; Earnings by Batch
            </h3>
            <div className="card" style={{ marginBottom: 26 }}>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Batch</th>
                                <th>Course</th>
                                <th>Pay Rate</th>
                                <th>Earned</th>
                                <th>Paid</th>
                                <th>Outstanding</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.length ? (
                                batches.map((b) => {
                                    const rate = payRateFor(teacher.id, b.id);
                                    const earned = computeEarnedForTeacherBatch(teacher.id, b.id);
                                    const paid = totalPaidToTeacherForBatch(teacher.id, b.id);
                                    const outstanding = Math.max(0, earned - paid);

                                    return (
                                        <tr key={b.id}>
                                            <td className="cell-strong">{b.name}</td>
                                            <td>{courseName(b.course_id)}</td>
                                            <td>
                                                {rate ? (
                                                    `${PAY_RATE_TYPE_LABELS[rate.rate_type]} · ${fmtMoney(rate.rate_amount)}`
                                                ) : (
                                                    <span className="muted">No rate set yet</span>
                                                )}
                                            </td>
                                            <td>{fmtMoney(earned)}</td>
                                            <td style={{ color: 'var(--success-700)' }}>{fmtMoney(paid)}</td>
                                            <td style={{ color: outstanding > 0 ? 'var(--danger-600)' : 'var(--gray-400)' }}>{fmtMoney(outstanding)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 16 }}>
                                        No batches assigned.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <h3 className="report-section-title">Payment / Voucher History</h3>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Voucher</th>
                                <th>Batch</th>
                                <th>Type</th>
                                <th>Period</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {myPayments.length ? (
                                myPayments.map((p) => (
                                    <tr key={p.id}>
                                        <td className="cell-strong">{p.voucher_no}</td>
                                        <td>{batchName(p.batch_id)}</td>
                                        <td>{TEACHER_PAY_TYPE_LABELS[p.type]}</td>
                                        <td>{p.period_label}</td>
                                        <td>{fmtMoney(p.amount)}</td>
                                        <td>
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td>
                                            {p.status === 'paid' ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost"
                                                    title="View & print voucher"
                                                    onClick={() => viewVoucher(p)}
                                                >
                                                    <Icon name="printer" />
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 16 }}>
                                        No payment requests yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
