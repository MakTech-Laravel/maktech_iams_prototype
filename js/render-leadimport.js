/* ============================================================
   Bulk Lead Import wizard — Upload → Map fields → Preview → Import
   ============================================================
   UI layer only. All parsing, matching and validation lives in data.js (parseDelimitedText,
   autoMapColumns, buildLeadImportPreview, importLeads) so this file stays about presentation.

   The three steps map onto the three things that actually go wrong with spreadsheet imports:
     1. getting the data in at all (files vary, so file upload AND paste are both first-class)
     2. the columns never being named what the system expects (step 2 is fully re-mappable)
     3. discovering the data was dirty only after it was written (step 3 validates before committing) */

let LeadImportState = null;

function newLeadImportState(){
  return {
    step: 1,
    fileName: '',
    headers: [],
    rawRows: [],
    mapping: {},        // fieldKey -> source column name
    fixed: {},          // fieldKey -> one system value applied to every row
    fieldsOn: LEAD_IMPORT_FIELDS.map(f => f.key),
    preview: null
  };
}

/* ---- Optional Excel support ----
   SheetJS is fetched on demand the first time somebody actually picks an .xlsx, rather than being a
   script tag on every page load. Keeps the prototype working offline (CSV + paste still function) and
   keeps the CDN off the critical path. */
function ensureXlsxLib(){
  if(window.XLSX) return Promise.resolve(window.XLSX);
  if(window.__xlsxLoadPromise) return window.__xlsxLoadPromise;
  window.__xlsxLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('xlsx missing'));
    s.onerror = () => reject(new Error('xlsx unreachable'));
    document.head.appendChild(s);
  });
  return window.__xlsxLoadPromise;
}

/* ---------------- Entry point ---------------- */
function openLeadImport(){
  LeadImportState = newLeadImportState();
  renderLeadImportModal();
}

function renderLeadImportModal(){
  const st = LeadImportState;
  if(!st) return;
  if(st.step === 1) return liRenderUploadStep();
  if(st.step === 2) return liRenderMappingStep();
  return liRenderPreviewStep();
}

function liStepBarHtml(active){
  const steps = [['1','Upload'], ['2','Map Fields'], ['3','Preview & Import']];
  return `<div class="li-steps">${steps.map(([n, label], i) => {
    const idx = i + 1;
    const cls = idx === active ? 'active' : (idx < active ? 'done' : '');
    return `<div class="li-step ${cls}"><span class="li-step-num">${idx < active ? '✓' : n}</span>${label}</div>`;
  }).join('<span class="li-step-sep"></span>')}</div>`;
}

/* ---------------- Step 1 — Upload / paste ---------------- */
function liRenderUploadStep(){
  openModal({
    title: 'Import Leads',
    sub: 'Bring in a whole list from an institute visit or online session in one go',
    size: 'lg',
    body: `
      ${liStepBarHtml(1)}
      <div class="li-drop" id="liDrop">
        <div class="li-drop-ic">${icon('upload')}</div>
        <b>Drop a CSV or Excel file here</b>
        <div class="cell-sub" style="margin:4px 0 12px;">.csv, .tsv, .xlsx or .xls — the first row must be your column headers</div>
        <button class="btn btn-primary btn-sm" id="liChooseBtn">${icon('file')} Choose file</button>
        <input type="file" id="liFileInput" accept=".csv,.tsv,.txt,.xlsx,.xls" style="display:none;">
      </div>

      <div class="li-or"><span>or paste straight from Excel / Google Sheets</span></div>

      <textarea id="liPasteBox" class="li-paste" rows="5" placeholder="Full Name&#9;Phone&#9;Institution&#10;Md. Karim Hossain&#9;01712345678&#9;Dhaka Polytechnic Institute&#10;Ayesha Siddiqua&#9;01812345679&#9;Rajshahi Polytechnic Institute"></textarea>
      <div class="flex-between" style="margin-top:8px;">
        <span class="cell-sub">Copy the rows in your sheet including the header row, then paste above.</span>
        <button class="btn btn-outline btn-sm" data-action="li-use-paste">${icon('check')} Use pasted rows</button>
      </div>

      <div class="hr"></div>
      <div class="badge badge-gray li-note">${icon('shield')}<span>Nothing is saved until you review the preview on the final step — you can re-map columns, correct any cell and untick rows before anything is written.</span></div>`,
    foot: `
      <button class="btn btn-ghost" data-action="li-download-template">${icon('download')} Download CSV template</button>
      <div style="flex:1;"></div>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>`
  });

  const input = document.getElementById('liFileInput');
  document.getElementById('liChooseBtn')?.addEventListener('click', () => input.click());
  input?.addEventListener('change', e => { if(e.target.files && e.target.files[0]) liHandleFile(e.target.files[0]); });

  const drop = document.getElementById('liDrop');
  ['dragenter', 'dragover'].forEach(ev => drop?.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop?.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop?.addEventListener('drop', e => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if(f) liHandleFile(f);
  });
}

