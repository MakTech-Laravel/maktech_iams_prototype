/* Every finance modal opener in one place — the React equivalent of the finance branch of the
   global click-delegation switch in public/prototype/js/app.js. Each function reproduces the DB
   mutation, toast strings, modal chaining and refreshCurrentView() call of its `data-action` case. */

import {
    DB,
    applyDiscountToInvoice,
    cashCustodians,
    changeInvoiceStatus,
    confirmCashHandover,
    createCashHandover,
    generateReceiptNo,
    invoiceForStudent,
    recordPayment,
    studentById,
} from '../../../lib/db';
import { useRefresh } from '../../../lib/hooks';
import { useIdentity } from '../../../lib/identity';
import { CashHandoverReceipt, PaymentReceipt, printCashHandoverReceipt, printPaymentReceipt } from '../../../lib/Receipt';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { AddExpenseBody } from './AddExpenseModal';
import { AddRefundBody } from './AddRefundModal';
import { ApplyDiscountBody, applyDiscountSub } from './ApplyDiscountModal';
import { CashAttachmentBody } from './CashAttachment';
import { CashHandoverBody, cashHandoverSub, cashHandoverTarget } from './CashHandoverModal';
import { ChangeInvoiceStatusBody, changeInvoiceStatusSub } from './ChangeInvoiceStatusModal';
import { ConfirmHandoverBody, confirmHandoverSub } from './ConfirmHandoverModal';
import { InvoiceDetailBody, InvoiceDetailFoot, invoiceDetailSub } from './InvoiceDetailModal';
import { MigrationRequestBody, migrationRequestSub } from './MigrationRequestModal';
import { RecordPaymentBody, recordPaymentSub, recordPaymentTarget } from './RecordPaymentModal';

/**
 * `onRefresh` is for callers that are themselves nested inside another screen — the student profile
 * drawer, say. The prototype's refreshCurrentView() re-rendered the whole page, so a payment
 * recorded from the drawer also updated the Students table underneath it; a bare useRefresh() here
 * would only re-render the drawer. Pass the host page's refresh to restore that.
 */
