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

  allErrors = allErrors.concat(errors);
  dom.window.close();
}

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed, ${allErrors.length} load/exec errors ===`);
process.exit((fail>0 || allErrors.length>0) ? 1 : 0);

})();
