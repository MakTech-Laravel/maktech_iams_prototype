/* Disburse Payment modal body — ported from markPaidModal() in public/prototype/js/render-teacherpay.js. */

import { useEffect, useState } from 'react';

export default function DisburseForm({ submitRef, onSubmit }) {
    const [method, setMethod] = useState('cash');
    const [txnRef, setTxnRef] = useState('');

    useEffect(() => {
        submitRef.current = () => onSubmit({ method, txnRef: txnRef.trim() });
    });

    return (
        <div className="form-grid">
            <div className="field">
                <label>Payment Method *</label>
                <select value={method} onChange={(event) => setMethod(event.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="cheque">Cheque</option>
                </select>
            </div>
            <div className="field">
                <label>Transaction / Cheque Ref.</label>
                <input type="text" placeholder="Optional reference no." value={txnRef} onChange={(event) => setTxnRef(event.target.value)} />
            </div>
        </div>
    );
}
