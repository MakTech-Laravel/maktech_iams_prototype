/* ============================================================
   Teacher Portal — dedicated self-service portal for Coordinators/Teachers.
   Mirrors the Student Portal's shell/UX but scoped entirely to a teacher's own
   batches, students, attendance & pay. Coordinators/Teachers are portal-only
   by default (see AdminPanelAccess in data.js) — this is where they log in.
   ============================================================ */

let TP_TEACHER_ID = null;

/* Grouped sidebar nav (mirrors the Admin Panel's collapsible NAV/buildSidebar pattern in js/app.js) —
   new pages just slot into an existing group (or a new one), so the header never has to grow again. */
const TP_NAV = [
  { id:'grp-dashboard', label:'Dashboard', ic:'dashboard', items:[
    { id:'dashboard', label:'Dashboard', ic:'home', sub:"Here's what's happening across your batches today" },
  ]},
  { id:'grp-teaching', label:'Teaching', ic:'batch', items:[
    { id:'batches', label:'My Batches', ic:'batch', sub:'Batches assigned to you' },
    { id:'attendance', label:'Attendance', ic:'attendance', sub:'Mark attendance for your assigned batches' },
    { id:'students', label:'My Students', ic:'students', sub:'Read-only roster of students in your batches' },
  ]},
  { id:'grp-pay', label:'Pay & Account', ic:'graduationCap', items:[
    { id:'payments', label:'My Payments', ic:'graduationCap', sub:'Pay rates, earnings & payment vouchers' },
    { id:'profile', label:'Profile', ic:'user', sub:'Your account details' },
  ]},
];
let expandedTpGroupId = 'grp-dashboard';

const TP_VIEWS = {
  dashboard: renderTpDashboard,
  batches: renderTpBatches,
  attendance: renderTpAttendance,
  students: renderTpStudents,
  payments: renderTpPayments,
  profile: renderTpProfile,
};
let tpCurrentView = 'dashboard';

function tpTeacher(){ return DB.users.find(u=>u.id===TP_TEACHER_ID); }
function tpBatches(){ return TP_TEACHER_ID ? scopedBatchesForUser(TP_TEACHER_ID) : []; }

/* ---------------- Auth flow ---------------- */
function populateTeacherDemoSelect(){
  const sel = document.getElementById('demoTeacherSelect');
  sel.innerHTML = `<option value="">— choose a demo teacher —</option>` + teacherUsers().map(u=>`<option value="${u.id}">${u.name} (${u.phone})${u.status==='inactive'?' — inactive':''}</option>`).join('');
  sel.addEventListener('change', ()=>{ if(sel.value) teacherPortalLogin(Number(sel.value)); });
}
function teacherPortalLoginByPhone(){
  const phone = document.getElementById('tpLoginPhone').value.trim();
  if(!phone){ toast('Enter your registered phone number', 'error'); return; }
  const u = teacherByPhone(phone);
  if(!u){ toast('No teacher/coordinator account found with that phone number', 'error'); return; }
  if(u.status!=='active'){ toast('This account is inactive — contact Admin', 'error'); return; }
  teacherPortalLogin(u.id);
}
function teacherPortalLogin(teacherId){
  TP_TEACHER_ID = teacherId;
  const u = tpTeacher();
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('portalShell').style.display = 'flex';
  paintAvatarEl(document.getElementById('portalAvatar'), u.name, u.photo);
  document.getElementById('portalUserName').textContent = u.name;
  document.getElementById('portalUserCode').textContent = roleName(u.role_id);
  buildTpNav();
  tpNavigate('dashboard');
}
function tpLogout(){
  TP_TEACHER_ID = null;
  document.getElementById('portalShell').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
}

function tpGroupForView(viewId){ return TP_NAV.find(g=>g.items.some(it=>it.id===viewId)); }
function tpNavItem(viewId){ return TP_NAV.flatMap(g=>g.items).find(it=>it.id===viewId); }

