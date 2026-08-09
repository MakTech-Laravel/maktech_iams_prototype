/* "Edit Batch" modal — ported from editBatchModal() / onBatchLabChange() in
   public/prototype/js/render-academic.js and the `save-batch-edit` case in app.js. */

import { useEffect, useState } from 'react';
import { DB, activeLabs, batchEnrolledCount, courseName, labById, teacherUsers } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';

const STATUSES = ['upcoming', 'ongoing', 'completed'];

function EditBatchBody({ ctx, form, batch: b, labOptions }) {
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

    return (
        <div className="form-grid">
            <div className="field">
                <label>Batch Name *</label>
                <input type="text" value={state.name} onChange={(event) => set({ name: event.target.value })} />
            </div>
            <div className="field">
                <label>Status</label>
                {ctx.can('Batches', 'ChangeStatus') ? (
                    <select value={state.status} onChange={(event) => set({ status: event.target.value })}>
                        {STATUSES.map((s) => (
                            <option value={s} key={s}>
                                {s[0].toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div>
                        <StatusBadge status={b.status} />
                        <input type="hidden" defaultValue={b.status} />
                        <span className="hint" style={{ display: 'block' }}>
                            <Icon name="shield" /> You don't have permission to change batch status
                        </span>
                    </div>
                )}
            </div>
            <div className="field">
                <label>Lab / Classroom *</label>
                <select value={state.lab} onChange={(event) => onLabChange(event.target.value)}>
                    {labOptions.map((l) => (
                        <option value={l.id} key={l.id}>
                            {l.name} (max {l.capacity})
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Capacity *</label>
                <input
                    type="number"
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
        </div>
    );
}

export function openEditBatchModal(ctx, id) {
    const b = DB.batches.find((x) => x.id === id);

    if (!b) {
        return;
    }

    const labs = activeLabs();
    const currentLab = labById(b.lab_id);
    const labOptions = currentLab && !labs.some((l) => l.id === currentLab.id) ? [currentLab, ...labs] : labs;

    const form = {
        current: {
            name: b.name,
            status: b.status,
            lab: String(b.lab_id ?? ''),
            capacity: String(b.capacity),
            capMax: currentLab ? currentLab.capacity : null,
            hint: currentLab
                ? `Max ${currentLab.capacity} (limited by ${currentLab.name}) · currently ${batchEnrolledCount(b.id)} enrolled`
                : '',
            start: b.start,
            end: b.end,
            coordinator: String(b.coordinator_id ?? ''),
        },
    };

    const save = () => {
        const f = form.current;
        const name = f.name.trim();
        const labId = Number(f.lab);
        const capacity = Number(f.capacity);

        if (!name || !labId || !capacity) {
            ctx.toast('Batch name, lab & capacity are required', 'error');

            return;
        }

        const lab = labById(labId);
        const currentlyEnrolled = batchEnrolledCount(b.id);
        const cap = lab ? Math.min(capacity, lab.capacity) : capacity;

        if (cap < currentlyEnrolled) {
            ctx.toast(
                `Note: capacity (${cap}) is now below the ${currentlyEnrolled} students already enrolled — no new seats will open until enrollment drops.`,
                'error',
            );
        }

        b.name = name;
        b.lab_id = lab ? lab.id : b.lab_id;
        b.capacity = cap;

        if (ctx.can('Batches', 'ChangeStatus')) {
            b.status = f.status || b.status;
        }

        b.start = f.start || b.start;
        b.end = f.end || b.end;
        b.coordinator_id = Number(f.coordinator) || b.coordinator_id;

        ctx.closeModal();
        ctx.toast('Batch updated');
        ctx.refresh();
    };

    ctx.openModal({
        title: 'Edit Batch',
        sub: `${b.name} · ${courseName(b.course_id)}`,
        body: <EditBatchBody ctx={ctx} form={form} batch={b} labOptions={labOptions} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={save}>
                    <Icon name="check" /> Save Changes
                </button>
            </>
        ),
    });
}
