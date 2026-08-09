/* Schedule Follow-up modal opened from the Follow-ups view (no lead pre-selected) — ported from the
   `open-add-followup-generic` / `save-followup-generic` cases in app.js. */

import { useState } from 'react';
import { DB, LEAD_STATUS_LABELS, scheduleFollowup } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

export default function GenericFollowupModal({ actions }) {
    const { toast } = useUi();
    const staff = DB.users.filter((u) => u.role_id === 3);

    const [lead, setLead] = useState(String(DB.leads[0]?.id ?? ''));
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [assignee, setAssignee] = useState(String(staff[0]?.id ?? ''));
    const [notes, setNotes] = useState('');

    const save = () => {
        const leadId = Number(lead);

        if (!leadId || !date) {
            toast('Lead and due date are required', 'error');

            return;
        }

        scheduleFollowup(leadId, date, time, Number(assignee), notes.trim());
        actions.dismiss();
        toast('Follow-up scheduled');
        actions.bump();
    };

    useHostedModal(
        {
            title: 'Schedule Follow-up',
            sub: 'Set a reminder for call, SMS, email or in-person visit',
            body: (
                <div className="form-grid">
                    <div className="field span-2">
                        <label>Lead *</label>
                        <select id="gfLead" value={lead} onChange={(e) => setLead(e.target.value)}>
                            {DB.leads.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name} — {LEAD_STATUS_LABELS[l.status]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Due Date *</label>
                        <input type="date" id="gfDate" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Due Time</label>
                        <input type="time" id="gfTime" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                    <div className="field span-2">
                        <label>Assign To</label>
                        <select id="gfAssignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                            {staff.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field span-2">
                        <label>Notes</label>
                        <textarea id="gfNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        [lead, date, time, assignee, notes],
    );

    return null;
}
