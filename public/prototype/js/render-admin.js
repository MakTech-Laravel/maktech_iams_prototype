/* ============================================================
   Administration — Notifications, Users & Roles (RBAC), Audit Log, Settings
   ============================================================ */

/* ---------------- MY PROFILE (topbar user-chip → any logged-in admin/staff user) ---------------- */
function myProfileModal(userId){
  const u = DB.users.find(x=>x.id===userId); if(!u) return;
  openModal({
    title:'My Profile', sub:'Your account details — update your profile photo here',
    body:`<div style="text-align:center;max-width:320px;margin:0 auto;">
      ${profilePhotoBlockHtml(u.name, u.photo, {inputId:'myProfilePhotoInput', previewId:'myProfilePhotoPreview', removeAction:'remove-my-profile-photo'})}
      <b style="display:block;margin:14px 0 2px;font-size:15px;">${u.name}</b>
      <span class="cell-sub">${roleName(u.role_id)}</span>
    </div>
    <div class="hr"></div>
    <div class="form-grid">
      <div class="field"><label>Phone</label><div>${u.phone||'—'}</div></div>
      <div class="field"><label>Email</label><div>${u.email||'—'}</div></div>
      <div class="field span-2"><label>Status</label><div>${statusBadge(u.status)}</div></div>
    </div>`
  });
  wireProfilePhotoInput('myProfilePhotoInput', (dataUrl)=>{
    setUserPhoto(userId, dataUrl);
    if(userId===currentUserId) paintAvatarEl(document.querySelector('#userChip .avatar'), u.name, dataUrl);
    myProfileModal(userId);
    refreshCurrentView();
    toast('Profile photo updated');
  });
}

/* ---------------- NOTIFICATIONS ---------------- */
function renderNotifications(){
  const rows = DB.notifications.map(n=>`
    <tr>
      <td class="cell-strong">${n.recipient}</td>
      <td><span class="badge badge-gray">${n.channel.toUpperCase()}</span></td>
      <td>${n.type.replace(/_/g,' ')}</td>
      <td style="max-width:280px;white-space:normal;">${n.message}</td>
      <td>${fmtDate(n.date)}</td>
      <td>${statusBadge(n.status)}</td>
    </tr>`).join('');
  const ruleRows = DB.notificationRules.map(r=>`
    <tr>
      <td class="cell-strong">${r.trigger.replace(/_/g,' ')}</td>
      <td><span class="badge badge-gray">${r.channel.toUpperCase()}</span></td>
      <td style="max-width:320px;white-space:normal;font-size:12px;color:var(--gray-500);">${r.template}</td>
      <td><label class="flex-gap" style="cursor:pointer;"><input type="checkbox" ${r.active?'checked':''} data-action="toggle-rule" data-id="${r.id}"> ${r.active?statusBadge('active','Active'):statusBadge('inactive','Inactive')}</label></td>
    </tr>`).join('');

  return `
  <div class="view-header">
    <div><h1>Notifications & Automation</h1><p>SMS/Email delivery log and admin-configurable automation rules</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-send-notification">${icon('send')} Send Manual Notification</button></div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('send','Sent (Last 30 days)', DB.notifications.filter(n=>n.status==='sent').length, null, '#10b981')}
    ${kpiCard('alertCircle','Failed Deliveries', DB.notifications.filter(n=>n.status==='failed').length, null, '#ef4444')}
    ${kpiCard('notification','Active Automation Rules', DB.notificationRules.filter(r=>r.active).length, null, '#ff6533')}
    ${kpiCard('mail','Channels Configured', 'SMS · Email · Portal', null, '#8b5cf6')}
  </div>

  <h3 class="report-section-title">Notification Delivery Log</h3>
  <div class="card" style="margin-bottom:26px;">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Recipient</th><th>Channel</th><th>Type</th><th>Message</th><th>Date</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>

  <h3 class="report-section-title">Automation Rules (Notification Templates & Timing)</h3>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Trigger Event</th><th>Channel</th><th>Template</th><th>Active</th></tr></thead>
    <tbody>${ruleRows}</tbody></table></div>
  </div>`;
}

