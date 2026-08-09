/* Due & Overdue tab panes — ported from dueRow(), dueTableHtml(), duePane() and
   applyDueRangeFilter() in public/prototype/js/render-finance.js. The prototype re-injected
   #duePane's innerHTML from wireDueTabs(); here the active tab is page state. */

import { useState } from 'react';
import {
    courseName,
    duesAll,
    duesFollowupWindow,
    duesInRange,
    duesToday,
    ensureFollowupSmsSent,
    fmtDate,
    fmtMoney,
    followupNotificationsFor,
    invoiceDaysUntilDue,
    primaryEnrollment,
    studentById,
    sum,
} from '../../../lib/db';
import { BarChart, Icon, KpiCard, StatusBadge } from '../../../lib/ui';
import FinanceEmpty from './Empty';

function DueRow({ inv, onViewInvoice, onSendReminder, onCollect }) {
    const days = invoiceDaysUntilDue(inv);
    const s = studentById(inv.student_id);
    const aging =
        days > 0 ? (
            <StatusBadge status="pending" label={`Due in ${days}d`} />
        ) : days === 0 ? (
            <StatusBadge status="due" label="Due today" />
        ) : (
            <StatusBadge status="overdue" label={`${Math.abs(days)} days overdue`} />
        );

    return (
        <tr className="row-link" onClick={() => onViewInvoice(inv.id)}>
            <td className="cell-strong">{s?.name || '—'}</td>
            <td>{courseName(primaryEnrollment(s)?.course_id)}</td>
            <td>{fmtMoney(inv.due)}</td>
            <td>{fmtDate(inv.due_date)}</td>
            <td>{aging}</td>
            <td>
                <div className="flex-gap">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={(event) => {
                            event.stopPropagation();
                            onSendReminder(inv.id);
                        }}
                    >
                        <Icon name="send" /> Remind
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={(event) => {
                            event.stopPropagation();
                            onCollect(s?.id);
                        }}
                    >
                        <Icon name="plus" /> Collect
                    </button>
                </div>
            </td>
        </tr>
    );
}

