/* ============================================================
   Payment & Accounting module — Invoices, Payments, Due/Overdue,
   Course Migration, Refunds, Expenses & Vendors
   ============================================================ */

/* ---------------- INVOICES & PAYMENTS ---------------- */
function renderInvoices(){
  const invRows = DB.feeInvoices.map(i=>`
    <tr class="row-link" data-action="view-invoice" data-id="${i.id}">
      <td class="cell-strong">${i.invoice_no}</td>
      <td>${studentName(i.student_id)}</td>
      <td>${courseName(DB.students.find(s=>s.id===i.student_id)?.courses[0]?.course_id)}</td>
      <td>${fmtMoney(i.total)}</td>
      <td style="color:var(--success-700);">${fmtMoney(i.paid)}</td>
      <td style="color:${i.due>0?'var(--danger-600)':'var(--gray-400)'};">${fmtMoney(i.due)}</td>
      <td>${fmtDate(i.due_date)}</td>
      <td>${statusBadge(i.status)}</td>
    </tr>`).join('');

  const payRows = DB.payments.slice().reverse().map(p=>`
    <tr>
      <td class="cell-strong">${p.receipt_no}</td>
      <td>${studentName(p.student_id)}</td>
      <td>${fmtMoney(p.amount)}</td>
      <td>${methodBadge(p.method)}</td>
      <td>${statusBadge(p.channel==='physical'?'active':'in_progress', p.channel==='physical'?'Physical':'Online')}</td>
      <td>${p.collected_by ? userName(p.collected_by) : (p.gateway_txn_id||'—')}</td>
      <td>${fmtDate(p.date)}</td>
      <td>${statusBadge(p.status)}</td>
      <td><button class="btn btn-sm btn-ghost" title="View & print receipt" data-action="view-receipt" data-id="${p.id}">${icon('printer')}</button></td>
    </tr>`).join('');

  return `
  <div class="view-header">
    <div><h1>Invoices & Payments</h1><p>Fee invoices, physical & online transactions, receipts</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm">${icon('printer')} Invoice Register</button>
      <button class="btn btn-primary btn-sm" data-action="open-record-payment">${icon('plus')} Record Payment</button>
    </div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('payment','Total Collected', fmtMoney(sum(DB.payments.filter(p=>p.status==='success'),p=>p.amount)), null, '#10b981')}
    ${kpiCard('wallet','Total Due', fmtMoney(KPI.totalDue()), null, '#f59e0b')}
    ${kpiCard('file','Invoices Issued', DB.feeInvoices.length, null, '#ff6533')}
    ${kpiCard('alertCircle','Overdue Invoices', DB.feeInvoices.filter(i=>i.status==='overdue').length, null, '#ef4444')}
  </div>

  <h3 class="report-section-title">Fee Invoices</h3>
  <div class="filter-bar">
    <div class="search-input-wrap">${icon('search')}<input type="text" placeholder="Search invoice or student…"></div>
    <select><option>All Status</option><option>Paid</option><option>Partial</option><option>Overdue</option><option>Unpaid</option></select>
  </div>
  <div class="card" style="margin-bottom:26px;">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Invoice</th><th>Student</th><th>Course</th><th>Total</th><th>Paid</th><th>Due</th><th>Due Date</th><th>Status</th></tr></thead>
    <tbody>${invRows}</tbody></table></div>
  </div>

  <h3 class="report-section-title">Transaction Log</h3>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Student</th><th>Amount</th><th>Method</th><th>Channel</th><th>Collected By / Txn ID</th><th>Date</th><th>Status</th><th></th></tr></thead>
    <tbody>${payRows}</tbody></table></div>
  </div>`;
}

function invoiceDetailModal(id){
  const inv = DB.feeInvoices.find(x=>x.id===id); if(!inv) return;
  const s = studentById(inv.student_id);
  const payments = DB.payments.filter(p=>p.invoice_id===id);
  const installments = DB.paymentInstallments.filter(x=>x.invoice_id===id);
  openModal({ size:'lg',
    title:inv.invoice_no, sub:`${s.name} · ${courseName(s.courses[0]?.course_id)}`,
    body:`
    <div class="flex-gap" style="margin-bottom:16px;">${statusBadge(inv.status)}<span class="badge badge-gray">Due: ${fmtDate(inv.due_date)}</span></div>
    <div class="grid grid-3" style="margin-bottom:20px;">
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;">${fmtMoney(inv.total)}</div><div class="cell-sub">Total Fee</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;color:var(--success-700);">${fmtMoney(inv.paid)}</div><div class="cell-sub">Paid</div></div>
      <div class="card card-pad" style="text-align:center;"><div style="font-size:16px;font-weight:800;color:${inv.due>0?'var(--danger-600)':'var(--gray-400)'};">${fmtMoney(inv.due)}</div><div class="cell-sub">Due</div></div>
    </div>
    ${installments.length ? `<h3 style="font-size:13px;margin-bottom:8px;">Installment Plan</h3>
    <div class="table-wrap" style="margin-bottom:18px;"><table class="data-table"><thead><tr><th>#</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead><tbody>
    ${installments.map(x=>`<tr><td>${x.no}</td><td>${fmtMoney(x.amount)}</td><td>${fmtDate(x.due_date)}</td><td>${statusBadge(x.status)}</td></tr>`).join('')}
    </tbody></table></div>` : ''}
    <h3 style="font-size:13px;margin-bottom:8px;">Payment History</h3>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Amount</th><th>Method</th><th>Date</th><th></th></tr></thead><tbody>
    ${payments.map(p=>`<tr><td>${p.receipt_no}</td><td>${fmtMoney(p.amount)}</td><td>${methodBadge(p.method)}</td><td>${fmtDate(p.date)}</td><td><button class="btn btn-sm btn-ghost" title="View & print receipt" data-action="view-receipt" data-id="${p.id}">${icon('printer')}</button></td></tr>`).join('')}
    </tbody></table></div>
    `,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-outline">${icon('printer')} Print Invoice</button><button class="btn btn-primary" data-action="open-record-payment" data-studentid="${s.id}">${icon('plus')} Record Payment</button>`
  });
}

