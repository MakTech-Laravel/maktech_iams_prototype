/* ============================================================
   Academic setup — Institutions, Departments & Courses, Batches & Classes
   ============================================================ */

/* ---------------- INSTITUTIONS ---------------- */
function renderInstitutions(){
  const cards = DB.institutions.map(i=>`
    <div class="card" style="padding:18px 20px;cursor:pointer;" data-action="view-institution" data-id="${i.id}">
      <div class="flex-between" style="margin-bottom:10px;">
        <div class="kpi-icon" style="background:var(--primary-50);color:var(--primary-600);">${ICONS.institution}</div>
        ${statusBadge(i.mou_status==='signed'?'signed':i.mou_status==='pending'?'pending':'none', i.mou_status==='signed'?'MOU Signed':i.mou_status==='pending'?'MOU Pending':'No MOU')}
      </div>
      <b style="font-size:14px;color:var(--gray-900);display:block;margin-bottom:4px;">${i.name}</b>
      <div class="cell-sub" style="margin-bottom:12px;">${i.type==='government'?'Government':'Private'} · ${i.address}</div>
      <div class="grid grid-3" style="gap:8px;text-align:center;">
        <div><div style="font-size:16px;font-weight:800;color:var(--gray-900);">${i.students}</div><div class="cell-sub">Students</div></div>
        <div><div style="font-size:16px;font-weight:800;color:var(--gray-900);">${i.activeLeads}</div><div class="cell-sub">Active Leads</div></div>
        <div><div style="font-size:13px;font-weight:800;color:var(--gray-900);">${fmtMoney(i.revenue)}</div><div class="cell-sub">Revenue</div></div>
      </div>
    </div>`).join('');
  return `
  <div class="view-header">
    <div><h1>Institutions (Polytechnics)</h1><p>Partner polytechnic institutes — profile, MOU status, department & performance</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-institution">${icon('plus')} Add Institution</button></div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('institution','Total Institutes', DB.institutions.length, null, '#ff6533')}
    ${kpiCard('checkCircle','MOU Signed', DB.institutions.filter(i=>i.mou_status==='signed').length, null, '#10b981')}
    ${kpiCard('students','Total Students Sourced', sum(DB.institutions,i=>i.students), null, '#06b6d4')}
    ${kpiCard('payment','Total Revenue Generated', fmtMoney(sum(DB.institutions,i=>i.revenue)), null, '#f59e0b')}
  </div>
  <div class="grid grid-3">${cards}</div>`;
}

function institutionDetailDrawer(id){
  const i = DB.institutions.find(x=>x.id===id); if(!i) return;
  const visits = DB.visits.filter(v=>v.institution_id===id);
  const students = DB.students.filter(s=>s.institution_id===id);
  openDrawer({
    title:i.name, sub:`${i.type==='government'?'Government':'Private'} Polytechnic Institute`,
    body:`
    <div class="flex-gap" style="margin-bottom:18px;">${statusBadge(i.mou_status==='signed'?'signed':i.mou_status==='pending'?'pending':'none', i.mou_status==='signed'?'MOU Signed':i.mou_status==='pending'?'MOU Pending':'No MOU')}<span class="badge badge-gray">${i.type}</span></div>
    <div class="form-grid" style="margin-bottom:20px;">
      <div class="field span-2"><label>Address</label><div>${i.address}</div></div>
      <div class="field"><label>Contact Person</label><div>${i.contact_person}</div></div>
      <div class="field"><label>Phone</label><div>${i.phone}</div></div>
      <div class="field span-2"><label>Email</label><div>${i.email}</div></div>
      <div class="field span-2"><label>Departments</label><div class="flex-gap" style="flex-wrap:wrap;">${i.departments.map(d=>`<span class="badge badge-purple">${d}</span>`).join('')}</div></div>
    </div>
    <div class="grid grid-3" style="margin-bottom:22px;">
      <div class="card card-pad" style="text-align:center;"><div style="font-size:20px;font-weight:800;">${i.students}</div><div class="cell-sub">Students Sourced</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:20px;font-weight:800;">${i.activeLeads}</div><div class="cell-sub">Active Leads</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:15px;font-weight:800;">${fmtMoney(i.revenue)}</div><div class="cell-sub">Revenue Generated</div></div>
    </div>
    <h3 style="font-size:13.5px;margin-bottom:10px;">Visit History</h3>
    <div class="timeline" style="margin-bottom:22px;">
      ${visits.length? visits.map(v=>`<div class="timeline-item"><div class="when">${fmtDate(v.visit_date)} · ${userName(v.visited_by)}</div><div class="what">${v.purpose}</div><div class="who">${v.outcome}</div></div>`).join('') : `<div class="muted" style="font-size:12.5px;">No visits logged yet.</div>`}
    </div>
    <h3 style="font-size:13.5px;margin-bottom:10px;">Students From This Institute</h3>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Course</th><th>Status</th></tr></thead><tbody>
    ${students.length ? students.map(s=>`<tr class="row-link" data-action="view-student" data-id="${s.id}"><td class="cell-strong">${s.name}</td><td>${courseName(s.courses[0]?.course_id)}</td><td>${statusBadge(s.status)}</td></tr>`).join('') : `<tr><td colspan="3" class="muted">No students yet.</td></tr>`}
    </tbody></table></div>
    `
  });
}

