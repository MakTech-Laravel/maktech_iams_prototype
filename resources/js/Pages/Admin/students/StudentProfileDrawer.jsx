/* Student profile drawer — ported from studentProfileDrawer() in
   public/prototype/js/render-students.js, plus wireDrawerTabs() and the view-student /
   open-edit-student / open-migration / issue-idcard cases in public/prototype/js/app.js.

   The prototype re-opened the whole drawer to switch tabs; here the active tab is React state
   inside one component, so the same markup is produced without re-calling openDrawer. */

import { useCallback, useState } from 'react';
import {
    DB,
    STUDENT_STATUS_LABELS,
    attendanceRecordsForStudent,
    attendanceSummaryForStudent,
    batchName,
    fmtDate,
    fmtMoney,
    institutionName,
    invoiceForStudent,
    primaryEnrollment,
    studentById,
    userName,
} from '../../../lib/db';
import { useRefresh } from '../../../lib/hooks';
import { useIdentity } from '../../../lib/identity';
import { Icon, IconGlyph, MethodBadge, StatusBadge, Tabs } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useFinanceModals } from '../finance/useFinanceModals';
import { useAdditionalCourseModal } from './AdditionalCourseModal';
import { useChangeStudentStatusModal } from './ChangeStudentStatusModal';

const TABS = [
    { id: 'info', label: 'Profile' },
    { id: 'docs', label: 'Documents' },
    { id: 'courses', label: 'Courses & Modules' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'payments', label: 'Payments' },
];

