/* ============================================================
   App shell — navigation, router, global event delegation
   ============================================================ */

const NAV = [
  { id:'grp-dashboard', label:'Dashboard', ic:'dashboard', items:[
    { id:'dashboard', label:'Dashboard', ic:'dashboard', mod:null },
  ]},
  { id:'grp-crm', label:'CRM & Marketing', ic:'marketing', items:[
    { id:'institutions', label:'Institutions', ic:'institution', mod:'Institutions' },
    { id:'leads', label:'Leads', ic:'marketing', mod:'Leads/CRM', count:()=>DB.leads.length },
    { id:'pipeline', label:'Pipeline', ic:'target', mod:'Leads/CRM' },
    { id:'visits', label:'Institution Visits', ic:'institution', mod:'Leads/CRM' },
    { id:'online-sessions', label:'Online Sessions', ic:'send', mod:'Leads/CRM', count:()=>upcomingOnlineSessions().length },
    { id:'followups', label:'Follow-ups', ic:'clock', mod:'Leads/CRM', count:()=>followupsToday().length },
  ]},
  { id:'grp-courses', label:'Courses', ic:'course', items:[
    { id:'courses', label:'Departments & Courses', ic:'course', mod:'Courses' },
    { id:'sessions', label:'Sessions', ic:'calendar', mod:'Courses' },
    { id:'batches', label:'Batches & Classes', ic:'batch', mod:'Batches' },
  ]},
  { id:'grp-students', label:'Students', ic:'students', items:[
    { id:'students', label:'Student Directory', ic:'students', mod:'Students', count:()=>DB.students.length },
    { id:'enrollment-requests', label:'Enrollment Requests', ic:'students', mod:'Students', count:()=>DB.enrollmentRequests.filter(r=>r.status==='pending').length },
    { id:'attendance', label:'Attendance', ic:'attendance', mod:'Attendance' },
  ]},
  { id:'grp-finance', label:'Finance & Payments', ic:'payment', items:[
    { id:'invoices', label:'Invoices & Payments', ic:'payment', mod:'Payments' },
    { id:'collect-payment', label:'Collect Payment', ic:'payment', mod:'Payments' },
    { id:'due', label:'Due & Overdue', ic:'wallet', mod:'Payments', count:()=>DB.feeInvoices.filter(i=>i.due>0).length },
    { id:'cash-management', label:'Cash Management', ic:'building', mod:'CashManagement', count:()=>DB.cashHandovers.filter(h=>h.status==='pending').length },
    { id:'migrations', label:'Course Migration', ic:'swap', mod:'Payments' },
    { id:'refunds', label:'Refunds', ic:'wallet', mod:'Payments' },
    { id:'expenses', label:'Expenses & Vendors', ic:'expense', mod:'Expenses' },
    { id:'teacher-payments', label:'Teacher Payments', ic:'graduationCap', mod:'TeacherPayments', count:()=>pendingTeacherPaymentsCountForUser(currentUserId) },
  ]},
  { id:'grp-certificates', label:'Certificates & ID', ic:'certificate', items:[
    { id:'certificates', label:'Certificates', ic:'certificate', mod:'Certificates' },
    { id:'idcards', label:'ID Cards', ic:'idcard', mod:'Certificates' },
  ]},
  { id:'grp-reports', label:'Reports', ic:'report', items:[
    { id:'reports', label:'Reports & Analytics', ic:'report', mod:'Reports' },
  ]},
  { id:'grp-admin', label:'Administration', ic:'settings', items:[
    { id:'notifications', label:'Notifications', ic:'notification', mod:'Notifications' },
    { id:'users', label:'Users & Roles', ic:'user', mod:'Users' },
    { id:'access', label:'Access Control', ic:'shield', mod:'Users' },
    { id:'audit', label:'Audit Log', ic:'eye', mod:'Audit' },
    { id:'settings', label:'Settings', ic:'settings', mod:'Settings' },
  ]},
];

const VIEWS = {
  dashboard:   { title:'Dashboard', sub:"Welcome back, here's what's happening today", render:(role)=>renderDashboard(role) },
  leads:       { title:'Leads', sub:'Manage captured leads across the pipeline', render:renderLeads },
  pipeline:    { title:'Lead Pipeline', sub:'Funnel view of all leads by stage', render:renderPipeline },
  visits:      { title:'Institution Visits', sub:'Polytechnic visit scheduling & reports', render:renderVisits },
  'online-sessions': { title:'Online Sessions', sub:'Webinars & live sessions for polytechnic students', render:renderOnlineSessions },
  followups:   { title:'Follow-ups', sub:"Today's due follow-ups, upcoming reminders & full history", render:renderFollowups },
  institutions:{ title:'Institutions', sub:'Partner polytechnic institutes', render:renderInstitutions },
  courses:     { title:'Departments & Courses', sub:'Course catalogue, pricing & discounts', render:renderCourses },
  sessions:    { title:'Course Sessions', sub:'Sessions/terms per course — batches live inside a session', render:renderSessions },
  batches:     { title:'Batches & Classes', sub:'Batch structure, teacher assignment & timetable', render:renderBatches },
  students:    { title:'Student Directory', sub:'All registered students', render:renderStudents },
  'enrollment-requests': { title:'Enrollment Requests', sub:'Self-enrolled via portal, awaiting approval', render:renderEnrollmentRequests },
  attendance:  { title:'Attendance', sub:'Session-wise attendance marking & tracking', render:renderAttendance },
  invoices:    { title:'Invoices & Payments', sub:'Fee invoices and transaction log', render:renderInvoices },
  'collect-payment': { title:'Collect Payment', sub:'Search a student and record a walk-in / manual payment', render:renderCollectPayment },
  due:         { title:'Due & Overdue', sub:'Tabs for today, all, date-range & 7-day follow-up automation', render:renderDue },
  'cash-management': { title:'Cash Management', sub:'Bank deposits & signed handovers — daily, monthly & date-range tracking', render:renderCashManagement },
  migrations:  { title:'Course Migration', sub:'Course transfer requests & fee recalculation', render:renderMigrations },
  refunds:     { title:'Refunds', sub:'Refund requests & approval workflow', render:renderRefunds },
  expenses:    { title:'Expenses & Vendors', sub:'Cost tracking with approval workflow', render:renderExpenses },
  'teacher-payments': { title:'Teacher Payments', sub:'Per-batch pay rates, payment requests & disbursement vouchers', render:renderTeacherPayments },
  certificates:{ title:'Certificates', sub:'Auto-generated, QR-verifiable certificates', render:renderCertificates },
  idcards:     { title:'ID Cards', sub:'QR-coded student identity cards', render:renderIdCards },
  reports:     { title:'Reports & Analytics', sub:'44 reports across every module', render:renderReports },
  notifications:{ title:'Notifications & Automation', sub:'Delivery log and automation rules', render:renderNotifications },
  users:       { title:'Users & Roles', sub:'Staff accounts and role defaults', render:renderUsers },
  access:      { title:'Access Control', sub:'Per-user menu, page & data access permissions', render:renderAccessControl },
  audit:       { title:'Audit Log', sub:'System-wide activity trail', render:renderAudit },
  settings:    { title:'System Settings', sub:'Organization, session & integrations', render:renderSettings },
};

