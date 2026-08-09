/* ============================================================
   Marketing & CRM module — Leads, Pipeline, Visits, Follow-ups
   ============================================================ */

/* ---------------- LEADS LIST ---------------- */
function renderLeads(){
  const canCreate = effectivePerm(currentUserId,'Leads/CRM','Create');
  const rows = DB.leads.map(l=>`
    <tr class="row-link" data-action="view-lead" data-id="${l.id}">
      <td>${avatarHtml(l.name,'sm')}</td>
      <td><span class="cell-strong">${l.name}</span>${l.imported?` <span class="badge badge-gray" title="Added via bulk import">${icon('upload')}</span>`:''}<div class="cell-sub">${l.phone}</div></td>
      <td>${institutionName(l.institution_id)}</td>
      <td>${courseName(l.interested_course_id)}</td>
      <td><span class="badge badge-gray">${SOURCE_LABELS[l.source]}</span></td>
      <td>${userName(l.assigned_to)}</td>
      <td>${statusBadge(l.status, LEAD_STATUS_LABELS[l.status])}</td>
      <td>${fmtDate(l.created_at)}</td>
    </tr>`).join('');

  return `
  <div class="view-header">
    <div><h1>Leads</h1><p>All captured leads across institutes, campaigns, referrals & walk-ins (${DB.leads.length} total)</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm">${icon('download')} Export</button>
      ${canCreate?`<button class="btn btn-secondary btn-sm" data-action="open-lead-import">${icon('upload')} Import Leads</button>`:''}
      <button class="btn btn-primary btn-sm" data-action="open-add-lead">${icon('plus')} Add Lead</button>
    </div>
  </div>
  <div class="filter-bar">
    <div class="search-input-wrap">${icon('search')}<input type="text" placeholder="Search leads by name or phone…"></div>
    <select><option>All Status</option>${DB.leadPipeline.map(s=>`<option>${LEAD_STATUS_LABELS[s]}</option>`).join('')}</select>
    <select><option>All Institutes</option>${DB.institutions.map(i=>`<option>${i.name}</option>`).join('')}</select>
    <select><option>All Sources</option>${Object.values(SOURCE_LABELS).map(s=>`<option>${s}</option>`).join('')}</select>
    <select><option>All Staff</option>${DB.users.filter(u=>u.role_id===3).map(u=>`<option>${u.name}</option>`).join('')}</select>
  </div>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Name</th><th>Institution</th><th>Interested Course</th><th>Source</th><th>Assigned To</th><th>Status</th><th>Created</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    ${paginationHtml(DB.leads.length, DB.leads.length)}
  </div>`;
}