function addInstitutionModal(){
  openModal({
    title:'Add Institution', sub:'Register a new partner polytechnic',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Institution Name *</label><input type="text" placeholder="e.g. Sylhet Polytechnic Institute"></div>
      <div class="field"><label>Type *</label><select><option>Government</option><option>Private</option></select></div>
      <div class="field"><label>MOU Status</label><select><option>None</option><option>Pending</option><option>Signed</option></select></div>
      <div class="field span-2"><label>Address</label><input type="text" placeholder="Full address"></div>
      <div class="field"><label>Contact Person</label><input type="text" placeholder="Principal / coordinator name"></div>
      <div class="field"><label>Contact Phone</label><input type="text" placeholder="01XXXXXXXXX"></div>
      <div class="field span-2"><label>Contact Email</label><input type="text" placeholder="office@institute.edu.bd"></div>
      <div class="field span-2"><label>Departments (comma separated)</label><input type="text" placeholder="Computer Technology, Electrical Technology"></div>
      <div class="field span-2"><label>MOU Document</label><div class="flex-gap" style="border:1.5px dashed var(--gray-300);border-radius:10px;padding:14px;justify-content:center;color:var(--gray-400);">${icon('upload')} Upload MOU document (demo)</div></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-institution">${icon('check')} Save Institution</button>`
  });
}

/* ---------------- DEPARTMENTS & COURSES ---------------- */
function renderCourses(){
  const deptCards = DB.departments.map(d=>{
    const courses = DB.courses.filter(c=>c.dept_id===d.id);
    return `<div class="card card-pad">
      <div class="flex-gap" style="margin-bottom:6px;"><div class="kpi-icon" style="width:32px;height:32px;background:var(--primary-50);color:var(--primary-600);">${ICONS.course}</div><b>${d.name}</b></div>
      <div class="cell-sub" style="margin-bottom:8px;">${d.desc}</div>
      <div class="badge badge-blue">${courses.length} course${courses.length!==1?'s':''}</div>
    </div>`;
  }).join('');

  const courseRows = DB.courses.map(c=>{
    const disc = c.discounts[0];
    return `<tr class="row-link" data-action="view-course" data-id="${c.id}">
      <td><span class="cell-strong">${c.name}</span><div class="cell-sub">${c.code}</div></td>
      <td>${deptName(c.dept_id)}</td>
      <td>${c.duration_days} days</td>
      <td>${fmtMoney(c.base_price)}</td>
      <td>${disc ? `<span class="badge badge-amber">${disc.type==='percentage'?disc.value+'%':fmtMoney(disc.value)}</span>` : '<span class="muted">—</span>'}</td>
      <td>${c.enrolled}/${c.seats}</td>
      <td>${statusBadge(c.status)}</td>
    </tr>`;
  }).join('');

  return `
  <div class="view-header">
    <div><h1>Departments & Courses</h1><p>Internal departments, course catalogue, pricing & discount rules</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm" data-action="open-add-department">${icon('plus')} Add Department</button>
      <button class="btn btn-primary btn-sm" data-action="open-add-course">${icon('plus')} Add Course</button>
    </div>
  </div>
  <h3 class="report-section-title">Departments</h3>
  <div class="grid grid-4" style="margin-bottom:8px;">${deptCards}</div>

  <h3 class="report-section-title">Course Catalogue</h3>
  <div class="filter-bar">
    <div class="search-input-wrap">${icon('search')}<input type="text" placeholder="Search course name or code…"></div>
    <select><option>All Departments</option>${DB.departments.map(d=>`<option>${d.name}</option>`).join('')}</select>
    <select><option>All Status</option><option>Active</option><option>Draft</option><option>Archived</option></select>
  </div>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Course</th><th>Department</th><th>Duration</th><th>Base Price</th><th>Discount</th><th>Seats</th><th>Status</th></tr></thead>
    <tbody>${courseRows}</tbody></table></div>
  </div>`;
}