function recordPaymentModal(studentId){
  const preset = studentId ? studentById(Number(studentId)) : null;
  const s = preset || DB.students.find(st=>invoiceForStudent(st.id)?.due>0) || DB.students[0];
  const inv = s ? invoiceForStudent(s.id) : null;
  const canDiscount = effectivePerm(currentUserId,'Payments','Approve');
  openModal({
    title:'Record Payment', sub: s ? `${s.name} (${s.code}) — Current Due: ${fmtMoney(inv?.due||0)}` : 'Accountant-recorded physical payment or online confirmation',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Student *</label><select id="rpStudentSelect" onchange="onRecordPaymentStudentChange()">
        ${DB.students.map(st=>`<option value="${st.id}" ${st.id===s?.id?'selected':''}>${st.name} (${st.code})</option>`).join('')}
      </select></div>
      <div class="field"><label>Current Due (BDT)</label><input type="text" id="rpCurrentDue" value="${inv?.due||0}" readonly></div>
      <div class="field"><label>Amount to Collect (BDT) *</label><input type="number" id="rpAmount" value="${inv?.due||0}" min="1" max="${inv?.due||0}"></div>
      <div class="field"><label>Payment Method *</label><select id="rpMethod"><option>Cash</option><option>Cheque</option><option>Bank Transfer</option><option>bKash</option><option>Nagad</option><option>Rocket</option><option>Card</option></select></div>
      <div class="field"><label>Channel</label><select id="rpChannel"><option value="physical">Physical (Accountant)</option><option value="online">Online (Gateway)</option></select></div>
      <div class="field span-2"><label>Receipt No. (auto-generated on save)</label><input type="text" value="${generateReceiptNo()}" readonly></div>
      ${canDiscount && inv ? `<div class="field span-2"><button type="button" class="btn btn-outline btn-sm" data-action="open-apply-discount" data-id="${inv.id}" onclick="closeModal()">${icon('wallet')} Apply Discount to this Invoice Instead</button></div>` : ''}
      <div class="field span-2"><label>Notes</label><textarea placeholder="Optional notes"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-payment" data-studentid="${s?.id||''}">${icon('check')} Record & Generate Receipt</button>`
  });
}
function onRecordPaymentStudentChange(){
  const sel = document.getElementById('rpStudentSelect'); if(!sel) return;
  const s = studentById(Number(sel.value)); const inv = s ? invoiceForStudent(s.id) : null;
  document.getElementById('rpCurrentDue').value = inv?.due || 0;
  const amtEl = document.getElementById('rpAmount'); amtEl.value = inv?.due || 0; amtEl.max = inv?.due || 0;
  const saveBtn = document.querySelector('[data-action="save-payment"]'); if(saveBtn) saveBtn.dataset.studentid = s?.id || '';
}

function applyDiscountModal(invoiceId){
  const inv = DB.feeInvoices.find(i=>i.id===Number(invoiceId)); if(!inv) return;
  const s = studentById(inv.student_id);
  openModal({
    title:'Apply Discount', sub:`${s.name} (${s.code}) — current due ${fmtMoney(inv.due)}`,
    body:`<div class="form-grid single">
      <div class="field"><label>Discount Amount (BDT) *</label><input type="number" id="discAmount" max="${inv.due}" min="1" placeholder="e.g. 1000"></div>
      <div class="field"><label>Reason *</label><textarea id="discReason" placeholder="Why is this discount being given?"></textarea></div>
    </div>
    <div class="badge badge-amber" style="white-space:normal;text-align:left;margin-top:10px;">${icon('shield')} Only users with "Approve" permission on Payments (managed by Admin via Access Control) can apply discounts.</div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-discount" data-id="${inv.id}">${icon('check')} Apply Discount</button>`
  });
}

