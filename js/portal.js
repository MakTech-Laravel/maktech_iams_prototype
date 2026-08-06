/* ============================================================
   Student Portal — login flow, navigation & page renderers
   ============================================================ */

let PORTAL_STUDENT_ID = 1;

const PORTAL_NAV = [
  { id:'dashboard', label:'Dashboard', ic:'home' },
  { id:'browse', label:'Browse Courses', ic:'course' },
  { id:'course', label:'My Course', ic:'bookOpen' },
  { id:'attendance', label:'Attendance', ic:'attendance' },
  { id:'payments', label:'Payments', ic:'payment' },
  { id:'migration', label:'Migration', ic:'swap' },
  { id:'certificate', label:'Certificate', ic:'certificate' },
  { id:'idcard', label:'ID Card', ic:'idcard' },
  { id:'notifications', label:'Notifications', ic:'notification' },
  { id:'support', label:'Support', ic:'ticket' },
  { id:'profile', label:'Profile', ic:'user' },
];

const PORTAL_VIEWS = {
  dashboard: renderPortalDashboard,
  browse: renderPortalBrowseCourses,
  course: renderPortalCourse,
  attendance: renderPortalAttendance,
  payments: renderPortalPayments,
  migration: renderPortalMigration,
  certificate: renderPortalCertificate,
  idcard: renderPortalIdCard,
  notifications: renderPortalNotifications,
  support: renderPortalSupport,
  profile: renderPortalProfile,
};

let portalCurrentView = 'dashboard';

function pStudent(){ return studentById(PORTAL_STUDENT_ID); }
function pInvoice(){ return invoiceForStudent(PORTAL_STUDENT_ID); }
function pCourse(){ const s = pStudent(); return DB.courses.find(c=>c.id===s.courses[0]?.course_id); }
function pEnrollment(){ return pStudent().courses[0]; }

/* ---------------- Auth flow ---------------- */
function populateDemoSelect(){
  const sel = document.getElementById('demoStudentSelect');
  sel.innerHTML = `<option value="">— choose a demo student —</option>` + DB.students.map(s=>`<option value="${s.id}">${s.name} (${s.code}) — ${STUDENT_STATUS_LABELS[s.status]}</option>`).join('');
  sel.addEventListener('change', ()=>{ if(sel.value) portalLogin(Number(sel.value)); });
}

function portalLogin(studentId){
  PORTAL_STUDENT_ID = studentId;
  const s = pStudent();
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('portalShell').style.display = 'flex';
  document.getElementById('portalAvatar').textContent = initials(s.name);
  document.getElementById('portalUserName').textContent = s.name;
  document.getElementById('portalUserCode').textContent = s.code;
  buildPortalNav();
  if(!s.profile_completed){ setTimeout(()=> openProfileCompletionModal(), 400); }
  portalNavigate('dashboard');
}

function buildPortalNav(){
  const html = PORTAL_NAV.map(n=>`<div class="pnav-item" data-action="pgo" data-pview="${n.id}">${icon(n.ic)} <span>${n.label}</span></div>`).join('');
  document.getElementById('portalNav').innerHTML = html;
  document.getElementById('portalNavMobile').innerHTML = html;
}

function portalNavigate(view){
  portalCurrentView = view;
  document.querySelectorAll('.pnav-item').forEach(el=> el.classList.toggle('active', el.dataset.pview===view));
  document.getElementById('portalContent').innerHTML = PORTAL_VIEWS[view] ? PORTAL_VIEWS[view]() : '<p>Not found</p>';
  window.scrollTo({top:0, behavior:'instant'});
}
function portalRefresh(){ portalNavigate(portalCurrentView); }

