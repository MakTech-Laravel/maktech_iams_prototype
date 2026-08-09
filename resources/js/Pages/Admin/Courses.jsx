/* Departments & Courses — ported from renderCourses() in public/prototype/js/render-academic.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, deptName, fmtMoney } from '../../lib/db';
import { Icon, IconGlyph, StatusBadge } from '../../lib/ui';
import { useAcademicModals } from './academic/useAcademicModals';

function CoursesView() {
    const actions = useAcademicModals();

    return (
        <>
            <div className="view-header">
                <div>
                    <h1>Departments &amp; Courses</h1>
                    <p>Internal departments, course catalogue, pricing &amp; discount rules</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => actions.addDepartment()}>
                        <Icon name="plus" /> Add Department
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => actions.addCourse()}>
                        <Icon name="plus" /> Add Course
                    </button>
                </div>
            </div>

            <h3 className="report-section-title">Departments</h3>
            <div className="grid grid-4" style={{ marginBottom: 8 }}>
                {DB.departments.map((d) => {
                    const courses = DB.courses.filter((c) => c.dept_id === d.id);

                    return (
                        <div className="card card-pad" key={d.id}>
                            <div className="flex-gap" style={{ marginBottom: 6 }}>
                                <div className="kpi-icon" style={{ width: 32, height: 32, background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                                    <IconGlyph name="course" />
                                </div>
                                <b>{d.name}</b>
                            </div>
                            <div className="cell-sub" style={{ marginBottom: 8 }}>
                                {d.desc}
                            </div>
                            <div className="badge badge-blue">
                                {courses.length} course{courses.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    );
                })}
            </div>

            <h3 className="report-section-title">Course Catalogue</h3>
            <div className="filter-bar">
                <div className="search-input-wrap">
                    <Icon name="search" />
                    <input type="text" placeholder="Search course name or code…" />
                </div>
                <select>
                    <option>All Departments</option>
                    {DB.departments.map((d) => (
                        <option key={d.id}>{d.name}</option>
                    ))}
                </select>
                <select>
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Draft</option>
                    <option>Archived</option>
                </select>
            </div>

            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Department</th>
                                <th>Duration</th>
                                <th>Base Price</th>
                                <th>Discount</th>
                                <th>Seats</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB.courses.map((c) => {
                                const disc = c.discounts[0];

                                return (
                                    <tr className="row-link" key={c.id} onClick={() => actions.viewCourse(c.id)}>
                                        <td>
                                            <span className="cell-strong">{c.name}</span>
                                            <div className="cell-sub">{c.code}</div>
                                        </td>
                                        <td>{deptName(c.dept_id)}</td>
                                        <td>{c.duration_days} days</td>
                                        <td>{fmtMoney(c.base_price)}</td>
                                        <td>
                                            {disc ? (
                                                <span className="badge badge-amber">
                                                    {disc.type === 'percentage' ? `${disc.value}%` : fmtMoney(disc.value)}
                                                </span>
                                            ) : (
                                                <span className="muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            {c.enrolled}/{c.seats}
                                        </td>
                                        <td>
                                            <StatusBadge status={c.status} />
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

export default function Courses({ view }) {
    return (
        <AdminLayout view={view}>
            <CoursesView />
        </AdminLayout>
    );
}