/* ---------------- COLLECT PAYMENT (accountant walk-in search & instant receipt) ---------------- */
function renderCollectPayment(){
  return `
  <div class="view-header">
    <div><h1>Collect Payment</h1><p>Search a student by name, phone, code or batch to record a walk-in / manual payment and print the receipt instantly</p></div>
  </div>
  <div class="card card-pad" style="margin-bottom:20px;">
    <div class="search-input-wrap" style="max-width:480px;">${icon('search')}<input type="text" id="collectSearchInput" placeholder="Search by name, phone, student code or batch…" oninput="renderCollectResults(this.value)"></div>
    <p class="hint" style="margin-top:8px;">Leave blank to see students who currently have an outstanding due.</p>
  </div>
  <div id="collectResults">${collectResultsHtml('')}</div>`;
}
function collectResultsHtml(query){
  query = (query||'').trim().toLowerCase();
  let students;
  if(query){
    students = DB.students.filter(s=>{
      const batchNames = s.courses.map(c=>batchName(c.batch_id).toLowerCase()).join(' ');
      return s.name.toLowerCase().includes(query) || (s.phone||'').includes(query) || s.code.toLowerCase().includes(query) || batchNames.includes(query);
    });
  } else {
    students = DB.students.filter(s=>(invoiceForStudent(s.id)?.due||0)>0).slice(0,8);
  }
  if(!students.length) return `<div class="empty-state">${icon('search')}<p>No matching students. Try a different name, phone or batch.</p></div>`;
  const rows = students.map(s=>{
    const inv = invoiceForStudent(s.id);
    const enr = primaryEnrollment(s);
    return `<tr>
      <td>${avatarHtml(s.name,'sm')}</td>
      <td><span class="cell-strong">${s.name}</span><div class="cell-sub">${s.code} · ${s.phone}</div></td>
      <td>${courseName(enr?.course_id)}</td>
      <td>${batchName(enr?.batch_id)}</td>
      <td style="color:${(inv?.due||0)>0?'var(--danger-600)':'var(--success-700)'};font-weight:700;">${fmtMoney(inv?.due||0)}</td>
      <td>${inv?statusBadge(inv.status):'<span class="muted">—</span>'}</td>
      <td><button class="btn btn-sm btn-primary" data-action="open-record-payment" data-studentid="${s.id}">${icon('payment')} Collect</button></td>
    </tr>`;
  }).join('');
  return `<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Student</th><th>Course</th><th>Batch</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function renderCollectResults(query){ const el = document.getElementById('collectResults'); if(el) el.innerHTML = collectResultsHtml(query); }

/* ---------------- DUE / OVERDUE (tabbed: Today · All · Date Range · 7-day Follow-up) ---------------- */
let currentDueTab = 'today';
function renderDue(){
  currentDueTab = 'today';
  return `
  <div class="view-header">
    <div><h1>Due & Overdue Payments</h1><p>Student-wise due tracking, date filters and a 7-day follow-up with auto-SMS reminders</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="go-view" data-view="collect-payment">${icon('payment')} Collect Payment</button></div>
  </div>
  <div class="tabs">
    <button class="tab-btn active" data-duetab="today">Today's Due</button>
    <button class="tab-btn" data-duetab="all">All Due</button>
    <button class="tab-btn" data-duetab="range">Date-to-Date Filter</button>
    <button class="tab-btn" data-duetab="followup">Due Follow-up <span class="badge badge-amber" style="margin-left:4px;">${duesFollowupWindow().length}</span></button>
  </div>
  <div id="duePane">${duePane('today')}</div>`;
}
function wireDueTabs(){
  document.querySelectorAll('[data-duetab]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-duetab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentDueTab = btn.dataset.duetab;
      document.getElementById('duePane').innerHTML = duePane(currentDueTab);
    });
  });
}
function dueRow(inv){
  const days = invoiceDaysUntilDue(inv);
  const s = studentById(inv.student_id);
  const aging = days>0 ? statusBadge('pending', `Due in ${days}d`) : days===0 ? statusBadge('due','Due today') : statusBadge('overdue', Math.abs(days)+' days overdue');
  return `<tr class="row-link" data-action="view-invoice" data-id="${inv.id}">
    <td class="cell-strong">${s?.name||'—'}</td>
    <td>${courseName(primaryEnrollment(s)?.course_id)}</td>
    <td>${fmtMoney(inv.due)}</td>
    <td>${fmtDate(inv.due_date)}</td>
    <td>${aging}</td>
    <td><div class="flex-gap">
      <button class="btn btn-sm btn-outline" data-action="send-reminder" data-id="${inv.id}">${icon('send')} Remind</button>
      <button class="btn btn-sm btn-primary" data-action="open-record-payment" data-studentid="${s?.id}">${icon('plus')} Collect</button>
    </div></td>
  </tr>`;
}
function dueTableHtml(list, emptyMsg){
  if(!list.length) return `<div class="empty-state">${icon('checkCircle')}<p>${emptyMsg||'Nothing here — all clear!'}</p></div>`;
  return `<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Course</th><th>Due Amount</th><th>Due Date</th><th>Aging</th><th></th></tr></thead>
  <tbody>${list.map(dueRow).join('')}</tbody></table></div></div>`;
}
function duePane(tab){
  if(tab==='today'){
    const list = duesToday();
    return `<div class="grid grid-3" style="margin-bottom:18px;">
      ${kpiCard('wallet','Due Today / Overdue', list.length, null, '#ef4444')}
      ${kpiCard('payment','Total Amount', fmtMoney(sum(list,i=>i.due)), null, '#f59e0b')}
      ${kpiCard('send','Auto-Reminders Active', 'On due date + every 3 days', null, '#8b5cf6')}
    </div>${dueTableHtml(list, 'No payments are due today.')}`;
  }
  if(tab==='all'){
    const dues = duesAll();
    function bucket(inv){ const d=-invoiceDaysUntilDue(inv); if(d<=0) return '0'; if(d<=7) return '0-7'; if(d<=15) return '8-15'; if(d<=30) return '15-30'; return '30+'; }
    const b07=dues.filter(i=>bucket(i)==='0-7').length, b815=dues.filter(i=>bucket(i)==='8-15').length, b1530=dues.filter(i=>bucket(i)==='15-30').length, b30p=dues.filter(i=>bucket(i)==='30+').length;
    return `
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header"><h3>Overdue Aging Buckets</h3></div>
      <div class="card-pad">${renderBarChart([
        {label:'0–7 days', value:b07, color:'linear-gradient(180deg,#fbbf24,#f59e0b)'},
        {label:'8–15 days', value:b815, color:'linear-gradient(180deg,#fb923c,#f97316)'},
        {label:'15–30 days', value:b1530, color:'linear-gradient(180deg,#f87171,#ef4444)'},
        {label:'30+ days', value:b30p, color:'linear-gradient(180deg,#b91c1c,#7f1d1d)'},
      ])}</div>
    </div>
    ${dueTableHtml(dues, 'No outstanding dues anywhere in the system.')}`;
  }
  if(tab==='range'){
    return `
    <div class="card card-pad" style="margin-bottom:18px;">
      <div class="flex-gap" style="flex-wrap:wrap;">
        <div class="field"><label>From</label><input type="date" id="dueFromDate" value="2026-08-01"></div>
        <div class="field"><label>To</label><input type="date" id="dueToDate" value="2026-08-31"></div>
        <button class="btn btn-primary" style="margin-top:18px;" onclick="applyDueRangeFilter()">${icon('filter')} Apply Filter</button>
      </div>
    </div>
    <div id="dueRangeResults">${dueTableHtml(duesInRange('2026-08-01','2026-08-31'), 'No dues in this date range.')}</div>`;
  }
  if(tab==='followup'){
    ensureFollowupSmsSent();
    const list = duesFollowupWindow();
    const sentCount = list.filter(i=>{ const last = followupNotificationsFor(i.id).slice(-1)[0]; return last && last.status==='sent'; }).length;
    const failedCount = list.length - sentCount;
    const rows = list.map(inv=>{
      const s = studentById(inv.student_id);
      const notifs = followupNotificationsFor(inv.id);
      const last = notifs.slice(-1)[0];
      const days = invoiceDaysUntilDue(inv);
      return `<tr>
        <td class="cell-strong">${s?.name||'—'}</td>
        <td>${s?.phone||'—'}</td>
        <td>${fmtMoney(inv.due)}</td>
        <td>${fmtDate(inv.due_date)}</td>
        <td>${days>=0?statusBadge('pending',`In ${days}d`):statusBadge('overdue',Math.abs(days)+'d overdue')}</td>
        <td>${last?statusBadge(last.status):'<span class="muted">—</span>'} <span class="cell-sub">(${notifs.length} sent)</span></td>
        <td><button class="btn btn-sm btn-outline" data-action="resend-followup-sms" data-id="${inv.id}">${icon('send')} Notify Again</button></td>
      </tr>`;
    }).join('');
    return `
    <div class="grid grid-3" style="margin-bottom:18px;">
      ${kpiCard('send','In Follow-up Window', list.length, null, '#8b5cf6')}
      ${kpiCard('checkCircle','SMS Delivered', sentCount, null, '#10b981')}
      ${kpiCard('alertCircle','SMS Failed', failedCount, null, '#ef4444')}
    </div>
    <div class="badge badge-blue" style="white-space:normal;margin-bottom:14px;">${icon('notification')} Every due payment within 7 days (upcoming or already overdue) automatically gets an SMS reminder once per day. Admin/Accountant can see delivery status here and manually resend at any time.</div>
    ${list.length ? `<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Phone</th><th>Due</th><th>Due Date</th><th>Timing</th><th>Last SMS</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>` : `<div class="empty-state">${icon('checkCircle')}<p>No payments due within the next 7 days.</p></div>`}`;
  }
  return '';
}
function applyDueRangeFilter(){
  const from = document.getElementById('dueFromDate')?.value || '2026-01-01';
  const to = document.getElementById('dueToDate')?.value || '2026-12-31';
  const el = document.getElementById('dueRangeResults');
  if(el) el.innerHTML = dueTableHtml(duesInRange(from,to), 'No dues in this date range.');
}

/* ---------------- CASH MANAGEMENT (bank deposits & signed handovers — chain of custody) ---------------- */
let currentCashTab = 'today';
function renderCashManagement(){
  currentCashTab = 'today';
  return `
  <div class="view-header">
    <div><h1>Cash Management</h1><p>Every cash receipt, tracked from collection to bank deposit or a signed handover — daily, monthly & date-range views</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm" data-action="open-cash-handover" data-type="handover">${icon('user')} Handover to Boss / Director</button>
      <button class="btn btn-primary btn-sm" data-action="open-cash-handover" data-type="bank_deposit">${icon('building')} New Bank Deposit</button>
    </div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('payment','Cash Collected Today', fmtMoney(cashCollectedToday()), null, '#10b981')}
    ${kpiCard('wallet','Cash In Hand (Undeposited)', fmtMoney(cashInHandTotal()), null, cashInHandTotal()>0?'#ef4444':'#10b981')}
    ${kpiCard('building','Deposited / Handed Over Today', fmtMoney(sum(cashHandoversToday(),h=>h.amount)), null, '#3b82f6')}
    ${kpiCard('report','Collected This Month', fmtMoney(cashCollectedInRange(TODAY.slice(0,7)+'-01', TODAY)), null, '#8b5cf6')}
  </div>

  <div class="card" style="margin-bottom:26px;">
    <div class="card-header"><h3>Undeposited Cash In Hand</h3><p>Select receipts below, then create a bank deposit or a handover — leave nothing selected to bundle everything</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr>
      <th style="width:34px;"><input type="checkbox" id="cashSelectAll" onclick="toggleAllCashCheckboxes(this.checked)" ${undepositedCashPayments().length?'':'disabled'}></th>
      <th>Receipt</th><th>Student</th><th>Amount</th><th>Collected By</th><th>Date</th></tr></thead><tbody>
    ${undepositedCashPayments().length ? undepositedCashPayments().map(p=>`
      <tr><td><input type="checkbox" class="cash-pay-cb" value="${p.id}"></td>
      <td class="cell-strong">${p.receipt_no}</td><td>${studentName(p.student_id)}</td><td>${fmtMoney(p.amount)}</td><td>${p.collected_by?userName(p.collected_by):'—'}</td><td>${fmtDate(p.date)}</td></tr>`).join('')
      : `<tr><td colspan="6" style="padding:0;"><div class="empty-state" style="padding:34px 20px;">${icon('checkCircle')}<p>All collected cash has already been deposited or handed over — nothing pending.</p></div></td></tr>`}
    </tbody></table></div>
  </div>

  <h3 class="report-section-title">Deposit & Handover History</h3>
  <div class="tabs">
    <button class="tab-btn active" data-cashtab="today">Today</button>
    <button class="tab-btn" data-cashtab="month">This Month</button>
    <button class="tab-btn" data-cashtab="range">Date-to-Date Filter</button>
  </div>
  <div id="cashPane">${cashPane('today')}</div>`;
}
function wireCashTabs(){
  document.querySelectorAll('[data-cashtab]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-cashtab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentCashTab = btn.dataset.cashtab;
      document.getElementById('cashPane').innerHTML = cashPane(currentCashTab);
    });
  });
}
function toggleAllCashCheckboxes(checked){ document.querySelectorAll('.cash-pay-cb').forEach(cb=>cb.checked=checked); }
function cashHandoverRow(h){
  const canConfirm = h.status==='pending' && (currentUserId===h.handed_to || effectivePerm(currentUserId,'CashManagement','Approve'));
  return `<tr>
    <td class="cell-strong">${h.receipt_no}</td>
    <td>${fmtDate(h.date)}</td>
    <td>${h.type==='bank_deposit' ? statusBadge('active','Bank Deposit') : statusBadge('in_progress','Handover')}</td>
    <td>${fmtMoney(h.amount)}</td>
    <td>${(h.payment_ids||[]).length} receipt(s)</td>
    <td>${userName(h.created_by)}</td>
    <td>${h.type==='bank_deposit' ? `${h.bank_name} <span class="cell-sub">(${h.slip_no})</span>` : userName(h.handed_to)}</td>
    <td>${h.status==='confirmed' ? statusBadge('active','Confirmed & Signed') : statusBadge('pending','Awaiting Signature')}</td>
    <td><div class="flex-gap">
      ${h.attachment ? `<button class="btn btn-sm btn-ghost" title="View attached ${h.attachment.mime.startsWith('image/')?'photo':'document'}" data-action="view-cash-attachment" data-id="${h.id}">${icon('file')}</button>` : ''}
      <button class="btn btn-sm btn-ghost" title="View & print receipt" data-action="view-cash-receipt" data-id="${h.id}">${icon('printer')}</button>
      ${canConfirm ? `<button class="btn btn-sm btn-success" data-action="open-confirm-cash-handover" data-id="${h.id}">${icon('check')} Confirm</button>` : ''}
    </div></td>
  </tr>`;
}
function cashHandoverTableHtml(list, emptyMsg){
  if(!list.length) return `<div class="empty-state">${icon('wallet')}<p>${emptyMsg||'No records found.'}</p></div>`;
  return `<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Date</th><th>Type</th><th>Amount</th><th>Covers</th><th>Handled By</th><th>To</th><th>Status</th><th></th></tr></thead>
  <tbody>${list.slice().reverse().map(cashHandoverRow).join('')}</tbody></table></div></div>`;
}
function cashPane(tab){
  if(tab==='today') return cashHandoverTableHtml(cashHandoversToday(), 'No deposits or handovers recorded today.');
  if(tab==='month') return cashHandoverTableHtml(cashHandoversThisMonth(), 'No deposits or handovers recorded this month.');
  if(tab==='range'){
    return `
    <div class="card card-pad" style="margin-bottom:18px;">
      <div class="flex-gap" style="flex-wrap:wrap;">
        <div class="field"><label>From</label><input type="date" id="cashFromDate" value="2026-08-01"></div>
        <div class="field"><label>To</label><input type="date" id="cashToDate" value="2026-08-06"></div>
        <button class="btn btn-primary" style="margin-top:18px;" onclick="applyCashRangeFilter()">${icon('filter')} Apply Filter</button>
      </div>
    </div>
    <div id="cashRangeResults">${cashHandoverTableHtml(cashHandoversInRange('2026-08-01','2026-08-06'), 'No deposits or handovers in this date range.')}</div>`;
  }
  return '';
}
function applyCashRangeFilter(){
  const from = document.getElementById('cashFromDate')?.value || '2026-01-01';
  const to = document.getElementById('cashToDate')?.value || '2026-12-31';
  const el = document.getElementById('cashRangeResults');
  if(el) el.innerHTML = cashHandoverTableHtml(cashHandoversInRange(from,to), 'No deposits or handovers in this date range.');
}

/* ---------------- File attachments — proof photos/scans (deposit slips, handover photos, etc.) ----------------
   Read client-side via FileReader into a data URL and held in a module-level var until the form is actually
   saved (kept out of DB.cashHandovers until then so a cancelled modal doesn't leave anything dangling). */
let pendingCashAttachment = null;
function attachmentUploadFieldHtml(inputId, previewWrapId){
  return `
  <div class="field span-2">
    <label>Attachment — deposit slip, receipt photo or screenshot (optional)</label>
    <div id="${previewWrapId}"></div>
    <label class="upload-dropzone" for="${inputId}">${icon('upload')}<span>Click to upload a photo, screenshot or PDF (max 4MB)</span></label>
    <input type="file" id="${inputId}" accept="image/*,.pdf" style="display:none;">
  </div>`;
}
function attachmentPreviewHtml(a, removable){
  if(!a) return '';
  const isImg = (a.mime||'').startsWith('image/');
  return `<div class="attach-preview">
    ${isImg ? `<img src="${a.dataUrl}" alt="attachment preview">` : `<div class="attach-file-ic">${icon('file')}</div>`}
    <div class="attach-meta"><b>${a.name}</b><span>${isImg?'Image':'Document'} attached</span></div>
    ${removable ? `<button type="button" class="icon-btn sm danger" title="Remove attachment" data-action="remove-cash-attachment">${icon('close')}</button>` : ''}
  </div>`;
}
function renderCashAttachmentPreview(previewWrapId){
  const wrap = document.getElementById(previewWrapId || 'cashAttachPreviewWrap'); if(!wrap) return;
  wrap.innerHTML = attachmentPreviewHtml(pendingCashAttachment, true);
}
function wireAttachmentInput(inputId, previewWrapId){
  const input = document.getElementById(inputId); if(!input) return;
  input.addEventListener('change', ()=>{
    const file = input.files && input.files[0]; if(!file) return;
    if(file.size > 4*1024*1024){ toast('File is too large — 4MB max for this demo', 'error'); input.value=''; return; }
    const reader = new FileReader();
    reader.onload = ()=>{
      pendingCashAttachment = { name:file.name, mime:file.type||'application/octet-stream', dataUrl:reader.result };
      renderCashAttachmentPreview(previewWrapId);
    };
    reader.readAsDataURL(file);
  });
}
function viewCashAttachmentModal(id){
  const h = DB.cashHandovers.find(x=>x.id===id); if(!h || !h.attachment) return;
  const a = h.attachment; const isImg = (a.mime||'').startsWith('image/');
  openModal({ title:'Attached Document', sub:`${h.receipt_no} · ${a.name}`,
    body: isImg ? `<div style="text-align:center;"><img src="${a.dataUrl}" alt="${a.name}" style="max-width:100%;border-radius:10px;border:1px solid var(--gray-200);"></div>`
      : `<div style="text-align:center;padding:30px 0;">${icon('file')}<p class="muted" style="margin-top:10px;">${a.name}</p><a class="btn btn-outline btn-sm" href="${a.dataUrl}" download="${a.name}" style="margin-top:6px;">${icon('download')} Download / Open PDF</a></div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button>`
  });
}

function cashHandoverModal(type){
  pendingCashAttachment = null;
  const checked = Array.from(document.querySelectorAll('.cash-pay-cb:checked')).map(cb=>Number(cb.value));
  const ids = checked.length ? checked : undepositedCashPayments().map(p=>p.id);
  const payments = DB.payments.filter(p=>ids.includes(p.id));
  const total = sum(payments, p=>p.amount);
  const isBank = type==='bank_deposit';
  openModal({ size:'lg',
    title: isBank ? 'New Bank Deposit' : 'Handover Cash to Boss / Finance Director',
    sub: payments.length ? `${payments.length} cash receipt(s) selected — total ${fmtMoney(total)}` : 'No undeposited cash receipts available right now',
    body:`
    ${payments.length ? `<div class="table-wrap" style="margin-bottom:16px;max-height:180px;overflow:auto;"><table class="data-table"><thead><tr><th>Receipt</th><th>Student</th><th style="text-align:right;">Amount</th><th>Date</th></tr></thead><tbody>
      ${payments.map(p=>`<tr><td>${p.receipt_no}</td><td>${studentName(p.student_id)}</td><td style="text-align:right;">${fmtMoney(p.amount)}</td><td>${fmtDate(p.date)}</td></tr>`).join('')}
    </tbody></table></div>`
    : `<div class="badge badge-amber" style="white-space:normal;margin-bottom:14px;">${icon('alertCircle')} There is currently no undeposited cash to bundle. Collect a cash payment first.</div>`}
    <div class="form-grid">
      ${isBank ? `
      <div class="field"><label>Bank Name *</label><input type="text" id="chBankName" value="Dutch-Bangla Bank Ltd."></div>
      <div class="field"><label>Branch</label><input type="text" id="chBranch" value="Dhanmondi Branch"></div>
      <div class="field"><label>Account No. *</label><input type="text" id="chAccountNo" value="1051-2200-9911"></div>
      <div class="field"><label>Deposit Slip No. *</label><input type="text" id="chSlipNo" placeholder="Bank-issued slip / reference number"></div>
      ` : `
      <div class="field span-2"><label>Hand Over To *</label><select id="chHandedTo">
        ${cashCustodians().filter(u=>u.id!==currentUserId).map(u=>`<option value="${u.id}">${u.name} — ${roleName(u.role_id)}</option>`).join('')}
      </select></div>
      <div class="field span-2"><div class="badge badge-amber" style="white-space:normal;">${icon('shield')} The recipient (or an authorized approver) must sign to confirm they physically received this cash before it's considered settled.</div></div>
      `}
      <div class="field span-2"><label>Amount (BDT)</label><input type="text" value="${fmtMoney(total)}" readonly></div>
      ${attachmentUploadFieldHtml('chAttachmentInput','cashAttachPreviewWrap')}
      <div class="field span-2"><label>Notes</label><textarea id="chNotes" placeholder="Optional notes"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-cash-handover" data-type="${type}" data-ids="${ids.join(',')}" ${payments.length?'':'disabled'}>${icon('check')} ${isBank?'Record Deposit':'Save Handover'}</button>`
  });
  wireAttachmentInput('chAttachmentInput','cashAttachPreviewWrap');
}

