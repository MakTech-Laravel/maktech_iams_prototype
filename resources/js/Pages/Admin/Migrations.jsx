/* Course Migration — ported from renderMigrations() in public/prototype/js/render-finance.js,
   plus the approve-migration / reject-migration cases in app.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, courseName, fmtMoney, studentName, sum } from '../../lib/db';
import { Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useFinanceModals } from './finance/useFinanceModals';

export default function Migrations({ view }) {
    const { openMigrationRequest, refresh, toast } = useFinanceModals();

    const approve = (id) => {
        const m = DB.courseMigrations.find((x) => x.id === id);

        if (m) {
            m.status = 'approved';
            m.approved_by = 2;
            toast('Migration approved');
            refresh();
        }
    };

    const reject = (id) => {
        const m = DB.courseMigrations.find((x) => x.id === id);

        if (m) {
            m.status = 'rejected';
            toast('Migration rejected', 'error');
            refresh();
        }
    };

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Course Migration</h1>
                    <p>Student course transfer requests with automatic fee recalculation</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => openMigrationRequest()}>
                        <Icon name="plus" /> New Migration Request
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="swap" label="Total Migrations" value={DB.courseMigrations.length} color="#ff6533" />
                <KpiCard icon="clock" label="Pending Approval" value={DB.courseMigrations.filter((m) => m.status === 'requested').length} color="#f59e0b" />
                <KpiCard icon="checkCircle" label="Approved" value={DB.courseMigrations.filter((m) => m.status === 'approved').length} color="#10b981" />
                <KpiCard
                    icon="payment"
                    label="Migration Fees Collected"
                    value={fmtMoney(
                        sum(
                            DB.courseMigrations.filter((m) => m.status === 'approved'),
                            (m) => m.migration_fee,
                        ),
                    )}
                    color="#8b5cf6"
                />
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Migration Requests</h3>
                    <p>Full auditable trail — old course, new course, fee adjustment, approver</p>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Course Change</th>
                                <th>Requested By</th>
                                <th>Old Paid</th>
                                <th>New Price</th>
                                <th>Migration Fee</th>
                                <th>Net Adj.</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.courseMigrations.map((m) => (
                                <tr key={m.id}>
                                    <td className="cell-strong">{studentName(m.student_id)}</td>
                                    <td>
                                        {courseName(m.from_course_id)} → {courseName(m.to_course_id)}
                                    </td>
                                    <td>{m.requested_by}</td>
                                    <td>{fmtMoney(m.old_paid)}</td>
                                    <td>{fmtMoney(m.new_price)}</td>
                                    <td>{fmtMoney(m.migration_fee)}</td>
                                    <td>{fmtMoney(m.net_adjustment)}</td>
                                    <td>
                                        <StatusBadge status={m.status} />
                                    </td>
                                    <td>
                                        {m.status === 'requested' ? (
                                            <div className="flex-gap">
                                                <button type="button" className="btn btn-sm btn-success" onClick={() => approve(m.id)}>
                                                    <Icon name="check" />
                                                </button>
                                                <button type="button" className="btn btn-sm btn-danger" onClick={() => reject(m.id)}>
                                                    <Icon name="close" />
                                                </button>
                                            </div>
                                        ) : (
                                            '—'
                                        )}
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
