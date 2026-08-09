/* "Add Session" modal — ported from addSessionModal() in public/prototype/js/render-academic.js
   and the `save-session` case in app.js (demo-only: it toasts and refreshes, no DB write). */

import { useState } from 'react';
import { DB } from '../../../lib/db';
import { Icon } from '../../../lib/ui';

function AddSessionBody({ courseId }) {
    const initialCourse = DB.courses.find((c) => String(c.id) === String(courseId)) ? String(courseId) : String(DB.courses[0]?.id ?? '');
    const [state, setState] = useState({ course: initialCourse, name: '', status: 'Upcoming', start: '', end: '' });

    const set = (patch) => setState((s) => ({ ...s, ...patch }));

    return (
        <div className="form-grid">
            <div className="field span-2">
                <label>Course *</label>
                <select value={state.course} onChange={(event) => set({ course: event.target.value })}>
                    {DB.courses.map((c) => (
                        <option value={c.id} key={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Session Name *</label>
                <input type="text" placeholder="e.g. Session 2026-C" value={state.name} onChange={(event) => set({ name: event.target.value })} />
            </div>
            <div className="field">
                <label>Status</label>
                <select value={state.status} onChange={(event) => set({ status: event.target.value })}>
                    <option>Upcoming</option>
                    <option>Ongoing</option>
                </select>
            </div>
            <div className="field">
                <label>Start Date *</label>
                <input type="date" value={state.start} onChange={(event) => set({ start: event.target.value })} />
            </div>
            <div className="field">
                <label>End Date *</label>
                <input type="date" value={state.end} onChange={(event) => set({ end: event.target.value })} />
            </div>
        </div>
    );
}

export function openAddSessionModal(ctx, courseId) {
    ctx.openModal({
        title: 'Add Session',
        sub: 'Create a new intake session/term under a course',
        body: <AddSessionBody courseId={courseId} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                        ctx.closeModal();
                        ctx.toast('Session created — you can now add batches inside it');
                        ctx.refresh();
                    }}
                >
                    <Icon name="check" /> Create Session
                </button>
            </>
        ),
    });
}