function courseDetailModal(id){
  const c = DB.courses.find(x=>x.id===id); if(!c) return;
  const sessions = sessionsForCourse(c.id);
  openModal({ size:'lg',
    title:c.name, sub:`${c.code} · ${deptName(c.dept_id)}`,
    body:`
    <div class="flex-gap" style="margin-bottom:10px;flex-wrap:wrap;">${statusBadge(c.status)}<span class="badge badge-blue">${c.duration_days} days</span><span class="badge badge-gray">${c.enrolled}/${c.seats} seats filled</span></div>
    ${(()=>{ const teacherIds=[...new Set(DB.batches.filter(b=>b.course_id===c.id).flatMap(b=>b.assigned_teachers||[]))]; return teacherIds.length? `<div class="flex-gap" style="margin-bottom:14px;flex-wrap:wrap;"><span class="cell-sub">Teachers across this course's batches:</span>${teacherIds.map(tid=>`<span class="badge badge-purple">${userName(tid)}</span>`).join(' ')}</div>` : ''; })()}
    <p class="muted" style="font-size:13px;margin-bottom:18px;">${c.desc}</p>
    <div class="grid grid-3" style="margin-bottom:20px;">
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;">${fmtMoney(c.base_price)}</div><div class="cell-sub">Base Price</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;">${c.discounts.length}</div><div class="cell-sub">Active Discount Rules</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;">${c.modules.length}</div><div class="cell-sub">Curriculum Modules</div></div>
    </div>
    <div class="flex-between" style="margin-bottom:8px;"><h3 style="font-size:13px;margin:0;">Sessions</h3><button class="btn btn-sm btn-outline" onclick="closeModal()" data-action="open-add-session" data-courseid="${c.id}">${icon('plus')} Add Session</button></div>
    <div class="table-wrap" style="margin-bottom:20px;"><table class="data-table"><thead><tr><th>Session</th><th>Duration</th><th>Batches</th><th>Status</th></tr></thead><tbody>
    ${sessions.length ? sessions.map(s=>`<tr class="row-link" data-action="view-session" data-id="${s.id}" onclick="closeModal()"><td class="cell-strong">${s.name}</td><td>${fmtDate(s.start)} → ${fmtDate(s.end)}</td><td>${batchesInSession(s.id).length}</td><td>${statusBadge(s.status)}</td></tr>`).join('') : `<tr><td colspan="4" class="muted">No sessions yet — add one to start creating batches.</td></tr>`}
    </tbody></table></div>
    ${c.discounts.length ? `<h3 style="font-size:13px;margin-bottom:8px;">Discount Rules</h3>
    <div class="table-wrap" style="margin-bottom:20px;"><table class="data-table"><thead><tr><th>Type</th><th>Value</th><th>Reason</th><th>Valid Period</th></tr></thead><tbody>
    ${c.discounts.map(d=>`<tr><td>${d.type}</td><td>${d.type==='percentage'?d.value+'%':fmtMoney(d.value)}</td><td>${d.reason}</td><td>${fmtDate(d.from)} – ${fmtDate(d.to)}</td></tr>`).join('')}
    </tbody></table></div>` : ''}
    <div class="flex-between" style="margin-bottom:8px;"><h3 style="font-size:13px;margin:0;">Curriculum Modules (Sequenced)</h3>${effectivePerm(currentUserId,'Courses','Edit') ? `<button class="btn btn-sm btn-outline" onclick="closeModal()" data-action="open-manage-curriculum" data-id="${c.id}">${icon('edit')} Manage Curriculum</button>` : ''}</div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Module</th><th>Duration</th></tr></thead><tbody>
    ${c.modules.length ? c.modules.map(m=>`<tr><td>${m.seq}</td><td class="cell-strong">${m.title}</td><td>${m.hours} hrs</td></tr>`).join('') : `<tr><td colspan="3" class="muted">No curriculum modules yet — click "Manage Curriculum" to add some. Students will see these on their portal's module progress tracker.</td></tr>`}
    </tbody></table></div>
    `,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button>${effectivePerm(currentUserId,'Courses','Edit') ? `<button class="btn btn-outline" data-action="open-edit-course" data-id="${c.id}" onclick="closeModal()">${icon('edit')} Edit Course</button>` : ''}`
  });
}

/* ---------------- Curriculum module rows — shared by "Manage Curriculum" (existing course) and
   "Add New Course" (starting curriculum). Rows are plain DOM elements read back on save/reorder, so
   editing stays snappy without re-diffing against DB.courses on every keystroke. ---------------- */
function curriculumRowHtml(m, idx, total, containerId){
  return `<div class="curriculum-row" data-modid="${m.id ?? ''}">
    <div class="cur-seq">${idx+1}</div>
    <div class="cur-move">
      <button type="button" class="icon-btn sm" title="Move up" data-action="move-module-row" data-container="${containerId}" data-dir="up" data-idx="${idx}" ${idx===0?'disabled':''}>${icon('arrowUp')}</button>
      <button type="button" class="icon-btn sm" title="Move down" data-action="move-module-row" data-container="${containerId}" data-dir="down" data-idx="${idx}" ${idx===total-1?'disabled':''}>${icon('arrowDown')}</button>
    </div>
    <div class="field" style="flex:1;margin-bottom:0;"><input type="text" class="cur-title" placeholder="Module title *" value="${m.title||''}"></div>
    <div class="field" style="width:120px;margin-bottom:0;"><input type="number" class="cur-hours" placeholder="Hours" value="${m.hours||''}"></div>
    <button type="button" class="icon-btn sm danger" title="Remove module" data-action="remove-module-row" data-container="${containerId}" data-idx="${idx}">${icon('close')}</button>
  </div>`;
}
function moduleRowsFromDom(containerId){
  return [...document.querySelectorAll('#'+containerId+' .curriculum-row')].map(row=>({
    id: row.dataset.modid ? Number(row.dataset.modid) : null,
    title: row.querySelector('.cur-title').value.trim(),
    hours: Number(row.querySelector('.cur-hours').value) || 0,
  }));
}
function renderModuleRows(containerId, rows){
  const el = document.getElementById(containerId); if(!el) return;
  el.innerHTML = rows.length ? rows.map((m,i)=>curriculumRowHtml(m,i,rows.length,containerId)).join('')
    : `<p class="muted" style="font-size:12.5px;margin:4px 0 0;">No modules added yet.</p>`;
}

function curriculumModal(id){
  const c = DB.courses.find(x=>x.id===id); if(!c) return;
  openModal({ size:'lg',
    title:'Manage Curriculum', sub:`${c.name} — modules students track progress against on their portal`,
    body:`
    <div class="badge badge-blue" style="white-space:normal;margin-bottom:16px;">${icon('notification')} Adding or removing a module here instantly updates what every enrolled student sees under "Module Progress" on their portal.</div>
    <div id="curriculumRows">${c.modules.length ? c.modules.map((m,i)=>curriculumRowHtml(m,i,c.modules.length,'curriculumRows')).join('') : `<p class="muted" style="font-size:12.5px;margin:4px 0 0;">No modules added yet.</p>`}</div>
    <button type="button" class="btn btn-outline btn-sm" style="margin-top:6px;" data-action="add-module-row" data-container="curriculumRows">${icon('plus')} Add Module</button>
    `,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-curriculum" data-id="${c.id}">${icon('check')} Save Curriculum</button>`
  });
}