let currentView = 'dashboard';
let currentRole = 1;
let currentUserId = 1;

const ROLE_USER_MAP = { 1:1, 2:2, 3:3, 4:5, 5:6, 6:8, 8:11 };

/* Which main-menu group is currently expanded (accordion — collapsed by default, single group open at a time) */
let expandedGroupId = null;

function currentUser(){ return DB.users.find(u=>u.id===currentUserId) || DB.users[0]; }

function groupForView(viewId){ return NAV.find(g=>g.items.some(it=>it.id===viewId)); }

function buildSidebar(userId){
  const root = document.getElementById('nav-root');
  root.innerHTML = NAV.map(g=>{
    const items = g.items.filter(it => it.mod===null || effectivePerm(userId, it.mod, 'View'));
    if(!items.length) return '';
    const hasActive = items.some(it=>it.id===currentView);
    // a group with a single item (e.g. Dashboard, Reports) renders as a flat link — no accordion needed
    if(items.length===1){
      const it = items[0];
      return `<div class="nav-group">
        <div class="nav-item ${it.id===currentView?'active':''}" data-action="go-view" data-view="${it.id}">
          ${icon(it.ic)}<span>${it.label}</span>
          ${it.count ? `<span class="badge-count">${it.count()}</span>` : ''}
        </div>
      </div>`;
    }
    const expanded = expandedGroupId===g.id;
    const totalCount = items.reduce((sum,it)=> sum + (it.count ? it.count() : 0), 0);
    return `<div class="nav-group">
      <div class="nav-section ${expanded?'expanded':''}">
        <div class="nav-group-header ${hasActive?'has-active':''}" data-action="toggle-nav-group" data-group="${g.id}">
          ${icon(g.ic)}<span>${g.label}</span>
          ${totalCount ? `<span class="badge-count">${totalCount}</span>` : ''}
          ${icon('chevronRight','chev')}
        </div>
        <div class="nav-submenu">
          ${items.map(it=>`
            <div class="nav-item sub ${it.id===currentView?'active':''}" data-action="go-view" data-view="${it.id}">
              ${icon(it.ic)}
              <span>${it.label}</span>
              ${it.count ? `<span class="badge-count">${it.count()}</span>` : ''}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

function firstAllowedView(userId){
  for(const g of NAV){ for(const it of g.items){ if(it.mod===null || effectivePerm(userId, it.mod, 'View')) return it.id; } }
  return 'dashboard';
}

function navigate(viewId, opts){
  let v = VIEWS[viewId];
  // guard: if the current user doesn't have View permission for this page's module, bounce to first allowed page
  const navItem = NAV.flatMap(g=>g.items).find(it=>it.id===viewId);
  if(navItem && navItem.mod!==null && !effectivePerm(currentUserId, navItem.mod, 'View')){
    toast(`You don't have access to "${navItem.label}" — showing an allowed page instead.`, 'error');
    viewId = firstAllowedView(currentUserId);
    v = VIEWS[viewId];
  }
  if(!v) return;
  currentView = viewId;
  const grp = groupForView(viewId);
  if(grp && grp.items.length>1) expandedGroupId = grp.id;
  buildSidebar(currentUserId);
  document.getElementById('pageTitle').textContent = v.title;
  document.getElementById('pageSub').textContent = v.sub;
  document.getElementById('viewRoot').innerHTML = v.render(currentRole);
  document.getElementById('viewRoot').scrollTop = 0;
  window.scrollTo({top:0, behavior:'instant'});
  if(viewId==='settings') wireSettingsTabs();
  if(viewId==='due') wireDueTabs();
  if(viewId==='followups') wireFollowupTabs();
  if(viewId==='attendance') wireAttendancePage();
  if(viewId==='cash-management') wireCashTabs();
  if(viewId==='teacher-payments') wireTeacherPayTabs();
}

function refreshCurrentView(){ navigate(currentView); }

/* ---------------- Role switch / user identity ---------------- */
function applyIdentity(userId){
  const u = DB.users.find(x=>x.id===userId) || DB.users[0];
  currentUserId = u.id;
  currentRole = u.role_id;
  expandedGroupId = null;
  document.getElementById('roleSwitch').value = String(u.role_id);
  paintAvatarEl(document.querySelector('#userChip .avatar'), u.name, u.photo);
  document.querySelector('#userChip .who b').textContent = u.name;
  document.querySelector('#userChip .who span').textContent = roleName(u.role_id);
  if(!canAccessAdminPanel(u.id)){ renderAdminPanelBlocked(u); return; }
  navigate('dashboard');
}

/* Portal-only users (Coordinators/Teachers, by default) are blocked from the admin panel entirely and
   pointed to the dedicated Teacher Portal instead — see AdminPanelAccess in data.js / Access Control. */
function renderAdminPanelBlocked(u){
  currentView = null;
  document.getElementById('nav-root').innerHTML = '';
  document.getElementById('pageTitle').textContent = 'Access Restricted';
  document.getElementById('pageSub').textContent = 'This account only has Teacher Portal access';
  document.getElementById('viewRoot').innerHTML = `
    <div class="card card-pad" style="max-width:560px;margin:60px auto;text-align:center;">
      <div class="kpi-icon" style="width:56px;height:56px;margin:0 auto 16px;background:var(--danger-50);color:var(--danger-600);">${icon('shield')}</div>
      <h2 style="margin-bottom:8px;">Admin Panel Access Restricted</h2>
      <p class="muted" style="margin-bottom:22px;"><b>${u.name}</b> (${roleName(u.role_id)}) doesn't have permission to use this admin panel. Coordinators/Teachers use a dedicated Teacher Portal for their batches, attendance, students & payments instead. An Admin can grant this specific person full admin-panel access from <b>Access Control</b> if needed.</p>
      <a class="btn btn-primary" href="teacher-portal.html" target="_blank" rel="noopener">${icon('send')} Open Teacher Portal ↗</a>
    </div>`;
}
function applyRoleSwitch(roleId){
  currentRole = Number(roleId);
  const u = DB.users.find(x=>x.id===ROLE_USER_MAP[currentRole]) || DB.users[0];
  applyIdentity(u.id);
}
function previewAsUser(userId){
  applyIdentity(Number(userId));
  toast(`Now previewing the app as ${currentUser().name} (${roleName(currentUser().role_id)})`);
}

/* ---------------- Settings tabs ---------------- */
function wireSettingsTabs(){
  document.querySelectorAll('[data-settingstab]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-settingstab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('settingsPane').innerHTML = settingsPane(btn.dataset.settingstab);
    });
  });
}