function liHandleFile(file){
  const name = file.name || 'Uploaded file';
  const ext = name.toLowerCase().split('.').pop();
  const reader = new FileReader();

  if(ext === 'xlsx' || ext === 'xls'){
    reader.onload = e => {
      ensureXlsxLib().then(XLSX => {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        if(!sheet){ toast('That workbook has no readable sheet', 'error'); return; }
        /* Routed through CSV so the workbook and the plain-text paths share one parser. */
        liLoadText(XLSX.utils.sheet_to_csv(sheet), `${name} · ${wb.SheetNames[0]}`, ',');
      }).catch(() => {
        toast('Excel reader needs an internet connection. Save the sheet as CSV, or paste the rows instead.', 'error');
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    reader.onload = e => liLoadText(e.target.result, name);
    reader.readAsText(file);
  }
}

/* Every row becomes a rendered preview row, so an accidental 20k-row paste would lock the tab. Real visit
   and webinar lists are well under this, and the cap is reported rather than applied silently. */
const LI_MAX_ROWS = 500;

function liLoadText(text, fileName, delim){
  const parsed = parseDelimitedText(text, delim);
  if(!parsed.headers.length || !parsed.rows.length){
    toast('No data rows found — the file needs a header row plus at least one lead', 'error');
    return;
  }

  const dropped = Math.max(0, parsed.rows.length - LI_MAX_ROWS);
  const st = LeadImportState;
  st.fileName = fileName || 'Pasted data';
  st.headers = parsed.headers;
  st.rawRows = dropped ? parsed.rows.slice(0, LI_MAX_ROWS) : parsed.rows;
  st.mapping = autoMapColumns(parsed.headers);
  st.fixed = {};
  st.step = 2;
  renderLeadImportModal();

  if(dropped){
    toast(`Only the first ${LI_MAX_ROWS} rows were loaded — ${dropped} more were left out. Split the file and import again.`, 'error');
  } else {
    toast(`${st.rawRows.length} row(s) read — ${Object.keys(st.mapping).length} column(s) matched automatically`);
  }
}

/* ---------------- Step 2 — Field mapping ---------------- */
function liRenderMappingStep(){
  const st = LeadImportState;
  const mappedCols = new Set(Object.values(st.mapping).filter(Boolean));
  const ignored = st.headers.filter(h => !mappedCols.has(h));

  const rows = LEAD_IMPORT_FIELDS.map(f => {
    const sel = st.mapping[f.key] ? st.mapping[f.key] : (st.fixed[f.key] !== undefined ? '__fixed__' : '');
    return `
      <tr>
        <td style="width:190px;">
          <span class="cell-strong">${f.label}</span>
          ${f.required ? '<span class="badge badge-red" style="margin-left:6px;">Required</span>' : ''}
          <div class="cell-sub">${f.type}</div>
        </td>
        <td style="width:230px;">
          <select class="li-map-select" data-key="${f.key}">
            <option value="" ${sel === '' ? 'selected' : ''}>— Don't import —</option>
            <optgroup label="From a column in your file">
              ${st.headers.map(h => `<option value="col:${escHtml(h)}" ${sel === h ? 'selected' : ''}>${escHtml(h)}</option>`).join('')}
            </optgroup>
            <option value="__fixed__" ${sel === '__fixed__' ? 'selected' : ''}>Same value for every row…</option>
          </select>
        </td>
        <td>${liMappingDetailCell(f)}</td>
      </tr>`;
  }).join('');

  openModal({
    title: 'Import Leads — Map Your Columns',
    sub: `${st.rawRows.length} row(s) from ${st.fileName}`,
    size: 'xl',
    body: `
      ${liStepBarHtml(2)}
      <div class="badge badge-blue li-note">${icon('swap')}<span>Columns were matched to fields automatically by their headers — change anything that landed in the wrong place. Use <b>“Same value for every row”</b> for details that apply to the whole batch, like the institution you just visited.</span></div>
      <div class="table-wrap"><table class="data-table li-map-table">
        <thead><tr><th>System Field</th><th>Comes From</th><th>Value / Sample</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${ignored.length ? `<div class="badge badge-gray li-note" style="margin-top:14px;">${icon('alertCircle')}<span>${ignored.length} column(s) in your file aren't mapped and will be ignored: ${ignored.map(h => `<b>${escHtml(h)}</b>`).join(', ')}</span></div>` : ''}`,
    foot: `
      <button class="btn btn-ghost" data-action="li-back-to-upload">Back</button>
      <div style="flex:1;"></div>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" data-action="li-goto-preview">Continue to preview ${icon('check')}</button>`
  });

  liWireMappingInputs();
}

/* Third column of the mapping table: either sample values pulled from the file, or the picker used to set
   one value for the entire batch. */
function liMappingDetailCell(f){
  const st = LeadImportState;
  const col = st.mapping[f.key];

  if(col){
    const samples = st.rawRows.slice(0, 3).map(r => r[col]).filter(v => v !== undefined && String(v).trim() !== '');
    return samples.length
      ? `<span class="cell-sub">e.g. ${samples.map(s => `<code class="li-sample">${escHtml(s)}</code>`).join(' ')}</span>`
      : `<span class="cell-sub muted">Column is empty in the first few rows</span>`;
  }

  if(st.fixed[f.key] !== undefined){
    const val = st.fixed[f.key];
    if(f.options){
      const opts = f.options();
      return `<select class="li-fixed-input" data-key="${f.key}">
        <option value="">— Choose ${escHtml(f.label.toLowerCase())} —</option>
        ${opts.map(o => `<option value="${escHtml(o.value)}" ${String(val) === String(o.value) ? 'selected' : ''}>${escHtml(o.label)}</option>`).join('')}
      </select>`;
    }
    return `<input type="${f.type === 'date' ? 'date' : 'text'}" class="li-fixed-input" data-key="${f.key}" value="${escHtml(val)}" placeholder="Applied to all ${st.rawRows.length} rows">`;
  }

  if(f.required) return `<span class="cell-sub" style="color:var(--danger-700);">Must be mapped before importing</span>`;
  return `<span class="cell-sub muted">—</span>`;
}

function liWireMappingInputs(){
  const st = LeadImportState;

  document.querySelectorAll('.li-map-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const key = e.target.dataset.key;
      const val = e.target.value;
      delete st.mapping[key];
      delete st.fixed[key];
      if(val === '__fixed__'){
        const f = leadImportField(key);
        st.fixed[key] = f && f.default !== undefined ? f.default : '';
      } else if(val.startsWith('col:')){
        const col = val.slice(4);
        /* One source column can only feed one field, otherwise the preview silently duplicates data. */
        Object.keys(st.mapping).forEach(k => { if(st.mapping[k] === col && k !== key) delete st.mapping[k]; });
        st.mapping[key] = col;
      }
      liRenderMappingStep();
    });
  });

  document.querySelectorAll('.li-fixed-input').forEach(inp => {
    inp.addEventListener('change', e => { st.fixed[e.target.dataset.key] = e.target.value; });
  });
}

