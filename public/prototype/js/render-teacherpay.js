/* ============================================================
   Teacher Payments — per-batch pay rates, payment requests, approval &
   disbursement vouchers. Mirrors the raise → approve → disburse lifecycle
   already used by Expenses & Cash Management elsewhere in this app.
   ============================================================ */

let tpActiveTab = 'rates';

function renderTeacherPayments(){
  const userId = currentUserId;
  const isTeacher = isTeacherRole(userId);
  const scopedBatchIds = scopedBatchesForUser(userId).map(b=>b.id);
  const pairs = teacherBatchPairs(scopedBatchIds);
  const payments = teacherPaymentsScopedForUser(userId).filter(p=>scopedBatchIds.includes(p.batch_id));

  const totalEarned = sum(pairs, pr=>computeEarnedForTeacherBatch(pr.teacher_id, pr.batch_id));
  const totalPaid = sum(pairs, pr=>totalPaidToTeacherForBatch(pr.teacher_id, pr.batch_id));
  const totalOutstanding = sum(pairs, pr=>outstandingForTeacherBatch(pr.teacher_id, pr.batch_id));
  const pendingCount = payments.filter(p=>p.status==='pending').length;
  const approvedCount = payments.filter(p=>p.status==='approved').length;

  tpActiveTab = 'rates';
  return `
  <div class="view-header">
    <div><h1>${isTeacher?'My Batch Payments':'Teacher Payments'}</h1><p>${isTeacher?'Your pay rate, earnings & payment history for your assigned batches':'Per-batch pay rates, payment requests, approvals & disbursement vouchers'}</p></div>
  </div>
  ${isTeacher ? `<div class="badge badge-amber" style="white-space:normal;margin-bottom:16px;">${icon('shield')} Showing only your own assigned batches — read-only. Contact Admin/Accounts for payment queries.</div>` : ''}
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('graduationCap', isTeacher?'Total Earned (My Batches)':'Total Earned (Computed)', fmtMoney(totalEarned), null, '#8b5cf6')}
    ${kpiCard('checkCircle','Total Paid', fmtMoney(totalPaid), null, '#10b981')}
    ${kpiCard('wallet','Outstanding Payable', fmtMoney(totalOutstanding), null, totalOutstanding>0?'#ef4444':'#10b981')}
    ${kpiCard('clock','Pending Approval', pendingCount, null, '#f59e0b')}
  </div>
  <div class="tabs" id="tpTabs">
    <button class="tab-btn active" data-tptab="rates">Pay Rates & Earnings</button>
    <button class="tab-btn" data-tptab="requests">Payment Requests${(pendingCount+approvedCount)>0?` <span class="badge badge-amber">${pendingCount+approvedCount}</span>`:''}</button>
    <button class="tab-btn" data-tptab="history">Payment History</button>
  </div>
  <div id="tpPane">${teacherPayPane('rates')}</div>`;
}

function wireTeacherPayTabs(){
  document.querySelectorAll('[data-tptab]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-tptab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      tpActiveTab = btn.dataset.tptab;
      document.getElementById('tpPane').innerHTML = teacherPayPane(tpActiveTab);
    });
  });
}

