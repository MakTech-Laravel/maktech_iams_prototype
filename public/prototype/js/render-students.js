/* ============================================================
   Students module — Directory, Profile detail, Attendance
   ============================================================ */

function renderStudents(){
  const isScoped = isTeacherRole(currentUserId);
  const scoped = isScoped ? scopedStudentsForUser(currentUserId) : DB.students;
  const students = visibleStudentsForUser(currentUserId, scoped);
  const hiddenByListPerm = scoped.length - students.length;
  const canChangeStatus = effectivePerm(currentUserId,'Students','ChangeStatus');
  const rows = students.map(s=>{
    const inv = invoiceForStudent(s.id);
    const primary = primaryEnrollment(s);
    const extra = additionalEnrollments(s).length;
    return `<tr class="row-link" data-action="view-student" data-id="${s.id}">
      <td>${avatarHtml(s.name,'sm',s.photo)}</td>
      <td><span class="cell-strong">${s.name}</span><div class="cell-sub">${s.code}</div></td>
      <td>${institutionName(s.institution_id)}</td>
      <td>${courseName(primary?.course_id)} ${extra ? `<span class="badge badge-amber" title="Has ${extra} additional admin-added enrollment(s)">+${extra} more</span>` : ''}</td>
      <td>${batchName(primary?.batch_id)}</td>
      <td>${s.phone}</td>
      <td>${inv ? statusBadge(inv.status) : '<span class="muted">—</span>'}</td>
      <td>${statusBadge(s.status, STUDENT_STATUS_LABELS[s.status])}</td>
      <td>${canChangeStatus ? `<button class="btn btn-sm btn-ghost" title="Change status" data-action="open-change-student-status" data-id="${s.id}">${icon('swap')}</button>` : ''}</td>
    </tr>`;
  }).join('');

  return `
  <div class="view-header">
    <div><h1>Student Directory</h1><p>${isScoped ? `Showing only students enrolled in your assigned batches` : `${DB.students.length} students · registered, active, and alumni across all courses`}</p></div>
    <div class="view-actions">
      ${effectivePerm(currentUserId,'Students','Create') ? `<button class="btn btn-secondary btn-sm">${icon('upload')} Bulk Import</button><button class="btn btn-primary btn-sm" data-action="open-add-student">${icon('plus')} Register Student</button>` : ''}
    </div>
  </div>
  ${isScoped ? `<div class="badge badge-amber" style="margin-bottom:16px;">${icon('shield')} You only have access to students in your assigned batches/courses.</div>` : ''}
  ${hiddenByListPerm>0 ? `<div class="badge badge-gray" style="white-space:normal;text-align:left;margin-bottom:16px;">${icon('lock')} ${hiddenByListPerm} student(s) hidden — you don't have permission to view one or more status lists (Active/Dropped/On Hold/Completed). Ask Admin to grant access via Access Control.</div>` : ''}
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('students','Total Students', students.length, null, '#ff6533')}
    ${kpiCard('checkCircle','Active', students.filter(s=>s.status==='active').length, null, '#10b981')}
    ${kpiCard('certificate','Completed / Certified', students.filter(s=>['completed','certified'].includes(s.status)).length, null, '#8b5cf6')}
    ${kpiCard('alertCircle','Dropped / On Hold', students.filter(s=>['dropped','on_hold'].includes(s.status)).length, null, '#ef4444')}
  </div>
  <div class="filter-bar">
    <div class="search-input-wrap">${icon('search')}<input type="text" placeholder="Search by name, code or phone…"></div>
    <select><option>All Courses</option>${DB.courses.map(c=>`<option>${c.name}</option>`).join('')}</select>
    <select><option>All Batches</option>${DB.batches.map(b=>`<option>${b.name}</option>`).join('')}</select>
    <select><option>All Institutes</option>${DB.institutions.map(i=>`<option>${i.name}</option>`).join('')}</select>
    <select><option>All Status</option>${allowedStudentStatusKeys(currentUserId).map(k=>`<option>${{Active:'Active',Dropped:'Dropped',OnHold:'On Hold',Completed:'Completed/Certified'}[k]}</option>`).join('')}</select>
  </div>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Student</th><th>Institution</th><th>Course</th><th>Batch</th><th>Phone</th><th>Payment</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    ${paginationHtml(students.length, students.length)}
  </div>`;
}

function changeStudentStatusModal(id){
  const s = studentById(id); if(!s) return;
  openModal({
    title:'Change Student Status', sub:`${s.name} (${s.code}) — current: ${STUDENT_STATUS_LABELS[s.status]}`,
    body:`<div class="form-grid single">
      <div class="field"><label>New Status *</label><select id="csNewStatus">${Object.entries(STUDENT_STATUS_LABELS).map(([k,v])=>`<option value="${k}" ${k===s.status?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Reason / Notes</label><textarea id="csReason" placeholder="Why is the status changing? (optional, kept in Audit Log)"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-change-student-status" data-id="${s.id}">${icon('check')} Update Status</button>`
  });
}

