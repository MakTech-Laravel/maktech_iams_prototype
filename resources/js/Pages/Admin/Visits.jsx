/* Institution Visits — ported from renderVisits() in public/prototype/js/render-marketing.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, fmtDate, institutionName, userName } from '../../lib/db';
import { Icon, KpiCard } from '../../lib/ui';
import { useCrmHost } from './crm/CrmHost';

export default function Visits({ view }) {
    const { host, actions } = useCrmHost();

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Institution Visits</h1>
                    <p>Polytechnic visit scheduling &amp; visit reports</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={actions.addVisit}>
                        <Icon name="plus" /> Log New Visit
                    </button>
                </div>
            </div>
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="institution" label="Visits This Month" value={DB.visits.length} color="#ff6533" />
                <KpiCard
                    icon="checkCircle"
                    label="MOUs Signed"
                    value={DB.institutions.filter((i) => i.mou_status === 'signed').length}
                    color="#10b981"
                />
                <KpiCard icon="clock" label="MOUs Pending" value={DB.institutions.filter((i) => i.mou_status === 'pending').length} color="#f59e0b" />
                <KpiCard
                    icon="building"
                    label="Institutes with No MOU"
                    value={DB.institutions.filter((i) => i.mou_status === 'none').length}
                    color="#ef4444"
                />
            </div>
            <div className="card">
                <div className="card-header">
                    <h3>Visit Log</h3>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Institution</th>
                                <th>Date</th>
                                <th>Visited By</th>
                                <th>Purpose</th>
                                <th>Outcome</th>
                                <th>Next Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB.visits.map((v) => (
                                <tr key={v.id}>
                                    <td className="cell-strong">{institutionName(v.institution_id)}</td>
                                    <td>{fmtDate(v.visit_date)}</td>
                                    <td>{userName(v.visited_by)}</td>
                                    <td style={{ maxWidth: 220, whiteSpace: 'normal' }}>{v.purpose}</td>
                                    <td style={{ maxWidth: 220, whiteSpace: 'normal' }}>{v.outcome}</td>
                                    <td>
                                        {v.next_action}
                                        <div className="cell-sub">by {fmtDate(v.next_action_date)}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {host}
        </AdminLayout>
    );
}
