/* Attendance marking — ported from renderTpAttendance(), onTpAttendanceFilterChange() and the
   'tp-mark-attendance-cell' / 'tp-save-attendance' actions in public/prototype/js/teacherportal.js. */

import { useMemo, useState } from 'react';
import {
    DB,
    TODAY,
    activeStudentsInBatch,
    attendanceRecordsForSession,
    courseName,
    findAttendanceSession,
    fmtDate,
    markAttendance,
} from '../../../lib/db';
import { Avatar, Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

const STATUSES = ['present', 'absent', 'late', 'excused'];

/* Mirrors the prototype's per-render seeding of tpAttMarks from the stored session. */
function savedMarks(batchId, date, moduleId) {
    const roster = activeStudentsInBatch(batchId);
    const existingSession = findAttendanceSession(batchId, date, moduleId);
    const records = existingSession ? attendanceRecordsForSession(existingSession.id) : [];
    const marks = {};

    roster.forEach((s) => {
        const rec = records.find((r) => r.student_id === s.id);
        marks[s.id] = rec ? rec.status : 'present';
    });

    return marks;
}

export default function AttendanceScreen({ teacher, batches: allBatches, batchId, onBatchChange }) {
    const { toast } = useUi();
    const [date, setDate] = useState(TODAY);
    const [moduleId, setModuleId] = useState(null);
    const [pending, setPending] = useState({ key: null, marks: {} });

    const batches = allBatches.filter((b) => b.status !== 'upcoming');
    const activeBatchId = batchId && batches.some((b) => b.id === batchId) ? batchId : batches.length ? batches[0].id : null;
    const batch = batches.find((b) => b.id === activeBatchId) || null;
    const course = batch ? DB.courses.find((c) => c.id === batch.course_id) : null;
    const moduleOptions = course ? course.modules : [];
    const activeModuleId = moduleId == null && moduleOptions.length ? moduleOptions[0].id : moduleId;

    const roster = useMemo(() => (batch ? activeStudentsInBatch(batch.id) : []), [batch]);
    const base = useMemo(() => (batch ? savedMarks(batch.id, date, activeModuleId) : {}), [batch, date, activeModuleId]);

    const marksKey = `${activeBatchId}|${date}|${activeModuleId}`;
    const marks = pending.key === marksKey ? { ...base, ...pending.marks } : base;

    const setMark = (studentId, status) =>
        setPending((current) =>
            current.key === marksKey
                ? { key: marksKey, marks: { ...current.marks, [studentId]: status } }
                : { key: marksKey, marks: { [studentId]: status } },
        );

    const saveAttendance = () => {
        markAttendance(batch.id, date, activeModuleId, marks, teacher.id);
        toast('Attendance saved for ' + fmtDate(date));
    };

    if (!batches.length) {
        return (
            <div className="empty-state">
                <Icon name="attendance" />
                <p>No active batches to mark attendance for yet.</p>
            </div>
        );
    }

    return (
        <>
            <div className="filter-bar">
                <select id="tpAttBatchSelect" value={String(batch.id)} onChange={(event) => onBatchChange(Number(event.target.value))}>
                    {batches.map((b) => (
                        <option key={b.id} value={String(b.id)}>
                            {b.name} — {courseName(b.course_id)}
                        </option>
                    ))}
                </select>
                <input type="date" id="tpAttDateInput" value={date} onChange={(event) => setDate(event.target.value)} />
                <select
                    id="tpAttModuleSelect"
                    value={activeModuleId == null ? '' : String(activeModuleId)}
                    onChange={(event) => setModuleId(event.target.value ? Number(event.target.value) : null)}
                >
                    {moduleOptions.length ? (
                        moduleOptions.map((m) => (
                            <option key={m.id} value={String(m.id)}>
                                {m.title}
                            </option>
                        ))
                    ) : (
                        <option value="">General Session</option>
                    )}
                </select>
            </div>

            {roster.length ? (
                <>
                    <div className="card">
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th />
                                        <th>Student</th>
                                        <th>Code</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roster.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <Avatar name={s.name} size="sm" photo={s.photo} />
                                            </td>
                                            <td className="cell-strong">{s.name}</td>
                                            <td>{s.code}</td>
                                            <td>
                                                <div className="flex-gap">
                                                    {STATUSES.map((st) => (
                                                        <button
                                                            key={st}
                                                            type="button"
                                                            className={`btn btn-sm ${marks[s.id] === st ? 'btn-primary' : 'btn-secondary'}`}
                                                            style={{ padding: '5px 10px' }}
                                                            onClick={() => setMark(s.id, st)}
                                                        >
                                                            {st[0].toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex-gap" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-primary" onClick={saveAttendance}>
                            <Icon name="check" /> Save Attendance
                        </button>
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <Icon name="students" />
                    <p>No active students in this batch yet.</p>
                </div>
            )}
        </>
    );
}
