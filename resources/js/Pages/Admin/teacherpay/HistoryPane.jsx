/* "Payment History" tab — ported from teacherPayPane('history') in public/prototype/js/render-teacherpay.js. */

import {
    TEACHER_PAY_TYPE_LABELS,
    batchName,
    fmtDate,
    fmtMoney,
    scopedBatchesForUser,
    teacherPaymentsScopedForUser,
    userName,
} from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Icon, MethodBadge, StatusBadge } from '../../../lib/ui';

export default function HistoryPane({ onView }) {
    const { userId } = useIdentity();
    const scopedBatchIds = scopedBatchesForUser(userId).map((b) => b.id);
    const rows = teacherPaymentsScopedForUser(userId)
        .filter((p) => scopedBatchIds.includes(p.batch_id) && (p.status === 'paid' || p.status === 'rejected'))
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
                            <th>Method / Reason</th>
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
                                        {p.status === 'paid' ? (
                                            <>
                                                <MethodBadge method={p.payment_method} />
                                                <div className="cell-sub">{fmtDate(p.paid_date)}</div>
                                            </>
                                        ) : (
                                            <span className="cell-sub">{p.rejection_reason || ''}</span>
                                        )}
                                    </td>
                                    <td>
                                        <StatusBadge status={p.status} />
                                    </td>
                                    <td>
                                        {p.status === 'paid' ? (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost"
                                                title="View & print voucher"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onView(p.id);
                                                }}
                                            >
                                                <Icon name="printer" />
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="muted">
                                    No completed payments yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
