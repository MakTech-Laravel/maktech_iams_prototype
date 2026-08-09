/* Follow-ups — ported from renderFollowups()/followupPane()/followupTableHtml()/followupRow() in
   public/prototype/js/render-marketing.js, with the tab wiring from wireFollowupTabs() in app.js. */

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    DB,
    TODAY,
    courseName,
    fmtDate,
    followupsAllPending,
    followupsDone,
    followupsMissed,
    followupsToday,
    followupsUpcoming,
    isFollowupOverdue,
    studentName,
    userName,
} from '../../lib/db';
import { Icon, KpiCard, StatusBadge, Tabs } from '../../lib/ui';
import { useCrmHost } from './crm/CrmHost';

function FollowupRow({ followup: f, actions }) {
    const lead = f.lead_id ? DB.leads.find((l) => l.id === f.lead_id) : null;
    const overdue = isFollowupOverdue(f);

    return (
        <tr className={lead ? 'row-link' : ''} onClick={lead ? () => actions.viewLead(lead.id) : undefined}>
            <td className="cell-strong">{lead ? lead.name : studentName(f.student_id)}</td>
            <td>{lead ? courseName(lead.interested_course_id) : '—'}</td>
            <td>
                {fmtDate(f.due_date)} <span className="cell-sub">{f.due_date.split(' ')[1] || ''}</span>
            </td>
            <td>{userName(f.assigned_to)}</td>
            <td style={{ maxWidth: 240, whiteSpace: 'normal' }}>{f.notes}</td>
            <td>{overdue ? <StatusBadge status="overdue" label="Overdue" /> : <StatusBadge status={f.status} />}</td>
            <td>
                {f.status === 'pending' ? (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={(event) => {
                            event.stopPropagation();
                            actions.completeFollowup(f.id);
                        }}
                    >
                        <Icon name="check" /> Mark Done
                    </button>
                ) : f.completed_date ? (
                    <span className="cell-sub">on {fmtDate(f.completed_date)}</span>
                ) : (
                    '—'
                )}
            </td>
        </tr>
    );
}

function FollowupTable({ list, emptyMsg, actions }) {
    if (!list.length) {
        return (
            <div className="empty-state">
                <Icon name="checkCircle" />
                <p>{emptyMsg || 'Nothing here.'}</p>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Lead/Student</th>
                            <th>Interested In</th>
                            <th>Due</th>
                            <th>Assigned To</th>
                            <th>Notes</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((f) => (
                            <FollowupRow key={f.id} followup={f} actions={actions} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FollowupPane({ tab, actions }) {
    if (tab === 'today') {
        const list = followupsToday();

        return (
            <>
                <div className="grid grid-3" style={{ marginBottom: 18 }}>
                    <KpiCard icon="calendar" label="Due Today" value={list.length} color="#f59e0b" />
                    <KpiCard icon="alertCircle" label="Missed (Overdue)" value={followupsMissed().length} color="#ef4444" />
                    <KpiCard
                        icon="checkCircle"
                        label="Completed Today"
                        value={DB.followUps.filter((f) => f.status === 'done' && f.completed_date === TODAY).length}
                        color="#10b981"
                    />
                </div>
                <FollowupTable list={list} emptyMsg="No follow-ups due today — you're all caught up!" actions={actions} />
            </>
        );
    }

    if (tab === 'upcoming') {
        return <FollowupTable list={followupsUpcoming(7)} emptyMsg="Nothing scheduled in the next 7 days." actions={actions} />;
    }

    if (tab === 'pending') {
        return (
            <FollowupTable
                list={followupsAllPending().sort((a, b) => (a.due_date < b.due_date ? -1 : 1))}
                emptyMsg="No pending follow-ups anywhere."
                actions={actions}
            />
        );
    }

    if (tab === 'missed') {
        return <FollowupTable list={followupsMissed()} emptyMsg="Nothing overdue — great job staying on top of follow-ups!" actions={actions} />;
    }

    if (tab === 'done') {
        return <FollowupTable list={followupsDone().slice().reverse()} emptyMsg="No follow-ups completed yet." actions={actions} />;
    }

    return null;
}

export default function Followups({ view }) {
    const { host, actions } = useCrmHost();
    const [tab, setTab] = useState('today');
    const missedCount = followupsMissed().length;

    const tabs = [
        {
            id: 'today',
            label: (
                <>
                    Today's Follow-up{' '}
                    <span className="badge badge-amber" style={{ marginLeft: 4 }}>
                        {followupsToday().length}
                    </span>
                </>
            ),
        },
        { id: 'upcoming', label: 'Upcoming (7d)' },
        { id: 'pending', label: 'All Pending' },
        {
            id: 'missed',
            label: missedCount ? (
                <>
                    Missed{' '}
                    <span className="badge badge-red" style={{ marginLeft: 4 }}>
                        {missedCount}
                    </span>
                </>
            ) : (
                'Missed '
            ),
        },
        { id: 'done', label: 'Done' },
    ];

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Follow-ups</h1>
                    <p>Today's due follow-ups, upcoming reminders, and full history — calls, SMS, emails, in-person visits</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={actions.addFollowupGeneric}>
                        <Icon name="plus" /> Schedule Follow-up
                    </button>
                </div>
            </div>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
            <div id="followupPane">
                <FollowupPane tab={tab} actions={actions} />
            </div>

            {host}
        </AdminLayout>
    );
}