/* ---------------- Dashboard ---------------- */
function renderPortalDashboard(){
  const s = pStudent(); const inv = pInvoice(); const course = pCourse(); const enr = pEnrollment();
  const progress = DB.moduleProgress.filter(p=>p.student_id===s.id);
  const completedCount = progress.filter(p=>p.status==='completed').length;
  const pct = course ? Math.round(completedCount/course.modules.length*100) : 0;
  const att = enr ? attendanceSummaryForStudent(s.id, enr.batch_id) : {pct:0, effectiveTotal:0};

  let dueBanner = '';
  if(inv && inv.due>0){
    const overdue = inv.status==='overdue';
    dueBanner = `<div class="due-banner ${overdue?'danger':''}">
      <div class="ic-wrap">${icon('alertCircle')}</div>
      <div style="flex:1;"><b>${overdue?'Payment Overdue':'Upcoming Payment Due'}</b> — ${fmtMoney(inv.due)} due ${overdue?'since':'on'} ${fmtDate(inv.due_date)}. You can pay online here, or in person at the office — either way you'll get a printable receipt.</div>
      <button class="btn btn-sm ${overdue?'btn-danger':'btn-primary'}" data-action="pgo" data-pview="payments">Pay Now</button>
    </div>`;
  }
  const pendingReq = pendingEnrollmentRequest(s.id);
  let pendingBanner = '';
  if(pendingReq){
    pendingBanner = `<div class="due-banner" style="background:var(--info-50);border-color:#bfdbfe;color:var(--info-700);">
      <div class="ic-wrap">${icon('clock')}</div>
      <div style="flex:1;"><b>Enrollment Request Pending</b> — Your request to enroll in <b>${courseName(pendingReq.course_id)}</b> (${sessionName(pendingReq.session_id)} · ${batchName(pendingReq.batch_id)}) is awaiting Admin approval. You'll be notified once it's reviewed.</div>
    </div>`;
  } else if(!course){
    pendingBanner = `<div class="due-banner" style="background:var(--success-50);border-color:#a7f3d0;color:var(--success-700);">
      <div class="ic-wrap">${icon('bookOpen')}</div>
      <div style="flex:1;"><b>You're not enrolled in any course yet.</b> Browse our industrial attachment courses and enroll — pay online now, or request enrollment and pay later.</div>
      <button class="btn btn-sm btn-primary" data-action="pgo" data-pview="browse">Browse Courses</button>
    </div>`;
  }

  return `
  <div class="portal-hero">
    <h2>Welcome back, ${s.name.split(' ')[0]} 👋</h2>
    <p>${course ? course.name : 'No active course'} · ${batchName(enr?.batch_id)} · Keep up the good progress!</p>
  </div>
  ${pendingBanner}
  ${dueBanner}
  <div class="grid grid-4" style="margin-bottom:22px;">
    ${kpiCard('bookOpen','Course Progress', pct+'%', null, '#ff6533')}
    ${kpiCard('attendance','Attendance', att.effectiveTotal>0 ? att.pct+'%' : '—', null, att.effectiveTotal>0 && att.pct<70 ? '#ef4444':'#10b981')}
    ${kpiCard('wallet','Amount Due', fmtMoney(inv?.due||0), null, inv?.due>0?'#f59e0b':'#10b981')}
    ${kpiCard('calendar','Next Class', 'Tomorrow 10 AM', null, '#06b6d4')}
  </div>
  <div class="grid grid-3" style="align-items:start;">
    <div class="card course-progress-card" style="grid-column:span 2;">
      <div class="flex-between" style="margin-bottom:14px;"><h3 style="margin:0;font-size:14.5px;">Module Progress — ${course?.name||''}</h3><span class="badge badge-blue">${completedCount}/${course?.modules.length||0} done</span></div>
      ${course ? course.modules.map(m=>{
        const p = progress.find(pr=>pr.module_id===m.id); const st = p?.status||'not_started';
        const color = st==='completed'?'var(--success-500)':st==='in_progress'?'var(--warning-500)':'var(--gray-300)';
        return `<div class="module-row"><div class="module-check" style="background:${color}1a;color:${color};">${st==='completed'?icon('check'):st==='in_progress'?icon('clock'):''}</div>
          <div style="flex:1;"><b style="font-size:13px;display:block;">${m.seq}. ${m.title}</b><span class="cell-sub">${m.hours} hrs</span></div>${statusBadge(st)}</div>`;
      }).join('') : '<p class="muted">No course assigned yet.</p>'}
    </div>
    <div class="card card-pad">
      <h3 style="margin:0 0 14px;font-size:14.5px;">Quick Actions</h3>
      <div class="flex-gap" style="flex-direction:column;align-items:stretch;gap:10px;">
        <button class="btn btn-secondary btn-block" data-action="pgo" data-pview="payments">${icon('payment')} View Payment History</button>
        <button class="btn btn-secondary btn-block" data-action="pgo" data-pview="attendance">${icon('attendance')} Check Attendance</button>
        <button class="btn btn-secondary btn-block" data-action="pgo" data-pview="certificate">${icon('certificate')} Certificate Status</button>
        <button class="btn btn-secondary btn-block" data-action="pgo" data-pview="support">${icon('ticket')} Raise a Support Ticket</button>
      </div>
    </div>
  </div>`;
}