function studentProfileDrawer(id, tab){
  const s = studentById(id); if(!s) return;
  tab = tab || 'info';
  const inv = invoiceForStudent(s.id);
  const enrollment = primaryEnrollment(s);
  const course = DB.courses.find(c=>c.id===enrollment?.course_id);
  const progress = DB.moduleProgress.filter(p=>p.student_id===s.id);
  const payments = DB.payments.filter(p=>p.student_id===s.id);

  const tabs = [
    {id:'info', label:'Profile'},
    {id:'docs', label:'Documents'},
    {id:'courses', label:'Courses & Modules'},
    {id:'attendance', label:'Attendance'},
    {id:'payments', label:'Payments'},
  ];

  let body = `<div class="flex-gap" style="margin-bottom:18px;flex-wrap:wrap;">
    ${statusBadge(s.status, STUDENT_STATUS_LABELS[s.status])}
    ${s.profile_completed ? `<span class="badge badge-green">${icon('checkCircle')} Profile Complete</span>` : `<span class="badge badge-amber">${icon('alertCircle')} Profile Incomplete</span>`}
  </div>`;
  body += tabsHtml(tabs, tab, 'studenttab').replace('<div class="tabs">','<div class="tabs" data-studentid="'+id+'">');

  if(tab==='info'){
    body += `<div class="form-grid">
      <div class="field"><label>Full Name</label><div>${s.name}</div></div>
      <div class="field"><label>Student Code</label><div>${s.code}</div></div>
      <div class="field"><label>Date of Birth</label><div>${fmtDate(s.dob)}</div></div>
      <div class="field"><label>Gender</label><div>${s.gender}</div></div>
      <div class="field"><label>Phone (Portal Login)</label><div>${s.phone}</div></div>
      <div class="field"><label>Email</label><div>${s.email||'—'}</div></div>
      <div class="field span-2"><label>Present Address</label><div>${s.present_address}</div></div>
      <div class="field span-2"><label>Permanent Address</label><div>${s.permanent_address}</div></div>
      <div class="field"><label>Institution</label><div>${institutionName(s.institution_id)}</div></div>
      <div class="field"><label>Roll/Reg No.</label><div>${s.roll} (${s.passing_year})</div></div>
      <div class="field"><label>Guardian</label><div>${s.guardian_name} (${s.guardian_relation})</div></div>
      <div class="field"><label>Guardian Phone</label><div>${s.guardian_phone}</div></div>
    </div>
    <div class="hr"></div>
    <div class="flex-gap">
      <button class="btn btn-outline btn-sm" data-action="open-edit-student" data-id="${s.id}">${icon('edit')} Edit Profile</button>
      <button class="btn btn-secondary btn-sm" data-action="open-migration" data-id="${s.id}">${icon('swap')} Course Migration</button>
      <button class="btn btn-secondary btn-sm" data-action="issue-idcard" data-id="${s.id}">${icon('idcard')} Issue ID Card</button>
      ${effectivePerm(currentUserId,'Students','ChangeStatus') ? `<button class="btn btn-secondary btn-sm" data-action="open-change-student-status" data-id="${s.id}">${icon('shield')} Change Status</button>` : ''}
    </div>`;
  } else if(tab==='docs'){
    body += `<div class="grid grid-2">
      ${s.documents.map(d=>`<div class="card card-pad flex-gap"><div class="kpi-icon" style="width:34px;height:34px;background:var(--primary-50);color:var(--primary-600);">${ICONS.file}</div><div><b style="font-size:12.8px;display:block;">${d.name}</b><span class="cell-sub">${d.type.toUpperCase()}</span></div></div>`).join('')}
    </div>
    <div class="hr"></div>
    <div class="flex-gap" style="border:1.5px dashed var(--gray-300);border-radius:10px;padding:16px;justify-content:center;color:var(--gray-400);">${icon('upload')} Upload additional document (demo)</div>`;
  } else if(tab==='courses'){
    body += `<div class="badge badge-gray" style="margin-bottom:12px;">${icon('shield')} Enrollment policy: each student has ONE primary course & batch. Admin can add extra enrollments below — always tagged & reasoned for history/reporting.</div>`;
    body += s.courses.map((enr,idx)=>{
      const c = DB.courses.find(x=>x.id===enr.course_id);
      const isPrimary = enr.type!=='additional';
      return `<div class="card card-pad" style="margin-bottom:12px;${!isPrimary?'border-color:var(--accent-2);':''}">
        <div class="flex-between" style="margin-bottom:8px;flex-wrap:wrap;gap:6px;">
          <div class="flex-gap">${isPrimary ? `<span class="badge badge-blue">${icon('checkCircle')} Primary Enrollment</span>` : `<span class="badge badge-amber">${icon('alertCircle')} Additional (Admin Override)</span>`}${statusBadge(enr.status)}</div>
        </div>
        <b style="display:block;margin-bottom:4px;">${c?.name||'—'}</b>
        <div class="cell-sub">Batch: ${batchName(enr.batch_id)} · Enrolled: ${fmtDate(enr.date)}</div>
        <div class="cell-sub">Price: ${fmtMoney(enr.enrolled_price)} (discount ${fmtMoney(enr.discount)} applied)</div>
        ${!isPrimary ? `<div class="hr"></div><div class="cell-sub"><b>Reason:</b> ${enr.added_reason||'—'}</div><div class="cell-sub"><b>Added by:</b> ${userName(enr.added_by)} on ${fmtDate(enr.added_date)}</div>` : ''}
      </div>`;
    }).join('');
    body += `<div class="hr"></div><button class="btn btn-outline btn-sm" data-action="open-add-additional-course" data-id="${s.id}">${icon('plus')} Add Additional Course (Admin Override)</button>`;
    body += `<div class="hr"></div><h3 style="font-size:13px;margin-bottom:10px;">Module Progress — ${course?.name||'Primary Course'}</h3>
    ${course ? course.modules.map(m=>{
      const p = progress.find(pr=>pr.module_id===m.id);
      const st = p?.status||'not_started';
      const pct = st==='completed'?100:st==='in_progress'?50:0;
      return `<div style="margin-bottom:14px;">
        <div class="flex-between" style="margin-bottom:5px;font-size:12.5px;"><span><b>${m.seq}.</b> ${m.title}</span>${statusBadge(st)}</div>
        <div class="progress-track sm"><div class="progress-fill" style="width:${pct}%;"></div></div>
      </div>`;
    }).join('') : '<div class="muted">No module data.</div>'}`;
  } else if(tab==='attendance'){
    if(!s.courses.length){
      body += `<div class="empty-state">${icon('attendance')}<p>Not enrolled in any batch yet — no attendance to show.</p></div>`;
    } else {
      body += s.courses.map(enr=>{
        const c = DB.courses.find(x=>x.id===enr.course_id);
        const att = attendanceSummaryForStudent(s.id, enr.batch_id);
        const records = attendanceRecordsForStudent(s.id, enr.batch_id).slice(0,10);
        return `<div class="card card-pad" style="margin-bottom:10px;">
          <div class="flex-between" style="margin-bottom:6px;flex-wrap:wrap;gap:6px;"><b style="font-size:13px;">${c?.name||'—'} <span class="cell-sub">(${batchName(enr.batch_id)})</span></b>${enr.type==='additional'?'<span class="badge badge-amber">Additional</span>':''}</div>
          <div class="flex-gap" style="align-items:center;gap:16px;margin-bottom:${records.length?'12px':'0'};">
            <div style="font-size:26px;font-weight:800;color:${att.effectiveTotal>0 && att.pct<70 ? 'var(--danger-600)':'var(--success-700)'};">${att.effectiveTotal>0?att.pct+'%':'—'}</div>
            <div class="cell-sub">${att.effectiveTotal>0 ? `${att.attended} attended out of ${att.effectiveTotal} sessions (${att.present} present, ${att.late} late, ${att.absent} absent, ${att.excused} excused)` : 'No attendance recorded yet for this batch.'}</div>
          </div>
          ${att.effectiveTotal>0 && att.pct<70 ? `<div class="badge badge-red" style="margin-bottom:12px;">${icon('alertCircle')} Low attendance — certificate may be blocked</div>` : ''}
          ${records.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Module</th><th>Status</th></tr></thead><tbody>
            ${records.map(r=>`<tr><td>${fmtDate(r.session.date)}</td><td>${DB.courses.flatMap(cc=>cc.modules).find(m=>m.id===r.session.module_id)?.title || 'General Session'}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}
          </tbody></table></div>` : ''}
        </div>`;
      }).join('');
    }
  } else if(tab==='payments'){
    body += `<div class="grid grid-3" style="margin-bottom:16px;">
      <div class="card card-pad" style="text-align:center;"><div style="font-size:15px;font-weight:800;">${fmtMoney(inv?.total)}</div><div class="cell-sub">Total Fee</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:15px;font-weight:800;color:var(--success-700);">${fmtMoney(inv?.paid)}</div><div class="cell-sub">Paid</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:15px;font-weight:800;color:${inv?.due>0?'var(--danger-600)':'var(--success-700)'};">${fmtMoney(inv?.due)}</div><div class="cell-sub">Due</div></div>
    </div>
    <h3 style="font-size:13px;margin-bottom:10px;">Payment History</h3>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>
    ${payments.length ? payments.map(p=>`<tr><td class="cell-strong">${p.receipt_no}</td><td>${fmtMoney(p.amount)}</td><td>${methodBadge(p.method)}</td><td>${fmtDate(p.date)}</td><td>${statusBadge(p.status)}</td><td><button class="btn btn-sm btn-ghost" data-action="view-receipt" data-id="${p.id}">${icon('printer')}</button></td></tr>`).join('') : `<tr><td colspan="6" class="muted">No payments yet.</td></tr>`}
    </tbody></table></div>
    <div class="hr"></div>
    ${effectivePerm(currentUserId,'Payments','Create') ? `<button class="btn btn-primary btn-sm" data-action="open-record-payment" data-studentid="${s.id}">${icon('plus')} Record New Payment</button>` : ''}`;
  }

  openDrawer({ title:s.name, sub:`${s.code} · ${s.phone}`, body });
}