function confirmCashHandoverModal(id){
  const h = DB.cashHandovers.find(x=>x.id===id); if(!h) return;
  openModal({ title:'Confirm Cash Receipt', sub:`${h.receipt_no} — ${fmtMoney(h.amount)} from ${userName(h.created_by)}`,
    body:`<div class="badge badge-blue" style="white-space:normal;margin-bottom:14px;">${icon('shield')} By signing below you confirm you have physically received ${fmtMoney(h.amount)} in cash from ${userName(h.created_by)}, covering ${(h.payment_ids||[]).length} receipt(s).</div>
    ${h.attachment ? `<label class="hint" style="text-transform:none;font-weight:800;color:var(--gray-700);font-size:12.5px;display:block;margin-bottom:6px;">Proof attached by ${userName(h.created_by)}</label>${attachmentPreviewHtml(h.attachment, false)}` : ''}
    <div class="form-grid single">
      <div class="field"><label>Your Full Name (Digital Signature) *</label><input type="text" id="ccSignature" value="${currentUser().name}"></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-confirm-cash-handover" data-id="${h.id}">${icon('check')} Sign & Confirm Receipt</button>`
  });
}

/* ---------------- COURSE MIGRATION ---------------- */
function renderMigrations(){
  const rows = DB.courseMigrations.map(m=>`
    <tr>
      <td class="cell-strong">${studentName(m.student_id)}</td>
      <td>${courseName(m.from_course_id)} → ${courseName(m.to_course_id)}</td>
      <td>${m.requested_by}</td>
      <td>${fmtMoney(m.old_paid)}</td>
      <td>${fmtMoney(m.new_price)}</td>
      <td>${fmtMoney(m.migration_fee)}</td>
      <td>${fmtMoney(m.net_adjustment)}</td>
      <td>${statusBadge(m.status)}</td>
      <td>${m.status==='requested' ? `<div class="flex-gap"><button class="btn btn-sm btn-success" data-action="approve-migration" data-id="${m.id}">${icon('check')}</button><button class="btn btn-sm btn-danger" data-action="reject-migration" data-id="${m.id}">${icon('close')}</button></div>` : '—'}</td>
    </tr>`).join('');
  return `
  <div class="view-header">
    <div><h1>Course Migration</h1><p>Student course transfer requests with automatic fee recalculation</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-migration">${icon('plus')} New Migration Request</button></div>
  </div>
  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('swap','Total Migrations', DB.courseMigrations.length, null, '#ff6533')}
    ${kpiCard('clock','Pending Approval', DB.courseMigrations.filter(m=>m.status==='requested').length, null, '#f59e0b')}
    ${kpiCard('checkCircle','Approved', DB.courseMigrations.filter(m=>m.status==='approved').length, null, '#10b981')}
    ${kpiCard('payment','Migration Fees Collected', fmtMoney(sum(DB.courseMigrations.filter(m=>m.status==='approved'),m=>m.migration_fee)), null, '#8b5cf6')}
  </div>
  <div class="card">
    <div class="card-header"><h3>Migration Requests</h3><p>Full auditable trail — old course, new course, fee adjustment, approver</p></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Course Change</th><th>Requested By</th><th>Old Paid</th><th>New Price</th><th>Migration Fee</th><th>Net Adj.</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>`;
}

