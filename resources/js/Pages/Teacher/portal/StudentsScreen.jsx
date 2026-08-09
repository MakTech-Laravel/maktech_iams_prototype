/* My Students — ported from renderTpStudents() in public/prototype/js/teacherportal.js. */

import { activeStudentsInBatch, attendanceSummaryForStudent, courseName } from '../../../lib/db';
import { Avatar, Icon } from '../../../lib/ui';

function BatchRoster({ batch, first }) {
    const roster = activeStudentsInBatch(batch.id);

    return (
        <div style={{ marginBottom: 22 }}>
            <h3 className="report-section-title" style={first ? { marginTop: 0 } : undefined}>
                {batch.name} — {courseName(batch.course_id)}{' '}
                <span className="cell-sub" style={{ fontWeight: 400 }}>
                    ({roster.length} students)
                </span>
            </h3>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th />
                                <th>Student</th>
                                <th>Code</th>
                                <th>Phone</th>
                                <th>Attendance %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roster.length ? (
                                roster.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <Avatar name={s.name} size="sm" photo={s.photo} />
                                        </td>
                                        <td className="cell-strong">{s.name}</td>
                                        <td>{s.code}</td>
                                        <td>{s.phone}</td>
                                        <td>{attendanceSummaryForStudent(s.id, batch.id).pct}%</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 16 }}>
                                        No active students yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function StudentsScreen({ batches }) {
    if (!batches.length) {
        return (
            <div className="empty-state">
                <Icon name="students" />
                <p>No batches assigned yet.</p>
            </div>
        );
    }

    return (
        <>
            {batches.map((b, idx) => (
                <BatchRoster key={b.id} batch={b} first={idx === 0} />
            ))}
        </>
    );
}
