/* Audit Log — ported from renderAudit() in public/prototype/js/render-admin.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, fmtDate, userName } from '../../lib/db';
import { Avatar, Icon, StatusBadge } from '../../lib/ui';

export default function Audit({ view }) {
    const rows = DB.auditLogs.slice().reverse();

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Audit Log</h1>
                    <p>Who changed what, when — critical for financial data integrity</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="download" /> Export Log
                    </button>
                </div>
            </div>
            <div className="filter-bar">
                <select>
                    <option>All Modules</option>
                    {[...new Set(DB.auditLogs.map((a) => a.module))].map((m) => (
                        <option key={m}>{m}</option>
                    ))}
                </select>
                <select>
                    <option>All Users</option>
                    {DB.users.map((u) => (
                        <option key={u.id}>{u.name}</option>
                    ))}
                </select>
                <input type="date" />
                <span className="muted">to</span>
                <input type="date" />
            </div>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th />
                                <th>User</th>
                                <th>Module</th>
                                <th>Action</th>
                                <th>Record</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((a) => (
                                <tr key={a.id}>
                                    <td>
                                        <Avatar name={userName(a.user_id)} size="sm" />
                                    </td>
                                    <td className="cell-strong">{userName(a.user_id)}</td>
                                    <td>
                                        <span className="badge badge-purple">{a.module}</span>
                                    </td>
                                    <td>
                                        <StatusBadge
                                            status={a.action === 'approve' ? 'approved' : a.action === 'delete' ? 'rejected' : 'active'}
                                            label={a.action}
                                        />
                                    </td>
                                    <td>{a.record}</td>
                                    <td>
                                        {fmtDate(a.date)} <span className="cell-sub">{a.date.split(' ')[1]}</span>
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
