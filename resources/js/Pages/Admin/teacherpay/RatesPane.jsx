/* "Pay Rates & Earnings" tab — ported from teacherPayPane('rates') in public/prototype/js/render-teacherpay.js. */

import {
    DB,
    PAY_RATE_TYPE_LABELS,
    batchName,
    computeEarnedForTeacherBatch,
    courseName,
    fmtMoney,
    hoursTaughtByTeacherForBatch,
    isTeacherRole,
    outstandingForTeacherBatch,
    payRateFor,
    scopedBatchesForUser,
    sessionsHeldByTeacherForBatch,
    teacherBatchPairs,
    totalInFlightForTeacherBatch,
    totalPaidToTeacherForBatch,
    userName,
} from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Icon } from '../../../lib/ui';

function Progress({ teacherId, batchId, rate }) {
    if (!rate) {
        return '—';
    }

    if (rate.rate_type === 'per_session') {
        return `${sessionsHeldByTeacherForBatch(teacherId, batchId).length} classes held`;
    }

    if (rate.rate_type === 'per_hour') {
        return `${hoursTaughtByTeacherForBatch(teacherId, batchId)} hrs taught`;
    }

    return <span className="muted">Fixed — no tracking needed</span>;
}

export default function RatesPane({ onSetRate, onRaise }) {
    const { userId, can } = useIdentity();
    const isTeacher = isTeacherRole(userId);
    const canEdit = can('TeacherPayments', 'Edit');
    const canCreate = can('TeacherPayments', 'Create');
    const scopedBatchIds = scopedBatchesForUser(userId).map((b) => b.id);
    const pairs = teacherBatchPairs(scopedBatchIds);

    return (
        <div className="card">
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Batch</th>
                            <th>Rate</th>
                            <th>Progress</th>
                            <th>Earned</th>
                            <th>Paid</th>
                            <th>Outstanding</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {pairs.length ? (
                            pairs.map((pr) => {
                                const rate = payRateFor(pr.teacher_id, pr.batch_id);
                                const earned = computeEarnedForTeacherBatch(pr.teacher_id, pr.batch_id);
                                const paid = totalPaidToTeacherForBatch(pr.teacher_id, pr.batch_id);
                                const inFlight = totalInFlightForTeacherBatch(pr.teacher_id, pr.batch_id);
                                const outstanding = outstandingForTeacherBatch(pr.teacher_id, pr.batch_id);

                                return (
                                    <tr key={`${pr.teacher_id}-${pr.batch_id}`}>
                                        <td className="cell-strong">{userName(pr.teacher_id)}</td>
                                        <td>
                                            {batchName(pr.batch_id)}
                                            <div className="cell-sub">{courseName(DB.batches.find((b) => b.id === pr.batch_id)?.course_id)}</div>
                                        </td>
                                        <td>
                                            {rate ? (
                                                <>
                                                    <span className="badge badge-blue">{PAY_RATE_TYPE_LABELS[rate.rate_type]}</span>
                                                    <div className="cell-sub">
                                                        {fmtMoney(rate.rate_amount)}
                                                        {rate.rate_type === 'per_session' ? ' / class' : rate.rate_type === 'per_hour' ? ' / hr' : ''}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="muted">No rate set</span>
                                            )}
                                        </td>
                                        <td>
                                            <Progress teacherId={pr.teacher_id} batchId={pr.batch_id} rate={rate} />
                                        </td>
                                        <td className="cell-strong">{fmtMoney(earned)}</td>
                                        <td style={{ color: 'var(--success-700)' }}>{fmtMoney(paid)}</td>
                                        <td style={{ color: outstanding > 0 ? 'var(--danger-600)' : 'var(--gray-400)' }}>
                                            {fmtMoney(outstanding)}
                                            {inFlight > 0 ? <div className="cell-sub">{fmtMoney(inFlight)} in review</div> : null}
                                        </td>
                                        <td>
                                            {!isTeacher ? (
                                                <div className="flex-gap">
                                                    {canEdit ? (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-ghost"
                                                            title={`${rate ? 'Edit' : 'Set'} pay rate`}
                                                            onClick={() => onSetRate(pr.teacher_id, pr.batch_id)}
                                                        >
                                                            <Icon name="edit" />
                                                        </button>
                                                    ) : null}
                                                    {canCreate && rate ? (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline"
                                                            onClick={() => onRaise(pr.teacher_id, pr.batch_id)}
                                                        >
                                                            <Icon name="send" /> Raise Payment
                                                        </button>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={8} className="muted">
                                    No batch-teacher assignments{isTeacher ? ' for you' : ''} yet — assign teachers to a batch from "Batches &amp;
                                    Classes" first.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
