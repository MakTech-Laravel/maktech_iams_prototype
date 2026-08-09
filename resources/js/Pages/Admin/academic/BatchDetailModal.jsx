/* Batch detail modal — ported from batchDetailModal() in public/prototype/js/render-academic.js. */

import {
    DB,
    attendanceSummaryForBatch,
    attendanceSummaryForStudent,
    batchEnrolledCount,
    batchSeatsAvailable,
    effectiveBatchCapacity,
    fmtDate,
    labName,
    sessionName,
    userName,
} from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';

function BatchDetailBody({ ctx, batch: b }) {
    const course = DB.courses.find((c) => c.id === b.course_id);
    const roster = DB.students.filter((s) => s.courses.some((sc) => sc.batch_id === b.id));
    const seatsLeft = batchSeatsAvailable(b.id);
    const teachers = b.assigned_teachers || [];

    return (
        <>
            <div className="flex-gap" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
                <StatusBadge status={b.status} />
                <span className="badge badge-gray">
                    {fmtDate(b.start)} → {fmtDate(b.end)}
                </span>
                <span className="badge badge-blue">Coordinator: {userName(b.coordinator_id)}</span>
                {b.status !== 'completed' ? (
                    seatsLeft > 0 ? (
                        <span className="badge badge-green">
                            <Icon name="checkCircle" /> {seatsLeft} seat{seatsLeft !== 1 ? 's' : ''} left
                        </span>
                    ) : (
                        <span className="badge badge-red">
                            <Icon name="alertCircle" /> Full
                        </span>
                    )
                ) : null}
            </div>

            <div className="flex-gap" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                <span className="cell-sub">Assigned teachers:</span>
                {teachers.length ? (
                    teachers.map((tid) => (
                        <span className="badge badge-purple" key={tid}>
                            {userName(tid)}
                        </span>
                    ))
                ) : (
                    <span className="muted">None</span>
                )}
                <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                        ctx.closeModal();
                        ctx.actions.manageTeachers(b.id);
                    }}
                >
                    <Icon name="edit" /> Manage
                </button>
            </div>

            <div className="grid grid-3" style={{ marginBottom: 20 }}>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>
                        {batchEnrolledCount(b.id)}/{effectiveBatchCapacity(b)}
                    </div>
                    <div className="cell-sub">Enrolled · {labName(b.lab_id)}</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{attendanceSummaryForBatch(b.id).avgPct}%</div>
                    <div className="cell-sub">Avg Attendance</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{course.modules.length}</div>
                    <div className="cell-sub">Modules</div>
                </div>
            </div>

            <h3 style={{ fontSize: 13, marginBottom: 8 }}>Student Roster</h3>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Code</th>
                            <th>Attendance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roster.length ? (
                            roster.map((s) => {
                                const att = attendanceSummaryForStudent(s.id, b.id);

                                return (
                                    <tr
                                        className="row-link"
                                        key={s.id}
                                        onClick={() => ctx.actions.viewStudent(s.id)}
                                    >
                                        <td className="cell-strong">{s.name}</td>
                                        <td>{s.code}</td>
                                        <td>{att.effectiveTotal > 0 ? `${att.pct}%` : '—'}</td>
                                        <td>
                                            <StatusBadge status={s.status} />
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="muted">
                                    No students in this batch view (demo subset).
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export function openBatchDetailModal(ctx, id) {
    const b = DB.batches.find((x) => x.id === id);

    if (!b) {
        return;
    }

    const course = DB.courses.find((c) => c.id === b.course_id);

    ctx.openModal({
        size: 'lg',
        title: b.name,
        sub: `${course.name} · ${sessionName(b.session_id)} · ${labName(b.lab_id)}`,
        body: <BatchDetailBody ctx={ctx} batch={b} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Close
                </button>
                {ctx.can('Batches', 'Edit') ? (
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                            ctx.closeModal();
                            ctx.actions.editBatch(b.id);
                        }}
                    >
                        <Icon name="edit" /> Edit Batch
                    </button>
                ) : null}
                {ctx.can('TeacherPayments', 'View') ? (
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => ctx.actions.goView('teacher-payments')}
                    >
                        <Icon name="graduationCap" /> Teacher Payments
                    </button>
                ) : null}
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => ctx.actions.goView('attendance')}
                >
                    <Icon name="attendance" /> Mark Attendance
                </button>
            </>
        ),
    });
}