function migrationRequestModal(studentId){
  const s = studentId ? studentById(Number(studentId)) : DB.students[4];
  const currentCourse = DB.courses.find(c=>c.id===s.courses[0]?.course_id);
  return openModal({ size:'lg',
    title:'Course Migration Request', sub:`${s.name} — currently enrolled in ${currentCourse?.name}`,
    body:`
    <div class="form-grid" style="margin-bottom:18px;">
      <div class="field span-2"><label>Migrate To *</label><select id="migToCourse" onchange="updateMigrationPreview()">
        ${DB.courses.filter(c=>c.id!==currentCourse?.id && c.status==='active').map(c=>`<option value="${c.id}" data-price="${c.base_price}">${c.name} — ${fmtMoney(c.base_price)}</option>`).join('')}
      </select></div>
      <div class="field span-2"><label>Reason for Migration</label><textarea placeholder="Why is the student requesting to migrate?"></textarea></div>
    </div>
    <div class="card card-pad" id="migrationPreview" style="background:var(--primary-50);border-color:var(--primary-100);">
      <b style="font-size:12.5px;color:var(--primary-700);display:block;margin-bottom:10px;">Real-time Fee Difference Preview</b>
      <div class="grid grid-2" style="gap:10px;font-size:13px;">
        <div class="flex-between"><span class="muted">Already Paid (carried over)</span><b id="migPaid">${fmtMoney(sum(DB.payments.filter(p=>p.student_id===s.id),p=>p.amount))}</b></div>
        <div class="flex-between"><span class="muted">New Course Price</span><b id="migNewPrice">—</b></div>
        <div class="flex-between"><span class="muted">Migration Fee (configurable)</span><b id="migFee">৳1,000</b></div>
        <div class="flex-between"><span class="muted">Net Additional Due</span><b id="migNet" style="color:var(--primary-700);">—</b></div>
      </div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-migration" data-studentid="${s.id}">${icon('send')} Submit for Approval</button>`
  });
}
function updateMigrationPreview(){
  const sel = document.getElementById('migToCourse');
  if(!sel) return;
  const price = Number(sel.selectedOptions[0].dataset.price);
  const paid = Number(document.getElementById('migPaid').textContent.replace(/[^\d]/g,''));
  const fee = 1000;
  document.getElementById('migNewPrice').textContent = fmtMoney(price);
  document.getElementById('migNet').textContent = fmtMoney(Math.max(0, price - paid + fee));
}