/* ---------------- USERS & ROLES (RBAC) ---------------- */
function renderUsers(){
  const userRows = DB.users.map(u=>`
    <tr>
      <td>${avatarHtml(u.name,'sm',u.photo)}</td>
      <td class="cell-strong">${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td><span class="badge badge-purple">${roleName(u.role_id)}</span></td>
      <td>${statusBadge(u.status)}</td>
      <td>${hasAnyOverride(u.id) ? `<span class="badge badge-amber">${icon('alertCircle')} Custom</span>` : `<span class="badge badge-gray">Role default</span>`}</td>
      <td><div class="flex-gap"><button class="btn btn-sm btn-ghost" title="Manage this user's access" data-action="goto-access-for-user" data-id="${u.id}">${icon('shield')}</button><button class="btn btn-sm btn-ghost" data-action="open-edit-user" data-id="${u.id}">${icon('edit')}</button><button class="btn btn-sm btn-ghost" data-action="toggle-user-status" data-id="${u.id}">${icon(u.status==='active'?'trash':'checkCircle')}</button></div></td>
    </tr>`).join('');

  const roleRows = DB.roles.map(r=>`
    <tr class="row-link" data-action="view-role-matrix" data-id="${r.id}">
      <td class="cell-strong">${r.name}</td>
      <td style="max-width:340px;white-space:normal;">${r.desc}</td>
      <td>${r.users}</td>
      <td><button class="btn btn-sm btn-outline">${icon('shield')} View Permissions</button></td>
    </tr>`).join('');

  return `
  <div class="view-header">
    <div><h1>Users & Roles</h1><p>Role-Based Access Control (RBAC) — granular permissions per module</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm" data-action="open-add-role">${icon('plus')} Add Role</button>
      <button class="btn btn-primary btn-sm" data-action="open-add-user">${icon('plus')} Add User</button>
    </div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('user','Total Staff Users', DB.users.length, null, '#ff6533')}
    ${kpiCard('shield','Roles Defined', DB.roles.length, null, '#8b5cf6')}
    ${kpiCard('checkCircle','Active Users', DB.users.filter(u=>u.status==='active').length, null, '#10b981')}
    ${kpiCard('alertCircle','Inactive Users', DB.users.filter(u=>u.status==='inactive').length, null, '#ef4444')}
  </div>

  <h3 class="report-section-title">Roles <span class="cell-sub" style="font-weight:400;">— default permission templates, applied to every new user of that role</span></h3>
  <div class="card" style="margin-bottom:26px;">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Role</th><th>Description</th><th>Users</th><th></th></tr></thead>
    <tbody>${roleRows}</tbody></table></div>
  </div>

  <div class="card card-pad" style="margin-bottom:26px;background:var(--primary-50);border-color:var(--primary-200);">
    <div class="flex-gap"><div class="kpi-icon" style="width:36px;height:36px;background:#fff;color:var(--primary-600);flex-shrink:0;">${icon('shield')}</div>
    <div><b style="display:block;font-size:13px;">Need to change access for one specific person?</b><span class="cell-sub">Role permissions above are just the starting default. Open <b>Access Control</b> to grant or restrict any individual user's menu/page access, edit rights, or assigned batches — independent of their role.</span></div></div>
    <button class="btn btn-primary btn-sm" style="margin-top:12px;" data-action="go-view" data-view="access">${icon('shield')} Open Access Control</button>
  </div>

  <h3 class="report-section-title">Staff Users</h3>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Access</th><th></th></tr></thead>
    <tbody>${userRows}</tbody></table></div>
  </div>`;
}

