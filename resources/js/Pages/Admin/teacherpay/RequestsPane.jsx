/* "Payment Requests" tab — ported from teacherPayPane('requests') in public/prototype/js/render-teacherpay.js. */

import {
    TEACHER_PAY_TYPE_LABELS,
    batchName,
    fmtDate,
    fmtMoney,
    isTeacherRole,
    scopedBatchesForUser,
    teacherPaymentsScopedForUser,
    userName,
} from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Icon, StatusBadge } from '../../../lib/ui';

export default function RequestsPane({ onView, onApprove, onReject, onPay }) {
    const { userId, can } = useIdentity();
    const isTeacher = isTeacherRole(userId);
    const canEdit = can('TeacherPayments', 'Edit');
    const canApprove = can('TeacherPayments', 'Approve');
    const scopedBatchIds = scopedBatchesForUser(userId).map((b) => b.id);
    const rows = teacherPaymentsScopedForUser(userId)
        .filter((p) => scopedBatchIds.includes(p.batch_id) && (p.status === 'pending' || p.status === 'approved'))
        .slice()
        .reverse();

    return (
        <div className="card">
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Voucher</th>
                            <th>Teacher</th>
                            <th>Batch</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Requested</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length ? (
                            rows.map((p) => (
                                <tr className="row-link" key={p.id} onClick={() => onView(p.id)}>
                                    <td className="cell-strong">{p.voucher_no}</td>
                                    <td>{userName(p.teacher_id)}</td>
                                    <td>{batchName(p.batch_id)}</td>
                                    <td>
                                        <span className="badge badge-purple">{TEACHER_PAY_TYPE_LABELS[p.type]}</span>
                                        <div className="cell-sub">{p.period_label}</div>
                                    </td>
                                    <td className="cell-strong">{fmtMoney(p.amount)}</td>
                                    <td>
                                        {fmtDate(p.requested_date)}
                                        <div className="cell-sub">by {userName(p.requested_by)}</div>
                                    </td>
                                    <td>
                                        <StatusBadge status={p.status} />
                                    </td>
                                    <td>
                                        {!isTeacher ? (
                                            <div className="flex-gap">
                                                {p.status === 'pending' && canApprove ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success"
                                                            title="Approve"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                onApprove(p.id);
                                                            }}
                                                        >
                                                            <Icon name="check" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-ghost"
                                                            style={{ color: 'var(--danger-600)' }}
                                                            title="Reject"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                onReject(p.id);
                                                            }}
                                                        >
                                                            <Icon name="close" />
                                                        </button>
                                                    </>
                                                ) : null}
                                                {p.status === 'approved' && canEdit ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            onPay(p.id);
                                                        }}
                                                    >
                                                        <Icon name="wallet" /> Mark Paid
                                                    </button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="muted">
                                    No pending or approved payment requests{isTeacher ? ' for you' : ''}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
