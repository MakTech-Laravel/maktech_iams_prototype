/* ============================================================
   Dashboard view — role-aware KPIs, charts, activity feed
   ============================================================ */

const MONTHS_REV = [
  {label:'Mar', rev:2620000, exp:940000},
  {label:'Apr', rev:3110000, exp:1080000},
  {label:'May', rev:3480000, exp:1220000},
  {label:'Jun', rev:3960000, exp:1360000},
  {label:'Jul', rev:4420000, exp:1510000},
  {label:'Aug', rev:1870000, exp:520000},
];

function renderDashboard(roleId){
  roleId = Number(roleId||1);
  if(roleId===3) return dashboardMarketing();
  if(roleId===4) return dashboardFinance();
  if(roleId===5) return dashboardCoordinator();
  if(roleId===6) return dashboardFrontDesk();
  return dashboardAdmin();
}

function dashboardAdmin(){
  const recent = [
    {when:'Today, 09:40', what:'Farzana Akter marked present in Batch-26-A', who:'Marked by Mahfuzur Rahman'},
    {when:'Today, 09:00', what:'Follow-up reminder sent to Shakil Ahmed for lead Md. Tanvir Ahmed', who:'Automated notification'},
    {when:'Yesterday, 20:11', what:'Online payment (Card) of ৳2,000 received — Sadia Islam', who:'via SSLCommerz gateway'},
    {when:'Yesterday, 16:30', what:'Course migration #2 approved — Sadia Islam (CIT-102 → CIT-101)', who:'Approved by Nasrin Akter'},
    {when:'2 days ago', what:'New lead captured — Mim Sultana (Khulna Polytechnic)', who:'Added by Shakil Ahmed'},
    {when:'3 days ago', what:'Expense approved — Career Counselling Seminar ৳22,000', who:'Approved by Nasrin Akter'},
  ];
  const pipelineData = DB.leadPipeline.map((s,i)=>({label:s, value:DB.leads.filter(l=>l.status===s).length, color:['#94a3b8','#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444'][i]}));
  const instRevenue = DB.institutions.filter(i=>i.revenue>0).sort((a,b)=>b.revenue-a.revenue).slice(0,5).map(i=>({label:i.name, value:i.revenue}));

  return `
  <div class="view-header">
    <div><h1>Executive Dashboard</h1><p>Organization-wide overview across all modules — ${DB.orgProfile.session} session</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm">${icon('calendar')} Aug 2026</button>
      <button class="btn btn-primary btn-sm">${icon('download')} Export Summary</button>
    </div>
  </div>

  <div class="grid grid-4" style="margin-bottom:20px;">
    ${kpiCard('students','Total Students', KPI.totalStudents(), 8, '#ff6533')}
    ${kpiCard('marketing','Active Leads', DB.leads.filter(l=>!['admitted','lost'].includes(l.status)).length, 12, '#06b6d4')}
    ${kpiCard('payment','Revenue (This Month)', fmtMoney(1870000), -6, '#10b981')}
    ${kpiCard('wallet','Total Due Outstanding', fmtMoney(KPI.totalDue()), 3, '#f59e0b')}
  </div>
  <div class="grid grid-4" style="margin-bottom:24px;">
    ${kpiCard('target','Lead → Student Conversion', KPI.conversionRate()+'%', 4, '#8b5cf6')}
    ${kpiCard('attendance','Avg. Attendance', KPI.avgAttendance()+'%', -2, '#3b82f6')}
    ${kpiCard('clock','Enrollment Requests Pending', DB.enrollmentRequests.filter(r=>r.status==='pending').length, null, '#f59e0b')}
    ${kpiCard('expense','Total Expense (YTD)', fmtMoney(sum(DB.expenses,e=>e.amount)), 5, '#f43f5e')}
  </div>

  <div class="grid grid-3" style="align-items:start;">
    <div class="card" style="grid-column:span 2;">
      <div class="card-header"><div><h3>Income vs Expense (Last 6 months)</h3><p>Monthly ledger trend, BDT</p></div>
        <div class="flex-gap" style="font-size:11.5px;"><span class="flex-gap"><span style="width:9px;height:9px;border-radius:3px;background:var(--primary-500);display:inline-block;"></span>Income</span><span class="flex-gap"><span style="width:9px;height:9px;border-radius:3px;background:#1e293b;display:inline-block;"></span>Expense</span></div>
      </div>
      <div class="card-pad">
        <div class="bar-chart" style="height:200px;">
          ${MONTHS_REV.map(m=>{
            const max = 4500000;
            return `<div class="bar-col">
              <div class="flex-gap" style="gap:4px;align-items:flex-end;height:100%;">
                <div class="bar" style="height:${m.rev/max*100}%;max-width:16px;"></div>
                <div class="bar" style="height:${m.exp/max*100}%;max-width:16px;background:linear-gradient(180deg,#475569,#1e293b);"></div>
              </div>
              <div class="bar-label">${m.label}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div><h3>Lead Pipeline</h3><p>Current funnel snapshot</p></div></div>
      <div class="card-pad">${renderDonut(pipelineData)}</div>
    </div>
  </div>

  <div class="grid grid-3" style="align-items:start; margin-top:20px;">
    <div class="card">
      <div class="card-header"><h3>Top Institutes by Revenue</h3></div>
      <div class="card-pad">${renderHBarList(instRevenue, {fmt:fmtMoney})}</div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent Activity</h3></div>
      <div class="card-pad">
        <div class="timeline">
          ${recent.map(r=>`<div class="timeline-item"><div class="when">${r.when}</div><div class="what">${r.what}</div><div class="who">${r.who}</div></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Marketing Staff — Target vs Achieved</h3></div>
      <div class="card-pad">
        ${renderHBarList(DB.marketingTargets.map(t=>({label:userName(t.user_id), value:t.achieved, max:t.target})), {fmt:(v,i)=>v})}
        ${DB.marketingTargets.map(t=>`<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-400);margin-top:-6px;"><span></span><span>${t.achieved} / ${t.target} target</span></div>`).join('')}
      </div>
    </div>
  </div>
  `;
}

function dashboardMarketing(){
  const u = currentUser ? currentUser() : DB.users.find(x=>x.id===currentUserId);
  const uid = u ? u.id : currentUserId;
  const myLeads = DB.leads.filter(l=>l.assigned_to===uid);
  const myFollowupsToday = followupsToday().filter(f=>f.assigned_to===uid);
  const myFollowupsMissed = followupsMissed().filter(f=>f.assigned_to===uid);
  const pipelineData = DB.leadPipeline.map((s,i)=>({label:s, value:DB.leads.filter(l=>l.status===s).length, color:['#94a3b8','#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444'][i]}));
  return `
  <div class="view-header"><div><h1>Marketing Dashboard</h1><p>Leads, conversions and follow-ups — ${u?u.name:''}</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-lead">${icon('plus')} Add Lead</button></div>
  </div>
  <div class="grid grid-4" style="margin-bottom:22px;">
    ${kpiCard('marketing','My Assigned Leads', myLeads.length, null, '#06b6d4')}
    ${kpiCard('calendar','My Follow-ups Due Today', myFollowupsToday.length, null, '#f59e0b')}
    ${kpiCard('alertCircle','My Missed Follow-ups', myFollowupsMissed.length, null, '#ef4444')}
    ${kpiCard('send','Upcoming Online Sessions', upcomingOnlineSessions().length, null, '#8b5cf6')}
  </div>
  <div class="grid grid-3" style="align-items:start;">
    <div class="card"><div class="card-header"><h3>Lead Pipeline (Org-wide)</h3></div><div class="card-pad">${renderDonut(pipelineData)}</div></div>
    <div class="card" style="grid-column:span 2;">
      <div class="card-header"><h3>My Follow-ups Due Today</h3><button class="btn btn-sm btn-outline" data-action="go-view" data-view="followups">${icon('clock')} View All</button></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Lead</th><th>Due</th><th>Notes</th><th>Status</th></tr></thead><tbody>
      ${myFollowupsToday.length ? myFollowupsToday.map(f=>`<tr class="row-link" data-action="view-lead" data-id="${f.lead_id}"><td class="cell-strong">${leadName(f.lead_id)}</td><td>${fmtDate(f.due_date)}</td><td>${f.notes}</td><td>${statusBadge(f.status)}</td></tr>`).join('') : `<tr><td colspan="4" class="muted">No follow-ups due today — you're all caught up!</td></tr>`}
      </tbody></table></div>
    </div>
  </div>
  <div class="card mt-16">
    <div class="card-header"><h3>Marketing Staff Performance</h3><p>Target vs achieved — August 2026</p></div>
    <div class="card-pad">${renderHBarList(DB.marketingTargets.map(t=>({label:userName(t.user_id)+ ` (${t.achieved}/${t.target})`, value:t.achieved})))}</div>
  </div>
  `;
}

function dashboardFinance(){
  const overdue = DB.feeInvoices.filter(i=>i.status==='overdue');
  const collectedToday = sum(DB.payments.filter(p=>p.status==='success' && (p.date||'').slice(0,10)===TODAY), p=>p.amount);
  const cashInHand = cashInHandTotal();
  return `
  <div class="view-header"><div><h1>Accounting Dashboard</h1><p>Collections, dues, cash custody, and expense overview — Tanvir Hasan</p></div>
    <div class="view-actions">
      <button class="btn btn-secondary btn-sm" data-action="go-view" data-view="due">${icon('wallet')} Due Follow-up</button>
      <button class="btn btn-primary btn-sm" data-action="go-view" data-view="collect-payment">${icon('payment')} Collect Payment</button>
    </div>
  </div>
  <div class="grid grid-4" style="margin-bottom:22px;">
    ${kpiCard('payment','Collected Today (All Methods)', fmtMoney(collectedToday), null, '#10b981')}
    ${kpiCard('wallet','Cash In Hand (Undeposited)', fmtMoney(cashInHand), null, cashInHand>0?'#ef4444':'#10b981')}
    ${kpiCard('wallet','Total Due Outstanding', fmtMoney(KPI.totalDue()), null, '#f59e0b')}
    ${kpiCard('send','In 7-day Follow-up Window', duesFollowupWindow().length, null, '#8b5cf6')}
  </div>
  ${cashInHand>0 ? `<div class="badge badge-amber" style="white-space:normal;margin-bottom:22px;">${icon('alertCircle')} You have ${fmtMoney(cashInHand)} in undeposited cash. <a href="#" data-action="go-view" data-view="cash-management" style="color:var(--primary-700);font-weight:700;">Deposit to bank or hand over now →</a></div>` : ''}
  <div class="grid grid-3" style="align-items:start;">
    <div class="card" style="grid-column:span 2;">
      <div class="card-header"><h3>Payment Method Split (This Month)</h3></div>
      <div class="card-pad">${renderDonut([
        {label:'Cash', value:36, color:'#10b981'}, {label:'bKash', value:24, color:'#8b5cf6'},
        {label:'Bank/Cheque', value:18, color:'#3b82f6'}, {label:'Nagad', value:12, color:'#f59e0b'}, {label:'Card', value:10, color:'#64748b'},
      ])}</div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Overdue Aging</h3></div>
      <div class="card-pad">${renderHBarList([
        {label:'0–7 days', value:1, color:'#f59e0b'}, {label:'8–15 days', value:1, color:'#f97316'},
        {label:'15–30 days', value:1, color:'#ef4444'}, {label:'30+ days', value:0, color:'#b91c1c'},
      ])}</div>
    </div>
  </div>
  <div class="card mt-16">
    <div class="card-header"><h3>Overdue Invoices</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Invoice</th><th>Student</th><th>Total</th><th>Due</th><th>Due Date</th><th>Status</th></tr></thead><tbody>
    ${overdue.map(i=>`<tr><td class="cell-strong">${i.invoice_no}</td><td>${studentName(i.student_id)}</td><td>${fmtMoney(i.total)}</td><td>${fmtMoney(i.due)}</td><td>${fmtDate(i.due_date)}</td><td>${statusBadge(i.status)}</td></tr>`).join('')}
    </tbody></table></div>
  </div>
  `;
}

function dashboardCoordinator(){
  const u = currentUser ? currentUser() : DB.users.find(x=>x.id===currentUserId);
  const uid = u ? u.id : currentUserId;
  const myBatches = scopedBatchesForUser(uid);
  const myBatchIds = myBatches.map(b=>b.id);
  const mySummaries = allBatchAttendanceSummaries(myBatchIds);
  const myAvgAtt = mySummaries.length ? Math.round(sum(mySummaries, s=>s.avgPct)/mySummaries.length) : 0;
  const myLow = lowAttendanceStudents(70, myBatchIds);
  return `
  <div class="view-header"><div><h1>Coordinator Dashboard</h1><p>Your classes, attendance & module progress — ${u?u.name:''}</p></div></div>
  <div class="badge badge-amber" style="margin-bottom:16px;">${icon('shield')} You only see the batches assigned to you by an Admin (Access Control).</div>
  <div class="grid grid-4" style="margin-bottom:22px;">
    ${kpiCard('batch','My Active Batches', myBatches.filter(b=>b.status==='ongoing').length, null, '#ff6533')}
    ${kpiCard('students','Students Under Supervision', sum(myBatches,b=>b.enrolled), null, '#06b6d4')}
    ${kpiCard('attendance','Avg Attendance (My Batches)', myAvgAtt+'%', null, myAvgAtt<70?'#ef4444':'#10b981')}
    ${kpiCard('calendar','Classes Today', DB.classSchedule.filter(c=>myBatchIds.includes(c.batch_id) && c.date==='2026-08-06').length, null, '#f59e0b')}
  </div>
  <div class="grid grid-3" style="align-items:start;">
    <div class="card" style="grid-column:span 2;">
      <div class="card-header"><h3>Today's Class Schedule</h3></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>Batch</th><th>Room</th><th>Mode</th><th></th></tr></thead><tbody>
      ${DB.classSchedule.filter(c=>myBatchIds.includes(c.batch_id) && c.date==='2026-08-06').map(c=>`<tr><td class="cell-strong">${c.start} – ${c.end}</td><td>${batchName(c.batch_id)}</td><td>${c.room}</td><td>${statusBadge(c.mode==='online'?'active':'ongoing', c.mode)}</td><td><button class="btn btn-sm btn-outline" data-action="go-view" data-view="attendance">Mark Attendance</button></td></tr>`).join('') || `<tr><td colspan="5" class="muted">No classes scheduled today.</td></tr>`}
      </tbody></table></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Low Attendance (My Batches)</h3></div>
      <div class="card-pad">
        ${myLow.length ? myLow.slice(0,6).map(l=>`<div class="flex-between" style="margin-bottom:10px;font-size:12.5px;"><span>${l.student.name}</span>${statusBadge('absent',l.pct+'%')}</div>`).join('') : `<p class="muted" style="font-size:12.5px;">No students below 70% — great job!</p>`}
      </div>
    </div>
  </div>
  `;
}

function dashboardFrontDesk(){
  return `
  <div class="view-header"><div><h1>Front Desk Dashboard</h1><p>Registrations & document collection — Kamrul Hasan</p></div>
    <div class="view-actions"><button class="btn btn-primary btn-sm" data-action="open-add-student">${icon('plus')} Register Student</button></div>
  </div>
  <div class="grid grid-4" style="margin-bottom:22px;">
    ${kpiCard('students','New Registrations (This Week)', 6, null, '#ff6533')}
    ${kpiCard('file','Profiles Incomplete', DB.students.filter(s=>!s.profile_completed).length, null, '#f59e0b')}
    ${kpiCard('upload','Documents Pending', 4, null, '#ef4444')}
    ${kpiCard('idcard','ID Cards to Issue', 3, null, '#8b5cf6')}
  </div>
  <div class="card">
    <div class="card-header"><h3>Recent Registrations</h3></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Institution</th><th>Course</th><th>Profile</th><th>Status</th></tr></thead><tbody>
    ${DB.students.slice(0,6).map(s=>`<tr><td class="cell-strong">${s.name}</td><td>${institutionName(s.institution_id)}</td><td>${courseName(primaryEnrollment(s)?.course_id)}</td><td>${s.profile_completed?statusBadge('active','Complete'):statusBadge('pending','Incomplete')}</td><td>${statusBadge(s.status)}</td></tr>`).join('')}
    </tbody></table></div>
  </div>
  `;
}
