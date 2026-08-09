/* Lab / classroom modals — ported from addLabModal() and editLabModal() in
   public/prototype/js/render-academic.js plus the `save-lab` / `save-lab-edit` cases in app.js. */

import { useEffect, useState } from 'react';
import { batchesUsingLab, createLab, labById, updateLab } from '../../../lib/db';
import { Icon } from '../../../lib/ui';

function AddLabBody({ form }) {
    const [state, setState] = useState(form.current);

    useEffect(() => {
        form.current = state;
    }, [form, state]);

    const set = (patch) => setState((s) => ({ ...s, ...patch }));

    return (
        <div className="form-grid">
            <div className="field span-2">
                <label>Lab / Room Name *</label>
                <input type="text" placeholder="e.g. Lab-4" value={state.name} onChange={(event) => set({ name: event.target.value })} />
            </div>
            <div className="field">
                <label>Capacity (seats) *</label>
                <input type="number" placeholder="35" value={state.capacity} onChange={(event) => set({ capacity: event.target.value })} />
            </div>
            <div className="field">
                <label>Location</label>
                <input
                    type="text"
                    placeholder="e.g. Main Building, 2nd Floor"
                    value={state.location}
                    onChange={(event) => set({ location: event.target.value })}
                />
            </div>
            <div className="field span-2">
                <label>Notes</label>
                <input
                    type="text"
                    placeholder="Optional — equipment, purpose, etc."
                    value={state.notes}
                    onChange={(event) => set({ notes: event.target.value })}
                />
            </div>
        </div>
    );
}

export function openAddLabModal(ctx) {
    const form = { current: { name: '', capacity: '', location: '', notes: '' } };

    const save = () => {
        const f = form.current;
        const name = f.name.trim();
        const capacity = Number(f.capacity);

        if (!name || !capacity || capacity < 1) {
            ctx.toast('Lab name and a valid capacity are required', 'error');

            return;
        }

        createLab({ name, capacity, location: f.location.trim(), notes: f.notes.trim() });
        ctx.closeModal();
        ctx.toast('Lab created — it can now be assigned to batches');
        ctx.refresh();
    };

    ctx.openModal({
        title: 'Add Lab / Classroom',
        sub: 'Define a physical space with a fixed seat capacity',
        body: <AddLabBody form={form} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={save}>
                    <Icon name="check" /> Save Lab
                </button>
            </>
        ),
    });
}

function EditLabBody({ form, lab }) {
    const [state, setState] = useState(form.current);
    const usingBatches = batchesUsingLab(lab.id);

    useEffect(() => {
        form.current = state;
    }, [form, state]);

    const set = (patch) => setState((s) => ({ ...s, ...patch }));

    return (
        <>
            {usingBatches.length ? (
                <div className="badge badge-amber" style={{ whiteSpace: 'normal', textAlign: 'left', marginBottom: 14 }}>
                    <Icon name="alertCircle" /> Currently assigned to {usingBatches.length} active batch
                    {usingBatches.length !== 1 ? 'es' : ''} ({usingBatches.map((b) => b.name).join(', ')}). Reducing capacity below a batch's
                    current enrollment will immediately block further registrations into that batch.
                </div>
            ) : null}
            <div className="form-grid">
                <div className="field span-2">
                    <label>Lab / Room Name *</label>
                    <input type="text" value={state.name} onChange={(event) => set({ name: event.target.value })} />
                </div>
                <div className="field">
                    <label>Capacity (seats) *</label>
                    <input type="number" value={state.capacity} onChange={(event) => set({ capacity: event.target.value })} />
                </div>
                <div className="field">
                    <label>Status</label>
                    <select value={state.status} onChange={(event) => set({ status: event.target.value })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive (not selectable for new batches)</option>
                    </select>
                </div>
                <div className="field">
                    <label>Location</label>
                    <input type="text" value={state.location} onChange={(event) => set({ location: event.target.value })} />
                </div>
                <div className="field span-2">
                    <label>Notes</label>
                    <input type="text" value={state.notes} onChange={(event) => set({ notes: event.target.value })} />
                </div>
            </div>
        </>
    );
}

export function openEditLabModal(ctx, id) {
    const l = labById(id);

    if (!l) {
        return;
    }

    const form = { current: { name: l.name, capacity: l.capacity, location: l.location || '', notes: l.notes || '', status: l.status } };

    const save = () => {
        const f = form.current;
        const capacity = Number(f.capacity);

        if (!capacity || capacity < 1) {
            ctx.toast('Capacity must be at least 1', 'error');

            return;
        }

        updateLab(l.id, { name: f.name, capacity, location: f.location, notes: f.notes, status: f.status });
        ctx.closeModal();
        ctx.toast('Lab updated');
        ctx.refresh();
    };

    ctx.openModal({
        title: 'Edit Lab / Classroom',
        sub: l.name,
        body: <EditLabBody form={form} lab={l} />,
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
