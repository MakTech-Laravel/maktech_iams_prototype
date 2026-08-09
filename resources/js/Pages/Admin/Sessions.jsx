/* Course Sessions — ported from renderSessions() in public/prototype/js/render-academic.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, batchEnrolledCount, batchesInSession, courseName, fmtDate, sum } from '../../lib/db';
import { Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useAcademicModals } from './academic/useAcademicModals';

function SessionsView() {
    const actions = useAcademicModals();

    return (
        <>
            <div className="view-header">
                <div>
                    <h1>Course Sessions</h1>
                    <p>Group batches under a session/term for each course — e.g. "Session 2026-A"</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => actions.addSession()}>
                        <Icon name="plus" /> Add Session
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="calendar" label="Total Sessions" value={DB.sessions.length} color="#ff6533" />
                <KpiCard
                    icon="checkCircle"
                    label="Ongoing Sessions"
                    value={DB.sessions.filter((s) => s.status === 'ongoing').length}
                    color="#10b981"
                />
                <KpiCard icon="batch" label="Upcoming Sessions" value={DB.sessions.filter((s) => s.status === 'upcoming').length} color="#06b6d4" />
                <KpiCard icon="students" label="Total Batches Across Sessions" value={DB.batches.length} color="#f59e0b" />
            </div>

            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Session</th>
                                <th>Course</th>
                                <th>Duration</th>
                                <th>Batches</th>
                                <th>Students</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB.sessions.map((s) => {
                                const batches = batchesInSession(s.id);

                                return (
                                    <tr className="row-link" key={s.id} onClick={() => actions.viewSession(s.id)}>
                                        <td className="cell-strong">{s.name}</td>
                                        <td>{courseName(s.course_id)}</td>
                                        <td>
                                            {fmtDate(s.start)} → {fmtDate(s.end)}
                                        </td>
                                        <td>
                                            {batches.length} batch{batches.length !== 1 ? 'es' : ''}
                                        </td>
                                        <td>{sum(batches, (b) => batchEnrolledCount(b.id))} students</td>
                                        <td>
                                            <StatusBadge status={s.status} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default function Sessions({ view }) {
    return (
        <AdminLayout view={view}>
            <SessionsView />
        </AdminLayout>
    );
}
