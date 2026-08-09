/* "Add New Course" modal — ported from addCourseModal() in public/prototype/js/render-academic.js
   and the `save-course` case in app.js. */

import { useEffect, useState } from 'react';
import { DB, nextCourseId, nextModuleId } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import CurriculumBuilder, { normalizeModuleRows } from './CurriculumBuilder';

function AddCourseBody({ form }) {
    const [state, setState] = useState(form.current);

    useEffect(() => {
        form.current = state;
    }, [form, state]);

    const set = (patch) => setState((s) => ({ ...s, ...patch }));

    return (
        <>
            <div className="form-grid">
                <div className="field span-2">
                    <label>Course Name *</label>
                    <input
                        type="text"
                        placeholder="e.g. Industrial Attachment — IoT & Embedded Systems"
                        value={state.name}
                        onChange={(event) => set({ name: event.target.value })}
                    />
                </div>
                <div className="field">
                    <label>Course Code *</label>
                    <input type="text" placeholder="e.g. CIT-104" value={state.code} onChange={(event) => set({ code: event.target.value })} />
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
                    <input type="number" placeholder="90" value={state.duration} onChange={(event) => set({ duration: event.target.value })} />
                </div>
                <div className="field">
                    <label>Base Price (BDT) *</label>
                    <input type="number" placeholder="18000" value={state.price} onChange={(event) => set({ price: event.target.value })} />
                </div>
                <div className="field">
                    <label>Seat Capacity</label>
                    <input type="number" placeholder="40" value={state.seats} onChange={(event) => set({ seats: event.target.value })} />
                </div>
                <div className="field">
                    <label>Status</label>
                    <select value={state.status} onChange={(event) => set({ status: event.target.value })}>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                    </select>
                </div>
                <div className="field span-2">
                    <label>Description</label>
                    <textarea
                        placeholder="Course overview & objectives"
                        value={state.desc}
                        onChange={(event) => set({ desc: event.target.value })}
                    />
                </div>
                <div className="field span-2">
                    <label className="hint" style={{ textTransform: 'none', fontWeight: 800, color: 'var(--gray-700)', fontSize: '12.5px' }}>
                        Discount Rule (optional)
                    </label>
                </div>
                <div className="field">
                    <label>Discount Type</label>
                    <select value={state.discType} onChange={(event) => set({ discType: event.target.value })}>
                        <option value="none">None</option>
                        <option value="percentage">Percentage</option>
                        <option value="flat">Flat</option>
                    </select>
                </div>
                <div className="field">
                    <label>Discount Value</label>
                    <input type="number" placeholder="10" value={state.discValue} onChange={(event) => set({ discValue: event.target.value })} />
                </div>
                <div className="field span-2">
                    <label>Reason</label>
                    <input
                        type="text"
                        placeholder="e.g. Early bird offer"
                        value={state.discReason}
                        onChange={(event) => set({ discReason: event.target.value })}
                    />
                </div>
            </div>
            <div className="hr" />
            <label
                className="hint"
                style={{ textTransform: 'none', fontWeight: 800, color: 'var(--gray-700)', fontSize: '12.5px', display: 'block', marginBottom: 10 }}
            >
                Curriculum Modules (optional — you can also add these later from "Manage Curriculum")
            </label>
            <CurriculumBuilder containerId="newCourseModuleRows" rows={state.modules} onChange={(modules) => set({ modules })} />
        </>
    );
}

export function openAddCourseModal(ctx) {
    const form = {
        current: {
            name: '',
            code: '',
            dept: String(DB.departments[0]?.id ?? ''),
            duration: '',
            price: '',
            seats: '',
            status: 'draft',
            desc: '',
            discType: 'none',
            discValue: '',
            discReason: '',
            modules: [],
        },
    };

    const save = () => {
        const f = form.current;
        const name = f.name.trim();

        if (!name) {
            ctx.toast('Course name is required', 'error');

            return;
        }

        const rows = normalizeModuleRows(f.modules).filter((r) => r.title);
        let nextId = nextModuleId();
        const modules = rows.map((r, i) => ({ id: nextId++, title: r.title, hours: r.hours, seq: i + 1 }));
        const discounts =
            f.discType && f.discType !== 'none'
                ? [
                      {
                          type: f.discType,
                          value: Number(f.discValue) || 0,
                          reason: f.discReason.trim() || 'Admin-defined discount',
                          from: '2026-01-01',
                          to: '2026-12-31',
                      },
                  ]
                : [];

        DB.courses.push({
            id: nextCourseId(),
            dept_id: Number(f.dept) || DB.departments[0].id,
            name,
            code: f.code.trim() || `NEW-${Date.now()}`,
            duration_days: Number(f.duration) || 60,
            base_price: Number(f.price) || 0,
            status: f.status || 'draft',
            seats: Number(f.seats) || 30,
            enrolled: 0,
            desc: f.desc.trim() || '',
            modules,
            discounts,
        });

        ctx.closeModal();
        ctx.toast('Course created successfully');
        ctx.refresh();
    };

    ctx.openModal({
        size: 'lg',
        title: 'Add New Course',
        sub: 'Define course pricing, duration, department & starting curriculum',
        body: <AddCourseBody form={form} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={save}>
                    <Icon name="check" /> Save Course
                </button>
            </>
        ),
    });
}
