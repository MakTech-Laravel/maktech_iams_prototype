/* Raise Payment Request modal body — ported from raiseTeacherPaymentModal() in
   public/prototype/js/render-teacherpay.js. The earned figure shown here is the same value the
   prototype carried on the footer button as data-computed. */

import { useEffect, useState } from 'react';
import {
    TEACHER_PAY_TYPE_LABELS,
    TODAY,
    computeEarnedForTeacherBatch,
    fmtMoney,
    outstandingForTeacherBatch,
    totalPaidToTeacherForBatch,
} from '../../../lib/db';

function monthLabel(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'long' });
}

export default function RaisePaymentForm({ teacherId, batchId, submitRef, onSubmit }) {
    const earned = computeEarnedForTeacherBatch(teacherId, batchId);
    const outstanding = outstandingForTeacherBatch(teacherId, batchId);
    const [type, setType] = useState(Object.keys(TEACHER_PAY_TYPE_LABELS)[0]);
    const [periodLabel, setPeriodLabel] = useState(`${monthLabel(TODAY)} ${new Date(TODAY).getFullYear()}`);
    const [amount, setAmount] = useState(outstanding ? String(outstanding) : '');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        submitRef.current = () =>
            onSubmit({
                type,
                periodLabel: periodLabel.trim(),
                amount: Number(amount) || 0,
                computedAmount: earned,
                notes: notes.trim(),
            });
    });

    return (
        <>
            <div className="grid grid-3" style={{ marginBottom: 18 }}>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{fmtMoney(earned)}</div>
                    <div className="cell-sub">Earned So Far</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success-700)' }}>
                        {fmtMoney(totalPaidToTeacherForBatch(teacherId, batchId))}
                    </div>
                    <div className="cell-sub">Already Paid</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: outstanding > 0 ? 'var(--danger-600)' : 'var(--gray-400)' }}>
                        {fmtMoney(outstanding)}
                    </div>
                    <div className="cell-sub">Outstanding</div>
                </div>
            </div>
            <div className="form-grid">
                <div className="field span-2">
                    <label>Payment Type *</label>
                    <select value={type} onChange={(event) => setType(event.target.value)}>
                        {Object.entries(TEACHER_PAY_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field span-2">
                    <label>Period / Description *</label>
                    <input
                        type="text"
                        placeholder="e.g. August 2026, or Full batch settlement"
                        value={periodLabel}
                        onChange={(event) => setPeriodLabel(event.target.value)}
                    />
                </div>
                <div className="field span-2">
                    <label>Amount to Request (BDT) *</label>
                    <input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
                </div>
                <div className="field span-2">
                    <label>Notes</label>
                    <textarea placeholder="Optional context for the approver" value={notes} onChange={(event) => setNotes(event.target.value)} />
                </div>
            </div>
        </>
    );
}
