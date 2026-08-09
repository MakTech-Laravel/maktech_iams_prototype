/* Notifications & Automation — ported from renderNotifications() in public/prototype/js/render-admin.js
   (open-send-notification / toggle-rule cases in app.js). */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, fmtDate } from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useUi } from '../../lib/UiProvider';
import { useSendNotificationModal } from './admin/SendNotificationModal';

export default function Notifications({ view }) {
    const refresh = useRefresh();
    const { toast } = useUi();
    const openSendNotification = useSendNotificationModal();

    const toggleRule = (id, checked) => {
        const r = DB.notificationRules.find((x) => x.id === id);

        if (r) {
            r.active = checked;
            toast(`Rule ${r.active ? 'activated' : 'deactivated'}`);
            refresh();
        }
    };

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Notifications &amp; Automation</h1>
                    <p>SMS/Email delivery log and admin-configurable automation rules</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={openSendNotification}>
                        <Icon name="send" /> Send Manual Notification
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="send" label="Sent (Last 30 days)" value={DB.notifications.filter((n) => n.status === 'sent').length} color="#10b981" />
                <KpiCard icon="alertCircle" label="Failed Deliveries" value={DB.notifications.filter((n) => n.status === 'failed').length} color="#ef4444" />
                <KpiCard
                    icon="notification"
                    label="Active Automation Rules"
                    value={DB.notificationRules.filter((r) => r.active).length}
                    color="#ff6533"
                />
                <KpiCard icon="mail" label="Channels Configured" value="SMS · Email · Portal" color="#8b5cf6" />
            </div>

            <h3 className="report-section-title">Notification Delivery Log</h3>
            <div className="card" style={{ marginBottom: 26 }}>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Recipient</th>
                                <th>Channel</th>
                                <th>Type</th>
                                <th>Message</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB.notifications.map((n) => (
                                <tr key={n.id}>
                                    <td className="cell-strong">{n.recipient}</td>
                                    <td>
                                        <span className="badge badge-gray">{n.channel.toUpperCase()}</span>
                                    </td>
                                    <td>{n.type.replace(/_/g, ' ')}</td>
                                    <td style={{ maxWidth: 280, whiteSpace: 'normal' }}>{n.message}</td>
                                    <td>{fmtDate(n.date)}</td>
                                    <td>
                                        <StatusBadge status={n.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <h3 className="report-section-title">Automation Rules (Notification Templates &amp; Timing)</h3>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Trigger Event</th>
                                <th>Channel</th>
                                <th>Template</th>
                                <th>Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB.notificationRules.map((r) => (
                                <tr key={r.id}>
                                    <td className="cell-strong">{r.trigger.replace(/_/g, ' ')}</td>
                                    <td>
                                        <span className="badge badge-gray">{r.channel.toUpperCase()}</span>
                                    </td>
                                    <td style={{ maxWidth: 320, whiteSpace: 'normal', fontSize: 12, color: 'var(--gray-500)' }}>{r.template}</td>
                                    <td>
                                        <label className="flex-gap" style={{ cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!r.active} onChange={(event) => toggleRule(r.id, event.target.checked)} />{' '}
                                            {r.active ? <StatusBadge status="active" label="Active" /> : <StatusBadge status="inactive" label="Inactive" />}
                                        </label>
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