function addStudentModal(){
  const activeCourses = DB.courses.filter(c=>c.status==='active');
  openModal({ size:'lg',
    title:'Register New Student', sub:'Staff-assisted registration — personal info, academic background & course assignment',
    body:`
    <div class="tabs" style="margin-bottom:14px;"><button class="tab-btn active">Personal Info</button><button class="tab-btn">Academic & Course</button><button class="tab-btn">Documents</button></div>
    <div class="form-grid">
      <div class="field"><label>Full Name *</label><input type="text" id="stName" placeholder="Student full name"></div>
      <div class="field"><label>Date of Birth</label><input type="date" id="stDob"></div>
      <div class="field"><label>Gender</label><select id="stGender"><option>Male</option><option>Female</option><option>Other</option></select></div>
      <div class="field"><label>NID / Birth Cert No.</label><input type="text" id="stNid"></div>
      <div class="field"><label>Phone (Portal Login) *</label><input type="text" id="stPhone" placeholder="01XXXXXXXXX"></div>
      <div class="field"><label>Email (optional)</label><input type="text" id="stEmail"></div>
      <div class="field span-2"><label>Present Address</label><input type="text" id="stPresentAddr"></div>
      <div class="field span-2"><label>Permanent Address</label><input type="text" id="stPermAddr"></div>
      <div class="field"><label>Institution *</label><select id="stInstitution">${DB.institutions.map(i=>`<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
      <div class="field"><label>Roll/Reg No.</label><input type="text" id="stRoll"></div>
      <div class="field"><label>Guardian Name</label><input type="text" id="stGuardianName"></div>
      <div class="field"><label>Guardian Phone</label><input type="text" id="stGuardianPhone"></div>
      <div class="field"><label>Course *</label><select id="stCourse" onchange="onAddStudentCourseChange()">${activeCourses.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="field"><label>Batch *</label><select id="stBatch"></select></div>
      <div class="field span-2"><div class="badge badge-blue" style="white-space:normal;text-align:left;">${icon('alertCircle')} A student can be actively enrolled in only ONE course & ONE batch through this form. Need to add a second course for this student? Do it afterwards from their profile → Courses tab → "Add Additional Course (Admin Override)" — it will be tagged and reasoned for history/reporting.</div></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-student">${icon('check')} Register Student</button>`
  });
  setTimeout(onAddStudentCourseChange, 0);
}
/* Batch list is scoped to the selected course and shows live seats-left (capped by the assigned lab); full batches are shown but disabled. */
function onAddStudentCourseChange(){
  const courseSel = document.getElementById('stCourse'); const batchSel = document.getElementById('stBatch');
  if(!courseSel || !batchSel) return;
  const batches = DB.batches.filter(b=>b.course_id===Number(courseSel.value) && b.status!=='completed');
  batchSel.innerHTML = batches.map(b=>{
    const seatsLeft = batchSeatsAvailable(b.id);
    return `<option value="${b.id}" ${seatsLeft<=0?'disabled':''}>${b.name} — ${labName(b.lab_id)} (${seatsLeft<=0?'FULL':seatsLeft+' seats left'})</option>`;
  }).join('') || '<option value="">No open batches for this course</option>';
}

function addAdditionalCourseModal(studentId){
  const sid = Number(studentId);
  const s = studentById(sid); if(!s) return;
  const activeCourses = DB.courses.filter(c=>c.status==='active');
  const options = activeCourses.flatMap(c => DB.batches.filter(b=>b.course_id===c.id && b.status!=='completed').map(b => {
    const seatsLeft = batchSeatsAvailable(b.id);
    return `<option data-courseid="${c.id}" data-batchid="${b.id}" data-price="${c.base_price}" ${seatsLeft<=0?'disabled':''}>${c.name} — ${b.name} (${seatsLeft<=0?'FULL':seatsLeft+' seats left'})</option>`;
  })).join('');
  openModal({
    title:'Add Additional Course (Admin Override)', sub:`${s.name} already has ${s.courses.length} enrollment(s) — this is a deliberate exception to the one-course rule`,
    body:`
    <div class="badge badge-amber" style="white-space:normal;text-align:left;margin-bottom:14px;">${icon('alertCircle')} This will be tagged as an <b>Additional</b> enrollment (not primary) and logged with your name, date & reason — visible in the student's history and in Reports for auditing multi-course students.</div>
    <div class="form-grid single">
      <div class="field"><label>Course & Batch *</label><select id="addlCourseSelect">${options}</select></div>
      <div class="field"><label>Reason for exception *</label><textarea id="addlCourseReason" placeholder="Why is this student being enrolled in more than one course?"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-additional-course" data-studentid="${sid}">${icon('check')} Add & Tag as Additional</button>`
  });
}

/* ---------------- ENROLLMENT REQUESTS (self-enrolled via Portal, awaiting Admin approval) ---------------- */
function renderEnrollmentRequests(){
  const pending = DB.enrollmentRequests.filter(r=>r.status==='pending');
  const resolved = DB.enrollmentRequests.filter(r=>r.status!=='pending').slice().reverse();
  const canApprove = effectivePerm(currentUserId,'Students','Approve');
  const rowsFor = (list, withActions)=> list.map(r=>{
    const s = studentById(r.student_id);
    return `<tr>
      <td>${avatarHtml(s?.name||'—','sm',s?.photo)}</td>
      <td><span class="cell-strong">${s?.name||'—'}</span><div class="cell-sub">${s?.phone||''}</div></td>
      <td>${courseName(r.course_id)}</td>
      <td>${sessionName(r.session_id)} · ${batchName(r.batch_id)}</td>
      <td>${r.payment_option==='pay_later' ? '<span class="badge badge-amber">Enroll w/o payment</span>' : '<span class="badge badge-blue">Paid Online</span>'}</td>
      <td>${fmtDate(r.requested_date)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${withActions
        ? (canApprove ? `<div class="flex-gap"><button class="btn btn-sm btn-success" data-action="approve-enrollment-request" data-id="${r.id}">${icon('check')} Approve</button><button class="btn btn-sm btn-danger" data-action="reject-enrollment-request" data-id="${r.id}">${icon('close')} Reject</button></div>` : `<span class="muted" style="font-size:12px;">Awaiting an Approver</span>`)
        : (r.reviewed_by ? userName(r.reviewed_by)+' · '+fmtDate(r.reviewed_date) : '—')}</td>
    </tr>`;
  }).join('');
  return `
  <div class="view-header">
    <div><h1>Enrollment Requests</h1><p>Students who self-enrolled via the portal without paying yet — approve to activate a due invoice, or reject</p></div>
  </div>
  ${!canApprove ? `<div class="badge badge-gray" style="margin-bottom:16px;">${icon('shield')} You can view requests here, but approving/rejecting requires the "Approve" permission on Students — managed by Admin via Access Control.</div>` : ''}
  <div class="grid grid-3" style="margin-bottom:20px;">
    ${kpiCard('clock','Pending Review', pending.length, null, '#f59e0b')}
    ${kpiCard('checkCircle','Approved (All Time)', DB.enrollmentRequests.filter(r=>r.status==='approved').length, null, '#10b981')}
    ${kpiCard('alertCircle','Rejected (All Time)', DB.enrollmentRequests.filter(r=>r.status==='rejected').length, null, '#ef4444')}
  </div>
  <h3 class="report-section-title">Pending Requests</h3>
  <div class="card" style="margin-bottom:26px;">
    <div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Student</th><th>Course</th><th>Session · Batch</th><th>Payment</th><th>Requested</th><th>Status</th><th></th></tr></thead>
    <tbody>${pending.length ? rowsFor(pending,true) : '<tr><td colspan="8" class="muted">No pending enrollment requests right now.</td></tr>'}</tbody></table></div>
  </div>
  <h3 class="report-section-title">Request History</h3>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Student</th><th>Course</th><th>Session · Batch</th><th>Payment</th><th>Requested</th><th>Status</th><th>Reviewed By</th></tr></thead>
    <tbody>${resolved.length ? rowsFor(resolved,false) : '<tr><td colspan="8" class="muted">No resolved requests yet.</td></tr>'}</tbody></table></div>
  </div>`;
}

/* ============================================================
   ATTENDANCE — real session-based marking, batch reports & an org-wide
   overview. Three tabs: Mark Attendance / Batch Report / All Batches
   Overview (last one hidden for teachers — they only see their own batches).
   ============================================================ */
let currentAttTab = 'mark';
let currentAttBatchId = null;
let currentAttDate = null;
let currentAttModuleId = null;
let currentAttMarks = {};

function attVisibleBatches(){ return scopedBatchesForUser(currentUserId).filter(b=>b.status!=='upcoming'); }

function renderAttendance(){
  const isScoped = isTeacherRole(currentUserId);
  currentAttTab = 'mark';
  currentAttDate = currentAttDate || TODAY;
  return `
  <div class="view-header">
    <div><h1>Attendance</h1><p>${isScoped ? 'Only your assigned batches are shown here' : 'Session-wise attendance marking, batch reports & low-attendance tracking'}</p></div>
  </div>
  ${isScoped ? `<div class="badge badge-amber" style="margin-bottom:16px;">${icon('shield')} You only have access to your assigned batches.</div>` : ''}
  <div class="tabs">
    <button class="tab-btn active" data-atttab="mark">Mark Attendance</button>
    <button class="tab-btn" data-atttab="batch">Batch Report</button>
    ${!isScoped ? `<button class="tab-btn" data-atttab="overview">All Batches Overview</button>` : ''}
  </div>
  <div id="attPane">${attendancePane('mark')}</div>`;
}
function wireAttendancePage(){
  document.querySelectorAll('[data-atttab]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-atttab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentAttTab = btn.dataset.atttab;
      document.getElementById('attPane').innerHTML = attendancePane(currentAttTab);
    });
  });
}
function attendancePane(tab){
  if(tab==='mark') return attendanceMarkPane();
  if(tab==='batch') return attendanceBatchReportPane();
  if(tab==='overview') return attendanceOverviewPane();
  return '';
}

