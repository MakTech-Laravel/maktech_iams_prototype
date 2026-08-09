/* New Refund Request modal — ported from addRefundModal() in public/prototype/js/render-finance.js.
   The prototype never read these fields back (the `save-refund` case only toasts), so they stay
   uncontrolled exactly as they were. */

import { DB, fmtMoney } from '../../../lib/db';

export function AddRefundBody() {
    return (
        <div className="form-grid">
            <div className="field span-2">
                <label>Student *</label>
                <select>
                    {DB.students.map((s) => (
                        <option key={s.id}>
                            {s.name} ({s.code})
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Original Receipt</label>
                <select>
                    {DB.payments.map((p) => (
                        <option key={p.id}>
                            {p.receipt_no} — {fmtMoney(p.amount)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Refund Amount *</label>
                <input type="number" placeholder="1000" />
            </div>
            <div className="field span-2">
                <label>Reason *</label>
                <textarea placeholder="Explain the reason for refund" />
            </div>
        </div>
    );
}
