/* Institution detail drawer — ported from institutionDetailDrawer() in
   public/prototype/js/render-academic.js (the Institutions view belongs to the CRM & Marketing group). */

import { DB, courseName, fmtDate, fmtMoney, userName } from '../../../lib/db';
import { StatusBadge } from '../../../lib/ui';
import { useHostedDrawer } from './hosted';

function mouStatus(inst) {
    return inst.mou_status === 'signed' ? 'signed' : inst.mou_status === 'pending' ? 'pending' : 'none';
}

function mouLabel(inst) {
    return inst.mou_status === 'signed' ? 'MOU Signed' : inst.mou_status === 'pending' ? 'MOU Pending' : 'No MOU';
}

export default function InstitutionDetailDrawer({ id, tick, actions }) {
    const inst = DB.institutions.find((x) => x.id === id) || null;
    const visits = inst ? DB.visits.filter((v) => v.institution_id === id) : [];
    const students = inst ? DB.students.filter((s) => s.institution_id === id) : [];

    useHostedDrawer(
        inst
            ? {
                  title: inst.name,
                  sub: `${inst.type === 'government' ? 'Government' : 'Private'} Polytechnic Institute`,
                  body: (
                      <>
                          <div className="flex-gap" style={{ marginBottom: 18 }}>
                              <StatusBadge status={mouStatus(inst)} label={mouLabel(inst)} />
                              <span className="badge badge-gray">{inst.type}</span>
                          </div>
                          <div className="form-grid" style={{ marginBottom: 20 }}>
                              <div className="field span-2">
                                  <label>Address</label>
                                  <div>{inst.address}</div>
                              </div>
                              <div className="field">
                                  <label>Contact Person</label>
                                  <div>{inst.contact_person}</div>
                              </div>
                              <div className="field">
                                  <label>Phone</label>
                                  <div>{inst.phone}</div>
                              </div>
                              <div className="field span-2">
                                  <label>Email</label>
                                  <div>{inst.email}</div>
                              </div>
                              <div className="field span-2">
                                  <label>Departments</label>
                                  <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
                                      {inst.departments.map((d) => (
                                          <span className="badge badge-purple" key={d}>
                                              {d}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                          <div className="grid grid-3" style={{ marginBottom: 22 }}>
                              <div className="card card-pad" style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 20, fontWeight: 800 }}>{inst.students}</div>
                                  <div className="cell-sub">Students Sourced</div>
                              </div>
                              <div className="card card-pad" style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 20, fontWeight: 800 }}>{inst.activeLeads}</div>
                                  <div className="cell-sub">Active Leads</div>
                              </div>
                              <div className="card card-pad" style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 15, fontWeight: 800 }}>{fmtMoney(inst.revenue)}</div>
                                  <div className="cell-sub">Revenue Generated</div>
                              </div>
                          </div>
                          <h3 style={{ fontSize: '13.5px', marginBottom: 10 }}>Visit History</h3>
                          <div className="timeline" style={{ marginBottom: 22 }}>
                              {visits.length ? (
                                  visits.map((v) => (
                                      <div className="timeline-item" key={v.id}>
                                          <div className="when">
                                              {fmtDate(v.visit_date)} · {userName(v.visited_by)}
                                          </div>
                                          <div className="what">{v.purpose}</div>
                                          <div className="who">{v.outcome}</div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="muted" style={{ fontSize: '12.5px' }}>
                                      No visits logged yet.
                                  </div>
                              )}
                          </div>
                          <h3 style={{ fontSize: '13.5px', marginBottom: 10 }}>Students From This Institute</h3>
                          <div className="table-wrap">
                              <table className="data-table">
                                  <thead>
                                      <tr>
                                          <th>Name</th>
                                          <th>Course</th>
                                          <th>Status</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {students.length ? (
                                          students.map((s) => (
                                              <tr className="row-link" key={s.id} onClick={() => actions.viewStudent(s.id)}>
                                                  <td className="cell-strong">{s.name}</td>
                                                  <td>{courseName(s.courses[0]?.course_id)}</td>
                                                  <td>
                                                      <StatusBadge status={s.status} />
                                                  </td>
                                              </tr>
                                          ))
                                      ) : (
                                          <tr>
                                              <td colSpan={3} className="muted">
                                                  No students yet.
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