function attendanceMarkPane(){
  const visibleBatches = attVisibleBatches();
  if(!visibleBatches.length) return `<div class="empty-state">${icon('batch')}<p>No batches available to mark attendance for.</p></div>`;
  if(!currentAttBatchId || !visibleBatches.some(b=>b.id===currentAttBatchId)) currentAttBatchId = visibleBatches[0].id;
  const batch = visibleBatches.find(b=>b.id===currentAttBatchId);
  const course = DB.courses.find(c=>c.id===batch.course_id);
  const moduleOptions = course ? course.modules : [];
  if(currentAttModuleId==null && moduleOptions.length) currentAttModuleId = moduleOptions[0].id;
  const roster = activeStudentsInBatch(batch.id);
  const existingSession = findAttendanceSession(batch.id, currentAttDate, currentAttModuleId);
  currentAttMarks = {};
  roster.forEach(s=>{
    const rec = existingSession ? DB.attendanceRecords.find(r=>r.session_id===existingSession.id && r.student_id===s.id) : null;
    currentAttMarks[s.id] = rec ? rec.status : 'present';
  });
  const rows = roster.map(s=>`
    <tr data-studentrow="${s.id}">
      <td>${avatarHtml(s.name,'sm',s.photo)}</td>
      <td class="cell-strong">${s.name}</td>
      <td>${s.code}</td>
      <td><div class="flex-gap">${['present','absent','late','excused'].map(st=>`<button class="btn btn-sm ${currentAttMarks[s.id]===st?'btn-primary':'btn-secondary'}" data-action="mark-attendance-cell" data-studentid="${s.id}" data-status="${st}" style="padding:5px 10px;">${st[0].toUpperCase()}</button>`).join('')}</div></td>
    </tr>`).join('');
  return `
  <div class="filter-bar">
    <select id="attBatchSelect" onchange="onAttendanceFilterChange()">${visibleBatches.map(b=>`<option value="${b.id}" ${b.id===batch.id?'selected':''}>${b.name} — ${courseName(b.course_id)}</option>`).join('')}</select>
    <input type="date" id="attDateInput" value="${currentAttDate}" onchange="onAttendanceFilterChange()">
    <select id="attModuleSelect" onchange="onAttendanceFilterChange()">${moduleOptions.length ? moduleOptions.map(m=>`<option value="${m.id}" ${m.id===currentAttModuleId?'selected':''}>${m.title}</option>`).join('') : '<option value="">General Session</option>'}</select>
    <span class="badge badge-blue">${icon('students')} ${roster.length} active students</span>
    ${existingSession ? `<span class="badge badge-green">${icon('checkCircle')} Already marked — editing</span>` : `<span class="badge badge-gray">${icon('alertCircle')} Not marked yet</span>`}
  </div>
  <div class="card">
    <div class="card-header"><h3>Mark Attendance — ${batch.name}</h3><p>${fmtDate(currentAttDate)}${moduleOptions.length ? ' · '+(moduleOptions.find(m=>m.id===currentAttModuleId)?.title||'') : ''} — click a status per student</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Student</th><th>Code</th><th>Mark</th></tr></thead>
    <tbody id="attSheetBody">${rows || `<tr><td colspan="4" class="muted">No active students enrolled in this batch.</td></tr>`}</tbody></table></div>
    <div class="card-pad" style="border-top:1px solid var(--gray-100);">
      <button class="btn btn-primary" data-action="save-attendance" data-batchid="${batch.id}" data-date="${currentAttDate}" data-moduleid="${currentAttModuleId||''}">${icon('check')} Save Attendance</button>
    </div>
  </div>`;
}
function onAttendanceFilterChange(){
  const selBatchId = Number(document.getElementById('attBatchSelect')?.value);
  const dateVal = document.getElementById('attDateInput')?.value;
  const modVal = document.getElementById('attModuleSelect')?.value;
  if(selBatchId && selBatchId !== currentAttBatchId){
    currentAttBatchId = selBatchId;
    currentAttModuleId = null; // switching batch/course — let the pane pick that course's first module
  } else {
    currentAttModuleId = modVal ? Number(modVal) : null;
  }
  if(dateVal) currentAttDate = dateVal;
  document.getElementById('attPane').innerHTML = attendancePane('mark');
}