function roleMatrixModal(roleId){
  const role = DB.roles.find(r=>r.id===roleId); if(!role) return;
  const matrix = DB.rolePermMatrix[roleId];
  openModal({ size:'xl', title:`${role.name} — Default Permission Matrix`, sub:role.desc + ' · These are role-level defaults; use Access Control to override for a specific person.',
    body:`<div class="table-wrap" style="margin-bottom:22px;"><table class="data-table"><thead><tr><th>Module</th>${DB.permActions.map(a=>`<th style="text-align:center;">${a}</th>`).join('')}</tr></thead><tbody>
      ${DB.permModules.map(m=>`<tr><td class="cell-strong">${m}</td>${DB.permActions.map(a=>`<td style="text-align:center;"><input type="checkbox" ${matrix[m][a]?'checked':''} data-action="toggle-perm" data-role="${roleId}" data-mod="${m}" data-act="${a}"></td>`).join('')}</tr>`).join('')}
    </tbody></table></div>
    <h3 class="report-section-title" style="margin-top:0;">Report Access (Role Default)</h3>
    <div class="card card-pad" style="margin-bottom:20px;">${reportAccessGridHtml(roleId, true)}</div>
    <h3 class="report-section-title">List / Data Visibility (Role Default)</h3>
    <div class="card card-pad" style="margin-bottom:8px;">${listAccessGridHtml(roleId, true)}</div>
    <div class="badge badge-gray" style="white-space:normal;text-align:left;margin-top:10px;">${icon('shield')} Admin Panel Access for Coordinators/Teachers is managed per-user in Access Control, since a role may include some staff who should stay portal-only and others who shouldn't.</div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal();toast('Role defaults updated (demo)')">${icon('check')} Save Changes</button>`
  });
}

/* ---------------- Report Access & List Visibility — shared grids used for BOTH role defaults and per-user overrides ---------------- */
function reportAccessGridHtml(id, isRole){
  const mod = 'Reports';
  return REPORTS.map(g=>`
    <div style="margin-bottom:14px;">
      <b style="font-size:12px;display:block;margin-bottom:6px;color:var(--gray-600);text-transform:uppercase;letter-spacing:.02em;">${g.sec}</b>
      <div class="grid grid-4" style="gap:6px;">
        ${g.items.map(r=>{
          const key = 'Report_'+r.id;
          const val = isRole ? !!DB.rolePermMatrix[id][mod][key] : effectivePerm(id, mod, key);
          const isOverridden = !isRole && DB.userPermOverrides[id]?.[mod]?.[key] !== undefined;
          return `<label class="flex-gap" style="cursor:pointer;font-size:12px;padding:5px 8px;border-radius:8px;${isOverridden?'background:var(--primary-50);':''}">
            <input type="checkbox" ${val?'checked':''} data-action="${isRole?'toggle-role-report-perm':'toggle-user-report-perm'}" data-${isRole?'role':'userid'}="${id}" data-reportid="${r.id}"> <span>${r.t}</span>
          </label>`;
        }).join('')}
      </div>
    </div>`).join('');
}
function listAccessGridHtml(id, isRole){
  const col = (mod, keys, label) => `<div>
    <b style="font-size:12.5px;display:block;margin-bottom:8px;">${label}</b>
    <div class="flex-gap" style="flex-wrap:wrap;gap:8px;">
      ${keys.map(k=>{
        const key = 'List_'+k;
        const val = isRole ? !!DB.rolePermMatrix[id][mod][key] : effectivePerm(id, mod, key);
        const isOverridden = !isRole && DB.userPermOverrides[id]?.[mod]?.[key] !== undefined;
        return `<label class="flex-gap" style="cursor:pointer;font-size:12.5px;padding:6px 10px;border-radius:8px;border:1px solid var(--gray-200);${isOverridden?'background:var(--primary-50);':''}">
          <input type="checkbox" ${val?'checked':''} data-action="${isRole?'toggle-role-list-perm':'toggle-user-list-perm'}" data-${isRole?'role':'userid'}="${id}" data-mod="${mod}" data-key="${k}"> ${k}
        </label>`;
      }).join('')}
    </div>
  </div>`;
  return `<div class="grid grid-2" style="gap:20px;">
    ${col('Payments', PAYMENT_LIST_KEYS, 'Payments — which status lists can this role/user browse')}
    ${col('Students', STUDENT_LIST_KEYS, 'Students — which status lists can this role/user browse')}
  </div>`;
}
function adminPanelAccessCardHtml(userId){
  const u = DB.users.find(x=>x.id===userId); if(!u) return '';
  const val = effectivePerm(userId,'Users','AdminPanelAccess');
  const isOverridden = DB.userPermOverrides[userId]?.['Users']?.['AdminPanelAccess'] !== undefined;
  return `<div class="card card-pad" style="margin-bottom:20px;${val?'':'background:var(--danger-50);border-color:#fecaca;'}">
    <div class="flex-between" style="flex-wrap:wrap;gap:10px;">
      <div style="max-width:520px;">
        <b style="display:block;font-size:13px;">${icon('shield')} Admin Panel Access</b>
        <span class="cell-sub">${u.role_id===5 ? 'Coordinators/Teachers use the dedicated Teacher Portal (teacher-portal.html) by default and cannot log into this admin panel. Enable this to grant this specific teacher full admin-panel access instead.' : 'Controls whether this user can log into the admin panel at all.'}</span>
      </div>
      <label class="flex-gap" style="cursor:pointer;">
        <input type="checkbox" ${val?'checked':''} data-action="toggle-user-adminpanel-access" data-userid="${userId}">
        <span class="badge ${val?'badge-green':'badge-red'}">${val?'Admin Panel Allowed':'Portal-Only (Admin Panel Blocked)'}</span>
        ${isOverridden?'<span class="badge badge-amber">Custom</span>':''}
      </label>
    </div>
  </div>`;
}