function liGotoPreview(){
  const st = LeadImportState;
  const missing = LEAD_IMPORT_FIELDS.filter(f => f.required && !st.mapping[f.key] && !st.fixed[f.key]);
  if(missing.length){
    toast(`Map a column for: ${missing.map(f => f.label).join(', ')}`, 'error');
    return;
  }
  st.preview = buildLeadImportPreview(st.rawRows, st.mapping, st.fixed, { assignedTo: currentUserId });
  /* Only fields carrying real per-row data get a column by default. An unmapped field would otherwise
     repeat its default down every row, eating the horizontal space the actual data needs — the operator
     can still tick it on from the chip bar to see or override it. */
  st.fieldsOn = LEAD_IMPORT_FIELDS
    .filter(f => f.required || st.mapping[f.key] || (st.fixed[f.key] !== undefined && st.fixed[f.key] !== ''))
    .map(f => f.key);
  st.step = 3;
  renderLeadImportModal();
}

/* ---------------- Step 3 — Preview & import ---------------- */
function liRenderPreviewStep(){
  const st = LeadImportState;
  const s = st.preview.summary;

  openModal({
    title: 'Import Leads — Review Before Importing',
    sub: `${st.rawRows.length} row(s) from ${st.fileName}`,
    /* Widest step by far — every selected field becomes a column and the warnings column has to stay
       visible without horizontal scrolling, otherwise the problems go unnoticed. */
    size: 'xl li-wide',
    body: `
      ${liStepBarHtml(3)}
      <div class="li-summary" id="liSummary">
        <div class="li-sum-chip"><b>${s.total}</b> rows read</div>
        <div class="li-sum-chip green"><b>${s.ready}</b> ready</div>
        <div class="li-sum-chip amber"><b>${s.warn}</b> with warnings</div>
        <div class="li-sum-chip purple"><b>${s.duplicate}</b> duplicates</div>
        <div class="li-sum-chip red"><b>${s.error}</b> can't import</div>
      </div>

      <div class="li-fieldbar">
        <span class="li-fieldbar-label">Fields to import:</span>
        ${LEAD_IMPORT_FIELDS.map(f => `
          <label class="li-chip ${st.fieldsOn.includes(f.key) ? 'on' : ''} ${f.required ? 'locked' : ''}" title="${f.required ? 'Required — always imported' : 'Untick to leave this field out'}">
            <input type="checkbox" class="li-field-toggle" data-key="${f.key}" ${st.fieldsOn.includes(f.key) ? 'checked' : ''} ${f.required ? 'disabled' : ''}>
            ${f.label}
          </label>`).join('')}
      </div>

      <div class="flex-between" style="margin:12px 0 8px;">
        <span class="cell-sub" id="liSelCount">${st.preview.rows.filter(r => r.include).length} row(s) selected for import</span>
        <div class="flex-gap">
          <span class="cell-sub muted">${icon('edit')} Click any cell to correct it</span>
          <button class="btn btn-sm btn-ghost" data-action="li-select-valid">Select all importable</button>
          <button class="btn btn-sm btn-ghost" data-action="li-select-none">Deselect all</button>
        </div>
      </div>

      <div class="li-preview-wrap" id="liPreviewWrap">${liPreviewTableHtml()}</div>`,
    foot: `
      <button class="btn btn-ghost" data-action="li-back-to-mapping">${icon('swap')} Re-map columns</button>
      <div style="flex:1;"></div>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" data-action="li-commit" id="liCommitBtn">${icon('check')} Import ${st.preview.rows.filter(r => r.include).length} lead(s)</button>`
  });

  liWirePreviewInputs();
}

