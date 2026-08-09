/* Change Student Status modal — ported from changeStudentStatusModal() in
   public/prototype/js/render-students.js and the open/save-change-student-status
   cases in public/prototype/js/app.js. */

import { useCallback, useState } from 'react';
import { STUDENT_STATUS_LABELS, changeStudentStatus, studentById } from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

/* The prototype read the two fields back off the DOM on save; the draft object keeps the
   same "read it when the footer button is clicked" contract while the inputs stay controlled. */
function ChangeStatusForm({ draft }) {
    const [newStatus, setNewStatus] = useState(draft.newStatus);
    const [reason, setReason] = useState(draft.reason);

    return (
        <div className="form-grid single">
            <div className="field">
                <label>New Status *</label>
                <select
                    value={newStatus}
                    onChange={(event) => {
                        draft.newStatus = event.target.value;
                        setNewStatus(event.target.value);
                    }}
                >
                    {Object.entries(STUDENT_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Reason / Notes</label>
                <textarea
                    placeholder="Why is the status changing? (optional, kept in Audit Log)"
                    value={reason}
                    onChange={(event) => {
                        draft.reason = event.target.value;
                        setReason(event.target.value);
                    }}
                />
            </div>
        </div>
    );
}

export function useChangeStudentStatusModal(onSaved) {
    const { openModal, closeModal, toast } = useUi();
    const { userId, can } = useIdentity();

    return useCallback(
        (id) => {
            if (!can('Students', 'ChangeStatus')) {
                toast("You don't have permission to change student status", 'error');

                return;
            }

            const s = studentById(id);

            if (!s) {
                return;
            }

            const draft = { newStatus: s.status, reason: '' };

            openModal({
                title: 'Change Student Status',
                sub: `${s.name} (${s.code}) — current: ${STUDENT_STATUS_LABELS[s.status]}`,
                body: <ChangeStatusForm draft={draft} />,
                foot: (
                    <>
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                if (!can('Students', 'ChangeStatus')) {
                                    toast("You don't have permission to change student status", 'error');

                                    return;
                                }

                                changeStudentStatus(s.id, draft.newStatus, draft.reason.trim(), userId);
                                closeModal();
                                toast('Student status updated');
                                onSaved?.();
                            }}
                        >
                            <Icon name="check" /> Update Status
                        </button>
                    </>
                ),
            });
        },
        [openModal, closeModal, toast, can, userId, onSaved],
    );
}
