/* Report viewer — ported from reportFilterBar / REPORT_RENDERERS / tableHtml / genericReportFallback /
   openReportModal in public/prototype/js/render-reports.js. */

import {
    DB,
    LEAD_STATUS_LABELS,
    PAY_RATE_TYPE_LABELS,
    TEACHER_PAY_TYPE_LABELS,
    allBatchAttendanceSummaries,
    batchName,
    computeEarnedForTeacherBatch,
    courseName,
    fmtDate,
    fmtMoney,
    institutionName,
    isFollowupOverdue,
    leadName,
    lowAttendanceStudents,
    outstandingForTeacherBatch,
    payRateFor,
    studentName,
    sum,
    teacherBatchPairs,
    totalPaidToTeacherForBatch,
    userName,
} from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { BarChart, Donut, HBarList, Icon, MethodBadge, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { ALL_REPORTS } from './reportCatalog';

/* Same six-month ledger series the prototype's render-dashboard.js exposes to the report renderers. */
const MONTHS_REV = [
    { label: 'Mar', rev: 2620000, exp: 940000 },
    { label: 'Apr', rev: 3110000, exp: 1080000 },
    { label: 'May', rev: 3480000, exp: 1220000 },
    { label: 'Jun', rev: 3960000, exp: 1360000 },
    { label: 'Jul', rev: 4420000, exp: 1510000 },
    { label: 'Aug', rev: 1870000, exp: 520000 },
];

const PIPELINE_COLORS = ['#94a3b8', '#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export function ReportFilterBar() {
    return (
        <div className="filter-bar" style={{ marginBottom: 16 }}>
            <input type="date" defaultValue="2026-07-01" />
            <span className="muted">to</span>
            <input type="date" defaultValue="2026-08-06" />
            <select>
                <option>All Courses</option>
                {DB.courses.map((c) => (
                    <option key={c.id}>{c.name}</option>
                ))}
            </select>
            <select>
                <option>All Institutes</option>
                {DB.institutions.map((i) => (
                    <option key={i.id}>{i.name}</option>
                ))}
            </select>
            <button type="button" className="btn btn-secondary btn-sm">
                <Icon name="filter" /> Apply
            </button>
            <span style={{ marginLeft: 'auto' }} className="flex-gap">
                <button type="button" className="btn btn-outline btn-sm">
                    <Icon name="download" /> Excel
                </button>
                <button type="button" className="btn btn-outline btn-sm">
                    <Icon name="download" /> PDF
                </button>
                <button type="button" className="btn btn-outline btn-sm">
                    <Icon name="printer" /> Print
                </button>
            </span>
        </div>
    );
}

export function ReportTable({ cols, rows }) {
    return (
        <div className="table-wrap">
            <table className="data-table">
                <thead>
                    <tr>
                        {cols.map((c) => (
                            <th key={c}>{c}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length ? (
                        rows.map((r, ri) => (
                            <tr key={ri}>
                                {r.map((c, i) => (
                                    <td key={i} className={i === 0 ? 'cell-strong' : ''}>
                                        {c}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={cols.length} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                                No records in current filter range.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

const REPORT_RENDERERS = {
    1: () => {
        const data = DB.institutions
            .map((i) => ({ label: i.name, value: DB.leads.filter((l) => l.institution_id === i.id).length }))
            .filter((x) => x.value > 0)
            .sort((a, b) => b.value - a.value);

        return <HBarList data={data} />;
    },
    2: () => (
        <Donut
            data={DB.leadPipeline.map((s, i) => ({
                label: LEAD_STATUS_LABELS[s],
                value: DB.leads.filter((l) => l.status === s).length,
                color: PIPELINE_COLORS[i],
            }))}
        />
    ),
    3: () => (
        <ReportTable
            cols={['Institution', 'Date', 'Staff', 'Purpose', 'Outcome']}
            rows={DB.visits.map((v) => [institutionName(v.institution_id), fmtDate(v.visit_date), userName(v.visited_by), v.purpose, v.outcome])}
        />
    ),
    4: () => (
        <ReportTable
            cols={['Lead/Student', 'Due', 'Assigned', 'Status']}
            rows={DB.followUps.map((f) => [
                f.lead_id ? leadName(f.lead_id) : studentName(f.student_id),
                fmtDate(f.due_date),
                userName(f.assigned_to),
                isFollowupOverdue(f) ? <StatusBadge status="overdue" label="Missed" /> : <StatusBadge status={f.status} />,
            ])}
        />
    ),
    6: () => <HBarList data={DB.marketingTargets.map((t) => ({ label: userName(t.user_id), value: t.achieved }))} />,
    7: () => (
        <HBarList
            data={[
                { label: 'Financial constraints', value: 1, color: '#ef4444' },
                { label: 'Chose competitor institute', value: 1, color: '#f97316' },
            ]}
        />
    ),
    8: () => (
        <ReportTable
            cols={['Institution', 'Leads', 'Admitted', 'Conversion %']}
            rows={DB.institutions.map((i) => {
                const total = DB.leads.filter((l) => l.institution_id === i.id).length;
                const adm = DB.leads.filter((l) => l.institution_id === i.id && l.status === 'admitted').length;

                return [i.name, total, adm, total ? `${Math.round((adm / total) * 100)}%` : '0%'];
            })}
        />
    ),
    9: () => (
        <ReportTable
            cols={['Student', 'Institution', 'Course', 'Status']}
            rows={DB.students.map((s) => [s.name, institutionName(s.institution_id), courseName(s.courses[0]?.course_id), <StatusBadge status={s.status} />])}
        />
    ),
    11: () => <HBarList data={DB.courses.map((c) => ({ label: c.name, value: c.enrolled }))} />,
    13: () => (
        <ReportTable
            cols={['Student', 'Batch', 'Present/Total', '%']}
            rows={allBatchAttendanceSummaries().flatMap((bs) =>
                bs.rows.filter((r) => r.effectiveTotal > 0).map((r) => [r.student.name, bs.batch.name, `${r.attended}/${r.effectiveTotal}`, `${r.pct}%`]),
            )}
        />
    ),
    14: () => (
        <ReportTable
            cols={['Student', 'Batch', 'Attendance %', 'Flag']}
            rows={lowAttendanceStudents().map((l) => [l.student.name, l.batch.name, `${l.pct}%`, <StatusBadge status="absent" label="Low" />])}
        />
    ),
    16: () => (
        <ReportTable
            cols={['Student', 'Course', 'Reason']}
            rows={DB.students.filter((s) => s.status === 'dropped').map((s) => [s.name, courseName(s.courses[0]?.course_id), 'Personal / financial reasons (sample)'])}
        />
    ),
    17: () => (
        <ReportTable
            cols={['Student', 'From → To', 'Fee Impact', 'Status']}
            rows={DB.courseMigrations.map((m) => [
                studentName(m.student_id),
                `${courseName(m.from_course_id)} → ${courseName(m.to_course_id)}`,
                fmtMoney(m.net_adjustment),
                <StatusBadge status={m.status} />,
            ])}
        />
    ),
    18: () => (
        <ReportTable
            cols={['Receipt', 'Student', 'Amount', 'Method', 'Accountant']}
            rows={DB.payments.map((p) => [
                p.receipt_no,
                studentName(p.student_id),
                fmtMoney(p.amount),
                <MethodBadge method={p.method} />,
                p.collected_by ? userName(p.collected_by) : 'Online',
            ])}
        />
    ),
    19: () => (
        <Donut
            data={[
                { label: 'Physical', value: sum(DB.payments.filter((p) => p.channel === 'physical'), (p) => p.amount), color: '#10b981' },
                { label: 'Online', value: sum(DB.payments.filter((p) => p.channel === 'online'), (p) => p.amount), color: '#ff6533' },
            ]}
        />
    ),
    20: () => (
        <ReportTable
            cols={['Student', 'Due', 'Due Date', 'Status']}
            rows={DB.feeInvoices.filter((i) => i.due > 0).map((i) => [studentName(i.student_id), fmtMoney(i.due), fmtDate(i.due_date), <StatusBadge status={i.status} />])}
        />
    ),
    21: () => (
        <ReportTable
            cols={['Invoice', 'Installment #', 'Amount', 'Due Date', 'Status']}
            rows={DB.paymentInstallments.map((x) => [
                DB.feeInvoices.find((i) => i.id === x.invoice_id)?.invoice_no,
                x.no,
                fmtMoney(x.amount),
                fmtDate(x.due_date),
                <StatusBadge status={x.status} />,
            ])}
        />
    ),
    22: () => (
        <ReportTable
            cols={['Student', 'Course', 'Discount', 'Given By', 'Reason']}
            rows={DB.discountsGiven.map((d) => [studentName(d.student_id), courseName(d.course_id), fmtMoney(d.amount), userName(d.given_by), d.reason])}
        />
    ),
    23: () => (
        <ReportTable
            cols={['Student', 'Amount', 'Reason', 'Status']}
            rows={DB.refunds.map((r) => [
                studentName(DB.payments.find((p) => p.id === r.payment_id)?.student_id),
                fmtMoney(r.amount),
                r.reason,
                <StatusBadge status={r.status} />,
            ])}
        />
    ),
    25: () => <HBarList data={DB.courses.map((c) => ({ label: c.name, value: c.enrolled * c.base_price }))} fmt={fmtMoney} />,
    26: () => <HBarList data={DB.institutions.filter((i) => i.revenue > 0).map((i) => ({ label: i.name, value: i.revenue }))} fmt={fmtMoney} />,
    27: () => <BarChart data={MONTHS_REV.map((m) => ({ label: m.label, value: m.rev }))} fmt={(v) => `${(v / 1000000).toFixed(1)}M`} />,
    28: () => (
        <ReportTable
            cols={['Category', 'Amount']}
            rows={DB.expenseCategories.map((c) => [c, fmtMoney(sum(DB.expenses.filter((e) => e.category === c), (e) => e.amount))])}
        />
    ),
    29: () => (
        <ReportTable
            cols={['Title', 'Amount', 'Date']}
            rows={DB.expenses.filter((e) => e.category === 'Event Cost').map((e) => [e.title, fmtMoney(e.amount), fmtDate(e.expense_date)])}
        />
    ),
    30: () => (
        <ReportTable
            cols={['Title', 'Amount', 'Date']}
            rows={DB.expenses.filter((e) => e.category === 'Tour Cost').map((e) => [e.title, fmtMoney(e.amount), fmtDate(e.expense_date)])}
        />
    ),
    31: () => (
        <ReportTable
            cols={['Title', 'Amount', 'Date']}
            rows={DB.expenses.filter((e) => e.category === 'Student Facility Cost').map((e) => [e.title, fmtMoney(e.amount), fmtDate(e.expense_date)])}
        />
    ),
    32: () => <BarChart data={MONTHS_REV.map((m) => ({ label: m.label, value: m.rev - m.exp }))} fmt={(v) => `${(v / 1000000).toFixed(1)}M`} />,
    33: () => (
        <ReportTable
            cols={['Vendor', 'Total Paid', 'Terms']}
            rows={DB.vendors.map((v) => [v.name, fmtMoney(sum(DB.expenses.filter((e) => e.vendor_id === v.id), (e) => e.amount)), v.terms])}
        />
    ),
    34: () => (
        <ReportTable
            cols={['Invoice', 'Student', 'Total', 'Status']}
            rows={DB.feeInvoices.map((i) => [i.invoice_no, studentName(i.student_id), fmtMoney(i.total), <StatusBadge status={i.status} />])}
        />
    ),
    36: () => (
        <ReportTable
            cols={['Student', 'Course', 'Cert No.', 'Issue Date']}
            rows={DB.certificates.filter((c) => c.status === 'issued').map((c) => [studentName(c.student_id), courseName(c.course_id), c.cert_no, fmtDate(c.issue_date)])}
        />
    ),
    37: () => (
        <ReportTable
            cols={['Student', 'Course', 'Reason']}
            rows={DB.certificates.filter((c) => c.status === 'pending').map((c) => [studentName(c.student_id), courseName(c.course_id), 'Outstanding payment due'])}
        />
    ),
    38: () => (
        <ReportTable
            cols={['Student', 'Card No.', 'Issue Date', 'Status']}
            rows={DB.idCards.map((c) => [studentName(c.student_id), c.card_no, fmtDate(c.issue_date), <StatusBadge status={c.status} />])}
        />
    ),
    39: () => (
        <ReportTable
            cols={['User', 'Module', 'Action', 'Record', 'Date']}
            rows={DB.auditLogs.map((a) => [userName(a.user_id), a.module, a.action, a.record, fmtDate(a.date)])}
        />
    ),
    40: () => (
        <ReportTable
            cols={['Recipient', 'Channel', 'Type', 'Status', 'Date']}
            rows={DB.notifications.map((n) => [n.recipient, n.channel.toUpperCase(), n.type.replace(/_/g, ' '), <StatusBadge status={n.status} />, fmtDate(n.date)])}
        />
    ),
    42: () => (
        <ReportTable
            cols={['Receipt', 'Date', 'Type', 'Amount', 'Handled By', 'To', 'Status']}
            rows={DB.cashHandovers.map((h) => [
                h.receipt_no,
                fmtDate(h.date),
                h.type === 'bank_deposit' ? 'Bank Deposit' : 'Handover',
                fmtMoney(h.amount),
                userName(h.created_by),
                h.type === 'bank_deposit' ? h.bank_name : userName(h.handed_to),
                <StatusBadge status={h.status === 'confirmed' ? 'active' : 'pending'} label={h.status === 'confirmed' ? 'Confirmed' : 'Pending'} />,
            ])}
        />
    ),
    43: () => (
        <ReportTable
            cols={['Teacher', 'Batch', 'Rate', 'Computed Earned', 'Paid', 'Outstanding']}
            rows={teacherBatchPairs().map((pr) => {
                const rate = payRateFor(pr.teacher_id, pr.batch_id);

                return [
                    userName(pr.teacher_id),
                    batchName(pr.batch_id),
                    rate ? `${PAY_RATE_TYPE_LABELS[rate.rate_type]} (${fmtMoney(rate.rate_amount)})` : 'No rate set',
                    fmtMoney(computeEarnedForTeacherBatch(pr.teacher_id, pr.batch_id)),
                    fmtMoney(totalPaidToTeacherForBatch(pr.teacher_id, pr.batch_id)),
                    fmtMoney(outstandingForTeacherBatch(pr.teacher_id, pr.batch_id)),
                ];
            })}
        />
    ),
    44: () => (
        <ReportTable
            cols={['Voucher', 'Teacher', 'Batch', 'Type', 'Amount', 'Status', 'Date']}
            rows={DB.teacherPayments.map((p) => [
                p.voucher_no,
                userName(p.teacher_id),
                batchName(p.batch_id),
                TEACHER_PAY_TYPE_LABELS[p.type],
                fmtMoney(p.amount),
                <StatusBadge status={p.status} />,
                fmtDate(p.paid_date || p.approved_date || p.requested_date),
            ])}
        />
    ),
};

function GenericReportFallback({ report }) {
    const pool = [...DB.institutions.map((i) => i.name), ...DB.courses.map((c) => c.name)];
    const rows = pool.slice(0, 6).map((name, idx) => [name, fmtMoney(50000 + idx * 23500), fmtDate(`2026-0${(idx % 6) + 2}-1${idx}`)]);

    return (
        <>
            <div className="empty-state" style={{ padding: '10px 20px 22px' }}>
                <p style={{ color: 'var(--gray-500)', fontSize: '12.5px', marginBottom: 16 }}>
                    Illustrative sample output for <b>{report.t}</b> — actual report will query live data with the filters above.
                </p>
            </div>
            <ReportTable cols={['Item', 'Amount', 'Date']} rows={rows} />
        </>
    );
}

/* openReportModal(id) from render-reports.js. */
export function useOpenReport() {
    const { openModal, closeModal, toast } = useUi();
    const { canReport } = useIdentity();

    return (id) => {
        const r = ALL_REPORTS.find((x) => x.id === id);

        if (!r) {
            return;
        }

        if (!canReport(id)) {
            toast("You don't have access to this report — ask an Admin to grant it from Access Control", 'error');

            return;
        }

        const renderer = REPORT_RENDERERS[id];

        openModal({
            size: 'xl',
            title: r.t,
            sub: r.d,
            body: (
                <>
                    <ReportFilterBar />
                    <div id="reportBodyArea">{renderer ? renderer() : <GenericReportFallback report={r} />}</div>
                </>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-outline">
                        <Icon name="download" /> Export Excel
                    </button>
                    <button type="button" className="btn btn-primary">
                        <Icon name="download" /> Export PDF
                    </button>
                </>
            ),
        });
    };
}
