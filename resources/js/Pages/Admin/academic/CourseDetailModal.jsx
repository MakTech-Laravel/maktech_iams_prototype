/* Course detail modal — ported from courseDetailModal() in public/prototype/js/render-academic.js. */

import { DB, batchesInSession, deptName, fmtDate, fmtMoney, sessionsForCourse, userName } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';

function CourseDetailBody({ ctx, course: c }) {
    const sessions = sessionsForCourse(c.id);
    const teacherIds = [...new Set(DB.batches.filter((b) => b.course_id === c.id).flatMap((b) => b.assigned_teachers || []))];

    return (
        <>
            <div className="flex-gap" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
                <StatusBadge status={c.status} />
                <span className="badge badge-blue">{c.duration_days} days</span>
                <span className="badge badge-gray">
                    {c.enrolled}/{c.seats} seats filled
                </span>
            </div>

            {teacherIds.length ? (
                <div className="flex-gap" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
                    <span className="cell-sub">Teachers across this course's batches:</span>
                    {teacherIds.map((tid) => (
                        <span className="badge badge-purple" key={tid}>
                            {userName(tid)}
                        </span>
                    ))}
                </div>
            ) : null}

            <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
                {c.desc}
            </p>

            <div className="grid grid-3" style={{ marginBottom: 20 }}>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{fmtMoney(c.base_price)}</div>
                    <div className="cell-sub">Base Price</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{c.discounts.length}</div>
                    <div className="cell-sub">Active Discount Rules</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{c.modules.length}</div>
                    <div className="cell-sub">Curriculum Modules</div>
                </div>
            </div>

            <div className="flex-between" style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 13, margin: 0 }}>Sessions</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                        ctx.closeModal();
                        ctx.actions.addSession(c.id);
                    }}
                >
                    <Icon name="plus" /> Add Session
                </button>
            </div>
            <div className="table-wrap" style={{ marginBottom: 20 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Session</th>
                            <th>Duration</th>
                            <th>Batches</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.length ? (
                            sessions.map((s) => (
                                <tr
                                    className="row-link"
                                    key={s.id}
                                    onClick={() => {
                                        ctx.closeModal();
                                        ctx.actions.viewSession(s.id);
                                    }}
                                >
                                    <td className="cell-strong">{s.name}</td>
                                    <td>
                                        {fmtDate(s.start)} → {fmtDate(s.end)}
                                    </td>
                                    <td>{batchesInSession(s.id).length}</td>
                                    <td>
                                        <StatusBadge status={s.status} />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="muted">
                                    No sessions yet — add one to start creating batches.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {c.discounts.length ? (
                <>
                    <h3 style={{ fontSize: 13, marginBottom: 8 }}>Discount Rules</h3>
                    <div className="table-wrap" style={{ marginBottom: 20 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Value</th>
                                    <th>Reason</th>
                                    <th>Valid Period</th>
                                </tr>
                            </thead>
                            <tbody>
                                {c.discounts.map((d, i) => (
                                    <tr key={i}>
                                        <td>{d.type}</td>
                                        <td>{d.type === 'percentage' ? `${d.value}%` : fmtMoney(d.value)}</td>
                                        <td>{d.reason}</td>
                                        <td>
                                            {fmtDate(d.from)} – {fmtDate(d.to)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}

            <div className="flex-between" style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 13, margin: 0 }}>Curriculum Modules (Sequenced)</h3>
                {ctx.can('Courses', 'Edit') ? (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                            ctx.closeModal();
                            ctx.actions.manageCurriculum(c.id);
                        }}
                    >
                        <Icon name="edit" /> Manage Curriculum
                    </button>
                ) : null}
            </div>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Module</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {c.modules.length ? (
                            c.modules.map((m) => (
                                <tr key={m.id}>
                                    <td>{m.seq}</td>
                                    <td className="cell-strong">{m.title}</td>
                                    <td>{m.hours} hrs</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="muted">
                                    No curriculum modules yet — click "Manage Curriculum" to add some. Students will see these on their
                                    portal's module progress tracker.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export function openCourseDetailModal(ctx, id) {
    const c = DB.courses.find((x) => x.id === id);

    if (!c) {
        return;
    }

    ctx.openModal({
        size: 'lg',
        title: c.name,
        sub: `${c.code} · ${deptName(c.dept_id)}`,
        body: <CourseDetailBody ctx={ctx} course={c} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Close
                </button>
                {ctx.can('Courses', 'Edit') ? (
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                            ctx.closeModal();
                            ctx.actions.editCourse(c.id);
                        }}
                    >
                        <Icon name="edit" /> Edit Course
                    </button>
                ) : null}
            </>
        ),
    });
}
