/* ============================================================
   Certificates & ID Cards module
   ============================================================ */

function certificateTemplatePreview(studentName, courseName, certNo, date){
  return `
  <div style="border:10px solid var(--primary-700); border-radius:6px; padding:30px; text-align:center; background:linear-gradient(180deg,#fdfdff,#f3f4ff); position:relative;">
    <div style="position:absolute;top:14px;right:14px;" class="qr-box"></div>
    <div style="font-size:11px;letter-spacing:.15em;color:var(--primary-600);font-weight:700;">${DB.orgProfile.name.toUpperCase()}</div>
    <div style="font-size:22px;font-weight:800;margin:16px 0 4px;color:var(--gray-900);font-family:Georgia,serif;">Certificate of Completion</div>
    <div style="font-size:12px;color:var(--gray-500);margin-bottom:20px;">This is proudly presented to</div>
    <div style="font-size:26px;font-weight:800;color:var(--primary-700);font-family:Georgia,serif;margin-bottom:16px;">${studentName}</div>
    <div style="font-size:13px;color:var(--gray-600);max-width:420px;margin:0 auto 20px;">for successfully completing the industrial attachment course</div>
    <div style="font-size:16px;font-weight:700;color:var(--gray-900);margin-bottom:20px;">${courseName}</div>
    <div class="flex-between" style="max-width:360px;margin:26px auto 0;">
      <div style="text-align:center;"><div style="border-top:1.5px solid var(--gray-400);width:120px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Course Coordinator</span></div>
      <div style="text-align:center;"><div style="border-top:1.5px solid var(--gray-400);width:120px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Executive Director</span></div>
    </div>
    <div style="margin-top:20px;font-size:10.5px;color:var(--gray-400);">Certificate No: ${certNo||'—'} &nbsp;·&nbsp; Issue Date: ${fmtDate(date)}</div>
  </div>`;
}

function renderCertificates(){
  const rows = DB.certificates.map(c=>{
    const s = studentById(c.student_id);
    return `<tr>
      <td class="cell-strong">${s.name}</td>
      <td>${courseName(c.course_id)}</td>
      <td>${c.cert_no||'—'}</td>
      <td>${fmtDate(c.issue_date)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.status==='issued' ? `<button class="btn btn-sm btn-outline" data-action="preview-certificate" data-id="${c.id}">${icon('eye')} Preview</button>` : `<button class="btn btn-sm btn-primary" data-action="issue-certificate" data-id="${c.id}">${icon('certificate')} Issue Now</button>`}</td>
    </tr>`;
  }).join('');

  return `
  <div class="view-header">
    <div><h1>Certificates</h1><p>Auto-generation on course completion, with QR-verifiable authenticity</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm" data-action="open-cert-template">${icon('edit')} Edit Template</button>
      <button class="btn btn-secondary btn-sm">${icon('printer')} Bulk Print</button>
    </div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('certificate','Issued', DB.certificates.filter(c=>c.status==='issued').length, null, '#10b981')}
    ${kpiCard('clock','Pending (Completed, Not Certified)', DB.certificates.filter(c=>c.status==='pending').length, null, '#f59e0b')}
    ${kpiCard('shield','Auto-rule', 'Payment 100% + Attendance ≥ 75%', null, '#ff6533')}
    ${kpiCard('qr','Verification Page', 'Public / QR-based', null, '#06b6d4')}
  </div>
  <div class="card" style="margin-bottom:20px;">
    <div class="card-header"><h3>Business Rule</h3><p>Configurable trigger for automatic certificate release</p></div>
    <div class="card-pad flex-gap" style="flex-wrap:wrap;">
      <span class="badge badge-green">${icon('checkCircle')} Course marked Completed</span>
      <span class="badge badge-green">${icon('checkCircle')} Attendance ≥ 75%</span>
      <span class="badge badge-green">${icon('checkCircle')} No outstanding due</span>
      <span class="muted" style="font-size:12.5px;">→ Certificate auto-generated &amp; notification sent to student portal</span>
    </div>
  </div>
  <div class="card">
    <div class="card-header"><h3>Certificate Register</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Course</th><th>Certificate No.</th><th>Issue Date</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>`;
}

