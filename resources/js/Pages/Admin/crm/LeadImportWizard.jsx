/* Bulk Lead Import wizard — ported from public/prototype/js/render-leadimport.js.

   View layer only, exactly as in the prototype: every bit of parsing, matching, validation and committing
   still comes from lib/db.js. The prototype's `LeadImportState` global becomes this component's own state,
   and because the shell (title, size and footer) changes between steps, the whole wizard is one stateful
   component that re-pushes its modal config instead of a body handed to openModal() once. */

import { Fragment, useEffect, useRef, useState } from 'react';
import {
    LEAD_IMPORT_FIELDS,
    autoMapColumns,
    buildLeadImportPreview,
    importLeads,
    leadImportDisplayValue,
    leadImportField,
    leadImportTemplateCsv,
    parseDelimitedText,
    revalidateLeadImportPreview,
} from '../../../lib/db';
import { useIdentity } from '../../../lib/identity';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

/* ---- Optional Excel support ----
   SheetJS is fetched on demand the first time somebody actually picks an .xlsx, rather than being a
   script tag on every page load. Keeps the prototype working offline (CSV + paste still function) and
   keeps the CDN off the critical path. */
function ensureXlsxLib() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (window.__xlsxLoadPromise) return window.__xlsxLoadPromise;
    window.__xlsxLoadPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error('xlsx missing')));
        s.onerror = () => reject(new Error('xlsx unreachable'));
        document.head.appendChild(s);
    });

    return window.__xlsxLoadPromise;
}

/* Every row becomes a rendered preview row, so an accidental 20k-row paste would lock the tab. Real visit
   and webinar lists are well under this, and the cap is reported rather than applied silently. */
const LI_MAX_ROWS = 500;

const STEPS = [
    ['1', 'Upload'],
    ['2', 'Map Fields'],
    ['3', 'Preview & Import'],
];

function StepBar({ active }) {
    return (
        <div className="li-steps">
            {STEPS.map(([n, label], i) => {
                const idx = i + 1;
                const cls = idx === active ? 'active' : idx < active ? 'done' : '';

                return (
                    <Fragment key={n}>
                        {i ? <span className="li-step-sep" /> : null}
                        <div className={`li-step ${cls}`}>
                            <span className="li-step-num">{idx < active ? '✓' : n}</span>
                            {label}
                        </div>
                    </Fragment>
                );
            })}
        </div>
    );
}

/* Swaps a single preview cell for the right input type, so a mis-typed phone or an institution the matcher
   couldn't find can be fixed here instead of sending the operator back to Excel to re-export. */
function CellEditor({ field, value, onCommit, onCancel }) {
    const [draft, setDraft] = useState(value == null ? '' : String(value));
    const committed = useRef(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;

        if (el) {
            el.focus();
            if (el.select) el.select();
        }
    }, []);

    const commit = (next) => {
        if (committed.current) return;
        committed.current = true;
        onCommit(next === undefined ? draft : next);
    };

    /* Escape is stopped here so it only cancels the cell edit — letting it through would close the wizard. */
    const cancel = (event) => {
        event.stopPropagation();
        committed.current = true;
        onCancel();
    };

    if (field.options) {
        return (
            <select
                ref={ref}
                className="li-cell-edit"
                value={draft}
                onChange={(e) => {
                    setDraft(e.target.value);
                    commit(e.target.value);
                }}
                onBlur={() => commit()}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') cancel(e);
                }}
            >
                <option value="">— None —</option>
                {field.options().map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <input
            ref={ref}
            type={field.type === 'date' ? 'date' : 'text'}
            className="li-cell-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit()}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                } else if (e.key === 'Escape') {
                    cancel(e);
                }
            }}
        />
    );
}