function teacherPayPane(tab){
  const userId = currentUserId;
  const isTeacher = isTeacherRole(userId);
  const canEdit = effectivePerm(userId,'TeacherPayments','Edit');
  const canCreate = effectivePerm(userId,'TeacherPayments','Create');
  const canApprove = effectivePerm(userId,'TeacherPayments','Approve');
  const scopedBatchIds = scopedBatchesForUser(userId).map(b=>b.id);

  if(tab==='requests'){
    const rows = teacherPaymentsScopedForUser(userId)
      .filter(p=>scopedBatchIds.includes(p.batch_id) && (p.status==='pending'||p.status==='approved'))
      .slice().reverse().map(p=>`
      <tr class="row-link" data-action="view-teacher-payment" data-id="${p.id}">
        <td class="cell-strong">${p.voucher_no}</td>
        <td>${userName(p.teacher_id)}</td>
        <td>${batchName(p.batch_id)}</td>
        <td><span class="badge badge-purple">${TEACHER_PAY_TYPE_LABELS[p.type]}</span><div class="cell-sub">${p.period_label}</div></td>
        <td class="cell-strong">${fmtMoney(p.amount)}</td>
        <td>${fmtDate(p.requested_date)}<div class="cell-sub">by ${userName(p.requested_by)}</div></td>
        <td>${statusBadge(p.status)}</td>
        <td>${!isTeacher ? `<div class="flex-gap">
          ${p.status==='pending' && canApprove ? `<button class="btn btn-sm btn-success" title="Approve" data-action="approve-teacher-payment" data-id="${p.id}">${icon('check')}</button><button class="btn btn-sm btn-ghost" style="color:var(--danger-600);" title="Reject" data-action="open-reject-teacher-payment" data-id="${p.id}">${icon('close')}</button>` : ''}
          ${p.status==='approved' && canEdit ? `<button class="btn btn-sm btn-primary" data-action="open-pay-teacher-payment" data-id="${p.id}">${icon('wallet')} Mark Paid</button>` : ''}
        </div>` : ''}</td>
      </tr>`).join('');
    return `<div class="card">
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Voucher</th><th>Teacher</th><th>Batch</th><th>Type</th><th>Amount</th><th>Requested</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="8" class="muted">No pending or approved payment requests${isTeacher?' for you':''}.</td></tr>`}</tbody></table></div>
    </div>`;
  }

  if(tab==='history'){
    const rows = teacherPaymentsScopedForUser(userId)
      .filter(p=>scopedBatchIds.includes(p.batch_id) && (p.status==='paid'||p.status==='rejected'))
      .slice().reverse().map(p=>`
      <tr class="row-link" data-action="view-teacher-payment" data-id="${p.id}">
        <td class="cell-strong">${p.voucher_no}</td>
        <td>${userName(p.teacher_id)}</td>
        <td>${batchName(p.batch_id)}</td>
        <td><span class="badge badge-purple">${TEACHER_PAY_TYPE_LABELS[p.type]}</span><div class="cell-sub">${p.period_label}</div></td>
        <td class="cell-strong">${fmtMoney(p.amount)}</td>
        <td>${p.status==='paid' ? `${methodBadge(p.payment_method)}<div class="cell-sub">${fmtDate(p.paid_date)}</div>` : `<span class="cell-sub">${p.rejection_reason||''}</span>`}</td>
        <td>${statusBadge(p.status)}</td>
        <td>${p.status==='paid' ? `<button class="btn btn-sm btn-ghost" title="View & print voucher" data-action="view-teacher-payment" data-id="${p.id}">${icon('printer')}</button>` : ''}</td>
      </tr>`).join('');
    return `<div class="card">
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Voucher</th><th>Teacher</th><th>Batch</th><th>Type</th><th>Amount</th><th>Method / Reason</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="8" class="muted">No completed payments yet.</td></tr>`}</tbody></table></div>
    </div>`;
  }

  // "rates" tab (default)
  const pairs = teacherBatchPairs(scopedBatchIds);
  const rows = pairs.map(pr=>{
    const rate = payRateFor(pr.teacher_id, pr.batch_id);
    const earned = computeEarnedForTeacherBatch(pr.teacher_id, pr.batch_id);
    const paid = totalPaidToTeacherForBatch(pr.teacher_id, pr.batch_id);
    const inFlight = totalInFlightForTeacherBatch(pr.teacher_id, pr.batch_id);
    const outstanding = outstandingForTeacherBatch(pr.teacher_id, pr.batch_id);
    const progress = !rate ? '—'
      : rate.rate_type==='per_session' ? `${sessionsHeldByTeacherForBatch(pr.teacher_id,pr.batch_id).length} classes held`
      : rate.rate_type==='per_hour' ? `${hoursTaughtByTeacherForBatch(pr.teacher_id,pr.batch_id)} hrs taught`
      : `<span class="muted">Fixed — no tracking needed</span>`;
    return `<tr>
      <td class="cell-strong">${userName(pr.teacher_id)}</td>
      <td>${batchName(pr.batch_id)}<div class="cell-sub">${courseName(DB.batches.find(b=>b.id===pr.batch_id)?.course_id)}</div></td>
      <td>${rate ? `<span class="badge badge-blue">${PAY_RATE_TYPE_LABELS[rate.rate_type]}</span><div class="cell-sub">${fmtMoney(rate.rate_amount)}${rate.rate_type==='per_session'?' / class':rate.rate_type==='per_hour'?' / hr':''}</div>` : `<span class="muted">No rate set</span>`}</td>
      <td>${progress}</td>
      <td class="cell-strong">${fmtMoney(earned)}</td>
      <td style="color:var(--success-700);">${fmtMoney(paid)}</td>
      <td style="color:${outstanding>0?'var(--danger-600)':'var(--gray-400)'};">${fmtMoney(outstanding)}${inFlight>0?`<div class="cell-sub">${fmtMoney(inFlight)} in review</div>`:''}</td>
      <td>${!isTeacher ? `<div class="flex-gap">
          ${canEdit?`<button class="btn btn-sm btn-ghost" title="${rate?'Edit':'Set'} pay rate" data-action="open-set-payrate" data-teacherid="${pr.teacher_id}" data-batchid="${pr.batch_id}">${icon('edit')}</button>`:''}
          ${canCreate && rate ? `<button class="btn btn-sm btn-outline" data-action="open-raise-teacher-payment" data-teacherid="${pr.teacher_id}" data-batchid="${pr.batch_id}">${icon('send')} Raise Payment</button>` : ''}
        </div>` : ''}</td>
    </tr>`;
  }).join('');
  return `<div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Teacher</th><th>Batch</th><th>Rate</th><th>Progress</th><th>Earned</th><th>Paid</th><th>Outstanding</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="8" class="muted">No batch-teacher assignments${isTeacher?' for you':''} yet — assign teachers to a batch from "Batches & Classes" first.</td></tr>`}</tbody></table></div>
  </div>`;
}

/* ---------------- Set / Edit Pay Rate ---------------- */
function setPayRateModal(teacherId, batchId){
  teacherId = Number(teacherId); batchId = Number(batchId);
  const b = DB.batches.find(x=>x.id===batchId); if(!b) return;
  const rate = payRateFor(teacherId, batchId);
  openModal({
    title:`${rate?'Edit':'Set'} Pay Rate`, sub:`${userName(teacherId)} — ${b.name} (${courseName(b.course_id)})`,
    body:`<div class="form-grid">
      <div class="field span-2"><label>Rate Type *</label><select id="tpRateType">
        ${Object.entries(PAY_RATE_TYPE_LABELS).map(([k,v])=>`<option value="${k}" ${rate?.rate_type===k?'selected':''}>${v}</option>`).join('')}
      </select></div>
      <div class="field span-2"><label>Rate Amount (BDT) *</label><input type="number" id="tpRateAmount" value="${rate?.rate_amount||''}" placeholder="e.g. 800"></div>
      <div class="field span-2"><label>Notes</label><textarea id="tpRateNotes" placeholder="Optional — e.g. negotiation terms">${rate?.notes||''}</textarea></div>
    </div>
    <div class="badge badge-blue" style="white-space:normal;margin-top:6px;">${icon('notification')} "Per Class Held" uses real attendance-marking records; "Per Hour Taught" uses class-schedule hours. Both update live as more classes are conducted.</div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-payrate" data-teacherid="${teacherId}" data-batchid="${batchId}">${icon('check')} Save Rate</button>`
  });
}

