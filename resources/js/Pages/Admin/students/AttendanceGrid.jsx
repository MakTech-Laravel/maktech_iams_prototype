/* Attendance marking grid — ported from attendanceMarkPane() / onAttendanceFilterChange() in
   public/prototype/js/render-students.js and the mark-attendance-cell / save-attendance cases in
   public/prototype/js/app.js.

   The prototype kept the pending marks in the `currentAttMarks` module global and rebuilt them every
   time the pane was re-rendered; here they are component state, and the parent remounts this
   component (via a key on batch/date/module) so the same "reset from the saved session" happens. */

import { useState } from 'react';
import { DB, activeStudentsInBatch, courseName, findAttendanceSession, fmtDate, markAttendance } from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Avatar, Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

const MARK_STATUSES = ['present', 'absent', 'late', 'excused'];

export default function AttendanceGrid({ batches, batch, date, moduleId, onBatchChange, onDateChange, onModuleChange, onSaved }) {
    const { toast } = useUi();
    const { userId } = useIdentity();

    const course = DB.courses.find((c) => c.id === batch.course_id);
    const moduleOptions = course ? course.modules : [];
    const roster = activeStudentsInBatch(batch.id);
    const existingSession = findAttendanceSession(batch.id, date, moduleId);

    const [marks, setMarks] = useState(() => {
        const initial = {};

        roster.forEach((s) => {
            const rec = existingSession
                ? DB.attendanceRecords.find((r) => r.session_id === existingSession.id && r.student_id === s.id)
                : null;
            initial[s.id] = rec ? rec.status : 'present';
        });

        return initial;
    });

    return (
        <>
            <div className="filter-bar">
                <select value={batch.id} onChange={(event) => onBatchChange(Number(event.target.value))}>
                    {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name} — {courseName(b.course_id)}
                        </option>
                    ))}
                </select>
                <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
                <select value={moduleId ?? ''} onChange={(event) => onModuleChange(event.target.value)}>
                    {moduleOptions.length ? (
                        moduleOptions.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.title}
                            </option>
                        ))
                    ) : (
                        <option value="">General Session</option>
                    )}
                </select>
                <span className="badge badge-blue">
                    <Icon name="students" /> {roster.length} active students
                </span>
                {existingSession ? (
                    <span className="badge badge-green">
                        <Icon name="checkCircle" /> Already marked — editing
                    </span>
                ) : (
                    <span className="badge badge-gray">
                        <Icon name="alertCircle" /> Not marked yet
                    </span>
                )}
            </div>
            <div className="card">
                <div className="card-header">
                    <h3>Mark Attendance — {batch.name}</h3>
                    <p>
                        {fmtDate(date)}
                        {moduleOptions.length ? ` · ${moduleOptions.find((m) => m.id === moduleId)?.title || ''}` : ''} — click a status per student
                    </p>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th />
                                <th>Student</th>
                                <th>Code</th>
                                <th>Mark</th>
                            </tr>
                        </thead>
                        <tbody id="attSheetBody">
                            {roster.length ? (
                                roster.map((s) => (
                                    <tr data-studentrow={s.id} key={s.id}>
                                        <td>
                                            <Avatar name={s.name} size="sm" photo={s.photo} />
                                        </td>
                                        <td className="cell-strong">{s.name}</td>
                                        <td>{s.code}</td>
                                        <td>
                                            <div className="flex-gap">
                                                {MARK_STATUSES.map((st) => (
                                                    <button
                                                        type="button"
                                                        key={st}
                                                        className={`btn btn-sm ${marks[s.id] === st ? 'btn-primary' : 'btn-secondary'}`}
                                                        style={{ padding: '5px 10px' }}
                                                        onClick={() => setMarks((current) => ({ ...current, [s.id]: st }))}
                                                    >
                                                        {st[0].toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="muted">
                                        No active students enrolled in this batch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="card-pad" style={{ borderTop: '1px solid var(--gray-100)' }}>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            markAttendance(batch.id, date, moduleId, marks, userId);
                            toast(`Attendance saved for ${fmtDate(date)}`);
                            onSaved?.();
                        }}
                    >
                        <Icon name="check" /> Save Attendance
                    </button>
                </div>
            </div>
        </>
    );
}
