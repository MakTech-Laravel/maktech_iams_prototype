/* Schedule Follow-up modal (from a lead's drawer) — ported from scheduleFollowupModal() in
   render-marketing.js plus the `save-schedule-followup` case in app.js. */

import { useState } from 'react';
import { DB, scheduleFollowup } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

export default function ScheduleFollowupModal({ leadId, actions }) {
    const { toast } = useUi();
    const lead = DB.leads.find((x) => x.id === Number(leadId)) || null;
    const staff = DB.users.filter((u) => u.role_id === 3);

    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [assignee, setAssignee] = useState(String(lead?.assigned_to ?? staff[0]?.id ?? ''));
    const [notes, setNotes] = useState('');

    const save = () => {
        if (!date) {
            toast('Pick a due date', 'error');

            return;
        }

        scheduleFollowup(lead.id, date, time, Number(assignee), notes.trim());
        actions.dismiss();
        toast('Follow-up scheduled');
        actions.viewLead(lead.id);
        actions.bump();
    };

    useHostedModal(
        lead
            ? {
                  title: 'Schedule Follow-up',
                  sub: `${lead.name} — set a reminder without logging a contact yet`,
                  body: (
                      <div className="form-grid">
                          <div className="field">
                              <label>Due Date *</label>
                              <input type="date" id="sfDate" value={date} onChange={(e) => setDate(e.target.value)} />
                          </div>
                          <div className="field">
                              <label>Due Time</label>
                              <input type="time" id="sfTime" value={time} onChange={(e) => setTime(e.target.value)} />
                          </div>
                          <div className="field span-2">
                              <label>Assign To</label>
                              <select id="sfAssignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                                  {staff.map((u) => (
                                      <option key={u.id} value={u.id}>
                                          {u.name}
                                      </option>
                                  ))}
                              </select>
                          </div>
                          <div className="field span-2">
                              <label>Notes</label>
                              <textarea
                                  id="sfNotes"
                                  placeholder="What needs to happen on this follow-up?"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                              />
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
              }
            : null,
        [leadId, date, time, assignee, notes],
    );

    return null;
}
