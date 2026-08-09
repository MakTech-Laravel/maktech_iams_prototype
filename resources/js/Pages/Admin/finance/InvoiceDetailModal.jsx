/* Invoice detail modal — ported from invoiceDetailModal() in public/prototype/js/render-finance.js. */

import { DB, courseName, fmtDate, fmtMoney, studentById } from '../../../lib/db';
import { Icon, MethodBadge, StatusBadge } from '../../../lib/ui';

export function InvoiceDetailBody({ invoice, onViewReceipt }) {
    const inv = invoice;
    const payments = DB.payments.filter((p) => p.invoice_id === inv.id);
    const installments = DB.paymentInstallments.filter((x) => x.invoice_id === inv.id);

    return (
        <>
            <div className="flex-gap" style={{ marginBottom: 16 }}>
                <StatusBadge status={inv.status} />
                <span className="badge badge-gray">Due: {fmtDate(inv.due_date)}</span>
            </div>
            <div className="grid grid-3" style={{ marginBottom: 20 }}>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{fmtMoney(inv.total)}</div>
                    <div className="cell-sub">Total Fee</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success-700)' }}>{fmtMoney(inv.paid)}</div>
                    <div className="cell-sub">Paid</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: inv.due > 0 ? 'var(--danger-600)' : 'var(--gray-400)' }}>{fmtMoney(inv.due)}</div>
                    <div className="cell-sub">Due</div>
                </div>
            </div>

            {installments.length ? (
                <>
                    <h3 style={{ fontSize: 13, marginBottom: 8 }}>Installment Plan</h3>
                    <div className="table-wrap" style={{ marginBottom: 18 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {installments.map((x) => (
                                    <tr key={x.id}>
                                        <td>{x.no}</td>
                                        <td>{fmtMoney(x.amount)}</td>
                                        <td>{fmtDate(x.due_date)}</td>
                                        <td>
                                            <StatusBadge status={x.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}

            <h3 style={{ fontSize: 13, marginBottom: 8 }}>Payment History</h3>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Receipt</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Date</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((p) => (
                            <tr key={p.id}>
                                <td>{p.receipt_no}</td>
                                <td>{fmtMoney(p.amount)}</td>
                                <td>
                                    <MethodBadge method={p.method} />
                                </td>
                                <td>{fmtDate(p.date)}</td>
                                <td>
                                    <button type="button" className="btn btn-sm btn-ghost" title="View & print receipt" onClick={() => onViewReceipt(p.id)}>
                                        <Icon name="printer" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export function InvoiceDetailFoot({ invoice, onClose, onRecordPayment }) {
    const s = studentById(invoice.student_id);

    return (
        <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
            </button>
            <button type="button" className="btn btn-outline">
                <Icon name="printer" /> Print Invoice
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onRecordPayment(s.id)}>
                <Icon name="plus" /> Record Payment
            </button>
        </>
    );
}

export function invoiceDetailSub(invoice) {
    const s = studentById(invoice.student_id);

    return `${s.name} · ${courseName(s.courses[0]?.course_id)}`;
}
