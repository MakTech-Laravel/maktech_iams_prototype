/* "Manage Curriculum" modal — ported from curriculumModal() in public/prototype/js/render-academic.js
   and the `save-curriculum` case in app.js. */

import { useEffect, useState } from 'react';
import { DB, nextModuleId } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import CurriculumBuilder, { moduleRowsFor, normalizeModuleRows } from './CurriculumBuilder';

function CurriculumBody({ form }) {
    const [rows, setRows] = useState(form.current.modules);

    useEffect(() => {
        form.current = { modules: rows };
    }, [form, rows]);

    return (
        <>
            <div className="badge badge-blue" style={{ whiteSpace: 'normal', marginBottom: 16 }}>
                <Icon name="notification" /> Adding or removing a module here instantly updates what every enrolled student sees under "Module
                Progress" on their portal.
            </div>
            <CurriculumBuilder containerId="curriculumRows" rows={rows} onChange={setRows} />
        </>
    );
}

export function openCurriculumModal(ctx, id) {
    const c = DB.courses.find((x) => x.id === id);

    if (!c) {
        return;
    }

    const form = { current: { modules: moduleRowsFor(c.modules) } };

    const save = () => {
        const course = DB.courses.find((x) => x.id === id);

        if (!course) {
            return;
        }

        const rows = normalizeModuleRows(form.current.modules).filter((r) => r.title);
        let nextId = nextModuleId();

        course.modules = rows.map((r, i) => ({ id: r.id || nextId++, title: r.title, hours: r.hours, seq: i + 1 }));

        ctx.closeModal();
        ctx.toast('Curriculum updated — students will see it on their portal immediately');
        ctx.actions.viewCourse(id);
    };

    ctx.openModal({
        size: 'lg',
        title: 'Manage Curriculum',
        sub: `${c.name} — modules students track progress against on their portal`,
        body: <CurriculumBody form={form} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={save}>
                    <Icon name="check" /> Save Curriculum
                </button>
            </>
        ),
    });
}