function certificatePreviewModal(id){
  const c = DB.certificates.find(x=>x.id===id);
  const s = studentById(c.student_id);
  openModal({ size:'lg', title:'Certificate Preview', sub:`${s.name} — ${c.cert_no}`,
    body: certificateTemplatePreview(s.name, courseName(c.course_id), c.cert_no, c.issue_date),
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-outline">${icon('qr')} View Verify Page</button><button class="btn btn-primary">${icon('download')} Download PDF</button>`
  });
}

function certTemplateModal(){
  openModal({ size:'lg', title:'Certificate Template', sub:'Drag/drop builder (visual placeholder for prototype)',
    body: certificateTemplatePreview('[[Student Name]]', '[[Course Name]]', 'MT-CERT-XXXX-XXXX', '2026-08-06') +
      `<div class="grid grid-3 mt-16" style="gap:10px;">
        <button class="btn btn-secondary btn-sm">${icon('edit')} Edit Logo</button>
        <button class="btn btn-secondary btn-sm">${icon('edit')} Edit Signatures</button>
        <button class="btn btn-secondary btn-sm">${icon('qr')} QR Position</button>
      </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary">${icon('check')} Save Template</button>`
  });
}

/* ---------------- ID CARDS ---------------- */
function idCardPreview(student, card){
  return `
  <div style="width:320px;border-radius:16px;background:linear-gradient(135deg,var(--primary-700),var(--primary-900));color:#fff;padding:18px 20px;position:relative;overflow:hidden;box-shadow:var(--shadow-lg);">
    <div style="position:absolute;right:-40px;top:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.08);"></div>
    <div style="font-size:10px;letter-spacing:.1em;opacity:.85;">${DB.orgProfile.name.toUpperCase()}</div>
    <div style="font-size:11px;opacity:.7;margin-bottom:14px;">STUDENT IDENTITY CARD</div>
    <div class="flex-gap" style="align-items:flex-start;">
      <div style="width:60px;height:74px;background:rgba(255,255,255,.15);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">${initials(student.name)}</div>
      <div>
        <div style="font-size:15px;font-weight:800;">${student.name}</div>
        <div style="font-size:11px;opacity:.8;">${student.code}</div>
        <div style="font-size:11px;opacity:.8;margin-top:4px;">${courseName(student.courses[0]?.course_id)}</div>
      </div>
    </div>
    <div class="flex-between" style="margin-top:16px;align-items:flex-end;">
      <div style="font-size:10px;opacity:.75;">Valid till: ${fmtDate(card.valid_till)}</div>
      <div style="width:44px;height:44px;background:#fff;border-radius:6px;"></div>
    </div>
  </div>`;
}

function renderIdCards(){
  const rows = DB.idCards.map(c=>{
    const s = studentById(c.student_id);
    return `<tr>
      <td class="cell-strong">${s.name}</td>
      <td>${c.card_no}</td>
      <td>${fmtDate(c.issue_date)}</td>
      <td>${fmtDate(c.valid_till)}</td>
      <td>${statusBadge(c.status)}</td>
      <td><button class="btn btn-sm btn-outline" data-action="preview-idcard" data-id="${c.id}">${icon('eye')} Preview</button></td>
    </tr>`;
  }).join('');

  return `
  <div class="view-header">
    <div><h1>ID Cards</h1><p>QR-coded student ID card generation & bulk print production</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm" data-action="open-idcard-template">${icon('edit')} Edit Template</button>
      <button class="btn btn-primary btn-sm">${icon('printer')} Bulk Print</button>
    </div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('idcard','Active Cards', DB.idCards.filter(c=>c.status==='active').length, null, '#10b981')}
    ${kpiCard('clock','Expired', DB.idCards.filter(c=>c.status==='expired').length, null, '#ef4444')}
    ${kpiCard('swap','Reissued', DB.idCards.filter(c=>c.status==='reissued').length, null, '#f59e0b')}
    ${kpiCard('qr','QR Verification', 'Enabled', null, '#ff6533')}
  </div>
  <div class="card">
    <div class="card-header"><h3>ID Card Register</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Card No.</th><th>Issue Date</th><th>Valid Till</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>`;
}

function idCardPreviewModal(id){
  const c = DB.idCards.find(x=>x.id===id);
  const s = studentById(c.student_id);
  openModal({ title:'ID Card Preview', sub:`${s.name} — ${c.card_no}`,
    body:`<div style="display:flex;justify-content:center;">${idCardPreview(s,c)}</div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary">${icon('download')} Download PDF</button>`
  });
}