/* ---------------- Raise a Payment Request ---------------- */
function raiseTeacherPaymentModal(teacherId, batchId){
  teacherId = Number(teacherId); batchId = Number(batchId);
  const b = DB.batches.find(x=>x.id===batchId); if(!b) return;
  const rate = payRateFor(teacherId, batchId); if(!rate){ toast('Set a pay rate first', 'error'); return; }
  const earned = computeEarnedForTeacherBatch(teacherId, batchId);
  const outstanding = outstandingForTeacherBatch(teacherId, batchId);
  openModal({
    title:'Raise Payment Request', sub:`${userName(teacherId)} — ${b.name} · ${PAY_RATE_TYPE_LABELS[rate.rate_type]} @ ${fmtMoney(rate.rate_amount)}${rate.rate_type==='per_session'?'/class':rate.rate_type==='per_hour'?'/hr':''}`,
    body:`
    <div class="grid grid-3" style="margin-bottom:18px;">
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;">${fmtMoney(earned)}</div><div class="cell-sub">Earned So Far</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;color:var(--success-700);">${fmtMoney(totalPaidToTeacherForBatch(teacherId,batchId))}</div><div class="cell-sub">Already Paid</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;color:${outstanding>0?'var(--danger-600)':'var(--gray-400)'};">${fmtMoney(outstanding)}</div><div class="cell-sub">Outstanding</div></div>
    </div>
    <div class="form-grid">
      <div class="field span-2"><label>Payment Type *</label><select id="tpPayType">
        ${Object.entries(TEACHER_PAY_TYPE_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
      </select></div>
      <div class="field span-2"><label>Period / Description *</label><input type="text" id="tpPeriodLabel" placeholder="e.g. August 2026, or Full batch settlement" value="${monthLabel(TODAY)} ${new Date(TODAY).getFullYear()}"></div>
      <div class="field span-2"><label>Amount to Request (BDT) *</label><input type="number" id="tpAmount" value="${outstanding||''}"></div>
      <div class="field span-2"><label>Notes</label><textarea id="tpNotes" placeholder="Optional context for the approver"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-teacher-payment" data-teacherid="${teacherId}" data-batchid="${batchId}" data-computed="${earned}">${icon('send')} Submit Request</button>`
  });
}
function monthLabel(dateStr){ return new Date(dateStr).toLocaleDateString('en-GB',{month:'long'}); }

