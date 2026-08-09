/* "Add Department" modal — ported from addDepartmentModal() in public/prototype/js/render-academic.js
   and the `save-department` case in app.js (demo-only: it toasts and refreshes, no DB write). */

import { useState } from 'react';
import { Icon } from '../../../lib/ui';

function AddDepartmentBody() {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    return (
        <div className="form-grid single">
            <div className="field">
                <label>Department Name *</label>
                <input type="text" placeholder="e.g. Renewable Energy" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="field">
                <label>Description</label>
                <textarea
                    placeholder="What courses does this department offer?"
                    value={desc}
                    onChange={(event) => setDesc(event.target.value)}
                />
            </div>
        </div>
    );
}

export function openAddDepartmentModal(ctx) {
    ctx.openModal({
        title: 'Add Department',
        sub: 'Create a new internal department',
        body: <AddDepartmentBody />,
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
                        ctx.toast('Department created');
                        ctx.refresh();
                    }}
                >
                    <Icon name="check" /> Save Department
                </button>
            </>
        ),
    });
}
