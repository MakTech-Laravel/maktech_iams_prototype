/* Refunds — ported from renderRefunds() in public/prototype/js/render-finance.js,
   plus the approve-refund case in app.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, fmtDate, fmtMoney, studentName, sum, userName } from '../../lib/db';
import { Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useFinanceModals } from './finance/useFinanceModals';

export default function Refunds({ view }) {
    const { openAddRefund, refresh, toast } = useFinanceModals();

    const approve = (id) => {
        const r = DB.refunds.find((x) => x.id === id);

        if (r) {
            r.status = 'approved';
            r.approved_by = 2;
            toast('Refund approved');
            refresh();
        }
    };

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Refunds</h1>
                    <p>Refund requests with approval workflow and reason logging</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={openAddRefund}>
                        <Icon name="plus" /> New Refund Request
                    </button>
                </div>
            </div>

            <div className="grid grid-3" style={{ marginBottom: 20 }}>
                <KpiCard
                    icon="wallet"
                    label="Total Refunds Processed"
                    value={fmtMoney(
                        sum(
                            DB.refunds.filter((r) => r.status === 'approved'),
                            (r) => r.amount,
                        ),
                    )}
                    color="#8b5cf6"
                />
                <KpiCard icon="clock" label="Pending Approval" value={DB.refunds.filter((r) => r.status === 'requested').length} color="#f59e0b" />
                <KpiCard icon="checkCircle" label="Approved This Month" value={DB.refunds.filter((r) => r.status === 'approved').length} color="#10b981" />
            </div>

            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Original Receipt</th>
                                <th>Refund Amount</th>
                                <th>Reason</th>
                                <th>Approved By</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.refunds.map((r) => {
                                const p = DB.payments.find((x) => x.id === r.payment_id);

                                return (
                                    <tr key={r.id}>
                                        <td className="cell-strong">{studentName(p.student_id)}</td>
                                        <td>{p.receipt_no}</td>
                                        <td>{fmtMoney(r.amount)}</td>
                                        <td style={{ maxWidth: 240, whiteSpace: 'normal' }}>{r.reason}</td>
                                        <td>{r.approved_by ? userName(r.approved_by) : '—'}</td>
                                        <td>{fmtDate(r.date)}</td>
                                        <td>
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td>
                                            {r.status === 'requested' ? (
                                                <button type="button" className="btn btn-sm btn-success" onClick={() => approve(r.id)}>
                                                    <Icon name="check" /> Approve
                                                </button>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
