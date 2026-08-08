/* ============================================================
   Shared UI helpers — modal, drawer, toast, badges, mini-charts
   ============================================================ */

/* ---------------- Toast ---------------- */
function toast(msg, kind){
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon(kind==='error'?'alertCircle':'checkCircle')}<span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }, 2600);
}

/* ---------------- Modal ---------------- */
function openModal({title, sub, body, foot, size}){
  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  box.className = 'modal' + (size ? ' '+size : '');
  document.getElementById('modalTitle').textContent = title || '';
  const subEl = document.getElementById('modalSub');
  if(sub){ subEl.style.display='block'; subEl.textContent = sub; } else { subEl.style.display='none'; }
  document.getElementById('modalBody').innerHTML = body || '';
  document.getElementById('modalFoot').innerHTML = foot || `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`;
  overlay.classList.add('show');
}
function closeModal(){ document.getElementById('modalOverlay').classList.remove('show'); }

document.addEventListener('DOMContentLoaded', ()=>{
  const modalClose = document.getElementById('modalClose');
  if(modalClose){ modalClose.innerHTML = icon('close'); modalClose.addEventListener('click', closeModal); }
  document.getElementById('modalOverlay')?.addEventListener('click', (e)=>{ if(e.target.id==='modalOverlay') closeModal(); });
  const drawerClose = document.getElementById('drawerClose');
  if(drawerClose){ drawerClose.innerHTML = icon('close'); drawerClose.addEventListener('click', closeDrawer); }
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ closeModal(); closeDrawer(); } });
});

/* ---------------- Drawer ---------------- */
function openDrawer({title, sub, body}){
  if(!document.getElementById('drawer')) return;
  document.getElementById('drawerTitle').textContent = title || '';
  document.getElementById('drawerSub').textContent = sub || '';
  document.getElementById('drawerBody').innerHTML = body || '';
  document.getElementById('drawerOverlay').classList.add('show');
  document.getElementById('drawer').classList.add('show');
}
function closeDrawer(){
  document.getElementById('drawerOverlay')?.classList.remove('show');
  document.getElementById('drawer')?.classList.remove('show');
}

/* ---------------- Badge helpers ---------------- */
const STATUS_MAP = {
  active:'green', paid:'green', present:'green', completed:'green', issued:'green', approved:'green', signed:'green', success:'green', sent:'green', admitted:'green', done:'green', ongoing:'blue',
  pending:'amber', partial:'amber', requested:'amber', upcoming:'blue', in_progress:'amber', new:'blue', contacted:'blue', interested:'cyan', visited:'purple', negotiation:'amber',
  overdue:'red', dropped:'red', lost:'red', failed:'red', absent:'red', rejected:'red', missed:'red', locked:'red', expired:'red', inactive:'gray', archived:'gray', cancelled:'gray',
  none:'gray', draft:'gray', on_hold:'amber', certified:'purple', prospect:'gray', excused:'cyan', not_started:'gray', late:'amber', refunded:'purple', revoked:'red', reissued:'blue', due:'amber'
};
function statusBadge(status, label){
  const color = STATUS_MAP[status] || 'gray';
  const text = label || (status||'').replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
  return `<span class="badge badge-${color}"><span class="dot-i" style="background:currentColor;"></span>${text}</span>`;
}
function methodBadge(method){
  const map = {cash:'green', cheque:'blue', bank:'blue', bkash:'purple', nagad:'amber', rocket:'cyan', card:'gray'};
  return `<span class="badge badge-${map[method]||'gray'}">${(method||'').toUpperCase()}</span>`;
}

/* ---------------- Mini bar chart (CSS) ---------------- */
function renderBarChart(data, opts){
  // data: [{label, value}], opts:{max}
  const max = opts?.max || Math.max(...data.map(d=>d.value), 1);
  return `<div class="bar-chart">${data.map(d=>`
    <div class="bar-col">
      <div class="bar-value">${opts?.fmt ? opts.fmt(d.value) : d.value}</div>
      <div class="bar" style="height:${Math.max(6, d.value/max*100)}%;${d.color?`background:${d.color};`:''}"></div>
      <div class="bar-label">${d.label}</div>
    </div>`).join('')}</div>`;
}