export default function LeadImportWizard({ actions }) {
    const { toast } = useUi();
    const { userId } = useIdentity();

    const [step, setStep] = useState(1);
    const [fileName, setFileName] = useState('');
    const [headers, setHeaders] = useState([]);
    const [rawRows, setRawRows] = useState([]);
    const [mapping, setMapping] = useState({});
    const [fixed, setFixed] = useState({});
    const [fieldsOn, setFieldsOn] = useState(() => LEAD_IMPORT_FIELDS.map((f) => f.key));
    const [preview, setPreview] = useState(null);
    const [pasteText, setPasteText] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [editing, setEditing] = useState(null);
    /* The preview rows are mutated in place (exactly as the prototype did) so edits keep their identity;
       this counter is what tells React the grid has to repaint. */
    const [version, setVersion] = useState(0);
    const fileInputRef = useRef(null);

    const repaint = () => setVersion((v) => v + 1);

    const loadText = (text, name, delim) => {
        const parsed = parseDelimitedText(text, delim);

        if (!parsed.headers.length || !parsed.rows.length) {
            toast('No data rows found — the file needs a header row plus at least one lead', 'error');

            return;
        }

        const dropped = Math.max(0, parsed.rows.length - LI_MAX_ROWS);
        const rows = dropped ? parsed.rows.slice(0, LI_MAX_ROWS) : parsed.rows;
        const auto = autoMapColumns(parsed.headers);

        setFileName(name || 'Pasted data');
        setHeaders(parsed.headers);
        setRawRows(rows);
        setMapping(auto);
        setFixed({});
        setStep(2);

        if (dropped) {
            toast(`Only the first ${LI_MAX_ROWS} rows were loaded — ${dropped} more were left out. Split the file and import again.`, 'error');
        } else {
            toast(`${rows.length} row(s) read — ${Object.keys(auto).length} column(s) matched automatically`);
        }
    };

    const handleFile = (file) => {
        const name = file.name || 'Uploaded file';
        const ext = name.toLowerCase().split('.').pop();
        const reader = new FileReader();

        if (ext === 'xlsx' || ext === 'xls') {
            reader.onload = (e) => {
                ensureXlsxLib()
                    .then((XLSX) => {
                        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                        const sheet = wb.Sheets[wb.SheetNames[0]];

                        if (!sheet) {
                            toast('That workbook has no readable sheet', 'error');

                            return;
                        }

                        /* Routed through CSV so the workbook and the plain-text paths share one parser. */
                        loadText(XLSX.utils.sheet_to_csv(sheet), `${name} · ${wb.SheetNames[0]}`, ',');
                    })
                    .catch(() => {
                        toast('Excel reader needs an internet connection. Save the sheet as CSV, or paste the rows instead.', 'error');
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (e) => loadText(e.target.result, name);
            reader.readAsText(file);
        }
    };

    const usePaste = () => {
        if (!pasteText.trim()) {
            toast('Paste some rows first', 'error');

            return;
        }

        loadText(pasteText, 'Pasted data');
    };

    const downloadTemplate = () => {
        const blob = new Blob([leadImportTemplateCsv()], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'lead-import-template.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast('Template downloaded — fill it in and upload it back');
    };

    const changeMapping = (key, val) => {
        const nextMapping = { ...mapping };
        const nextFixed = { ...fixed };
        delete nextMapping[key];
        delete nextFixed[key];

        if (val === '__fixed__') {
            const f = leadImportField(key);
            nextFixed[key] = f && f.default !== undefined ? f.default : '';
        } else if (val.startsWith('col:')) {
            const col = val.slice(4);
            /* One source column can only feed one field, otherwise the preview silently duplicates data. */
            Object.keys(nextMapping).forEach((k) => {
                if (nextMapping[k] === col && k !== key) delete nextMapping[k];
            });
            nextMapping[key] = col;
        }

        setMapping(nextMapping);
        setFixed(nextFixed);
    };

    const gotoPreview = () => {
        const missing = LEAD_IMPORT_FIELDS.filter((f) => f.required && !mapping[f.key] && !fixed[f.key]);

        if (missing.length) {
            toast(`Map a column for: ${missing.map((f) => f.label).join(', ')}`, 'error');

            return;
        }

        setPreview(buildLeadImportPreview(rawRows, mapping, fixed, { assignedTo: userId }));
        /* Only fields carrying real per-row data get a column by default. An unmapped field would otherwise
           repeat its default down every row, eating the horizontal space the actual data needs — the operator
           can still tick it on from the chip bar to see or override it. */
        setFieldsOn(
            LEAD_IMPORT_FIELDS.filter((f) => f.required || mapping[f.key] || (fixed[f.key] !== undefined && fixed[f.key] !== '')).map((f) => f.key),
        );
        setStep(3);
    };

    const setSelection = (mode) => {
        if (!preview) return;
        preview.rows.forEach((r) => {
            r.include = mode === 'none' ? false : r.status !== 'error';
        });
        repaint();
    };

    const commitCell = (idx, key, raw) => {
        const field = leadImportField(key);
        const row = preview.rows[idx];

        if (!field || !row) return;

        /* Anything the user sets by hand supersedes whatever the parser said about this field. */
        row.issues = row.issues.filter((i) => i.field !== key);

        if (raw === '' || raw == null) {
            row.values[key] = null;
        } else if (field.options) {
            row.values[key] = field.type === 'lookup' ? Number(raw) : raw;
        } else {
            const out = field.resolve ? field.resolve(String(raw).trim()) : { value: String(raw).trim() };
            row.values[key] = out.value;
            if (out.warning) row.issues.push({ level: 'warn', field: key, text: out.warning });
        }

        revalidateLeadImportPreview(preview);
        setEditing(null);
        repaint();
    };

    const commitImport = () => {
        if (!preview) return;
        const chosen = preview.rows.filter((r) => r.include && r.status !== 'error');

        if (!chosen.length) {
            toast('Tick at least one row to import', 'error');

            return;
        }

        const created = importLeads(preview.rows, fieldsOn, userId, {
            fileName,
            skipped: preview.rows.length - chosen.length,
        });

        actions.dismiss();
        toast(`${created.length} lead(s) imported successfully`);
        actions.bump();
    };

    /* Third column of the mapping table: either sample values pulled from the file, or the picker used to set
       one value for the entire batch. */
    const mappingDetailCell = (f) => {
        const col = mapping[f.key];

        if (col) {
            const samples = rawRows
                .slice(0, 3)
                .map((r) => r[col])
                .filter((v) => v !== undefined && String(v).trim() !== '');

            return samples.length ? (
                <span className="cell-sub">
                    e.g.{' '}
                    {samples.map((s, i) => (
                        <Fragment key={i}>
                            {i ? ' ' : ''}
                            <code className="li-sample">{s}</code>
                        </Fragment>
                    ))}
                </span>
            ) : (
                <span className="cell-sub muted">Column is empty in the first few rows</span>
            );
        }

        if (fixed[f.key] !== undefined) {
            const val = fixed[f.key];

            if (f.options) {
                return (
                    <select className="li-fixed-input" data-key={f.key} value={String(val)} onChange={(e) => setFixed({ ...fixed, [f.key]: e.target.value })}>
                        <option value="">— Choose {f.label.toLowerCase()} —</option>
                        {f.options().map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                );
            }

            return (
                <input
                    type={f.type === 'date' ? 'date' : 'text'}
                    className="li-fixed-input"
                    data-key={f.key}
                    value={val}
                    placeholder={`Applied to all ${rawRows.length} rows`}
                    onChange={(e) => setFixed({ ...fixed, [f.key]: e.target.value })}
                />
            );
        }

        if (f.required) {
            return (
                <span className="cell-sub" style={{ color: 'var(--danger-700)' }}>
                    Must be mapped before importing
                </span>
            );
        }

        return <span className="cell-sub muted">—</span>;
    };

    const previewCell = (row, field, idx) => {
        if (editing && editing.idx === idx && editing.key === field.key) {
            return (
                <CellEditor
                    field={field}
                    value={row.values[field.key]}
                    onCommit={(v) => commitCell(idx, field.key, v)}
                    onCancel={() => setEditing(null)}
                />
            );
        }

        const val = row.values[field.key];
        const missingRequired = field.required && (val === null || val === '');
        /* Flag lookups the matcher couldn't resolve so the operator can spot them at a glance. */
        const unresolved = row.issues.some((x) => x.field === field.key && x.level === 'warn');
        const cls = ['li-cell', missingRequired ? 'li-missing' : '', unresolved ? 'li-warned' : ''].filter(Boolean).join(' ');
        /* Values get clipped to keep the warnings column on screen, so the full text lives in the tooltip. */
        const display = missingRequired ? 'Missing' : leadImportDisplayValue(field.key, val);

        return (
            <span
                className={cls}
                data-idx={idx}
                data-key={field.key}
                title={`${display} — click to edit`}
                onClick={() => setEditing({ idx, key: field.key })}
            >
                {display}
            </span>
        );
    };

    let config = null;

    if (step === 1) {
        config = {
            title: 'Import Leads',
            sub: 'Bring in a whole list from an institute visit or online session in one go',
            size: 'lg',
            body: (
                <>
                    <StepBar active={1} />
                    <div
                        className={`li-drop${dragOver ? ' over' : ''}`}
                        id="liDrop"
                        onDragEnter={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                            if (f) handleFile(f);
                        }}
                    >
                        <div className="li-drop-ic">
                            <Icon name="upload" />
                        </div>
                        <b>Drop a CSV or Excel file here</b>
                        <div className="cell-sub" style={{ margin: '4px 0 12px' }}>
                            .csv, .tsv, .xlsx or .xls — the first row must be your column headers
                        </div>
                        <button type="button" className="btn btn-primary btn-sm" id="liChooseBtn" onClick={() => fileInputRef.current?.click()}>
                            <Icon name="file" /> Choose file
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            id="liFileInput"
                            accept=".csv,.tsv,.txt,.xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
                            }}
                        />
                    </div>

                    <div className="li-or">
                        <span>or paste straight from Excel / Google Sheets</span>
                    </div>

                    <textarea
                        id="liPasteBox"
                        className="li-paste"
                        rows={5}
                        placeholder={
                            'Full Name\tPhone\tInstitution\nMd. Karim Hossain\t01712345678\tDhaka Polytechnic Institute\nAyesha Siddiqua\t01812345679\tRajshahi Polytechnic Institute'
                        }
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                    />
                    <div className="flex-between" style={{ marginTop: 8 }}>
                        <span className="cell-sub">Copy the rows in your sheet including the header row, then paste above.</span>
                        <button type="button" className="btn btn-outline btn-sm" onClick={usePaste}>
                            <Icon name="check" /> Use pasted rows
                        </button>
                    </div>

                    <div className="hr" />
                    <div className="badge badge-gray li-note">
                        <Icon name="shield" />
                        <span>
                            Nothing is saved until you review the preview on the final step — you can re-map columns, correct any cell and untick
                            rows before anything is written.
                        </span>
                    </div>
                </>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-ghost" onClick={downloadTemplate}>
                        <Icon name="download" /> Download CSV template
                    </button>
                    <div style={{ flex: 1 }} />
                    <button type="button" className="btn btn-secondary" onClick={actions.dismiss}>
                        Cancel
                    </button>
                </>
            ),
        };
    } else if (step === 2) {
        const mappedCols = new Set(Object.values(mapping).filter(Boolean));
        const ignored = headers.filter((h) => !mappedCols.has(h));

        config = {
            title: 'Import Leads — Map Your Columns',
            sub: `${rawRows.length} row(s) from ${fileName}`,
            size: 'xl',
            body: (
                <>
                    <StepBar active={2} />
                    <div className="badge badge-blue li-note">
                        <Icon name="swap" />
                        <span>
                            Columns were matched to fields automatically by their headers — change anything that landed in the wrong place. Use{' '}
                            <b>“Same value for every row”</b> for details that apply to the whole batch, like the institution you just visited.
                        </span>
                    </div>
                    <div className="table-wrap">
                        <table className="data-table li-map-table">
                            <thead>
                                <tr>
                                    <th>System Field</th>
                                    <th>Comes From</th>
                                    <th>Value / Sample</th>
                                </tr>
                            </thead>
                            <tbody>
                                {LEAD_IMPORT_FIELDS.map((f) => {
                                    const sel = mapping[f.key] ? `col:${mapping[f.key]}` : fixed[f.key] !== undefined ? '__fixed__' : '';

                                    return (
                                        <tr key={f.key}>
                                            <td style={{ width: 190 }}>
                                                <span className="cell-strong">{f.label}</span>
                                                {f.required ? (
                                                    <span className="badge badge-red" style={{ marginLeft: 6 }}>
                                                        Required
                                                    </span>
                                                ) : null}
                                                <div className="cell-sub">{f.type}</div>
                                            </td>
                                            <td style={{ width: 230 }}>
                                                <select
                                                    className="li-map-select"
                                                    data-key={f.key}
                                                    value={sel}
                                                    onChange={(e) => changeMapping(f.key, e.target.value)}
                                                >
                                                    <option value="">— Don't import —</option>
                                                    <optgroup label="From a column in your file">
                                                        {headers.map((h) => (
                                                            <option key={h} value={`col:${h}`}>
                                                                {h}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                    <option value="__fixed__">Same value for every row…</option>
                                                </select>
                                            </td>
                                            <td>{mappingDetailCell(f)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {ignored.length ? (
                        <div className="badge badge-gray li-note" style={{ marginTop: 14 }}>
                            <Icon name="alertCircle" />
                            <span>
                                {ignored.length} column(s) in your file aren't mapped and will be ignored:{' '}
                                {ignored.map((h, i) => (
                                    <Fragment key={h}>
                                        {i ? ', ' : ''}
                                        <b>{h}</b>
                                    </Fragment>
                                ))}
                            </span>
                        </div>
                    ) : null}
                </>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                        Back
                    </button>
                    <div style={{ flex: 1 }} />
                    <button type="button" className="btn btn-secondary" onClick={actions.dismiss}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={gotoPreview}>
                        Continue to preview <Icon name="check" />
                    </button>
                </>
            ),
        };
    } else if (preview) {
        const s = preview.summary;
        const cols = LEAD_IMPORT_FIELDS.filter((f) => fieldsOn.includes(f.key));
        const selected = preview.rows.filter((r) => r.include).length;

        config = {
            title: 'Import Leads — Review Before Importing',
            sub: `${rawRows.length} row(s) from ${fileName}`,
            /* Widest step by far — every selected field becomes a column and the warnings column has to stay
               visible without horizontal scrolling, otherwise the problems go unnoticed. */
            size: 'xl li-wide',
            body: (
                <>
                    <StepBar active={3} />
                    <div className="li-summary" id="liSummary">
                        <div className="li-sum-chip">
                            <b>{s.total}</b> rows read
                        </div>
                        <div className="li-sum-chip green">
                            <b>{s.ready}</b> ready
                        </div>
                        <div className="li-sum-chip amber">
                            <b>{s.warn}</b> with warnings
                        </div>
                        <div className="li-sum-chip purple">
                            <b>{s.duplicate}</b> duplicates
                        </div>
                        <div className="li-sum-chip red">
                            <b>{s.error}</b> can't import
                        </div>
                    </div>

                    <div className="li-fieldbar">
                        <span className="li-fieldbar-label">Fields to import:</span>
                        {LEAD_IMPORT_FIELDS.map((f) => (
                            <label
                                key={f.key}
                                className={`li-chip ${fieldsOn.includes(f.key) ? 'on' : ''} ${f.required ? 'locked' : ''}`}
                                title={f.required ? 'Required — always imported' : 'Untick to leave this field out'}
                            >
                                <input
                                    type="checkbox"
                                    className="li-field-toggle"
                                    data-key={f.key}
                                    checked={fieldsOn.includes(f.key)}
                                    disabled={!!f.required}
                                    onChange={(e) =>
                                        setFieldsOn(
                                            e.target.checked ? Array.from(new Set([...fieldsOn, f.key])) : fieldsOn.filter((k) => k !== f.key),
                                        )
                                    }
                                />{' '}
                                {f.label}
                            </label>
                        ))}
                    </div>

                    <div className="flex-between" style={{ margin: '12px 0 8px' }}>
                        <span className="cell-sub" id="liSelCount">
                            {selected} row(s) selected for import
                        </span>
                        <div className="flex-gap">
                            <span className="cell-sub muted">
                                <Icon name="edit" /> Click any cell to correct it
                            </span>
                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelection('valid')}>
                                Select all importable
                            </button>
                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelection('none')}>
                                Deselect all
                            </button>
                        </div>
                    </div>

                    <div className="li-preview-wrap" id="liPreviewWrap">
                        <table className="data-table li-preview-table">
                            <thead>
                                <tr>
                                    <th />
                                    <th>#</th>
                                    {cols.map((f) => (
                                        <th key={f.key}>{f.label}</th>
                                    ))}
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.rows.map((r, i) => (
                                    <tr className={`li-row li-${r.status}`} key={r.rowNo}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="li-row-toggle"
                                                data-idx={i}
                                                checked={!!r.include}
                                                disabled={r.status === 'error'}
                                                onChange={(e) => {
                                                    preview.rows[i].include = e.target.checked;
                                                    repaint();
                                                }}
                                            />
                                        </td>
                                        <td className="cell-sub">{r.rowNo}</td>
                                        {cols.map((f) => (
                                            <td key={f.key}>{previewCell(r, f, i)}</td>
                                        ))}
                                        <td className="li-notes-cell">
                                            {r.issues.length ? (
                                                r.issues.map((x, j) => (
                                                    <div className={`li-issue ${x.level}`} key={j}>
                                                        {x.text}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="cell-sub muted">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                        <Icon name="swap" /> Re-map columns
                    </button>
                    <div style={{ flex: 1 }} />
                    <button type="button" className="btn btn-secondary" onClick={actions.dismiss}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" id="liCommitBtn" disabled={selected === 0} onClick={commitImport}>
                        <Icon name="check" /> Import {selected} lead(s)
                    </button>
                </>
            ),
        };
    }

    useHostedModal(config, [step, fileName, headers, rawRows, mapping, fixed, fieldsOn, preview, version, pasteText, dragOver, editing]);

    return null;
}
