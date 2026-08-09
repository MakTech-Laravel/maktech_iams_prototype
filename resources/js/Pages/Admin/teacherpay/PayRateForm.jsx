/* Set / Edit Pay Rate modal body — ported from setPayRateModal() in public/prototype/js/render-teacherpay.js.
   The prototype read #tpRateType / #tpRateAmount / #tpRateNotes at click time; here the fields are controlled
   and the modal footer button fires through submitRef. */

import { useEffect, useState } from 'react';
import { DB, PAY_RATE_TYPE_LABELS, courseName, payRateFor, setPayRate, userName } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export default function PayRateForm({ teacherId, batchId, submitRef, onSubmit }) {
    const rate = payRateFor(teacherId, batchId);
    const [rateType, setRateType] = useState(rate?.rate_type || Object.keys(PAY_RATE_TYPE_LABELS)[0]);
    const [rateAmount, setRateAmount] = useState(rate?.rate_amount ? String(rate.rate_amount) : '');
    const [notes, setNotes] = useState(rate?.notes || '');

    useEffect(() => {
        submitRef.current = () => onSubmit({ rateType, rateAmount: Number(rateAmount) || 0, notes: notes.trim() });
    });

    return (
        <>
            <div className="form-grid">
                <div className="field span-2">
                    <label>Rate Type *</label>
                    <select value={rateType} onChange={(event) => setRateType(event.target.value)}>
                        {Object.entries(PAY_RATE_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field span-2">
                    <label>Rate Amount (BDT) *</label>
                    <input
                        type="number"
                        value={rateAmount}
                        placeholder="e.g. 800"
                        onChange={(event) => setRateAmount(event.target.value)}
                    />
                </div>
                <div className="field span-2">
                    <label>Notes</label>
                    <textarea
                        value={notes}
                        placeholder="Optional — e.g. negotiation terms"
                        onChange={(event) => setNotes(event.target.value)}
                    />
                </div>
            </div>
            <div className="badge badge-blue" style={{ whiteSpace: 'normal', marginTop: 6 }}>
                <Icon name="notification" /> "Per Class Held" uses real attendance-marking records; "Per Hour Taught" uses class-schedule hours.
                Both update live as more classes are conducted.
            </div>
        </>
    );
}

/* The prototype's `open-set-payrate` / `save-payrate` pair. Shared because the action is reachable
   both from Teacher Payments' rates table and from the Manage Teachers modal on Batches. */
export function useSetPayRateModal(onSaved) {
    const { openModal, closeModal, toast } = useUi();

    return (teacherId, batchId) => {
        const b = DB.batches.find((x) => x.id === Number(batchId));

        if (!b) {
            return;
        }

        const rate = payRateFor(Number(teacherId), b.id);
        const submitRef = { current: () => {} };

        openModal({
            title: `${rate ? 'Edit' : 'Set'} Pay Rate`,
            sub: `${userName(Number(teacherId))} — ${b.name} (${courseName(b.course_id)})`,
            body: (
                <PayRateForm
                    teacherId={Number(teacherId)}
                    batchId={b.id}
                    submitRef={submitRef}
                    onSubmit={({ rateType, rateAmount, notes }) => {
                        if (rateAmount <= 0) {
                            toast('Enter a valid rate amount', 'error');

                            return;
                        }

                        setPayRate(Number(teacherId), b.id, rateType, rateAmount, notes);
                        closeModal();
                        toast('Pay rate saved');
                        onSaved?.();
                    }}
                />
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => submitRef.current()}>
                        <Icon name="check" /> Save Rate
                    </button>
                </>
            ),
        });
    };
}