/* ---------------- ACCESS CONTROL (per-user overrides — the granular RBAC screen) ---------------- */
function renderAccessControl(){
  const defaultUserId = currentUserId;
  return `
  <div class="view-header">
    <div><h1>Access Control</h1><p>Grant or restrict menu, page & action-level access for any individual user — this always overrides their role's defaults</p></div>
  </div>
  <div class="card card-pad" style="margin-bottom:20px;">
    <div class="form-grid">
      <div class="field span-2">
        <label>Select a user to manage</label>
        <select id="acUserSelect">
          ${DB.users.map(u=>`<option value="${u.id}" ${u.id===defaultUserId?'selected':''}>${u.name} — ${roleName(u.role_id)}${u.status==='inactive'?' (inactive)':''}</option>`).join('')}
        </select>
      </div>
    </div>
  </div>
  <div id="acBody">${accessControlBodyHtml(defaultUserId)}</div>`;
}

function renderAccessControlBody(userId){
  const el = document.getElementById('acBody');
  if(el) el.innerHTML = accessControlBodyHtml(userId);
}

function accessControlBodyHtml(userId){
  const u = DB.users.find(x=>x.id===userId); if(!u) return '<div class="muted">User not found.</div>';
  const overridden = hasAnyOverride(userId);
  const isTeacher = u.role_id===5;
  return `
  <div class="flex-between" style="margin-bottom:14px;flex-wrap:wrap;gap:10px;">
    <div class="flex-gap">
      ${avatarHtml(u.name,'',u.photo)}
      <div><b style="display:block;font-size:14px;">${u.name}</b><span class="cell-sub">${roleName(u.role_id)} · role default applies unless overridden below</span></div>
    </div>
    <div class="flex-gap">
      ${overridden ? `<span class="badge badge-amber">${icon('alertCircle')} Has custom overrides</span>` : `<span class="badge badge-gray">Using role defaults</span>`}
      <button class="btn btn-outline btn-sm" data-action="reset-user-perms" data-userid="${u.id}">${icon('trash')} Reset to Role Default</button>
      <button class="btn btn-secondary btn-sm" data-action="preview-as-user" data-id="${u.id}">${icon('eye')} Preview App as This User</button>
    </div>
  </div>
  ${adminPanelAccessCardHtml(userId)}
  <div class="card" style="margin-bottom:20px;">
    <div class="card-header"><h3>Menu / Page & Action Permissions</h3><p>Checked = this user can access that page/action. Highlighted cells are custom overrides for this user only. The "Change Status" column is deliberately separate from "Edit" — e.g. someone can edit a student's profile without being allowed to change their status.</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Module (Menu / Page)</th>${DB.permActions.map(a=>`<th style="text-align:center;">${a}</th>`).join('')}</tr></thead><tbody>
    ${DB.permModules.map(m=>`<tr><td class="cell-strong">${m}</td>${DB.permActions.map(a=>{
        const isOverridden = DB.userPermOverrides[userId]?.[m]?.[a] !== undefined;
        const val = effectivePerm(userId, m, a);
        return `<td style="text-align:center;${isOverridden?'background:var(--primary-50);':''}"><input type="checkbox" ${val?'checked':''} data-action="toggle-user-perm" data-userid="${userId}" data-mod="${m}" data-act="${a}"></td>`;
      }).join('')}</tr>`).join('')}
    </tbody></table></div>
  </div>
  <div class="card" style="margin-bottom:20px;">
    <div class="card-header"><h3>Report Access</h3><p>A report is completely hidden/blocked in Reports & Analytics unless individually checked here — not every report is accessible to every user.</p></div>
    <div class="card-pad">${reportAccessGridHtml(userId, false)}</div>
  </div>
  <div class="card" style="margin-bottom:20px;">
    <div class="card-header"><h3>List / Data Visibility Permissions</h3><p>Fine-grained control over which status-filtered lists this user can browse (e.g. Paid vs Due invoices, Active vs Dropped students) — independent from the base module View permission above.</p></div>
    <div class="card-pad">${listAccessGridHtml(userId, false)}</div>
  </div>
  ${isTeacher ? `
  <div class="card">
    <div class="card-header"><h3>Assigned Courses & Batches</h3><p>This teacher/coordinator can ONLY see & manage the batches checked below — this restriction applies regardless of the module permissions above.</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Batch</th><th>Course</th><th>Status</th><th style="text-align:center;">Assigned</th></tr></thead><tbody>
    ${DB.batches.map(b=>`<tr><td class="cell-strong">${b.name}</td><td>${courseName(b.course_id)}</td><td>${statusBadge(b.status)}</td>
      <td style="text-align:center;"><input type="checkbox" ${(b.assigned_teachers||[]).includes(userId)?'checked':''} data-action="toggle-user-batch-scope" data-userid="${userId}" data-batchid="${b.id}"></td></tr>`).join('')}
    </tbody></table></div>
  </div>` : `<div class="card card-pad" style="color:var(--gray-500);font-size:12.5px;">${icon('alertCircle')} Batch/course scoping applies to Course Coordinator / Teacher role users — it restricts which batches they see inside Batches, Attendance & Student Directory. This user's role isn't batch-scoped, so their access is controlled purely by the module permissions above.</div>`}
  `;
}

