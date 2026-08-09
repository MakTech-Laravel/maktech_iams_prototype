/* Bank deposit / cash handover modal — ported from cashHandoverModal() in
   public/prototype/js/render-finance.js and the `save-cash-handover` case in app.js. */

import { useState } from 'react';
import { DB, cashCustodians, fmtDate, fmtMoney, roleName, studentName, sum, undepositedCashPayments } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { AttachmentUploadField } from './CashAttachment';

export function cashHandoverTarget(selectedIds) {
    const ids = selectedIds && selectedIds.length ? selectedIds : undepositedCashPayments().map((p) => p.id);
    const payments = DB.payments.filter((p) => ids.includes(p.id));

    return { ids, payments, total: sum(payments, (p) => p.amount) };
}

export function cashHandoverSub(payments, total) {
    return payments.length
        ? `${payments.length} cash receipt(s) selected — total ${fmtMoney(total)}`
        : 'No undeposited cash receipts available right now';
}

export function CashHandoverBody({ draft, type, payments, total, currentUserId, onError }) {
    const isBank = type === 'bank_deposit';
    const custodians = cashCustodians().filter((u) => u.id !== currentUserId);

    const [bankName, setBankName] = useState(draft.bankName);
    const [branch, setBranch] = useState(draft.branch);
    const [accountNo, setAccountNo] = useState(draft.accountNo);
    const [slipNo, setSlipNo] = useState(draft.slipNo);
    const [handedTo, setHandedTo] = useState(draft.handedTo);
    const [notes, setNotes] = useState(draft.notes);
    const [attachment, setAttachment] = useState(draft.attachment);

    const changeAttachment = (next) => {
        setAttachment(next);
        draft.attachment = next;
    };

    return (
        <>
            {payments.length ? (
                <div className="table-wrap" style={{ marginBottom: 16, maxHeight: 180, overflow: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Receipt</th>
                                <th>Student</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.receipt_no}</td>
                                    <td>{studentName(p.student_id)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmtMoney(p.amount)}</td>
                                    <td>{fmtDate(p.date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="badge badge-amber" style={{ whiteSpace: 'normal', marginBottom: 14 }}>
                    <Icon name="alertCircle" /> There is currently no undeposited cash to bundle. Collect a cash payment first.
                </div>
            )}

            <div className="form-grid">
                {isBank ? (
                    <>
                        <div className="field">
                            <label>Bank Name *</label>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(event) => {
                                    setBankName(event.target.value);
                                    draft.bankName = event.target.value;
                                }}
                            />
                        </div>
                        <div className="field">
                            <label>Branch</label>
                            <input
                                type="text"
                                value={branch}
                                onChange={(event) => {
                                    setBranch(event.target.value);
                                    draft.branch = event.target.value;
                                }}
                            />
                        </div>
                        <div className="field">
                            <label>Account No. *</label>
                            <input
                                type="text"
                                value={accountNo}
                                onChange={(event) => {
                                    setAccountNo(event.target.value);
                                    draft.accountNo = event.target.value;
                                }}
                            />
                        </div>
                        <div className="field">
                            <label>Deposit Slip No. *</label>
                            <input
                                type="text"
                                placeholder="Bank-issued slip / reference number"
                                value={slipNo}
                                onChange={(event) => {
                                    setSlipNo(event.target.value);
                                    draft.slipNo = event.target.value;
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="field span-2">
                            <label>Hand Over To *</label>
                            <select
                                value={String(handedTo)}
                                onChange={(event) => {
                                    setHandedTo(event.target.value);
                                    draft.handedTo = event.target.value;
                                }}
                            >
                                {custodians.map((u) => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.name} — {roleName(u.role_id)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field span-2">
                            <div className="badge badge-amber" style={{ whiteSpace: 'normal' }}>
                                <Icon name="shield" /> The recipient (or an authorized approver) must sign to confirm they physically received this cash
                                before it's considered settled.
                            </div>
                        </div>
                    </>
                )}
                <div className="field span-2">
                    <label>Amount (BDT)</label>
                    <input type="text" value={fmtMoney(total)} readOnly />
                </div>
                <AttachmentUploadField inputId="chAttachmentInput" attachment={attachment} onChange={changeAttachment} onError={onError} />
                <div className="field span-2">
                    <label>Notes</label>
                    <textarea
                        placeholder="Optional notes"
                        value={notes}
                        onChange={(event) => {
                            setNotes(event.target.value);
                            draft.notes = event.target.value;
                        }}
                    />
                </div>
            </div>
        </>
    );
}