function buildTpNav(){
  const root = document.getElementById('portalNav');
  root.innerHTML = TP_NAV.map(g=>{
    const items = g.items;
    const hasActive = items.some(it=>it.id===tpCurrentView);
    if(items.length===1){
      const it = items[0];
      return `<div class="nav-group">
        <div class="nav-item ${it.id===tpCurrentView?'active':''}" data-action="tpgo" data-tpview="${it.id}">
          ${icon(it.ic)}<span>${it.label}</span>
        </div>
      </div>`;
    }
    const expanded = expandedTpGroupId===g.id;
    return `<div class="nav-group">
      <div class="nav-section ${expanded?'expanded':''}">
        <div class="nav-group-header ${hasActive?'has-active':''}" data-action="toggle-tp-nav-group" data-group="${g.id}">
          ${icon(g.ic)}<span>${g.label}</span>
          ${icon('chevronRight','chev')}
        </div>
        <div class="nav-submenu">
          ${items.map(it=>`
            <div class="nav-item sub ${it.id===tpCurrentView?'active':''}" data-action="tpgo" data-tpview="${it.id}">
              ${icon(it.ic)}
              <span>${it.label}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}
function tpNavigate(view){
  tpCurrentView = view;
  const grp = tpGroupForView(view);
  if(grp && grp.items.length>1) expandedTpGroupId = grp.id;
  buildTpNav();
  const it = tpNavItem(view);
  document.getElementById('portalPageTitle').textContent = it ? it.label : 'Not Found';
  document.getElementById('portalPageSub').textContent = it ? (it.sub||'') : '';
  document.getElementById('portalContent').innerHTML = TP_VIEWS[view] ? TP_VIEWS[view]() : '<p>Not found</p>';
  window.scrollTo({top:0, behavior:'instant'});
  document.getElementById('portalSidebar').classList.remove('show');
  document.getElementById('portalSidebarScrim').classList.remove('show');
  if(view==='profile'){
    wireProfilePhotoInput('tpProfilePhotoInput', (dataUrl)=>{
      setUserPhoto(TP_TEACHER_ID, dataUrl);
      paintAvatarEl(document.getElementById('portalAvatar'), tpTeacher().name, dataUrl);
      tpRefresh();
      toast('Profile photo updated');
    });
  }
}
function tpRefresh(){ tpNavigate(tpCurrentView); }

/* ---------------- Dashboard ---------------- */
function tpBatchCardHtml(b){
  const u = tpTeacher();
  const rate = payRateFor(u.id, b.id);
  return `<div class="card card-pad">
    <div class="flex-between" style="margin-bottom:6px;gap:8px;"><b>${b.name}</b>${statusBadge(b.status)}</div>
    <div class="cell-sub" style="margin-bottom:10px;">${courseName(b.course_id)} · ${labName(b.lab_id)}</div>
    <div class="cell-sub" style="margin-bottom:4px;">${batchEnrolledCount(b.id)}/${effectiveBatchCapacity(b)} students enrolled</div>
    <div class="cell-sub" style="margin-bottom:12px;">${fmtDate(b.start)} – ${fmtDate(b.end)}</div>
    ${rate ? `<div class="badge badge-gray" style="margin-bottom:10px;">${PAY_RATE_TYPE_LABELS[rate.rate_type]} · ${fmtMoney(rate.rate_amount)}</div>` : ''}
    <div class="flex-gap">
      <button class="btn btn-sm btn-secondary" data-action="tpgo" data-tpview="attendance" data-batchid="${b.id}">${icon('attendance')} Attendance</button>
    </div>
  </div>`;
}
function renderTpDashboard(){
  const u = tpTeacher();
  const batches = tpBatches();
  const activeBatches = batches.filter(b=>b.status==='ongoing');
  const totalStudents = new Set(batches.flatMap(b=>activeStudentsInBatch(b.id).map(s=>s.id))).size;
  let totalEarned = 0, totalPaid = 0;
  batches.forEach(b=>{ totalEarned += computeEarnedForTeacherBatch(u.id, b.id); totalPaid += totalPaidToTeacherForBatch(u.id, b.id); });
  const outstanding = Math.max(0, totalEarned - totalPaid);
  return `
  <div class="portal-hero">
    <h2>Welcome back, ${u.name.split(' ')[0]}</h2>
    <p>You're assigned to ${batches.length} batch${batches.length===1?'':'es'} — ${activeBatches.length} currently ongoing. Use "Attendance" to mark today's class, or check "My Payments" for your earnings.</p>
  </div>
  <div class="grid grid-4" style="margin-bottom:24px;">
    ${kpiCard('batch','My Batches', batches.length, null, '#ff6533')}
    ${kpiCard('students','My Students', totalStudents, null, '#10b981')}
    ${kpiCard('graduationCap','Earned (All Batches)', fmtMoney(totalEarned), null, '#8b5cf6')}
    ${kpiCard('wallet','Outstanding', fmtMoney(outstanding), null, '#f59e0b')}
  </div>
  <h3 class="report-section-title">My Batches</h3>
  <div class="grid grid-3">${batches.map(b=>tpBatchCardHtml(b)).join('') || '<div class="empty-state">'+icon('batch')+'<p>No batches assigned yet.</p></div>'}</div>`;
}

/* ---------------- My Batches ---------------- */
function renderTpBatches(){
  const batches = tpBatches();
  return `
  <div class="grid grid-3">${batches.map(b=>tpBatchCardHtml(b)).join('') || '<div class="empty-state">'+icon('batch')+'<p>No batches assigned yet.</p></div>'}</div>`;
}

/* ---------------- Attendance ---------------- */
let tpAttBatchId = null, tpAttDate = null, tpAttModuleId = null, tpAttMarks = {};
function renderTpAttendance(){
  tpAttDate = tpAttDate || TODAY;
  const batches = tpBatches().filter(b=>b.status!=='upcoming');
  if(!batches.length) return `<div class="empty-state">${icon('attendance')}<p>No active batches to mark attendance for yet.</p></div>`;
  if(!tpAttBatchId || !batches.some(b=>b.id===tpAttBatchId)) tpAttBatchId = batches[0].id;
  const batch = batches.find(b=>b.id===tpAttBatchId);
  const course = DB.courses.find(c=>c.id===batch.course_id);
  const moduleOptions = course ? course.modules : [];
  if(tpAttModuleId==null && moduleOptions.length) tpAttModuleId = moduleOptions[0].id;
  const roster = activeStudentsInBatch(batch.id);
  const existingSession = findAttendanceSession(batch.id, tpAttDate, tpAttModuleId);
  tpAttMarks = {};
  roster.forEach(s=>{
    const rec = existingSession ? DB.attendanceRecords.find(r=>r.session_id===existingSession.id && r.student_id===s.id) : null;
    tpAttMarks[s.id] = rec ? rec.status : 'present';
  });
  const rows = roster.map(s=>`
    <tr data-studentrow="${s.id}">
      <td>${avatarHtml(s.name,'sm',s.photo)}</td>
      <td class="cell-strong">${s.name}</td>
      <td>${s.code}</td>
      <td><div class="flex-gap">${['present','absent','late','excused'].map(st=>`<button class="btn btn-sm ${tpAttMarks[s.id]===st?'btn-primary':'btn-secondary'}" data-action="tp-mark-attendance-cell" data-studentid="${s.id}" data-status="${st}" style="padding:5px 10px;">${st[0].toUpperCase()}</button>`).join('')}</div></td>
    </tr>`).join('');
  return `
  <div class="filter-bar">
    <select id="tpAttBatchSelect" onchange="onTpAttendanceFilterChange()">${batches.map(b=>`<option value="${b.id}" ${b.id===batch.id?'selected':''}>${b.name} — ${courseName(b.course_id)}</option>`).join('')}</select>
    <input type="date" id="tpAttDateInput" value="${tpAttDate}" onchange="onTpAttendanceFilterChange()">
    <select id="tpAttModuleSelect" onchange="onTpAttendanceFilterChange()">${moduleOptions.length ? moduleOptions.map(m=>`<option value="${m.id}" ${m.id===tpAttModuleId?'selected':''}>${m.title}</option>`).join('') : '<option value="">General Session</option>'}</select>
  </div>
  ${roster.length ? `
  <div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Student</th><th>Code</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  <div class="flex-gap" style="margin-top:16px;justify-content:flex-end;"><button class="btn btn-primary" data-action="tp-save-attendance" data-batchid="${batch.id}">${icon('check')} Save Attendance</button></div>`
  : `<div class="empty-state">${icon('students')}<p>No active students in this batch yet.</p></div>`}`;
}
function onTpAttendanceFilterChange(){
  tpAttBatchId = Number(document.getElementById('tpAttBatchSelect').value);
  tpAttDate = document.getElementById('tpAttDateInput').value;
  const modVal = document.getElementById('tpAttModuleSelect').value;
  tpAttModuleId = modVal ? Number(modVal) : null;
  document.getElementById('portalContent').innerHTML = renderTpAttendance();
}

/* ---------------- My Students ---------------- */
function renderTpStudents(){
  const batches = tpBatches();
  const groups = batches.map((b,idx)=>{
    const roster = activeStudentsInBatch(b.id);
    return `<div style="margin-bottom:22px;">
      <h3 class="report-section-title" ${idx===0?'style="margin-top:0;"':''}>${b.name} — ${courseName(b.course_id)} <span class="cell-sub" style="font-weight:400;">(${roster.length} students)</span></h3>
      <div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Student</th><th>Code</th><th>Phone</th><th>Attendance %</th></tr></thead><tbody>
      ${roster.length ? roster.map(s=>{
        const att = attendanceSummaryForStudent(s.id, b.id);
        return `<tr><td>${avatarHtml(s.name,'sm',s.photo)}</td><td class="cell-strong">${s.name}</td><td>${s.code}</td><td>${s.phone}</td><td>${att.pct}%</td></tr>`;
      }).join('') : `<tr><td colspan="5" class="muted" style="text-align:center;padding:16px;">No active students yet.</td></tr>`}
      </tbody></table></div></div>
    </div>`;
  }).join('');
  return groups || `<div class="empty-state">${icon('students')}<p>No batches assigned yet.</p></div>`;
}

/* ---------------- My Payments ---------------- */
function renderTpPayments(){
  const u = tpTeacher();
  const batches = tpBatches();
  const rateRows = batches.map(b=>{
    const rate = payRateFor(u.id, b.id);
    const earned = computeEarnedForTeacherBatch(u.id, b.id);
    const paid = totalPaidToTeacherForBatch(u.id, b.id);
    const outstanding = Math.max(0, earned - paid);
    return `<tr>
      <td class="cell-strong">${b.name}</td>
      <td>${courseName(b.course_id)}</td>
      <td>${rate ? PAY_RATE_TYPE_LABELS[rate.rate_type] + ' · ' + fmtMoney(rate.rate_amount) : '<span class="muted">No rate set yet</span>'}</td>
      <td>${fmtMoney(earned)}</td>
      <td style="color:var(--success-700);">${fmtMoney(paid)}</td>
      <td style="color:${outstanding>0?'var(--danger-600)':'var(--gray-400)'};">${fmtMoney(outstanding)}</td>
    </tr>`;
  }).join('');
  const myPayments = DB.teacherPayments.filter(p=>p.teacher_id===u.id).slice().reverse();
  const payRows = myPayments.map(p=>`
    <tr>
      <td class="cell-strong">${p.voucher_no}</td>
      <td>${batchName(p.batch_id)}</td>
      <td>${TEACHER_PAY_TYPE_LABELS[p.type]}</td>
      <td>${p.period_label}</td>
      <td>${fmtMoney(p.amount)}</td>
      <td>${statusBadge(p.status)}</td>
      <td>${p.status==='paid' ? `<button class="btn btn-sm btn-ghost" title="View & print voucher" data-action="tp-view-voucher" data-id="${p.id}">${icon('printer')}</button>` : ''}</td>
    </tr>`).join('');
  return `
  <h3 class="report-section-title" style="margin-top:0;">Pay Rate & Earnings by Batch</h3>
  <div class="card" style="margin-bottom:26px;"><div class="table-wrap"><table class="data-table"><thead><tr><th>Batch</th><th>Course</th><th>Pay Rate</th><th>Earned</th><th>Paid</th><th>Outstanding</th></tr></thead><tbody>${rateRows || '<tr><td colspan="6" class="muted" style="text-align:center;padding:16px;">No batches assigned.</td></tr>'}</tbody></table></div></div>
  <h3 class="report-section-title">Payment / Voucher History</h3>
  <div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Voucher</th><th>Batch</th><th>Type</th><th>Period</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${payRows || '<tr><td colspan="7" class="muted" style="text-align:center;padding:16px;">No payment requests yet.</td></tr>'}</tbody></table></div></div>`;
}

/* ---------------- Profile ---------------- */
function renderTpProfile(){
  const u = tpTeacher();
  const batches = tpBatches();
  return `
  <div class="card card-pad" style="max-width:560px;text-align:center;">
    ${profilePhotoBlockHtml(u.name, u.photo, {inputId:'tpProfilePhotoInput', previewId:'tpProfilePhotoPreview', removeAction:'tp-remove-photo'})}
    <b style="display:block;margin:12px 0 2px;font-size:15px;">${u.name}</b>
    <span class="cell-sub">${roleName(u.role_id)}</span>
    <div class="hr"></div>
    <div class="form-grid" style="text-align:left;">
      <div class="field"><label>Phone</label><div>${u.phone}</div></div>
      <div class="field"><label>Email</label><div>${u.email||'—'}</div></div>
      <div class="field span-2"><label>Assigned Batches</label><div>${batches.map(b=>b.name).join(', ') || '—'}</div></div>
    </div>
    <div class="hr"></div>
    <div class="badge badge-gray" style="white-space:normal;text-align:left;">${icon('shield')} This portal only shows your own batches, students & payments. If you need broader admin-panel access, ask an Admin to grant it from Access Control.</div>
  </div>`;
}

/* ---------------- Click delegation ---------------- */
document.addEventListener('click', function(e){
  const t = e.target.closest('[data-action]');
  if(!t) return;
  const action = t.dataset.action;
  const id = t.dataset.id ? Number(t.dataset.id) : null;
  switch(action){
    case 'tpgo':
      if(t.dataset.batchid) tpAttBatchId = Number(t.dataset.batchid);
      tpNavigate(t.dataset.tpview);
      break;
    case 'toggle-tp-nav-group':
      expandedTpGroupId = (expandedTpGroupId===t.dataset.group) ? null : t.dataset.group;
      buildTpNav();
      break;
    case 'tp-logout': tpLogout(); break;
    case 'tp-mark-attendance-cell': {
      const sid = Number(t.dataset.studentid), status = t.dataset.status;
      tpAttMarks[sid] = status;
      t.closest('tr').querySelectorAll('.btn').forEach(b=>{
        b.classList.toggle('btn-primary', b.dataset.status===status);
        b.classList.toggle('btn-secondary', b.dataset.status!==status);
      });
      break;
    }
    case 'tp-save-attendance': {
      const batchId = Number(t.dataset.batchid);
      markAttendance(batchId, tpAttDate, tpAttModuleId, tpAttMarks, TP_TEACHER_ID);
      toast('Attendance saved for '+fmtDate(tpAttDate));
      break;
    }
    case 'tp-view-voucher': teacherPaymentVoucherModal(id); break;
    case 'tp-remove-photo': setUserPhoto(TP_TEACHER_ID, null); paintAvatarEl(document.getElementById('portalAvatar'), tpTeacher().name, null); tpRefresh(); toast('Profile photo removed'); break;
  }
});

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', function(){
  populateTeacherDemoSelect();
  document.getElementById('btnTpLogin').addEventListener('click', teacherPortalLoginByPhone);
  document.getElementById('btnPortalHamburger').innerHTML = icon('menu');
  document.getElementById('btnPortalHamburger').addEventListener('click', ()=>{
    document.getElementById('portalSidebar').classList.toggle('show');
    document.getElementById('portalSidebarScrim').classList.toggle('show');
  });
  document.getElementById('portalSidebarScrim').addEventListener('click', ()=>{
    document.getElementById('portalSidebar').classList.remove('show');
    document.getElementById('portalSidebarScrim').classList.remove('show');
  });
});
