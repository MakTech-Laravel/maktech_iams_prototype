/* "Create New Batch" modal — ported from addBatchModal() / onBatchLabChange() in
   public/prototype/js/render-academic.js and the `save-batch` case in app.js. */

import { useEffect, useState } from 'react';
import { DB, activeLabs, createBatch, labById, labName, sessionsForCourse, teacherUsers } from '../../../lib/db';
import { Icon } from '../../../lib/ui';

function AddBatchBody({ form, labs, sessionGroups }) {
    const [state, setState] = useState(form.current);

    useEffect(() => {
        form.current = state;
    }, [form, state]);

    const set = (patch) => setState((s) => ({ ...s, ...patch }));

    /* Mirrors onBatchLabChange(): clamp the capacity to the newly picked lab and restate the hint. */
    const onLabChange = (value) => {
        const lab = labById(value);

        if (!lab) {
            set({ lab: value });

            return;
        }

        setState((s) => ({
            ...s,
            lab: value,
            capMax: lab.capacity,
            capacity: !s.capacity || Number(s.capacity) > lab.capacity ? String(lab.capacity) : s.capacity,
            hint: `Max ${lab.capacity} (limited by ${lab.name})`,
        }));
    };

    const toggleTeacher = (id, checked) =>
        setState((s) => ({ ...s, teachers: checked ? [...s.teachers, id] : s.teachers.filter((t) => t !== id) }));

    return (
        <div className="form-grid">
            <div className="field span-2">
                <label>Session *</label>
                <select value={state.session} onChange={(event) => set({ session: event.target.value })}>
                    {sessionGroups.map((g) => (
                        <optgroup label={g.course.name} key={g.course.id}>
                            {g.sessions.map((s) => (
                                <option value={s.id} key={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Batch Name *</label>
                <input type="text" placeholder="e.g. Batch-26-F" value={state.name} onChange={(event) => set({ name: event.target.value })} />
            </div>
            <div className="field">
                <label>Lab / Classroom *</label>
                <select value={state.lab} onChange={(event) => onLabChange(event.target.value)}>
                    {labs.length ? (
                        labs.map((l) => (
                            <option value={l.id} key={l.id}>
                                {l.name} (max {l.capacity})
                            </option>
                        ))
                    ) : (
                        <option value="">No labs available — create one first</option>
                    )}
                </select>
            </div>
            <div className="field">
                <label>Capacity *</label>
                <input
                    type="number"
                    placeholder="35"
                    max={state.capMax ?? undefined}
                    value={state.capacity}
                    onChange={(event) => set({ capacity: event.target.value })}
                />
                <span className="hint" style={{ display: 'block', fontSize: '11.5px', color: 'var(--gray-500)', marginTop: 4 }}>
                    {state.hint}
                </span>
            </div>
            <div className="field">
                <label>Start Date *</label>
                <input type="date" value={state.start} onChange={(event) => set({ start: event.target.value })} />
            </div>
            <div className="field">
                <label>End Date *</label>
                <input type="date" value={state.end} onChange={(event) => set({ end: event.target.value })} />
            </div>
            <div className="field">
                <label>Coordinator</label>
                <select value={state.coordinator} onChange={(event) => set({ coordinator: event.target.value })}>
                    {teacherUsers().map((u) => (
                        <option value={u.id} key={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Status</label>
                <select value={state.status} onChange={(event) => set({ status: event.target.value })}>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                </select>
            </div>
            <div className="field span-2">
                <label>Assigned Teachers (they will ONLY see this batch)</label>
                <div className="flex-gap" style={{ flexWrap: 'wrap', gap: 12 }}>
                    {teacherUsers().map((u) => (
                        <label className="flex-gap" style={{ fontSize: '12.5px', cursor: 'pointer' }} key={u.id}>
                            <input
                                type="checkbox"
                                className="nbTeacherCb"
                                value={u.id}
                                checked={state.teachers.includes(u.id)}
                                onChange={(event) => toggleTeacher(u.id, event.target.checked)}
                            />{' '}
                            {u.name}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function openAddBatchModal(ctx, sessionId) {
    const labs = activeLabs();
    const sessionGroups = DB.courses.map((c) => ({ course: c, sessions: sessionsForCourse(c.id) })).filter((g) => g.sessions.length);
    const allSessionIds = sessionGroups.flatMap((g) => g.sessions.map((s) => String(s.id)));
    const preselected = sessionId != null && allSessionIds.includes(String(sessionId)) ? String(sessionId) : allSessionIds[0] || '';

    const form = {
        current: {
            session: preselected,
            name: '',
            lab: labs[0] ? String(labs[0].id) : '',
            capacity: labs[0] ? String(labs[0].capacity) : '',
            capMax: null,
            hint: labs[0] ? `Max ${labs[0].capacity} (limited by ${labs[0].name})` : '',
            start: '',
            end: '',
            coordinator: String(teacherUsers()[0]?.id ?? ''),
            status: 'upcoming',
            teachers: [],
        },
    };

    const save = () => {
        const f = form.current;
        const sessionIdNum = Number(f.session);
        const name = f.name.trim();
        const labId = f.lab;
        const capacity = Number(f.capacity);
        const start = f.start;
        const end = f.end;

        if (!sessionIdNum || !name || !labId || !capacity || !start || !end) {
            ctx.toast('Session, batch name, lab, capacity & dates are all required', 'error');

            return;
        }

        const session = DB.sessions.find((s) => s.id === sessionIdNum);
        const { batch, clamped } = createBatch({
            sessionId: sessionIdNum,
            courseId: session?.course_id,
            name,
            capacity,
            start,
            end,
            coordinatorId: f.coordinator,
            labId,
            assignedTeachers: f.teachers,
            status: f.status,
        });

        ctx.closeModal();
        ctx.toast(clamped ? `Batch created — capacity clamped to ${batch.capacity} (${labName(batch.lab_id)}'s limit)` : 'Batch created');
        ctx.refresh();
    };

    ctx.openModal({
        title: 'Create New Batch',
        sub: 'Set up a batch/class group inside a course session — capacity is automatically capped by the assigned lab',
        body: <AddBatchBody form={form} labs={labs} sessionGroups={sessionGroups} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={save}>
                    <Icon name="check" /> Create Batch
                </button>
            </>
        ),
    });
}