function attendanceBatchReportPane(){
  const visibleBatches = attVisibleBatches();
  if(!visibleBatches.length) return `<div class="empty-state">${icon('batch')}<p>No batches available.</p></div>`;
  if(!currentAttBatchId || !visibleBatches.some(b=>b.id===currentAttBatchId)) currentAttBatchId = visibleBatches[0].id;
  const batch = visibleBatches.find(b=>b.id===currentAttBatchId);
  const summary = attendanceSummaryForBatch(batch.id);
  const rows = summary.rows.slice().sort((a,b)=>a.pct-b.pct).map(r=>`
    <tr class="row-link" data-action="view-student" data-id="${r.student.id}">
      <td class="cell-strong">${r.student.name}</td>
      <td>${r.student.code}</td>
      <td>${r.attended}/${r.effectiveTotal}</td>
      <td style="min-width:140px;"><div class="progress-track"><div class="progress-fill" style="width:${r.pct}%;${r.pct<70?'background:linear-gradient(90deg,#f87171,#ef4444);':''}"></div></div></td>
      <td>${r.pct}%</td>
      <td>${r.effectiveTotal===0 ? '<span class="muted">No data</span>' : (r.pct<70 ? statusBadge('absent','Low Attendance') : statusBadge('present','Good'))}</td>
    </tr>`).join('');
  return `
  <div class="filter-bar">
    <select id="attReportBatchSelect" onchange="onAttendanceReportBatchChange()">${visibleBatches.map(b=>`<option value="${b.id}" ${b.id===batch.id?'selected':''}>${b.name} — ${courseName(b.course_id)}</option>`).join('')}</select>
  </div>
  <div class="grid grid-3" style="margin-bottom:18px;">
    ${kpiCard('attendance','Batch Average', summary.avgPct+'%', null, summary.avgPct<70?'#ef4444':'#10b981')}
    ${kpiCard('calendar','Sessions Held', summary.sessionsHeld, null, '#8b5cf6')}
    ${kpiCard('alertCircle','Students Below 70%', summary.rows.filter(r=>r.effectiveTotal>0 && r.pct<70).length, null, '#f59e0b')}
  </div>
  <div class="card">
    <div class="card-header"><h3>Attendance % — ${batch.name}</h3><p>Auto-calculated from every marked session · click a row for the full student profile</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Code</th><th>Attended/Total</th><th>Progress</th><th>%</th><th>Flag</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="6" class="muted">No sessions recorded for this batch yet.</td></tr>`}</tbody></table></div>
  </div>`;
}
function onAttendanceReportBatchChange(){
  currentAttBatchId = Number(document.getElementById('attReportBatchSelect')?.value) || currentAttBatchId;
  document.getElementById('attPane').innerHTML = attendancePane('batch');
}

function attendanceOverviewPane(){
  const summaries = allBatchAttendanceSummaries();
  const low = lowAttendanceStudents();
  const orgAvg = summaries.length ? Math.round(sum(summaries, s=>s.avgPct)/summaries.length) : 0;
  return `
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('attendance','Org-wide Avg Attendance', orgAvg+'%', null, '#3b82f6')}
    ${kpiCard('batch','Batches Tracked', summaries.length, null, '#ff6533')}
    ${kpiCard('alertCircle','Students Below 70%', low.length, null, '#ef4444')}
    ${kpiCard('checkCircle','Sessions Held (Total)', sum(summaries,s=>s.sessionsHeld), null, '#10b981')}
  </div>
  <div class="card" style="margin-bottom:20px;">
    <div class="card-header"><h3>Attendance by Batch</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Batch</th><th>Course</th><th>Sessions Held</th><th>Avg Attendance</th><th></th></tr></thead><tbody>
    ${summaries.map(s=>`<tr><td class="cell-strong">${s.batch.name}</td><td>${courseName(s.batch.course_id)}</td><td>${s.sessionsHeld}</td><td>${s.avgPct<70?statusBadge('absent',s.avgPct+'%'):s.avgPct+'%'}</td><td><button class="btn btn-sm btn-outline" data-action="goto-attendance-batch" data-id="${s.batch.id}">${icon('eye')} View Report</button></td></tr>`).join('') || `<tr><td colspan="5" class="muted">No attendance recorded yet.</td></tr>`}
    </tbody></table></div>
  </div>
  <div class="card">
    <div class="card-header"><h3>Low-Attendance Students (Below 70%)</h3><p>Across all batches — may block certificate eligibility</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Batch</th><th>Attended/Total</th><th>%</th></tr></thead><tbody>
    ${low.length ? low.map(l=>`<tr class="row-link" data-action="view-student" data-id="${l.student.id}"><td class="cell-strong">${l.student.name}</td><td>${l.batch.name}</td><td>${l.attended}/${l.effectiveTotal}</td><td>${statusBadge('absent',l.pct+'%')}</td></tr>`).join('') : `<tr><td colspan="4" class="muted">No students below the threshold — great job!</td></tr>`}
    </tbody></table></div>
  </div>`;
}