/* ---------------- REFUNDS ---------------- */
function renderRefunds(){
  const rows = DB.refunds.map(r=>{
    const p = DB.payments.find(x=>x.id===r.payment_id);
    return `<tr>
      <td class="cell-strong">${studentName(p.student_id)}</td>
      <td>${p.receipt_no}</td>
      <td>${fmtMoney(r.amount)}</td>
      <td style="max-width:240px;white-space:normal;">${r.reason}</td>
      <td>${r.approved_by?userName(r.approved_by):'—'}</td>
      <td>${fmtDate(r.date)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${r.status==='requested' ? `<button class="btn btn-sm btn-success" data-action="approve-refund" data-id="${r.id}">${icon('check')} Approve</button>` : '—'}</td>
    </tr>`;
  }).join('');
  return `
  <div class="view-header">
    <div><h1>Refunds</h1><p>Refund requests with approval workflow and reason logging</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-refund">${icon('plus')} New Refund Request</button></div>
  </div>
  <div class="grid grid-3" style="margin-bottom:20px;">
    ${kpiCard('wallet','Total Refunds Processed', fmtMoney(sum(DB.refunds.filter(r=>r.status==='approved'),r=>r.amount)), null, '#8b5cf6')}
    ${kpiCard('clock','Pending Approval', DB.refunds.filter(r=>r.status==='requested').length, null, '#f59e0b')}
    ${kpiCard('checkCircle','Approved This Month', DB.refunds.filter(r=>r.status==='approved').length, null, '#10b981')}
  </div>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Original Receipt</th><th>Refund Amount</th><th>Reason</th><th>Approved By</th><th>Date</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>`;
}

