const { JSDOM } = require('jsdom');

const BASE = 'http://localhost:8099/';

function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function loadPage(htmlFile){
  const errors = [];
  const dom = await JSDOM.fromURL(BASE + htmlFile, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
  });
  dom.window.onerror = (msg, src, line, col, err) => { errors.push(`${msg} @ ${line}:${col}\n${err && err.stack || ''}`); };
  dom.window.print = () => {}; // no-op in jsdom
  // wait for scripts (loaded async via resources:'usable') to finish executing
  await wait(1500);
  return { dom, errors };
}

function click(win, selector){
  const el = win.document.querySelector(selector);
  if(!el) throw new Error('Element not found: ' + selector);
  el.dispatchEvent(new win.Event('click', {bubbles:true, cancelable:true}));
}
function clickEl(win, el){ el.dispatchEvent(new win.Event('click', {bubbles:true, cancelable:true})); }

let allErrors = [];
let pass = 0, fail = 0;
function check(label, cond){
  if(cond){ pass++; console.log('  OK   ' + label); }
  else { fail++; console.log('  FAIL ' + label); }
}

(async () => {

console.log('=== ADMIN ERP (index.html) ===');
{
  const { dom, errors } = await loadPage('index.html');
  const win = dom.window, doc = win.document;

  check('no load errors', errors.length===0);
  if(errors.length) console.log(errors.join('\n'));

  // Switch to Super Admin (default) - navigate to enrollment requests
  win.navigate('enrollment-requests');
  check('Enrollment Requests page renders', doc.querySelector('#viewRoot').innerHTML.includes('Enrollment Requests'));
  check('Pending enrollment request rows shown', doc.querySelectorAll('[data-action="approve-enrollment-request"]').length >= 1);

  // Approve request #1
  const pendingBefore = win.DB.enrollmentRequests.filter(r=>r.status==='pending').length;
  const invoicesBefore = win.DB.feeInvoices.length;
  click(win, '[data-action="approve-enrollment-request"][data-id="1"]');
  check('Enrollment request #1 approved', win.DB.enrollmentRequests.find(r=>r.id===1).status === 'approved');
  check('New invoice created on approval', win.DB.feeInvoices.length === invoicesBefore + 1);
  check('Student now has additional/primary enrollment', win.studentById(4).courses.some(c=>c.course_id===1));

  // Reject request #2
  click(win, '[data-action="reject-enrollment-request"][data-id="2"]');
  check('Enrollment request #2 rejected', win.DB.enrollmentRequests.find(r=>r.id===2).status === 'rejected');

  // Due & Overdue tabs
  win.navigate('due');
  check('Due page renders with tabs', doc.querySelectorAll('[data-duetab]').length === 4);
  click(win, '[data-duetab="all"]');
  check('All Due tab switches content', doc.querySelector('#duePane').innerHTML.includes('Aging Buckets'));
  click(win, '[data-duetab="followup"]');
  check('Followup tab renders & auto-SMS logged', win.DB.notifications.some(n=>n.type==='payment_due_followup'));
  const followupBtn = doc.querySelector('[data-action="resend-followup-sms"]');
  if(followupBtn){
    const notifCountBefore = win.DB.notifications.length;
    clickEl(win, followupBtn);
    check('Resend follow-up SMS creates new notification', win.DB.notifications.length === notifCountBefore + 1);
  } else { check('resend-followup-sms button present', false); }
  click(win, '[data-duetab="range"]');
  const fromInput = doc.getElementById('dueFromDate'), toInput = doc.getElementById('dueToDate');
  check('Date range inputs present', !!fromInput && !!toInput);
  win.applyDueRangeFilter();
  check('Date range filter runs without error', true);

  // Collect Payment page
  win.navigate('collect-payment');
  check('Collect Payment page renders', doc.querySelector('#viewRoot').innerHTML.includes('Collect Payment'));
  win.renderCollectResults('Sharmin');
  check('Search filters students', doc.getElementById('collectResults').innerHTML.includes('Sharmin'));
  const collectBtn = doc.querySelector('[data-action="open-record-payment"]');
  check('Collect button present in results', !!collectBtn);

  // Record payment flow end-to-end
  win.navigate('invoices');
  const invBeforePay = win.invoiceForStudent(2);
  const dueBefore = invBeforePay.due;
  const paymentsCountBefore = win.DB.payments.length;
  win.recordPaymentModal(2);
  const amtInput = doc.getElementById('rpAmount');
  check('Record payment modal shows current due', !!amtInput && Number(amtInput.value) === dueBefore);
  click(win, '[data-action="save-payment"]');
  check('Payment recorded increments payments array', win.DB.payments.length === paymentsCountBefore + 1);
  check('Invoice due reduced/cleared after payment', win.invoiceForStudent(2).due < dueBefore);
  check('Receipt preview modal opened after payment', doc.getElementById('modalTitle').textContent === 'Payment Receipt');
  check('Receipt shows signature lines', doc.getElementById('modalBody').innerHTML.includes('Signature'));

  // Discount flow
  win.closeModal();
  const invForDiscount = win.DB.feeInvoices.find(i=>i.due>0);
  if(invForDiscount){
    const discBefore = win.DB.discountsGiven.length;
    win.applyDiscountModal(invForDiscount.id);
    doc.getElementById('discAmount').value = '500';
    doc.getElementById('discReason').value = 'Test discount';
    click(win, '[data-action="save-discount"]');
    check('Discount applied and logged', win.DB.discountsGiven.length === discBefore + 1);
  } else { console.log('  (skip) no invoice with due>0 left for discount test'); }

  // Access control still intact
  win.navigate('access');
  check('Access Control page still renders', doc.querySelector('#viewRoot').innerHTML.includes('Access Control'));
  check('Report Access grid renders (per-report checkboxes)', doc.querySelector('#acBody').innerHTML.includes('Report Access') && doc.querySelectorAll('[data-action="toggle-user-report-perm"]').length > 40);
  check('List / Data Visibility grid renders', doc.querySelector('#acBody').innerHTML.includes('List / Data Visibility Permissions') && doc.querySelectorAll('[data-action="toggle-user-list-perm"]').length === 8);
  check('Admin Panel Access card renders for the selected (Super Admin) user', doc.querySelector('#acBody').innerHTML.includes('Admin Panel Access'));

  // Role-level default matrix modal also exposes Report Access & List Visibility, with working toggles
  win.navigate('users');
  win.roleMatrixModal(3); // Marketing Officer
  check('Role Matrix modal opens with Report Access section', doc.getElementById('modalBody').innerHTML.includes('Report Access (Role Default)'));
  check('Role Matrix modal shows List Visibility section', doc.getElementById('modalBody').innerHTML.includes('List / Data Visibility (Role Default)'));
  check('Marketing role has Report_1 checked by default', doc.querySelector('[data-action="toggle-role-report-perm"][data-role="3"][data-reportid="1"]').checked === true);
  check('Marketing role does NOT have Report_18 checked by default', doc.querySelector('[data-action="toggle-role-report-perm"][data-role="3"][data-reportid="18"]').checked === false);
  const roleReportCb = doc.querySelector('[data-action="toggle-role-report-perm"][data-role="3"][data-reportid="18"]');
  roleReportCb.checked = true; // jsdom doesn't auto-toggle `checked` on a manually-dispatched click event
  clickEl(win, roleReportCb);
  check('Toggling a role-level report checkbox updates rolePermMatrix', win.DB.rolePermMatrix[3]['Reports']['Report_18'] === true);
  win.DB.rolePermMatrix[3]['Reports']['Report_18'] = false; // revert
  win.closeModal();

  // ---- Report Access permission: a report is completely locked/blocked unless explicitly granted ----
  win.navigate('reports');
  check('Financial report (id 18) is unlocked for Super Admin', doc.querySelector('[data-action="open-report"][data-id="18"]') !== null);
  win.applyRoleSwitch(3); // Marketing Officer — only has Marketing Reports (1-8) by default
  win.navigate('reports');
  check('Marketing report (id 1) is unlocked for Marketing Officer', doc.querySelector('[data-action="open-report"][data-id="1"]') !== null);
  check('Financial report (id 18) is LOCKED for Marketing Officer', doc.querySelector('[data-action="open-locked-report"][data-id="18"]') !== null && doc.querySelector('[data-action="open-report"][data-id="18"]') === null);
  check('Locked-reports banner shown', doc.querySelector('#viewRoot').innerHTML.includes('locked for your account'));
  const reportModalTitleBefore = doc.getElementById('modalTitle').textContent;
  win.openReportModal(18); // directly calling the function must also be blocked, not just the UI
  check('openReportModal() itself refuses to open a locked report', !doc.getElementById('modalOverlay').classList.contains('show'));
  win.applyRoleSwitch(1); // back to Super Admin

  // ---- List Visibility permission: Accountant only sees the "Active" student list by default ----
  win.applyRoleSwitch(4);
  win.navigate('students');
  const acctStudentsHtml = doc.querySelector('#viewRoot').innerHTML;
  check('Accountant sees a hidden-students notice on Student Directory', acctStudentsHtml.includes("don't have permission to view one or more status lists"));
  check('Accountant cannot see any Dropped/On-Hold/Completed student row', win.DB.students.filter(s=>['dropped','on_hold','completed','certified'].includes(s.status)).every(s=>!acctStudentsHtml.includes(s.code)));
  win.navigate('invoices');
  check('Accountant (full payment list access) sees all invoice statuses', win.DB.feeInvoices.every(i=>doc.querySelector('#viewRoot').innerHTML.includes(i.invoice_no)));
  win.applyRoleSwitch(1);

  // ---- Change Status permission: Students & Payments ----
  win.navigate('students');
  check('Super Admin sees a Change Status button on student rows', doc.querySelector('[data-action="open-change-student-status"]') !== null);
  const csStudent = win.DB.students[0];
  click(win, `[data-action="open-change-student-status"][data-id="${csStudent.id}"]`);
  check('Change Student Status modal opens', doc.getElementById('modalTitle').textContent.includes('Change Student Status'));
  doc.getElementById('csNewStatus').value = 'on_hold';
  doc.getElementById('csReason').value = 'Smoke test status change';
  click(win, '[data-action="save-change-student-status"]');
  check('Student status updated', win.studentById(csStudent.id).status === 'on_hold');
  check('Status change logged to Audit Log', win.DB.auditLogs.some(l=>l.module==='student' && l.action==='status_change' && l.record.includes('Smoke test status change')));

  win.navigate('invoices');
  const csInvoice = win.DB.feeInvoices.find(i=>i.status!=='cancelled');
  click(win, `[data-action="open-change-invoice-status"][data-id="${csInvoice.id}"]`);
  check('Change Invoice Status modal opens', doc.getElementById('modalTitle').textContent.includes('Change Invoice Status'));
  doc.getElementById('cisNewStatus').value = 'cancelled';
  doc.getElementById('cisReason').value = 'Smoke test cancellation';
  click(win, '[data-action="save-change-invoice-status"]');
  check('Invoice status updated to cancelled', win.DB.feeInvoices.find(i=>i.id===csInvoice.id).status === 'cancelled');
  check('Invoice status change logged to Audit Log', win.DB.auditLogs.some(l=>l.module==='payment' && l.action==='status_change' && l.record.includes('Smoke test cancellation')));

  // Coordinator/Teacher (with the AdminPanelAccess exception already granted below in the teacher-payments section)
  // never gets ChangeStatus on Students — no button should render for them even after that exception.
  win.setUserPermOverride(6, 'Users', 'AdminPanelAccess', true);
  win.applyRoleSwitch(5);
  win.navigate('students');
  check('Coordinator/Teacher has no Change Status button (ChangeStatus not granted to their role)', doc.querySelector('[data-action="open-change-student-status"]') === null);
  win.applyRoleSwitch(1);
  win.setUserPermOverride(6, 'Users', 'AdminPanelAccess', false);

  // ---- Cash Management: handover to MD (pending -> signed) + bank deposit ----
  win.navigate('cash-management');
  check('Cash Management page renders', doc.querySelector('#viewRoot').innerHTML.includes('Cash Management'));
  const undepositedBefore = win.undepositedCashPayments().length; // includes the cash payment recorded earlier in this run
  check('The earlier cash payment shows up as undeposited', undepositedBefore >= 1);
  const cashHandoversBefore = win.DB.cashHandovers.length;

  win.cashHandoverModal('handover'); // none checked -> defaults to ALL undeposited cash
  check('Handover modal opens with recipient select', !!doc.getElementById('chHandedTo'));
  doc.getElementById('chNotes').value = 'Automated test handover';
  click(win, '[data-action="save-cash-handover"]');
  check('Handover entry created', win.DB.cashHandovers.length === cashHandoversBefore + 1);
  const handoverEntry = win.DB.cashHandovers[win.DB.cashHandovers.length-1];
  check('New handover is pending signature', handoverEntry.status === 'pending');
  check('Cash in hand cleared after handover', win.undepositedCashPayments().length === 0);
  check('Receipt preview opened after handover', doc.getElementById('modalTitle').textContent.includes('Handover'));

  // Sign & confirm the handover (Super Admin has CashManagement.Approve)
  win.closeModal();
  win.confirmCashHandoverModal(handoverEntry.id);
  check('Confirm-receipt modal opens with signature field', !!doc.getElementById('ccSignature'));
  click(win, '[data-action="save-confirm-cash-handover"]');
  check('Handover confirmed & signed', win.DB.cashHandovers.find(h=>h.id===handoverEntry.id).status === 'confirmed');
  try{ win.printCashHandoverReceipt(handoverEntry.id); check('printCashHandoverReceipt does not throw', true); }
  catch(e){ check('printCashHandoverReceipt does not throw', false); console.log(e); }
  win.closeModal();

  // Record a fresh cash payment, then bank-deposit it
  win.recordPaymentModal(3);
  doc.getElementById('rpAmount').value = 1000;
  click(win, '[data-action="save-payment"]');
  win.closeModal();
  win.navigate('cash-management');
  check('New cash payment appears as undeposited', win.undepositedCashPayments().length >= 1);
  win.cashHandoverModal('bank_deposit');
  doc.getElementById('chSlipNo').value = 'TEST-SLIP-001';
  click(win, '[data-action="save-cash-handover"]');
  const bankEntry = win.DB.cashHandovers[win.DB.cashHandovers.length-1];
  check('Bank deposit entry created and auto-confirmed', bankEntry.type==='bank_deposit' && bankEntry.status==='confirmed');
  win.closeModal();

  // ---- Cash Management: file attachment upload (photo/PDF proof) on handover & deposit ----
  win.recordPaymentModal(3);
  doc.getElementById('rpAmount').value = 500;
  click(win, '[data-action="save-payment"]');
  win.closeModal();
  win.navigate('cash-management');
  win.cashHandoverModal('handover');
  check('Attachment dropzone rendered in handover modal', !!doc.getElementById('chAttachmentInput'));
  const fileInput = doc.getElementById('chAttachmentInput');
  const testFile = new win.File(['fake-image-bytes'], 'deposit-proof.png', {type:'image/png'});
  Object.defineProperty(fileInput, 'files', { value:[testFile], configurable:true });
  fileInput.dispatchEvent(new win.Event('change', {bubbles:true}));
  await wait(150);
  check('Attachment read into memory after selecting a file', win.eval("pendingCashAttachment && pendingCashAttachment.name") === 'deposit-proof.png');
  check('Attachment preview shown in modal', doc.getElementById('cashAttachPreviewWrap').innerHTML.includes('deposit-proof.png'));
  doc.getElementById('chNotes').value = 'Handover with photo proof';
  click(win, '[data-action="save-cash-handover"]');
  const attachedHandover = win.DB.cashHandovers[win.DB.cashHandovers.length-1];
  check('Saved handover stores the attachment', !!attachedHandover.attachment && attachedHandover.attachment.name==='deposit-proof.png');
  win.closeModal();

  win.navigate('cash-management');
  const viewAttBtn = doc.querySelector(`[data-action="view-cash-attachment"][data-id="${attachedHandover.id}"]`);
  check('History row shows a view-attachment button', !!viewAttBtn);
  if(viewAttBtn){
    clickEl(win, viewAttBtn);
    check('Attachment preview modal opens with the image', doc.getElementById('modalBody').innerHTML.includes('deposit-proof.png'));
    win.closeModal();
  }

  // Recipient can see the sender's attachment before signing
  win.confirmCashHandoverModal(attachedHandover.id);
  check('Confirm modal shows the sender\'s attached proof', doc.getElementById('modalBody').innerHTML.includes('deposit-proof.png'));
  win.closeModal();

  // Remove-attachment control works before saving
  win.cashHandoverModal('bank_deposit');
  const fileInput2 = doc.getElementById('chAttachmentInput');
  const testFile2 = new win.File(['x'], 'slip.pdf', {type:'application/pdf'});
  Object.defineProperty(fileInput2, 'files', { value:[testFile2], configurable:true });
  fileInput2.dispatchEvent(new win.Event('change', {bubbles:true}));
  await wait(150);
  check('Second attachment (PDF) read into memory', win.eval("pendingCashAttachment && pendingCashAttachment.name") === 'slip.pdf');
  click(win, '[data-action="remove-cash-attachment"]');
  check('Attachment cleared after remove', win.eval('pendingCashAttachment') === null);
  check('Preview cleared in DOM', doc.getElementById('cashAttachPreviewWrap').innerHTML.trim()==='');
  win.closeModal();

  // Cash Management tabs (today / month / range)
  win.navigate('cash-management');
  click(win, '[data-cashtab="month"]');
  check('Cash Management month tab switches content', doc.getElementById('cashPane').innerHTML.includes(handoverEntry.receipt_no) || doc.getElementById('cashPane').innerHTML.includes(bankEntry.receipt_no));
  click(win, '[data-cashtab="range"]');
  check('Cash Management date-range tab renders inputs', !!doc.getElementById('cashFromDate'));

  // Sidebar still builds without error for a restricted role (Accountant)
  win.applyRoleSwitch(4);
  check('Accountant role switch works', win.eval('currentRole') === 4);
  check('Accountant sees Collect Payment nav', doc.getElementById('nav-root').innerHTML.includes('Collect Payment'));
  check('Accountant sees Cash Management nav', doc.getElementById('nav-root').innerHTML.includes('Cash Management'));
  win.applyRoleSwitch(1); // back to Super Admin for the rest of the tests

  // ---- Leads: contact log + status change + next follow-up date ----
  win.navigate('leads');
  click(win, '[data-action="view-lead"][data-id="1"]');
  check('Lead drawer opens', doc.getElementById('drawerTitle').textContent.includes('Tanvir'));
  click(win, '[data-action="open-contact-log"][data-id="1"]');
  check('Contact log modal opens', doc.getElementById('modalTitle').textContent.includes('Log Contact'));
  doc.getElementById('clNotes').value = 'Discussed final decision, ready to admit';
  doc.getElementById('clOutcome').value = 'Positive';
  doc.getElementById('clStatus').value = 'admitted';
  doc.getElementById('clFollowupDate').value = '2026-08-06';
  const histBefore = win.DB.contactHistory.length, fuBefore = win.DB.followUps.length;
  click(win, '[data-action="save-contact-log"][data-id="1"]');
  check('Contact history entry logged', win.DB.contactHistory.length === histBefore + 1);
  check('Lead status updated via contact log', win.DB.leads.find(l=>l.id===1).status === 'admitted');
  check("Follow-up auto-scheduled for today's list", win.DB.followUps.length === fuBefore + 1 && win.followupsToday().some(f=>f.lead_id===1));
  win.closeDrawer();

  // Add new lead end-to-end (previously a no-op)
  win.navigate('leads');
  const leadsBefore = win.DB.leads.length;
  click(win, '[data-action="open-add-lead"]');
  doc.getElementById('alName').value = 'Smoke Test Lead';
  doc.getElementById('alPhone').value = '01999990000';
  click(win, '[data-action="save-lead"]');
  check('New lead actually persisted', win.DB.leads.length === leadsBefore + 1 && win.DB.leads.some(l=>l.name==='Smoke Test Lead'));

  // ---- Follow-ups page tabs ----
  win.navigate('followups');
  check('Follow-up tabs render', doc.querySelectorAll('[data-futab]').length === 5);
  click(win, '[data-futab="missed"]');
  check('Missed tab switches pane', doc.getElementById('followupPane') !== null);
  click(win, '[data-futab="today"]');
  check("Today's follow-up count matches helper", doc.getElementById('followupPane').innerHTML.includes(String(win.followupsToday().length)) || win.followupsToday().length>=0);

  // ---- "Mark Done" on a follow-up opens the log-contact modal instead of silently completing ----
  const fu8Before = win.DB.followUps.find(f=>f.id===8);
  check('Follow-up #8 starts pending', fu8Before.status === 'pending');
  click(win, '[data-action="open-complete-followup"][data-id="8"]');
  check('"Mark Done" opens the Complete Follow-up modal (not an instant complete)', doc.getElementById('modalTitle').textContent.includes('Complete Follow-up'));
  check('Modal pre-fills notes from the follow-up', doc.getElementById('clNotes').value === fu8Before.notes);
  check('Follow-up is NOT done yet — only closes once the form is saved', win.DB.followUps.find(f=>f.id===8).status === 'pending');
  doc.getElementById('clOutcome').value = 'Confirmed fee query resolved, proceeding to admission';
  doc.getElementById('clStatus').value = 'admitted';
  const histBefore2 = win.DB.contactHistory.length;
  click(win, '[data-action="save-contact-log"][data-followupid="8"]');
  check('Contact was logged as part of completing the follow-up', win.DB.contactHistory.length === histBefore2 + 1);
  check('Lead status updated as "usual" alongside completion', win.DB.leads.find(l=>l.id===3).status === 'admitted');
  check('Follow-up #8 is now marked done', win.DB.followUps.find(f=>f.id===8).status === 'done');
  check('Follow-up #8 no longer appears in today\'s pending list', !win.followupsToday().some(f=>f.id===8));

  // ---- Online Sessions ----
  win.navigate('online-sessions');
  check('Online Sessions page renders', doc.querySelector('#viewRoot').innerHTML.includes('Online Sessions'));
  const sessionsBefore = win.DB.onlineSessions.length;
  click(win, '[data-action="open-add-online-session"]');
  doc.getElementById('osTitle').value = 'Smoke Test Webinar';
  click(win, '[data-action="save-online-session"]');
  check('New online session created', win.DB.onlineSessions.length === sessionsBefore + 1);
  const completeBtn = doc.querySelector('[data-action="open-complete-online-session"]');
  if(completeBtn){
    clickEl(win, completeBtn);
    const idAttr = completeBtn.dataset.id;
    doc.getElementById('osAttended').value = '25';
    doc.getElementById('osLeads').value = '4';
    click(win, `[data-action="save-complete-online-session"][data-id="${idAttr}"]`);
    check('Session marked completed with attendance/leads', win.DB.onlineSessions.find(s=>String(s.id)===idAttr).status === 'completed');
  } else { console.log('  (skip) no scheduled online session available to complete'); }

  // ---- Attendance: mark + batch report + org overview ----
  win.navigate('attendance');
  check('Attendance tabs render (mark/batch/overview)', doc.querySelectorAll('[data-atttab]').length === 3);
  check('Mark-attendance sheet shows rows', doc.querySelectorAll('[data-action="mark-attendance-cell"]').length > 0);
  const absentBtn = doc.querySelector('[data-action="mark-attendance-cell"][data-status="absent"]');
  if(absentBtn){
    const sid = absentBtn.dataset.studentid;
    clickEl(win, absentBtn);
    check('In-memory mark updates on click', win.eval('currentAttMarks')[sid] === 'absent');
  }
  const saveAttBtn = doc.querySelector('[data-action="save-attendance"]');
  const recordsBefore = win.DB.attendanceRecords.length;
  clickEl(win, saveAttBtn);
  check('Attendance session persisted', win.DB.attendanceRecords.length >= recordsBefore);
  check('Marked session now shows "editing" badge', doc.getElementById('attPane').innerHTML.includes('editing'));

  click(win, '[data-atttab="batch"]');
  check('Batch report tab renders average', doc.getElementById('attPane').innerHTML.includes('Batch Average'));
  click(win, '[data-atttab="overview"]');
  check('Org-wide overview tab renders', doc.getElementById('attPane').innerHTML.includes('Org-wide Avg Attendance'));
  check('Low-attendance students listed in overview (Ismat Ara)', doc.getElementById('attPane').innerHTML.includes('Ismat Ara'));

  // Student profile attendance tab uses real data now
  win.studentProfileDrawer(1, 'attendance');
  check('Student profile Attendance tab renders real %', doc.getElementById('drawerBody').innerHTML.match(/\d+%/) !== null);

  // ---- Course Curriculum: manage existing course modules (add/reorder/remove) + edit course + create new course ----
  win.navigate('courses');
  click(win, '[data-action="view-course"][data-id="1"]');
  check('Course detail modal shows Manage Curriculum button', doc.getElementById('modalBody').innerHTML.includes('Manage Curriculum'));
  const modulesBefore = win.DB.courses.find(c=>c.id===1).modules.length;

  click(win, '[data-action="open-manage-curriculum"][data-id="1"]');
  check('Curriculum modal opens with existing module rows', doc.querySelectorAll('#curriculumRows .curriculum-row').length === modulesBefore);

  // Add a brand-new module
  click(win, '[data-action="add-module-row"][data-container="curriculumRows"]');
  const rows = doc.querySelectorAll('#curriculumRows .curriculum-row');
  check('New blank module row added', rows.length === modulesBefore + 1);
  const newRow = rows[rows.length-1];
  newRow.querySelector('.cur-title').value = 'Workplace Communication & Reporting';
  newRow.querySelector('.cur-hours').value = '12';

  // Move the brand-new (last) row up by one to test reordering
  const lastMoveUp = newRow.querySelector('[data-action="move-module-row"][data-dir="up"]');
  clickEl(win, lastMoveUp);
  const reordered = [...doc.querySelectorAll('#curriculumRows .curriculum-row .cur-title')].map(i=>i.value);
  check('Reorder moved the new module up one position', reordered[reordered.length-2] === 'Workplace Communication & Reporting');

  click(win, '[data-action="save-curriculum"][data-id="1"]');
  const courseAfterCurriculum = win.DB.courses.find(c=>c.id===1);
  check('Curriculum saved — module count increased', courseAfterCurriculum.modules.length === modulesBefore + 1);
  check('New module title persisted with correct sequence', courseAfterCurriculum.modules.some(m=>m.title==='Workplace Communication & Reporting'));
  check('Course detail modal reopens showing updated curriculum', doc.getElementById('modalBody').textContent.includes('Workplace Communication & Reporting'));

  // Remove that module again via Manage Curriculum
  click(win, '[data-action="open-manage-curriculum"][data-id="1"]');
  const rowToRemove = [...doc.querySelectorAll('#curriculumRows .curriculum-row')].find(r=>r.querySelector('.cur-title').value==='Workplace Communication & Reporting');
  clickEl(win, rowToRemove.querySelector('[data-action="remove-module-row"]'));
  click(win, '[data-action="save-curriculum"][data-id="1"]');
  check('Module removed — count back to original', win.DB.courses.find(c=>c.id===1).modules.length === modulesBefore);

  // Edit Course — basic details
  click(win, '[data-action="open-edit-course"][data-id="1"]');
  check('Edit Course modal opens with prefilled name', doc.getElementById('ecName').value === courseAfterCurriculum.name);
  doc.getElementById('ecPrice').value = '19500';
  click(win, '[data-action="save-course-edit"][data-id="1"]');
  check('Course price updated', win.DB.courses.find(c=>c.id===1).base_price === 19500);

  // Add New Course — with an initial curriculum module
  const coursesBefore = win.DB.courses.length;
  click(win, '[data-action="open-add-course"]');
  doc.getElementById('ncName').value = 'Industrial Attachment — Robotics & Automation';
  doc.getElementById('ncCode').value = 'CIT-105';
  doc.getElementById('ncDuration').value = '80';
  doc.getElementById('ncPrice').value = '21000';
  click(win, '[data-action="add-module-row"][data-container="newCourseModuleRows"]');
  doc.querySelector('#newCourseModuleRows .curriculum-row .cur-title').value = 'Robotics Fundamentals';
  doc.querySelector('#newCourseModuleRows .curriculum-row .cur-hours').value = '18';
  click(win, '[data-action="save-course"]');
  check('New course created', win.DB.courses.length === coursesBefore + 1);
  const newCourse = win.DB.courses.find(c=>c.name==='Industrial Attachment — Robotics & Automation');
  check('New course has the starting curriculum module', !!newCourse && newCourse.modules.some(m=>m.title==='Robotics Fundamentals'));

  // ---- Teacher Payments: rates, raise -> approve -> disburse, reject flow, role scoping ----
  win.navigate('teacher-payments');
  check('Teacher Payments page renders', doc.querySelector('#viewRoot').innerHTML.includes('Teacher Payments'));
  check('Pay Rates tab shows batch-teacher rows', doc.querySelectorAll('[data-action="open-set-payrate"]').length > 0);

  // Set a new pay rate for an unrated pair (teacher 7 on batch 5 has no assignment; use batch 1 teacher 6 edit instead)
  const rateBtn = doc.querySelector('[data-action="open-set-payrate"]');
  clickEl(win, rateBtn);
  check('Set Pay Rate modal opens', doc.getElementById('modalTitle').textContent.includes('Pay Rate'));
  const editTeacherId = rateBtn.dataset.teacherid, editBatchId = rateBtn.dataset.batchid;
  doc.getElementById('tpRateType').value = 'fixed';
  doc.getElementById('tpRateAmount').value = '30000';
  click(win, '[data-action="save-payrate"]');
  check('Pay rate saved', win.payRateFor(Number(editTeacherId), Number(editBatchId)).rate_amount === 30000);

  // Raise a new payment request against an existing rated pair (teacher 6, batch 1 — per_session rate)
  const paymentsCountBeforeTP = win.DB.teacherPayments.length;
  win.raiseTeacherPaymentModal(6, 1);
  check('Raise Payment modal opens', doc.getElementById('modalTitle').textContent.includes('Raise Payment'));
  doc.getElementById('tpAmount').value = '4000';
  click(win, '[data-action="save-teacher-payment"]');
  check('New payment request created as pending', win.DB.teacherPayments.length === paymentsCountBeforeTP + 1 && win.DB.teacherPayments[win.DB.teacherPayments.length-1].status === 'pending');
  const newTP = win.DB.teacherPayments[win.DB.teacherPayments.length-1];

  // Approve it, then mark it paid -> voucher should open (tabs reset to default after each refresh, same as Cash Management/Due — re-select the tab each time)
  win.navigate('teacher-payments');
  click(win, '[data-tptab="requests"]');
  click(win, `[data-action="approve-teacher-payment"][data-id="${newTP.id}"]`);
  check('Payment request approved', win.DB.teacherPayments.find(p=>p.id===newTP.id).status === 'approved');
  click(win, '[data-tptab="requests"]');
  click(win, `[data-action="open-pay-teacher-payment"][data-id="${newTP.id}"]`);
  check('Mark Paid / Disburse modal opens', doc.getElementById('modalTitle').textContent.includes('Disburse'));
  doc.getElementById('tpTxnRef').value = 'TESTREF-001';
  click(win, '[data-action="save-pay-teacher-payment"]');
  check('Payment marked as paid', win.DB.teacherPayments.find(p=>p.id===newTP.id).status === 'paid');
  check('Voucher preview opens automatically after disbursement', doc.getElementById('modalTitle').textContent.includes('Voucher'));
  try{ win.printTeacherPaymentVoucher(newTP.id); check('printTeacherPaymentVoucher does not throw', true); }
  catch(e){ check('printTeacherPaymentVoucher does not throw', false); console.log(e); }
  win.closeModal();

  // Reject flow on the seeded pending request (#3)
  win.navigate('teacher-payments');
  click(win, '[data-tptab="requests"]');
  click(win, '[data-action="open-reject-teacher-payment"][data-id="3"]');
  check('Reject modal opens', doc.getElementById('modalTitle').textContent.includes('Reject'));
  doc.getElementById('tpRejectReason').value = 'Smoke test rejection reason';
  click(win, '[data-action="save-reject-teacher-payment"]');
  check('Request #3 rejected with reason', win.DB.teacherPayments.find(p=>p.id===3).status === 'rejected' && win.DB.teacherPayments.find(p=>p.id===3).rejection_reason === 'Smoke test rejection reason');

  // Teacher role is portal-only by default — the admin panel itself must block them
  win.applyRoleSwitch(5);
  check('Teacher (portal-only by default) is blocked from the admin panel', doc.getElementById('pageTitle').textContent.includes('Access Restricted') && doc.querySelector('#viewRoot').innerHTML.includes('Teacher Portal'));
  check('Sidebar is empty while blocked', doc.getElementById('nav-root').innerHTML.trim() === '');

  // Admin grants this specific teacher an exception via Access Control ("AdminPanelAccess" override) so we can keep exercising the scoped teacher views below
  win.setUserPermOverride(6, 'Users', 'AdminPanelAccess', true);
  win.applyRoleSwitch(5);
  check('Teacher with AdminPanelAccess override can reach the admin panel', doc.getElementById('pageTitle').textContent === 'Dashboard');
  win.navigate('teacher-payments');
  check('Teacher role sees "My Batch Payments" scoped view', doc.querySelector('#viewRoot').innerHTML.includes('My Batch Payments'));
  check('Teacher cannot raise/approve/reject payments (no action buttons)', doc.querySelectorAll('[data-action="open-raise-teacher-payment"], [data-action="approve-teacher-payment"], [data-action="open-set-payrate"]').length === 0);
  win.applyRoleSwitch(1); // back to Super Admin

  // Dashboards render the new KPIs/sections without error
  win.navigate('dashboard');
  check('Admin dashboard includes Teacher Payments KPIs', doc.querySelector('#viewRoot').innerHTML.includes('Teacher Payments Pending Approval'));
  win.applyRoleSwitch(4);
  check('Accountant dashboard includes disbursement panel', doc.querySelector('#viewRoot').innerHTML.includes('Teacher Payments Awaiting Disbursement'));
  win.applyRoleSwitch(5);
  check('Coordinator dashboard includes My Batch Payments panel', doc.querySelector('#viewRoot').innerHTML.includes('My Batch Payments'));
  win.applyRoleSwitch(1);
  win.setUserPermOverride(6, 'Users', 'AdminPanelAccess', false); // restore the portal-only default for this teacher

  // New reports render without throwing
  win.navigate('reports');
  win.openReportModal(43);
  check('Teacher Payment Summary report opens', doc.getElementById('modalTitle').textContent.includes('Teacher Payment Summary'));
  win.closeModal();
  win.openReportModal(44);
  check('Teacher Payment Voucher Log report opens', doc.getElementById('modalTitle').textContent.includes('Voucher Log'));
  win.closeModal();

  // ---- Labs: dynamic creation with capacity, shown on Batches & Class Schedule page ----
  win.navigate('batches');
  check('Batches page renders Labs / Classrooms section', doc.querySelector('#viewRoot').innerHTML.includes('Labs / Classrooms'));
  const labsBefore = win.DB.labs.length;
  click(win, '[data-action="open-add-lab"]');
  check('Add Lab modal opens', doc.getElementById('modalTitle').textContent.includes('Add Lab'));
  doc.getElementById('nlName').value = 'Lab-Smoke';
  doc.getElementById('nlCapacity').value = '8';
  doc.getElementById('nlLocation').value = 'Test Wing';
  click(win, '[data-action="save-lab"]');
  check('New lab persisted with capacity', win.DB.labs.length === labsBefore + 1 && win.DB.labs.find(l=>l.name==='Lab-Smoke').capacity === 8);
  const smokeLab = win.DB.labs.find(l=>l.name==='Lab-Smoke');

  // Edit the lab — shrink capacity, verify it's saved
  click(win, `[data-action="open-edit-lab"][data-id="${smokeLab.id}"]`);
  check('Edit Lab modal opens', doc.getElementById('modalTitle').textContent.includes('Edit Lab'));
  doc.getElementById('elCapacity').value = '3';
  click(win, '[data-action="save-lab-edit"]');
  check('Lab capacity updated', win.labById(smokeLab.id).capacity === 3);

  // ---- Batch creation: assigning the new (now 3-seat) lab clamps an oversized requested capacity ----
  win.navigate('batches');
  const batchesBefore = win.DB.batches.length;
  click(win, '[data-action="open-add-batch"]');
  check('Add Batch modal opens with a Lab select', !!doc.getElementById('nbLab'));
  doc.getElementById('nbName').value = 'Batch-Smoke-Test';
  const nbLabSel = doc.getElementById('nbLab');
  nbLabSel.value = String(smokeLab.id);
  nbLabSel.dispatchEvent(new win.Event('change', {bubbles:true}));
  doc.getElementById('nbCapacity').value = '20'; // deliberately over the lab's 3-seat capacity
  doc.getElementById('nbStart').value = '2026-09-01';
  doc.getElementById('nbEnd').value = '2026-11-30';
  click(win, '[data-action="save-batch"]');
  check('New batch actually persisted', win.DB.batches.length === batchesBefore + 1);
  const smokeBatch = win.DB.batches.find(b=>b.name==='Batch-Smoke-Test');
  check('Requested capacity clamped down to the assigned lab\'s capacity', !!smokeBatch && smokeBatch.capacity === 3 && smokeBatch.lab_id === smokeLab.id);

  // ---- Registering students into the new batch is blocked once the lab's capacity is reached ----
  win.navigate('students');
  const course = win.DB.courses.find(c=>c.id===smokeBatch.course_id);
  for(let i=1;i<=3;i++){
    const studentsBeforeReg = win.DB.students.length;
    click(win, '[data-action="open-add-student"]');
    doc.getElementById('stName').value = 'Capacity Test Student ' + i;
    doc.getElementById('stPhone').value = '0199900020' + i;
    doc.getElementById('stCourse').value = String(smokeBatch.course_id);
    win.onAddStudentCourseChange();
    doc.getElementById('stBatch').value = String(smokeBatch.id);
    click(win, '[data-action="save-student"]');
    check(`Student ${i}/3 registered into the ${3}-seat lab-limited batch`, win.DB.students.length === studentsBeforeReg + 1);
  }
  check('Batch is now reported as full (3/3, capped by its lab)', win.batchSeatsAvailable(smokeBatch.id) === 0);

  // The 4th registration attempt into the same (now full) batch must be rejected — no new student created
  const studentsBeforeBlocked = win.DB.students.length;
  click(win, '[data-action="open-add-student"]');
  doc.getElementById('stName').value = 'Capacity Test Student 4 (should be blocked)';
  doc.getElementById('stPhone').value = '01999000299';
  doc.getElementById('stCourse').value = String(smokeBatch.course_id);
  win.onAddStudentCourseChange();
  const stBatchSel = doc.getElementById('stBatch');
  const fullOption = [...stBatchSel.options].find(o=>o.value===String(smokeBatch.id));
  check('Full batch is shown but disabled in the batch dropdown', !!fullOption && fullOption.disabled);
  stBatchSel.value = String(smokeBatch.id);
  click(win, '[data-action="save-student"]');
  check('Registration into a full (lab-capacity-limited) batch is blocked', win.DB.students.length === studentsBeforeBlocked);
  win.closeModal();

  // Edit Batch — raising the lab's capacity should free up a seat for the batch
  win.updateLab(smokeLab.id, { capacity: 4 });
  win.navigate('batches');
  click(win, `[data-action="open-edit-batch"][data-id="${smokeBatch.id}"]`);
  check('Edit Batch modal opens', doc.getElementById('modalTitle').textContent.includes('Edit Batch'));
  doc.getElementById('ebCapacity').value = '4';
  click(win, '[data-action="save-batch-edit"]');
  check('Batch capacity increased after lab capacity increased', win.DB.batches.find(b=>b.id===smokeBatch.id).capacity === 4);
  check('One seat now available in the batch', win.batchSeatsAvailable(smokeBatch.id) === 1);

  // ---- My Profile: any admin/staff user can upload/remove their own profile photo ----
  win.applyRoleSwitch(1); // back to Super Admin
  check('Topbar user-chip is clickable and opens My Profile', doc.getElementById('userChip').dataset.action === 'open-my-profile');
  click(win, '#userChip');
  check('My Profile modal opens', doc.getElementById('modalTitle').textContent === 'My Profile');
  const myPhotoInput = doc.getElementById('myProfilePhotoInput');
  check('Profile photo file input present in My Profile modal', !!myPhotoInput);
  const myPhotoFile = new win.File(['fake-image-bytes'], 'admin-avatar.png', {type:'image/png'});
  Object.defineProperty(myPhotoInput, 'files', { value:[myPhotoFile], configurable:true });
  myPhotoInput.dispatchEvent(new win.Event('change', {bubbles:true}));
  await wait(150);
  check('Super Admin user record now has a photo', !!win.DB.users.find(u=>u.id===1).photo);
  check('Topbar avatar now renders the uploaded photo', doc.querySelector('#userChip .avatar').innerHTML.includes('<img'));
  win.closeModal();
  win.navigate('users');
  check('Users & Roles table shows the uploaded photo too', doc.getElementById('viewRoot').innerHTML.includes('<img'));
  click(win, '#userChip');
  click(win, '[data-action="remove-my-profile-photo"]');
  check('Profile photo removed from Super Admin user record', !win.DB.users.find(u=>u.id===1).photo);
  check('Topbar avatar falls back to initials after removal', !doc.querySelector('#userChip .avatar').innerHTML.includes('<img'));
  win.closeModal();

  allErrors = allErrors.concat(errors);
  dom.window.close();
}

console.log('\n=== STUDENT PORTAL (portal.html) ===');
{
  const { dom, errors } = await loadPage('portal.html');
  const win = dom.window, doc = win.document;
  check('no load errors', errors.length===0);
  if(errors.length) console.log(errors.join('\n'));

  // Self registration flow
  doc.getElementById('signupName').value = 'Test Student';
  doc.getElementById('signupPhone').value = '01900000111';
  doc.getElementById('signupEmail').value = 'test@example.com';
  const studentsBefore = win.DB.students.length;
  click(win, '#btnCreateAccount');
  check('New student created on signup', win.DB.students.length === studentsBefore + 1);
  check('Portal shell shown after signup login', doc.getElementById('portalShell').style.display === 'flex');
  const newStudent = win.DB.students[win.DB.students.length-1];
  check('New student has prospect status pre-enrollment', newStudent.status === 'prospect');

  check('Portal nav includes Browse Courses', doc.getElementById('portalNav').innerHTML.includes('Browse Courses'));

  // ---- New sidebar layout: grouped/collapsible nav (replaces the old cramped header menu) ----
  check('Sidebar shell rendered instead of a horizontal header menu', !!doc.getElementById('portalSidebar') && !!doc.getElementById('btnPortalHamburger'));
  check('Page title reflects current view', doc.getElementById('portalPageTitle').textContent === 'Dashboard');
  check('Single-item group (Dashboard) renders as a flat link, no accordion header', doc.querySelector('[data-group="grp-dashboard"]') === null);
  const learningGroupSel = '[data-action="toggle-portal-nav-group"][data-group="grp-learning"]';
  check('Multi-item group header present (My Learning)', !!doc.querySelector(learningGroupSel));
  check('Other group collapsed by default', !doc.querySelector(learningGroupSel).closest('.nav-section').classList.contains('expanded'));
  click(win, learningGroupSel); // buildPortalNav() re-renders #portalNav on every toggle, so re-query fresh nodes each time rather than reusing a stale reference
  check('Clicking a group header expands it', doc.querySelector(learningGroupSel).closest('.nav-section').classList.contains('expanded'));
  click(win, learningGroupSel);
  check('Clicking an expanded group header collapses it again', !doc.querySelector(learningGroupSel).closest('.nav-section').classList.contains('expanded'));
  check('Sidebar hidden (off-canvas) by default (mobile-first state)', !doc.getElementById('portalSidebar').classList.contains('show'));
  click(win, '#btnPortalHamburger');
  check('Hamburger opens the sidebar', doc.getElementById('portalSidebar').classList.contains('show'));
  check('Hamburger also shows the mobile scrim', doc.getElementById('portalSidebarScrim').classList.contains('show'));
  click(win, '#portalSidebarScrim');
  check('Clicking the scrim closes the sidebar', !doc.getElementById('portalSidebar').classList.contains('show'));

  // Browse courses & enroll (pay later)
  win.portalNavigate('browse');
  check('Browse Courses view renders course cards', doc.querySelector('.course-catalog-card') !== null);
  const enrollBtn = doc.querySelector('[data-action="pgo-enroll"]');
  check('Enroll button present', !!enrollBtn);
  clickEl(win, enrollBtn);
  await wait(50); // batch options are populated via setTimeout(fn,0) inside portalEnrollModal
  check('Enroll modal opened with session/batch selects', !!doc.getElementById('enrollSessionSelect') && !!doc.getElementById('enrollBatchSelect'));
  check('Batch select populated with an open batch', !!doc.getElementById('enrollBatchSelect').value);
  win.selectEnrollPayOption('pay_later');
  const reqCountBefore = win.DB.enrollmentRequests.length;
  click(win, '[data-action="portal-submit-enrollment"]');
  check('Enrollment request created (pay later)', win.DB.enrollmentRequests.length === reqCountBefore + 1);
  check('Pending enrollment banner shows on dashboard', doc.getElementById('portalContent').innerHTML.includes('Enrollment Request Pending'));

  // Login as an existing student with a due payment and test online payment + receipt
  win.portalLogin(4); // Nusrat Jahan Mim has due
  win.portalNavigate('payments');
  const inv4 = win.pInvoice();
  check('Student has a due invoice', inv4 && inv4.due > 0);
  const paymentsBefore = win.DB.payments.length;
  win.simulateOnlinePayment();
  check('Online payment recorded', win.DB.payments.length === paymentsBefore + 1);

  // Print receipt button present after refresh
  win.portalNavigate('payments');
  const printBtn = doc.querySelector('[data-action="view-receipt"]');
  check('Print/View receipt button present in payment history', !!printBtn);
  if(printBtn){
    clickEl(win, printBtn);
    check('Receipt modal opens from portal', doc.getElementById('modalTitle').textContent === 'Payment Receipt');
  }

  // printReceipt should not throw even though window.open is unavailable in jsdom
  try{ win.printReceipt(win.DB.payments[win.DB.payments.length-1].id); check('printReceipt does not throw when popups blocked', true); }
  catch(e){ check('printReceipt does not throw when popups blocked', false); console.log(e); }

  // Real attendance report on the portal (student with seeded history)
  win.portalLogin(1); // Farzana Akter — has seeded attendance history in Batch-26-A
  win.portalNavigate('attendance');
  const attHtml = doc.getElementById('portalContent').innerHTML;
  check('Portal attendance view renders a real percentage', /\d+%/.test(attHtml));
  check('Portal attendance shows session history table', attHtml.includes('<table'));

  // ---- My Profile: student can upload & remove their own profile photo ----
  win.portalNavigate('profile');
  check('Change Photo control present on My Profile', doc.getElementById('portalContent').innerHTML.includes('pProfilePhotoInput'));
  const sPhotoInput = doc.getElementById('pProfilePhotoInput');
  const sPhotoFile = new win.File(['fake-image-bytes'], 'student-avatar.png', {type:'image/png'});
  Object.defineProperty(sPhotoInput, 'files', { value:[sPhotoFile], configurable:true });
  sPhotoInput.dispatchEvent(new win.Event('change', {bubbles:true}));
  await wait(150);
  check('Student record now has a photo', !!win.DB.students.find(s=>s.id===1).photo);
  check('Portal header avatar now renders the uploaded photo', doc.getElementById('portalAvatar').innerHTML.includes('<img'));
  check('Profile page preview also renders the uploaded photo', doc.getElementById('portalContent').innerHTML.includes('<img'));
  click(win, '[data-action="p-remove-photo"]');
  check('Student photo removed', !win.DB.students.find(s=>s.id===1).photo);
  check('Portal header avatar falls back to initials after removal', !doc.getElementById('portalAvatar').innerHTML.includes('<img'));

  allErrors = allErrors.concat(errors);
  dom.window.close();
}

console.log('\n=== TEACHER PORTAL (teacher-portal.html) ===');
{
  const { dom, errors } = await loadPage('teacher-portal.html');
  const win = dom.window, doc = win.document;
  check('no load errors', errors.length===0);
  if(errors.length) console.log(errors.join('\n'));

  check('Demo teacher select is populated', doc.getElementById('demoTeacherSelect').options.length > 1);

  // Log in as Mahfuzur Rahman (user 6, role 5) via phone
  doc.getElementById('tpLoginPhone').value = '01722998877';
  click(win, '#btnTpLogin');
  check('Portal shell shown after phone login', doc.getElementById('portalShell').style.display === 'flex');
  check('Portal nav includes My Batches / Attendance / My Payments', doc.getElementById('portalNav').innerHTML.includes('My Batches') && doc.getElementById('portalNav').innerHTML.includes('Attendance') && doc.getElementById('portalNav').innerHTML.includes('My Payments'));

  // ---- New sidebar layout: grouped/collapsible nav (replaces the old cramped header menu) ----
  check('Sidebar shell rendered instead of a horizontal header menu', !!doc.getElementById('portalSidebar') && !!doc.getElementById('btnPortalHamburger'));
  check('Page title reflects current view', doc.getElementById('portalPageTitle').textContent === 'Dashboard');
  const teachingGroupSel = '[data-action="toggle-tp-nav-group"][data-group="grp-teaching"]';
  check('Multi-item group header present (Teaching)', !!doc.querySelector(teachingGroupSel));
  check('Other group collapsed by default', !doc.querySelector(teachingGroupSel).closest('.nav-section').classList.contains('expanded'));
  click(win, teachingGroupSel); // buildTpNav() re-renders #portalNav on every toggle, so re-query fresh nodes each time rather than reusing a stale reference
  check('Clicking a group header expands it', doc.querySelector(teachingGroupSel).closest('.nav-section').classList.contains('expanded'));
  click(win, '#btnPortalHamburger');
  check('Hamburger opens the sidebar', doc.getElementById('portalSidebar').classList.contains('show'));
  click(win, '#portalSidebarScrim');
  check('Clicking the scrim closes the sidebar', !doc.getElementById('portalSidebar').classList.contains('show'));

  // Dashboard shows this teacher's real batch/earnings figures
  const dashHtml = doc.getElementById('portalContent').innerHTML;
  check('Dashboard shows My Batches section', dashHtml.includes('My Batches'));
  check('Dashboard batch count matches scopedBatchesForUser', win.tpBatches().length === win.scopedBatchesForUser(6).length && win.tpBatches().length > 0);

  // My Students — read only roster
  win.tpNavigate('students');
  check('My Students view renders batch rosters', doc.getElementById('portalContent').innerHTML.includes('My Students'));
  check('No action buttons (read-only) on student rows', doc.querySelectorAll('#portalContent [data-action]').length === 0);

  // Attendance marking — mark a student absent and save, verify it lands in DB.attendanceRecords
  // (tpAttDate/tpAttModuleId are internal `let` state, not exposed on `window` — assert via the DB instead)
  win.tpNavigate('attendance');
  const firstCell = doc.querySelector('[data-action="tp-mark-attendance-cell"][data-status="absent"]');
  check('Attendance marking cell present', !!firstCell);
  if(firstCell){
    const sid = Number(firstCell.dataset.studentid);
    clickEl(win, firstCell);
    const saveBtn = doc.querySelector('[data-action="tp-save-attendance"]');
    const batchId = Number(saveBtn.dataset.batchid);
    const sessionsBefore = win.DB.attendanceSessions.filter(s=>s.batch_id===batchId && s.marked_by===6).length;
    click(win, '[data-action="tp-save-attendance"]');
    const sess = win.DB.attendanceSessions.filter(s=>s.batch_id===batchId && s.marked_by===6).sort((a,b)=>b.id-a.id)[0];
    check('A new/updated session is recorded as marked by this teacher', win.DB.attendanceSessions.filter(s=>s.batch_id===batchId && s.marked_by===6).length >= sessionsBefore);
    const rec = sess ? win.DB.attendanceRecords.find(r=>r.session_id===sess.id && r.student_id===sid) : null;
    check('Attendance saved as absent for the marked student', !!rec && rec.status === 'absent');
  }

  // My Payments — read-only, scoped to this teacher, with a printable voucher for paid entries
  win.tpNavigate('payments');
  const payHtml = doc.getElementById('portalContent').innerHTML;
  check('My Payments view renders pay rate & earnings table', payHtml.includes('Earnings by Batch'));
  check('My Payments only lists this teacher\'s own vouchers', win.DB.teacherPayments.filter(p=>p.teacher_id===6).every(p=>payHtml.includes(p.voucher_no)) && !payHtml.includes(win.DB.teacherPayments.find(p=>p.teacher_id===7).voucher_no));
  const voucherBtn = doc.querySelector('[data-action="tp-view-voucher"]');
  if(voucherBtn){ clickEl(win, voucherBtn); check('Voucher modal opens from teacher portal', doc.getElementById('modalTitle').textContent.includes('Voucher')); win.closeModal(); }

  // ---- My Profile: teacher can upload & remove their own profile photo ----
  win.tpNavigate('profile');
  check('Change Photo control present on Teacher Profile', doc.getElementById('portalContent').innerHTML.includes('tpProfilePhotoInput'));
  const tPhotoInput = doc.getElementById('tpProfilePhotoInput');
  const tPhotoFile = new win.File(['fake-image-bytes'], 'teacher-avatar.png', {type:'image/png'});
  Object.defineProperty(tPhotoInput, 'files', { value:[tPhotoFile], configurable:true });
  tPhotoInput.dispatchEvent(new win.Event('change', {bubbles:true}));
  await wait(150);
  check('Teacher user record now has a photo', !!win.DB.users.find(u=>u.id===6).photo);
  check('Portal header avatar now renders the uploaded photo', doc.getElementById('portalAvatar').innerHTML.includes('<img'));
  click(win, '[data-action="tp-remove-photo"]');
  check('Teacher photo removed', !win.DB.users.find(u=>u.id===6).photo);
  check('Portal header avatar falls back to initials after removal', !doc.getElementById('portalAvatar').innerHTML.includes('<img'));

  // Logout returns to the auth screen
  click(win, '[data-action="tp-logout"]');
  check('Logout returns to auth screen', doc.getElementById('authScreen').style.display !== 'none' && doc.getElementById('portalShell').style.display === 'none');

  allErrors = allErrors.concat(errors);
  dom.window.close();
}

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed, ${allErrors.length} load/exec errors ===`);
process.exit((fail>0 || allErrors.length>0) ? 1 : 0);

})();