function editCourseModal(id){
  const c = DB.courses.find(x=>x.id===id); if(!c) return;
  openModal({ size:'lg',
    title:'Edit Course', sub:`${c.code} · ${c.name}`,
    body:`<div class="form-grid">
      <div class="field span-2"><label>Course Name *</label><input type="text" id="ecName" value="${c.name}"></div>
      <div class="field"><label>Course Code *</label><input type="text" id="ecCode" value="${c.code}"></div>
      <div class="field"><label>Department *</label><select id="ecDept">${DB.departments.map(d=>`<option value="${d.id}" ${d.id===c.dept_id?'selected':''}>${d.name}</option>`).join('')}</select></div>
      <div class="field"><label>Duration (days) *</label><input type="number" id="ecDuration" value="${c.duration_days}"></div>
      <div class="field"><label>Base Price (BDT) *</label><input type="number" id="ecPrice" value="${c.base_price}"></div>
      <div class="field"><label>Seat Capacity</label><input type="number" id="ecSeats" value="${c.seats}"></div>
      <div class="field"><label>Status</label><select id="ecStatus">${['draft','active','archived'].map(s=>`<option value="${s}" ${s===c.status?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
      <div class="field span-2"><label>Description</label><textarea id="ecDesc">${c.desc||''}</textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-course-edit" data-id="${c.id}">${icon('check')} Save Changes</button>`
  });
}

function addCourseModal(){
  openModal({ size:'lg',
    title:'Add New Course', sub:'Define course pricing, duration, department & starting curriculum',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Course Name *</label><input type="text" id="ncName" placeholder="e.g. Industrial Attachment — IoT & Embedded Systems"></div>
      <div class="field"><label>Course Code *</label><input type="text" id="ncCode" placeholder="e.g. CIT-104"></div>
      <div class="field"><label>Department *</label><select id="ncDept">${DB.departments.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
      <div class="field"><label>Duration (days) *</label><input type="number" id="ncDuration" placeholder="90"></div>
      <div class="field"><label>Base Price (BDT) *</label><input type="number" id="ncPrice" placeholder="18000"></div>
      <div class="field"><label>Seat Capacity</label><input type="number" id="ncSeats" placeholder="40"></div>
      <div class="field"><label>Status</label><select id="ncStatus"><option value="draft">Draft</option><option value="active">Active</option></select></div>
      <div class="field span-2"><label>Description</label><textarea id="ncDesc" placeholder="Course overview & objectives"></textarea></div>
      <div class="field span-2"><label class="hint" style="text-transform:none;font-weight:800;color:var(--gray-700);font-size:12.5px;">Discount Rule (optional)</label></div>
      <div class="field"><label>Discount Type</label><select id="ncDiscType"><option value="none">None</option><option value="percentage">Percentage</option><option value="flat">Flat</option></select></div>
      <div class="field"><label>Discount Value</label><input type="number" id="ncDiscValue" placeholder="10"></div>
      <div class="field span-2"><label>Reason</label><input type="text" id="ncDiscReason" placeholder="e.g. Early bird offer"></div>
    </div>
    <div class="hr"></div>
    <label class="hint" style="text-transform:none;font-weight:800;color:var(--gray-700);font-size:12.5px;display:block;margin-bottom:10px;">Curriculum Modules (optional — you can also add these later from "Manage Curriculum")</label>
    <div id="newCourseModuleRows"><p class="muted" style="font-size:12.5px;margin:4px 0 0;">No modules added yet.</p></div>
    <button type="button" class="btn btn-outline btn-sm" style="margin-top:6px;" data-action="add-module-row" data-container="newCourseModuleRows">${icon('plus')} Add Module</button>
    `,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-course">${icon('check')} Save Course</button>`
  });
}

function addDepartmentModal(){
  openModal({
    title:'Add Department', sub:'Create a new internal department',
    body:`<div class="form-grid single">
      <div class="field"><label>Department Name *</label><input type="text" placeholder="e.g. Renewable Energy"></div>
      <div class="field"><label>Description</label><textarea placeholder="What courses does this department offer?"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-department">${icon('check')} Save Department</button>`
  });
}

/* ---------------- COURSE SESSIONS (Course → Session → Batches) ---------------- */
function renderSessions(){
  const rows = DB.sessions.map(s=>{
    const batches = batchesInSession(s.id);
    return `<tr class="row-link" data-action="view-session" data-id="${s.id}">
      <td class="cell-strong">${s.name}</td>
      <td>${courseName(s.course_id)}</td>
      <td>${fmtDate(s.start)} → ${fmtDate(s.end)}</td>
      <td>${batches.length} batch${batches.length!==1?'es':''}</td>
      <td>${sum(batches,b=>batchEnrolledCount(b.id))} students</td>
      <td>${statusBadge(s.status)}</td>
    </tr>`;
  }).join('');
  return `
  <div class="view-header">
    <div><h1>Course Sessions</h1><p>Group batches under a session/term for each course — e.g. "Session 2026-A"</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-session">${icon('plus')} Add Session</button></div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('calendar','Total Sessions', DB.sessions.length, null, '#ff6533')}
    ${kpiCard('checkCircle','Ongoing Sessions', DB.sessions.filter(s=>s.status==='ongoing').length, null, '#10b981')}
    ${kpiCard('batch','Upcoming Sessions', DB.sessions.filter(s=>s.status==='upcoming').length, null, '#06b6d4')}
    ${kpiCard('students','Total Batches Across Sessions', DB.batches.length, null, '#f59e0b')}
  </div>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Session</th><th>Course</th><th>Duration</th><th>Batches</th><th>Students</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>`;
}

function sessionDetailModal(id){
  const s = DB.sessions.find(x=>x.id===id); if(!s) return;
  const batches = batchesInSession(s.id);
  openModal({ size:'lg',
    title:s.name, sub:`${courseName(s.course_id)} · ${fmtDate(s.start)} → ${fmtDate(s.end)}`,
    body:`
    <div class="flex-gap" style="margin-bottom:18px;">${statusBadge(s.status)}<span class="badge badge-gray">${batches.length} batch${batches.length!==1?'es':''}</span><span class="badge badge-blue">${sum(batches,b=>batchEnrolledCount(b.id))} students total</span></div>
    <div class="flex-between" style="margin-bottom:8px;"><h3 style="font-size:13px;margin:0;">Batches in this Session</h3><button class="btn btn-sm btn-primary" onclick="closeModal()" data-action="open-add-batch" data-sessionid="${s.id}">${icon('plus')} Add Batch</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Batch</th><th>Assigned Teacher(s)</th><th>Lab</th><th>Capacity</th><th>Status</th></tr></thead><tbody>
    ${batches.length ? batches.map(b=>`<tr class="row-link" data-action="view-batch" data-id="${b.id}" onclick="closeModal()"><td class="cell-strong">${b.name}</td><td>${(b.assigned_teachers||[]).map(tid=>userName(tid)).join(', ')||'—'}</td><td>${labName(b.lab_id)}</td><td>${batchEnrolledCount(b.id)}/${effectiveBatchCapacity(b)}</td><td>${statusBadge(b.status)}</td></tr>`).join('') : `<tr><td colspan="5" class="muted">No batches yet in this session — add one to start enrolling students.</td></tr>`}
    </tbody></table></div>
    `,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-outline" data-action="view-course" data-id="${s.course_id}" onclick="closeModal()">${icon('course')} View Course</button>`
  });
}

function addSessionModal(courseId){
  openModal({
    title:'Add Session', sub:'Create a new intake session/term under a course',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Course *</label><select id="sessionCourseSelect">${DB.courses.map(c=>`<option value="${c.id}" ${c.id==courseId?'selected':''}>${c.name}</option>`).join('')}</select></div>
      <div class="field"><label>Session Name *</label><input type="text" placeholder="e.g. Session 2026-C"></div>
      <div class="field"><label>Status</label><select><option>Upcoming</option><option>Ongoing</option></select></div>
      <div class="field"><label>Start Date *</label><input type="date"></div>
      <div class="field"><label>End Date *</label><input type="date"></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-session">${icon('check')} Create Session</button>`
  });
}

/* ---------------- BATCHES & CLASS SCHEDULE ---------------- */
function renderBatches(){
  const visibleBatches = scopedBatchesForUser(currentUserId);
  const isScoped = isTeacherRole(currentUserId);
  const rows = visibleBatches.map(b=>{
    const seatsLeft = batchSeatsAvailable(b.id);
    return `
    <tr>
      <td class="row-link cell-strong" data-action="view-batch" data-id="${b.id}">${b.name}</td>
      <td>${courseName(b.course_id)}</td>
      <td>${sessionName(b.session_id)}</td>
      <td>${fmtDate(b.start)} → ${fmtDate(b.end)}</td>
      <td>${(b.assigned_teachers||[]).map(tid=>`<span class="badge badge-purple" style="margin:1px;">${userName(tid)}</span>`).join(' ') || '<span class="muted">Unassigned</span>'}</td>
      <td>${labName(b.lab_id)}</td>
      <td>${batchEnrolledCount(b.id)}/${effectiveBatchCapacity(b)} ${b.status!=='completed' && seatsLeft<=0 ? '<span class="badge badge-red">Full</span>' : ''}</td>
      <td>${statusBadge(b.status)}</td>
      <td>${effectivePerm(currentUserId,'Batches','Edit') ? `<button class="btn btn-sm btn-ghost" title="Assign/manage teachers" data-action="open-manage-teachers" data-id="${b.id}">${icon('user')}</button><button class="btn btn-sm btn-ghost" title="Edit batch" data-action="open-edit-batch" data-id="${b.id}">${icon('edit')}</button>` : ''}</td>
    </tr>`;
  }).join('');

  const todaySchedule = DB.classSchedule.filter(c=>visibleBatches.some(b=>b.id===c.batch_id)).filter(c=>c.date==='2026-08-06'||c.date==='2026-08-07');
  const scheduleRows = todaySchedule.map(c=>`
    <tr><td>${fmtDate(c.date)}</td><td class="cell-strong">${c.start} – ${c.end}</td><td>${batchName(c.batch_id)}</td><td>${DB.courses.find(co=>co.modules.some(m=>m.id===c.module_id))?.modules.find(m=>m.id===c.module_id)?.title||'—'}</td><td>${userName(c.teacher_id)}</td><td>${c.room}</td><td>${statusBadge(c.mode==='online'?'active':'ongoing', c.mode)}</td></tr>
  `).join('');

  return `
  <div class="view-header">
    <div><h1>Batches & Class Schedule</h1><p>${isScoped ? 'Showing only the batches assigned to you' : 'Batch/class structure, teacher assignment & timetable management'}</p></div>
    <div class="view-actions">${effectivePerm(currentUserId,'Batches','Create') ? `<button class="btn btn-primary btn-sm" data-action="open-add-batch">${icon('plus')} Create Batch</button>` : ''}</div>
  </div>
  ${isScoped ? `<div class="badge badge-amber" style="margin-bottom:16px;">${icon('shield')} You only have access to your assigned batches/courses. Ask an Admin to grant more access via Access Control.</div>` : ''}
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('batch','Ongoing Batches', visibleBatches.filter(b=>b.status==='ongoing').length, null, '#ff6533')}
    ${kpiCard('calendar','Upcoming Batches', visibleBatches.filter(b=>b.status==='upcoming').length, null, '#06b6d4')}
    ${kpiCard('checkCircle','Completed Batches', visibleBatches.filter(b=>b.status==='completed').length, null, '#10b981')}
    ${kpiCard('students','Total Enrolled (Active)', sum(visibleBatches.filter(b=>b.status!=='completed'),b=>batchEnrolledCount(b.id)), null, '#f59e0b')}
  </div>
  ${!isScoped ? labsSectionHtml() : ''}
  <div class="card mb-0" style="margin-bottom:20px;">
    <div class="card-header"><h3>${isScoped?'My Batches':'All Batches'}</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Batch</th><th>Course</th><th>Session</th><th>Duration</th><th>Assigned Teacher(s)</th><th>Lab</th><th>Enrolled/Capacity</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>
  <div class="card">
    <div class="card-header"><h3>Class Timetable — Aug 6–7, 2026</h3><p>Session-wise room booking to avoid double-booking</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Time</th><th>Batch</th><th>Module Covered</th><th>Teacher</th><th>Room</th><th>Mode</th></tr></thead>
    <tbody>${scheduleRows}</tbody></table></div>
  </div>`;
}

function manageTeachersModal(batchId){
  const b = DB.batches.find(x=>x.id===batchId); if(!b) return;
  const teachers = DB.users.filter(u=>u.role_id===5);
  const canPay = effectivePerm(currentUserId,'TeacherPayments','Edit');
  openModal({
    title:`Assign Teachers — ${b.name}`, sub:`${courseName(b.course_id)} · Assigned teachers can ONLY access this batch (not the whole system)`,
    body:`<div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Teacher</th><th>Role</th><th style="text-align:center;">Assigned</th>${canPay?'<th>Pay Rate</th>':''}</tr></thead><tbody>
      ${teachers.map(t=>{ const assigned = (b.assigned_teachers||[]).includes(t.id); const rate = payRateFor(t.id, b.id);
        return `<tr><td>${avatarHtml(t.name,'sm',t.photo)}</td><td class="cell-strong">${t.name}</td><td>${roleName(t.role_id)}</td>
        <td style="text-align:center;"><input type="checkbox" ${assigned?'checked':''} data-action="toggle-batch-teacher" data-batchid="${b.id}" data-teacherid="${t.id}"></td>
        ${canPay ? `<td>${assigned ? `<button class="btn btn-sm btn-ghost" onclick="closeModal()" data-action="open-set-payrate" data-teacherid="${t.id}" data-batchid="${b.id}">${rate?fmtMoney(rate.rate_amount)+' '+PAY_RATE_TYPE_LABELS[rate.rate_type]:icon('plus')+' Set Rate'}</button>` : '<span class="muted">—</span>'}</td>` : ''}
        </tr>`; }).join('')}
    </tbody></table></div>
    <div class="hr"></div>
    <div class="cell-sub">Current coordinator (primary contact): <b>${userName(b.coordinator_id)}</b></div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button>${canPay?`<button class="btn btn-outline" onclick="closeModal()" data-action="go-view" data-view="teacher-payments">${icon('graduationCap')} Open Teacher Payments</button>`:''}<button class="btn btn-primary" data-action="save-teacher-assignment">${icon('check')} Done</button>`
  });
}

function batchDetailModal(id){
  const b = DB.batches.find(x=>x.id===id); if(!b) return;
  const course = DB.courses.find(c=>c.id===b.course_id);
  const roster = DB.students.filter(s=>s.courses.some(sc=>sc.batch_id===id));
  const seatsLeft = batchSeatsAvailable(b.id);
  openModal({ size:'lg',
    title:b.name, sub:`${course.name} · ${sessionName(b.session_id)} · ${labName(b.lab_id)}`,
    body:`
    <div class="flex-gap" style="margin-bottom:10px;flex-wrap:wrap;">${statusBadge(b.status)}<span class="badge badge-gray">${fmtDate(b.start)} → ${fmtDate(b.end)}</span><span class="badge badge-blue">Coordinator: ${userName(b.coordinator_id)}</span>${b.status!=='completed' ? (seatsLeft>0 ? `<span class="badge badge-green">${icon('checkCircle')} ${seatsLeft} seat${seatsLeft!==1?'s':''} left</span>` : `<span class="badge badge-red">${icon('alertCircle')} Full</span>`) : ''}</div>
    <div class="flex-gap" style="margin-bottom:16px;flex-wrap:wrap;"><span class="cell-sub">Assigned teachers:</span>${(b.assigned_teachers||[]).map(tid=>`<span class="badge badge-purple">${userName(tid)}</span>`).join(' ')||'<span class="muted">None</span>'}
      <button class="btn btn-sm btn-ghost" data-action="open-manage-teachers" data-id="${b.id}" onclick="closeModal()">${icon('edit')} Manage</button></div>
    <div class="grid grid-3" style="margin-bottom:20px;">
      <div class="card card-pad" style="text-align:center;"><div style="font-size:18px;font-weight:800;">${batchEnrolledCount(b.id)}/${effectiveBatchCapacity(b)}</div><div class="cell-sub">Enrolled · ${labName(b.lab_id)}</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:18px;font-weight:800;">${attendanceSummaryForBatch(b.id).avgPct}%</div><div class="cell-sub">Avg Attendance</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:18px;font-weight:800;">${course.modules.length}</div><div class="cell-sub">Modules</div></div>
    </div>
    <h3 style="font-size:13px;margin-bottom:8px;">Student Roster</h3>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Code</th><th>Attendance</th><th>Status</th></tr></thead><tbody>
    ${roster.length ? roster.map(s=>{
      const att = attendanceSummaryForStudent(s.id, b.id);
      return `<tr class="row-link" data-action="view-student" data-id="${s.id}"><td class="cell-strong">${s.name}</td><td>${s.code}</td><td>${att.effectiveTotal>0?att.pct+'%':'—'}</td><td>${statusBadge(s.status)}</td></tr>`;
    }).join('') : `<tr><td colspan="4" class="muted">No students in this batch view (demo subset).</td></tr>`}
    </tbody></table></div>
    `,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button>${effectivePerm(currentUserId,'Batches','Edit')?`<button class="btn btn-outline" data-action="open-edit-batch" data-id="${b.id}" onclick="closeModal()">${icon('edit')} Edit Batch</button>`:''}${effectivePerm(currentUserId,'TeacherPayments','View')?`<button class="btn btn-outline" data-action="go-view" data-view="teacher-payments">${icon('graduationCap')} Teacher Payments</button>`:''}<button class="btn btn-outline" data-action="go-view" data-view="attendance">${icon('attendance')} Mark Attendance</button>`
  });
}

/* ---------------- LABS / CLASSROOMS (dynamic — create with capacity, edit, and see which batches use them) ---------------- */
function labsSectionHtml(){
  const canEdit = effectivePerm(currentUserId,'Batches','Edit');
  const canCreate = effectivePerm(currentUserId,'Batches','Create');
  const rows = DB.labs.map(l=>{
    const usingBatches = batchesUsingLab(l.id);
    return `<tr>
      <td class="cell-strong">${l.name}</td>
      <td>${l.location||'—'}</td>
      <td>${l.capacity} seats</td>
      <td>${usingBatches.length ? usingBatches.map(b=>`<span class="badge badge-blue" style="margin:1px;">${b.name}</span>`).join(' ') : '<span class="muted">Unassigned</span>'}</td>
      <td>${statusBadge(l.status)}</td>
      <td>${canEdit ? `<button class="btn btn-sm btn-ghost" title="Edit lab" data-action="open-edit-lab" data-id="${l.id}">${icon('edit')}</button>` : ''}</td>
    </tr>`;
  }).join('');
  return `
  <div class="card mb-0" style="margin-bottom:20px;">
    <div class="card-header"><div><h3>${icon('flask')} Labs / Classrooms</h3><p>Create labs with a fixed seat capacity — assign one to each batch below so student intake is automatically capped</p></div>${canCreate ? `<button class="btn btn-outline btn-sm" data-action="open-add-lab">${icon('plus')} Add Lab</button>` : ''}</div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Lab</th><th>Location</th><th>Capacity</th><th>Batches Using It</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="6" class="muted">No labs created yet.</td></tr>`}</tbody></table></div>
  </div>`;
}
function addLabModal(){
  openModal({
    title:'Add Lab / Classroom', sub:'Define a physical space with a fixed seat capacity',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Lab / Room Name *</label><input type="text" id="nlName" placeholder="e.g. Lab-4"></div>
      <div class="field"><label>Capacity (seats) *</label><input type="number" id="nlCapacity" placeholder="35"></div>
      <div class="field"><label>Location</label><input type="text" id="nlLocation" placeholder="e.g. Main Building, 2nd Floor"></div>
      <div class="field span-2"><label>Notes</label><input type="text" id="nlNotes" placeholder="Optional — equipment, purpose, etc."></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-lab">${icon('check')} Save Lab</button>`
  });
}
function editLabModal(id){
  const l = labById(id); if(!l) return;
  const usingBatches = batchesUsingLab(l.id);
  openModal({
    title:'Edit Lab / Classroom', sub:l.name,
    body:`${usingBatches.length ? `<div class="badge badge-amber" style="white-space:normal;text-align:left;margin-bottom:14px;">${icon('alertCircle')} Currently assigned to ${usingBatches.length} active batch${usingBatches.length!==1?'es':''} (${usingBatches.map(b=>b.name).join(', ')}). Reducing capacity below a batch's current enrollment will immediately block further registrations into that batch.</div>` : ''}
    <div class="form-grid">
      <div class="field span-2"><label>Lab / Room Name *</label><input type="text" id="elName" value="${l.name}"></div>
      <div class="field"><label>Capacity (seats) *</label><input type="number" id="elCapacity" value="${l.capacity}"></div>
      <div class="field"><label>Status</label><select id="elStatus"><option value="active" ${l.status==='active'?'selected':''}>Active</option><option value="inactive" ${l.status==='inactive'?'selected':''}>Inactive (not selectable for new batches)</option></select></div>
      <div class="field"><label>Location</label><input type="text" id="elLocation" value="${l.location||''}"></div>
      <div class="field span-2"><label>Notes</label><input type="text" id="elNotes" value="${l.notes||''}"></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-lab-edit" data-id="${l.id}">${icon('check')} Save Changes</button>`
  });
}

function addBatchModal(sessionId){
  const labs = activeLabs();
  openModal({
    title:'Create New Batch', sub:'Set up a batch/class group inside a course session — capacity is automatically capped by the assigned lab',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Session *</label><select id="nbSession">${DB.courses.map(c=>{
        const opts = sessionsForCourse(c.id).map(s=>`<option value="${s.id}" ${s.id==sessionId?'selected':''}>${s.name}</option>`).join('');
        return opts ? `<optgroup label="${c.name}">${opts}</optgroup>` : '';
      }).join('')}</select></div>
      <div class="field"><label>Batch Name *</label><input type="text" id="nbName" placeholder="e.g. Batch-26-F"></div>
      <div class="field"><label>Lab / Classroom *</label><select id="nbLab" onchange="onBatchLabChange('nbLab','nbCapacity','nbSeatsHint')">${labs.length ? labs.map(l=>`<option value="${l.id}">${l.name} (max ${l.capacity})</option>`).join('') : '<option value="">No labs available — create one first</option>'}</select></div>
      <div class="field"><label>Capacity *</label><input type="number" id="nbCapacity" placeholder="35" value="${labs[0]?labs[0].capacity:''}"><span class="hint" id="nbSeatsHint" style="display:block;font-size:11.5px;color:var(--gray-500);margin-top:4px;">${labs[0] ? 'Max '+labs[0].capacity+' (limited by '+labs[0].name+')' : ''}</span></div>
      <div class="field"><label>Start Date *</label><input type="date" id="nbStart"></div>
      <div class="field"><label>End Date *</label><input type="date" id="nbEnd"></div>
      <div class="field"><label>Coordinator</label><select id="nbCoordinator">${DB.users.filter(u=>u.role_id===5).map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
      <div class="field"><label>Status</label><select id="nbStatus"><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option></select></div>
      <div class="field span-2"><label>Assigned Teachers (they will ONLY see this batch)</label>
        <div class="flex-gap" style="flex-wrap:wrap;gap:12px;">${DB.users.filter(u=>u.role_id===5).map(u=>`<label class="flex-gap" style="font-size:12.5px;cursor:pointer;"><input type="checkbox" class="nbTeacherCb" value="${u.id}"> ${u.name}</label>`).join('')}</div>
      </div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-batch">${icon('check')} Create Batch</button>`
  });
}
/* Keeps the capacity input clamped to the selected lab's capacity as soon as the lab changes. */
function onBatchLabChange(labSelId, capInputId, hintId){
  const lab = labById(document.getElementById(labSelId)?.value);
  const capInput = document.getElementById(capInputId);
  const hint = document.getElementById(hintId);
  if(!lab || !capInput) return;
  capInput.setAttribute('max', lab.capacity);
  if(!capInput.value || Number(capInput.value) > lab.capacity) capInput.value = lab.capacity;
  if(hint) hint.textContent = `Max ${lab.capacity} (limited by ${lab.name})`;
}

function editBatchModal(id){
  const b = DB.batches.find(x=>x.id===id); if(!b) return;
  const labs = activeLabs();
  const currentLab = labById(b.lab_id);
  const labOptions = (currentLab && !labs.some(l=>l.id===currentLab.id) ? [currentLab, ...labs] : labs);
  openModal({
    title:'Edit Batch', sub:`${b.name} · ${courseName(b.course_id)}`,
    body:`<div class="form-grid">
      <div class="field"><label>Batch Name *</label><input type="text" id="ebName" value="${b.name}"></div>
      <div class="field"><label>Status</label>${effectivePerm(currentUserId,'Batches','ChangeStatus') ?
        `<select id="ebStatus">${['upcoming','ongoing','completed'].map(s=>`<option value="${s}" ${s===b.status?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select>`
        : `<div>${statusBadge(b.status)}<input type="hidden" id="ebStatus" value="${b.status}"><span class="hint" style="display:block;">${icon('shield')} You don't have permission to change batch status</span></div>`}</div>
      <div class="field"><label>Lab / Classroom *</label><select id="ebLab" onchange="onBatchLabChange('ebLab','ebCapacity','ebSeatsHint')">${labOptions.map(l=>`<option value="${l.id}" ${l.id===b.lab_id?'selected':''}>${l.name} (max ${l.capacity})</option>`).join('')}</select></div>
      <div class="field"><label>Capacity *</label><input type="number" id="ebCapacity" value="${b.capacity}" max="${currentLab?currentLab.capacity:''}"><span class="hint" id="ebSeatsHint" style="display:block;font-size:11.5px;color:var(--gray-500);margin-top:4px;">${currentLab ? 'Max '+currentLab.capacity+' (limited by '+currentLab.name+') · currently '+batchEnrolledCount(b.id)+' enrolled' : ''}</span></div>
      <div class="field"><label>Start Date *</label><input type="date" id="ebStart" value="${b.start}"></div>
      <div class="field"><label>End Date *</label><input type="date" id="ebEnd" value="${b.end}"></div>
      <div class="field"><label>Coordinator</label><select id="ebCoordinator">${DB.users.filter(u=>u.role_id===5).map(u=>`<option value="${u.id}" ${u.id===b.coordinator_id?'selected':''}>${u.name}</option>`).join('')}</select></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-batch-edit" data-id="${b.id}">${icon('check')} Save Changes</button>`
  });
}