/* ---------------- EXPENSES & VENDORS ---------------- */
function renderExpenses(){
  const rows = DB.expenses.map(e=>`
    <tr>
      <td class="cell-strong">${e.title}</td>
      <td><span class="badge badge-purple">${e.category}</span></td>
      <td>${fmtMoney(e.amount)}</td>
      <td>${e.batch_id?batchName(e.batch_id):'—'}</td>
      <td>${e.vendor_id?DB.vendors.find(v=>v.id===e.vendor_id)?.name:'—'}</td>
      <td>${fmtDate(e.expense_date)}</td>
      <td>${statusBadge(e.status)}</td>
      <td>${e.status==='pending' ? `<button class="btn btn-sm btn-success" data-action="approve-expense" data-id="${e.id}">${icon('check')} Approve</button>` : '—'}</td>
    </tr>`).join('');

  const byCategory = DB.expenseCategories.map((c,i)=>({label:c, value:sum(DB.expenses.filter(e=>e.category===c),e=>e.amount), color:['#ff6533','#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444'][i]})).filter(x=>x.value>0);

  const vendorRows = DB.vendors.map(v=>`<tr><td class="cell-strong">${v.name}</td><td>${v.phone}</td><td>${v.email}</td><td>${v.terms}</td><td>${fmtMoney(sum(DB.expenses.filter(e=>e.vendor_id===v.id),e=>e.amount))}</td></tr>`).join('');

  return `
  <div class="view-header">
    <div><h1>Expenses & Vendors</h1><p>Event, tour, facility & operational cost tracking with approval workflow</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-expense">${icon('plus')} Add Expense</button></div>
  </div>
  <div class="grid grid-2" style="margin-bottom:20px;align-items:start;">
    <div class="card">
      <div class="card-header"><h3>Expense by Category</h3></div>
      <div class="card-pad">${renderDonut(byCategory)}</div>
    </div>
    <div class="grid grid-2" style="gap:18px;">
      ${kpiCard('expense','Total Expense (Paid)', fmtMoney(sum(DB.expenses.filter(e=>e.status==='paid'),e=>e.amount)), null, '#ef4444')}
      ${kpiCard('clock','Pending Approval', DB.expenses.filter(e=>e.status==='pending').length, null, '#f59e0b')}
      ${kpiCard('checkCircle','Approved (Unpaid)', DB.expenses.filter(e=>e.status==='approved').length, null, '#3b82f6')}
      ${kpiCard('building','Active Vendors', DB.vendors.length, null, '#8b5cf6')}
    </div>
  </div>

  <h3 class="report-section-title">Expense Log</h3>
  <div class="card" style="margin-bottom:26px;">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Linked Batch</th><th>Vendor</th><th>Date</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>

  <h3 class="report-section-title">Vendors / Suppliers</h3>
  <div class="card">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Vendor</th><th>Phone</th><th>Email</th><th>Payment Terms</th><th>Total Paid</th></tr></thead>
    <tbody>${vendorRows}</tbody></table></div>
  </div>`;
}