function addUserModal(){
  openModal({
    title:'Add Staff User', sub:'Create a new system user account',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Full Name *</label><input type="text"></div>
      <div class="field"><label>Email *</label><input type="text"></div>
      <div class="field"><label>Phone *</label><input type="text"></div>
      <div class="field"><label>Role *</label><select>${DB.roles.map(r=>`<option>${r.name}</option>`).join('')}</select></div>
      <div class="field"><label>Status</label><select><option>Active</option><option>Inactive</option></select></div>
      <div class="field span-2"><label>Temporary Password</label><input type="text" value="MakTech@12345" readonly></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-user">${icon('check')} Create User</button>`
  });
}

function addRoleModal(){
  openModal({
    title:'Add Custom Role', sub:'Create a role and configure granular permissions afterward',
    body:`<div class="form-grid single">
      <div class="field"><label>Role Name *</label><input type="text" placeholder="e.g. Regional Manager"></div>
      <div class="field"><label>Description</label><textarea placeholder="What can this role access?"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-role">${icon('check')} Create Role</button>`
  });
}

/* ---------------- AUDIT LOG ---------------- */
function renderAudit(){
  const rows = DB.auditLogs.slice().reverse().map(a=>`
    <tr>
      <td>${avatarHtml(userName(a.user_id),'sm')}</td>
      <td class="cell-strong">${userName(a.user_id)}</td>
      <td><span class="badge badge-purple">${a.module}</span></td>
      <td>${statusBadge(a.action==='approve'?'approved':a.action==='delete'?'rejected':'active', a.action)}</td>
      <td>${a.record}</td>
      <td>${fmtDate(a.date)} <span class="cell-sub">${a.date.split(' ')[1]}</span></td>
    </tr>`).join('');
  return `
  <div class="view-header">
    <div><h1>Audit Log</h1><p>Who changed what, when — critical for financial data integrity</p></div>
    <div class="view-actions"><button class="btn btn-secondary btn-sm">${icon('download')} Export Log</button></div>
  </div>
  <div class="filter-bar">
    <select><option>All Modules</option>${[...new Set(DB.auditLogs.map(a=>a.module))].map(m=>`<option>${m}</option>`).join('')}</select>
    <select><option>All Users</option>${DB.users.map(u=>`<option>${u.name}</option>`).join('')}</select>
    <input type="date"><span class="muted">to</span><input type="date">
  </div>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>User</th><th>Module</th><th>Action</th><th>Record</th><th>Timestamp</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>`;
}

