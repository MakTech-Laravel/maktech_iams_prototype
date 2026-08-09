/* "Edit Course" modal — ported from editCourseModal() in public/prototype/js/render-academic.js
   and the `save-course-edit` case in app.js. */

import { useEffect, useState } from 'react';
import { DB } from '../../../lib/db';
import { Icon } from '../../../lib/ui';

const STATUSES = ['draft', 'active', 'archived'];

function EditCourseBody({ form }) {
    const [state, setState] = useState(form.current);

    useEffect(() => {
        form.current = state;
    }, [form, state]);

    const set = (patch) => setState((s) => ({ ...s, ...patch }));

    return (
        <div className="form-grid">
            <div className="field span-2">
                <label>Course Name *</label>
                <input type="text" value={state.name} onChange={(event) => set({ name: event.target.value })} />
            </div>
            <div className="field">
                <label>Course Code *</label>
                <input type="text" value={state.code} onChange={(event) => set({ code: event.target.value })} />
            </div>
            <div className="field">
                <label>Department *</label>
                <select value={state.dept} onChange={(event) => set({ dept: event.target.value })}>
                    {DB.departments.map((d) => (
                        <option value={d.id} key={d.id}>
                            {d.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Duration (days) *</label>
                <input type="number" value={state.duration} onChange={(event) => set({ duration: event.target.value })} />
            </div>
            <div className="field">
                <label>Base Price (BDT) *</label>
                <input type="number" value={state.price} onChange={(event) => set({ price: event.target.value })} />
            </div>
            <div className="field">
                <label>Seat Capacity</label>
                <input type="number" value={state.seats} onChange={(event) => set({ seats: event.target.value })} />
            </div>
            <div className="field">
                <label>Status</label>
                <select value={state.status} onChange={(event) => set({ status: event.target.value })}>
                    {STATUSES.map((s) => (
                        <option value={s} key={s}>
                            {s[0].toUpperCase() + s.slice(1)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field span-2">
                <label>Description</label>
                <textarea value={state.desc} onChange={(event) => set({ desc: event.target.value })} />
            </div>
        </div>
    );
}

export function openEditCourseModal(ctx, id) {
    const c = DB.courses.find((x) => x.id === id);

    if (!c) {
        return;
    }

    const form = {
        current: {
            name: c.name,
            code: c.code,
            dept: String(c.dept_id),
            duration: c.duration_days,
            price: c.base_price,
            seats: c.seats,
            status: c.status,
            desc: c.desc || '',
        },
    };

    const save = () => {
        const f = form.current;
        const name = String(f.name).trim();

        if (!name) {
            ctx.toast('Course name is required', 'error');

            return;
        }

        c.name = name;
        c.code = String(f.code).trim() || c.code;
        c.dept_id = Number(f.dept) || c.dept_id;
        c.duration_days = Number(f.duration) || c.duration_days;
        c.base_price = Number(f.price) || c.base_price;
        c.seats = Number(f.seats) || c.seats;
        c.status = f.status || c.status;
        c.desc = String(f.desc).trim() || c.desc;

        ctx.closeModal();
        ctx.toast('Course details updated');
        ctx.actions.viewCourse(id);
    };

    ctx.openModal({
        size: 'lg',
        title: 'Edit Course',
        sub: `${c.code} · ${c.name}`,
        body: <EditCourseBody form={form} />,
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
