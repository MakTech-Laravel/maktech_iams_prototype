/* Contact log modal — ported from contactLogModal() in render-marketing.js plus the `save-contact-log`
   case in app.js. Opened either on its own (log a call) or from a follow-up's "Mark Done", in which case
   saving also closes that follow-up out. */

import { useState } from 'react';
import { DB, LEAD_STATUS_LABELS, fmtDate, logLeadContact, markFollowupDone } from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

export default function ContactLogModal({ leadId, presetStatus, followupId, actions }) {
    const { toast } = useUi();
    const { userId } = useIdentity();
    const lead = DB.leads.find((x) => x.id === leadId) || null;
    const fu = followupId ? DB.followUps.find((f) => f.id === followupId) : null;

    const [type, setType] = useState('call');
    const [status, setStatus] = useState(presetStatus || lead?.status || 'new');
    const [notes, setNotes] = useState(fu ? fu.notes || '' : '');
    const [outcome, setOutcome] = useState('');
    const [lostReason, setLostReason] = useState(lead?.lost_reason || '');
    const [followupDate, setFollowupDate] = useState('');
    const [followupTime, setFollowupTime] = useState('10:00');
    const [followupNote, setFollowupNote] = useState('');

    const save = () => {
        const trimmedNotes = notes.trim();

        if (!trimmedNotes) {
            toast('Please describe what was discussed', 'error');

            return;
        }

        logLeadContact(leadId, {
            type,
            notes: trimmedNotes,
            outcome: outcome.trim(),
            contactedBy: userId,
            newStatus: status,
            lostReason: lostReason.trim(),
            nextFollowupDate: followupDate,
            nextFollowupTime: followupTime,
            nextFollowupNote: followupNote.trim(),
        });

        const fuId = followupId || null;

        if (fuId) {
            markFollowupDone(fuId, userId);
        }

        actions.dismiss();
        toast(
            'Contact logged' +
                (status ? ` — stage updated to "${LEAD_STATUS_LABELS[status]}"` : '') +
                (fuId ? ' — follow-up marked done' : ''),
        );

        if (fuId) {
            actions.bump();
        } else {
            actions.viewLead(leadId);
            actions.bump();
        }
    };

    useHostedModal(
        lead
            ? {
                  size: 'lg',
                  title: fu ? `Complete Follow-up — ${lead.name}` : `Log Contact — ${lead.name}`,
                  sub: fu
                      ? `Due ${fmtDate(fu.due_date)} — "${fu.notes}". Log the outcome, update the stage, and (optionally) schedule the next follow-up.`
                      : 'Record the conversation, update the stage, and (optionally) set the next follow-up',
                  body: (
                      <>
                          {fu ? (
                              <div className="badge badge-blue" style={{ whiteSpace: 'normal', marginBottom: 14 }}>
                                  <Icon name="clock" /> This will mark the follow-up due {fmtDate(fu.due_date)} as done once saved.
                              </div>
                          ) : null}
                          <div className="form-grid" style={{ marginBottom: 4 }}>
                              <div className="field">
                                  <label>Contact Type *</label>
                                  <select id="clType" value={type} onChange={(e) => setType(e.target.value)}>
                                      <option value="call">Call</option>
                                      <option value="sms">SMS</option>
                                      <option value="email">Email</option>
                                      <option value="visit">Visit</option>
                                      <option value="whatsapp">WhatsApp</option>
                                  </select>
                              </div>
                              <div className="field">
                                  <label>New Pipeline Stage *</label>
                                  <select id="clStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
                                      {DB.leadPipeline.map((s) => (
                                          <option key={s} value={s}>
                                              {LEAD_STATUS_LABELS[s]}
                                          </option>
                                      ))}
                                  </select>
                              </div>
                              <div className="field span-2">
                                  <label>What was discussed? *</label>
                                  <textarea
                                      id="clNotes"
                                      placeholder="e.g. Explained fee structure, answered questions about batch timing…"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                  />
                              </div>
                              <div className="field span-2">
                                  <label>Outcome</label>
                                  <input
                                      type="text"
                                      id="clOutcome"
                                      placeholder="e.g. Will decide by Friday"
                                      value={outcome}
                                      onChange={(e) => setOutcome(e.target.value)}
                                  />
                              </div>
                              <div className="field span-2" id="clLostReasonField" style={{ display: status === 'lost' ? 'block' : 'none' }}>
                                  <label>Reason Lost</label>
                                  <input
                                      type="text"
                                      id="clLostReason"
                                      placeholder="e.g. Chose competitor institute"
                                      value={lostReason}
                                      onChange={(e) => setLostReason(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div className="hr" />
                          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: 8 }}>
                              Schedule Next Follow-up (optional)
                          </label>
                          <div className="form-grid">
                              <div className="field">
                                  <label>Follow-up Date</label>
                                  <input type="date" id="clFollowupDate" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} />
                              </div>
                              <div className="field">
                                  <label>Follow-up Time</label>
                                  <input type="time" id="clFollowupTime" value={followupTime} onChange={(e) => setFollowupTime(e.target.value)} />
                              </div>
                              <div className="field span-2">
                                  <label>Follow-up Note</label>
                                  <input
                                      type="text"
                                      id="clFollowupNote"
                                      placeholder="Defaults to the notes above if left blank"
                                      value={followupNote}
                                      onChange={(e) => setFollowupNote(e.target.value)}
                                  />
                              </div>
                          </div>
                      </>
                  ),
                  foot: (
                      <>
                          <button type="button" className="btn btn-secondary" onClick={actions.dismiss}>
                              Cancel
                          </button>
                          <button type="button" className="btn btn-primary" onClick={save}>
                              <Icon name="check" /> {fu ? 'Save & Mark Done' : 'Save'}
                          </button>
                      </>
                  ),
              }
            : null,
        [leadId, followupId, type, status, notes, outcome, lostReason, followupDate, followupTime, followupNote],
    );

    return null;
}
