/* Curriculum module-row builder — ported from curriculumRowHtml / moduleRowsFromDom / renderModuleRows
   in public/prototype/js/render-academic.js plus the add-module-row / remove-module-row / move-module-row
   cases in app.js. The prototype read the rows straight back out of the DOM on save; here the rows are
   React state owned by whichever modal is using the builder ("Add New Course" and "Manage Curriculum"). */

import { Icon } from '../../../lib/ui';

let rowKeySeq = 0;

/* Wraps DB module records (or nothing, for a fresh course) into editable rows. */
export function moduleRowsFor(modules) {
    return (modules || []).map((m) => ({ key: ++rowKeySeq, id: m.id ?? null, title: m.title || '', hours: m.hours ?? '' }));
}

export function emptyModuleRow() {
    return { key: ++rowKeySeq, id: null, title: '', hours: '' };
}

/* Same shape moduleRowsFromDom() returned: trimmed title, numeric hours, id kept for existing modules. */
export function normalizeModuleRows(rows) {
    return rows.map((r) => ({ id: r.id ?? null, title: String(r.title || '').trim(), hours: Number(r.hours) || 0 }));
}

export default function CurriculumBuilder({ containerId, rows, onChange }) {
    const update = (idx, patch) => onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

    const remove = (idx) => onChange(rows.filter((_, i) => i !== idx));

    const move = (idx, dir) => {
        const next = [...rows];
        const j = dir === 'up' ? idx - 1 : idx + 1;

        if (j >= 0 && j < next.length) {
            [next[idx], next[j]] = [next[j], next[idx]];
            onChange(next);
        }
    };

    return (
        <>
            <div id={containerId}>
                {rows.length ? (
                    rows.map((m, idx) => (
                        <div className="curriculum-row" data-modid={m.id ?? ''} key={m.key}>
                            <div className="cur-seq">{idx + 1}</div>
                            <div className="cur-move">
                                <button
                                    type="button"
                                    className="icon-btn sm"
                                    title="Move up"
                                    disabled={idx === 0}
                                    onClick={() => move(idx, 'up')}
                                >
                                    <Icon name="arrowUp" />
                                </button>
                                <button
                                    type="button"
                                    className="icon-btn sm"
                                    title="Move down"
                                    disabled={idx === rows.length - 1}
                                    onClick={() => move(idx, 'down')}
                                >
                                    <Icon name="arrowDown" />
                                </button>
                            </div>
                            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                                <input
                                    type="text"
                                    className="cur-title"
                                    placeholder="Module title *"
                                    value={m.title}
                                    onChange={(event) => update(idx, { title: event.target.value })}
                                />
                            </div>
                            <div className="field" style={{ width: 120, marginBottom: 0 }}>
                                <input
                                    type="number"
                                    className="cur-hours"
                                    placeholder="Hours"
                                    value={m.hours}
                                    onChange={(event) => update(idx, { hours: event.target.value })}
                                />
                            </div>
                            <button type="button" className="icon-btn sm danger" title="Remove module" onClick={() => remove(idx)}>
                                <Icon name="close" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="muted" style={{ fontSize: '12.5px', margin: '4px 0 0' }}>
                        No modules added yet.
                    </p>
                )}
            </div>
            <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginTop: 6 }}
                onClick={() => onChange([...rows, emptyModuleRow()])}
            >
                <Icon name="plus" /> Add Module
            </button>
        </>
    );
}