/* ---------------- SETTINGS ---------------- */
function renderSettings(){
  return `
  <div class="view-header"><div><h1>System Settings</h1><p>Organization profile, academic session, integrations & branding</p></div></div>
  <div class="tabs">
    <button class="tab-btn active" data-settingstab="org">Organization</button>
    <button class="tab-btn" data-settingstab="session">Academic Session</button>
    <button class="tab-btn" data-settingstab="sms">SMS / Email</button>
    <button class="tab-btn" data-settingstab="gateway">Payment Gateway</button>
    <button class="tab-btn" data-settingstab="rules">Business Rules</button>
    <button class="tab-btn" data-settingstab="backup">Backup & Export</button>
  </div>
  <div id="settingsPane">${settingsPane('org')}</div>`;
}

function settingsPane(tab){
  if(tab==='org') return `
    <div class="card card-pad">
      <div class="form-grid">
        <div class="field span-2"><label>Organization Name</label><input type="text" value="${DB.orgProfile.name}"></div>
        <div class="field"><label>Branch</label><input type="text" value="${DB.orgProfile.branch}"></div>
        <div class="field"><label>Phone</label><input type="text" value="${DB.orgProfile.phone}"></div>
        <div class="field span-2"><label>Address</label><input type="text" value="${DB.orgProfile.address}"></div>
        <div class="field span-2"><label>Email</label><input type="text" value="${DB.orgProfile.email}"></div>
        <div class="field span-2"><label>Logo (used on invoices, certificates, ID cards)</label><div class="flex-gap" style="border:1.5px dashed var(--gray-300);border-radius:10px;padding:14px;justify-content:center;color:var(--gray-400);">${icon('upload')} Upload logo (demo)</div></div>
      </div>
      <div class="hr"></div>
      <button class="btn btn-primary btn-sm" onclick="toast('Settings saved (demo)')">${icon('check')} Save Changes</button>
    </div>`;
  if(tab==='session') return `
    <div class="card card-pad">
      <div class="form-grid">
        <div class="field"><label>Current Academic Session</label><input type="text" value="${DB.orgProfile.session}"></div>
        <div class="field"><label>Session Start</label><input type="date" value="2025-07-01"></div>
        <div class="field"><label>Session End</label><input type="date" value="2026-06-30"></div>
        <div class="field"><label>Default Currency</label><select><option>BDT (৳)</option><option>USD ($)</option></select></div>
      </div>
      <div class="hr"></div>
      <button class="btn btn-primary btn-sm" onclick="toast('Session settings saved (demo)')">${icon('check')} Save Changes</button>
    </div>`;
  if(tab==='sms') return `
    <div class="card card-pad">
      <div class="form-grid">
        <div class="field"><label>SMS Provider</label><select><option>Alpha SMS</option><option>Bulk SMS BD</option><option>Custom API</option></select></div>
        <div class="field"><label>SMS API Key</label><input type="text" value="••••••••••••3f2a" readonly></div>
        <div class="field"><label>Email Provider (SMTP)</label><select><option>SMTP - Custom</option><option>SendGrid</option><option>Mailgun</option></select></div>
        <div class="field"><label>SMTP Host</label><input type="text" placeholder="smtp.example.com"></div>
      </div>
      <div class="hr"></div>
      <button class="btn btn-primary btn-sm" onclick="toast('Integration settings saved (demo)')">${icon('check')} Save Changes</button>
    </div>`;
  if(tab==='gateway') return `
    <div class="card card-pad">
      <div class="form-grid">
        <div class="field"><label>Gateway Provider</label><select><option>SSLCommerz</option><option>ShurjoPay</option></select></div>
        <div class="field"><label>Store ID</label><input type="text" value="maktech_live" readonly></div>
        <div class="field span-2"><label>API Secret Key</label><input type="text" value="••••••••••••••••••••8a1c" readonly></div>
        <div class="field"><label>bKash</label><div>${statusBadge('active','Enabled')}</div></div>
        <div class="field"><label>Nagad</label><div>${statusBadge('active','Enabled')}</div></div>
        <div class="field"><label>Rocket</label><div>${statusBadge('active','Enabled')}</div></div>
        <div class="field"><label>Card / VISA / MasterCard</label><div>${statusBadge('active','Enabled')}</div></div>
      </div>
      <div class="hr"></div>
      <button class="btn btn-primary btn-sm" onclick="toast('Gateway settings saved (demo)')">${icon('check')} Save Changes</button>
    </div>`;
  if(tab==='rules') return `
    <div class="card card-pad">
      <div class="form-grid">
        <div class="field"><label>Certificate release rule</label><select><option>Auto (100% payment + attendance ≥ 75%)</option><option>Manual approval always</option></select></div>
        <div class="field"><label>Migration fee</label><select><option>Fixed amount (৳1,000)</option><option>% of new course price (5%)</option></select></div>
        <div class="field"><label>Discount approval threshold</label><input type="text" value="Above 10% requires Manager approval"></div>
        <div class="field"><label>Due-date alert schedule</label><input type="text" value="3 days before, on due date, every 3 days overdue"></div>
        <div class="field"><label>Minimum first payment</label><input type="text" value="30% of total course fee"></div>
        <div class="field"><label>Refund policy window</label><input type="text" value="Within 14 days, 10% deduction"></div>
        <div class="field"><label>Low attendance threshold</label><input type="text" value="Below 70% triggers alert + blocks certificate"></div>
        <div class="field"><label>Teacher payment approval</label><input type="text" value="Any amount requires Admin/Manager approval before disbursement"></div>
        <div class="field"><label>Batch capacity rule</label><input type="text" value="A batch's capacity can never exceed its assigned lab's capacity — enforced on create/edit"></div>
        <div class="field"><label>Student enrollment limit</label><input type="text" value="Blocked automatically once a batch reaches its lab's seat capacity"></div>
        <div class="field"><label>Portal login without email</label><div>${statusBadge('active','Phone + OTP enabled')}</div></div>
      </div>
      <div class="hr"></div>
      <button class="btn btn-primary btn-sm" onclick="toast('Business rules saved (demo)')">${icon('check')} Save Changes</button>
    </div>`;
  if(tab==='backup') return `
    <div class="card card-pad">
      <div class="flex-between" style="margin-bottom:14px;"><div><b style="display:block;font-size:13.5px;">Last automatic backup</b><span class="cell-sub">Today, 03:00 AM — 412 MB</span></div><button class="btn btn-secondary btn-sm">${icon('download')} Download Backup</button></div>
      <div class="flex-between" style="margin-bottom:14px;"><div><b style="display:block;font-size:13.5px;">Backup frequency</b><span class="cell-sub">Daily at 3:00 AM, retained for 30 days</span></div><button class="btn btn-secondary btn-sm">${icon('edit')} Change Schedule</button></div>
      <div class="flex-between"><div><b style="display:block;font-size:13.5px;">Export all data (Excel)</b><span class="cell-sub">Students, payments, leads, attendance — full export</span></div><button class="btn btn-primary btn-sm">${icon('download')} Export Now</button></div>
    </div>`;
  return '';
}