export function DueTable({ list, emptyMsg, handlers }) {
    if (!list.length) {
        return <FinanceEmpty icon="checkCircle" message={emptyMsg || 'Nothing here — all clear!'} />;
    }

    return (
        <div className="card">
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Course</th>
                            <th>Due Amount</th>
                            <th>Due Date</th>
                            <th>Aging</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((inv) => (
                            <DueRow key={inv.id} inv={inv} {...handlers} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DueTodayPane({ handlers }) {
    const list = duesToday();

    return (
        <>
            <div className="grid grid-3" style={{ marginBottom: 18 }}>
                <KpiCard icon="wallet" label="Due Today / Overdue" value={list.length} color="#ef4444" />
                <KpiCard icon="payment" label="Total Amount" value={fmtMoney(sum(list, (i) => i.due))} color="#f59e0b" />
                <KpiCard icon="send" label="Auto-Reminders Active" value="On due date + every 3 days" color="#8b5cf6" />
            </div>
            <DueTable list={list} emptyMsg="No payments are due today." handlers={handlers} />
        </>
    );
}

function bucket(inv) {
    const d = -invoiceDaysUntilDue(inv);

    if (d <= 0) return '0';
    if (d <= 7) return '0-7';
    if (d <= 15) return '8-15';
    if (d <= 30) return '15-30';

    return '30+';
}

function DueAllPane({ handlers }) {
    const dues = duesAll();

    return (
        <>
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <h3>Overdue Aging Buckets</h3>
                </div>
                <div className="card-pad">
                    <BarChart
                        data={[
                            { label: '0–7 days', value: dues.filter((i) => bucket(i) === '0-7').length, color: 'linear-gradient(180deg,#fbbf24,#f59e0b)' },
                            { label: '8–15 days', value: dues.filter((i) => bucket(i) === '8-15').length, color: 'linear-gradient(180deg,#fb923c,#f97316)' },
                            { label: '15–30 days', value: dues.filter((i) => bucket(i) === '15-30').length, color: 'linear-gradient(180deg,#f87171,#ef4444)' },
                            { label: '30+ days', value: dues.filter((i) => bucket(i) === '30+').length, color: 'linear-gradient(180deg,#b91c1c,#7f1d1d)' },
                        ]}
                    />
                </div>
            </div>
            <DueTable list={dues} emptyMsg="No outstanding dues anywhere in the system." handlers={handlers} />
        </>
    );
}

function DueRangePane({ handlers }) {
    const [from, setFrom] = useState('2026-08-01');
    const [to, setTo] = useState('2026-08-31');
    const [applied, setApplied] = useState({ from: '2026-08-01', to: '2026-08-31' });

    return (
        <>
            <div className="card card-pad" style={{ marginBottom: 18 }}>
                <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
                    <div className="field">
                        <label>From</label>
                        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                    </div>
                    <div className="field">
                        <label>To</label>
                        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ marginTop: 18 }}
                        onClick={() => setApplied({ from: from || '2026-01-01', to: to || '2026-12-31' })}
                    >
                        <Icon name="filter" /> Apply Filter
                    </button>
                </div>
            </div>
            <div>
                <DueTable list={duesInRange(applied.from, applied.to)} emptyMsg="No dues in this date range." handlers={handlers} />
            </div>
        </>
    );
}

function DueFollowupPane({ onResendSms }) {
    ensureFollowupSmsSent();

    const list = duesFollowupWindow();
    const sentCount = list.filter((i) => {
        const last = followupNotificationsFor(i.id).slice(-1)[0];

        return last && last.status === 'sent';
    }).length;
    const failedCount = list.length - sentCount;

    return (
        <>
            <div className="grid grid-3" style={{ marginBottom: 18 }}>
                <KpiCard icon="send" label="In Follow-up Window" value={list.length} color="#8b5cf6" />
                <KpiCard icon="checkCircle" label="SMS Delivered" value={sentCount} color="#10b981" />
                <KpiCard icon="alertCircle" label="SMS Failed" value={failedCount} color="#ef4444" />
            </div>
            <div className="badge badge-blue" style={{ whiteSpace: 'normal', marginBottom: 14 }}>
                <Icon name="notification" /> Every due payment within 7 days (upcoming or already overdue) automatically gets an SMS reminder once per
                day. Admin/Accountant can see delivery status here and manually resend at any time.
            </div>
            {list.length ? (
                <div className="card">
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Phone</th>
                                    <th>Due</th>
                                    <th>Due Date</th>
                                    <th>Timing</th>
                                    <th>Last SMS</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((inv) => {
                                    const s = studentById(inv.student_id);
                                    const notifs = followupNotificationsFor(inv.id);
                                    const last = notifs.slice(-1)[0];
                                    const days = invoiceDaysUntilDue(inv);

                                    return (
                                        <tr key={inv.id}>
                                            <td className="cell-strong">{s?.name || '—'}</td>
                                            <td>{s?.phone || '—'}</td>
                                            <td>{fmtMoney(inv.due)}</td>
                                            <td>{fmtDate(inv.due_date)}</td>
                                            <td>
                                                {days >= 0 ? (
                                                    <StatusBadge status="pending" label={`In ${days}d`} />
                                                ) : (
                                                    <StatusBadge status="overdue" label={`${Math.abs(days)}d overdue`} />
                                                )}
                                            </td>
                                            <td>
                                                {last ? <StatusBadge status={last.status} /> : <span className="muted">—</span>}{' '}
                                                <span className="cell-sub">({notifs.length} sent)</span>
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-outline" onClick={() => onResendSms(inv.id)}>
                                                    <Icon name="send" /> Notify Again
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <FinanceEmpty icon="checkCircle" message="No payments due within the next 7 days." />
            )}
        </>
    );
}

export default function DuePane({ tab, handlers, onResendSms }) {
    if (tab === 'today') return <DueTodayPane handlers={handlers} />;
    if (tab === 'all') return <DueAllPane handlers={handlers} />;
    if (tab === 'range') return <DueRangePane handlers={handlers} />;
    if (tab === 'followup') return <DueFollowupPane onResendSms={onResendSms} />;

    return null;
}