function leadDetailDrawer(id){
  const l = DB.leads.find(x=>x.id===id); if(!l) return;
  const hist = DB.contactHistory.filter(h=>h.lead_id===id).slice().reverse();
  const fus = DB.followUps.filter(f=>f.lead_id===id).slice().reverse();
  openDrawer({
    title:l.name, sub:`${l.phone} ${l.email?'· '+l.email:''}`,
    body:`
    <div class="flex-gap" style="margin-bottom:18px;flex-wrap:wrap;">
      ${statusBadge(l.status, LEAD_STATUS_LABELS[l.status])}
      <span class="badge badge-gray">${SOURCE_LABELS[l.source]}</span>
      ${l.source_session_id ? `<span class="badge badge-purple">${icon('send')} ${onlineSessionName(l.source_session_id)}</span>` : ''}
      ${l.status==='lost' ? `<span class="badge badge-red">Reason: ${l.lost_reason}</span>` : ''}
    </div>
    <div class="form-grid" style="margin-bottom:20px;">
      <div class="field"><label>Institution</label><div>${institutionName(l.institution_id)}</div></div>
      <div class="field"><label>Interested Course</label><div>${courseName(l.interested_course_id)}</div></div>
      <div class="field"><label>Assigned To</label><div>${userName(l.assigned_to)}</div></div>
      <div class="field"><label>Created On</label><div>${fmtDate(l.created_at)}</div></div>
    </div>

    <div class="flex-between" style="margin-bottom:10px;"><h3 style="margin:0;font-size:13.5px;">Pipeline Stage</h3></div>
    <div class="flex-gap" style="margin-bottom:22px;flex-wrap:wrap;">
      ${DB.leadPipeline.map(s=>`<button class="btn btn-sm ${s===l.status?'btn-primary':'btn-secondary'}" data-action="open-contact-log" data-id="${l.id}" data-status="${s}">${LEAD_STATUS_LABELS[s]}</button>`).join('')}
    </div>
    <div class="badge badge-gray" style="white-space:normal;margin-bottom:20px;">${icon('shield')} Clicking a stage opens the contact log so every status change carries a note & (optionally) a next follow-up date.</div>

    <div class="flex-between" style="margin-bottom:10px;"><h3 style="margin:0;font-size:13.5px;">Contact History</h3><button class="btn btn-sm btn-outline" data-action="open-contact-log" data-id="${l.id}">${icon('plus')} Log Contact</button></div>
    <div class="timeline" style="margin-bottom:20px;">
      ${hist.length? hist.map(h=>`<div class="timeline-item"><div class="when">${h.date} · ${h.type.toUpperCase()} · ${userName(h.contacted_by)}</div><div class="what">${h.notes}</div><div class="who">Outcome: ${h.outcome||'—'}</div></div>`).join('') : `<div class="muted" style="font-size:12.5px;">No contact history yet.</div>`}
    </div>

    <div class="flex-between" style="margin-bottom:10px;"><h3 style="margin:0;font-size:13.5px;">Follow-ups</h3><button class="btn btn-sm btn-outline" data-action="open-schedule-followup" data-id="${l.id}">${icon('plus')} Schedule</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Due</th><th>Notes</th><th>Status</th><th></th></tr></thead><tbody>
    ${fus.length ? fus.map(f=>`<tr><td>${fmtDate(f.due_date)} <span class="cell-sub">${(f.due_date.split(' ')[1]||'')}</span>${isFollowupOverdue(f)?` ${statusBadge('overdue','Overdue')}`:''}</td><td>${f.notes}</td><td>${statusBadge(f.status)}</td><td>${f.status==='pending'?`<button class="btn btn-sm btn-ghost" title="Log outcome & mark done" data-action="open-complete-followup" data-id="${f.id}">${icon('check')}</button>`:''}</td></tr>`).join('') : `<tr><td colspan="4" class="muted">No follow-ups scheduled.</td></tr>`}
    </tbody></table></div>
    `
  });
}

/* Single unified action for marketing staff: log what was discussed, optionally move the pipeline stage,
   optionally schedule the next follow-up (date + note) — all in one save so nothing gets forgotten.
   When opened from a specific follow-up's "Mark Done" button (followupId set), saving this form both logs
   the contact AND closes out that follow-up — so "Mark Done" never silently skips the status/notes update. */
