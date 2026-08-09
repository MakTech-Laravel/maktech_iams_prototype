/* Register New Student modal — ported from addStudentModal() / onAddStudentCourseChange() in
   public/prototype/js/render-students.js and the save-student case in public/prototype/js/app.js. */

import { useCallback, useState } from 'react';
import { DB, batchSeatsAvailable, canEnrollInBatch, labName, registerStudentWithEnrollment } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

function activeCourses() {
    return DB.courses.filter((c) => c.status === 'active');
}

/* Batch list is scoped to the selected course and shows live seats-left (capped by the assigned lab);
   full batches are shown but disabled. */
function openBatchesForCourse(courseId) {
    return DB.batches.filter((b) => b.course_id === Number(courseId) && b.status !== 'completed');
}

function firstSelectableBatchId(courseId) {
    const batch = openBatchesForCourse(courseId).find((b) => batchSeatsAvailable(b.id) > 0);

    return batch ? String(batch.id) : '';
}

function AddStudentForm({ draft }) {
    const [values, setValues] = useState({ ...draft });

    const set = (patch) => {
        Object.assign(draft, patch);
        setValues((current) => ({ ...current, ...patch }));
    };

    const batches = openBatchesForCourse(values.courseId);

    return (
        <>
            <div className="tabs" style={{ marginBottom: 14 }}>
                <button type="button" className="tab-btn active">
                    Personal Info
                </button>
                <button type="button" className="tab-btn">
                    Academic &amp; Course
                </button>
                <button type="button" className="tab-btn">
                    Documents
                </button>
            </div>
            <div className="form-grid">
                <div className="field">
                    <label>Full Name *</label>
                    <input type="text" placeholder="Student full name" value={values.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div className="field">
                    <label>Date of Birth</label>
                    <input type="date" value={values.dob} onChange={(e) => set({ dob: e.target.value })} />
                </div>
                <div className="field">
                    <label>Gender</label>
                    <select value={values.gender} onChange={(e) => set({ gender: e.target.value })}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="field">
                    <label>NID / Birth Cert No.</label>
                    <input type="text" value={values.nid} onChange={(e) => set({ nid: e.target.value })} />
                </div>
                <div className="field">
                    <label>Phone (Portal Login) *</label>
                    <input type="text" placeholder="01XXXXXXXXX" value={values.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <div className="field">
                    <label>Email (optional)</label>
                    <input type="text" value={values.email} onChange={(e) => set({ email: e.target.value })} />
                </div>
                <div className="field span-2">
                    <label>Present Address</label>
                    <input type="text" value={values.presentAddress} onChange={(e) => set({ presentAddress: e.target.value })} />
                </div>
                <div className="field span-2">
                    <label>Permanent Address</label>
                    <input type="text" value={values.permanentAddress} onChange={(e) => set({ permanentAddress: e.target.value })} />
                </div>
                <div className="field">
                    <label>Institution *</label>
                    <select value={values.institutionId} onChange={(e) => set({ institutionId: e.target.value })}>
                        {DB.institutions.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Roll/Reg No.</label>
                    <input type="text" value={values.roll} onChange={(e) => set({ roll: e.target.value })} />
                </div>
                <div className="field">
                    <label>Guardian Name</label>
                    <input type="text" value={values.guardianName} onChange={(e) => set({ guardianName: e.target.value })} />
                </div>
                <div className="field">
                    <label>Guardian Phone</label>
                    <input type="text" value={values.guardianPhone} onChange={(e) => set({ guardianPhone: e.target.value })} />
                </div>
                <div className="field">
                    <label>Course *</label>
                    <select
                        value={values.courseId}
                        onChange={(e) => set({ courseId: e.target.value, batchId: firstSelectableBatchId(e.target.value) })}
                    >
                        {activeCourses().map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Batch *</label>
                    <select value={values.batchId} onChange={(e) => set({ batchId: e.target.value })}>
                        {batches.length ? (
                            batches.map((b) => {
                                const seatsLeft = batchSeatsAvailable(b.id);

                                return (
                                    <option key={b.id} value={b.id} disabled={seatsLeft <= 0}>
                                        {b.name} — {labName(b.lab_id)} ({seatsLeft <= 0 ? 'FULL' : `${seatsLeft} seats left`})
                                    </option>
                                );
                            })
                        ) : (
                            <option value="">No open batches for this course</option>
                        )}
                    </select>
                </div>
                <div className="field span-2">
                    <div className="badge badge-blue" style={{ whiteSpace: 'normal', textAlign: 'left' }}>
                        <Icon name="alertCircle" /> A student can be actively enrolled in only ONE course &amp; ONE batch through this form. Need
                        to add a second course for this student? Do it afterwards from their profile → Courses tab → "Add Additional Course (Admin
                        Override)" — it will be tagged and reasoned for history/reporting.
                    </div>
                </div>
            </div>
        </>
    );
}

export function useAddStudentModal(onSaved) {
    const { openModal, closeModal, toast } = useUi();

    return useCallback(() => {
        const firstCourseId = String(activeCourses()[0]?.id ?? '');
        const draft = {
            name: '',
            dob: '',
            gender: 'Male',
            nid: '',
            phone: '',
            email: '',
            presentAddress: '',
            permanentAddress: '',
            institutionId: String(DB.institutions[0]?.id ?? ''),
            roll: '',
            guardianName: '',
            guardianPhone: '',
            courseId: firstCourseId,
            batchId: firstSelectableBatchId(firstCourseId),
        };

        openModal({
            size: 'lg',
            title: 'Register New Student',
            sub: 'Staff-assisted registration — personal info, academic background & course assignment',
            body: <AddStudentForm draft={draft} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            const name = draft.name.trim();
                            const phone = draft.phone.trim();

                            if (!name || !phone || !draft.courseId || !draft.batchId) {
                                toast('Name, phone, course & batch are all required', 'error');

                                return;
                            }

                            const cap = canEnrollInBatch(draft.batchId);

                            if (!cap.ok) {
                                toast(cap.reason, 'error');

                                return;
                            }

                            registerStudentWithEnrollment({
                                name,
                                phone,
                                courseId: draft.courseId,
                                batchId: draft.batchId,
                                dob: draft.dob,
                                gender: draft.gender,
                                nid: draft.nid.trim(),
                                email: draft.email.trim(),
                                presentAddress: draft.presentAddress.trim(),
                                permanentAddress: draft.permanentAddress.trim(),
                                institutionId: draft.institutionId,
                                roll: draft.roll.trim(),
                                guardianName: draft.guardianName.trim(),
                                guardianPhone: draft.guardianPhone.trim(),
                            });

                            closeModal();
                            toast('Student registered successfully — enrolled in one primary course & batch');
                            onSaved?.();
                        }}
                    >
                        <Icon name="check" /> Register Student
                    </button>
                </>
            ),
        });
    }, [openModal, closeModal, toast, onSaved]);
}
