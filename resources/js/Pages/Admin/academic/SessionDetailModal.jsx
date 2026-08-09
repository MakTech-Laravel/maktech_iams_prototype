/* Session detail modal — ported from sessionDetailModal() in public/prototype/js/render-academic.js. */

import { DB, batchEnrolledCount, batchesInSession, courseName, effectiveBatchCapacity, fmtDate, labName, sum, userName } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';

function SessionDetailBody({ ctx, session: s }) {
    const batches = batchesInSession(s.id);

    return (
        <>
            <div className="flex-gap" style={{ marginBottom: 18 }}>
                <StatusBadge status={s.status} />
                <span className="badge badge-gray">
                    {batches.length} batch{batches.length !== 1 ? 'es' : ''}
                </span>
                <span className="badge badge-blue">{sum(batches, (b) => batchEnrolledCount(b.id))} students total</span>
            </div>
            <div className="flex-between" style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 13, margin: 0 }}>Batches in this Session</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                        ctx.closeModal();
                        ctx.actions.addBatch(s.id);
                    }}
                >
                    <Icon name="plus" /> Add Batch
                </button>
            </div>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Batch</th>
                            <th>Assigned Teacher(s)</th>
                            <th>Lab</th>
                            <th>Capacity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.length ? (
                            batches.map((b) => (
                                <tr
                                    className="row-link"
                                    key={b.id}
                                    onClick={() => {
                                        ctx.closeModal();
                                        ctx.actions.viewBatch(b.id);
                                    }}
                                >
                                    <td className="cell-strong">{b.name}</td>
                                    <td>{(b.assigned_teachers || []).map((tid) => userName(tid)).join(', ') || '—'}</td>
                                    <td>{labName(b.lab_id)}</td>
                                    <td>
                                        {batchEnrolledCount(b.id)}/{effectiveBatchCapacity(b)}
                                    </td>
                                    <td>
                                        <StatusBadge status={b.status} />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="muted">
                                    No batches yet in this session — add one to start enrolling students.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export function openSessionDetailModal(ctx, id) {
    const s = DB.sessions.find((x) => x.id === id);

    if (!s) {
        return;
    }

    ctx.openModal({
        size: 'lg',
        title: s.name,
        sub: `${courseName(s.course_id)} · ${fmtDate(s.start)} → ${fmtDate(s.end)}`,
        body: <SessionDetailBody ctx={ctx} session={s} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Close
                </button>
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                        ctx.closeModal();
                        ctx.actions.viewCourse(s.course_id);
                    }}
                >
                    <Icon name="course" /> View Course
                </button>
            </>
        ),
    });
}
