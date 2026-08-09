/* Schedule Online Session modal — ported from addOnlineSessionModal() in render-marketing.js plus the
   `save-online-session` case in app.js. */

import { useState } from 'react';
import { DB, ONLINE_SESSION_PLATFORM_LABELS, TODAY, nextId } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

export default function AddOnlineSessionModal({ actions }) {
    const { toast } = useUi();
    const hosts = DB.users.filter((u) => u.role_id === 3);

    const [title, setTitle] = useState('');
    const [institution, setInstitution] = useState('');
    const [platform, setPlatform] = useState(Object.keys(ONLINE_SESSION_PLATFORM_LABELS)[0]);
    const [date, setDate] = useState(TODAY);
    const [time, setTime] = useState('15:00');
    const [duration, setDuration] = useState('60');
    const [host, setHost] = useState(String(hosts[0]?.id ?? ''));
    const [link, setLink] = useState('');

    const save = () => {
        const trimmedTitle = title.trim();

        if (!trimmedTitle || !date) {
            toast('Title and date are required', 'error');

            return;
        }

        DB.onlineSessions.push({
            id: nextId(DB.onlineSessions),
            title: trimmedTitle,
            institution_id: Number(institution) || null,
            platform,
            host_id: Number(host),
            date,
            time,
            duration_mins: Number(duration) || 60,
            meeting_link: link.trim() || null,
            status: 'scheduled',
            registered_count: 0,
            attended_count: 0,
            leads_generated: 0,
            notes: '',
        });

        actions.dismiss();
        toast('Online session scheduled');
        actions.bump();
    };

    useHostedModal(
        {
            size: 'lg',
            title: 'Schedule Online Session',
            sub: 'Set up a webinar / live session for polytechnic students',
            body: (
                <div className="form-grid">
                    <div className="field span-2">
                        <label>Title *</label>
                        <input
                            type="text"
                            id="osTitle"
                            placeholder="e.g. Industrial Attachment Career Talk"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label>Target Institution</label>
                        <select id="osInstitution" value={institution} onChange={(e) => setInstitution(e.target.value)}>
                            <option value="">Open to All Institutes</option>
                            {DB.institutions.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Platform *</label>
                        <select id="osPlatform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                            {Object.entries(ONLINE_SESSION_PLATFORM_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Date *</label>
                        <input type="date" id="osDate" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Time *</label>
                        <input type="time" id="osTime" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Duration (mins)</label>
                        <input type="number" id="osDuration" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Host</label>
                        <select id="osHost" value={host} onChange={(e) => setHost(e.target.value)}>
                            {hosts.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field span-2">
                        <label>Meeting Link</label>
                        <input type="text" id="osLink" placeholder="https://zoom.us/j/..." value={link} onChange={(e) => setLink(e.target.value)} />
                    </div>
                </div>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={actions.dismiss}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={save}>
                        <Icon name="check" /> Schedule
                    </button>
                </>
            ),
        },
        [title, institution, platform, date, time, duration, host, link],
    );

    return null;
}