/* ---------------- Browse Courses & Self-Enrollment ---------------- */
function renderPortalBrowseCourses(){
  const s = pStudent();
  const hasActiveCourse = s.courses.some(c=>c.type==='primary');
  const pendingReq = pendingEnrollmentRequest(s.id);
  const cards = DB.courses.filter(c=>c.status==='active').map(c=>{
    const seatsLeft = c.seats - c.enrolled;
    return `<div class="card course-catalog-card">
      <div class="kpi-icon" style="background:var(--primary-50);color:var(--primary-600);margin-bottom:10px;">${ICONS.course}</div>
      <b style="font-size:14.5px;display:block;margin-bottom:4px;">${c.name}</b>
      <p class="cell-sub" style="margin-bottom:12px;flex:1;">${c.desc}</p>
      <div class="flex-between" style="margin-bottom:12px;">
        <span class="price">${fmtMoney(c.base_price)}</span>
        <span class="badge ${seatsLeft>5?'badge-green':'badge-amber'}">${seatsLeft} seats left</span>
      </div>
      <button class="btn btn-primary btn-block btn-sm" data-action="pgo-enroll" data-courseid="${c.id}">${icon('plus')} View Sessions & Enroll</button>
    </div>`;
  }).join('');
  return `
  <div class="view-header"><div><h1>Browse Courses</h1><p>Pick a course, choose your session & batch, then pay online or request enrollment</p></div></div>
  ${hasActiveCourse ? `<div class="badge badge-amber" style="white-space:normal;margin-bottom:18px;">${icon('shield')} You're already enrolled in a primary course. Adding a second course requires Admin approval — please contact the office.</div>` : ''}
  ${pendingReq ? `<div class="badge badge-blue" style="white-space:normal;margin-bottom:18px;">${icon('clock')} You already have a pending enrollment request for ${courseName(pendingReq.course_id)} — awaiting Admin review.</div>` : ''}
  <div class="grid grid-3">${cards}</div>`;
}

function portalEnrollModal(courseId){
  const s = pStudent();
  const course = DB.courses.find(c=>c.id===Number(courseId)); if(!course) return;
  if(s.courses.some(c=>c.type==='primary')){
    openModal({ title:'Already Enrolled', body:`<p style="font-size:13.5px;color:var(--gray-600);">${icon('alertCircle')} You already have an active course enrollment. To add another course, please contact the office — an Admin can enroll you as a special exception.</p>`, foot:`<button class="btn btn-primary" onclick="closeModal()">Got it</button>` });
    return;
  }
  if(pendingEnrollmentRequest(s.id)){
    openModal({ title:'Request Already Pending', body:`<p style="font-size:13.5px;color:var(--gray-600);">${icon('clock')} You already have a pending enrollment request. Please wait for Admin approval before submitting another.</p>`, foot:`<button class="btn btn-primary" onclick="closeModal()">Got it</button>` });
    return;
  }
  const sessions = sessionsForCourse(course.id).filter(ss=>ss.status!=='completed');
  openModal({ size:'lg', title:`Enroll — ${course.name}`, sub:`${fmtMoney(course.base_price)} · ${course.duration_days} days`,
    body:`
    <div class="form-grid" style="margin-bottom:18px;">
      <div class="field span-2"><label>Session *</label><select id="enrollSessionSelect" onchange="updateEnrollBatchOptions()">
        ${sessions.map(ss=>`<option value="${ss.id}">${ss.name} (${fmtDate(ss.start)} → ${fmtDate(ss.end)})</option>`).join('')}
      </select></div>
      <div class="field span-2"><label>Batch *</label><select id="enrollBatchSelect"></select></div>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--gray-600);display:block;margin-bottom:8px;">How would you like to pay?</label>
    <div class="grid grid-2" style="gap:12px;margin-bottom:6px;">
      <div class="pay-option-card selected" data-payopt="online" onclick="selectEnrollPayOption('online')">
        <b>${icon('payment')} Pay Online Now</b><span>Instantly confirmed — bKash/Nagad/Rocket/Card (demo)</span>
      </div>
      <div class="pay-option-card" data-payopt="pay_later" onclick="selectEnrollPayOption('pay_later')">
        <b>${icon('clock')} Enroll Without Payment</b><span>Sent for Admin approval — pay later, shown as due</span>
      </div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="portal-submit-enrollment" data-courseid="${course.id}">${icon('send')} Continue</button>`
  });
  setTimeout(updateEnrollBatchOptions, 0);
}
function updateEnrollBatchOptions(){
  const sessSel = document.getElementById('enrollSessionSelect'); const batchSel = document.getElementById('enrollBatchSelect');
  if(!sessSel || !batchSel) return;
  const batches = batchesInSession(Number(sessSel.value)).filter(b=>b.status!=='completed');
  batchSel.innerHTML = batches.map(b=>`<option value="${b.id}">${b.name} — ${b.enrolled}/${b.capacity} enrolled · ${b.room}</option>`).join('') || '<option value="">No open batches in this session</option>';
}
let selectedEnrollPayOption = 'online';
function selectEnrollPayOption(opt){
  selectedEnrollPayOption = opt;
  document.querySelectorAll('.pay-option-card').forEach(el=> el.classList.toggle('selected', el.dataset.payopt===opt));
}
function portalSubmitEnrollment(courseId){
  const s = pStudent();
  const sessionId = Number(document.getElementById('enrollSessionSelect')?.value);
  const batchId = Number(document.getElementById('enrollBatchSelect')?.value);
  if(!batchId){ toast('Please choose a batch with open seats', 'error'); return; }
  closeModal();
  if(selectedEnrollPayOption==='online'){
    const { invoice, payment } = createEnrollment(s, Number(courseId), batchId, { paidNow:true, method:'bkash' });
    toast('Payment successful — you are enrolled!');
    portalNavigate('dashboard');
    if(payment) setTimeout(()=> receiptPreviewModal(payment.id), 500);
  } else {
    DB.enrollmentRequests.push({ id:nextId(DB.enrollmentRequests), student_id:s.id, course_id:Number(courseId), session_id:sessionId, batch_id:batchId, payment_option:'pay_later', status:'pending', requested_date:TODAY, reviewed_by:null, reviewed_date:null, note:'' });
    toast('Enrollment request submitted — awaiting Admin approval');
    portalNavigate('dashboard');
  }
}

/* ---------------- Course & Modules ---------------- */
function renderPortalCourse(){
  const s = pStudent(); const course = pCourse(); const enr = pEnrollment();
  if(!course) return `<div class="empty-state">${icon('bookOpen')}<p>No course enrolled yet.</p><button class="btn btn-primary btn-sm" style="margin-top:14px;" data-action="pgo" data-pview="browse">${icon('plus')} Browse Courses</button></div>`;
  const progress = DB.moduleProgress.filter(p=>p.student_id===s.id);
  return `
  <div class="view-header"><div><h1>My Course</h1><p>${course.name}</p></div><div class="view-actions">${statusBadge(enr.status)}</div></div>
  <div class="grid grid-3" style="margin-bottom:20px;">
    ${kpiCard('batch','Batch', batchName(enr.batch_id), null, '#ff6533')}
    ${kpiCard('calendar','Enrolled On', fmtDate(enr.date), null, '#06b6d4')}
    ${kpiCard('payment','Enrolled Price', fmtMoney(enr.enrolled_price), null, '#10b981')}
  </div>
  <div class="card course-progress-card">
    <h3 style="margin:0 0 14px;font-size:14.5px;">Curriculum Modules</h3>
    ${course.modules.map(m=>{
      const p = progress.find(pr=>pr.module_id===m.id); const st = p?.status||'not_started';
      const color = st==='completed'?'var(--success-500)':st==='in_progress'?'var(--warning-500)':'var(--gray-300)';
      return `<div class="module-row"><div class="module-check" style="background:${color}1a;color:${color};">${st==='completed'?icon('check'):st==='in_progress'?icon('clock'):''}</div>
        <div style="flex:1;"><b style="font-size:13px;display:block;">${m.seq}. ${m.title}</b><span class="cell-sub">${m.hours} hrs</span></div>${statusBadge(st)}</div>`;
    }).join('')}
  </div>
  <div class="card mt-16 card-pad">
    <h3 style="margin:0 0 10px;font-size:14.5px;">Course Description</h3>
    <p class="muted" style="font-size:13px;">${course.desc}</p>
  </div>`;
}

/* ---------------- Attendance ---------------- */
function renderPortalAttendance(){
  const s = pStudent();
  if(!s.courses.length) return `<div class="empty-state">${icon('attendance')}<p>You're not enrolled in any course yet, so there's no attendance to show.</p></div>`;
  const cards = s.courses.map(enr=>{
    const c = DB.courses.find(x=>x.id===enr.course_id);
    const att = attendanceSummaryForStudent(s.id, enr.batch_id);
    const history = attendanceRecordsForStudent(s.id, enr.batch_id).slice(0,12);
    return `
    <div class="card card-pad" style="margin-bottom:18px;">
      <div class="flex-between" style="margin-bottom:14px;flex-wrap:wrap;gap:6px;"><b style="font-size:14px;">${c?.name||'—'}</b><span class="cell-sub">${batchName(enr.batch_id)}</span></div>
      <div class="flex-gap" style="align-items:center;gap:20px;margin-bottom:14px;">
        <div style="text-align:center;">
          <div style="font-size:30px;font-weight:800;color:${att.effectiveTotal>0 && att.pct<70?'var(--danger-600)':'var(--success-700)'};">${att.effectiveTotal>0?att.pct+'%':'—'}</div>
          <div class="cell-sub">${att.effectiveTotal>0 ? `${att.attended}/${att.effectiveTotal} sessions` : 'No data yet'}</div>
        </div>
        <div style="flex:1;">
          <div class="progress-track" style="margin-bottom:8px;"><div class="progress-fill" style="width:${att.pct}%;${att.effectiveTotal>0 && att.pct<70?'background:linear-gradient(90deg,#f87171,#ef4444);':''}"></div></div>
          <div class="cell-sub">${att.present} present · ${att.late} late · ${att.absent} absent · ${att.excused} excused</div>
        </div>
      </div>
      ${att.effectiveTotal>0 ? (att.pct<70 ? `<div class="badge badge-red" style="margin-bottom:14px;">${icon('alertCircle')} Below 70% — certificate may be blocked until improved</div>` : `<div class="badge badge-green" style="margin-bottom:14px;">${icon('checkCircle')} Good standing</div>`) : ''}
      ${history.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Module</th><th>Status</th></tr></thead><tbody>
        ${history.map(r=>`<tr><td>${fmtDate(r.session.date)}</td><td class="cell-strong">${DB.courses.flatMap(cc=>cc.modules).find(m=>m.id===r.session.module_id)?.title || 'General Session'}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}
      </tbody></table></div>` : `<p class="muted" style="font-size:12.5px;">No sessions marked yet for this batch.</p>`}
    </div>`;
  }).join('');
  return `
  <div class="view-header"><div><h1>Attendance</h1><p>Your session-wise attendance history, per course</p></div></div>
  ${cards}`;
}

/* ---------------- Payments ---------------- */
function renderPortalPayments(){
  const s = pStudent(); const inv = pInvoice();
  const payments = DB.payments.filter(p=>p.student_id===s.id);
  const installments = inv ? DB.paymentInstallments.filter(x=>x.invoice_id===inv.id) : [];
  return `
  <div class="view-header"><div><h1>Payments</h1><p>Fee summary, installments & payment history</p></div></div>
  <div class="grid grid-3" style="margin-bottom:20px;">
    ${kpiCard('file','Total Fee', fmtMoney(inv?.total||0), null, '#ff6533')}
    ${kpiCard('checkCircle','Paid', fmtMoney(inv?.paid||0), null, '#10b981')}
    ${kpiCard('alertCircle','Due', fmtMoney(inv?.due||0), null, inv?.due>0?'#ef4444':'#10b981')}
  </div>

  ${inv && inv.due>0 ? `
  <div class="card" style="margin-bottom:22px;">
    <div class="card-header"><h3>Pay Now</h3><p>Choose your preferred payment method</p></div>
    <div class="card-pad">
      <div class="pay-method-grid" style="margin-bottom:18px;">
        <div class="pay-method selected" data-paymethod="bkash"><div class="pm-logo" style="background:#e2136e;">bK</div>bKash</div>
        <div class="pay-method" data-paymethod="nagad"><div class="pm-logo" style="background:#f7941d;">N</div>Nagad</div>
        <div class="pay-method" data-paymethod="rocket"><div class="pm-logo" style="background:#8c3494;">R</div>Rocket</div>
        <div class="pay-method" data-paymethod="card"><div class="pm-logo" style="background:#334155;">💳</div>Card</div>
        <div class="pay-method" data-paymethod="sslcommerz"><div class="pm-logo" style="background:#0ea5e9;">SC</div>SSLCommerz</div>
      </div>
      <div class="flex-gap" style="max-width:280px;">
        <div class="field" style="flex:1;"><label>Amount to Pay (BDT)</label><input type="number" value="${inv.due}" id="payAmountInput"></div>
      </div>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="simulateOnlinePayment()">${icon('send')} Proceed to Pay ${fmtMoney(inv.due)}</button>
      <p class="hint" style="margin-top:8px;">Demo only — no real gateway is triggered.</p>
    </div>
  </div>` : `<div class="due-banner" style="background:var(--success-50);border-color:#a7f3d0;color:var(--success-700);margin-bottom:22px;"><div class="ic-wrap">${icon('checkCircle')}</div><div>Your fee is fully paid. No action needed. 🎉</div></div>`}

  ${installments.length ? `<div class="card" style="margin-bottom:22px;">
    <div class="card-header"><h3>Installment Plan</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead><tbody>
    ${installments.map(x=>`<tr><td>${x.no}</td><td>${fmtMoney(x.amount)}</td><td>${fmtDate(x.due_date)}</td><td>${statusBadge(x.status)}</td></tr>`).join('')}
    </tbody></table></div>
  </div>` : ''}

  <div class="card">
    <div class="card-header"><h3>Payment History</h3><p>Every payment — online or in person — gets a signed, printable receipt</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>
    ${payments.length ? payments.slice().reverse().map(p=>`<tr><td class="cell-strong">${p.receipt_no}</td><td>${fmtMoney(p.amount)}</td><td>${methodBadge(p.method)}</td><td>${fmtDate(p.date)}</td><td>${statusBadge(p.status)}</td><td><button class="btn btn-sm btn-outline" data-action="view-receipt" data-id="${p.id}">${icon('printer')} View / Print</button></td></tr>`).join('') : `<tr><td colspan="6" class="muted">No payments yet.</td></tr>`}
    </tbody></table></div>
  </div>`;
}
function simulateOnlinePayment(){
  const s = pStudent(); const inv = pInvoice(); if(!inv || inv.due<=0) return;
  const amount = Math.min(inv.due, Number(document.getElementById('payAmountInput')?.value || inv.due));
  const methodEl = document.querySelector('.pay-method.selected');
  const method = methodEl ? (methodEl.dataset.paymethod==='sslcommerz'?'card':methodEl.dataset.paymethod) : 'bkash';
  const payment = recordPayment(s.id, inv.id, amount, method, 'online', null, { gatewayTxnId:'TXN'+Math.floor(Math.random()*90000000+10000000) });
  toast('Payment successful! Receipt generated.');
  setTimeout(()=>{ portalRefresh(); receiptPreviewModal(payment.id); }, 700);
}

/* ---------------- Course Migration ---------------- */
function renderPortalMigration(){
  const s = pStudent(); const course = pCourse();
  const myMigrations = DB.courseMigrations.filter(m=>m.student_id===s.id);
  return `
  <div class="view-header"><div><h1>Course Migration</h1><p>Request to switch to a different course — see fee impact instantly</p></div></div>
  <div class="card" style="margin-bottom:22px;">
    <div class="card-header"><h3>Request New Migration</h3></div>
    <div class="card-pad">
      <div class="form-grid" style="margin-bottom:16px;">
        <div class="field span-2"><label>Currently Enrolled</label><div><b>${course?.name||'—'}</b></div></div>
        <div class="field span-2"><label>Migrate To</label><select id="portalMigTo" onchange="updatePortalMigPreview()">
          ${DB.courses.filter(c=>c.id!==course?.id && c.status==='active').map(c=>`<option value="${c.id}" data-price="${c.base_price}">${c.name} — ${fmtMoney(c.base_price)}</option>`).join('')}
        </select></div>
        <div class="field span-2"><label>Reason</label><textarea placeholder="Why would you like to migrate?"></textarea></div>
      </div>
      <div class="card card-pad" id="portalMigPreview" style="background:var(--primary-50);border-color:var(--primary-100);">
        <b style="font-size:12.5px;color:var(--primary-700);display:block;margin-bottom:10px;">Real-time Fee Difference Preview</b>
        <div class="grid grid-2" style="gap:10px;font-size:13px;">
          <div class="flex-between"><span class="muted">Already Paid</span><b id="pMigPaid">${fmtMoney(sum(DB.payments.filter(p=>p.student_id===s.id),p=>p.amount))}</b></div>
          <div class="flex-between"><span class="muted">New Course Price</span><b id="pMigNewPrice">—</b></div>
          <div class="flex-between"><span class="muted">Migration Fee</span><b>৳1,000</b></div>
          <div class="flex-between"><span class="muted">Net Additional Due</span><b id="pMigNet" style="color:var(--primary-700);">—</b></div>
        </div>
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="toast('Migration request submitted for approval')">${icon('send')} Submit Request</button>
    </div>
  </div>
  <div class="card">
    <div class="card-header"><h3>My Migration History</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>From → To</th><th>Requested</th><th>Net Adjustment</th><th>Status</th></tr></thead><tbody>
    ${myMigrations.length ? myMigrations.map(m=>`<tr><td class="cell-strong">${courseName(m.from_course_id)} → ${courseName(m.to_course_id)}</td><td>${fmtDate(m.date)}</td><td>${fmtMoney(m.net_adjustment)}</td><td>${statusBadge(m.status)}</td></tr>`).join('') : `<tr><td colspan="4" class="muted">No migration requests yet.</td></tr>`}
    </tbody></table></div>
  </div>`;
}
function updatePortalMigPreview(){
  const sel = document.getElementById('portalMigTo'); if(!sel) return;
  const price = Number(sel.selectedOptions[0].dataset.price);
  const paid = Number(document.getElementById('pMigPaid').textContent.replace(/[^\d]/g,''));
  document.getElementById('pMigNewPrice').textContent = fmtMoney(price);
  document.getElementById('pMigNet').textContent = fmtMoney(Math.max(0, price - paid + 1000));
}

/* ---------------- Certificate ---------------- */
function renderPortalCertificate(){
  const s = pStudent();
  const cert = DB.certificates.find(c=>c.student_id===s.id);
  const enr = pEnrollment();
  const att = enr ? attendanceSummaryForStudent(s.id, enr.batch_id) : {pct:0, effectiveTotal:0};
  const inv = pInvoice();
  const conditions = [
    {label:'Course marked Completed', ok: ['completed','certified'].includes(s.status)},
    {label:'Attendance ≥ 75%', ok: att.effectiveTotal>0 && att.pct>=75},
    {label:'No outstanding due', ok: !inv || inv.due===0},
  ];
  return `
  <div class="view-header"><div><h1>Certificate</h1><p>Auto-unlocked once all completion conditions are met</p></div></div>
  <div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin:0 0 14px;font-size:14.5px;">Eligibility Checklist</h3>
    ${conditions.map(c=>`<div class="flex-gap" style="margin-bottom:10px;"><span style="color:${c.ok?'var(--success-500)':'var(--gray-300)'};">${icon('checkCircle')}</span><span style="font-size:13px;">${c.label}</span>${c.ok?statusBadge('active','Met'):statusBadge('pending','Not yet')}</div>`).join('')}
  </div>
  ${cert && cert.status==='issued' ? `
  <div class="showcase-wrap">${certificateTemplatePreview(s.name, courseName(cert.course_id), cert.cert_no, cert.issue_date)}</div>
  <div class="flex-gap" style="justify-content:center;margin-top:18px;">
    <button class="btn btn-primary" onclick="toast('Downloading certificate PDF (demo)')">${icon('download')} Download Certificate</button>
    <button class="btn btn-secondary" onclick="location.href='verify.html'">${icon('qr')} View Public Verification</button>
  </div>` : `<div class="empty-state">${icon('certificate')}<p>Your certificate isn't ready yet. Complete the conditions above to unlock it.</p></div>`}`;
}

/* ---------------- ID Card ---------------- */
function renderPortalIdCard(){
  const s = pStudent();
  const card = DB.idCards.find(c=>c.student_id===s.id);
  return `
  <div class="view-header"><div><h1>Digital ID Card</h1><p>QR-coded student identity card</p></div></div>
  ${card ? `<div class="showcase-wrap">${idCardPreview(s, card)}</div>
  <div class="flex-gap" style="justify-content:center;margin-top:18px;">
    <span class="badge ${card.status==='active'?'badge-green':'badge-red'}" style="font-size:12.5px;padding:6px 14px;">${statusBadge(card.status)}</span>
  </div>
  <div class="flex-gap" style="justify-content:center;margin-top:14px;">
    <button class="btn btn-primary" onclick="toast('Downloading ID card PDF (demo)')">${icon('download')} Download ID Card</button>
    ${card.status==='expired' ? `<button class="btn btn-secondary" onclick="toast('Reissue request submitted')">${icon('swap')} Request Reissue</button>` : ''}
  </div>` : `<div class="empty-state">${icon('idcard')}<p>Your ID card has not been issued yet. It will be available once your admission is confirmed.</p></div>`}`;
}

/* ---------------- Notifications ---------------- */
function renderPortalNotifications(){
  const s = pStudent();
  const notifs = DB.notifications.filter(n=>n.recipient===s.name);
  const generic = [
    {type:'class_reminder', message:`Reminder: your next class starts tomorrow at 10:00 AM.`, date:'2026-08-05 18:00', status:'sent', channel:'sms'},
    {type:'announcement', message:'Office will remain closed on Aug 15 for a public holiday.', date:'2026-08-01 09:00', status:'sent', channel:'portal'},
  ];
  const all = [...notifs, ...generic];
  return `
  <div class="view-header"><div><h1>Notifications</h1><p>Alerts, reminders & announcements</p></div></div>
  <div class="card">
    <div class="timeline card-pad">
      ${all.map(n=>`<div class="timeline-item"><div class="when">${fmtDate(n.date)} · ${n.channel.toUpperCase()}</div><div class="what">${n.message}</div><div class="who">${n.type.replace(/_/g,' ')}</div></div>`).join('')}
    </div>
  </div>`;
}

/* ---------------- Support ---------------- */
function renderPortalSupport(){
  return `
  <div class="view-header"><div><h1>Support</h1><p>Raise a help request to the office</p></div></div>
  <div class="grid grid-2" style="align-items:start;">
    <div class="card card-pad">
      <h3 style="margin:0 0 14px;font-size:14.5px;">New Support Ticket</h3>
      <div class="field" style="margin-bottom:12px;"><label>Subject</label><input type="text" placeholder="e.g. Payment not reflecting"></div>
      <div class="field" style="margin-bottom:12px;"><label>Category</label><select><option>Payment Issue</option><option>Attendance Issue</option><option>Certificate Query</option><option>Technical Issue</option><option>Other</option></select></div>
      <div class="field" style="margin-bottom:14px;"><label>Description</label><textarea placeholder="Describe your issue..."></textarea></div>
      <button class="btn btn-primary" onclick="toast('Support ticket submitted — office will respond soon')">${icon('send')} Submit Ticket</button>
    </div>
    <div>
      <h3 style="margin:0 0 14px;font-size:14.5px;">My Tickets</h3>
      <div class="ticket-item"><div class="flex-between"><b style="font-size:13px;">Receipt not generated for RCT-1006</b>${statusBadge('pending','Open')}</div><div class="cell-sub" style="margin-top:4px;">Raised 3 days ago · Payment Issue</div></div>
      <div class="ticket-item"><div class="flex-between"><b style="font-size:13px;">Wrong attendance marked on Jul 30</b>${statusBadge('completed','Resolved')}</div><div class="cell-sub" style="margin-top:4px;">Raised 1 week ago · Attendance Issue</div></div>
    </div>
  </div>`;
}

/* ---------------- Profile ---------------- */
function renderPortalProfile(){
  const s = pStudent();
  return `
  <div class="view-header"><div><h1>My Profile</h1><p>Personal information & documents</p></div>
    <div class="view-actions">${s.profile_completed?statusBadge('active','Profile Complete'):statusBadge('pending','Incomplete')}</div>
  </div>
  <div class="grid grid-3" style="align-items:start;">
    <div class="card card-pad" style="text-align:center;">
      ${avatarHtml(s.name,'lg')}
      <b style="display:block;margin:12px 0 2px;font-size:15px;">${s.name}</b>
      <span class="cell-sub">${s.code}</span>
      <div class="hr"></div>
      <button class="btn btn-secondary btn-sm btn-block">${icon('upload')} Change Photo</button>
    </div>
    <div class="card card-pad" style="grid-column:span 2;">
      <div class="form-grid">
        <div class="field"><label>Full Name</label><input type="text" value="${s.name}"></div>
        <div class="field"><label>Phone</label><input type="text" value="${s.phone}" readonly></div>
        <div class="field"><label>Email</label><input type="text" value="${s.email||''}" placeholder="Add email (optional)"></div>
        <div class="field"><label>Date of Birth</label><input type="date" value="${s.dob}"></div>
        <div class="field span-2"><label>Present Address</label><input type="text" value="${s.present_address}"></div>
        <div class="field span-2"><label>Permanent Address</label><input type="text" value="${s.permanent_address}"></div>
        <div class="field"><label>Guardian Name</label><input type="text" value="${s.guardian_name}"></div>
        <div class="field"><label>Guardian Phone</label><input type="text" value="${s.guardian_phone}"></div>
      </div>
      <div class="hr"></div>
      <button class="btn btn-primary btn-sm" onclick="toast('Profile updated')">${icon('check')} Save Changes</button>
    </div>
  </div>
  <div class="card mt-16">
    <div class="card-header"><h3>My Documents</h3></div>
    <div class="card-pad grid grid-3">
      ${s.documents.map(d=>`<div class="card card-pad flex-gap"><div class="kpi-icon" style="width:34px;height:34px;background:var(--primary-50);color:var(--primary-600);">${ICONS.file}</div><div><b style="font-size:12.5px;display:block;">${d.name}</b><span class="cell-sub">${d.type.toUpperCase()}</span></div></div>`).join('')}
    </div>
  </div>`;
}

/* ---------------- Profile completion gate (first login) ---------------- */
function openProfileCompletionModal(){
  const s = pStudent();
  openModal({ size:'lg',
    title:'Complete Your Profile', sub:'Please finish setting up your profile before continuing',
    body:`<div class="form-grid">
      <div class="field"><label>Full Name</label><input type="text" value="${s.name}"></div>
      <div class="field"><label>Email (optional)</label><input type="text" placeholder="you@example.com"></div>
      <div class="field span-2"><label>Present Address</label><input type="text" value="${s.present_address}"></div>
      <div class="field span-2"><label>Upload Photo</label><div class="flex-gap" style="border:1.5px dashed var(--gray-300);border-radius:10px;padding:14px;justify-content:center;color:var(--gray-400);">${icon('upload')} Upload photo (demo)</div></div>
      <div class="field span-2"><label>Upload NID / Birth Certificate</label><div class="flex-gap" style="border:1.5px dashed var(--gray-300);border-radius:10px;padding:14px;justify-content:center;color:var(--gray-400);">${icon('upload')} Upload document (demo)</div></div>
    </div>`,
    foot:`<button class="btn btn-primary btn-block" onclick="pStudent().profile_completed=true; closeModal(); toast('Profile completed! Welcome aboard.'); portalRefresh();">${icon('check')} Complete Profile</button>`
  });
}

/* ---------------- Event delegation ---------------- */
document.addEventListener('click', function(e){
  const t = e.target.closest('[data-action]');
  if(!t) {
    const pm = e.target.closest('.pay-method');
    if(pm){ document.querySelectorAll('.pay-method').forEach(x=>x.classList.remove('selected')); pm.classList.add('selected'); }
    return;
  }
  switch(t.dataset.action){
    case 'pgo': portalNavigate(t.dataset.pview); break;
    case 'pgo-enroll': portalEnrollModal(t.dataset.courseid); break;
    case 'portal-submit-enrollment': portalSubmitEnrollment(t.dataset.courseid); break;
    case 'view-receipt': receiptPreviewModal(Number(t.dataset.id)); break;
  }
});

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', function(){
  populateDemoSelect();

  document.getElementById('btnSendOtp').addEventListener('click', ()=>{
    document.getElementById('loginStep1').style.display = 'none';
    document.getElementById('loginStep2').style.display = 'block';
    toast('OTP sent to ' + document.getElementById('loginPhone').value);
  });
  document.getElementById('btnVerifyOtp').addEventListener('click', ()=>{
    const phone = document.getElementById('loginPhone').value.trim();
    const match = DB.students.find(s=>s.phone===phone);
    portalLogin(match ? match.id : 1);
  });
  document.getElementById('btnLogout').addEventListener('click', ()=>{
    document.getElementById('portalShell').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('loginStep1').style.display = 'block';
    document.getElementById('loginStep2').style.display = 'none';
    showAuthPane('login');
    toast('Logged out successfully');
  });
  document.getElementById('portalBell').addEventListener('click', ()=> portalNavigate('notifications'));

  document.getElementById('btnShowLogin').addEventListener('click', ()=> showAuthPane('login'));
  document.getElementById('btnShowSignup').addEventListener('click', ()=> showAuthPane('signup'));
  document.getElementById('btnCreateAccount').addEventListener('click', ()=>{
    const name = document.getElementById('signupName').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    if(!name || !phone){ toast('Please enter your name and phone number', 'error'); return; }
    const student = selfRegisterStudent({ name, phone, email });
    toast('Account created — welcome to MakTech IAMS!');
    portalLogin(student.id);
  });
});
function showAuthPane(which){
  document.getElementById('loginPane').style.display = which==='login' ? 'block' : 'none';
  document.getElementById('signupPane').style.display = which==='signup' ? 'block' : 'none';
  document.getElementById('btnShowLogin').classList.toggle('active', which==='login');
  document.getElementById('btnShowSignup').classList.toggle('active', which==='signup');
}
