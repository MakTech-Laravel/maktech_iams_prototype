/* ============================================================
   Reports gallery — Section 5 of blueprint (42 reports)
   ============================================================ */

const REPORTS = [
  {sec:'Marketing Reports', items:[
    {id:1, t:'Lead Source-wise Report', d:'Which institute/campaign generates most leads', ic:'marketing'},
    {id:2, t:'Lead Status Pipeline Report', d:'Funnel view of lead stages', ic:'target'},
    {id:3, t:'Polytechnic Visit Report', d:'Date-wise, staff-wise visit log', ic:'institution'},
    {id:4, t:'Follow-up Due/Overdue Report', d:'Pending and missed follow-ups', ic:'clock'},
    {id:5, t:'Contact History Report', d:'Per student/lead communication timeline', ic:'phone'},
    {id:6, t:'Marketing Staff Performance', d:'Targets vs achieved conversions', ic:'target'},
    {id:7, t:'Lost-Lead Reason Analysis', d:'Why leads are lost, by reason', ic:'alertCircle'},
    {id:8, t:'Institute-wise Conversion Report', d:'Lead-to-student conversion by institute', ic:'building'},
  ]},
  {sec:'Student & Academic Reports', items:[
    {id:9, t:'Total Student List', d:'Filterable by course, batch, institute, status', ic:'students'},
    {id:10, t:'New Admission Report', d:'Daily/weekly/monthly admissions', ic:'students'},
    {id:11, t:'Course-wise Enrollment Report', d:'Enrollment counts per course', ic:'course'},
    {id:12, t:'Batch/Class-wise Student List', d:'Roster per batch', ic:'batch'},
    {id:13, t:'Attendance Report', d:'Daily/monthly, per class, per student', ic:'attendance'},
    {id:14, t:'Low-Attendance Alert Report', d:'Students below attendance threshold', ic:'alertCircle'},
    {id:15, t:'Course Completion / Progress Report', d:'Module completion tracking', ic:'checkCircle'},
    {id:16, t:'Dropout Report', d:'Dropped students with reasons', ic:'alertCircle'},
    {id:17, t:'Course Migration Report', d:'History and fee impact of migrations', ic:'swap'},
  ]},
  {sec:'Financial Reports', items:[
    {id:18, t:'Daily Collection Report', d:'Cash + online, accountant-wise', ic:'payment'},
    {id:19, t:'Physical vs Online Payment Split', d:'Channel-wise breakdown', ic:'wallet'},
    {id:20, t:'Due Payment Report (Aging)', d:'0–7 / 8–15 / 15–30 / 30+ days overdue', ic:'clock'},
    {id:21, t:'Partial Payment / Installment Status', d:'Installment plan tracking', ic:'wallet'},
    {id:22, t:'Discount Given Report', d:'Staff-wise, course-wise discount totals', ic:'expense'},
    {id:23, t:'Refund Report', d:'All refunds with reasons & approvers', ic:'wallet'},
    {id:24, t:'Migration Fee Collection Report', d:'Fees collected via course migration', ic:'swap'},
    {id:25, t:'Course-wise Revenue Report', d:'Revenue generated per course', ic:'course'},
    {id:26, t:'Institute-wise Revenue Report', d:'Which polytechnic brings most revenue', ic:'building'},
    {id:27, t:'Income Statement (আয়)', d:'Filter by date/month/year/course/department', ic:'payment'},
    {id:28, t:'Expense Statement (ব্যয়)', d:'By category, filter by date/month/year', ic:'expense'},
    {id:29, t:'Event Cost Report', d:'All event-linked expenses', ic:'expense'},
    {id:30, t:'Tour Cost Report', d:'All tour-linked expenses', ic:'expense'},
    {id:31, t:'Student Facility Cost Report', d:'Transport, meals, materials, venue costs', ic:'expense'},
    {id:32, t:'Net Profit/Loss Report', d:'Income − Expense, filterable', ic:'report'},
    {id:33, t:'Vendor Payment Report', d:'Payments made to each vendor', ic:'building'},
    {id:34, t:'Invoice/Receipt Register', d:'All generated invoices, searchable', ic:'file'},
    {id:35, t:'Accountant-wise Collection Reconciliation', d:'Collections tallied per accountant', ic:'payment'},
    {id:42, t:'Cash Deposit & Handover Report', d:'Chain of custody: cash collected → bank deposit / signed handover', ic:'wallet'},
  ]},
  {sec:'Teacher Payment Reports', items:[
    {id:43, t:'Teacher Payment Summary Report', d:'Per teacher, per batch — rate, computed earnings, paid & outstanding', ic:'graduationCap'},
    {id:44, t:'Teacher Payment Voucher Log', d:'All payment requests & vouchers with approval/disbursement status', ic:'wallet'},
  ]},
  {sec:'Certificate / ID Card Reports', items:[
    {id:36, t:'Certificates Issued Report', d:'Date range, course-wise', ic:'certificate'},
    {id:37, t:'Pending Certificate Report', d:'Completed but not yet certified', ic:'clock'},
    {id:38, t:'ID Card Issuance Report', d:'All ID cards issued/expired/reissued', ic:'idcard'},
  ]},
  {sec:'System Reports', items:[
    {id:39, t:'User Activity / Audit Log Report', d:'Who changed what, when', ic:'shield'},
    {id:40, t:'SMS/Email Notification Delivery Report', d:'Delivery success/failure stats', ic:'notification'},
    {id:41, t:'Login History Report', d:'Student portal usage statistics', ic:'user'},
  ]},
];

