/* Attendance — ported from renderAttendance(), wireAttendancePage(), attendancePane(),
   attendanceBatchReportPane() and attendanceOverviewPane() in
   public/prototype/js/render-students.js, plus the goto-attendance-batch case in
   public/prototype/js/app.js.

   The prototype's `currentAttTab` / `currentAttBatchId` / `currentAttDate` / `currentAttModuleId`
   module globals become page state here; the batch selection is deliberately shared between the
   Mark Attendance and Batch Report tabs, exactly as the globals were. */

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    DB,
    TODAY,
    allBatchAttendanceSummaries,
    attendanceSummaryForBatch,
    courseName,
    isTeacherRole,
    lowAttendanceStudents,
    scopedBatchesForUser,
    sum,
} from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { useIdentity } from '../../lib/identity';
import { Icon, KpiCard, StatusBadge, Tabs } from '../../lib/ui';
import AttendanceGrid from './students/AttendanceGrid';
import { useStudentDrawer } from './students/StudentProfileDrawer';

function MarkPane({ batches, batch, date, moduleId, onBatchChange, onDateChange, onModuleChange, onSaved }) {
    if (!batches.length) {
        return (
            <div className="empty-state">
                <Icon name="batch" />
                <p>No batches available to mark attendance for.</p>
            </div>
        );
    }

    return (
        <AttendanceGrid
            key={`${batch.id}|${date}|${moduleId ?? ''}`}
            batches={batches}
            batch={batch}
            date={date}
            moduleId={moduleId}
            onBatchChange={onBatchChange}
            onDateChange={onDateChange}
            onModuleChange={onModuleChange}
            onSaved={onSaved}
        />
    );
}

