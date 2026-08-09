/* Confirm Cash Receipt modal — ported from confirmCashHandoverModal() in
   public/prototype/js/render-finance.js and the `save-confirm-cash-handover` case in app.js. */

import { useState } from 'react';
import { fmtMoney, userName } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { AttachmentPreview } from './CashAttachment';

export function confirmHandoverSub(handover) {
    return `${handover.receipt_no} — ${fmtMoney(handover.amount)} from ${userName(handover.created_by)}`;
}

export function ConfirmHandoverBody({ draft, handover }) {
    const [signature, setSignature] = useState(draft.signature);

    return (
        <>
            <div className="badge badge-blue" style={{ whiteSpace: 'normal', marginBottom: 14 }}>
                <Icon name="shield" /> By signing below you confirm you have physically received {fmtMoney(handover.amount)} in cash from{' '}
                {userName(handover.created_by)}, covering {(handover.payment_ids || []).length} receipt(s).
            </div>
            {handover.attachment ? (
                <>
                    <label
                        className="hint"
                        style={{
                            textTransform: 'none',
                            fontWeight: 800,
                            color: 'var(--gray-700)',
                            fontSize: '12.5px',
                            display: 'block',
                            marginBottom: 6,
                        }}
                    >
                        Proof attached by {userName(handover.created_by)}
                    </label>
                    <AttachmentPreview attachment={handover.attachment} />
                </>
            ) : null}
            <div className="form-grid single">
                <div className="field">
                    <label>Your Full Name (Digital Signature) *</label>
                    <input
                        type="text"
                        value={signature}
                        onChange={(event) => {
                            setSignature(event.target.value);
                            draft.signature = event.target.value;
                        }}
                    />
                </div>
            </div>
        </>
    );
}
