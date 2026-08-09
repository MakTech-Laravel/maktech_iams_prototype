/* Dashboard — ported from public/prototype/js/render-dashboard.js (role-aware KPIs, charts, activity feed). */

import { router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    DB,
    KPI,
    TODAY,
    allBatchAttendanceSummaries,
    batchEnrolledCount,
    batchName,
    computeEarnedForTeacherBatch,
    courseName,
    cashInHandTotal,
    duesFollowupWindow,
    fmtDate,
    fmtMoney,
    followupsMissed,
    followupsToday,
    institutionName,
    leadName,
    lowAttendanceStudents,
    outstandingForTeacherBatch,
    primaryEnrollment,
    scopedBatchesForUser,
    studentName,
    sum,
    teacherBatchPairs,
    totalPaidToTeacherForBatch,
    upcomingOnlineSessions,
    userName,
} from '../../lib/db';
import { useIdentity } from '../../lib/identity';
import { Donut, HBarList, Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useUi } from '../../lib/UiProvider';

const MONTHS_REV = [
    { label: 'Mar', rev: 2620000, exp: 940000 },
    { label: 'Apr', rev: 3110000, exp: 1080000 },
    { label: 'May', rev: 3480000, exp: 1220000 },
    { label: 'Jun', rev: 3960000, exp: 1360000 },
    { label: 'Jul', rev: 4420000, exp: 1510000 },
    { label: 'Aug', rev: 1870000, exp: 520000 },
];

