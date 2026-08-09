/* Add Lead modal — ported from addLeadModal() in render-marketing.js plus the `save-lead` case in app.js. */

import { useState } from 'react';
import { DB, LEAD_STATUS_LABELS, SOURCE_LABELS, TODAY, fmtDate, nextId } from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

export default function AddLeadModal({ actions }) {
    const { toast } = useUi();
    const { userId } = useIdentity();
    const staff = DB.users.filter((u) => u.role_id === 3);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [source, setSource] = useState(Object.keys(SOURCE_LABELS)[0]);
    const [sourceSession, setSourceSession] = useState('');
    const [institution, setInstitution] = useState('');
    const [course, setCourse] = useState('');
    const [assignTo, setAssignTo] = useState(String(staff[0]?.id ?? ''));
    const [status, setStatus] = useState(DB.leadPipeline[0]);

    const save = () => {
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedName || !trimmedPhone) {
            toast('Name and phone are required', 'error');

            return;
        }

        DB.leads.push({
            id: nextId(DB.leads),
            name: trimmedName,
            phone: trimmedPhone,
            email: email.trim() || null,
            institution_id: Number(institution) || null,
            source,
            source_session_id: source === 'online_session' ? Number(sourceSession) || null : null,
            interested_course_id: Number(course) || null,
            status: status || 'new',
            assigned_to: Number(assignTo) || userId,
            created_at: TODAY,
        });

        actions.dismiss();
        toast('Lead saved successfully');
        actions.bump();
    };

    useHostedModal(
        {
            title: 'Add New Lead',
            sub: 'Capture a new lead from visit, referral, walk-in, campaign, or online session',
            body: (
                <div className="form-grid">
                    <div className="field">
                        <label>Full Name *</label>
                        <input type="text" id="alName" placeholder="e.g. Md. Karim Hossain" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Phone *</label>
                        <input type="text" id="alPhone" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Email</label>
                        <input type="text" id="alEmail" placeholder="optional" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Source *</label>
                        <select id="alSource" value={source} onChange={(e) => setSource(e.target.value)}>
                            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field" id="alSessionField" style={{ display: source === 'online_session' ? 'block' : 'none' }}>
                        <label>Which Online Session?</label>
                        <select id="alSourceSession" value={sourceSession} onChange={(e) => setSourceSession(e.target.value)}>
                            <option value="">—</option>
                            {DB.onlineSessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title} ({fmtDate(s.date)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Institution</label>
                        <select id="alInstitution" value={institution} onChange={(e) => setInstitution(e.target.value)}>
                            <option value="">—</option>
                            {DB.institutions.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Interested Course</label>
                        <select id="alCourse" value={course} onChange={(e) => setCourse(e.target.value)}>
                            <option value="">—</option>
                            {DB.courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Assign To</label>
                        <select id="alAssignTo" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                            {staff.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Initial Status</label>
                        <select id="alStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
                            {DB.leadPipeline.map((s) => (
                                <option key={s} value={s}>
                                    {LEAD_STATUS_LABELS[s]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={actions.dismiss}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={save}>
                        <Icon name="check" /> Save Lead
                    </button>
                </>
            ),
        },
        [name, phone, email, source, sourceSession, institution, course, assignTo, status],
    );

    return null;
}
