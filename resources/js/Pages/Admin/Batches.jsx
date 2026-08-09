/* Batches & Class Schedule — ported from renderBatches() and labsSectionHtml() in
   public/prototype/js/render-academic.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import {
    DB,
    batchEnrolledCount,
    batchName,
    batchSeatsAvailable,
    batchesUsingLab,
    courseName,
    effectiveBatchCapacity,
    fmtDate,
    isTeacherRole,
    labName,
    scopedBatchesForUser,
    sessionName,
    sum,
    userName,
} from '../../lib/db';
import { useIdentity } from '../../lib/identity';
import { Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useAcademicModals } from './academic/useAcademicModals';

function LabsSection({ actions, can }) {
    const canEdit = can('Batches', 'Edit');
    const canCreate = can('Batches', 'Create');

    return (
        <div className="card mb-0" style={{ marginBottom: 20 }}>
            <div className="card-header">
                <div>
                    <h3>
                        <Icon name="flask" /> Labs / Classrooms
                    </h3>
                    <p>
                        Create labs with a fixed seat capacity — assign one to each batch below so student intake is automatically capped
                    </p>
                </div>
                {canCreate ? (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => actions.addLab()}>
                        <Icon name="plus" /> Add Lab
                    </button>
                ) : null}
            </div>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Lab</th>
                            <th>Location</th>
                            <th>Capacity</th>
                            <th>Batches Using It</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {DB.labs.length ? (
                            DB.labs.map((l) => {
                                const usingBatches = batchesUsingLab(l.id);

                                return (
                                    <tr key={l.id}>
                                        <td className="cell-strong">{l.name}</td>
                                        <td>{l.location || '—'}</td>
                                        <td>{l.capacity} seats</td>
                                        <td>
                                            {usingBatches.length ? (
                                                usingBatches.map((b) => (
                                                    <span className="badge badge-blue" style={{ margin: 1 }} key={b.id}>
                                                        {b.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="muted">Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <StatusBadge status={l.status} />
                                        </td>
                                        <td>
                                            {canEdit ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost"
                                                    title="Edit lab"
                                                    onClick={() => actions.editLab(l.id)}
                                                >
                                                    <Icon name="edit" />
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="muted">
                                    No labs created yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function BatchesView() {
    const { userId, can } = useIdentity();
    const actions = useAcademicModals();

    const visibleBatches = scopedBatchesForUser(userId);
    const isScoped = isTeacherRole(userId);
    const todaySchedule = DB.classSchedule
        .filter((c) => visibleBatches.some((b) => b.id === c.batch_id))
        .filter((c) => c.date === '2026-08-06' || c.date === '2026-08-07');

    return (
        <>
            <div className="view-header">
                <div>
                    <h1>Batches &amp; Class Schedule</h1>
                    <p>{isScoped ? 'Showing only the batches assigned to you' : 'Batch/class structure, teacher assignment & timetable management'}</p>
                </div>
                <div className="view-actions">
                    {can('Batches', 'Create') ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => actions.addBatch()}>
                            <Icon name="plus" /> Create Batch
                        </button>
                    ) : null}
                </div>
            </div>

            {isScoped ? (
                <div className="badge badge-amber" style={{ marginBottom: 16 }}>
                    <Icon name="shield" /> You only have access to your assigned batches/courses. Ask an Admin to grant more access via Access
                    Control.
                </div>
            ) : null}

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="batch" label="Ongoing Batches" value={visibleBatches.filter((b) => b.status === 'ongoing').length} color="#ff6533" />
                <KpiCard
                    icon="calendar"
                    label="Upcoming Batches"
                    value={visibleBatches.filter((b) => b.status === 'upcoming').length}
                    color="#06b6d4"
                />
                <KpiCard
                    icon="checkCircle"
                    label="Completed Batches"
                    value={visibleBatches.filter((b) => b.status === 'completed').length}
                    color="#10b981"
                />
                <KpiCard
                    icon="students"
                    label="Total Enrolled (Active)"
                    value={sum(visibleBatches.filter((b) => b.status !== 'completed'), (b) => batchEnrolledCount(b.id))}
                    color="#f59e0b"
                />
            </div>

            {!isScoped ? <LabsSection actions={actions} can={can} /> : null}

            <div className="card mb-0" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <h3>{isScoped ? 'My Batches' : 'All Batches'}</h3>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Batch</th>
                                <th>Course</th>
                                <th>Session</th>
                                <th>Duration</th>
                                <th>Assigned Teacher(s)</th>
                                <th>Lab</th>
                                <th>Enrolled/Capacity</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {visibleBatches.map((b) => {
                                const seatsLeft = batchSeatsAvailable(b.id);
                                const teachers = b.assigned_teachers || [];

                                return (
                                    <tr key={b.id}>
                                        <td className="row-link cell-strong" onClick={() => actions.viewBatch(b.id)}>
                                            {b.name}
                                        </td>
                                        <td>{courseName(b.course_id)}</td>
                                        <td>{sessionName(b.session_id)}</td>
                                        <td>
                                            {fmtDate(b.start)} → {fmtDate(b.end)}
                                        </td>
                                        <td>
                                            {teachers.length ? (
                                                teachers.map((tid) => (
                                                    <span className="badge badge-purple" style={{ margin: 1 }} key={tid}>
                                                        {userName(tid)}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="muted">Unassigned</span>
                                            )}
                                        </td>
                                        <td>{labName(b.lab_id)}</td>
                                        <td>
                                            {batchEnrolledCount(b.id)}/{effectiveBatchCapacity(b)}{' '}
                                            {b.status !== 'completed' && seatsLeft <= 0 ? <span className="badge badge-red">Full</span> : null}
                                        </td>
                                        <td>
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td>
                                            {can('Batches', 'Edit') ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-ghost"
                                                        title="Assign/manage teachers"
                                                        onClick={() => actions.manageTeachers(b.id)}
                                                    >
                                                        <Icon name="user" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-ghost"
                                                        title="Edit batch"
                                                        onClick={() => actions.editBatch(b.id)}
                                                    >
                                                        <Icon name="edit" />
                                                    </button>
                                                </>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Class Timetable — Aug 6–7, 2026</h3>
                    <p>Session-wise room booking to avoid double-booking</p>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Batch</th>
                                <th>Module Covered</th>
                                <th>Teacher</th>
                                <th>Room</th>
                                <th>Mode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaySchedule.map((c) => (
                                <tr key={c.id}>
                                    <td>{fmtDate(c.date)}</td>
                                    <td className="cell-strong">
                                        {c.start} – {c.end}
                                    </td>
                                    <td>{batchName(c.batch_id)}</td>
                                    <td>
                                        {DB.courses
                                            .find((co) => co.modules.some((m) => m.id === c.module_id))
                                            ?.modules.find((m) => m.id === c.module_id)?.title || '—'}
                                    </td>
                                    <td>{userName(c.teacher_id)}</td>
                                    <td>{c.room}</td>
                                    <td>
                                        <StatusBadge status={c.mode === 'online' ? 'active' : 'ongoing'} label={c.mode} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default function Batches({ view }) {
    return (
        <AdminLayout view={view}>
            <BatchesView />
        </AdminLayout>
    );
}