function renderReports(){
  const lockedCount = REPORTS.flatMap(g=>g.items).filter(r=>!canAccessReport(currentUserId, r.id)).length;
  const sections = REPORTS.map(g=>`
    <h3 class="report-section-title">${g.sec}</h3>
    <div class="grid grid-4" style="margin-bottom:8px;">
      ${g.items.map(r=>{
        const allowed = canAccessReport(currentUserId, r.id);
        return allowed ? `
        <div class="report-card" data-action="open-report" data-id="${r.id}">
          <div class="ric">${ICONS[r.ic]}</div>
          <div><b>${r.t}</b><span>${r.d}</span></div>
        </div>` : `
        <div class="report-card" data-action="open-locked-report" data-id="${r.id}" style="opacity:.5;cursor:not-allowed;position:relative;" title="You don't have access to this report">
          <div class="ric">${ICONS[r.ic]}</div>
          <div><b>${r.t}</b><span>${r.d}</span></div>
          <div style="position:absolute;top:10px;right:10px;color:var(--gray-400);">${icon('lock')}</div>
        </div>`;
      }).join('')}
    </div>`).join('');
  return `
  ${lockedCount ? `<div class="badge badge-gray" style="white-space:normal;text-align:left;margin-bottom:14px;">${icon('lock')} ${lockedCount} report(s) are locked for your account — an Admin can grant access per report from Access Control.</div>` : ''}
  <div class="view-header">
    <div><h1>Reports & Analytics</h1><p>All 44 reports from the blueprint — every report supports date-range filter, Excel/PDF export, print view</p></div>
    <div class="view-actions"><button class="btn btn-secondary btn-sm">${icon('filter')} Global Filters</button></div>
  </div>
  ${sections}
  `;
}

function reportFilterBar(){
  return `<div class="filter-bar" style="margin-bottom:16px;">
    <input type="date" value="2026-07-01"><span class="muted">to</span><input type="date" value="2026-08-06">
    <select><option>All Courses</option>${DB.courses.map(c=>`<option>${c.name}</option>`).join('')}</select>
    <select><option>All Institutes</option>${DB.institutions.map(i=>`<option>${i.name}</option>`).join('')}</select>
    <button class="btn btn-secondary btn-sm">${icon('filter')} Apply</button>
    <span style="margin-left:auto;" class="flex-gap">
      <button class="btn btn-outline btn-sm">${icon('download')} Excel</button>
      <button class="btn btn-outline btn-sm">${icon('download')} PDF</button>
      <button class="btn btn-outline btn-sm">${icon('printer')} Print</button>
    </span>
  </div>`;
}