/* ---------------- Student drawer tab switching ---------------- */
function wireDrawerTabs(){
  const tabsWrap = document.querySelector('#drawerBody .tabs[data-studentid]');
  if(!tabsWrap) return;
  const sid = Number(tabsWrap.dataset.studentid);
  tabsWrap.querySelectorAll('[data-studenttab]').forEach(btn=>{
    btn.addEventListener('click', ()=> studentProfileDrawer(sid, btn.dataset.studenttab));
  });
}

/* ---------------- Notification bell popover ---------------- */
function showNotifPopover(){
  openModal({
    title:'Notifications', sub:'Recent alerts across the system',
    body:`<div class="timeline">${DB.notifications.slice(-6).reverse().map(n=>`
      <div class="timeline-item"><div class="when">${fmtDate(n.date)} · ${n.channel.toUpperCase()}</div><div class="what">${n.recipient} — ${n.type.replace(/_/g,' ')}</div><div class="who">${n.message}</div></div>`).join('')}</div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" data-action="go-view" data-view="notifications" onclick="closeModal()">View All</button>`
  });
}

/* ============================================================
   Global click delegation — handles every data-action in the app
   ============================================================ */
document.addEventListener('click', function(e){
  const t = e.target.closest('[data-action]');
  if(!t) return;
  const action = t.dataset.action;
  const id = t.dataset.id ? Number(t.dataset.id) : null;

  switch(action){
    /* ---- navigation ---- */
    case 'go-view': navigate(t.dataset.view); break;
    case 'toggle-nav-group': {
      const gid = t.dataset.group;
      expandedGroupId = (expandedGroupId===gid) ? null : gid;
      buildSidebar(currentUserId);
      break;
    }

    /* ---- leads / CRM ---- */
    case 'view-lead': closeModal(); leadDetailDrawer(id); break;
    case 'open-add-lead': addLeadModal(); break;
    case 'save-lead': {
      const name = document.getElementById('alName')?.value.trim();
      const phone = document.getElementById('alPhone')?.value.trim();
      if(!name || !phone){ toast('Name and phone are required', 'error'); break; }
      const source = document.getElementById('alSource')?.value || 'walk-in';
      const lead = {
        id: nextId(DB.leads), name, phone, email: document.getElementById('alEmail')?.value.trim()||null,
        institution_id: Number(document.getElementById('alInstitution')?.value)||null,
        source, source_session_id: source==='online_session' ? (Number(document.getElementById('alSourceSession')?.value)||null) : null,
        interested_course_id: Number(document.getElementById('alCourse')?.value)||null,
        status: document.getElementById('alStatus')?.value || 'new',
        assigned_to: Number(document.getElementById('alAssignTo')?.value) || currentUserId,
        created_at: TODAY
      };
      DB.leads.push(lead);
      closeModal(); toast('Lead saved successfully'); refreshCurrentView();
      break;
    }
    /* ---- bulk lead import wizard ---- */
    case 'open-lead-import':
      if(!effectivePerm(currentUserId,'Leads/CRM','Create')){ toast("You don't have permission to add leads", 'error'); break; }
      openLeadImport();
      break;
    case 'li-use-paste': {
      const text = document.getElementById('liPasteBox')?.value || '';
      if(!text.trim()){ toast('Paste some rows first', 'error'); break; }
      liLoadText(text, 'Pasted data');
      break;
    }
    case 'li-download-template': liDownloadTemplate(); break;
    case 'li-back-to-upload': if(LeadImportState){ LeadImportState.step = 1; renderLeadImportModal(); } break;
    case 'li-back-to-mapping': if(LeadImportState){ LeadImportState.step = 2; renderLeadImportModal(); } break;
    case 'li-goto-preview': liGotoPreview(); break;
    case 'li-select-valid': liSetSelection('valid'); break;
    case 'li-select-none': liSetSelection('none'); break;
    case 'li-commit': liCommitImport(); break;

    case 'open-contact-log': contactLogModal(id, t.dataset.status); break;
    case 'open-complete-followup': {
      const f = DB.followUps.find(x=>x.id===id);
      if(!f){ toast('Follow-up not found', 'error'); break; }
      if(f.lead_id){ contactLogModal(f.lead_id, null, f.id); }
      else { markFollowupDone(f.id, currentUserId); toast('Follow-up marked done'); refreshCurrentView(); }
      break;
    }
    case 'save-contact-log': {
      const leadId = Number(t.dataset.id);
      const notes = document.getElementById('clNotes')?.value.trim();
      if(!notes){ toast('Please describe what was discussed', 'error'); break; }
      const newStatus = document.getElementById('clStatus')?.value;
      const lostReason = document.getElementById('clLostReason')?.value.trim();
      logLeadContact(leadId, {
        type: document.getElementById('clType')?.value, notes,
        outcome: document.getElementById('clOutcome')?.value.trim(),
        contactedBy: currentUserId, newStatus, lostReason,
        nextFollowupDate: document.getElementById('clFollowupDate')?.value,
        nextFollowupTime: document.getElementById('clFollowupTime')?.value,
        nextFollowupNote: document.getElementById('clFollowupNote')?.value.trim(),
      });
      const fuId = t.dataset.followupid ? Number(t.dataset.followupid) : null;
      if(fuId) markFollowupDone(fuId, currentUserId);
      closeModal(); toast('Contact logged'+(newStatus?` — stage updated to "${LEAD_STATUS_LABELS[newStatus]}"`:'')+(fuId?' — follow-up marked done':''));
      if(fuId) refreshCurrentView(); else { leadDetailDrawer(leadId); refreshCurrentView(); }
      break;
    }
    case 'open-schedule-followup': closeDrawer(); scheduleFollowupModal(t.dataset.id); break;
    case 'save-schedule-followup': {
      const leadId = Number(t.dataset.id);
      const date = document.getElementById('sfDate')?.value;
      if(!date){ toast('Pick a due date', 'error'); break; }
      scheduleFollowup(leadId, date, document.getElementById('sfTime')?.value, Number(document.getElementById('sfAssignee')?.value), document.getElementById('sfNotes')?.value.trim());
      closeModal(); toast('Follow-up scheduled'); leadDetailDrawer(leadId); refreshCurrentView();
      break;
    }
    case 'open-add-followup-generic':
      openModal({ title:'Schedule Follow-up', sub:'Set a reminder for call, SMS, email or in-person visit', body:`
        <div class="form-grid"><div class="field span-2"><label>Lead *</label><select id="gfLead">${DB.leads.map(l=>`<option value="${l.id}">${l.name} — ${LEAD_STATUS_LABELS[l.status]}</option>`).join('')}</select></div>
        <div class="field"><label>Due Date *</label><input type="date" id="gfDate"></div><div class="field"><label>Due Time</label><input type="time" id="gfTime" value="10:00"></div>
        <div class="field span-2"><label>Assign To</label><select id="gfAssignee">${DB.users.filter(u=>u.role_id===3).map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
        <div class="field span-2"><label>Notes</label><textarea id="gfNotes"></textarea></div></div>`,
        foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-followup-generic">${icon('check')} Schedule</button>` });
      break;
    case 'save-followup-generic': {
      const leadId = Number(document.getElementById('gfLead')?.value);
      const date = document.getElementById('gfDate')?.value;
      if(!leadId || !date){ toast('Lead and due date are required', 'error'); break; }
      scheduleFollowup(leadId, date, document.getElementById('gfTime')?.value, Number(document.getElementById('gfAssignee')?.value), document.getElementById('gfNotes')?.value.trim());
      closeModal(); toast('Follow-up scheduled'); refreshCurrentView();
      break;
    }
    case 'open-add-visit': addVisitModal(); break;
    case 'save-visit': closeModal(); toast('Visit report saved'); refreshCurrentView(); break;

    /* ---- online sessions / webinars ---- */
    case 'open-add-online-session': addOnlineSessionModal(); break;
    case 'save-online-session': {
      const title = document.getElementById('osTitle')?.value.trim();
      const date = document.getElementById('osDate')?.value;
      if(!title || !date){ toast('Title and date are required', 'error'); break; }
      DB.onlineSessions.push({
        id: nextId(DB.onlineSessions), title, institution_id: Number(document.getElementById('osInstitution')?.value)||null,
        platform: document.getElementById('osPlatform')?.value, host_id: Number(document.getElementById('osHost')?.value),
        date, time: document.getElementById('osTime')?.value, duration_mins: Number(document.getElementById('osDuration')?.value)||60,
        meeting_link: document.getElementById('osLink')?.value.trim()||null, status:'scheduled', registered_count:0, attended_count:0, leads_generated:0, notes:''
      });
      closeModal(); toast('Online session scheduled'); refreshCurrentView();
      break;
    }
    case 'open-complete-online-session': completeOnlineSessionModal(id); break;
    case 'save-complete-online-session': {
      completeOnlineSession(id, { attendedCount: document.getElementById('osAttended')?.value, leadsGenerated: document.getElementById('osLeads')?.value, notes: document.getElementById('osCompleteNotes')?.value.trim() });
      closeModal(); toast('Session marked completed'); refreshCurrentView();
      break;
    }
    case 'cancel-online-session': { const s = DB.onlineSessions.find(x=>x.id===id); if(s){ s.status='cancelled'; toast('Session cancelled', 'error'); refreshCurrentView(); } break; }

    /* ---- institutions ---- */
    case 'view-institution': institutionDetailDrawer(id); break;
    case 'open-add-institution': addInstitutionModal(); break;
    case 'save-institution': closeModal(); toast('Institution added'); refreshCurrentView(); break;

    /* ---- courses / departments ---- */
    case 'view-course': courseDetailModal(id); break;
    case 'open-add-course': addCourseModal(); break;
    case 'save-course': {
      const name = document.getElementById('ncName')?.value.trim();
      if(!name){ toast('Course name is required', 'error'); break; }
      const rows = moduleRowsFromDom('newCourseModuleRows').filter(r=>r.title);
      let nextId = nextModuleId();
      const modules = rows.map((r,i)=>({ id: nextId++, title:r.title, hours:r.hours, seq:i+1 }));
      const discType = document.getElementById('ncDiscType')?.value;
      const discounts = (discType && discType!=='none') ? [{
        type:discType, value:Number(document.getElementById('ncDiscValue')?.value)||0,
        reason:document.getElementById('ncDiscReason')?.value.trim()||'Admin-defined discount', from:'2026-01-01', to:'2026-12-31'
      }] : [];
      DB.courses.push({
        id: nextCourseId(), dept_id: Number(document.getElementById('ncDept')?.value)||DB.departments[0].id,
        name, code: document.getElementById('ncCode')?.value.trim() || ('NEW-'+Date.now()),
        duration_days: Number(document.getElementById('ncDuration')?.value)||60,
        base_price: Number(document.getElementById('ncPrice')?.value)||0,
        status: document.getElementById('ncStatus')?.value||'draft',
        seats: Number(document.getElementById('ncSeats')?.value)||30, enrolled:0,
        desc: document.getElementById('ncDesc')?.value.trim()||'', modules, discounts,
      });
      closeModal(); toast('Course created successfully'); refreshCurrentView();
      break;
    }
    case 'open-add-department': addDepartmentModal(); break;
    case 'save-department': closeModal(); toast('Department created'); refreshCurrentView(); break;

    /* ---- curriculum modules (Manage Curriculum on an existing course + "Add New Course" builder share these rows) ---- */
    case 'add-module-row': { const cid=t.dataset.container; const rows=moduleRowsFromDom(cid); rows.push({id:null,title:'',hours:''}); renderModuleRows(cid,rows); break; }
    case 'remove-module-row': { const cid=t.dataset.container; const rows=moduleRowsFromDom(cid); rows.splice(Number(t.dataset.idx),1); renderModuleRows(cid,rows); break; }
    case 'move-module-row': {
      const cid=t.dataset.container; const rows=moduleRowsFromDom(cid); const i=Number(t.dataset.idx);
      const j = t.dataset.dir==='up' ? i-1 : i+1;
      if(j>=0 && j<rows.length){ [rows[i],rows[j]]=[rows[j],rows[i]]; renderModuleRows(cid,rows); }
      break;
    }
    case 'open-manage-curriculum': closeModal(); curriculumModal(id); break;
    case 'save-curriculum': {
      const course = DB.courses.find(c=>c.id===id); if(!course) break;
      const rows = moduleRowsFromDom('curriculumRows').filter(r=>r.title);
      let nextId = nextModuleId();
      course.modules = rows.map((r,i)=>({ id: r.id || (nextId++), title:r.title, hours:r.hours, seq:i+1 }));
      closeModal(); toast('Curriculum updated — students will see it on their portal immediately');
      courseDetailModal(id);
      break;
    }
    case 'open-edit-course': closeModal(); editCourseModal(id); break;
    case 'save-course-edit': {
      const c = DB.courses.find(x=>x.id===id); if(!c) break;
      const name = document.getElementById('ecName')?.value.trim();
      if(!name){ toast('Course name is required', 'error'); break; }
      c.name = name;
      c.code = document.getElementById('ecCode')?.value.trim() || c.code;
      c.dept_id = Number(document.getElementById('ecDept')?.value) || c.dept_id;
      c.duration_days = Number(document.getElementById('ecDuration')?.value) || c.duration_days;
      c.base_price = Number(document.getElementById('ecPrice')?.value) || c.base_price;
      c.seats = Number(document.getElementById('ecSeats')?.value) || c.seats;
      c.status = document.getElementById('ecStatus')?.value || c.status;
      c.desc = document.getElementById('ecDesc')?.value.trim() || c.desc;
      closeModal(); toast('Course details updated'); courseDetailModal(id);
      break;
    }

    /* ---- course sessions ---- */
    case 'view-session': sessionDetailModal(id); break;
    case 'open-add-session': closeModal(); addSessionModal(t.dataset.courseid); break;
    case 'save-session': closeModal(); toast('Session created — you can now add batches inside it'); refreshCurrentView(); break;

    /* ---- labs / classrooms ---- */
    case 'open-add-lab': addLabModal(); break;
    case 'save-lab': {
      const name = document.getElementById('nlName')?.value.trim();
      const capacity = Number(document.getElementById('nlCapacity')?.value);
      if(!name || !capacity || capacity<1){ toast('Lab name and a valid capacity are required', 'error'); break; }
      createLab({ name, capacity, location: document.getElementById('nlLocation')?.value.trim(), notes: document.getElementById('nlNotes')?.value.trim() });
      closeModal(); toast('Lab created — it can now be assigned to batches'); refreshCurrentView();
      break;
    }
    case 'open-edit-lab': editLabModal(id); break;
    case 'save-lab-edit': {
      const capacity = Number(document.getElementById('elCapacity')?.value);
      if(!capacity || capacity<1){ toast('Capacity must be at least 1', 'error'); break; }
      updateLab(id, { name: document.getElementById('elName')?.value, capacity, location: document.getElementById('elLocation')?.value, notes: document.getElementById('elNotes')?.value, status: document.getElementById('elStatus')?.value });
      closeModal(); toast('Lab updated'); refreshCurrentView();
      break;
    }

    /* ---- batches & teacher assignment ---- */
    case 'view-batch': batchDetailModal(id); break;
    case 'open-add-batch': closeModal(); addBatchModal(t.dataset.sessionid); break;
    case 'save-batch': {
      const sessionId = Number(document.getElementById('nbSession')?.value);
      const name = document.getElementById('nbName')?.value.trim();
      const labId = document.getElementById('nbLab')?.value;
      const capacity = Number(document.getElementById('nbCapacity')?.value);
      const start = document.getElementById('nbStart')?.value, end = document.getElementById('nbEnd')?.value;
      if(!sessionId || !name || !labId || !capacity || !start || !end){ toast('Session, batch name, lab, capacity & dates are all required', 'error'); break; }
      const session = DB.sessions.find(s=>s.id===sessionId);
      const teachers = [...document.querySelectorAll('.nbTeacherCb:checked')].map(cb=>Number(cb.value));
      const { batch, clamped } = createBatch({
        sessionId, courseId: session?.course_id, name, capacity, start, end,
        coordinatorId: document.getElementById('nbCoordinator')?.value,
        labId, assignedTeachers: teachers, status: document.getElementById('nbStatus')?.value
      });
      closeModal();
      toast(clamped ? `Batch created — capacity clamped to ${batch.capacity} (${labName(batch.lab_id)}'s limit)` : 'Batch created');
      refreshCurrentView();
      break;
    }
    case 'open-edit-batch': editBatchModal(id); break;
    case 'save-batch-edit': {
      const b = DB.batches.find(x=>x.id===id); if(!b) break;
      const name = document.getElementById('ebName')?.value.trim();
      const labId = Number(document.getElementById('ebLab')?.value);
      const capacity = Number(document.getElementById('ebCapacity')?.value);
      if(!name || !labId || !capacity){ toast('Batch name, lab & capacity are required', 'error'); break; }
      const lab = labById(labId);
      const currentlyEnrolled = batchEnrolledCount(b.id);
      const cap = lab ? Math.min(capacity, lab.capacity) : capacity;
      if(cap < currentlyEnrolled) toast(`Note: capacity (${cap}) is now below the ${currentlyEnrolled} students already enrolled — no new seats will open until enrollment drops.`, 'error');
      b.name = name; b.lab_id = lab ? lab.id : b.lab_id; b.capacity = cap;
      if(effectivePerm(currentUserId,'Batches','ChangeStatus')) b.status = document.getElementById('ebStatus')?.value || b.status;
      b.start = document.getElementById('ebStart')?.value || b.start;
      b.end = document.getElementById('ebEnd')?.value || b.end;
      b.coordinator_id = Number(document.getElementById('ebCoordinator')?.value) || b.coordinator_id;
      closeModal(); toast('Batch updated'); refreshCurrentView();
      break;
    }
    case 'open-manage-teachers': manageTeachersModal(id); break;
    case 'toggle-batch-teacher': {
      const batchId = Number(t.dataset.batchid), teacherId = Number(t.dataset.teacherid);
      if(t.checked) assignTeacherToBatch(batchId, teacherId); else unassignTeacherFromBatch(batchId, teacherId);
      break;
    }
    case 'save-teacher-assignment': closeModal(); toast('Teacher assignment updated'); refreshCurrentView(); break;

    /* ---- students ---- */
    case 'view-student': closeDrawer(); closeModal(); studentProfileDrawer(id); break;
    case 'open-add-student': addStudentModal(); break;
    case 'save-student': {
      const name = document.getElementById('stName')?.value.trim();
      const phone = document.getElementById('stPhone')?.value.trim();
      const courseId = document.getElementById('stCourse')?.value;
      const batchId = document.getElementById('stBatch')?.value;
      if(!name || !phone || !courseId || !batchId){ toast('Name, phone, course & batch are all required', 'error'); break; }
      const cap = canEnrollInBatch(batchId);
      if(!cap.ok){ toast(cap.reason, 'error'); break; }
      registerStudentWithEnrollment({
        name, phone, courseId, batchId,
        dob: document.getElementById('stDob')?.value, gender: document.getElementById('stGender')?.value,
        nid: document.getElementById('stNid')?.value.trim(), email: document.getElementById('stEmail')?.value.trim(),
        presentAddress: document.getElementById('stPresentAddr')?.value.trim(), permanentAddress: document.getElementById('stPermAddr')?.value.trim(),
        institutionId: document.getElementById('stInstitution')?.value, roll: document.getElementById('stRoll')?.value.trim(),
        guardianName: document.getElementById('stGuardianName')?.value.trim(), guardianPhone: document.getElementById('stGuardianPhone')?.value.trim(),
      });
      closeModal(); toast('Student registered successfully — enrolled in one primary course & batch'); refreshCurrentView();
      break;
    }
    case 'open-edit-student': toast('Edit form would open here (demo)'); break;
    case 'open-add-additional-course': closeDrawer(); addAdditionalCourseModal(t.dataset.id); break;
    case 'approve-enrollment-request': {
      const req = DB.enrollmentRequests.find(r=>r.id===id);
      const cap = req ? canEnrollInBatch(req.batch_id) : { ok:false, reason:'Request not found.' };
      if(!cap.ok){ toast('Cannot approve — ' + cap.reason, 'error'); break; }
      const inv = approveEnrollmentRequest(id, currentUserId); if(inv) toast(`Enrollment approved — invoice ${inv.invoice_no} created, due ${fmtMoney(inv.due)}`); refreshCurrentView(); break;
    }
    case 'reject-enrollment-request': { rejectEnrollmentRequest(id, currentUserId, null); toast('Enrollment request rejected', 'error'); refreshCurrentView(); break; }
    case 'save-additional-course': {
      const sid = Number(t.dataset.studentid);
      const s = studentById(sid);
      const sel = document.getElementById('addlCourseSelect');
      const reason = document.getElementById('addlCourseReason')?.value || 'Admin override — see history for details.';
      if(s && sel){
        const opt = sel.selectedOptions[0];
        const batchId = Number(opt.dataset.batchid);
        const cap = canEnrollInBatch(batchId);
        if(!cap.ok){ toast(cap.reason, 'error'); break; }
        s.courses.push({ course_id:Number(opt.dataset.courseid), batch_id:batchId, enrolled_price:Number(opt.dataset.price), discount:0, date:'2026-08-06', status:'active', type:'additional', added_by: currentUserId, added_reason: reason, added_date:'2026-08-06' });
      }
      closeModal(); toast('Additional course added — tagged for history/reporting'); studentProfileDrawer(sid,'courses');
      break;
    }
    case 'mark-attendance-cell': {
      const sid = Number(t.dataset.studentid), status = t.dataset.status;
      currentAttMarks[sid] = status;
      t.closest('tr').querySelectorAll('.btn').forEach(b=>{
        b.classList.toggle('btn-primary', b.dataset.status===status);
        b.classList.toggle('btn-secondary', b.dataset.status!==status);
      });
      break;
    }
    case 'save-attendance': {
      const batchId = Number(t.dataset.batchid), date = t.dataset.date, moduleId = t.dataset.moduleid ? Number(t.dataset.moduleid) : null;
      markAttendance(batchId, date, moduleId, currentAttMarks, currentUserId);
      toast('Attendance saved for '+fmtDate(date));
      refreshCurrentView();
      break;
    }
    case 'goto-attendance-batch': {
      currentAttBatchId = id;
      navigate('attendance');
      setTimeout(()=>{ document.querySelector('[data-atttab="batch"]')?.click(); }, 0);
      break;
    }
    case 'issue-idcard': closeDrawer(); toast('ID card generated & queued for printing'); break;

    /* ---- payments / finance ---- */
    case 'view-invoice': invoiceDetailModal(id); break;
    case 'open-record-payment': closeModal(); recordPaymentModal(t.dataset.studentid); break;
    case 'save-payment': {
      const sid = Number(document.getElementById('rpStudentSelect')?.value || t.dataset.studentid);
      const amount = Number(document.getElementById('rpAmount')?.value || 0);
      const method = (document.getElementById('rpMethod')?.value || 'Cash').toLowerCase();
      const channel = document.getElementById('rpChannel')?.value || 'physical';
      const inv = invoiceForStudent(sid);
      closeModal();
      if(inv && amount>0){
        const payment = recordPayment(sid, inv.id, amount, method, channel, currentUserId);
        toast('Payment recorded & receipt generated');
        refreshCurrentView();
        receiptPreviewModal(payment.id);
      } else {
        toast('Could not record payment — check the amount', 'error');
        refreshCurrentView();
      }
      break;
    }
    case 'open-apply-discount': applyDiscountModal(t.dataset.id); break;
    case 'save-discount': {
      const invId = Number(t.dataset.id);
      const amt = Number(document.getElementById('discAmount')?.value || 0);
      const reason = document.getElementById('discReason')?.value || 'Discount approved';
      closeModal();
      if(amt>0){ applyDiscountToInvoice(invId, amt, reason, currentUserId); toast('Discount applied to invoice'); } else { toast('Enter a valid discount amount', 'error'); }
      refreshCurrentView();
      break;
    }
    case 'send-reminder': toast('Due payment reminder sent via SMS & Email'); break;

    /* ---- cash management (bank deposits & signed handovers) ---- */
    case 'open-cash-handover': cashHandoverModal(t.dataset.type); break;
    case 'save-cash-handover': {
      const type = t.dataset.type;
      const ids = (t.dataset.ids||'').split(',').filter(Boolean).map(Number);
      if(!ids.length){ toast('No cash receipts available to bundle', 'error'); break; }
      let entry;
      if(type==='bank_deposit'){
        const bankName = document.getElementById('chBankName')?.value.trim();
        const slipNo = document.getElementById('chSlipNo')?.value.trim();
        if(!bankName || !slipNo){ toast('Bank name and deposit slip number are required', 'error'); break; }
        entry = createCashHandover({ type, paymentIds: ids, createdBy: currentUserId, bankName, accountNo: document.getElementById('chAccountNo')?.value.trim(), branch: document.getElementById('chBranch')?.value.trim(), slipNo, notes: document.getElementById('chNotes')?.value.trim(), attachment: pendingCashAttachment });
        toast('Bank deposit recorded');
      } else {
        const handedTo = Number(document.getElementById('chHandedTo')?.value);
        if(!handedTo){ toast('Select who is receiving the cash', 'error'); break; }
        entry = createCashHandover({ type, paymentIds: ids, createdBy: currentUserId, handedTo, notes: document.getElementById('chNotes')?.value.trim(), attachment: pendingCashAttachment });
        toast('Handover saved — awaiting recipient signature');
      }
      pendingCashAttachment = null;
      closeModal();
      refreshCurrentView();
      cashHandoverReceiptModal(entry.id);
      break;
    }
    case 'remove-cash-attachment': pendingCashAttachment = null; renderCashAttachmentPreview('cashAttachPreviewWrap'); { const inp=document.getElementById('chAttachmentInput'); if(inp) inp.value=''; } break;
    case 'view-cash-attachment': viewCashAttachmentModal(id); break;
    case 'view-cash-receipt': cashHandoverReceiptModal(id); break;
    case 'open-confirm-cash-handover': confirmCashHandoverModal(id); break;
    case 'save-confirm-cash-handover': {
      const hid = Number(t.dataset.id);
      const sig = document.getElementById('ccSignature')?.value.trim();
      if(!sig){ toast('Please type your full name to sign', 'error'); break; }
      confirmCashHandover(hid, currentUserId, sig);
      closeModal(); toast('Handover confirmed & signed'); refreshCurrentView();
      cashHandoverReceiptModal(hid);
      break;
    }
    case 'resend-followup-sms': { resendFollowupSms(id); toast('Reminder SMS re-sent to student'); if(document.getElementById('duePane')) document.getElementById('duePane').innerHTML = duePane('followup'); break; }
    case 'view-receipt': receiptPreviewModal(id); break;
    case 'open-migration': closeDrawer(); migrationRequestModal(t.dataset.id || t.dataset.studentid); break;
    case 'save-migration': closeModal(); toast('Migration request submitted for approval'); refreshCurrentView(); break;
    case 'approve-migration': { const m = DB.courseMigrations.find(x=>x.id===id); if(m){ m.status='approved'; m.approved_by=2; toast('Migration approved'); refreshCurrentView(); } break; }
    case 'reject-migration': { const m = DB.courseMigrations.find(x=>x.id===id); if(m){ m.status='rejected'; toast('Migration rejected', 'error'); refreshCurrentView(); } break; }
    case 'open-add-refund': addRefundModal(); break;
    case 'save-refund': closeModal(); toast('Refund request submitted'); refreshCurrentView(); break;
    case 'approve-refund': { const r = DB.refunds.find(x=>x.id===id); if(r){ r.status='approved'; r.approved_by=2; toast('Refund approved'); refreshCurrentView(); } break; }
    case 'open-add-expense': addExpenseModal(); break;
    case 'save-expense': closeModal(); toast('Expense logged, pending approval'); refreshCurrentView(); break;
    case 'approve-expense': { const ex = DB.expenses.find(x=>x.id===id); if(ex){ ex.status='approved'; ex.approved_by=2; toast('Expense approved'); refreshCurrentView(); } break; }

    /* ---- teacher payments (per-batch pay rates, requests, approval & disbursement) ---- */
    case 'open-set-payrate': setPayRateModal(t.dataset.teacherid, t.dataset.batchid); break;
    case 'save-payrate': {
      const teacherId = Number(t.dataset.teacherid), batchId = Number(t.dataset.batchid);
      const rateType = document.getElementById('tpRateType')?.value;
      const rateAmount = Number(document.getElementById('tpRateAmount')?.value) || 0;
      if(rateAmount<=0){ toast('Enter a valid rate amount', 'error'); break; }
      setPayRate(teacherId, batchId, rateType, rateAmount, document.getElementById('tpRateNotes')?.value.trim());
      closeModal(); toast('Pay rate saved'); refreshCurrentView();
      break;
    }
    case 'open-raise-teacher-payment': raiseTeacherPaymentModal(t.dataset.teacherid, t.dataset.batchid); break;
    case 'save-teacher-payment': {
      const teacherId = Number(t.dataset.teacherid), batchId = Number(t.dataset.batchid);
      const amount = Number(document.getElementById('tpAmount')?.value) || 0;
      const periodLabel = document.getElementById('tpPeriodLabel')?.value.trim();
      if(amount<=0 || !periodLabel){ toast('Amount and period/description are required', 'error'); break; }
      requestTeacherPayment({ teacherId, batchId, type: document.getElementById('tpPayType')?.value, periodLabel, amount, computedAmount: Number(t.dataset.computed)||0, notes: document.getElementById('tpNotes')?.value.trim(), requestedBy: currentUserId });
      closeModal(); toast('Payment request submitted for approval'); refreshCurrentView();
      break;
    }
    case 'approve-teacher-payment': { const p = approveTeacherPayment(id, currentUserId); if(p) toast(`${p.voucher_no} approved — ready for disbursement`); refreshCurrentView(); break; }
    case 'open-reject-teacher-payment': rejectTeacherPaymentModal(id); break;
    case 'save-reject-teacher-payment': {
      const reason = document.getElementById('tpRejectReason')?.value.trim();
      if(!reason){ toast('Please provide a reason', 'error'); break; }
      rejectTeacherPayment(id, currentUserId, reason);
      closeModal(); toast('Payment request rejected', 'error'); refreshCurrentView();
      break;
    }
    case 'open-pay-teacher-payment': markPaidModal(id); break;
    case 'save-pay-teacher-payment': {
      const method = document.getElementById('tpPayMethod')?.value;
      const txnRef = document.getElementById('tpTxnRef')?.value.trim();
      const p = markTeacherPaymentPaid(id, { paidBy: currentUserId, method, txnRef });
      closeModal();
      if(p){ toast('Payment disbursed & voucher generated'); refreshCurrentView(); teacherPaymentVoucherModal(p.id); }
      break;
    }
    case 'view-teacher-payment': teacherPaymentVoucherModal(id); break;

    /* ---- certificates / id cards ---- */
    case 'open-cert-template': certTemplateModal(); break;
    case 'preview-certificate': certificatePreviewModal(id); break;
    case 'issue-certificate': { const c = DB.certificates.find(x=>x.id===id); if(c){ c.status='issued'; c.cert_no='MT-CERT-2026-0'+(100+id); c.issue_date='2026-08-06'; toast('Certificate issued & sent to student portal'); refreshCurrentView(); } break; }
    case 'open-idcard-template':
      openModal({size:'lg', title:'ID Card Template', sub:'Layout builder (visual placeholder)',
        body:`<div style="display:flex;justify-content:center;">${idCardPreview({name:'[[Student Name]]', code:'[[Code]]', courses:[{course_id:1}]}, {valid_till:'2026-12-31'})}</div>`,
        foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary">${icon('check')} Save Template</button>`});
      break;
    case 'preview-idcard': idCardPreviewModal(id); break;

    /* ---- reports ---- */
    case 'open-report': openReportModal(id); break;
    case 'open-locked-report': toast("You don't have access to this report — ask an Admin to grant it from Access Control", 'error'); break;

    /* ---- My Profile (topbar user-chip) ---- */
    case 'open-my-profile': myProfileModal(currentUserId); break;
    case 'remove-my-profile-photo': {
      setUserPhoto(currentUserId, null);
      const u = DB.users.find(x=>x.id===currentUserId);
      paintAvatarEl(document.querySelector('#userChip .avatar'), u.name, null);
      myProfileModal(currentUserId);
      refreshCurrentView();
      toast('Profile photo removed');
      break;
    }

    /* ---- notifications ---- */
    case 'open-send-notification':
      openModal({ title:'Send Manual Notification', sub:'Send SMS/Email/Portal message to student(s)', body:`
        <div class="form-grid"><div class="field span-2"><label>Recipients</label><select><option>All Active Students</option><option>Specific Student</option><option>Specific Batch</option><option>Overdue Payment Students</option></select></div>
        <div class="field"><label>Channel</label><select><option>SMS</option><option>Email</option><option>Portal</option><option>All</option></select></div>
        <div class="field"><label>Template</label><select>${DB.notificationRules.map(r=>`<option>${r.trigger.replace(/_/g,' ')}</option>`).join('')}<option>Custom Message</option></select></div>
        <div class="field span-2"><label>Message</label><textarea placeholder="Type your message..."></textarea></div></div>`,
        foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="closeModal();toast('Notification sent')">${icon('send')} Send Now</button>` });
      break;
    case 'toggle-rule': { const r = DB.notificationRules.find(x=>x.id===id); if(r){ r.active = t.checked; toast(`Rule ${r.active?'activated':'deactivated'}`); } break; }

    /* ---- users / roles / RBAC (role-level defaults) ---- */
    case 'open-add-user': addUserModal(); break;
    case 'save-user': closeModal(); toast('User created & credentials sent'); refreshCurrentView(); break;
    case 'open-edit-user': toast('Edit user form would open here (demo)'); break;
    case 'toggle-user-status': { const u = DB.users.find(x=>x.id===id); if(u){ u.status = u.status==='active'?'inactive':'active'; toast(`User ${u.status==='active'?'activated':'deactivated'}`); refreshCurrentView(); } break; }
    case 'open-add-role': addRoleModal(); break;
    case 'save-role': closeModal(); toast('Role created'); refreshCurrentView(); break;
    case 'view-role-matrix': roleMatrixModal(id); break;
    case 'toggle-perm': {
      const role = t.dataset.role, mod = t.dataset.mod, act = t.dataset.act;
      DB.rolePermMatrix[role][mod][act] = t.checked;
      break;
    }
    case 'goto-access-for-user': navigate('access'); setTimeout(()=>{ const sel=document.getElementById('acUserSelect'); if(sel){ sel.value=id; sel.dispatchEvent(new Event('change')); } }, 0); break;

    /* ---- Access Control (per-user overrides) ---- */
    case 'ac-select-user': renderAccessControlBody(Number(t.value)); break;
    case 'toggle-user-perm': {
      const uid = Number(t.dataset.userid), mod = t.dataset.mod, act = t.dataset.act;
      setUserPermOverride(uid, mod, act, t.checked);
      if(uid===currentUserId) buildSidebar(currentUserId);
      break;
    }
    case 'reset-user-perms': {
      const uid = Number(t.dataset.userid);
      clearUserPermOverrides(uid);
      toast('Reset to role defaults for this user');
      renderAccessControlBody(uid);
      if(uid===currentUserId) buildSidebar(currentUserId);
      break;
    }
    case 'toggle-user-batch-scope': {
      const uid = Number(t.dataset.userid), batchId = Number(t.dataset.batchid);
      if(t.checked) assignTeacherToBatch(batchId, uid); else unassignTeacherFromBatch(batchId, uid);
      break;
    }
    case 'preview-as-user': previewAsUser(id); break;

    /* ---- Report Access permissions ---- */
    case 'toggle-role-report-perm': {
      const role = t.dataset.role;
      DB.rolePermMatrix[role]["Reports"]["Report_"+t.dataset.reportid] = t.checked;
      break;
    }
    case 'toggle-user-report-perm': {
      const uid = Number(t.dataset.userid);
      setUserPermOverride(uid, "Reports", "Report_"+t.dataset.reportid, t.checked);
      break;
    }

    /* ---- List / Data Visibility permissions ---- */
    case 'toggle-role-list-perm': {
      const role = t.dataset.role, mod = t.dataset.mod;
      DB.rolePermMatrix[role][mod]["List_"+t.dataset.key] = t.checked;
      break;
    }
    case 'toggle-user-list-perm': {
      const uid = Number(t.dataset.userid), mod = t.dataset.mod;
      setUserPermOverride(uid, mod, "List_"+t.dataset.key, t.checked);
      break;
    }

    /* ---- Admin Panel Access (teacher portal gating) ---- */
    case 'toggle-user-adminpanel-access': {
      const uid = Number(t.dataset.userid);
      setUserPermOverride(uid, "Users", "AdminPanelAccess", t.checked);
      toast(t.checked ? 'Admin panel access granted' : 'Admin panel access revoked — user will use the Teacher Portal instead');
      renderAccessControlBody(uid);
      break;
    }

    /* ---- Manual status-change (gated by the ChangeStatus permission) ---- */
    case 'open-change-student-status': {
      if(!effectivePerm(currentUserId,'Students','ChangeStatus')){ toast("You don't have permission to change student status", 'error'); break; }
      changeStudentStatusModal(id); break;
    }
    case 'save-change-student-status': {
      if(!effectivePerm(currentUserId,'Students','ChangeStatus')){ toast("You don't have permission to change student status", 'error'); break; }
      const newStatus = document.getElementById('csNewStatus')?.value;
      const reason = document.getElementById('csReason')?.value.trim();
      changeStudentStatus(id, newStatus, reason, currentUserId);
      closeModal(); toast('Student status updated'); refreshCurrentView();
      break;
    }
    case 'open-change-invoice-status': {
      if(!effectivePerm(currentUserId,'Payments','ChangeStatus')){ toast("You don't have permission to change payment status", 'error'); break; }
      changeInvoiceStatusModal(id); break;
    }
    case 'save-change-invoice-status': {
      if(!effectivePerm(currentUserId,'Payments','ChangeStatus')){ toast("You don't have permission to change payment status", 'error'); break; }
      const newStatus = document.getElementById('cisNewStatus')?.value;
      const reason = document.getElementById('cisReason')?.value.trim();
      if(!reason){ toast('Please provide a reason for this manual status change', 'error'); break; }
      changeInvoiceStatus(id, newStatus, reason, currentUserId);
      closeModal(); toast('Invoice status updated'); refreshCurrentView();
      break;
    }
  }
});

/* Drawer tab clicks need dynamic re-binding since drawer content is re-injected */
document.addEventListener('click', function(e){
  const tabBtn = e.target.closest('[data-studenttab]');
  if(tabBtn){
    const wrap = tabBtn.closest('[data-studentid]');
    if(wrap) studentProfileDrawer(Number(wrap.dataset.studentid), tabBtn.dataset.studenttab);
  }
});

/* Access Control user-select needs a 'change' listener (not a click) — delegate on the root */
document.addEventListener('change', function(e){
  const sel = e.target.closest('#acUserSelect');
  if(sel){ renderAccessControlBody(Number(sel.value)); }
});

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('searchIcon').innerHTML = icon('search');
  document.getElementById('bellIcon').innerHTML = icon('bell');
  document.getElementById('btnHamburger').innerHTML = icon('menu');
  document.getElementById('btnNotif').addEventListener('click', showNotifPopover);
  document.getElementById('btnHamburger').addEventListener('click', ()=> document.getElementById('sidebar').classList.toggle('show'));
  document.getElementById('roleSwitch').addEventListener('change', (e)=> applyRoleSwitch(e.target.value));
  document.getElementById('globalSearch').addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){ toast('Search is a visual placeholder in this prototype'); }
  });

  navigate('dashboard');
});