/* ---------------- Reject ---------------- */
function rejectTeacherPaymentModal(id){
  const p = DB.teacherPayments.find(x=>x.id===id); if(!p) return;
  openModal({
    title:'Reject Payment Request', sub:`${p.voucher_no} — ${userName(p.teacher_id)} · ${fmtMoney(p.amount)}`,
    body:`<div class="form-grid single"><div class="field"><label>Reason for Rejection *</label><textarea id="tpRejectReason" placeholder="e.g. Budget not approved, incorrect amount, etc."></textarea></div></div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" data-action="save-reject-teacher-payment" data-id="${id}">${icon('close')} Reject Request</button>`
  });
}

/* ---------------- Mark Paid (Disburse) ---------------- */
function markPaidModal(id){
  const p = DB.teacherPayments.find(x=>x.id===id); if(!p) return;
  openModal({
    title:'Disburse Payment', sub:`${p.voucher_no} — ${userName(p.teacher_id)} · ${batchName(p.batch_id)} · ${fmtMoney(p.amount)}`,
    body:`<div class="form-grid">
      <div class="field"><label>Payment Method *</label><select id="tpPayMethod"><option value="cash">Cash</option><option value="bank">Bank Transfer</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="cheque">Cheque</option></select></div>
      <div class="field"><label>Transaction / Cheque Ref.</label><input type="text" id="tpTxnRef" placeholder="Optional reference no."></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-pay-teacher-payment" data-id="${id}">${icon('wallet')} Confirm Disbursement</button>`
  });
}

