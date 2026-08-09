/* Reject Payment Request modal body — ported from rejectTeacherPaymentModal() in
   public/prototype/js/render-teacherpay.js. */

import { useEffect, useState } from 'react';

export default function RejectForm({ submitRef, onSubmit }) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        submitRef.current = () => onSubmit({ reason: reason.trim() });
    });

    return (
        <div className="form-grid single">
            <div className="field">
                <label>Reason for Rejection *</label>
                <textarea
                    placeholder="e.g. Budget not approved, incorrect amount, etc."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                />
            </div>
        </div>
    );
}
