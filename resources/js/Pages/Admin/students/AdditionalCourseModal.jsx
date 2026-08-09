/* Add Additional Course (Admin Override) modal — ported from addAdditionalCourseModal() in
   public/prototype/js/render-students.js and the save-additional-course case in
   public/prototype/js/app.js. */

import { useCallback, useState } from 'react';
import { DB, batchSeatsAvailable, canEnrollInBatch, studentById } from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

/* The prototype stored course/batch/price on the <option> as data-* attributes and read them back
   off `selectedOptions[0]`; here the same triple is encoded into the option value. */
function courseBatchOptions() {
    return DB.courses
        .filter((c) => c.status === 'active')
        .flatMap((c) =>
            DB.batches
                .filter((b) => b.course_id === c.id && b.status !== 'completed')
                .map((b) => {
                    const seatsLeft = batchSeatsAvailable(b.id);

                    return {
                        value: `${c.id}:${b.id}:${c.base_price}`,
                        label: `${c.name} — ${b.name} (${seatsLeft <= 0 ? 'FULL' : `${seatsLeft} seats left`})`,
                        disabled: seatsLeft <= 0,
                        courseId: c.id,
                        batchId: b.id,
                        price: c.base_price,
                    };
                }),
        );
}

function AdditionalCourseForm({ draft, options }) {
    const [selected, setSelected] = useState(draft.selected);
    const [reason, setReason] = useState(draft.reason);

    return (
        <>
            <div className="badge badge-amber" style={{ whiteSpace: 'normal', textAlign: 'left', marginBottom: 14 }}>
                <Icon name="alertCircle" /> This will be tagged as an <b>Additional</b> enrollment (not primary) and logged with your name, date
                &amp; reason — visible in the student's history and in Reports for auditing multi-course students.
            </div>
            <div className="form-grid single">
                <div className="field">
                    <label>Course &amp; Batch *</label>
                    <select
                        value={selected}
                        onChange={(event) => {
                            draft.selected = event.target.value;
                            setSelected(event.target.value);
                        }}
                    >
                        {options.map((o) => (
                            <option key={o.value} value={o.value} disabled={o.disabled}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Reason for exception *</label>
                    <textarea
                        placeholder="Why is this student being enrolled in more than one course?"
                        value={reason}
                        onChange={(event) => {
                            draft.reason = event.target.value;
                            setReason(event.target.value);
                        }}
                    />
                </div>
            </div>
        </>
    );
}

export function useAdditionalCourseModal(onSaved) {
    const { openModal, closeModal, toast } = useUi();
    const { userId } = useIdentity();

    return useCallback(
        (studentId) => {
            const sid = Number(studentId);
            const s = studentById(sid);

            if (!s) {
                return;
            }

            const options = courseBatchOptions();
            const draft = { selected: options.find((o) => !o.disabled)?.value ?? '', reason: '' };

            openModal({
                title: 'Add Additional Course (Admin Override)',
                sub: `${s.name} already has ${s.courses.length} enrollment(s) — this is a deliberate exception to the one-course rule`,
                body: <AdditionalCourseForm draft={draft} options={options} />,
                foot: (
                    <>
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                const opt = options.find((o) => o.value === draft.selected);
                                const reason = draft.reason || 'Admin override — see history for details.';

                                if (opt) {
                                    const cap = canEnrollInBatch(opt.batchId);

                                    if (!cap.ok) {
                                        toast(cap.reason, 'error');

                                        return;
                                    }

                                    s.courses.push({
                                        course_id: opt.courseId,
                                        batch_id: opt.batchId,
                                        enrolled_price: opt.price,
                                        discount: 0,
                                        date: '2026-08-06',
                                        status: 'active',
                                        type: 'additional',
                                        added_by: userId,
                                        added_reason: reason,
                                        added_date: '2026-08-06',
                                    });
                                }

                                closeModal();
                                toast('Additional course added — tagged for history/reporting');
                                onSaved?.(sid);
                            }}
                        >
                            <Icon name="check" /> Add &amp; Tag as Additional
                        </button>
                    </>
                ),
            });
        },
        [openModal, closeModal, toast, userId, onSaved],
    );
}