/* ---------------- Donut chart (conic-gradient) ---------------- */
function renderDonut(data){
  // data: [{label, value, color}]
  const total = data.reduce((a,d)=>a+d.value,0) || 1;
  let acc = 0;
  const stops = data.map(d=>{
    const start = acc/total*360; acc += d.value; const end = acc/total*360;
    return `${d.color} ${start}deg ${end}deg`;
  }).join(', ');
  const legend = data.map(d=>`
    <div class="item"><span class="sw" style="background:${d.color}"></span>${d.label} <b>${d.value}</b></div>`).join('');
  return `<div class="donut-wrap">
    <div class="donut" style="background:conic-gradient(${stops});"></div>
    <div class="donut-legend">${legend}</div>
  </div>`;
}

/* ---------------- Horizontal bar list ---------------- */
function renderHBarList(data, opts){
  const max = Math.max(...data.map(d=>d.value), 1);
  return `<div class="hbar-list">${data.map(d=>`
    <div class="hbar-row">
      <div class="top"><b>${d.label}</b><span>${opts?.fmt ? opts.fmt(d.value) : d.value}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${d.value/max*100}%;${d.color?`background:${d.color};`:''}"></div></div>
    </div>`).join('')}</div>`;
}

/* ---------------- Tabs helper ---------------- */
function tabsHtml(tabs, activeId, dataAttr){
  return `<div class="tabs">${tabs.map(t=>`<button class="tab-btn ${t.id===activeId?'active':''}" data-${dataAttr||'tab'}="${t.id}">${t.label}</button>`).join('')}</div>`;
}

/* ---------------- KPI card (shared by admin dashboard & student portal) ---------------- */
function kpiCard(iconName, label, value, trend, color){
  return `<div class="card kpi-card">
    <div class="kpi-top">
      <div class="kpi-icon" style="background:${color}1a;color:${color};">${ICONS[iconName]}</div>
      ${trend!=null ? `<span class="kpi-trend ${trend>=0?'up':'down'}">${icon(trend>=0?'arrowUp':'arrowDown')}${Math.abs(trend)}%</span>` : ''}
    </div>
    <div class="kpi-label">${label}</div>
    <div class="kpi-value">${value}</div>
  </div>`;
}

/* Escapes untrusted text before it goes into an innerHTML template. Needed anywhere we render content that
   came from outside the app (uploaded spreadsheets, pasted data) rather than from the seeded DB. */
