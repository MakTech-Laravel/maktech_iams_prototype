/* Invoices & Payments — ported from renderInvoices() in public/prototype/js/render-finance.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, KPI, allowedInvoiceStatuses, courseName, fmtDate, fmtMoney, studentName, sum, userName, visibleInvoicesForUser } from '../../lib/db';
import { useIdentity } from '../../lib/identity';
import { Icon, KpiCard, MethodBadge, StatusBadge } from '../../lib/ui';
import { useFinanceModals } from './finance/useFinanceModals';

export default function Invoices({ view }) {
    const { userId, can } = useIdentity();
    const { openInvoiceDetail, openRecordPayment, openChangeInvoiceStatus, openPaymentReceipt } = useFinanceModals();

    const visibleInvoices = visibleInvoicesForUser(userId, DB.feeInvoices);
    const hiddenByListPerm = DB.feeInvoices.length - visibleInvoices.length;
    const canChangeStatus = can('Payments', 'ChangeStatus');

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Invoices &amp; Payments</h1>
                    <p>Fee invoices, physical &amp; online transactions, receipts</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="printer" /> Invoice Register
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => openRecordPayment()}>
                        <Icon name="plus" /> Record Payment
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard
                    icon="payment"
                    label="Total Collected"
                    value={fmtMoney(
                        sum(
                            DB.payments.filter((p) => p.status === 'success'),
                            (p) => p.amount,
                        ),
                    )}
                    color="#10b981"
                />
                <KpiCard icon="wallet" label="Total Due" value={fmtMoney(KPI.totalDue())} color="#f59e0b" />
                <KpiCard icon="file" label="Invoices Issued" value={DB.feeInvoices.length} color="#ff6533" />
                <KpiCard icon="alertCircle" label="Overdue Invoices" value={DB.feeInvoices.filter((i) => i.status === 'overdue').length} color="#ef4444" />
            </div>

            <h3 className="report-section-title">Fee Invoices</h3>
            {hiddenByListPerm > 0 ? (
                <div className="badge badge-gray" style={{ whiteSpace: 'normal', textAlign: 'left', marginBottom: 14 }}>
                    <Icon name="lock" /> {hiddenByListPerm} invoice(s) hidden — you don't have permission to view one or more status lists
                    (Paid/Partial/Due/Overdue). Ask Admin to grant access via Access Control.
                </div>
            ) : null}
            <div className="filter-bar">
                <div className="search-input-wrap">
                    <Icon name="search" />
                    <input type="text" placeholder="Search invoice or student…" />
                </div>
                <select>
                    <option>All Status</option>
                    {allowedInvoiceStatuses(userId).map((s) => (
                        <option key={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </div>
            <div className="card" style={{ marginBottom: 26 }}>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Student</th>
                                <th>Course</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Due</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {visibleInvoices.map((i) => (
                                <tr className="row-link" key={i.id} onClick={() => openInvoiceDetail(i.id)}>
                                    <td className="cell-strong">{i.invoice_no}</td>
                                    <td>{studentName(i.student_id)}</td>
                                    <td>{courseName(DB.students.find((s) => s.id === i.student_id)?.courses[0]?.course_id)}</td>
                                    <td>{fmtMoney(i.total)}</td>
                                    <td style={{ color: 'var(--success-700)' }}>{fmtMoney(i.paid)}</td>
                                    <td style={{ color: i.due > 0 ? 'var(--danger-600)' : 'var(--gray-400)' }}>{fmtMoney(i.due)}</td>
                                    <td>{fmtDate(i.due_date)}</td>
                                    <td>
                                        <StatusBadge status={i.status} />
                                    </td>
                                    <td>
                                        {canChangeStatus ? (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost"
                                                title="Change status"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    openChangeInvoiceStatus(i.id);
                                                }}
                                            >
                                                <Icon name="swap" />
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <h3 className="report-section-title">Transaction Log</h3>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Receipt</th>
                                <th>Student</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Channel</th>
                                <th>Collected By / Txn ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.payments
                                .slice()
                                .reverse()
                                .map((p) => (
                                    <tr key={p.id}>
                                        <td className="cell-strong">{p.receipt_no}</td>
                                        <td>{studentName(p.student_id)}</td>
                                        <td>{fmtMoney(p.amount)}</td>
                                        <td>
                                            <MethodBadge method={p.method} />
                                        </td>
                                        <td>
                                            <StatusBadge
                                                status={p.channel === 'physical' ? 'active' : 'in_progress'}
                                                label={p.channel === 'physical' ? 'Physical' : 'Online'}
                                            />
                                        </td>
                                        <td>{p.collected_by ? userName(p.collected_by) : p.gateway_txn_id || '—'}</td>
                                        <td>{fmtDate(p.date)}</td>
                                        <td>
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost"
                                                title="View & print receipt"
                                                onClick={() => openPaymentReceipt(p.id)}
                                            >
                                                <Icon name="printer" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}