function liPreviewTableHtml(){
  const st = LeadImportState;
  const cols = LEAD_IMPORT_FIELDS.filter(f => st.fieldsOn.includes(f.key));

  const body = st.preview.rows.map((r, i) => {
    const issueHtml = r.issues.length
      ? r.issues.map(x => `<div class="li-issue ${x.level}">${escHtml(x.text)}</div>`).join('')
      : `<span class="cell-sub muted">—</span>`;
    return `
      <tr class="li-row li-${r.status}">
        <td><input type="checkbox" class="li-row-toggle" data-idx="${i}" ${r.include ? 'checked' : ''} ${r.status === 'error' ? 'disabled' : ''}></td>
        <td class="cell-sub">${r.rowNo}</td>
        ${cols.map(f => `<td>${liPreviewCellHtml(r, f, i)}</td>`).join('')}
        <td class="li-notes-cell">${issueHtml}</td>
      </tr>`;
  }).join('');

  return `<table class="data-table li-preview-table">
    <thead><tr>
      <th></th><th>#</th>
      ${cols.map(f => `<th>${f.label}</th>`).join('')}
      <th>Notes</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function liPreviewCellHtml(row, field, idx){
  const val = row.values[field.key];
  const missingRequired = field.required && (val === null || val === '');
  /* Flag lookups the matcher couldn't resolve so the operator can spot them at a glance. */
  const unresolved = row.issues.some(x => x.field === field.key && x.level === 'warn');
  const cls = ['li-cell', missingRequired ? 'li-missing' : '', unresolved ? 'li-warned' : ''].filter(Boolean).join(' ');
  const display = missingRequired ? 'Missing' : leadImportDisplayValue(field.key, val);
  /* Values get clipped to keep the warnings column on screen, so the full text lives in the tooltip. */
  return `<span class="${cls}" data-idx="${idx}" data-key="${field.key}" title="${escHtml(display)} — click to edit">${escHtml(display)}</span>`;
}

function liWirePreviewInputs(){
  const st = LeadImportState;

  document.querySelectorAll('.li-field-toggle').forEach(cb => {
    cb.addEventListener('change', e => {
      const key = e.target.dataset.key;
      st.fieldsOn = e.target.checked
        ? Array.from(new Set([...st.fieldsOn, key]))
        : st.fieldsOn.filter(k => k !== key);
      liRenderPreviewStep();
    });
  });

  liWirePreviewGrid();
}

/* Re-wired after every grid repaint, since the repaint replaces the rows wholesale. */
function liWirePreviewGrid(){
  const st = LeadImportState;

  /* Row ticks only change state — re-rendering the whole grid here would throw away the scroll position
     on a 100-row import. */
  document.querySelectorAll('.li-row-toggle').forEach(cb => {
    cb.addEventListener('change', e => {
      st.preview.rows[Number(e.target.dataset.idx)].include = e.target.checked;
      liRefreshSelectionCount();
    });
  });

  document.querySelectorAll('.li-cell').forEach(cell => {
    cell.addEventListener('click', () => liStartCellEdit(cell));
  });
}

/* Swaps a single preview cell for the right input type, so a mis-typed phone or an institution the matcher
   couldn't find can be fixed here instead of sending the operator back to Excel to re-export. */
function liStartCellEdit(span){
  const idx = Number(span.dataset.idx), key = span.dataset.key;
  const field = leadImportField(key);
  const row = LeadImportState.preview.rows[idx];
  if(!field || !row) return;

  const current = row.values[key];
  let ctrl;
  if(field.options){
    ctrl = document.createElement('select');
    ctrl.innerHTML = `<option value="">— None —</option>` +
      field.options().map(o => `<option value="${escHtml(o.value)}" ${String(o.value) === String(current) ? 'selected' : ''}>${escHtml(o.label)}</option>`).join('');
  } else {
    ctrl = document.createElement('input');
    ctrl.type = field.type === 'date' ? 'date' : 'text';
    ctrl.value = current == null ? '' : current;
  }
  ctrl.className = 'li-cell-edit';
  span.replaceWith(ctrl);
  ctrl.focus();
  if(ctrl.select) ctrl.select();

  let committed = false;
  const commit = () => {
    if(committed) return;
    committed = true;
    let v = ctrl.value;

    /* Anything the user sets by hand supersedes whatever the parser said about this field. */
    row.issues = row.issues.filter(i => i.field !== key);

    if(v === '' || v == null){
      row.values[key] = null;
    } else if(field.options){
      row.values[key] = field.type === 'lookup' ? Number(v) : v;
    } else {
      const out = field.resolve ? field.resolve(String(v).trim()) : { value: String(v).trim() };
      row.values[key] = out.value;
      if(out.warning) row.issues.push({ level:'warn', field:key, text:out.warning });
    }

    revalidateLeadImportPreview(LeadImportState.preview);
    liRefreshPreviewBody();
  };

  ctrl.addEventListener('change', commit);
  ctrl.addEventListener('blur', commit);
  ctrl.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); commit(); }
    else if(e.key === 'Escape'){ committed = true; liRefreshPreviewBody(); }
  });
}

/* Repaints the grid and the counters in place, keeping the scroll position — an edit near the bottom of a
   long import shouldn't fling the operator back to row 1. */
function liRefreshPreviewBody(){
  const wrap = document.getElementById('liPreviewWrap');
  if(!wrap) return;
  const scroll = wrap.scrollTop;
  wrap.innerHTML = liPreviewTableHtml();
  wrap.scrollTop = scroll;
  liWirePreviewGrid();
  liRefreshSummaryChips();
  liRefreshSelectionCount();
}

function liRefreshSummaryChips(){
  const s = LeadImportState.preview.summary;
  const el = document.getElementById('liSummary');
  if(!el) return;
  el.innerHTML = `
    <div class="li-sum-chip"><b>${s.total}</b> rows read</div>
    <div class="li-sum-chip green"><b>${s.ready}</b> ready</div>
    <div class="li-sum-chip amber"><b>${s.warn}</b> with warnings</div>
    <div class="li-sum-chip purple"><b>${s.duplicate}</b> duplicates</div>
    <div class="li-sum-chip red"><b>${s.error}</b> can't import</div>`;
}