function escHtml(v){
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------------- Avatar initials / photo ---------------- */
function initials(name){ return (name||'?').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase(); }
function avatarHtml(name, size, photo){
  if(photo) return `<div class="avatar has-photo ${size||''}"><img src="${photo}" alt=""></div>`;
  return `<div class="avatar ${size||''}">${initials(name)}</div>`;
}
/* Paints a live avatar element (e.g. a topbar/header chip) in place, without re-rendering the whole page */
function paintAvatarEl(el, name, photo){
  if(!el) return;
  el.classList.toggle('has-photo', !!photo);
  el.innerHTML = photo ? `<img src="${photo}" alt="">` : '';
  if(!photo) el.textContent = initials(name);
}

/* ---------------- Profile photo upload (shared by Admin/My Profile, Student Portal & Teacher Portal) ---------------- */
function profilePhotoBlockHtml(name, photo, opts){
  opts = opts || {};
  const inputId = opts.inputId || 'profilePhotoInput';
  const removeAction = opts.removeAction || 'remove-profile-photo';
  return `
  <div class="avatar lg ${photo?'has-photo':''}" id="${opts.previewId||'profilePhotoPreview'}" style="margin:0 auto;">${photo?`<img src="${photo}" alt="">`:initials(name)}</div>
  <div class="flex-gap" style="justify-content:center;flex-wrap:wrap;margin-top:12px;">
    <label class="btn btn-secondary btn-sm" style="cursor:pointer;margin:0;">${icon('upload')} Change Photo<input type="file" accept="image/*" id="${inputId}" style="display:none;"></label>
    ${photo ? `<button type="button" class="btn btn-ghost btn-sm" data-action="${removeAction}">${icon('close')} Remove</button>` : ''}
  </div>`;
}
/* Wires the hidden file input created by profilePhotoBlockHtml — reads the chosen image as a data URL (demo-only, in-memory) */
function wireProfilePhotoInput(inputId, onPhoto){
  const input = document.getElementById(inputId); if(!input) return;
  input.addEventListener('change', ()=>{
    const file = input.files && input.files[0]; if(!file) return;
    if(!file.type.startsWith('image/')){ toast('Please choose an image file', 'error'); input.value=''; return; }
    if(file.size > 3*1024*1024){ toast('Image is too large — 3MB max for this demo', 'error'); input.value=''; return; }
    const reader = new FileReader();
    reader.onload = ()=>{ onPhoto(reader.result); input.value=''; };
    reader.readAsDataURL(file);
  });
}

/* ---------------- Pagination footer (visual only) ---------------- */
function paginationHtml(total, shown){
  return `<div class="flex-between" style="padding:14px 20px; border-top:1px solid var(--gray-100); font-size:12.3px; color:var(--gray-500);">
    <span>Showing <b>${shown}</b> of <b>${total}</b> records</span>
    <div class="flex-gap">
      <button class="btn btn-secondary btn-sm" disabled>Previous</button>
      <button class="btn btn-secondary btn-sm">Next</button>
    </div>
  </div>`;
}

/* ---------------- Printable payment receipt (shared — used by Admin/Accountant & Student Portal) ---------------- */
function receiptData(paymentId){
  const p = DB.payments.find(x=>x.id===Number(paymentId)); if(!p) return null;
  const inv = DB.feeInvoices.find(i=>i.id===p.invoice_id);
  const s = studentById(p.student_id);
  const enr = (inv && s) ? s.courses[inv.student_course_idx] : (s ? primaryEnrollment(s) : null);
  return { p, inv, s, enr };
}

function receiptTemplate(paymentId, opts){
  const d = receiptData(paymentId); if(!d || !d.s) return '<p class="muted">Receipt not found.</p>';
  const { p, inv, s, enr } = d;
  const logoSrc = (opts && opts.absoluteLogo) ? new URL('assets/logo.svg', location.href).href : 'assets/logo.svg';
  return `
  <div class="receipt-sheet">
    <div class="receipt-head">
      <div class="flex-gap">
        <div class="mark logo-chip" style="width:40px;height:40px;"><img src="${logoSrc}" alt="logo"></div>
        <div><b style="font-size:15px;display:block;">${DB.orgProfile.name}</b><span style="font-size:11px;color:var(--gray-500);display:block;">${DB.orgProfile.address}</span><span style="font-size:11px;color:var(--gray-500);">${DB.orgProfile.phone} · ${DB.orgProfile.email}</span></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:800;color:var(--primary-700);">PAYMENT RECEIPT</div>
        <div class="cell-sub">${p.receipt_no}</div>
      </div>
    </div>
    <div class="hr"></div>
    <div class="grid grid-2" style="gap:14px;margin-bottom:16px;">
      <div><span class="cell-sub">Received From</span><div class="cell-strong">${s.name} (${s.code})</div></div>
      <div><span class="cell-sub">Date</span><div class="cell-strong">${fmtDate(p.date)} ${(p.date.split(' ')[1])||''}</div></div>
      <div><span class="cell-sub">Course</span><div class="cell-strong">${courseName(enr?.course_id)}</div></div>
      <div><span class="cell-sub">Batch</span><div class="cell-strong">${batchName(enr?.batch_id)}</div></div>
    </div>
    <div class="table-wrap" style="margin-bottom:16px;"><table class="data-table"><thead><tr><th>Description</th><th>Method</th><th style="text-align:right;">Amount</th></tr></thead><tbody>
      <tr><td>Course fee payment${p.channel==='physical'?' (received in person)':' (paid online)'}</td><td>${methodBadge(p.method)}</td><td style="text-align:right;" class="cell-strong">${fmtMoney(p.amount)}</td></tr>
    </tbody></table></div>
    <div class="grid grid-2" style="gap:10px;margin-bottom:26px;font-size:13px;">
      <div class="flex-between"><span class="muted">Total Course Fee</span><b>${fmtMoney(inv?.total ?? p.amount)}</b></div>
      <div class="flex-between"><span class="muted">Paid Till Date</span><b style="color:var(--success-700);">${fmtMoney(inv?.paid ?? p.amount)}</b></div>
      <div class="flex-between"><span class="muted">Remaining Due</span><b style="color:${(inv?.due||0)>0?'var(--danger-600)':'var(--success-700)'};">${fmtMoney(inv?.due||0)}</b></div>
      <div class="flex-between"><span class="muted">Received By</span><b>${p.collected_by?userName(p.collected_by):(p.gateway_txn_id||'Online Gateway')}</b></div>
    </div>
    <div class="flex-between" style="margin-top:30px;">
      <div style="text-align:center;"><div style="border-top:1.5px solid var(--gray-400);width:150px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Student / Guardian Signature</span></div>
      <div style="text-align:center;"><div style="border-top:1.5px solid var(--gray-400);width:150px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Authorized Signature (Accountant) · ${fmtDate(p.date)}</span></div>
    </div>
  </div>`;
}

function receiptPreviewModal(paymentId){
  openModal({ size:'lg', title:'Payment Receipt', sub:'Review, then print or hand a physical copy to the student',
    body: receiptTemplate(paymentId),
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="printReceipt(${paymentId})">${icon('printer')} Print Receipt</button>`
  });
}

function printReceipt(paymentId){
  const bodyHtml = receiptTemplate(paymentId, { absoluteLogo:true });
  const html = `<!DOCTYPE html><html><head><title>Payment Receipt</title><meta charset="UTF-8">
<style>
  :root{ --primary-700:#c93e14; --gray-400:#94a3b8; --gray-500:#64748b; --success-700:#047857; --danger-600:#dc2626; }
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:34px;color:#1e293b;}
  .receipt-sheet{max-width:640px;margin:0 auto;}
  .receipt-head{display:flex;justify-content:space-between;align-items:flex-start;}
  .hr{height:1px;background:#e2e8f0;margin:16px 0;}
  .grid{display:grid;gap:10px;} .grid-2{grid-template-columns:1fr 1fr;}
  .flex-between{display:flex;justify-content:space-between;align-items:center;}
  .flex-gap{display:flex;align-items:center;gap:10px;}
  .cell-strong{font-weight:700;} .cell-sub{font-size:11px;color:#94a3b8;} .muted{color:#64748b;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;padding:8px 10px;border-bottom:1px solid #e2e8f0;}
  td{padding:9px 10px;border-bottom:1px solid #f1f5f9;}
  .badge{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:#f1f5f9;color:#475569;}
  .logo-chip{background:#111;border-radius:9px;overflow:hidden;display:flex;align-items:center;justify-content:center;}
  .logo-chip img{width:80%;height:80%;object-fit:contain;}
  @media print{ body{padding:0;} }
</style>
</head><body>${bodyHtml}</body></html>`;
  const w = window.open('', '_blank', 'width=760,height=920');
  if(w && w.document){
    w.document.open(); w.document.write(html); w.document.close();
    w.focus();
    setTimeout(()=>{ try{ w.print(); }catch(e){} }, 300);
  } else {
    toast('Please allow pop-ups to print the receipt (demo)', 'error');
  }
}

/* ---------------- Printable cash deposit / handover receipt ---------------- */
function cashHandoverReceiptTemplate(id, opts){
  const h = DB.cashHandovers.find(x=>x.id===Number(id)); if(!h) return '<p class="muted">Record not found.</p>';
  const payments = cashHandoverPayments(h);
  const logoSrc = (opts && opts.absoluteLogo) ? new URL('assets/logo.svg', location.href).href : 'assets/logo.svg';
  const isBank = h.type==='bank_deposit';
  return `
  <div class="receipt-sheet">
    <div class="receipt-head">
      <div class="flex-gap">
        <div class="mark logo-chip" style="width:40px;height:40px;"><img src="${logoSrc}" alt="logo"></div>
        <div><b style="font-size:15px;display:block;">${DB.orgProfile.name}</b><span style="font-size:11px;color:var(--gray-500);display:block;">${DB.orgProfile.address}</span><span style="font-size:11px;color:var(--gray-500);">${DB.orgProfile.phone} · ${DB.orgProfile.email}</span></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:800;color:var(--primary-700);">${isBank ? 'BANK DEPOSIT RECEIPT' : 'CASH HANDOVER RECEIPT'}</div>
        <div class="cell-sub">${h.receipt_no}</div>
      </div>
    </div>
    <div class="hr"></div>
    <div class="grid grid-2" style="gap:14px;margin-bottom:16px;">
      <div><span class="cell-sub">Date</span><div class="cell-strong">${fmtDate(h.date)}</div></div>
      <div><span class="cell-sub">Amount</span><div class="cell-strong" style="color:var(--primary-700);">${fmtMoney(h.amount)}</div></div>
      <div><span class="cell-sub">Handed Over By</span><div class="cell-strong">${userName(h.created_by)} (Accountant)</div></div>
      <div><span class="cell-sub">${isBank ? 'Deposited To' : 'Received By'}</span><div class="cell-strong">${isBank ? h.bank_name : userName(h.handed_to)}</div></div>
      ${isBank ? `
      <div><span class="cell-sub">Branch</span><div class="cell-strong">${h.branch||'—'}</div></div>
      <div><span class="cell-sub">Account No.</span><div class="cell-strong">${h.account_no||'—'}</div></div>
      <div><span class="cell-sub">Deposit Slip No.</span><div class="cell-strong">${h.slip_no||'—'}</div></div>` : `
      <div><span class="cell-sub">Status</span><div class="cell-strong">${h.status==='confirmed' ? 'Confirmed & Signed' : 'Pending Signature'}</div></div>`}
    </div>
    <div class="table-wrap" style="margin-bottom:16px;"><table class="data-table"><thead><tr><th>Receipt No.</th><th>Student</th><th style="text-align:right;">Amount</th></tr></thead><tbody>
      ${payments.map(p=>`<tr><td>${p.receipt_no}</td><td>${studentName(p.student_id)}</td><td style="text-align:right;">${fmtMoney(p.amount)}</td></tr>`).join('')}
      <tr><td colspan="2" style="text-align:right;font-weight:800;">Total</td><td style="text-align:right;font-weight:800;">${fmtMoney(h.amount)}</td></tr>
    </tbody></table></div>
    ${h.notes ? `<div class="cell-sub" style="margin-bottom:8px;">Notes: ${h.notes}</div>` : ''}
    ${h.attachment ? `<div class="cell-sub" style="margin-bottom:16px;">${icon('file')} Attachment on file: ${h.attachment.name}</div>` : ''}
    <div class="flex-between" style="margin-top:30px;">
      <div style="text-align:center;"><div style="border-top:1.5px solid var(--gray-400);width:170px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Handed Over By — ${userName(h.created_by)}</span></div>
      <div style="text-align:center;">
        ${isBank
          ? `<div style="border-top:1.5px solid var(--gray-400);width:170px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Bank Authorized Signature / Stamp (Slip ${h.slip_no||'—'})</span>`
          : (h.status==='confirmed'
              ? `<div style="font-family:'Brush Script MT',cursive;font-size:20px;color:var(--primary-700);border-bottom:1.5px solid var(--gray-400);width:170px;margin-bottom:6px;padding-bottom:2px;">${h.confirmed_signature}</div><span style="font-size:11px;color:var(--gray-500);">Received &amp; Signed by ${userName(h.confirmed_by)} · ${fmtDate(h.confirmed_date)}</span>`
              : `<div style="border-top:1.5px solid var(--gray-400);width:170px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Awaiting Signature — ${userName(h.handed_to)}</span>`)}
      </div>
    </div>
  </div>`;
}
function cashHandoverReceiptModal(id){
  const h = DB.cashHandovers.find(x=>x.id===Number(id)); if(!h) return;
  openModal({ size:'lg', title: h.type==='bank_deposit' ? 'Bank Deposit Receipt' : 'Cash Handover Receipt', sub: h.status==='confirmed' ? 'Confirmed & signed' : 'Awaiting recipient signature',
    body: cashHandoverReceiptTemplate(id),
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="printCashHandoverReceipt(${h.id})">${icon('printer')} Print Receipt</button>`
  });
}
function printCashHandoverReceipt(id){
  const bodyHtml = cashHandoverReceiptTemplate(id, { absoluteLogo:true });
  const html = `<!DOCTYPE html><html><head><title>Cash Receipt</title><meta charset="UTF-8">
<style>
  :root{ --primary-700:#c93e14; --gray-400:#94a3b8; --gray-500:#64748b; --success-700:#047857; --danger-600:#dc2626; }
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:34px;color:#1e293b;}
  .receipt-sheet{max-width:640px;margin:0 auto;}
  .receipt-head{display:flex;justify-content:space-between;align-items:flex-start;}
  .hr{height:1px;background:#e2e8f0;margin:16px 0;}
  .grid{display:grid;gap:10px;} .grid-2{grid-template-columns:1fr 1fr;}
  .flex-between{display:flex;justify-content:space-between;align-items:center;}
  .flex-gap{display:flex;align-items:center;gap:10px;}
  .cell-strong{font-weight:700;} .cell-sub{font-size:11px;color:#94a3b8;} .muted{color:#64748b;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;padding:8px 10px;border-bottom:1px solid #e2e8f0;}
  td{padding:9px 10px;border-bottom:1px solid #f1f5f9;}
  .logo-chip{background:#111;border-radius:9px;overflow:hidden;display:flex;align-items:center;justify-content:center;}
  .logo-chip img{width:80%;height:80%;object-fit:contain;}
  @media print{ body{padding:0;} }
</style>
</head><body>${bodyHtml}</body></html>`;
  const w = window.open('', '_blank', 'width=760,height=920');
  if(w && w.document){
    w.document.open(); w.document.write(html); w.document.close();
    w.focus();
    setTimeout(()=>{ try{ w.print(); }catch(e){} }, 300);
  } else {
    toast('Please allow pop-ups to print the receipt (demo)', 'error');
  }
}

/* ---------------- Confirm helper ---------------- */
function confirmAction(msg, onYes){
  openModal({
    title:'Please confirm',
    body:`<div class="flex-gap" style="align-items:flex-start;"><span style="color:var(--warning-500);flex-shrink:0;">${icon('alertCircle')}</span><p style="margin:0;color:var(--gray-600);font-size:13.5px;">${msg}</p></div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" id="confirmYesBtn">Yes, proceed</button>`
  });
  document.getElementById('confirmYesBtn').onclick = ()=>{ closeModal(); onYes && onYes(); };
}
