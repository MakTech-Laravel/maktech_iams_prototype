/* Online Sessions — ported from renderOnlineSessions()/onlineSessionCard() in
   public/prototype/js/render-marketing.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import {
    DB,
    ONLINE_SESSION_PLATFORM_LABELS,
    fmtDate,
    institutionName,
    pastOnlineSessions,
    sum,
    upcomingOnlineSessions,
    userName,
} from '../../lib/db';
import { Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useCrmHost } from './crm/CrmHost';

function OnlineSessionCard({ session: s, isPast, actions }) {
    const platform = ONLINE_SESSION_PLATFORM_LABELS[s.platform] || s.platform;

    return (
        <div className="card card-pad" style={{ marginBottom: 12 }}>
            <div className="flex-between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <b style={{ fontSize: '13.5px' }}>{s.title}</b>
                <StatusBadge status={s.status} />
            </div>
            <div className="flex-gap" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="badge badge-gray">
                    <Icon name="calendar" /> {fmtDate(s.date)} · {s.time}
                </span>
                <span className="badge badge-purple">{platform}</span>
                <span className="badge badge-blue">{s.institution_id ? institutionName(s.institution_id) : 'Open to All Institutes'}</span>
                <span className="badge badge-gray">Host: {userName(s.host_id)}</span>
            </div>
            {isPast ? (
                <>
                    <div className="grid grid-3" style={{ marginBottom: 10 }}>
                        <div className="card card-pad" style={{ textAlign: 'center', padding: 10 }}>
                            <div style={{ fontSize: 16, fontWeight: 800 }}>{s.registered_count}</div>
                            <div className="cell-sub">Registered</div>
                        </div>
                        <div className="card card-pad" style={{ textAlign: 'center', padding: 10 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success-700)' }}>{s.attended_count}</div>
                            <div className="cell-sub">Attended</div>
                        </div>
                        <div className="card card-pad" style={{ textAlign: 'center', padding: 10 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-600)' }}>{s.leads_generated}</div>
                            <div className="cell-sub">Leads Generated</div>
                        </div>
                    </div>
                    {s.notes ? (
                        <p className="cell-sub" style={{ marginBottom: 8 }}>
                            {s.notes}
                        </p>
                    ) : null}
                </>
            ) : (
                <div className="flex-gap" style={{ marginBottom: 10 }}>
                    <span className="cell-sub">
                        {s.registered_count} registered so far · {s.duration_mins} mins
                    </span>
                </div>
            )}
            <div className="flex-gap">
                {s.meeting_link ? (
                    <a className="btn btn-sm btn-outline" href={s.meeting_link} target="_blank" rel="noopener">
                        <Icon name="send" /> Meeting Link
                    </a>
                ) : null}
                {s.status === 'scheduled' ? (
                    <>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => actions.completeOnlineSession(s.id)}>
                            <Icon name="checkCircle" /> Mark Completed
                        </button>
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => actions.cancelOnlineSession(s.id)}>
                            <Icon name="close" /> Cancel
                        </button>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function OnlineSessions({ view }) {
    const { host, actions } = useCrmHost();
    const upcoming = upcomingOnlineSessions();
    const past = pastOnlineSessions();
    const completed = DB.onlineSessions.filter((s) => s.status === 'completed');

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Online Sessions</h1>
                    <p>Webinars &amp; live sessions run for polytechnic students — separate from in-person Institution Visits</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={actions.addOnlineSession}>
                        <Icon name="plus" /> Schedule Online Session
                    </button>
                </div>
            </div>
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="send" label="Upcoming Sessions" value={upcoming.length} color="#8b5cf6" />
                <KpiCard icon="checkCircle" label="Completed (All Time)" value={completed.length} color="#10b981" />
                <KpiCard icon="students" label="Total Attended" value={sum(completed, (s) => s.attended_count)} color="#06b6d4" />
                <KpiCard icon="marketing" label="Leads Generated" value={sum(completed, (s) => s.leads_generated)} color="#ff6533" />
            </div>
            <h3 className="report-section-title">Upcoming</h3>
            {upcoming.length ? (
                upcoming.map((s) => <OnlineSessionCard key={s.id} session={s} isPast={false} actions={actions} />)
            ) : (
                <div className="empty-state">
                    <Icon name="calendar" />
                    <p>No online sessions scheduled yet.</p>
                </div>
            )}
            <h3 className="report-section-title">Past Sessions</h3>
            {past.length ? (
                past.map((s) => <OnlineSessionCard key={s.id} session={s} isPast actions={actions} />)
            ) : (
                <div className="empty-state">
                    <Icon name="send" />
                    <p>No past sessions yet.</p>
                </div>
            )}

            {host}
        </AdminLayout>
    );
}