function contactLogModal(leadId, presetStatus, followupId){
  const l = DB.leads.find(x=>x.id===leadId); if(!l) return;
  const status = presetStatus || l.status;
  const fu = followupId ? DB.followUps.find(f=>f.id===followupId) : null;
  openModal({ size:'lg',
    title: fu ? `Complete Follow-up — ${l.name}` : `Log Contact — ${l.name}`,
    sub: fu ? `Due ${fmtDate(fu.due_date)} — "${fu.notes}". Log the outcome, update the stage, and (optionally) schedule the next follow-up.` : 'Record the conversation, update the stage, and (optionally) set the next follow-up',
    body:`
    ${fu ? `<div class="badge badge-blue" style="white-space:normal;margin-bottom:14px;">${icon('clock')} This will mark the follow-up due ${fmtDate(fu.due_date)} as done once saved.</div>` : ''}
    <div class="form-grid" style="margin-bottom:4px;">
      <div class="field"><label>Contact Type *</label><select id="clType"><option value="call">Call</option><option value="sms">SMS</option><option value="email">Email</option><option value="visit">Visit</option><option value="whatsapp">WhatsApp</option></select></div>
      <div class="field"><label>New Pipeline Stage *</label><select id="clStatus" onchange="document.getElementById('clLostReasonField').style.display=this.value==='lost'?'block':'none';">
        ${DB.leadPipeline.map(s=>`<option value="${s}" ${s===status?'selected':''}>${LEAD_STATUS_LABELS[s]}</option>`).join('')}
      </select></div>
      <div class="field span-2"><label>What was discussed? *</label><textarea id="clNotes" placeholder="e.g. Explained fee structure, answered questions about batch timing…">${fu ? (fu.notes||'') : ''}</textarea></div>
      <div class="field span-2"><label>Outcome</label><input type="text" id="clOutcome" placeholder="e.g. Will decide by Friday"></div>
      <div class="field span-2" id="clLostReasonField" style="display:${status==='lost'?'block':'none'};"><label>Reason Lost</label><input type="text" id="clLostReason" placeholder="e.g. Chose competitor institute" value="${l.lost_reason||''}"></div>
    </div>
    <div class="hr"></div>
    <label style="font-size:12px;font-weight:700;color:var(--gray-600);display:block;margin-bottom:8px;">Schedule Next Follow-up (optional)</label>
    <div class="form-grid">
      <div class="field"><label>Follow-up Date</label><input type="date" id="clFollowupDate"></div>
      <div class="field"><label>Follow-up Time</label><input type="time" id="clFollowupTime" value="10:00"></div>
      <div class="field span-2"><label>Follow-up Note</label><input type="text" id="clFollowupNote" placeholder="Defaults to the notes above if left blank"></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-contact-log" data-id="${l.id}" ${fu?`data-followupid="${fu.id}"`:''}>${icon('check')} ${fu?'Save & Mark Done':'Save'}</button>`
  });
}

function scheduleFollowupModal(leadId){
  const l = DB.leads.find(x=>x.id===Number(leadId)); if(!l) return;
  openModal({
    title:'Schedule Follow-up', sub:`${l.name} — set a reminder without logging a contact yet`,
    body:`<div class="form-grid">
      <div class="field"><label>Due Date *</label><input type="date" id="sfDate"></div>
      <div class="field"><label>Due Time</label><input type="time" id="sfTime" value="10:00"></div>
      <div class="field span-2"><label>Assign To</label><select id="sfAssignee">${DB.users.filter(u=>u.role_id===3).map(u=>`<option value="${u.id}" ${u.id===l.assigned_to?'selected':''}>${u.name}</option>`).join('')}</select></div>
      <div class="field span-2"><label>Notes</label><textarea id="sfNotes" placeholder="What needs to happen on this follow-up?"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-schedule-followup" data-id="${l.id}">${icon('check')} Schedule</button>`
  });
}

