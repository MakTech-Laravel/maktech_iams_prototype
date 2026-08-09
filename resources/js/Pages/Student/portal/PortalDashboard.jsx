/* Portal dashboard — ported from renderPortalDashboard() in the prototype's portal.js. */

import {
    DB,
    attendanceSummaryForStudent,
    batchName,
    courseName,
    fmtDate,
    fmtMoney,
    invoiceForStudent,
    pendingEnrollmentRequest,
    sessionName,
} from '../../../lib/db';
import { Icon, KpiCard } from '../../../lib/ui';
import ModuleRow from './ModuleRow';

export default function PortalDashboard({ student, onNavigate }) {
    const s = student;
    const inv = invoiceForStudent(s.id);
    const enr = s.courses[0];
    const course = DB.courses.find((c) => c.id === enr?.course_id);
    const progress = DB.moduleProgress.filter((p) => p.student_id === s.id);
    const completedCount = progress.filter((p) => p.status === 'completed').length;
    const pct = course ? Math.round((completedCount / course.modules.length) * 100) : 0;
    const att = enr ? attendanceSummaryForStudent(s.id, enr.batch_id) : { pct: 0, effectiveTotal: 0 };
    const overdue = inv?.status === 'overdue';
    const pendingReq = pendingEnrollmentRequest(s.id);

    return (
        <>
            <div className="portal-hero">
                <h2>Welcome back, {s.name.split(' ')[0]} 👋</h2>
                <p>
                    {course ? course.name : 'No active course'} · {batchName(enr?.batch_id)} · Keep up the good progress!
                </p>
            </div>

            {pendingReq ? (
                <div className="due-banner" style={{ background: 'var(--info-50)', borderColor: '#bfdbfe', color: 'var(--info-700)' }}>
                    <div className="ic-wrap">
                        <Icon name="clock" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <b>Enrollment Request Pending</b> — Your request to enroll in <b>{courseName(pendingReq.course_id)}</b> (
                        {sessionName(pendingReq.session_id)} · {batchName(pendingReq.batch_id)}) is awaiting Admin approval. You'll be notified once
                        it's reviewed.
                    </div>
                </div>
            ) : !course ? (
                <div className="due-banner" style={{ background: 'var(--success-50)', borderColor: '#a7f3d0', color: 'var(--success-700)' }}>
                    <div className="ic-wrap">
                        <Icon name="bookOpen" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <b>You're not enrolled in any course yet.</b> Browse our industrial attachment courses and enroll — pay online now, or
                        request enrollment and pay later.
                    </div>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => onNavigate('browse')}>
                        Browse Courses
                    </button>
                </div>
            ) : null}

            {inv && inv.due > 0 ? (
                <div className={`due-banner ${overdue ? 'danger' : ''}`.trim()}>
                    <div className="ic-wrap">
                        <Icon name="alertCircle" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <b>{overdue ? 'Payment Overdue' : 'Upcoming Payment Due'}</b> — {fmtMoney(inv.due)} due {overdue ? 'since' : 'on'}{' '}
                        {fmtDate(inv.due_date)}. You can pay online here, or in person at the office — either way you'll get a printable receipt.
                    </div>
                    <button type="button" className={`btn btn-sm ${overdue ? 'btn-danger' : 'btn-primary'}`} onClick={() => onNavigate('payments')}>
                        Pay Now
                    </button>
                </div>
            ) : null}

            <div className="grid grid-4" style={{ marginBottom: 22 }}>
                <KpiCard icon="bookOpen" label="Course Progress" value={`${pct}%`} color="#ff6533" />
                <KpiCard
                    icon="attendance"
                    label="Attendance"
                    value={att.effectiveTotal > 0 ? `${att.pct}%` : '—'}
                    color={att.effectiveTotal > 0 && att.pct < 70 ? '#ef4444' : '#10b981'}
                />
                <KpiCard icon="wallet" label="Amount Due" value={fmtMoney(inv?.due || 0)} color={inv?.due > 0 ? '#f59e0b' : '#10b981'} />
                <KpiCard icon="calendar" label="Next Class" value="Tomorrow 10 AM" color="#06b6d4" />
            </div>

            <div className="grid grid-3" style={{ alignItems: 'start' }}>
                <div className="card course-progress-card" style={{ gridColumn: 'span 2' }}>
                    <div className="flex-between" style={{ marginBottom: 14 }}>
                        <h3 style={{ margin: 0, fontSize: '14.5px' }}>Module Progress — {course?.name || ''}</h3>
                        <span className="badge badge-blue">
                            {completedCount}/{course?.modules.length || 0} done
                        </span>
                    </div>
                    {course ? (
                        course.modules.map((m) => (
                            <ModuleRow key={m.id} module={m} status={progress.find((pr) => pr.module_id === m.id)?.status || 'not_started'} />
                        ))
                    ) : (
                        <p className="muted">No course assigned yet.</p>
                    )}
                </div>
                <div className="card card-pad">
                    <h3 style={{ margin: '0 0 14px', fontSize: '14.5px' }}>Quick Actions</h3>
                    <div className="flex-gap" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                        <button type="button" className="btn btn-secondary btn-block" onClick={() => onNavigate('payments')}>
                            <Icon name="payment" /> View Payment History
                        </button>
                        <button type="button" className="btn btn-secondary btn-block" onClick={() => onNavigate('attendance')}>
                            <Icon name="attendance" /> Check Attendance
                        </button>
                        <button type="button" className="btn btn-secondary btn-block" onClick={() => onNavigate('certificate')}>
                            <Icon name="certificate" /> Certificate Status
                        </button>
                        <button type="button" className="btn btn-secondary btn-block" onClick={() => onNavigate('support')}>
                            <Icon name="ticket" /> Raise a Support Ticket
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
