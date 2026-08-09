/* Change Invoice Status modal — ported from changeInvoiceStatusModal() in
   public/prototype/js/render-finance.js and the `save-change-invoice-status` case in app.js. */

import { useState } from 'react';
import { INVOICE_STATUSES, studentById } from '../../../lib/db';
import { Icon } from '../../../lib/ui';

export function changeInvoiceStatusSub(invoice) {
    const s = studentById(invoice.student_id);

    return `${invoice.invoice_no} — ${s?.name || ''} · current: ${invoice.status}`;
}

export function ChangeInvoiceStatusBody({ draft }) {
    const [status, setStatus] = useState(draft.status);
    const [reason, setReason] = useState(draft.reason);

    return (
        <>
            <div className="form-grid single">
                <div className="field">
                    <label>New Status *</label>
                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            draft.status = event.target.value;
                        }}
                    >
                        {INVOICE_STATUSES.map((st) => (
                            <option key={st} value={st}>
                                {st[0].toUpperCase() + st.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Reason / Notes *</label>
                    <textarea
                        placeholder="Why is this invoice's status being manually changed?"
                        value={reason}
                        onChange={(event) => {
                            setReason(event.target.value);
                            draft.reason = event.target.value;
                        }}
                    />
                </div>
            </div>
            <div className="badge badge-amber" style={{ whiteSpace: 'normal', textAlign: 'left', marginTop: 10 }}>
                <Icon name="alertCircle" /> Manual overrides are logged in the Audit Log. Prefer "Record Payment" for normal collections — use this only
                for corrections, write-offs or cancellations.
            </div>
        </>
    );
}
