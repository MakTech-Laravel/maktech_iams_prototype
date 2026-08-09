/* Lead Pipeline (Kanban) — ported from renderPipeline() in public/prototype/js/render-marketing.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, LEAD_STATUS_LABELS, courseName, institutionName, userName } from '../../lib/db';
import { Avatar, HBarList, Icon } from '../../lib/ui';
import { useCrmHost } from './crm/CrmHost';

export default function Pipeline({ view }) {
    const { host, actions } = useCrmHost();

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Lead Pipeline</h1>
                    <p>Drag-and-drop style funnel view — New → Contacted → Interested → Visited → Negotiation → Admitted / Lost</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={actions.addLead}>
                        <Icon name="plus" /> Add Lead
                    </button>
                </div>
            </div>
            <div className="kanban">
                {DB.leadPipeline.map((stage) => {
                    const items = DB.leads.filter((l) => l.status === stage);

                    return (
                        <div className="kanban-col" key={stage}>
                            <div className="kanban-col-head">
                                <b>{LEAD_STATUS_LABELS[stage]}</b>
                                <span className="badge badge-gray">{items.length}</span>
                            </div>
                            {items.length ? (
                                items.map((l) => (
                                    <div className="kanban-card" key={l.id} onClick={() => actions.viewLead(l.id)}>
                                        <b>{l.name}</b>
                                        <div className="cell-sub">{institutionName(l.institution_id)}</div>
                                        <div className="meta">
                                            <Icon name="course" /> {courseName(l.interested_course_id)}
                                        </div>
                                        <div className="meta">
                                            <Avatar name={userName(l.assigned_to)} size="sm" /> {userName(l.assigned_to)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="muted" style={{ fontSize: 12, padding: '10px 2px' }}>
                                    No leads
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="card mt-16">
                <div className="card-header">
                    <h3>Lost-Lead Reason Analysis</h3>
                </div>
                <div className="card-pad">
                    <HBarList
                        data={[
                            {
                                label: 'Financial constraints',
                                value: DB.leads.filter((l) => l.status === 'lost' && l.lost_reason?.includes('Financial')).length || 1,
                                color: '#ef4444',
                            },
                            {
                                label: 'Chose competitor institute',
                                value: DB.leads.filter((l) => l.status === 'lost' && l.lost_reason?.includes('competitor')).length || 1,
                                color: '#f97316',
                            },
                            { label: 'Not interested anymore', value: 0, color: '#f59e0b' },
                            { label: 'Location/distance issue', value: 0, color: '#94a3b8' },
                        ]}
                    />
                </div>
            </div>

            {host}
        </AdminLayout>
    );
}
