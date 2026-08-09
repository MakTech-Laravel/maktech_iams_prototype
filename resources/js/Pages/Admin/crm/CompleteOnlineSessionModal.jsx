/* Mark Session Completed modal — ported from completeOnlineSessionModal() in render-marketing.js plus the
   `save-complete-online-session` case in app.js. */

import { useState } from 'react';
import { DB, completeOnlineSession } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

export default function CompleteOnlineSessionModal({ id, actions }) {
    const { toast } = useUi();
    const session = DB.onlineSessions.find((x) => x.id === id) || null;

    const [attended, setAttended] = useState(String(session?.registered_count ?? 0));
    const [leads, setLeads] = useState('0');
    const [notes, setNotes] = useState('');

    const save = () => {
        completeOnlineSession(id, { attendedCount: attended, leadsGenerated: leads, notes: notes.trim() });
        actions.dismiss();
        toast('Session marked completed');
        actions.bump();
    };

    useHostedModal(
        session
            ? {
                  title: 'Mark Session Completed',
                  sub: session.title,
                  body: (
                      <div className="form-grid">
                          <div className="field">
                              <label>Attendees Count *</label>
                              <input type="number" id="osAttended" value={attended} onChange={(e) => setAttended(e.target.value)} />
                          </div>
                          <div className="field">
                              <label>Leads Generated *</label>
                              <input type="number" id="osLeads" value={leads} onChange={(e) => setLeads(e.target.value)} />
                          </div>
                          <div className="field span-2">
                              <label>Notes / Summary</label>
                              <textarea
                                  id="osCompleteNotes"
                                  placeholder="How did the session go?"
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
                              <Icon name="check" /> Save & Complete
                          </button>
                      </>
                  ),
              }
            : null,
        [id, attended, leads, notes],
    );

    return null;
}
