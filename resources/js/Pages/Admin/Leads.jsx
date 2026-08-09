/* Leads — ported from renderLeads() in public/prototype/js/render-marketing.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, LEAD_STATUS_LABELS, SOURCE_LABELS, courseName, fmtDate, institutionName, userName } from '../../lib/db';
import { useIdentity } from '../../lib/identity';
import { Avatar, Icon, Pagination, StatusBadge } from '../../lib/ui';
import { useCrmHost } from './crm/CrmHost';

export default function Leads({ view }) {
    const { can } = useIdentity();
    const { host, actions } = useCrmHost();
    const canCreate = can('Leads/CRM', 'Create');

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Leads</h1>
                    <p>All captured leads across institutes, campaigns, referrals &amp; walk-ins ({DB.leads.length} total)</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="download" /> Export
                    </button>
                    {canCreate ? (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={actions.leadImport}>
                            <Icon name="upload" /> Import Leads
                        </button>
                    ) : null}
                    <button type="button" className="btn btn-primary btn-sm" onClick={actions.addLead}>
                        <Icon name="plus" /> Add Lead
                    </button>
                </div>
            </div>
            <div className="filter-bar">
                <div className="search-input-wrap">
                    <Icon name="search" />
                    <input type="text" placeholder="Search leads by name or phone…" />
                </div>
                <select>
                    <option>All Status</option>
                    {DB.leadPipeline.map((s) => (
                        <option key={s}>{LEAD_STATUS_LABELS[s]}</option>
                    ))}
                </select>
                <select>
                    <option>All Institutes</option>
                    {DB.institutions.map((i) => (
                        <option key={i.id}>{i.name}</option>
                    ))}
                </select>
                <select>
                    <option>All Sources</option>
                    {Object.values(SOURCE_LABELS).map((s) => (
                        <option key={s}>{s}</option>
                    ))}
                </select>
                <select>
                    <option>All Staff</option>
                    {DB.users
                        .filter((u) => u.role_id === 3)
                        .map((u) => (
                            <option key={u.id}>{u.name}</option>
                        ))}
                </select>
            </div>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th />
                                <th>Name</th>
                                <th>Institution</th>
                                <th>Interested Course</th>
                                <th>Source</th>
                                <th>Assigned To</th>
                                <th>Status</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB.leads.map((l) => (
                                <tr className="row-link" key={l.id} onClick={() => actions.viewLead(l.id)}>
                                    <td>
                                        <Avatar name={l.name} size="sm" />
                                    </td>
                                    <td>
                                        <span className="cell-strong">{l.name}</span>
                                        {l.imported ? (
                                            <>
                                                {' '}
                                                <span className="badge badge-gray" title="Added via bulk import">
                                                    <Icon name="upload" />
                                                </span>
                                            </>
                                        ) : null}
                                        <div className="cell-sub">{l.phone}</div>
                                    </td>
                                    <td>{institutionName(l.institution_id)}</td>
                                    <td>{courseName(l.interested_course_id)}</td>
                                    <td>
                                        <span className="badge badge-gray">{SOURCE_LABELS[l.source]}</span>
                                    </td>
                                    <td>{userName(l.assigned_to)}</td>
                                    <td>
                                        <StatusBadge status={l.status} label={LEAD_STATUS_LABELS[l.status]} />
                                    </td>
                                    <td>{fmtDate(l.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination total={DB.leads.length} shown={DB.leads.length} />
            </div>

            {host}
        </AdminLayout>
    );
}
