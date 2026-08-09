/* Apply Discount modal — ported from applyDiscountModal() in public/prototype/js/render-finance.js
   and the `save-discount` case in app.js. */

import { useState } from 'react';
import { fmtMoney, studentById } from '../../../lib/db';
import { Icon } from '../../../lib/ui';

export function applyDiscountSub(invoice) {
    const s = studentById(invoice.student_id);

    return `${s.name} (${s.code}) — current due ${fmtMoney(invoice.due)}`;
}

export function ApplyDiscountBody({ draft, invoice }) {
    const [amount, setAmount] = useState(draft.amount);
    const [reason, setReason] = useState(draft.reason);

    return (
        <>
            <div className="form-grid single">
                <div className="field">
                    <label>Discount Amount (BDT) *</label>
                    <input
                        type="number"
                        max={invoice.due}
                        min="1"
                        placeholder="e.g. 1000"
                        value={amount}
                        onChange={(event) => {
                            setAmount(event.target.value);
                            draft.amount = event.target.value;
                        }}
                    />
                </div>
                <div className="field">
                    <label>Reason *</label>
                    <textarea
                        placeholder="Why is this discount being given?"
                        value={reason}
                        onChange={(event) => {
                            setReason(event.target.value);
                            draft.reason = event.target.value;
                        }}
                    />
                </div>
            </div>
            <div className="badge badge-amber" style={{ whiteSpace: 'normal', textAlign: 'left', marginTop: 10 }}>
                <Icon name="shield" /> Only users with "Approve" permission on Payments (managed by Admin via Access Control) can apply discounts.
            </div>
        </>
    );
}