function addLeadModal(){
  openModal({
    title:'Add New Lead', sub:'Capture a new lead from visit, referral, walk-in, campaign, or online session',
    body:`<div class="form-grid">
      <div class="field"><label>Full Name *</label><input type="text" id="alName" placeholder="e.g. Md. Karim Hossain"></div>
      <div class="field"><label>Phone *</label><input type="text" id="alPhone" placeholder="01XXXXXXXXX"></div>
      <div class="field"><label>Email</label><input type="text" id="alEmail" placeholder="optional"></div>
      <div class="field"><label>Source *</label><select id="alSource" onchange="document.getElementById('alSessionField').style.display=this.value==='online_session'?'block':'none';">${Object.entries(SOURCE_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="field" id="alSessionField" style="display:none;"><label>Which Online Session?</label><select id="alSourceSession"><option value="">—</option>${DB.onlineSessions.map(s=>`<option value="${s.id}">${s.title} (${fmtDate(s.date)})</option>`).join('')}</select></div>
      <div class="field"><label>Institution</label><select id="alInstitution"><option value="">—</option>${DB.institutions.map(i=>`<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
      <div class="field"><label>Interested Course</label><select id="alCourse"><option value="">—</option>${DB.courses.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="field"><label>Assign To</label><select id="alAssignTo">${DB.users.filter(u=>u.role_id===3).map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
      <div class="field"><label>Initial Status</label><select id="alStatus">${DB.leadPipeline.map(s=>`<option value="${s}">${LEAD_STATUS_LABELS[s]}</option>`).join('')}</select></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-lead">${icon('check')} Save Lead</button>`
  });
}

/* ---------------- PIPELINE (Kanban) ---------------- */
function renderPipeline(){
  const cols = DB.leadPipeline.map(stage=>{
    const items = DB.leads.filter(l=>l.status===stage);
    return `<div class="kanban-col">
      <div class="kanban-col-head"><b>${LEAD_STATUS_LABELS[stage]}</b><span class="badge badge-gray">${items.length}</span></div>
      ${items.map(l=>`
        <div class="kanban-card" data-action="view-lead" data-id="${l.id}">
          <b>${l.name}</b>
          <div class="cell-sub">${institutionName(l.institution_id)}</div>
          <div class="meta">${icon('course')} ${courseName(l.interested_course_id)}</div>
          <div class="meta">${avatarHtml(userName(l.assigned_to),'sm')} ${userName(l.assigned_to)}</div>
        </div>`).join('') || `<div class="muted" style="font-size:12px;padding:10px 2px;">No leads</div>`}
    </div>`;
  }).join('');
  return `
  <div class="view-header">
    <div><h1>Lead Pipeline</h1><p>Drag-and-drop style funnel view — New → Contacted → Interested → Visited → Negotiation → Admitted / Lost</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-lead">${icon('plus')} Add Lead</button></div>
  </div>
  <div class="kanban">${cols}</div>
  <div class="card mt-16">
    <div class="card-header"><h3>Lost-Lead Reason Analysis</h3></div>
    <div class="card-pad">${renderHBarList([
      {label:'Financial constraints', value:DB.leads.filter(l=>l.status==='lost'&&l.lost_reason?.includes('Financial')).length||1, color:'#ef4444'},
      {label:'Chose competitor institute', value:DB.leads.filter(l=>l.status==='lost'&&l.lost_reason?.includes('competitor')).length||1, color:'#f97316'},
      {label:'Not interested anymore', value:0, color:'#f59e0b'},
      {label:'Location/distance issue', value:0, color:'#94a3b8'},
    ])}</div>
  </div>`;
}

/* ---------------- INSTITUTION VISITS ---------------- */
function renderVisits(){
  const rows = DB.visits.map(v=>`
    <tr>
      <td class="cell-strong">${institutionName(v.institution_id)}</td>
      <td>${fmtDate(v.visit_date)}</td>
      <td>${userName(v.visited_by)}</td>
      <td style="max-width:220px;white-space:normal;">${v.purpose}</td>
      <td style="max-width:220px;white-space:normal;">${v.outcome}</td>
      <td>${v.next_action}<div class="cell-sub">by ${fmtDate(v.next_action_date)}</div></td>
    </tr>`).join('');
  return `
  <div class="view-header">
    <div><h1>Institution Visits</h1><p>Polytechnic visit scheduling & visit reports</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-visit">${icon('plus')} Log New Visit</button></div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('institution','Visits This Month', DB.visits.length, null, '#ff6533')}
    ${kpiCard('checkCircle','MOUs Signed', DB.institutions.filter(i=>i.mou_status==='signed').length, null, '#10b981')}
    ${kpiCard('clock','MOUs Pending', DB.institutions.filter(i=>i.mou_status==='pending').length, null, '#f59e0b')}
    ${kpiCard('building','Institutes with No MOU', DB.institutions.filter(i=>i.mou_status==='none').length, null, '#ef4444')}
  </div>
  <div class="card">
    <div class="card-header"><h3>Visit Log</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Institution</th><th>Date</th><th>Visited By</th><th>Purpose</th><th>Outcome</th><th>Next Action</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>`;
}

function addVisitModal(){
  openModal({
    title:'Log Institution Visit', sub:'Record a polytechnic visit report',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Institution *</label><select>${DB.institutions.map(i=>`<option>${i.name}</option>`).join('')}</select></div>
      <div class="field"><label>Visit Date *</label><input type="date" value="2026-08-06"></div>
      <div class="field"><label>Visited By *</label><select>${DB.users.filter(u=>u.role_id===3).map(u=>`<option>${u.name}</option>`).join('')}</select></div>
      <div class="field span-2"><label>Purpose</label><input type="text" placeholder="e.g. New batch promotion"></div>
      <div class="field span-2"><label>Outcome Notes</label><textarea placeholder="What happened during the visit?"></textarea></div>
      <div class="field"><label>Next Action</label><input type="text" placeholder="e.g. Send brochure"></div>
      <div class="field"><label>Next Action Date</label><input type="date"></div>
      <div class="field span-2"><label>Attachments</label><div class="flex-gap" style="border:1.5px dashed var(--gray-300);border-radius:10px;padding:16px;justify-content:center;color:var(--gray-400);">${icon('upload')} Drop photos/documents here (demo)</div></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-visit">${icon('check')} Save Visit Report</button>`
  });
}

/* ---------------- FOLLOW-UPS (Today / Upcoming / All Pending / Missed / Done) ---------------- */
let currentFollowupTab = 'today';
function renderFollowups(){
  currentFollowupTab = 'today';
  return `
  <div class="view-header">
    <div><h1>Follow-ups</h1><p>Today's due follow-ups, upcoming reminders, and full history — calls, SMS, emails, in-person visits</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-followup-generic">${icon('plus')} Schedule Follow-up</button></div>
  </div>
  <div class="tabs">
    <button class="tab-btn active" data-futab="today">Today's Follow-up <span class="badge badge-amber" style="margin-left:4px;">${followupsToday().length}</span></button>
    <button class="tab-btn" data-futab="upcoming">Upcoming (7d)</button>
    <button class="tab-btn" data-futab="pending">All Pending</button>
    <button class="tab-btn" data-futab="missed">Missed ${followupsMissed().length ? `<span class="badge badge-red" style="margin-left:4px;">${followupsMissed().length}</span>` : ''}</button>
    <button class="tab-btn" data-futab="done">Done</button>
  </div>
  <div id="followupPane">${followupPane('today')}</div>`;
}
function wireFollowupTabs(){
  document.querySelectorAll('[data-futab]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-futab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentFollowupTab = btn.dataset.futab;
      document.getElementById('followupPane').innerHTML = followupPane(currentFollowupTab);
    });
  });
}
function followupRow(f){
  const lead = f.lead_id ? DB.leads.find(l=>l.id===f.lead_id) : null;
  const overdue = isFollowupOverdue(f);
  return `<tr class="${lead?'row-link':''}" ${lead?`data-action="view-lead" data-id="${lead.id}"`:''}>
    <td class="cell-strong">${lead ? lead.name : studentName(f.student_id)}</td>
    <td>${lead ? (courseName(lead.interested_course_id)) : '—'}</td>
    <td>${fmtDate(f.due_date)} <span class="cell-sub">${f.due_date.split(' ')[1]||''}</span></td>
    <td>${userName(f.assigned_to)}</td>
    <td style="max-width:240px;white-space:normal;">${f.notes}</td>
    <td>${overdue ? statusBadge('overdue','Overdue') : statusBadge(f.status)}</td>
    <td>${f.status==='pending' ? `<button class="btn btn-sm btn-outline" data-action="open-complete-followup" data-id="${f.id}">${icon('check')} Mark Done</button>` : (f.completed_date?`<span class="cell-sub">on ${fmtDate(f.completed_date)}</span>`:'—')}</td>
  </tr>`;
}
function followupTableHtml(list, emptyMsg){
  if(!list.length) return `<div class="empty-state">${icon('checkCircle')}<p>${emptyMsg||'Nothing here.'}</p></div>`;
  return `<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Lead/Student</th><th>Interested In</th><th>Due</th><th>Assigned To</th><th>Notes</th><th>Status</th><th></th></tr></thead>
  <tbody>${list.map(followupRow).join('')}</tbody></table></div></div>`;
}
function followupPane(tab){
  if(tab==='today'){
    const list = followupsToday();
    return `<div class="grid grid-3" style="margin-bottom:18px;">
      ${kpiCard('calendar','Due Today', list.length, null, '#f59e0b')}
      ${kpiCard('alertCircle','Missed (Overdue)', followupsMissed().length, null, '#ef4444')}
      ${kpiCard('checkCircle','Completed Today', DB.followUps.filter(f=>f.status==='done' && f.completed_date===TODAY).length, null, '#10b981')}
    </div>${followupTableHtml(list, 'No follow-ups due today — you\'re all caught up!')}`;
  }
  if(tab==='upcoming') return followupTableHtml(followupsUpcoming(7), 'Nothing scheduled in the next 7 days.');
  if(tab==='pending') return followupTableHtml(followupsAllPending().sort((a,b)=> a.due_date<b.due_date?-1:1), 'No pending follow-ups anywhere.');
  if(tab==='missed') return followupTableHtml(followupsMissed(), 'Nothing overdue — great job staying on top of follow-ups!');
  if(tab==='done') return followupTableHtml(followupsDone().slice().reverse(), 'No follow-ups completed yet.');
  return '';
}

