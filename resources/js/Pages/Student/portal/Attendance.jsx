/* Attendance — ported from renderPortalAttendance() in the prototype's portal.js. */

import { DB, attendanceRecordsForStudent, attendanceSummaryForStudent, batchName, fmtDate } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';

export default function Attendance({ student }) {
    const s = student;

    if (!s.courses.length) {
        return (
            <div className="empty-state">
                <Icon name="attendance" />
                <p>You're not enrolled in any course yet, so there's no attendance to show.</p>
            </div>
        );
    }

    return (
        <>
            {s.courses.map((enr, idx) => {
                const c = DB.courses.find((x) => x.id === enr.course_id);
                const att = attendanceSummaryForStudent(s.id, enr.batch_id);
                const history = attendanceRecordsForStudent(s.id, enr.batch_id).slice(0, 12);

                return (
                    <div className="card card-pad" style={{ marginBottom: 18 }} key={`${enr.course_id}-${enr.batch_id}-${idx}`}>
                        <div className="flex-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                            <b style={{ fontSize: 14 }}>{c?.name || '—'}</b>
                            <span className="cell-sub">{batchName(enr.batch_id)}</span>
                        </div>
                        <div className="flex-gap" style={{ alignItems: 'center', gap: 20, marginBottom: 14 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div
                                    style={{
                                        fontSize: 30,
                                        fontWeight: 800,
                                        color: att.effectiveTotal > 0 && att.pct < 70 ? 'var(--danger-600)' : 'var(--success-700)',
                                    }}
                                >
                                    {att.effectiveTotal > 0 ? `${att.pct}%` : '—'}
                                </div>
                                <div className="cell-sub">{att.effectiveTotal > 0 ? `${att.attended}/${att.effectiveTotal} sessions` : 'No data yet'}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="progress-track" style={{ marginBottom: 8 }}>
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${att.pct}%`,
                                            ...(att.effectiveTotal > 0 && att.pct < 70 ? { background: 'linear-gradient(90deg,#f87171,#ef4444)' } : {}),
                                        }}
                                    />
                                </div>
                                <div className="cell-sub">
                                    {att.present} present · {att.late} late · {att.absent} absent · {att.excused} excused
                                </div>
                            </div>
                        </div>
                        {att.effectiveTotal > 0 ? (
                            att.pct < 70 ? (
                                <div className="badge badge-red" style={{ marginBottom: 14 }}>
                                    <Icon name="alertCircle" /> Below 70% — certificate may be blocked until improved
                                </div>
                            ) : (
                                <div className="badge badge-green" style={{ marginBottom: 14 }}>
                                    <Icon name="checkCircle" /> Good standing
                                </div>
                            )
                        ) : null}
                        {history.length ? (
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
                                        {history.map((r) => (
                                            <tr key={r.id}>
                                                <td>{fmtDate(r.session.date)}</td>
                                                <td className="cell-strong">
                                                    {DB.courses.flatMap((cc) => cc.modules).find((m) => m.id === r.session.module_id)?.title ||
                                                        'General Session'}
                                                </td>
                                                <td>
                                                    <StatusBadge status={r.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="muted" style={{ fontSize: '12.5px' }}>
                                No sessions marked yet for this batch.
                            </p>
                        )}
                    </div>
                );
            })}
        </>
    );
}