function BatchReportPane({ batches, batch, onBatchChange, onViewStudent }) {
    if (!batches.length) {
        return (
            <div className="empty-state">
                <Icon name="batch" />
                <p>No batches available.</p>
            </div>
        );
    }

    const summary = attendanceSummaryForBatch(batch.id);
    const rows = summary.rows.slice().sort((a, b) => a.pct - b.pct);

    return (
        <>
            <div className="filter-bar">
                <select value={batch.id} onChange={(event) => onBatchChange(Number(event.target.value))}>
                    {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name} — {courseName(b.course_id)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="grid grid-3" style={{ marginBottom: 18 }}>
                <KpiCard icon="attendance" label="Batch Average" value={`${summary.avgPct}%`} color={summary.avgPct < 70 ? '#ef4444' : '#10b981'} />
                <KpiCard icon="calendar" label="Sessions Held" value={summary.sessionsHeld} color="#8b5cf6" />
                <KpiCard
                    icon="alertCircle"
                    label="Students Below 70%"
                    value={summary.rows.filter((r) => r.effectiveTotal > 0 && r.pct < 70).length}
                    color="#f59e0b"
                />
            </div>
            <div className="card">
                <div className="card-header">
                    <h3>Attendance % — {batch.name}</h3>
                    <p>Auto-calculated from every marked session · click a row for the full student profile</p>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Code</th>
                                <th>Attended/Total</th>
                                <th>Progress</th>
                                <th>%</th>
                                <th>Flag</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length ? (
                                rows.map((r) => (
                                    <tr className="row-link" key={r.student.id} onClick={() => onViewStudent(r.student.id)}>
                                        <td className="cell-strong">{r.student.name}</td>
                                        <td>{r.student.code}</td>
                                        <td>
                                            {r.attended}/{r.effectiveTotal}
                                        </td>
                                        <td style={{ minWidth: 140 }}>
                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${r.pct}%`,
                                                        ...(r.pct < 70 ? { background: 'linear-gradient(90deg,#f87171,#ef4444)' } : {}),
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td>{r.pct}%</td>
                                        <td>
                                            {r.effectiveTotal === 0 ? (
                                                <span className="muted">No data</span>
                                            ) : r.pct < 70 ? (
                                                <StatusBadge status="absent" label="Low Attendance" />
                                            ) : (
                                                <StatusBadge status="present" label="Good" />
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="muted">
                                        No sessions recorded for this batch yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function OverviewPane({ onGotoBatch, onViewStudent }) {
    const summaries = allBatchAttendanceSummaries();
    const low = lowAttendanceStudents();
    const orgAvg = summaries.length ? Math.round(sum(summaries, (s) => s.avgPct) / summaries.length) : 0;

    return (
        <>
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="attendance" label="Org-wide Avg Attendance" value={`${orgAvg}%`} color="#3b82f6" />
                <KpiCard icon="batch" label="Batches Tracked" value={summaries.length} color="#ff6533" />
                <KpiCard icon="alertCircle" label="Students Below 70%" value={low.length} color="#ef4444" />
                <KpiCard icon="checkCircle" label="Sessions Held (Total)" value={sum(summaries, (s) => s.sessionsHeld)} color="#10b981" />
            </div>
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <h3>Attendance by Batch</h3>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Batch</th>
                                <th>Course</th>
                                <th>Sessions Held</th>
                                <th>Avg Attendance</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {summaries.length ? (
                                summaries.map((s) => (
                                    <tr key={s.batch.id}>
                                        <td className="cell-strong">{s.batch.name}</td>
                                        <td>{courseName(s.batch.course_id)}</td>
                                        <td>{s.sessionsHeld}</td>
                                        <td>{s.avgPct < 70 ? <StatusBadge status="absent" label={`${s.avgPct}%`} /> : `${s.avgPct}%`}</td>
                                        <td>
                                            <button type="button" className="btn btn-sm btn-outline" onClick={() => onGotoBatch(s.batch.id)}>
                                                <Icon name="eye" /> View Report
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="muted">
                                        No attendance recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="card">
                <div className="card-header">
                    <h3>Low-Attendance Students (Below 70%)</h3>
                    <p>Across all batches — may block certificate eligibility</p>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Batch</th>
                                <th>Attended/Total</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {low.length ? (
                                low.map((l) => (
                                    <tr className="row-link" key={`${l.student.id}:${l.batch.id}`} onClick={() => onViewStudent(l.student.id)}>
                                        <td className="cell-strong">{l.student.name}</td>
                                        <td>{l.batch.name}</td>
                                        <td>
                                            {l.attended}/{l.effectiveTotal}
                                        </td>
                                        <td>
                                            <StatusBadge status="absent" label={`${l.pct}%`} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="muted">
                                        No students below the threshold — great job!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default function Attendance({ view }) {
    const { userId } = useIdentity();
    const refresh = useRefresh();
    const openStudent = useStudentDrawer(refresh);

    const [tab, setTab] = useState('mark');
    const [batchId, setBatchId] = useState(null);
    const [date, setDate] = useState(TODAY);
    const [moduleId, setModuleId] = useState(null);

    const isScoped = isTeacherRole(userId);
    const visibleBatches = scopedBatchesForUser(userId).filter((b) => b.status !== 'upcoming');
    const activeBatchId = batchId && visibleBatches.some((b) => b.id === batchId) ? batchId : (visibleBatches[0]?.id ?? null);
    const batch = visibleBatches.find((b) => b.id === activeBatchId) || null;

    /* Same defaulting as the pane did: a null module means "this course's first module". */
    const course = batch ? DB.courses.find((c) => c.id === batch.course_id) : null;
    const moduleOptions = course ? course.modules : [];
    const activeModuleId = moduleId ?? (moduleOptions.length ? moduleOptions[0].id : null);

    const tabs = [
        { id: 'mark', label: 'Mark Attendance' },
        { id: 'batch', label: 'Batch Report' },
        ...(isScoped ? [] : [{ id: 'overview', label: 'All Batches Overview' }]),
    ];

    /* Switching batch resets the module so the new course's first module is picked. */
    const onBatchChange = (id) => {
        setBatchId(id);
        setModuleId(null);
    };

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Attendance</h1>
                    <p>
                        {isScoped
                            ? 'Only your assigned batches are shown here'
                            : 'Session-wise attendance marking, batch reports & low-attendance tracking'}
                    </p>
                </div>
            </div>

            {isScoped ? (
                <div className="badge badge-amber" style={{ marginBottom: 16 }}>
                    <Icon name="shield" /> You only have access to your assigned batches.
                </div>
            ) : null}

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            <div id="attPane">
                {tab === 'mark' ? (
                    <MarkPane
                        batches={visibleBatches}
                        batch={batch}
                        date={date}
                        moduleId={activeModuleId}
                        onBatchChange={onBatchChange}
                        onDateChange={setDate}
                        onModuleChange={(value) => setModuleId(value ? Number(value) : null)}
                        onSaved={refresh}
                    />
                ) : null}
                {tab === 'batch' ? (
                    <BatchReportPane batches={visibleBatches} batch={batch} onBatchChange={setBatchId} onViewStudent={openStudent} />
                ) : null}
                {tab === 'overview' ? (
                    <OverviewPane
                        onGotoBatch={(id) => {
                            setBatchId(id);
                            setTab('batch');
                        }}
                        onViewStudent={openStudent}
                    />
                ) : null}
            </div>
        </AdminLayout>
    );
}
