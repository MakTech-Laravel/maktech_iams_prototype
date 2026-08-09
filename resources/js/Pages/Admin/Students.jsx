/* Student Directory — ported from renderStudents() in public/prototype/js/render-students.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import {
    DB,
    STUDENT_STATUS_LABELS,
    additionalEnrollments,
    allowedStudentStatusKeys,
    batchName,
    courseName,
    institutionName,
    invoiceForStudent,
    isTeacherRole,
    primaryEnrollment,
    scopedStudentsForUser,
    visibleStudentsForUser,
} from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { useIdentity } from '../../lib/identity';
import { Avatar, Icon, KpiCard, Pagination, StatusBadge } from '../../lib/ui';
import { useAddStudentModal } from './students/AddStudentModal';
import { useChangeStudentStatusModal } from './students/ChangeStudentStatusModal';
import { useStudentDrawer } from './students/StudentProfileDrawer';

const STATUS_FILTER_LABELS = { Active: 'Active', Dropped: 'Dropped', OnHold: 'On Hold', Completed: 'Completed/Certified' };

export default function Students({ view }) {
    const { userId, can } = useIdentity();
    const refresh = useRefresh();
    const openStudent = useStudentDrawer(refresh);
    const openAddStudent = useAddStudentModal(refresh);
    const openChangeStatus = useChangeStudentStatusModal(refresh);

    const isScoped = isTeacherRole(userId);
    const scoped = isScoped ? scopedStudentsForUser(userId) : DB.students;
    const students = visibleStudentsForUser(userId, scoped);
    const hiddenByListPerm = scoped.length - students.length;
    const canChangeStatus = can('Students', 'ChangeStatus');

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Student Directory</h1>
                    <p>
                        {isScoped
                            ? 'Showing only students enrolled in your assigned batches'
                            : `${DB.students.length} students · registered, active, and alumni across all courses`}
                    </p>
                </div>
                <div className="view-actions">
                    {can('Students', 'Create') ? (
                        <>
                            <button type="button" className="btn btn-secondary btn-sm">
                                <Icon name="upload" /> Bulk Import
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={openAddStudent}>
                                <Icon name="plus" /> Register Student
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            {isScoped ? (
                <div className="badge badge-amber" style={{ marginBottom: 16 }}>
                    <Icon name="shield" /> You only have access to students in your assigned batches/courses.
                </div>
            ) : null}

            {hiddenByListPerm > 0 ? (
                <div className="badge badge-gray" style={{ whiteSpace: 'normal', textAlign: 'left', marginBottom: 16 }}>
                    <Icon name="lock" /> {hiddenByListPerm} student(s) hidden — you don't have permission to view one or more status lists
                    (Active/Dropped/On Hold/Completed). Ask Admin to grant access via Access Control.
                </div>
            ) : null}

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="students" label="Total Students" value={students.length} color="#ff6533" />
                <KpiCard icon="checkCircle" label="Active" value={students.filter((s) => s.status === 'active').length} color="#10b981" />
                <KpiCard
                    icon="certificate"
                    label="Completed / Certified"
                    value={students.filter((s) => ['completed', 'certified'].includes(s.status)).length}
                    color="#8b5cf6"
                />
                <KpiCard
                    icon="alertCircle"
                    label="Dropped / On Hold"
                    value={students.filter((s) => ['dropped', 'on_hold'].includes(s.status)).length}
                    color="#ef4444"
                />
            </div>

            <div className="filter-bar">
                <div className="search-input-wrap">
                    <Icon name="search" />
                    <input type="text" placeholder="Search by name, code or phone…" />
                </div>
                <select>
                    <option>All Courses</option>
                    {DB.courses.map((c) => (
                        <option key={c.id}>{c.name}</option>
                    ))}
                </select>
                <select>
                    <option>All Batches</option>
                    {DB.batches.map((b) => (
                        <option key={b.id}>{b.name}</option>
                    ))}
                </select>
                <select>
                    <option>All Institutes</option>
                    {DB.institutions.map((i) => (
                        <option key={i.id}>{i.name}</option>
                    ))}
                </select>
                <select>
                    <option>All Status</option>
                    {allowedStudentStatusKeys(userId).map((k) => (
                        <option key={k}>{STATUS_FILTER_LABELS[k]}</option>
                    ))}
                </select>
            </div>

            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th />
                                <th>Student</th>
                                <th>Institution</th>
                                <th>Course</th>
                                <th>Batch</th>
                                <th>Phone</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s) => {
                                const inv = invoiceForStudent(s.id);
                                const primary = primaryEnrollment(s);
                                const extra = additionalEnrollments(s).length;

                                return (
                                    <tr className="row-link" key={s.id} onClick={() => openStudent(s.id)}>
                                        <td>
                                            <Avatar name={s.name} size="sm" photo={s.photo} />
                                        </td>
                                        <td>
                                            <span className="cell-strong">{s.name}</span>
                                            <div className="cell-sub">{s.code}</div>
                                        </td>
                                        <td>{institutionName(s.institution_id)}</td>
                                        <td>
                                            {courseName(primary?.course_id)}{' '}
                                            {extra ? (
                                                <span className="badge badge-amber" title={`Has ${extra} additional admin-added enrollment(s)`}>
                                                    +{extra} more
                                                </span>
                                            ) : null}
                                        </td>
                                        <td>{batchName(primary?.batch_id)}</td>
                                        <td>{s.phone}</td>
                                        <td>{inv ? <StatusBadge status={inv.status} /> : <span className="muted">—</span>}</td>
                                        <td>
                                            <StatusBadge status={s.status} label={STUDENT_STATUS_LABELS[s.status]} />
                                        </td>
                                        <td>
                                            {canChangeStatus ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost"
                                                    title="Change status"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openChangeStatus(s.id);
                                                    }}
                                                >
                                                    <Icon name="swap" />
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination total={students.length} shown={students.length} />
            </div>
        </AdminLayout>
    );
}