const REPORT_RENDERERS = {
  1: ()=>{ const data = DB.institutions.map(i=>({label:i.name, value:DB.leads.filter(l=>l.institution_id===i.id).length})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
    return renderHBarList(data); },
  2: ()=> renderDonut(DB.leadPipeline.map((s,i)=>({label:LEAD_STATUS_LABELS[s], value:DB.leads.filter(l=>l.status===s).length, color:['#94a3b8','#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444'][i]}))),
  3: ()=> tableHtml(['Institution','Date','Staff','Purpose','Outcome'], DB.visits.map(v=>[institutionName(v.institution_id), fmtDate(v.visit_date), userName(v.visited_by), v.purpose, v.outcome])),
  4: ()=> tableHtml(['Lead/Student','Due','Assigned','Status'], DB.followUps.map(f=>[f.lead_id?leadName(f.lead_id):studentName(f.student_id), fmtDate(f.due_date), userName(f.assigned_to), isFollowupOverdue(f)?statusBadge('overdue','Missed'):statusBadge(f.status)])),
  6: ()=> renderHBarList(DB.marketingTargets.map(t=>({label:userName(t.user_id), value:t.achieved}))),
  7: ()=> renderHBarList([{label:'Financial constraints', value:1,color:'#ef4444'},{label:'Chose competitor institute', value:1,color:'#f97316'}]),
  8: ()=> tableHtml(['Institution','Leads','Admitted','Conversion %'], DB.institutions.map(i=>{ const total=DB.leads.filter(l=>l.institution_id===i.id).length; const adm=DB.leads.filter(l=>l.institution_id===i.id&&l.status==='admitted').length; return [i.name, total, adm, total?Math.round(adm/total*100)+'%':'0%']; })),
  9: ()=> tableHtml(['Student','Institution','Course','Status'], DB.students.map(s=>[s.name, institutionName(s.institution_id), courseName(s.courses[0]?.course_id), statusBadge(s.status)])),
  11: ()=> renderHBarList(DB.courses.map(c=>({label:c.name, value:c.enrolled}))),
  13: ()=> tableHtml(['Student','Batch','Present/Total','%'], allBatchAttendanceSummaries().flatMap(bs=>bs.rows.filter(r=>r.effectiveTotal>0).map(r=>[r.student.name, bs.batch.name, `${r.attended}/${r.effectiveTotal}`, r.pct+'%']))),
  14: ()=> tableHtml(['Student','Batch','Attendance %','Flag'], lowAttendanceStudents().map(l=>[l.student.name, l.batch.name, l.pct+'%', statusBadge('absent','Low')])),
  16: ()=> tableHtml(['Student','Course','Reason'], DB.students.filter(s=>s.status==='dropped').map(s=>[s.name, courseName(s.courses[0]?.course_id), 'Personal / financial reasons (sample)'])),
  17: ()=> tableHtml(['Student','From → To','Fee Impact','Status'], DB.courseMigrations.map(m=>[studentName(m.student_id), `${courseName(m.from_course_id)} → ${courseName(m.to_course_id)}`, fmtMoney(m.net_adjustment), statusBadge(m.status)])),
  18: ()=> tableHtml(['Receipt','Student','Amount','Method','Accountant'], DB.payments.map(p=>[p.receipt_no, studentName(p.student_id), fmtMoney(p.amount), methodBadge(p.method), p.collected_by?userName(p.collected_by):'Online'])),
  19: ()=> renderDonut([{label:'Physical', value:sum(DB.payments.filter(p=>p.channel==='physical'),p=>p.amount), color:'#10b981'},{label:'Online', value:sum(DB.payments.filter(p=>p.channel==='online'),p=>p.amount), color:'#ff6533'}]),
  20: ()=> tableHtml(['Student','Due','Due Date','Status'], DB.feeInvoices.filter(i=>i.due>0).map(i=>[studentName(i.student_id), fmtMoney(i.due), fmtDate(i.due_date), statusBadge(i.status)])),
  21: ()=> tableHtml(['Invoice','Installment #','Amount','Due Date','Status'], DB.paymentInstallments.map(x=>[DB.feeInvoices.find(i=>i.id===x.invoice_id)?.invoice_no, x.no, fmtMoney(x.amount), fmtDate(x.due_date), statusBadge(x.status)])),
  22: ()=> tableHtml(['Student','Course','Discount','Given By','Reason'], DB.discountsGiven.map(d=>[studentName(d.student_id), courseName(d.course_id), fmtMoney(d.amount), userName(d.given_by), d.reason])),
  23: ()=> tableHtml(['Student','Amount','Reason','Status'], DB.refunds.map(r=>[studentName(DB.payments.find(p=>p.id===r.payment_id)?.student_id), fmtMoney(r.amount), r.reason, statusBadge(r.status)])),
  25: ()=> renderHBarList(DB.courses.map(c=>({label:c.name, value:c.enrolled*c.base_price})), {fmt:fmtMoney}),
  26: ()=> renderHBarList(DB.institutions.filter(i=>i.revenue>0).map(i=>({label:i.name, value:i.revenue})), {fmt:fmtMoney}),
  27: ()=> renderBarChart(MONTHS_REV.map(m=>({label:m.label, value:m.rev})), {fmt:v=>(v/1000000).toFixed(1)+'M'}),
  28: ()=> tableHtml(['Category','Amount'], DB.expenseCategories.map(c=>[c, fmtMoney(sum(DB.expenses.filter(e=>e.category===c),e=>e.amount))])),
  29: ()=> tableHtml(['Title','Amount','Date'], DB.expenses.filter(e=>e.category==='Event Cost').map(e=>[e.title, fmtMoney(e.amount), fmtDate(e.expense_date)])),
  30: ()=> tableHtml(['Title','Amount','Date'], DB.expenses.filter(e=>e.category==='Tour Cost').map(e=>[e.title, fmtMoney(e.amount), fmtDate(e.expense_date)])),
  31: ()=> tableHtml(['Title','Amount','Date'], DB.expenses.filter(e=>e.category==='Student Facility Cost').map(e=>[e.title, fmtMoney(e.amount), fmtDate(e.expense_date)])),
  32: ()=> renderBarChart(MONTHS_REV.map(m=>({label:m.label, value:m.rev-m.exp})), {fmt:v=>(v/1000000).toFixed(1)+'M'}),
  33: ()=> tableHtml(['Vendor','Total Paid','Terms'], DB.vendors.map(v=>[v.name, fmtMoney(sum(DB.expenses.filter(e=>e.vendor_id===v.id),e=>e.amount)), v.terms])),
  34: ()=> tableHtml(['Invoice','Student','Total','Status'], DB.feeInvoices.map(i=>[i.invoice_no, studentName(i.student_id), fmtMoney(i.total), statusBadge(i.status)])),
  36: ()=> tableHtml(['Student','Course','Cert No.','Issue Date'], DB.certificates.filter(c=>c.status==='issued').map(c=>[studentName(c.student_id), courseName(c.course_id), c.cert_no, fmtDate(c.issue_date)])),
  37: ()=> tableHtml(['Student','Course','Reason'], DB.certificates.filter(c=>c.status==='pending').map(c=>[studentName(c.student_id), courseName(c.course_id), 'Outstanding payment due'])),
  38: ()=> tableHtml(['Student','Card No.','Issue Date','Status'], DB.idCards.map(c=>[studentName(c.student_id), c.card_no, fmtDate(c.issue_date), statusBadge(c.status)])),
  39: ()=> tableHtml(['User','Module','Action','Record','Date'], DB.auditLogs.map(a=>[userName(a.user_id), a.module, a.action, a.record, fmtDate(a.date)])),
  40: ()=> tableHtml(['Recipient','Channel','Type','Status','Date'], DB.notifications.map(n=>[n.recipient, n.channel.toUpperCase(), n.type.replace(/_/g,' '), statusBadge(n.status), fmtDate(n.date)])),
  42: ()=> tableHtml(['Receipt','Date','Type','Amount','Handled By','To','Status'], DB.cashHandovers.map(h=>[h.receipt_no, fmtDate(h.date), h.type==='bank_deposit'?'Bank Deposit':'Handover', fmtMoney(h.amount), userName(h.created_by), h.type==='bank_deposit'?h.bank_name:userName(h.handed_to), statusBadge(h.status==='confirmed'?'active':'pending', h.status==='confirmed'?'Confirmed':'Pending')])),
  43: ()=> tableHtml(['Teacher','Batch','Rate','Computed Earned','Paid','Outstanding'], teacherBatchPairs().map(pr=>{ const rate=payRateFor(pr.teacher_id,pr.batch_id);
    return [userName(pr.teacher_id), batchName(pr.batch_id), rate?`${PAY_RATE_TYPE_LABELS[rate.rate_type]} (${fmtMoney(rate.rate_amount)})`:'No rate set', fmtMoney(computeEarnedForTeacherBatch(pr.teacher_id,pr.batch_id)), fmtMoney(totalPaidToTeacherForBatch(pr.teacher_id,pr.batch_id)), fmtMoney(outstandingForTeacherBatch(pr.teacher_id,pr.batch_id))]; })),
  44: ()=> tableHtml(['Voucher','Teacher','Batch','Type','Amount','Status','Date'], DB.teacherPayments.map(p=>[p.voucher_no, userName(p.teacher_id), batchName(p.batch_id), TEACHER_PAY_TYPE_LABELS[p.type], fmtMoney(p.amount), statusBadge(p.status), fmtDate(p.paid_date||p.approved_date||p.requested_date)])),
};

function tableHtml(cols, rows){
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>
    ${rows.length ? rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i===0?'cell-strong':''}">${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="muted" style="text-align:center;padding:24px;">No records in current filter range.</td></tr>`}
  </tbody></table></div>`;
}

function genericReportFallback(r){
  const pool = [...DB.institutions.map(i=>i.name), ...DB.courses.map(c=>c.name)];
  const rows = pool.slice(0,6).map((name,idx)=>[name, fmtMoney(50000 + idx*23500), fmtDate(`2026-0${(idx%6)+2}-1${idx}`)]);
  return `<div class="empty-state" style="padding:10px 20px 22px;">
      <p style="color:var(--gray-500);font-size:12.5px;margin-bottom:16px;">Illustrative sample output for <b>${r.t}</b> — actual report will query live data with the filters above.</p>
    </div>` + tableHtml(['Item','Amount','Date'], rows);
}

function openReportModal(id){
  const r = REPORTS.flatMap(g=>g.items).find(x=>x.id===id); if(!r) return;
  if(!canAccessReport(currentUserId, id)){ toast("You don't have access to this report — ask an Admin to grant it from Access Control", 'error'); return; }
  const renderer = REPORT_RENDERERS[id];
  openModal({ size:'xl',
    title:r.t, sub:r.d,
    body: reportFilterBar() + `<div id="reportBodyArea">${renderer ? renderer() : genericReportFallback(r)}</div>`,
    foot:`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-outline">${icon('download')} Export Excel</button><button class="btn btn-primary">${icon('download')} Export PDF</button>`
  });
}