export function useFinanceModals(onRefresh) {
    const { openModal, closeModal, toast } = useUi();
    const { user, userId, can } = useIdentity();
    const localRefresh = useRefresh();

    const refresh = () => {
        localRefresh();
        onRefresh?.();
    };

    const cancelButton = (
        <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cancel
        </button>
    );

    /* ---- receipts (view-receipt / view-cash-receipt) ---- */
    function openPaymentReceipt(paymentId) {
        openModal({
            size: 'lg',
            title: 'Payment Receipt',
            sub: 'Review, then print or hand a physical copy to the student',
            body: <PaymentReceipt paymentId={paymentId} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => printPaymentReceipt(paymentId, toast)}>
                        <Icon name="printer" /> Print Receipt
                    </button>
                </>
            ),
        });
    }

    function openCashHandoverReceipt(handoverId) {
        const h = DB.cashHandovers.find((x) => x.id === Number(handoverId));

        if (!h) {
            return;
        }

        openModal({
            size: 'lg',
            title: h.type === 'bank_deposit' ? 'Bank Deposit Receipt' : 'Cash Handover Receipt',
            sub: h.status === 'confirmed' ? 'Confirmed & signed' : 'Awaiting recipient signature',
            body: <CashHandoverReceipt handoverId={h.id} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => printCashHandoverReceipt(h.id, toast)}>
                        <Icon name="printer" /> Print Receipt
                    </button>
                </>
            ),
        });
    }

    /* ---- invoices & payments ---- */
    function openInvoiceDetail(invoiceId) {
        const inv = DB.feeInvoices.find((x) => x.id === invoiceId);

        if (!inv) {
            return;
        }

        openModal({
            size: 'lg',
            title: inv.invoice_no,
            sub: invoiceDetailSub(inv),
            body: <InvoiceDetailBody invoice={inv} onViewReceipt={openPaymentReceipt} />,
            foot: <InvoiceDetailFoot invoice={inv} onClose={closeModal} onRecordPayment={openRecordPayment} />,
        });
    }

    function savePayment(draft) {
        const sid = Number(draft.studentId);
        const amount = Number(draft.amount) || 0;
        const method = (draft.method || 'Cash').toLowerCase();
        const channel = draft.channel || 'physical';
        const inv = invoiceForStudent(sid);

        closeModal();

        if (inv && amount > 0) {
            const payment = recordPayment(sid, inv.id, amount, method, channel, userId);
            toast('Payment recorded & receipt generated');
            refresh();
            openPaymentReceipt(payment.id);
        } else {
            toast('Could not record payment — check the amount', 'error');
            refresh();
        }
    }

    function openRecordPayment(studentId) {
        const { student, invoice } = recordPaymentTarget(studentId);
        const draft = { studentId: student?.id ?? '', amount: invoice?.due || 0, method: 'Cash', channel: 'physical' };

        closeModal();
        openModal({
            title: 'Record Payment',
            sub: recordPaymentSub(student, invoice),
            body: (
                <RecordPaymentBody
                    draft={draft}
                    invoice={invoice}
                    receiptNo={generateReceiptNo()}
                    canDiscount={can('Payments', 'Approve')}
                    onApplyDiscount={(id) => {
                        closeModal();
                        openApplyDiscount(id);
                    }}
                />
            ),
            foot: (
                <>
                    {cancelButton}
                    <button type="button" className="btn btn-primary" onClick={() => savePayment(draft)}>
                        <Icon name="check" /> Record &amp; Generate Receipt
                    </button>
                </>
            ),
        });
    }

    function saveDiscount(invoiceId, draft) {
        const amt = Number(draft.amount) || 0;
        const reason = draft.reason || 'Discount approved';

        closeModal();

        if (amt > 0) {
            applyDiscountToInvoice(invoiceId, amt, reason, userId);
            toast('Discount applied to invoice');
        } else {
            toast('Enter a valid discount amount', 'error');
        }

        refresh();
    }

    function openApplyDiscount(invoiceId) {
        const inv = DB.feeInvoices.find((i) => i.id === Number(invoiceId));

        if (!inv) {
            return;
        }

        const draft = { amount: '', reason: '' };

        openModal({
            title: 'Apply Discount',
            sub: applyDiscountSub(inv),
            body: <ApplyDiscountBody draft={draft} invoice={inv} />,
            foot: (
                <>
                    {cancelButton}
                    <button type="button" className="btn btn-primary" onClick={() => saveDiscount(inv.id, draft)}>
                        <Icon name="check" /> Apply Discount
                    </button>
                </>
            ),
        });
    }

    function saveChangeInvoiceStatus(invoiceId, draft) {
        if (!can('Payments', 'ChangeStatus')) {
            toast("You don't have permission to change payment status", 'error');

            return;
        }

        const reason = (draft.reason || '').trim();

        if (!reason) {
            toast('Please provide a reason for this manual status change', 'error');

            return;
        }

        changeInvoiceStatus(invoiceId, draft.status, reason, userId);
        closeModal();
        toast('Invoice status updated');
        refresh();
    }

    function openChangeInvoiceStatus(invoiceId) {
        if (!can('Payments', 'ChangeStatus')) {
            toast("You don't have permission to change payment status", 'error');

            return;
        }

        const inv = DB.feeInvoices.find((x) => x.id === invoiceId);

        if (!inv) {
            return;
        }

        const draft = { status: inv.status, reason: '' };

        openModal({
            title: 'Change Invoice Status',
            sub: changeInvoiceStatusSub(inv),
            body: <ChangeInvoiceStatusBody draft={draft} />,
            foot: (
                <>
                    {cancelButton}
                    <button type="button" className="btn btn-primary" onClick={() => saveChangeInvoiceStatus(inv.id, draft)}>
                        <Icon name="check" /> Update Status
                    </button>
                </>
            ),
        });
    }

    function sendReminder() {
        toast('Due payment reminder sent via SMS & Email');
    }

    /* ---- cash management ---- */
    function saveCashHandover(type, ids, draft) {
        if (!ids.length) {
            toast('No cash receipts available to bundle', 'error');

            return;
        }

        let entry;

        if (type === 'bank_deposit') {
            const bankName = (draft.bankName || '').trim();
            const slipNo = (draft.slipNo || '').trim();

            if (!bankName || !slipNo) {
                toast('Bank name and deposit slip number are required', 'error');

                return;
            }

            entry = createCashHandover({
                type,
                paymentIds: ids,
                createdBy: userId,
                bankName,
                accountNo: (draft.accountNo || '').trim(),
                branch: (draft.branch || '').trim(),
                slipNo,
                notes: (draft.notes || '').trim(),
                attachment: draft.attachment,
            });
            toast('Bank deposit recorded');
        } else {
            const handedTo = Number(draft.handedTo);

            if (!handedTo) {
                toast('Select who is receiving the cash', 'error');

                return;
            }

            entry = createCashHandover({
                type,
                paymentIds: ids,
                createdBy: userId,
                handedTo,
                notes: (draft.notes || '').trim(),
                attachment: draft.attachment,
            });
            toast('Handover saved — awaiting recipient signature');
        }

        draft.attachment = null;
        closeModal();
        refresh();
        openCashHandoverReceipt(entry.id);
    }

    function openCashHandover(type, selectedIds) {
        const { ids, payments, total } = cashHandoverTarget(selectedIds);
        const isBank = type === 'bank_deposit';
        const firstCustodian = cashCustodians().filter((u) => u.id !== userId)[0];
        const draft = {
            bankName: 'Dutch-Bangla Bank Ltd.',
            branch: 'Dhanmondi Branch',
            accountNo: '1051-2200-9911',
            slipNo: '',
            handedTo: firstCustodian ? firstCustodian.id : '',
            notes: '',
            attachment: null,
        };

        openModal({
            size: 'lg',
            title: isBank ? 'New Bank Deposit' : 'Handover Cash to Boss / Finance Director',
            sub: cashHandoverSub(payments, total),
            body: <CashHandoverBody draft={draft} type={type} payments={payments} total={total} currentUserId={userId} onError={toast} />,
            foot: (
                <>
                    {cancelButton}
                    <button type="button" className="btn btn-primary" disabled={!payments.length} onClick={() => saveCashHandover(type, ids, draft)}>
                        <Icon name="check" /> {isBank ? 'Record Deposit' : 'Save Handover'}
                    </button>
                </>
            ),
        });
    }

    function saveConfirmCashHandover(handoverId, draft) {
        const sig = (draft.signature || '').trim();

        if (!sig) {
            toast('Please type your full name to sign', 'error');

            return;
        }

        confirmCashHandover(handoverId, userId, sig);
        closeModal();
        toast('Handover confirmed & signed');
        refresh();
        openCashHandoverReceipt(handoverId);
    }

    function openConfirmCashHandover(handoverId) {
        const h = DB.cashHandovers.find((x) => x.id === handoverId);

        if (!h) {
            return;
        }

        const draft = { signature: user.name };

        openModal({
            title: 'Confirm Cash Receipt',
            sub: confirmHandoverSub(h),
            body: <ConfirmHandoverBody draft={draft} handover={h} />,
            foot: (
                <>
                    {cancelButton}
                    <button type="button" className="btn btn-primary" onClick={() => saveConfirmCashHandover(h.id, draft)}>
                        <Icon name="check" /> Sign &amp; Confirm Receipt
                    </button>
                </>
            ),
        });
    }

    function openCashAttachment(handoverId) {
        const h = DB.cashHandovers.find((x) => x.id === handoverId);

        if (!h || !h.attachment) {
            return;
        }

        openModal({
            title: 'Attached Document',
            sub: `${h.receipt_no} · ${h.attachment.name}`,
            body: <CashAttachmentBody attachment={h.attachment} />,
            foot: (
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Close
                </button>
            ),
        });
    }

    /* ---- course migration ---- */
    function openMigrationRequest(studentId) {
        const s = studentId ? studentById(Number(studentId)) : DB.students[4];
        const currentCourse = DB.courses.find((c) => c.id === s.courses[0]?.course_id);

        openModal({
            size: 'lg',
            title: 'Course Migration Request',
            sub: migrationRequestSub(s, currentCourse),
            body: <MigrationRequestBody student={s} currentCourse={currentCourse} />,
            foot: (
                <>
                    {cancelButton}
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            closeModal();
                            toast('Migration request submitted for approval');
                            refresh();
                        }}
                    >
                        <Icon name="send" /> Submit for Approval
                    </button>
                </>
            ),
        });
    }

    /* ---- refunds ---- */
    function openAddRefund() {
        openModal({
            title: 'New Refund Request',
            sub: 'Refund with approval workflow',
            body: <AddRefundBody />,
            foot: (
                <>
                    {cancelButton}
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            closeModal();
                            toast('Refund request submitted');
                            refresh();
                        }}
                    >
                        <Icon name="send" /> Submit Request
                    </button>
                </>
            ),
        });
    }

    /* ---- expenses ---- */
    function openAddExpense() {
        openModal({
            title: 'Add Expense',
            sub: 'Log event, tour, facility or operational cost',
            body: <AddExpenseBody />,
            foot: (
                <>
                    {cancelButton}
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            closeModal();
                            toast('Expense logged, pending approval');
                            refresh();
                        }}
                    >
                        <Icon name="check" /> Save Expense
                    </button>
                </>
            ),
        });
    }

    return {
        refresh,
        toast,
        openPaymentReceipt,
        openCashHandoverReceipt,
        openInvoiceDetail,
        openRecordPayment,
        openApplyDiscount,
        openChangeInvoiceStatus,
        sendReminder,
        openCashHandover,
        openConfirmCashHandover,
        openCashAttachment,
        openMigrationRequest,
        openAddRefund,
        openAddExpense,
    };
}
