/* Browse Courses & self-enrollment — ported from renderPortalBrowseCourses(), portalEnrollModal(),
   updateEnrollBatchOptions(), selectEnrollPayOption() and portalSubmitEnrollment() in the
   prototype's portal.js. */

import { useState } from 'react';
import {
    DB,
    TODAY,
    batchEnrolledCount,
    batchSeatsAvailable,
    batchesInSession,
    canEnrollInBatch,
    courseName,
    createEnrollment,
    effectiveBatchCapacity,
    fmtDate,
    fmtMoney,
    labName,
    nextId,
    pendingEnrollmentRequest,
    sessionsForCourse,
} from '../../../lib/db';
import { Icon, IconGlyph } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useReceiptPreview } from './ReceiptPreview';

function openBatches(sessionId) {
    return batchesInSession(Number(sessionId)).filter((b) => b.status !== 'completed');
}

function firstOpenBatchId(batches) {
    // The prototype disabled full batches, so the browser's default selection skipped them.
    return String(batches.find((b) => batchSeatsAvailable(b.id) > 0)?.id ?? '');
}

/* `form` is the mutable draft the modal footer's Continue button reads — the prototype read the
   same values straight off the DOM with document.getElementById(). */
function EnrollForm({ sessions, form }) {
    const [sessionId, setSessionId] = useState(form.sessionId);
    const [batchId, setBatchId] = useState(form.batchId);
    const [payOption, setPayOption] = useState(form.payOption);
    const batches = openBatches(sessionId);

    const changeSession = (value) => {
        const nextBatchId = firstOpenBatchId(openBatches(value));
        setSessionId(value);
        setBatchId(nextBatchId);
        form.sessionId = value;
        form.batchId = nextBatchId;
    };

    const changeBatch = (value) => {
        setBatchId(value);
        form.batchId = value;
    };

    const changePayOption = (value) => {
        setPayOption(value);
        form.payOption = value;
    };

    return (
        <>
            <div className="form-grid" style={{ marginBottom: 18 }}>
                <div className="field span-2">
                    <label>Session *</label>
                    <select value={sessionId} onChange={(event) => changeSession(event.target.value)}>
                        {sessions.map((ss) => (
                            <option key={ss.id} value={String(ss.id)}>
                                {ss.name} ({fmtDate(ss.start)} → {fmtDate(ss.end)})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field span-2">
                    <label>Batch *</label>
                    <select value={batchId} onChange={(event) => changeBatch(event.target.value)}>
                        {batches.length ? (
                            batches.map((b) => {
                                const seatsLeft = batchSeatsAvailable(b.id);

                                return (
                                    <option key={b.id} value={String(b.id)} disabled={seatsLeft <= 0}>
                                        {b.name} — {batchEnrolledCount(b.id)}/{effectiveBatchCapacity(b)} enrolled · {labName(b.lab_id)}
                                        {seatsLeft <= 0 ? ' (FULL)' : ''}
                                    </option>
                                );
                            })
                        ) : (
                            <option value="">No open batches in this session</option>
                        )}
                    </select>
                </div>
            </div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: 8 }}>
                How would you like to pay?
            </label>
            <div className="grid grid-2" style={{ gap: 12, marginBottom: 6 }}>
                <div className={`pay-option-card ${payOption === 'online' ? 'selected' : ''}`.trim()} onClick={() => changePayOption('online')}>
                    <b>
                        <Icon name="payment" /> Pay Online Now
                    </b>
                    <span>Instantly confirmed — bKash/Nagad/Rocket/Card (demo)</span>
                </div>
                <div className={`pay-option-card ${payOption === 'pay_later' ? 'selected' : ''}`.trim()} onClick={() => changePayOption('pay_later')}>
                    <b>
                        <Icon name="clock" /> Enroll Without Payment
                    </b>
                    <span>Sent for Admin approval — pay later, shown as due</span>
                </div>
            </div>
        </>
    );
}

export default function BrowseCourses({ student, onNavigate, refresh }) {
    const s = student;
    const { openModal, closeModal, toast } = useUi();
    const openReceipt = useReceiptPreview();
    const hasActiveCourse = s.courses.some((c) => c.type === 'primary');
    const pendingReq = pendingEnrollmentRequest(s.id);

    const submitEnrollment = (courseId, form) => {
        const sessionId = Number(form.sessionId);
        const batchId = Number(form.batchId);

        if (!batchId) {
            toast('Please choose a batch with open seats', 'error');

            return;
        }

        const cap = canEnrollInBatch(batchId);

        if (!cap.ok) {
            toast(cap.reason || 'This batch is full — please choose another batch.', 'error');
            refresh();

            return;
        }

        closeModal();

        if (form.payOption === 'online') {
            const { payment } = createEnrollment(s, Number(courseId), batchId, { paidNow: true, method: 'bkash' });
            toast('Payment successful — you are enrolled!');
            onNavigate('dashboard');

            if (payment) {
                setTimeout(() => openReceipt(payment.id), 500);
            }

            return;
        }

        DB.enrollmentRequests.push({
            id: nextId(DB.enrollmentRequests),
            student_id: s.id,
            course_id: Number(courseId),
            session_id: sessionId,
            batch_id: batchId,
            payment_option: 'pay_later',
            status: 'pending',
            requested_date: TODAY,
            reviewed_by: null,
            reviewed_date: null,
            note: '',
        });
        toast('Enrollment request submitted — awaiting Admin approval');
        onNavigate('dashboard');
    };

    const enrollModal = (courseId) => {
        const course = DB.courses.find((c) => c.id === Number(courseId));

        if (!course) {
            return;
        }

        if (s.courses.some((c) => c.type === 'primary')) {
            openModal({
                title: 'Already Enrolled',
                body: (
                    <p style={{ fontSize: '13.5px', color: 'var(--gray-600)' }}>
                        <Icon name="alertCircle" /> You already have an active course enrollment. To add another course, please contact the office — an
                        Admin can enroll you as a special exception.
                    </p>
                ),
                foot: (
                    <button type="button" className="btn btn-primary" onClick={closeModal}>
                        Got it
                    </button>
                ),
            });

            return;
        }

        if (pendingEnrollmentRequest(s.id)) {
            openModal({
                title: 'Request Already Pending',
                body: (
                    <p style={{ fontSize: '13.5px', color: 'var(--gray-600)' }}>
                        <Icon name="clock" /> You already have a pending enrollment request. Please wait for Admin approval before submitting another.
                    </p>
                ),
                foot: (
                    <button type="button" className="btn btn-primary" onClick={closeModal}>
                        Got it
                    </button>
                ),
            });

            return;
        }

        const sessions = sessionsForCourse(course.id).filter((ss) => ss.status !== 'completed');
        const firstSessionId = String(sessions[0]?.id ?? '');
        const form = { sessionId: firstSessionId, batchId: firstOpenBatchId(openBatches(firstSessionId)), payOption: 'online' };

        openModal({
            size: 'lg',
            title: `Enroll — ${course.name}`,
            sub: `${fmtMoney(course.base_price)} · ${course.duration_days} days`,
            body: <EnrollForm sessions={sessions} form={form} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => submitEnrollment(course.id, form)}>
                        <Icon name="send" /> Continue
                    </button>
                </>
            ),
        });
    };

    return (
        <>
            {hasActiveCourse ? (
                <div className="badge badge-amber" style={{ whiteSpace: 'normal', marginBottom: 18 }}>
                    <Icon name="shield" /> You're already enrolled in a primary course. Adding a second course requires Admin approval — please
                    contact the office.
                </div>
            ) : null}
            {pendingReq ? (
                <div className="badge badge-blue" style={{ whiteSpace: 'normal', marginBottom: 18 }}>
                    <Icon name="clock" /> You already have a pending enrollment request for {courseName(pendingReq.course_id)} — awaiting Admin
                    review.
                </div>
            ) : null}
            <div className="grid grid-3">
                {DB.courses
                    .filter((c) => c.status === 'active')
                    .map((c) => {
                        const seatsLeft = c.seats - c.enrolled;

                        return (
                            <div className="card course-catalog-card" key={c.id}>
                                <div className="kpi-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', marginBottom: 10 }}>
                                    <IconGlyph name="course" />
                                </div>
                                <b style={{ fontSize: '14.5px', display: 'block', marginBottom: 4 }}>{c.name}</b>
                                <p className="cell-sub" style={{ marginBottom: 12, flex: 1 }}>
                                    {c.desc}
                                </p>
                                <div className="flex-between" style={{ marginBottom: 12 }}>
                                    <span className="price">{fmtMoney(c.base_price)}</span>
                                    <span className={`badge ${seatsLeft > 5 ? 'badge-green' : 'badge-amber'}`}>{seatsLeft} seats left</span>
                                </div>
                                <button type="button" className="btn btn-primary btn-block btn-sm" onClick={() => enrollModal(c.id)}>
                                    <Icon name="plus" /> View Sessions & Enroll
                                </button>
                            </div>
                        );
                    })}
            </div>
        </>
    );
}