const PIPELINE_COLORS = ['#94a3b8', '#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

function pipelineData() {
    return DB.leadPipeline.map((s, i) => ({
        label: s,
        value: DB.leads.filter((l) => l.status === s).length,
        color: PIPELINE_COLORS[i],
    }));
}

const RECENT_ACTIVITY = [
    { when: 'Today, 09:40', what: 'Farzana Akter marked present in Batch-26-A', who: 'Marked by Mahfuzur Rahman' },
    { when: 'Today, 09:00', what: 'Follow-up reminder sent to Shakil Ahmed for lead Md. Tanvir Ahmed', who: 'Automated notification' },
    { when: 'Yesterday, 20:11', what: 'Online payment (Card) of ৳2,000 received — Sadia Islam', who: 'via SSLCommerz gateway' },
    { when: 'Yesterday, 16:30', what: 'Course migration #2 approved — Sadia Islam (CIT-102 → CIT-101)', who: 'Approved by Nasrin Akter' },
    { when: '2 days ago', what: 'New lead captured — Mim Sultana (Khulna Polytechnic)', who: 'Added by Shakil Ahmed' },
    { when: '3 days ago', what: 'Expense approved — Career Counselling Seminar ৳22,000', who: 'Approved by Nasrin Akter' },
];

function DashboardAdmin() {
    const instRevenue = DB.institutions
        .filter((i) => i.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((i) => ({ label: i.name, value: i.revenue }));

    const teacherOutstanding = KPI.teacherPayablesOutstanding();

    return (
        <>
            <div className="view-header">
                <div>
                    <h1>Executive Dashboard</h1>
                    <p>Organization-wide overview across all modules — {DB.orgProfile.session} session</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="calendar" /> Aug 2026
                    </button>
                    <button type="button" className="btn btn-primary btn-sm">
                        <Icon name="download" /> Export Summary
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="students" label="Total Students" value={KPI.totalStudents()} trend={8} color="#ff6533" />
                <KpiCard
                    icon="marketing"
                    label="Active Leads"
                    value={DB.leads.filter((l) => !['admitted', 'lost'].includes(l.status)).length}
                    trend={12}
                    color="#06b6d4"
                />
                <KpiCard icon="payment" label="Revenue (This Month)" value={fmtMoney(1870000)} trend={-6} color="#10b981" />
                <KpiCard icon="wallet" label="Total Due Outstanding" value={fmtMoney(KPI.totalDue())} trend={3} color="#f59e0b" />
            </div>

            <div className="grid grid-4" style={{ marginBottom: 24 }}>
                <KpiCard icon="target" label="Lead → Student Conversion" value={`${KPI.conversionRate()}%`} trend={4} color="#8b5cf6" />
                <KpiCard icon="attendance" label="Avg. Attendance" value={`${KPI.avgAttendance()}%`} trend={-2} color="#3b82f6" />
                <KpiCard
                    icon="clock"
                    label="Enrollment Requests Pending"
                    value={DB.enrollmentRequests.filter((r) => r.status === 'pending').length}
                    color="#f59e0b"
                />
                <KpiCard icon="expense" label="Total Expense (YTD)" value={fmtMoney(sum(DB.expenses, (e) => e.amount))} trend={5} color="#f43f5e" />
            </div>

            <div className="grid grid-4" style={{ marginBottom: 24 }}>
                <KpiCard icon="graduationCap" label="Teacher Payments Pending Approval" value={KPI.teacherPaymentsPendingApproval()} color="#f59e0b" />
                <KpiCard
                    icon="wallet"
                    label="Teacher Payables Outstanding"
                    value={fmtMoney(teacherOutstanding)}
                    color={teacherOutstanding > 0 ? '#ef4444' : '#10b981'}
                />
                <KpiCard icon="checkCircle" label="Awaiting Disbursement" value={KPI.teacherPaymentsAwaitingDisbursement()} color="#3b82f6" />
                <KpiCard icon="graduationCap" label="Teacher Payments (YTD)" value={fmtMoney(KPI.teacherPaymentsPaidYTD())} color="#10b981" />
            </div>

            <div className="grid grid-3" style={{ alignItems: 'start' }}>
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <div>
                            <h3>Income vs Expense (Last 6 months)</h3>
                            <p>Monthly ledger trend, BDT</p>
                        </div>
                        <div className="flex-gap" style={{ fontSize: '11.5px' }}>
                            <span className="flex-gap">
                                <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--primary-500)', display: 'inline-block' }} />
                                Income
                            </span>
                            <span className="flex-gap">
                                <span style={{ width: 9, height: 9, borderRadius: 3, background: '#1e293b', display: 'inline-block' }} />
                                Expense
                            </span>
                        </div>
                    </div>
                    <div className="card-pad">
                        <div className="bar-chart" style={{ height: 200 }}>
                            {MONTHS_REV.map((m) => {
                                const max = 4500000;

                                return (
                                    <div className="bar-col" key={m.label}>
                                        <div className="flex-gap" style={{ gap: 4, alignItems: 'flex-end', height: '100%' }}>
                                            <div className="bar" style={{ height: `${(m.rev / max) * 100}%`, maxWidth: 16 }} />
                                            <div
                                                className="bar"
                                                style={{ height: `${(m.exp / max) * 100}%`, maxWidth: 16, background: 'linear-gradient(180deg,#475569,#1e293b)' }}
                                            />
                                        </div>
                                        <div className="bar-label">{m.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3>Lead Pipeline</h3>
                            <p>Current funnel snapshot</p>
                        </div>
                    </div>
                    <div className="card-pad">
                        <Donut data={pipelineData()} />
                    </div>
                </div>
            </div>

            <div className="grid grid-3" style={{ alignItems: 'start', marginTop: 20 }}>
                <div className="card">
                    <div className="card-header">
                        <h3>Top Institutes by Revenue</h3>
                    </div>
                    <div className="card-pad">
                        <HBarList data={instRevenue} fmt={fmtMoney} />
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="card-pad">
                        <div className="timeline">
                            {RECENT_ACTIVITY.map((r, i) => (
                                <div className="timeline-item" key={i}>
                                    <div className="when">{r.when}</div>
                                    <div className="what">{r.what}</div>
                                    <div className="who">{r.who}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3>Marketing Staff — Target vs Achieved</h3>
                    </div>
                    <div className="card-pad">
                        <HBarList data={DB.marketingTargets.map((t) => ({ label: userName(t.user_id), value: t.achieved }))} />
                        {DB.marketingTargets.map((t) => (
                            <div
                                key={t.user_id}
                                style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-400)', marginTop: -6 }}
                            >
                                <span />
                                <span>
                                    {t.achieved} / {t.target} target
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function DashboardMarketing() {
    const { user, userId } = useIdentity();
    const myLeads = DB.leads.filter((l) => l.assigned_to === userId);
    const myFollowupsToday = followupsToday().filter((f) => f.assigned_to === userId);
    const myFollowupsMissed = followupsMissed().filter((f) => f.assigned_to === userId);

    return (
        <>
            <div className="view-header">
                <div>
                    <h1>Marketing Dashboard</h1>
                    <p>Leads, conversions and follow-ups — {user?.name || ''}</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => router.visit('/admin/leads')}>
                        <Icon name="plus" /> Add Lead
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 22 }}>
                <KpiCard icon="marketing" label="My Assigned Leads" value={myLeads.length} color="#06b6d4" />
                <KpiCard icon="calendar" label="My Follow-ups Due Today" value={myFollowupsToday.length} color="#f59e0b" />
                <KpiCard icon="alertCircle" label="My Missed Follow-ups" value={myFollowupsMissed.length} color="#ef4444" />
                <KpiCard icon="send" label="Upcoming Online Sessions" value={upcomingOnlineSessions().length} color="#8b5cf6" />
            </div>

            <div className="grid grid-3" style={{ alignItems: 'start' }}>
                <div className="card">
                    <div className="card-header">
                        <h3>Lead Pipeline (Org-wide)</h3>
                    </div>
                    <div className="card-pad">
                        <Donut data={pipelineData()} />
                    </div>
                </div>
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3>My Follow-ups Due Today</h3>
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => router.visit('/admin/followups')}>
                            <Icon name="clock" /> View All
                        </button>
                    </div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Lead</th>
                                    <th>Due</th>
                                    <th>Notes</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myFollowupsToday.length ? (
                                    myFollowupsToday.map((f) => (
                                        <tr className="row-link" key={f.id}>
                                            <td className="cell-strong">{leadName(f.lead_id)}</td>
                                            <td>{fmtDate(f.due_date)}</td>
                                            <td>{f.notes}</td>
                                            <td>
                                                <StatusBadge status={f.status} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="muted">
                                            No follow-ups due today — you're all caught up!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card mt-16">
                <div className="card-header">
                    <h3>Marketing Staff Performance</h3>
                    <p>Target vs achieved — August 2026</p>
                </div>
                <div className="card-pad">
                    <HBarList data={DB.marketingTargets.map((t) => ({ label: `${userName(t.user_id)} (${t.achieved}/${t.target})`, value: t.achieved }))} />
                </div>
            </div>
        </>
    );
}

function DashboardFinance() {
    const { toast } = useUi();
    const overdue = DB.feeInvoices.filter((i) => i.status === 'overdue');
    const collectedToday = sum(
        DB.payments.filter((p) => p.status === 'success' && (p.date || '').slice(0, 10) === TODAY),
        (p) => p.amount,
    );
    const cashInHand = cashInHandTotal();

    return (
        <>
            <div className="view-header">
                <div>
                    <h1>Accounting Dashboard</h1>
                    <p>Collections, dues, cash custody, and expense overview — Tanvir Hasan</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.visit('/admin/due')}>
                        <Icon name="wallet" /> Due Follow-up
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => router.visit('/admin/collect-payment')}>
                        <Icon name="payment" /> Collect Payment
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 22 }}>
                <KpiCard icon="payment" label="Collected Today (All Methods)" value={fmtMoney(collectedToday)} color="#10b981" />
                <KpiCard icon="wallet" label="Cash In Hand (Undeposited)" value={fmtMoney(cashInHand)} color={cashInHand > 0 ? '#ef4444' : '#10b981'} />
                <KpiCard icon="wallet" label="Total Due Outstanding" value={fmtMoney(KPI.totalDue())} color="#f59e0b" />
                <KpiCard icon="send" label="In 7-day Follow-up Window" value={duesFollowupWindow().length} color="#8b5cf6" />
            </div>

            {cashInHand > 0 ? (
                <div className="badge badge-amber" style={{ whiteSpace: 'normal', marginBottom: 22 }}>
                    <Icon name="alertCircle" /> You have {fmtMoney(cashInHand)} in undeposited cash.{' '}
                    <a
                        href="/admin/cash-management"
                        onClick={(event) => {
                            event.preventDefault();
                            router.visit('/admin/cash-management');
                        }}
                        style={{ color: 'var(--primary-700)', fontWeight: 700 }}
                    >
                        Deposit to bank or hand over now →
                    </a>
                </div>
            ) : null}

            <div className="grid grid-3" style={{ alignItems: 'start' }}>
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3>Payment Method Split (This Month)</h3>
                    </div>
                    <div className="card-pad">
                        <Donut
                            data={[
                                { label: 'Cash', value: 36, color: '#10b981' },
                                { label: 'bKash', value: 24, color: '#8b5cf6' },
                                { label: 'Bank/Cheque', value: 18, color: '#3b82f6' },
                                { label: 'Nagad', value: 12, color: '#f59e0b' },
                                { label: 'Card', value: 10, color: '#64748b' },
                            ]}
                        />
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3>Overdue Aging</h3>
                    </div>
                    <div className="card-pad">
                        <HBarList
                            data={[
                                { label: '0–7 days', value: 1, color: '#f59e0b' },
                                { label: '8–15 days', value: 1, color: '#f97316' },
                                { label: '15–30 days', value: 1, color: '#ef4444' },
                                { label: '30+ days', value: 0, color: '#b91c1c' },
                            ]}
                        />
                    </div>
                </div>
            </div>

            <div className="card mt-16">
                <div className="card-header">
                    <h3>Overdue Invoices</h3>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Student</th>
                                <th>Total</th>
                                <th>Due</th>
                                <th>Due Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overdue.map((i) => (
                                <tr key={i.id}>
                                    <td className="cell-strong">{i.invoice_no}</td>
                                    <td>{studentName(i.student_id)}</td>
                                    <td>{fmtMoney(i.total)}</td>
                                    <td>{fmtMoney(i.due)}</td>
                                    <td>{fmtDate(i.due_date)}</td>
                                    <td>
                                        <StatusBadge status={i.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card mt-16">
                <div className="card-header">
                    <div>
                        <h3>Teacher Payments Awaiting Disbursement</h3>
                        <p>Approved but not yet paid out</p>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => router.visit('/admin/teacher-payments')}>
                        <Icon name="graduationCap" /> Open Teacher Payments
                    </button>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Voucher</th>
                                <th>Teacher</th>
                                <th>Batch</th>
                                <th>Amount</th>
                                <th>Approved</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.teacherPayments.filter((p) => p.status === 'approved').length ? (
                                DB.teacherPayments
                                    .filter((p) => p.status === 'approved')
                                    .map((p) => (
                                        <tr key={p.id}>
                                            <td className="cell-strong">{p.voucher_no}</td>
                                            <td>{userName(p.teacher_id)}</td>
                                            <td>{batchName(p.batch_id)}</td>
                                            <td>{fmtMoney(p.amount)}</td>
                                            <td>{fmtDate(p.approved_date)}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => toast('Open Teacher Payments to disburse this voucher')}
                                                >
                                                    <Icon name="wallet" /> Pay Now
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="muted">
                                        Nothing awaiting disbursement right now.
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

function DashboardCoordinator() {
    const { user, userId } = useIdentity();
    const myBatches = scopedBatchesForUser(userId);
    const myBatchIds = myBatches.map((b) => b.id);
    const mySummaries = allBatchAttendanceSummaries(myBatchIds);
    const myAvgAtt = mySummaries.length ? Math.round(sum(mySummaries, (s) => s.avgPct) / mySummaries.length) : 0;
    const myLow = lowAttendanceStudents(70, myBatchIds);
    const myPairs = teacherBatchPairs(myBatchIds).filter((pr) => pr.teacher_id === userId);
    const myEarned = sum(myPairs, (pr) => computeEarnedForTeacherBatch(pr.teacher_id, pr.batch_id));
    const myPaid = sum(myPairs, (pr) => totalPaidToTeacherForBatch(pr.teacher_id, pr.batch_id));
    const myOutstanding = sum(myPairs, (pr) => outstandingForTeacherBatch(pr.teacher_id, pr.batch_id));
    const todaysClasses = DB.classSchedule.filter((c) => myBatchIds.includes(c.batch_id) && c.date === '2026-08-06');

    return (
        <>
            <div className="view-header">
                <div>
                    <h1>Coordinator Dashboard</h1>
                    <p>Your classes, attendance &amp; module progress — {user?.name || ''}</p>
                </div>
            </div>

            <div className="badge badge-amber" style={{ marginBottom: 16 }}>
                <Icon name="shield" /> You only see the batches assigned to you by an Admin (Access Control).
            </div>

            <div className="grid grid-4" style={{ marginBottom: 22 }}>
                <KpiCard icon="batch" label="My Active Batches" value={myBatches.filter((b) => b.status === 'ongoing').length} color="#ff6533" />
                <KpiCard icon="students" label="Students Under Supervision" value={sum(myBatches, (b) => batchEnrolledCount(b.id))} color="#06b6d4" />
                <KpiCard icon="attendance" label="Avg Attendance (My Batches)" value={`${myAvgAtt}%`} color={myAvgAtt < 70 ? '#ef4444' : '#10b981'} />
                <KpiCard icon="calendar" label="Classes Today" value={todaysClasses.length} color="#f59e0b" />
            </div>

            <div className="grid grid-3" style={{ alignItems: 'start' }}>
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3>Today's Class Schedule</h3>
                    </div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Batch</th>
                                    <th>Room</th>
                                    <th>Mode</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {todaysClasses.length ? (
                                    todaysClasses.map((c) => (
                                        <tr key={c.id}>
                                            <td className="cell-strong">
                                                {c.start} – {c.end}
                                            </td>
                                            <td>{batchName(c.batch_id)}</td>
                                            <td>{c.room}</td>
                                            <td>
                                                <StatusBadge status={c.mode === 'online' ? 'active' : 'ongoing'} label={c.mode} />
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-outline" onClick={() => router.visit('/admin/attendance')}>
                                                    Mark Attendance
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="muted">
                                            No classes scheduled today.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3>Low Attendance (My Batches)</h3>
                    </div>
                    <div className="card-pad">
                        {myLow.length ? (
                            myLow.slice(0, 6).map((l) => (
                                <div className="flex-between" style={{ marginBottom: 10, fontSize: '12.5px' }} key={l.student.id}>
                                    <span>{l.student.name}</span>
                                    <StatusBadge status="absent" label={`${l.pct}%`} />
                                </div>
                            ))
                        ) : (
                            <p className="muted" style={{ fontSize: '12.5px' }}>
                                No students below 70% — great job!
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="card mt-16">
                <div className="card-header">
                    <div>
                        <h3>My Batch Payments</h3>
                        <p>Earnings &amp; payout status across your assigned batches</p>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => router.visit('/admin/teacher-payments')}>
                        <Icon name="graduationCap" /> View Details
                    </button>
                </div>
                <div className="grid grid-3 card-pad" style={{ gap: 14 }}>
                    <div className="card card-pad" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{fmtMoney(myEarned)}</div>
                        <div className="cell-sub">Total Earned</div>
                    </div>
                    <div className="card card-pad" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success-700)' }}>{fmtMoney(myPaid)}</div>
                        <div className="cell-sub">Total Paid</div>
                    </div>
                    <div className="card card-pad" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: myOutstanding > 0 ? 'var(--danger-600)' : 'var(--gray-400)' }}>
                            {fmtMoney(myOutstanding)}
                        </div>
                        <div className="cell-sub">Outstanding</div>
                    </div>
                </div>
            </div>
        </>
    );
}

function DashboardFrontDesk() {
    return (
        <>
            <div className="view-header">
                <div>
                    <h1>Front Desk Dashboard</h1>
                    <p>Registrations &amp; document collection — Kamrul Hasan</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => router.visit('/admin/students')}>
                        <Icon name="plus" /> Register Student
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 22 }}>
                <KpiCard icon="students" label="New Registrations (This Week)" value={6} color="#ff6533" />
                <KpiCard icon="file" label="Profiles Incomplete" value={DB.students.filter((s) => !s.profile_completed).length} color="#f59e0b" />
                <KpiCard icon="upload" label="Documents Pending" value={4} color="#ef4444" />
                <KpiCard icon="idcard" label="ID Cards to Issue" value={3} color="#8b5cf6" />
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Recent Registrations</h3>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Institution</th>
                                <th>Course</th>
                                <th>Profile</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB.students.slice(0, 6).map((s) => (
                                <tr key={s.id}>
                                    <td className="cell-strong">{s.name}</td>
                                    <td>{institutionName(s.institution_id)}</td>
                                    <td>{courseName(primaryEnrollment(s)?.course_id)}</td>
                                    <td>
                                        {s.profile_completed ? (
                                            <StatusBadge status="active" label="Complete" />
                                        ) : (
                                            <StatusBadge status="pending" label="Incomplete" />
                                        )}
                                    </td>
                                    <td>
                                        <StatusBadge status={s.status} />
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

export default function Dashboard({ view }) {
    const { role } = useIdentity();

    let body = <DashboardAdmin />;
    if (role === 3) body = <DashboardMarketing />;
    else if (role === 4) body = <DashboardFinance />;
    else if (role === 5) body = <DashboardCoordinator />;
    else if (role === 6) body = <DashboardFrontDesk />;

    return <AdminLayout view={view}>{body}</AdminLayout>;
}