function liRefreshSelectionCount(){
  const st = LeadImportState;
  const n = st.preview.rows.filter(r => r.include).length;
  const label = document.getElementById('liSelCount');
  const btn = document.getElementById('liCommitBtn');
  if(label) label.textContent = `${n} row(s) selected for import`;
  if(btn){
    btn.innerHTML = `${icon('check')} Import ${n} lead(s)`;
    btn.disabled = n === 0;
  }
}

function liSetSelection(mode){
  const st = LeadImportState;
  if(!st || !st.preview) return;
  st.preview.rows.forEach(r => { r.include = mode === 'none' ? false : r.status !== 'error'; });
  document.querySelectorAll('.li-row-toggle').forEach(cb => {
    const r = st.preview.rows[Number(cb.dataset.idx)];
    cb.checked = !!r.include;
  });
  liRefreshSelectionCount();
}

function liCommitImport(){
  const st = LeadImportState;
  if(!st || !st.preview) return;
  const chosen = st.preview.rows.filter(r => r.include && r.status !== 'error');
  if(!chosen.length){ toast('Tick at least one row to import', 'error'); return; }

  const created = importLeads(st.preview.rows, st.fieldsOn, currentUserId, {
    fileName: st.fileName,
    skipped: st.preview.rows.length - chosen.length
  });

  closeModal();
  LeadImportState = null;
  toast(`${created.length} lead(s) imported successfully`);
  refreshCurrentView();
}

function liDownloadTemplate(){
  const blob = new Blob([leadImportTemplateCsv()], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lead-import-template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('Template downloaded — fill it in and upload it back');
}