/* ---------------- Voucher (view / print) ---------------- */
function teacherPaymentVoucherTemplate(id, opts){
  const p = DB.teacherPayments.find(x=>x.id===Number(id)); if(!p) return '<p class="muted">Record not found.</p>';
  const b = DB.batches.find(x=>x.id===p.batch_id);
  const logoSrc = (opts && opts.absoluteLogo) ? new URL('assets/logo.svg', location.href).href : 'assets/logo.svg';
  return `
  <div class="receipt-sheet">
    <div class="receipt-head">
      <div class="flex-gap">
        <div class="mark logo-chip" style="width:40px;height:40px;"><img src="${logoSrc}" alt="logo"></div>
        <div><b style="font-size:15px;display:block;">${DB.orgProfile.name}</b><span style="font-size:11px;color:var(--gray-500);display:block;">${DB.orgProfile.address}</span><span style="font-size:11px;color:var(--gray-500);">${DB.orgProfile.phone} · ${DB.orgProfile.email}</span></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:800;color:var(--primary-700);">TEACHER PAYMENT VOUCHER</div>
        <div class="cell-sub">${p.voucher_no}</div>
      </div>
    </div>
    <div class="hr"></div>
    <div class="grid grid-2" style="gap:14px;margin-bottom:16px;">
      <div><span class="cell-sub">Paid To</span><div class="cell-strong">${userName(p.teacher_id)}</div></div>
      <div><span class="cell-sub">Status</span><div class="cell-strong">${p.status==='paid'?'Disbursed':p.status==='approved'?'Approved — Awaiting Disbursement':p.status==='rejected'?'Rejected':'Pending Approval'}</div></div>
      <div><span class="cell-sub">Batch</span><div class="cell-strong">${b?b.name:'—'} (${courseName(b?.course_id)})</div></div>
      <div><span class="cell-sub">Payment Type</span><div class="cell-strong">${TEACHER_PAY_TYPE_LABELS[p.type]} — ${p.period_label}</div></div>
    </div>
    <div class="table-wrap" style="margin-bottom:16px;"><table class="data-table"><thead><tr><th>Description</th><th style="text-align:right;">Computed</th><th style="text-align:right;">Amount</th></tr></thead><tbody>
      <tr><td>${TEACHER_PAY_TYPE_LABELS[p.type]} — ${p.period_label}${p.notes?`<div class="cell-sub">${p.notes}</div>`:''}</td><td style="text-align:right;">${fmtMoney(p.computed_amount)}</td><td style="text-align:right;" class="cell-strong">${fmtMoney(p.amount)}</td></tr>
    </tbody></table></div>
    <div class="grid grid-2" style="gap:10px;margin-bottom:26px;font-size:13px;">
      <div class="flex-between"><span class="muted">Requested By</span><b>${userName(p.requested_by)} · ${fmtDate(p.requested_date)}</b></div>
      <div class="flex-between"><span class="muted">${p.status==='rejected'?'Rejected By':'Approved By'}</span><b>${p.approved_by?userName(p.approved_by)+' · '+fmtDate(p.approved_date):'—'}</b></div>
      ${p.status==='paid' ? `<div class="flex-between"><span class="muted">Disbursed By</span><b>${userName(p.paid_by)} · ${fmtDate(p.paid_date)}</b></div>
      <div class="flex-between"><span class="muted">Method / Ref.</span><b>${methodBadge(p.payment_method)} ${p.txn_ref||''}</b></div>` : ''}
      ${p.status==='rejected' ? `<div class="flex-between" style="grid-column:span 2;"><span class="muted">Reason</span><b style="color:var(--danger-600);">${p.rejection_reason}</b></div>` : ''}
    </div>
    <div class="flex-between" style="margin-top:30px;">
      <div style="text-align:center;"><div style="border-top:1.5px solid var(--gray-400);width:170px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Teacher / Coordinator Signature — ${userName(p.teacher_id)}</span></div>
      <div style="text-align:center;"><div style="border-top:1.5px solid var(--gray-400);width:170px;margin-bottom:6px;"></div><span style="font-size:11px;color:var(--gray-500);">Authorized Signature (Accounts) ${p.status==='paid'?'· '+fmtDate(p.paid_date):''}</span></div>
    </div>
  </div>`;
}

function teacherPaymentVoucherModal(id){
  const p = DB.teacherPayments.find(x=>x.id===Number(id)); if(!p) return;
  const statusText = { pending:'Pending Approval', approved:'Approved — Awaiting Disbursement', paid:'Disbursed', rejected:'Rejected' }[p.status] || p.status;
  openModal({ size:'lg', title:'Teacher Payment Voucher', sub:`${p.voucher_no} — ${statusText}`,
    body: teacherPaymentVoucherTemplate(id),
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="printTeacherPaymentVoucher(${p.id})">${icon('printer')} Print Voucher</button>`
  });
}
function printTeacherPaymentVoucher(id){
  const bodyHtml = teacherPaymentVoucherTemplate(id, { absoluteLogo:true });
  const html = `<!DOCTYPE html><html><head><title>Teacher Payment Voucher</title><meta charset="UTF-8">
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
    toast('Please allow pop-ups to print the voucher (demo)', 'error');
  }
}
