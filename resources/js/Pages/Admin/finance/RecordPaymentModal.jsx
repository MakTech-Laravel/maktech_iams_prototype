/* Record Payment modal — ported from recordPaymentModal() and onRecordPaymentStudentChange()
   in public/prototype/js/render-finance.js, plus the `save-payment` case in app.js.

   The prototype read the form back through document.getElementById() when the footer button was
   clicked. Here the fields are controlled React state that mirrors every change onto a plain
   `draft` object, which the footer button (rendered outside this component by the modal host) reads. */

import { useState } from 'react';
import { DB, fmtMoney, invoiceForStudent, studentById } from '../../../lib/db';
import { Icon } from '../../../lib/ui';

export const PAYMENT_METHODS = ['Cash', 'Cheque', 'Bank Transfer', 'bKash', 'Nagad', 'Rocket', 'Card'];

export function recordPaymentTarget(studentId) {
    const preset = studentId ? studentById(Number(studentId)) : null;
    const s = preset || DB.students.find((st) => invoiceForStudent(st.id)?.due > 0) || DB.students[0];
    const inv = s ? invoiceForStudent(s.id) : null;

    return { student: s, invoice: inv };
}

export function recordPaymentSub(student, invoice) {
    return student
        ? `${student.name} (${student.code}) — Current Due: ${fmtMoney(invoice?.due || 0)}`
        : 'Accountant-recorded physical payment or online confirmation';
}

export function RecordPaymentBody({ draft, invoice, receiptNo, canDiscount, onApplyDiscount }) {
    const [studentId, setStudentId] = useState(draft.studentId ?? '');
    const [amount, setAmount] = useState(String(draft.amount));
    const [method, setMethod] = useState(draft.method);
    const [channel, setChannel] = useState(draft.channel);

    const currentInvoice = studentId ? invoiceForStudent(Number(studentId)) : null;
    const currentDue = currentInvoice?.due || 0;

    const changeStudent = (value) => {
        const nextInvoice = invoiceForStudent(Number(value));
        const nextDue = nextInvoice?.due || 0;

        setStudentId(value);
        setAmount(String(nextDue));
        draft.studentId = Number(value);
        draft.amount = nextDue;
    };

    return (
        <div className="form-grid">
            <div className="field span-2">
                <label>Student *</label>
                <select value={String(studentId)} onChange={(event) => changeStudent(event.target.value)}>
                    {DB.students.map((st) => (
                        <option key={st.id} value={String(st.id)}>
                            {st.name} ({st.code})
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Current Due (BDT)</label>
                <input type="text" value={currentDue} readOnly />
            </div>
            <div className="field">
                <label>Amount to Collect (BDT) *</label>
                <input
                    type="number"
                    value={amount}
                    min="1"
                    max={currentDue}
                    onChange={(event) => {
                        setAmount(event.target.value);
                        draft.amount = Number(event.target.value) || 0;
                    }}
                />
            </div>
            <div className="field">
                <label>Payment Method *</label>
                <select
                    value={method}
                    onChange={(event) => {
                        setMethod(event.target.value);
                        draft.method = event.target.value;
                    }}
                >
                    {PAYMENT_METHODS.map((m) => (
                        <option key={m}>{m}</option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Channel</label>
                <select
                    value={channel}
                    onChange={(event) => {
                        setChannel(event.target.value);
                        draft.channel = event.target.value;
                    }}
                >
                    <option value="physical">Physical (Accountant)</option>
                    <option value="online">Online (Gateway)</option>
                </select>
            </div>
            <div className="field span-2">
                <label>Receipt No. (auto-generated on save)</label>
                <input type="text" value={receiptNo} readOnly />
            </div>
            {canDiscount && invoice ? (
                <div className="field span-2">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => onApplyDiscount(invoice.id)}>
                        <Icon name="wallet" /> Apply Discount to this Invoice Instead
                    </button>
                </div>
            ) : null}
            <div className="field span-2">
                <label>Notes</label>
                <textarea placeholder="Optional notes" />
            </div>
        </div>
    );
}