export default function StudentProfileDrawer({ studentId, initialTab, onRefresh }) {
    const [tab, setTab] = useState(initialTab || 'info');
    const refreshDrawer = useRefresh();
    const { toast, closeDrawer } = useUi();
    const { can } = useIdentity();

    const refreshAll = useCallback(() => {
        refreshDrawer();
        onRefresh?.();
    }, [refreshDrawer, onRefresh]);

    const openStudent = useStudentDrawer(onRefresh);
    const openAdditionalCourse = useAdditionalCourseModal(
        useCallback(
            (sid) => {
                onRefresh?.();
                openStudent(sid, 'courses');
            },
            [onRefresh, openStudent],
        ),
    );
    const openChangeStatus = useChangeStudentStatusModal(refreshAll);

    /* The Payments tab and the Course Migration button reuse the finance module's own modals so
       there is a single implementation of each (open-migration / view-receipt / open-record-payment). */
    const { openMigrationRequest, openPaymentReceipt, openRecordPayment } = useFinanceModals(refreshAll);

    const s = studentById(studentId);

    if (!s) {
        return null;
    }

    const inv = invoiceForStudent(s.id);
    const enrollment = primaryEnrollment(s);
    const course = DB.courses.find((c) => c.id === enrollment?.course_id);
    const progress = DB.moduleProgress.filter((p) => p.student_id === s.id);
    const payments = DB.payments.filter((p) => p.student_id === s.id);

    return (
        <>
            <div className="flex-gap" style={{ marginBottom: 18, flexWrap: 'wrap' }}>
                <StatusBadge status={s.status} label={STUDENT_STATUS_LABELS[s.status]} />
                {s.profile_completed ? (
                    <span className="badge badge-green">
                        <Icon name="checkCircle" /> Profile Complete
                    </span>
                ) : (
                    <span className="badge badge-amber">
                        <Icon name="alertCircle" /> Profile Incomplete
                    </span>
                )}
            </div>

            <Tabs tabs={TABS} active={tab} onChange={setTab} />

            {tab === 'info' ? (
                <>
                    <div className="form-grid">
                        <div className="field">
                            <label>Full Name</label>
                            <div>{s.name}</div>
                        </div>
                        <div className="field">
                            <label>Student Code</label>
                            <div>{s.code}</div>
                        </div>
                        <div className="field">
                            <label>Date of Birth</label>
                            <div>{fmtDate(s.dob)}</div>
                        </div>
                        <div className="field">
                            <label>Gender</label>
                            <div>{s.gender}</div>
                        </div>
                        <div className="field">
                            <label>Phone (Portal Login)</label>
                            <div>{s.phone}</div>
                        </div>
                        <div className="field">
                            <label>Email</label>
                            <div>{s.email || '—'}</div>
                        </div>
                        <div className="field span-2">
                            <label>Present Address</label>
                            <div>{s.present_address}</div>
                        </div>
                        <div className="field span-2">
                            <label>Permanent Address</label>
                            <div>{s.permanent_address}</div>
                        </div>
                        <div className="field">
                            <label>Institution</label>
                            <div>{institutionName(s.institution_id)}</div>
                        </div>
                        <div className="field">
                            <label>Roll/Reg No.</label>
                            <div>
                                {s.roll} ({s.passing_year})
                            </div>
                        </div>
                        <div className="field">
                            <label>Guardian</label>
                            <div>
                                {s.guardian_name} ({s.guardian_relation})
                            </div>
                        </div>
                        <div className="field">
                            <label>Guardian Phone</label>
                            <div>{s.guardian_phone}</div>
                        </div>
                    </div>
                    <div className="hr" />
                    <div className="flex-gap">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => toast('Edit form would open here (demo)')}>
                            <Icon name="edit" /> Edit Profile
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                                closeDrawer();
                                openMigrationRequest(s.id);
                            }}
                        >
                            <Icon name="swap" /> Course Migration
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                                closeDrawer();
                                toast('ID card generated & queued for printing');
                            }}
                        >
                            <Icon name="idcard" /> Issue ID Card
                        </button>
                        {can('Students', 'ChangeStatus') ? (
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openChangeStatus(s.id)}>
                                <Icon name="shield" /> Change Status
                            </button>
                        ) : null}
                    </div>
                </>
            ) : null}

            {tab === 'docs' ? (
                <>
                    <div className="grid grid-2">
                        {s.documents.map((d, i) => (
                            <div className="card card-pad flex-gap" key={i}>
                                <div
                                    className="kpi-icon"
                                    style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary-600)' }}
                                >
                                    <IconGlyph name="file" />
                                </div>
                                <div>
                                    <b style={{ fontSize: '12.8px', display: 'block' }}>{d.name}</b>
                                    <span className="cell-sub">{d.type.toUpperCase()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="hr" />
                    <div
                        className="flex-gap"
                        style={{
                            border: '1.5px dashed var(--gray-300)',
                            borderRadius: 10,
                            padding: 16,
                            justifyContent: 'center',
                            color: 'var(--gray-400)',
                        }}
                    >
                        <Icon name="upload" /> Upload additional document (demo)
                    </div>
                </>
            ) : null}

            {tab === 'courses' ? (
                <>
                    <div className="badge badge-gray" style={{ marginBottom: 12 }}>
                        <Icon name="shield" /> Enrollment policy: each student has ONE primary course &amp; batch. Admin can add extra enrollments
                        below — always tagged &amp; reasoned for history/reporting.
                    </div>
                    {s.courses.map((enr, idx) => {
                        const c = DB.courses.find((x) => x.id === enr.course_id);
                        const isPrimary = enr.type !== 'additional';

                        return (
                            <div
                                className="card card-pad"
                                key={idx}
                                style={{ marginBottom: 12, ...(isPrimary ? {} : { borderColor: 'var(--accent-2)' }) }}
                            >
                                <div className="flex-between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                                    <div className="flex-gap">
                                        {isPrimary ? (
                                            <span className="badge badge-blue">
                                                <Icon name="checkCircle" /> Primary Enrollment
                                            </span>
                                        ) : (
                                            <span className="badge badge-amber">
                                                <Icon name="alertCircle" /> Additional (Admin Override)
                                            </span>
                                        )}
                                        <StatusBadge status={enr.status} />
                                    </div>
                                </div>
                                <b style={{ display: 'block', marginBottom: 4 }}>{c?.name || '—'}</b>
                                <div className="cell-sub">
                                    Batch: {batchName(enr.batch_id)} · Enrolled: {fmtDate(enr.date)}
                                </div>
                                <div className="cell-sub">
                                    Price: {fmtMoney(enr.enrolled_price)} (discount {fmtMoney(enr.discount)} applied)
                                </div>
                                {!isPrimary ? (
                                    <>
                                        <div className="hr" />
                                        <div className="cell-sub">
                                            <b>Reason:</b> {enr.added_reason || '—'}
                                        </div>
                                        <div className="cell-sub">
                                            <b>Added by:</b> {userName(enr.added_by)} on {fmtDate(enr.added_date)}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        );
                    })}
                    <div className="hr" />
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                            closeDrawer();
                            openAdditionalCourse(s.id);
                        }}
                    >
                        <Icon name="plus" /> Add Additional Course (Admin Override)
                    </button>
                    <div className="hr" />
                    <h3 style={{ fontSize: 13, marginBottom: 10 }}>Module Progress — {course?.name || 'Primary Course'}</h3>
                    {course ? (
                        course.modules.map((m) => {
                            const p = progress.find((pr) => pr.module_id === m.id);
                            const st = p?.status || 'not_started';
                            const pct = st === 'completed' ? 100 : st === 'in_progress' ? 50 : 0;

                            return (
                                <div style={{ marginBottom: 14 }} key={m.id}>
                                    <div className="flex-between" style={{ marginBottom: 5, fontSize: '12.5px' }}>
                                        <span>
                                            <b>{m.seq}.</b> {m.title}
                                        </span>
                                        <StatusBadge status={st} />
                                    </div>
                                    <div className="progress-track sm">
                                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="muted">No module data.</div>
                    )}
                </>
            ) : null}

            {tab === 'attendance' ? (
                !s.courses.length ? (
                    <div className="empty-state">
                        <Icon name="attendance" />
                        <p>Not enrolled in any batch yet — no attendance to show.</p>
                    </div>
                ) : (
                    s.courses.map((enr, idx) => {
                        const c = DB.courses.find((x) => x.id === enr.course_id);
                        const att = attendanceSummaryForStudent(s.id, enr.batch_id);
                        const records = attendanceRecordsForStudent(s.id, enr.batch_id).slice(0, 10);

                        return (
                            <div className="card card-pad" style={{ marginBottom: 10 }} key={idx}>
                                <div className="flex-between" style={{ marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                                    <b style={{ fontSize: 13 }}>
                                        {c?.name || '—'} <span className="cell-sub">({batchName(enr.batch_id)})</span>
                                    </b>
                                    {enr.type === 'additional' ? <span className="badge badge-amber">Additional</span> : null}
                                </div>
                                <div
                                    className="flex-gap"
                                    style={{ alignItems: 'center', gap: 16, marginBottom: records.length ? 12 : 0 }}
                                >
                                    <div
                                        style={{
                                            fontSize: 26,
                                            fontWeight: 800,
                                            color: att.effectiveTotal > 0 && att.pct < 70 ? 'var(--danger-600)' : 'var(--success-700)',
                                        }}
                                    >
                                        {att.effectiveTotal > 0 ? `${att.pct}%` : '—'}
                                    </div>
                                    <div className="cell-sub">
                                        {att.effectiveTotal > 0
                                            ? `${att.attended} attended out of ${att.effectiveTotal} sessions (${att.present} present, ${att.late} late, ${att.absent} absent, ${att.excused} excused)`
                                            : 'No attendance recorded yet for this batch.'}
                                    </div>
                                </div>
                                {att.effectiveTotal > 0 && att.pct < 70 ? (
                                    <div className="badge badge-red" style={{ marginBottom: 12 }}>
                                        <Icon name="alertCircle" /> Low attendance — certificate may be blocked
                                    </div>
                                ) : null}
                                {records.length ? (
                                    <div className="table-wrap">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Module</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {records.map((r) => (
                                                    <tr key={r.id}>
                                                        <td>{fmtDate(r.session.date)}</td>
                                                        <td>
                                                            {DB.courses.flatMap((cc) => cc.modules).find((m) => m.id === r.session.module_id)
                                                                ?.title || 'General Session'}
                                                        </td>
                                                        <td>
                                                            <StatusBadge status={r.status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })
                )
            ) : null}

            {tab === 'payments' ? (
                <>
                    <div className="grid grid-3" style={{ marginBottom: 16 }}>
                        <div className="card card-pad" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 15, fontWeight: 800 }}>{fmtMoney(inv?.total)}</div>
                            <div className="cell-sub">Total Fee</div>
                        </div>
                        <div className="card card-pad" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--success-700)' }}>{fmtMoney(inv?.paid)}</div>
                            <div className="cell-sub">Paid</div>
                        </div>
                        <div className="card card-pad" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: inv?.due > 0 ? 'var(--danger-600)' : 'var(--success-700)' }}>
                                {fmtMoney(inv?.due)}
                            </div>
                            <div className="cell-sub">Due</div>
                        </div>
                    </div>
                    <h3 style={{ fontSize: 13, marginBottom: 10 }}>Payment History</h3>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Receipt</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length ? (
                                    payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="cell-strong">{p.receipt_no}</td>
                                            <td>{fmtMoney(p.amount)}</td>
                                            <td>
                                                <MethodBadge method={p.method} />
                                            </td>
                                            <td>{fmtDate(p.date)}</td>
                                            <td>
                                                <StatusBadge status={p.status} />
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-ghost" onClick={() => openPaymentReceipt(p.id)}>
                                                    <Icon name="printer" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="muted">
                                            No payments yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="hr" />
                    {can('Payments', 'Create') ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => openRecordPayment(s.id)}>
                            <Icon name="plus" /> Record New Payment
                        </button>
                    ) : null}
                </>
            ) : null}
        </>
    );
}

/* Replaces the prototype's `data-action="view-student"` handler:
   closeDrawer(); closeModal(); studentProfileDrawer(id). */
export function useStudentDrawer(onRefresh) {
    const { openDrawer, closeModal } = useUi();

    return useCallback(
        (id, tab) => {
            const s = studentById(Number(id));

            if (!s) {
                return;
            }

            closeModal();
            openDrawer({
                title: s.name,
                sub: `${s.code} · ${s.phone}`,
                body: <StudentProfileDrawer key={`${s.id}:${tab || 'info'}`} studentId={s.id} initialTab={tab} onRefresh={onRefresh} />,
            });
        },
        [openDrawer, closeModal, onRefresh],
    );
}
