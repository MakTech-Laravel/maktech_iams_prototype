/* My Course — ported from renderPortalCourse() in the prototype's portal.js. */

import { DB, batchName, fmtDate, fmtMoney } from '../../../lib/db';
import { Icon, KpiCard, StatusBadge } from '../../../lib/ui';
import ModuleRow from './ModuleRow';

export default function Course({ student, onNavigate }) {
    const s = student;
    const enr = s.courses[0];
    const course = DB.courses.find((c) => c.id === enr?.course_id);

    if (!course) {
        return (
            <div className="empty-state">
                <Icon name="bookOpen" />
                <p>No course enrolled yet.</p>
                <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => onNavigate('browse')}>
                    <Icon name="plus" /> Browse Courses
                </button>
            </div>
        );
    }

    const progress = DB.moduleProgress.filter((p) => p.student_id === s.id);

    return (
        <>
            <div className="view-header">
                <div>
                    <h2 className="view-subject">{course.name}</h2>
                </div>
                <div className="view-actions">
                    <StatusBadge status={enr.status} />
                </div>
            </div>

            <div className="grid grid-3" style={{ marginBottom: 20 }}>
                <KpiCard icon="batch" label="Batch" value={batchName(enr.batch_id)} color="#ff6533" />
                <KpiCard icon="calendar" label="Enrolled On" value={fmtDate(enr.date)} color="#06b6d4" />
                <KpiCard icon="payment" label="Enrolled Price" value={fmtMoney(enr.enrolled_price)} color="#10b981" />
            </div>

            <div className="card course-progress-card">
                <h3 style={{ margin: '0 0 14px', fontSize: '14.5px' }}>Curriculum Modules</h3>
                {course.modules.map((m) => (
                    <ModuleRow key={m.id} module={m} status={progress.find((pr) => pr.module_id === m.id)?.status || 'not_started'} />
                ))}
            </div>

            <div className="card mt-16 card-pad">
                <h3 style={{ margin: '0 0 10px', fontSize: '14.5px' }}>Course Description</h3>
                <p className="muted" style={{ fontSize: 13 }}>
                    {course.desc}
                </p>
            </div>
        </>
    );
}