function addExpenseModal(){
  openModal({
    title:'Add Expense', sub:'Log event, tour, facility or operational cost',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Title *</label><input type="text" placeholder="e.g. Factory Tour — Batch-26-A"></div>
      <div class="field"><label>Category *</label><select>${DB.expenseCategories.map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Amount (BDT) *</label><input type="number" placeholder="35000"></div>
      <div class="field"><label>Linked Batch</label><select><option>—</option>${DB.batches.map(b=>`<option>${b.name}</option>`).join('')}</select></div>
      <div class="field"><label>Vendor</label><select><option>—</option>${DB.vendors.map(v=>`<option>${v.name}</option>`).join('')}</select></div>
      <div class="field"><label>Expense Date *</label><input type="date" value="2026-08-06"></div>
      <div class="field span-2"><label>Attachment (invoice/bill)</label><div class="flex-gap" style="border:1.5px dashed var(--gray-300);border-radius:10px;padding:14px;justify-content:center;color:var(--gray-400);">${icon('upload')} Upload bill/invoice scan (demo)</div></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-expense">${icon('check')} Save Expense</button>`
  });
}

function addRefundModal(){
  openModal({
    title:'New Refund Request', sub:'Refund with approval workflow',
    body:`<div class="form-grid">
      <div class="field span-2"><label>Student *</label><select>${DB.students.map(s=>`<option>${s.name} (${s.code})</option>`).join('')}</select></div>
      <div class="field"><label>Original Receipt</label><select>${DB.payments.map(p=>`<option>${p.receipt_no} — ${fmtMoney(p.amount)}</option>`).join('')}</select></div>
      <div class="field"><label>Refund Amount *</label><input type="number" placeholder="1000"></div>
      <div class="field span-2"><label>Reason *</label><textarea placeholder="Explain the reason for refund"></textarea></div>
    </div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" data-action="save-refund">${icon('send')} Submit Request</button>`
  });
}
