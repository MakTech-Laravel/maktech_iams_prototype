/* Lead detail drawer — ported from leadDetailDrawer() in public/prototype/js/render-marketing.js. */

import {
    DB,
    LEAD_STATUS_LABELS,
    SOURCE_LABELS,
    courseName,
    fmtDate,
    institutionName,
    isFollowupOverdue,
    onlineSessionName,
    userName,
} from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';
import { useHostedDrawer } from './hosted';

export default function LeadDetailDrawer({ id, tick, actions }) {
    const lead = DB.leads.find((x) => x.id === id) || null;
    const hist = lead ? DB.contactHistory.filter((h) => h.lead_id === id).slice().reverse() : [];
    const fus = lead ? DB.followUps.filter((f) => f.lead_id === id).slice().reverse() : [];

    useHostedDrawer(
        lead
            ? {
                  title: lead.name,
                  sub: `${lead.phone} ${lead.email ? '· ' + lead.email : ''}`,
                  body: (
                      <>
                          <div className="flex-gap" style={{ marginBottom: 18, flexWrap: 'wrap' }}>
                              <StatusBadge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
                              <span className="badge badge-gray">{SOURCE_LABELS[lead.source]}</span>
                              {lead.source_session_id ? (
                                  <span className="badge badge-purple">
                                      <Icon name="send" /> {onlineSessionName(lead.source_session_id)}
                                  </span>
                              ) : null}
                              {lead.status === 'lost' ? <span className="badge badge-red">Reason: {lead.lost_reason}</span> : null}
                          </div>
                          <div className="form-grid" style={{ marginBottom: 20 }}>
                              <div className="field">
                                  <label>Institution</label>
                                  <div>{institutionName(lead.institution_id)}</div>
                              </div>
                              <div className="field">
                                  <label>Interested Course</label>
                                  <div>{courseName(lead.interested_course_id)}</div>
                              </div>
                              <div className="field">
                                  <label>Assigned To</label>
                                  <div>{userName(lead.assigned_to)}</div>
                              </div>
                              <div className="field">
                                  <label>Created On</label>
                                  <div>{fmtDate(lead.created_at)}</div>
                              </div>
                          </div>

                          <div className="flex-between" style={{ marginBottom: 10 }}>
                              <h3 style={{ margin: 0, fontSize: '13.5px' }}>Pipeline Stage</h3>
                          </div>
                          <div className="flex-gap" style={{ marginBottom: 22, flexWrap: 'wrap' }}>
                              {DB.leadPipeline.map((s) => (
                                  <button
                                      key={s}
                                      type="button"
                                      className={`btn btn-sm ${s === lead.status ? 'btn-primary' : 'btn-secondary'}`}
                                      onClick={() => actions.contactLog(lead.id, s)}
                                  >
                                      {LEAD_STATUS_LABELS[s]}
                                  </button>
                              ))}
                          </div>
                          <div className="badge badge-gray" style={{ whiteSpace: 'normal', marginBottom: 20 }}>
                              <Icon name="shield" /> Clicking a stage opens the contact log so every status change carries a note &amp;
                              (optionally) a next follow-up date.
                          </div>

                          <div className="flex-between" style={{ marginBottom: 10 }}>
                              <h3 style={{ margin: 0, fontSize: '13.5px' }}>Contact History</h3>
                              <button type="button" className="btn btn-sm btn-outline" onClick={() => actions.contactLog(lead.id)}>
                                  <Icon name="plus" /> Log Contact
                              </button>
                          </div>
                          <div className="timeline" style={{ marginBottom: 20 }}>
                              {hist.length ? (
                                  hist.map((h) => (
                                      <div className="timeline-item" key={h.id}>
                                          <div className="when">
                                              {h.date} · {h.type.toUpperCase()} · {userName(h.contacted_by)}
                                          </div>
                                          <div className="what">{h.notes}</div>
                                          <div className="who">Outcome: {h.outcome || '—'}</div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="muted" style={{ fontSize: '12.5px' }}>
                                      No contact history yet.
                                  </div>
                              )}
                          </div>

                          <div className="flex-between" style={{ marginBottom: 10 }}>
                              <h3 style={{ margin: 0, fontSize: '13.5px' }}>Follow-ups</h3>
                              <button type="button" className="btn btn-sm btn-outline" onClick={() => actions.scheduleFollowup(lead.id)}>
                                  <Icon name="plus" /> Schedule
                              </button>
                          </div>
                          <div className="table-wrap">
                              <table className="data-table">
                                  <thead>
                                      <tr>
                                          <th>Due</th>
                                          <th>Notes</th>
                                          <th>Status</th>
                                          <th />
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {fus.length ? (
                                          fus.map((f) => (
                                              <tr key={f.id}>
                                                  <td>
                                                      {fmtDate(f.due_date)} <span className="cell-sub">{f.due_date.split(' ')[1] || ''}</span>
                                                      {isFollowupOverdue(f) ? (
                                                          <>
                                                              {' '}
                                                              <StatusBadge status="overdue" label="Overdue" />
                                                          </>
                                                      ) : null}
                                                  </td>
                                                  <td>{f.notes}</td>
                                                  <td>
                                                      <StatusBadge status={f.status} />
                                                  </td>
                                                  <td>
                                                      {f.status === 'pending' ? (
                                                          <button
                                                              type="button"
                                                              className="btn btn-sm btn-ghost"
                                                              title="Log outcome & mark done"
                                                              onClick={() => actions.completeFollowup(f.id)}
                                                          >
                                                              <Icon name="check" />
                                                          </button>
                                                      ) : null}
                                                  </td>
                                              </tr>
                                          ))
                                      ) : (
                                          <tr>
                                              <td colSpan={4} className="muted">
                                                  No follow-ups scheduled.
                                              </td>
                                          </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </>
                  ),
              }
            : null,
        [id, tick],
    );

    return null;
}