/* ---------------- ONLINE SESSIONS / WEBINARS ---------------- */
function onlineSessionCard(s, isPast){
  const platform = ONLINE_SESSION_PLATFORM_LABELS[s.platform] || s.platform;
  return `<div class="card card-pad" style="margin-bottom:12px;">
    <div class="flex-between" style="margin-bottom:8px;flex-wrap:wrap;gap:6px;">
      <b style="font-size:13.5px;">${s.title}</b>
      ${statusBadge(s.status)}
    </div>
    <div class="flex-gap" style="flex-wrap:wrap;margin-bottom:10px;">
      <span class="badge badge-gray">${icon('calendar')} ${fmtDate(s.date)} · ${s.time}</span>
      <span class="badge badge-purple">${platform}</span>
      <span class="badge badge-blue">${s.institution_id ? institutionName(s.institution_id) : 'Open to All Institutes'}</span>
      <span class="badge badge-gray">Host: ${userName(s.host_id)}</span>
    </div>
    ${isPast ? `<div class="grid grid-3" style="margin-bottom:10px;">
      <div class="card card-pad" style="text-align:center;padding:10px;"><div style="font-size:16px;font-weight:800;">${s.registered_count}</div><div class="cell-sub">Registered</div></div>
      <div class="card card-pad" style="text-align:center;padding:10px;"><div style="font-size:16px;font-weight:800;color:var(--success-700);">${s.attended_count}</div><div class="cell-sub">Attended</div></div>
      <div class="card card-pad" style="text-align:center;padding:10px;"><div style="font-size:16px;font-weight:800;color:var(--primary-600);">${s.leads_generated}</div><div class="cell-sub">Leads Generated</div></div>
    </div>${s.notes ? `<p class="cell-sub" style="margin-bottom:8px;">${s.notes}</p>` : ''}` : `
    <div class="flex-gap" style="margin-bottom:10px;"><span class="cell-sub">${s.registered_count} registered so far · ${s.duration_mins} mins</span></div>`}
    <div class="flex-gap">
      ${s.meeting_link ? `<a class="btn btn-sm btn-outline" href="${s.meeting_link}" target="_blank" rel="noopener">${icon('send')} Meeting Link</a>` : ''}
      ${s.status==='scheduled' ? `<button class="btn btn-sm btn-primary" data-action="open-complete-online-session" data-id="${s.id}">${icon('checkCircle')} Mark Completed</button>
      <button class="btn btn-sm btn-outline" data-action="cancel-online-session" data-id="${s.id}">${icon('close')} Cancel</button>` : ''}
    </div>
  </div>`;
}
function renderOnlineSessions(){
  const upcoming = upcomingOnlineSessions();
  const past = pastOnlineSessions();
  const completed = DB.onlineSessions.filter(s=>s.status==='completed');
  return `
  <div class="view-header">
    <div><h1>Online Sessions</h1><p>Webinars & live sessions run for polytechnic students — separate from in-person Institution Visits</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-online-session">${icon('plus')} Schedule Online Session</button></div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('send','Upcoming Sessions', upcoming.length, null, '#8b5cf6')}
    ${kpiCard('checkCircle','Completed (All Time)', completed.length, null, '#10b981')}
    ${kpiCard('students','Total Attended', sum(completed,s=>s.attended_count), null, '#06b6d4')}
    ${kpiCard('marketing','Leads Generated', sum(completed,s=>s.leads_generated), null, '#ff6533')}
  </div>
  <h3 class="report-section-title">Upcoming</h3>
  ${upcoming.length ? upcoming.map(s=>onlineSessionCard(s,false)).join('') : `<div class="empty-state">${icon('calendar')}<p>No online sessions scheduled yet.</p></div>`}
  <h3 class="report-section-title">Past Sessions</h3>
  ${past.length ? past.map(s=>onlineSessionCard(s,true)).join('') : `<div class="empty-state">${icon('send')}<p>No past sessions yet.</p></div>`}
  `;
}
function addOnlineSessionModal(){
  openModal({ size:'lg',
    title:'Schedule Online Session', sub:'Set up a webinar / live session for polytechnic students',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Title *</label><input type="text" id="osTitle" placeholder="e.g. Industrial Attachment Career Talk"></div>
      <div class="field"><label>Target Institution</label><select id="osInstitution"><option value="">Open to All Institutes</option>${DB.institutions.map(i=>`<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
      <div class="field"><label>Platform *</label><select id="osPlatform">${Object.entries(ONLINE_SESSION_PLATFORM_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="field"><label>Date *</label><input type="date" id="osDate" value="${TODAY}"></div>
      <div class="field"><label>Time *</label><input type="time" id="osTime" value="15:00"></div>
      <div class="field"><label>Duration (mins)</label><input type="number" id="osDuration" value="60"></div>
      <div class="field"><label>Host</label><select id="osHost">${DB.users.filter(u=>u.role_id===3).map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
      <div class="field span-2"><label>Meeting Link</label><input type="text" id="osLink" placeholder="https://zoom.us/j/..."></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-online-session">${icon('check')} Schedule</button>`
  });
}
function completeOnlineSessionModal(id){
  const s = DB.onlineSessions.find(x=>x.id===id); if(!s) return;
  openModal({
    title:'Mark Session Completed', sub:s.title,
    body:`<div class="form-grid">
      <div class="field"><label>Attendees Count *</label><input type="number" id="osAttended" value="${s.registered_count}"></div>
      <div class="field"><label>Leads Generated *</label><input type="number" id="osLeads" value="0"></div>
      <div class="field span-2"><label>Notes / Summary</label><textarea id="osCompleteNotes" placeholder="How did the session go?"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-complete-online-session" data-id="${s.id}">${icon('check')} Save & Complete</button>`
  });
}
