/* Notifications — ported from renderPortalNotifications() in the prototype's portal.js. */

import { DB, fmtDate } from '../../../lib/db';

const GENERIC = [
    { type: 'class_reminder', message: 'Reminder: your next class starts tomorrow at 10:00 AM.', date: '2026-08-05 18:00', status: 'sent', channel: 'sms' },
    { type: 'announcement', message: 'Office will remain closed on Aug 15 for a public holiday.', date: '2026-08-01 09:00', status: 'sent', channel: 'portal' },
];

export default function Notifications({ student }) {
    const notifs = DB.notifications.filter((n) => n.recipient === student.name);
    const all = [...notifs, ...GENERIC];

    return (
        <div className="card">
            <div className="timeline card-pad">
                {all.map((n, i) => (
                    <div className="timeline-item" key={n.id ?? `generic-${i}`}>
                        <div className="when">
                            {fmtDate(n.date)} · {n.channel.toUpperCase()}
                        </div>
                        <div className="what">{n.message}</div>
                        <div className="who">{n.type.replace(/_/g, ' ')}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
