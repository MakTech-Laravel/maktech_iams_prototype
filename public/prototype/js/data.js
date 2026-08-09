/* ============================================================
   Mock data layer — MakTech IAMS (Industrial Attachment Management System)
   All data is static/in-memory, for prototype/visualization only.
   ============================================================ */

const DB = {};
if(typeof window !== 'undefined') window.DB = DB; // expose for console/debugging & tests
const TODAY = "2026-08-06"; // fixed "current date" for this prototype — kept at top since seed generators below need it immediately

DB.orgProfile = {
  name: "MakTech Industrial Attachment Institute",
  branch: "Dhaka Main Campus",
  session: "2025–2026",
  address: "House 14, Road 7, Dhanmondi, Dhaka-1209",
  phone: "+880 1711-223344",
  email: "info@maktech.com.bd"
};

DB.roles = [
  { id:1, name:"Super Admin", users:1, desc:"Full access to everything, system configuration, user/role management" },
  { id:2, name:"Admin / Manager", users:2, desc:"Full operational access except system-level config" },
  { id:3, name:"Marketing Officer", users:4, desc:"Leads, polytechnic visits, follow-ups, conversion tracking" },
  { id:4, name:"Accountant / Finance Officer", users:2, desc:"Payments, expenses, financial reports, refunds" },
  { id:5, name:"Course Coordinator / Teacher", users:6, desc:"Class schedule, attendance, module progress" },
  { id:6, name:"Front Desk / Admission Officer", users:3, desc:"Student registration, profile & document collection" },
  { id:7, name:"Auditor (Read-only)", users:1, desc:"View-only access to reports & logs" },
  { id:8, name:"Managing Director / Boss", users:1, desc:"Senior management — cash custodian for handovers, financial oversight & final sign-off" },
];

DB.permModules = ["Institutions","Leads/CRM","Courses","Students","Batches","Attendance","Payments","CashManagement","Expenses","TeacherPayments","Certificates","Reports","Notifications","Users","Audit","Settings"];
/* "ChangeStatus" is a generic action available on every module (Students, Payments, Batches, etc.) — it's
   deliberately separate from "Edit" so an org can let someone edit a record's details without letting them
   change its lifecycle status (e.g. mark a student Dropped, or force an invoice to Paid/Cancelled). */
DB.permActions = ["View","Create","Edit","Delete","Approve","ChangeStatus"];
DB.rolePermMatrix = {
  1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{}, 7:{}, 8:{}
};
DB.permModules.forEach(m=>{
  Object.keys(DB.rolePermMatrix).forEach(r=>{ DB.rolePermMatrix[r][m] = {}; });
});
// seed sensible role-level defaults (these are the "defaults" — individual users can be overridden in Access Control)
function seedPerm(roleId, mod, actions){ DB.permModules.includes(mod) && actions.forEach(a=> DB.rolePermMatrix[roleId][mod][a]=true); }
DB.permModules.forEach(m=> seedPerm(1,m,DB.permActions));
["Institutions","Leads/CRM","Courses","Students","Batches","Attendance","Payments","CashManagement","Expenses","Certificates","Reports","Notifications"].forEach(m=> seedPerm(2,m,["View","Create","Edit","Approve"]));
seedPerm(2,"Users",["View","Create","Edit"]); seedPerm(2,"Audit",["View"]);
seedPerm(2,"TeacherPayments",["View","Create","Edit","Approve"]); // Admin/Manager sets pay rates, raises & approves teacher payments
seedPerm(3,"Leads/CRM",["View","Create","Edit"]); seedPerm(3,"Institutions",["View","Create","Edit"]); seedPerm(3,"Reports",["View"]);
seedPerm(4,"Payments",["View","Create","Edit","Approve"]); seedPerm(4,"CashManagement",["View","Create","Edit"]); seedPerm(4,"Expenses",["View","Create","Edit","Approve"]); seedPerm(4,"Reports",["View"]); seedPerm(4,"Students",["View"]);
seedPerm(4,"TeacherPayments",["View","Create","Edit","Approve"]); // Accountant disburses approved teacher payments & can also raise/approve them
seedPerm(5,"Batches",["View","Edit"]); seedPerm(5,"Attendance",["View","Create","Edit"]); seedPerm(5,"Students",["View"]); seedPerm(5,"Courses",["View"]);
seedPerm(5,"TeacherPayments",["View"]); // Coordinator/Teacher can only VIEW their own pay rate & payment history (batch-scoped) — never raise/approve/pay
seedPerm(6,"Students",["View","Create","Edit"]); seedPerm(6,"Courses",["View"]);
seedPerm(7,"Reports",["View"]); seedPerm(7,"Audit",["View"]); DB.permModules.forEach(m=> seedPerm(7,m,["View"]));
// Managing Director/Boss — oversight + the one who signs for cash handed over from Accountants; deliberately
// does NOT get Create on CashManagement (separation of duties: the person who receives cash shouldn't also
// be the one logging the collection) but CAN Approve (= sign/confirm receipt) and view Payments/Reports.
seedPerm(8,"CashManagement",["View","Approve"]); seedPerm(8,"Payments",["View"]); seedPerm(8,"Expenses",["View","Approve"]); seedPerm(8,"Reports",["View"]); seedPerm(8,"Students",["View"]);
seedPerm(8,"TeacherPayments",["View","Approve"]); // MD/Boss can review & approve, same separation-of-duties pattern as CashManagement

/* "Change Status" — who can flip a record's lifecycle status (student active/dropped/etc., invoice
   paid/cancelled/etc., a batch's upcoming/ongoing/completed). Deliberately NOT granted to everyone who
   has "Edit" — e.g. Front Desk can edit a student's profile fields but Coordinators/Teachers can't
   change status at all, demonstrating this is independent from Edit. */
seedPerm(2,"Students",["ChangeStatus"]); seedPerm(2,"Payments",["ChangeStatus"]); seedPerm(2,"Batches",["ChangeStatus"]);
seedPerm(4,"Payments",["ChangeStatus"]); // Accountant can correct/cancel an invoice's status
seedPerm(6,"Students",["ChangeStatus"]); // Front Desk updates a student's enrollment status (active/on-hold/dropped) as part of registration duties

/* ---------------- Per-user permission overrides (admin can override role defaults for ANY specific user) ---------------- */
DB.userPermOverrides = {}; // { [userId]: { [module]: { [action]: true|false } } } — only explicit overrides stored; everything else falls back to role default

function effectivePerm(userId, mod, action){
  const override = DB.userPermOverrides[userId]?.[mod]?.[action];
  if(override !== undefined) return override;
  const u = DB.users.find(x=>x.id===userId);
  if(!u) return false;
  return !!DB.rolePermMatrix[u.role_id]?.[mod]?.[action];
}
function setUserPermOverride(userId, mod, action, value){
  DB.userPermOverrides[userId] = DB.userPermOverrides[userId] || {};
  DB.userPermOverrides[userId][mod] = DB.userPermOverrides[userId][mod] || {};
  DB.userPermOverrides[userId][mod][action] = value;
}
function clearUserPermOverrides(userId){ delete DB.userPermOverrides[userId]; }
function hasAnyOverride(userId){ return !!DB.userPermOverrides[userId] && Object.keys(DB.userPermOverrides[userId]).length>0; }

/* ============================================================
   FINE-GRAINED ACCESS — beyond the Module × Action matrix above.
   These reuse the exact same rolePermMatrix / userPermOverrides / effectivePerm machinery (they're just
   extra string keys inside the same per-module object), so every override, "Custom" badge, and "Reset to
   Role Default" button already works for them with zero extra plumbing:
     • Per-report access:  effectivePerm(userId, 'Reports', 'Report_<id>')
     • Per-list access:    effectivePerm(userId, 'Payments'|'Students', 'List_<key>')
     • Admin Panel access: effectivePerm(userId, 'Users', 'AdminPanelAccess')  — see teacher-portal gating below
   ============================================================ */

/* ---- Per-report permissions — a report is invisible/blocked unless explicitly allowed for this role/user.
   IDs must stay in sync with the REPORTS catalogue in render-reports.js (ids 1–44, grouped exactly as there). */
const REPORT_IDS = {
  marketing: [1,2,3,4,5,6,7,8],
  studentAcademic: [9,10,11,12,13,14,15,16,17],
  financial: [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,42],
  teacherPayment: [43,44],
  certificateId: [36,37,38],
  system: [39,40,41],
};
const ALL_REPORT_IDS = Object.values(REPORT_IDS).flat();
function seedReportAccess(roleId, ids){ ids.forEach(id=> DB.rolePermMatrix[roleId]["Reports"]["Report_"+id] = true); }
function canAccessReport(userId, reportId){
  return effectivePerm(userId,'Reports','View') && effectivePerm(userId,'Reports','Report_'+reportId);
}

seedReportAccess(1, ALL_REPORT_IDS); // Super Admin — everything
seedReportAccess(2, ALL_REPORT_IDS); // Admin/Manager — full operational access
seedReportAccess(3, REPORT_IDS.marketing); // Marketing Officer — only their own funnel/conversion reports
seedReportAccess(4, [...REPORT_IDS.financial, ...REPORT_IDS.teacherPayment]); // Accountant — money reports only
seedReportAccess(7, ALL_REPORT_IDS); // Auditor — read-only visibility into everything
seedReportAccess(8, [...REPORT_IDS.financial, ...REPORT_IDS.teacherPayment, ...REPORT_IDS.system]); // MD/Boss — oversight-level reports
// Coordinator/Teacher (5) and Front Desk (6) get no reports by default — Reports isn't even in their nav.
// Demonstrates per-USER granularity on top of the per-ROLE default: Kamrul (Front Desk, role 6, id 8) is
// individually granted two student reports even though his role gets none.
setUserPermOverride(8, 'Reports', 'View', true);
setUserPermOverride(8, 'Reports', 'Report_9', true);
setUserPermOverride(8, 'Reports', 'Report_10', true);

/* ---- Per-list ("sub-view") permissions — lets Admin show/hide specific status-filtered lists inside a
   page (e.g. an Accountant who should see the Due list but never browse the full Paid history). */
const PAYMENT_LIST_KEYS = ['Paid','Partial','Due','Overdue'];
const STUDENT_LIST_KEYS = ['Active','Dropped','OnHold','Completed'];
function seedListAccess(roleId, mod, keys){ keys.forEach(k=> DB.rolePermMatrix[roleId][mod]['List_'+k] = true); }
function canViewList(userId, mod, key){ return effectivePerm(userId, mod, 'List_'+key); }

seedListAccess(1,'Payments',PAYMENT_LIST_KEYS); seedListAccess(1,'Students',STUDENT_LIST_KEYS);
seedListAccess(2,'Payments',PAYMENT_LIST_KEYS); seedListAccess(2,'Students',STUDENT_LIST_KEYS);
seedListAccess(4,'Payments',PAYMENT_LIST_KEYS); seedListAccess(4,'Students',['Active']); // Accountant: full payment lists, but only the Active student list
seedListAccess(5,'Students',STUDENT_LIST_KEYS); // Coordinator/Teacher — already batch-scoped, so no extra status restriction needed
seedListAccess(6,'Students',STUDENT_LIST_KEYS); // Front Desk needs every status while registering/tracking students
seedListAccess(7,'Payments',PAYMENT_LIST_KEYS); seedListAccess(7,'Students',STUDENT_LIST_KEYS); // Auditor sees all lists
seedListAccess(8,'Payments',PAYMENT_LIST_KEYS); seedListAccess(8,'Students',['Active']); // MD/Boss: full financial picture, active students only

const INVOICE_STATUS_TO_LIST_KEY = { paid:'Paid', partial:'Partial', due:'Due', overdue:'Overdue', cancelled:'Overdue' };
function allowedInvoiceStatuses(userId){
  return PAYMENT_LIST_KEYS.filter(k=>canViewList(userId,'Payments',k)).map(k=>k.toLowerCase());
}
function visibleInvoicesForUser(userId, invoices){
  const allowed = allowedInvoiceStatuses(userId);
  return (invoices||DB.feeInvoices).filter(i=> allowed.includes(INVOICE_STATUS_TO_LIST_KEY[i.status]?.toLowerCase() || i.status));
}
const STUDENT_STATUS_TO_LIST_KEY = { active:'Active', prospect:'Active', admitted:'Active', dropped:'Dropped', on_hold:'OnHold', completed:'Completed', certified:'Completed' };
function allowedStudentStatusKeys(userId){ return STUDENT_LIST_KEYS.filter(k=>canViewList(userId,'Students',k)); }
function visibleStudentsForUser(userId, students){
  const allowedKeys = allowedStudentStatusKeys(userId);
  return (students||DB.students).filter(s=> allowedKeys.includes(STUDENT_STATUS_TO_LIST_KEY[s.status]||'Active'));
}

/* ---- Admin Panel access — Coordinators/Teachers use a dedicated Teacher Portal (teacher-portal.html)
   instead of this admin panel by default. Admin can grant an individual teacher full admin-panel access
   as an exception via Access Control, which flips this same permission for just that user. */
[1,2,3,4,6,7,8].forEach(roleId => DB.rolePermMatrix[roleId]["Users"]["AdminPanelAccess"] = true);
// role 5 (Coordinator/Teacher) is intentionally left "false" (unset) — portal-only by default
function canAccessAdminPanel(userId){ return effectivePerm(userId,'Users','AdminPanelAccess'); }

DB.users = [
  { id:1, name:"Rafiul Islam", email:"rafiul@maktech.com.bd", phone:"01711223344", role_id:1, status:"active", avatarColor:"#ff6533" },
  { id:2, name:"Nasrin Akter", email:"nasrin@maktech.com.bd", phone:"01812345678", role_id:2, status:"active" },
  { id:3, name:"Shakil Ahmed", email:"shakil@maktech.com.bd", phone:"01911002233", role_id:3, status:"active" },
  { id:4, name:"Farhana Yasmin", email:"farhana@maktech.com.bd", phone:"01611882233", role_id:3, status:"active" },
  { id:5, name:"Tanvir Hasan", email:"tanvir@maktech.com.bd", phone:"01511220099", role_id:4, status:"active" },
  { id:6, name:"Mahfuzur Rahman", email:"mahfuz@maktech.com.bd", phone:"01722998877", role_id:5, status:"active" },
  { id:7, name:"Sumaiya Islam", email:"sumaiya@maktech.com.bd", phone:"01911776655", role_id:5, status:"active" },
  { id:8, name:"Kamrul Hasan", email:"kamrul@maktech.com.bd", phone:"01611009988", role_id:6, status:"active" },
  { id:9, name:"Jannatul Ferdous", email:"jannat@maktech.com.bd", phone:"01811443322", role_id:3, status:"inactive" },
  { id:10, name:"Abu Sayed", email:"sayed@maktech.com.bd", phone:"01755443322", role_id:7, status:"active" },
  { id:11, name:"Kamal Uddin Ahmed", email:"kamal@maktech.com.bd", phone:"01911002200", role_id:8, status:"active", cash_custodian:true },
];
DB.users[0].cash_custodian = true; // Rafiul Islam (Super Admin) can also personally receive cash handovers
DB.users[1].cash_custodian = true; // Nasrin Akter (Admin/Manager) can also personally receive cash handovers

/* Demo per-user overrides — shows that ANY individual user can get page/action access beyond (or below) their role default */
setUserPermOverride(6, "Payments", "View", true);      // Mahfuzur (Coordinator) additionally allowed to view Payments for his own batches
setUserPermOverride(7, "Certificates", "View", true);   // Sumaiya (Coordinator) additionally allowed to view Certificates
setUserPermOverride(8, "Reports", "View", true);        // Kamrul (Front Desk) additionally allowed to view Reports
setUserPermOverride(3, "Payments", "View", false);      // Shakil (Marketing) explicitly blocked from Payments despite any future role change

function userName(id){ const u=DB.users.find(x=>x.id===id); return u? u.name : "—"; }
function roleName(id){ const r=DB.roles.find(x=>x.id===id); return r? r.name : "—"; }

/* ---------------- Institutions (Polytechnics) ---------------- */
DB.institutions = [
  { id:1, name:"Dhaka Polytechnic Institute", type:"government", address:"Tejgaon Industrial Area, Dhaka", contact_person:"Prof. Abdul Karim", phone:"02-8870021", email:"principal@dpi.gov.bd", mou_status:"signed", students:186, revenue:4260000, activeLeads:12,
    departments:["Computer Technology","Electrical Technology","Civil Technology","Mechanical Technology"] },
  { id:2, name:"Rajshahi Polytechnic Institute", type:"government", address:"Sopura, Rajshahi", contact_person:"Prof. Mizanur Rahman", phone:"0721-772233", email:"info@rpi.gov.bd", mou_status:"signed", students:97, revenue:2140000, activeLeads:6,
    departments:["Computer Technology","Power Technology","RAC Technology"] },
  { id:3, name:"Ideal Polytechnic Institute (Private)", type:"private", address:"Mirpur-10, Dhaka", contact_person:"Ms. Farhana Chowdhury", phone:"01811009900", email:"office@idealpoly.edu.bd", mou_status:"signed", students:64, revenue:1380000, activeLeads:9,
    departments:["Computer Technology","Electronics Technology"] },
  { id:4, name:"Chittagong Polytechnic Institute", type:"government", address:"Chattogram", contact_person:"Prof. Delwar Hossain", phone:"031-654321", email:"cpi@moedu.gov.bd", mou_status:"pending", students:22, revenue:410000, activeLeads:15,
    departments:["Civil Technology","Mechanical Technology"] },
  { id:5, name:"Bogura Polytechnic Institute", type:"government", address:"Bogura", contact_person:"Prof. Yasin Ali", phone:"051-667788", email:"bpi@moedu.gov.bd", mou_status:"signed", students:41, revenue:890000, activeLeads:4,
    departments:["Computer Technology","Electrical Technology"] },
  { id:6, name:"Northern College of Engineering & Tech.", type:"private", address:"Uttara, Dhaka", contact_person:"Mr. Saiful Islam", phone:"01922334455", email:"admin@ncet.edu.bd", mou_status:"none", students:0, activeLeads:21, revenue:0,
    departments:["Computer Technology"] },
  { id:7, name:"Khulna Polytechnic Institute", type:"government", address:"Khulna", contact_person:"Prof. Nazma Begum", phone:"041-720011", email:"kpi@moedu.gov.bd", mou_status:"signed", students:53, revenue:1120000, activeLeads:7,
    departments:["Computer Technology","Marine Technology"] },
];

DB.visits = [
  { id:1, institution_id:1, visited_by:3, visit_date:"2026-07-28", purpose:"New batch promotion — 4th semester students", outcome:"Very positive, 40+ students interested", next_action:"Send brochure & pricing sheet", next_action_date:"2026-08-05" },
  { id:2, institution_id:4, visited_by:4, visit_date:"2026-07-25", purpose:"MOU discussion with principal", outcome:"Principal reviewing draft MOU", next_action:"Follow-up call", next_action_date:"2026-08-08" },
  { id:3, institution_id:3, visited_by:3, visit_date:"2026-07-22", purpose:"Career counselling seminar", outcome:"25 leads collected on-site", next_action:"Bulk SMS to leads", next_action_date:"2026-08-01" },
  { id:4, institution_id:6, visited_by:9, visit_date:"2026-07-20", purpose:"Initial relationship building", outcome:"Interested in partnership, needs MOU", next_action:"Draft MOU & send", next_action_date:"2026-08-10" },
  { id:5, institution_id:2, visited_by:4, visit_date:"2026-07-15", purpose:"Existing batch attendance check-in", outcome:"Smooth, no issues", next_action:"Routine follow-up next month", next_action_date:"2026-09-01" },
  { id:6, institution_id:7, visited_by:3, visit_date:"2026-07-10", purpose:"Department head meeting", outcome:"Requested discount for bulk enrollment", next_action:"Prepare institute bulk discount proposal", next_action_date:"2026-08-03" },
];

/* ---------------- Departments & Courses ---------------- */
DB.departments = [
  { id:1, name:"Computer & IT", desc:"Programming, networking, hardware & industrial automation courses" },
  { id:2, name:"Electrical & Electronics", desc:"Electrical wiring, PLC, industrial electronics" },
  { id:3, name:"Civil & Architecture", desc:"AutoCAD, site supervision, surveying" },
  { id:4, name:"Mechanical & RAC", desc:"CNC, RAC servicing, mechanical maintenance" },
];

DB.courses = [
  { id:1, dept_id:1, name:"Industrial Attachment — Web & App Development", code:"CIT-101", duration_days:90, base_price:18000, status:"active", seats:40, enrolled:34,
    desc:"Hands-on industrial attachment covering full-stack development practices used in real production environments.",
    modules:[
      {id:1,title:"HTML/CSS/JS Foundations",seq:1,hours:20},
      {id:2,title:"Backend with Node.js & REST APIs",seq:2,hours:30},
      {id:3,title:"Databases (MySQL/PostgreSQL)",seq:3,hours:20},
      {id:4,title:"Industrial Project & Deployment",seq:4,hours:30},
    ],
    discounts:[{type:"percentage", value:10, reason:"Early bird (before batch start)", from:"2026-06-01", to:"2026-08-15"}]},
  { id:2, dept_id:1, name:"Industrial Attachment — Networking & System Admin", code:"CIT-102", duration_days:75, base_price:15000, status:"active", seats:35, enrolled:28,
    desc:"CCNA-aligned networking with real ISP/enterprise attachment exposure.",
    modules:[
      {id:5,title:"Networking Fundamentals",seq:1,hours:20},
      {id:6,title:"Router/Switch Configuration",seq:2,hours:25},
      {id:7,title:"Linux Server Administration",seq:3,hours:20},
      {id:8,title:"Industrial Attachment (ISP/Enterprise)",seq:4,hours:10},
    ],
    discounts:[{type:"flat", value:1500, reason:"Institute bulk deal (DPI)", from:"2026-01-01", to:"2026-12-31"}]},
  { id:3, dept_id:2, name:"Industrial Attachment — Industrial Electrical & PLC", code:"EEE-201", duration_days:90, base_price:20000, status:"active", seats:30, enrolled:22,
    desc:"PLC programming, industrial wiring standards, and factory-floor attachment.",
    modules:[
      {id:9,title:"Electrical Safety & Wiring",seq:1,hours:20},
      {id:10,title:"PLC Programming Basics",seq:2,hours:30},
      {id:11,title:"SCADA & HMI Systems",seq:3,hours:20},
      {id:12,title:"Factory Floor Attachment",seq:4,hours:30},
    ],
    discounts:[]},
  { id:4, dept_id:3, name:"Industrial Attachment — AutoCAD & Site Supervision", code:"CE-301", duration_days:60, base_price:12000, status:"active", seats:35, enrolled:19,
    desc:"2D/3D AutoCAD drafting plus real construction site supervision exposure.",
    modules:[
      {id:13,title:"AutoCAD 2D Drafting",seq:1,hours:25},
      {id:14,title:"AutoCAD 3D & Rendering",seq:2,hours:20},
      {id:15,title:"Site Supervision Attachment",seq:3,hours:15},
    ],
    discounts:[{type:"percentage", value:15, reason:"Referral discount", from:"2026-01-01", to:"2026-12-31"}]},
  { id:5, dept_id:4, name:"Industrial Attachment — CNC Machining & RAC", code:"ME-401", duration_days:75, base_price:16000, status:"active", seats:25, enrolled:15,
    desc:"CNC operation, programming, and refrigeration & air-conditioning servicing.",
    modules:[
      {id:16,title:"CNC Machine Operation",seq:1,hours:25},
      {id:17,title:"CNC Programming (G-code)",seq:2,hours:20},
      {id:18,title:"RAC Servicing Attachment",seq:3,hours:30},
    ],
    discounts:[]},
  { id:6, dept_id:1, name:"Advanced Cloud & DevOps Attachment", code:"CIT-103", duration_days:60, base_price:22000, status:"draft", seats:20, enrolled:0,
    desc:"AWS/Docker/Kubernetes with real deployment pipelines. (Launching next session)",
    modules:[
      {id:19,title:"Cloud Fundamentals (AWS)",seq:1,hours:20},
      {id:20,title:"Docker & Kubernetes",seq:2,hours:20},
      {id:21,title:"CI/CD Attachment Project",seq:3,hours:20},
    ],
    discounts:[]},
  { id:7, dept_id:2, name:"Renewable Energy Systems (Solar) Attachment", code:"EEE-202", duration_days:45, base_price:14000, status:"archived", seats:20, enrolled:12,
    desc:"Solar panel installation & maintenance — archived after pilot batch.",
    modules:[ {id:22,title:"Solar PV Fundamentals",seq:1,hours:15}, {id:23,title:"Installation & Maintenance",seq:2,hours:20} ],
    discounts:[]},
];
function courseName(id){ const c=DB.courses.find(x=>x.id===id); return c? c.name : "—"; }
function deptName(id){ const d=DB.departments.find(x=>x.id===id); return d? d.name : "—"; }
/* Curriculum module ids are unique across ALL courses (moduleProgress/attendance sessions reference them
   by id alone), so new modules — whether added via "Manage Curriculum" or a brand-new course — must keep
   drawing from one shared counter. */
function nextModuleId(){ const ids = DB.courses.flatMap(c=>c.modules.map(m=>m.id)); return ids.length ? Math.max(...ids)+1 : 1; }
function nextCourseId(){ return DB.courses.length ? Math.max(...DB.courses.map(c=>c.id))+1 : 1; }

/* ---------------- Course Sessions (intake terms) → Batches ---------------- */
/* Hierarchy: Course → Session (e.g. "Session 2026-A") → Batch(es). Admin creates a Session under
   a course, then adds one or more batches inside that session. */
DB.sessions = [
  { id:1, course_id:1, name:"Session 2026-A", start:"2026-06-01", end:"2026-08-30", status:"ongoing" },
  { id:2, course_id:1, name:"Session 2025-D (Winter)", start:"2026-01-10", end:"2026-04-10", status:"completed" },
  { id:3, course_id:2, name:"Session 2026-A", start:"2026-06-10", end:"2026-08-24", status:"ongoing" },
  { id:4, course_id:3, name:"Session 2026-A", start:"2026-05-15", end:"2026-08-13", status:"ongoing" },
  { id:5, course_id:4, name:"Session 2026-A", start:"2026-07-01", end:"2026-08-30", status:"ongoing" },
  { id:6, course_id:5, name:"Session 2026-B", start:"2026-07-05", end:"2026-09-18", status:"upcoming" },
];
function sessionName(id){ const s=DB.sessions.find(x=>x.id===id); return s? s.name : "—"; }
function sessionsForCourse(courseId){ return DB.sessions.filter(s=>s.course_id===courseId); }
function batchesInSession(sessionId){ return DB.batches.filter(b=>b.session_id===sessionId); }

/* ---------------- Labs / Classrooms (dynamic — created & capacity-managed by Admin) ----------------
   Every batch is assigned to one lab; a batch's real capacity is always capped at the lab's capacity, and
   every time a student is added to a batch (registration, additional enrollment, or self-enrollment
   approval) the live seat count is checked against this cap — see canEnrollInBatch() below. */
DB.labs = [
  { id:1, name:"Lab-1", capacity:40, location:"Main Building, 2nd Floor", notes:"General-purpose computer lab", status:"active" },
  { id:2, name:"Lab-2", capacity:35, location:"Main Building, 2nd Floor", notes:"Networking & systems lab", status:"active" },
  { id:3, name:"Workshop-A", capacity:30, location:"Workshop Block", notes:"Electrical/PLC workshop", status:"active" },
  { id:4, name:"Workshop-B", capacity:30, location:"Workshop Block", notes:"CNC/RAC workshop", status:"active" },
  { id:5, name:"Drafting Hall", capacity:35, location:"Main Building, 1st Floor", notes:"AutoCAD/drafting hall", status:"active" },
  { id:6, name:"Lab-3", capacity:30, location:"Main Building, 3rd Floor", notes:"Newly added — available for new batches", status:"active" },
];
function labById(id){ return DB.labs.find(l=>l.id===Number(id)); }
function labName(id){ const l=labById(id); return l ? l.name : "—"; }
function activeLabs(){ return DB.labs.filter(l=>l.status==='active'); }
/* Batches currently (non-completed) assigned to this lab — used to warn admin before shrinking capacity. */
function batchesUsingLab(labId, excludeBatchId){
  return DB.batches.filter(b=>b.lab_id===Number(labId) && b.status!=='completed' && b.id!==excludeBatchId);
}
function createLab({name, capacity, location, notes}){
  const lab = { id: nextId(DB.labs), name: (name||'').trim() || ('Lab-'+(DB.labs.length+1)), capacity: Math.max(1, Number(capacity)||1), location: location||'', notes: notes||'', status:'active' };
  DB.labs.push(lab);
  return lab;
}
function updateLab(id, {name, capacity, location, notes, status}){
  const lab = labById(id); if(!lab) return null;
  if(name!=null && name.trim()) lab.name = name.trim();
  if(capacity!=null && !isNaN(Number(capacity))) lab.capacity = Math.max(1, Number(capacity));
  if(location!=null) lab.location = location;
  if(notes!=null) lab.notes = notes;
  if(status!=null) lab.status = status;
  return lab;
}

/* ---------------- Batches / Class Schedule ---------------- */
DB.batches = [
  { id:1, session_id:1, course_id:1, name:"Batch-26-A", start:"2026-06-01", end:"2026-08-30", coordinator_id:6, assigned_teachers:[6], capacity:40, status:"ongoing", lab_id:1 },
  { id:2, session_id:3, course_id:2, name:"Batch-26-B", start:"2026-06-10", end:"2026-08-24", coordinator_id:7, assigned_teachers:[7], capacity:35, status:"ongoing", lab_id:2 },
  { id:3, session_id:4, course_id:3, name:"Batch-26-C", start:"2026-05-15", end:"2026-08-13", coordinator_id:6, assigned_teachers:[6,7], capacity:30, status:"ongoing", lab_id:3 },
  { id:4, session_id:5, course_id:4, name:"Batch-26-D", start:"2026-07-01", end:"2026-08-30", coordinator_id:7, assigned_teachers:[7], capacity:35, status:"ongoing", lab_id:5 },
  { id:5, session_id:6, course_id:5, name:"Batch-26-E", start:"2026-07-05", end:"2026-09-18", coordinator_id:6, assigned_teachers:[6], capacity:25, status:"upcoming", lab_id:4 },
  { id:6, session_id:2, course_id:1, name:"Batch-25-Z", start:"2026-01-10", end:"2026-04-10", coordinator_id:6, assigned_teachers:[6], capacity:40, status:"completed", lab_id:1 },
];
function batchName(id){ const b=DB.batches.find(x=>x.id===id); return b? b.name : "—"; }
/* A batch's real usable capacity is always capped by whatever lab it's currently assigned to — if the lab's
   capacity is later reduced below the batch's stored capacity, this live-clamps it everywhere it's shown. */
function effectiveBatchCapacity(batch){
  if(!batch) return 0;
  const lab = labById(batch.lab_id);
  return lab ? Math.min(batch.capacity, lab.capacity) : batch.capacity;
}
/* Live count of students actively enrolled in this batch — replaces the old static "enrolled" field so
   every screen (dashboards, reports, portal) always reflects reality the moment a student is added/dropped. */
function batchEnrolledCount(batchId){ return activeStudentsInBatch(batchId).length; }
function batchSeatsAvailable(batchId){
  const b = DB.batches.find(x=>x.id===Number(batchId)); if(!b) return 0;
  return Math.max(0, effectiveBatchCapacity(b) - batchEnrolledCount(b.id));
}
/* Central guard used by every "add a student to a batch" flow (registration, additional-course override,
   enrollment-request approval, portal self-enroll) so the lab-capacity limit is enforced consistently. */
function canEnrollInBatch(batchId){
  const b = DB.batches.find(x=>x.id===Number(batchId));
  if(!b) return { ok:false, reason:'Batch not found.' };
  const cap = effectiveBatchCapacity(b);
  const taken = batchEnrolledCount(b.id);
  const available = Math.max(0, cap - taken);
  if(available<=0) return { ok:false, reason:`${b.name} is at full capacity (${taken}/${cap} — limited by ${labName(b.lab_id)}'s capacity of ${labById(b.lab_id)?.capacity ?? cap}).`, available, capacity:cap };
  return { ok:true, available, capacity:cap };
}
function createBatch({sessionId, courseId, name, capacity, start, end, coordinatorId, labId, assignedTeachers, status}){
  const lab = labById(labId);
  const reqCap = Math.max(1, Number(capacity)||1);
  const cap = lab ? Math.min(reqCap, lab.capacity) : reqCap;
  const batch = {
    id: nextId(DB.batches), session_id: Number(sessionId), course_id: Number(courseId),
    name: (name||'').trim() || ('Batch-'+nextId(DB.batches)),
    start: start||TODAY, end: end||TODAY, coordinator_id: coordinatorId?Number(coordinatorId):null,
    assigned_teachers: assignedTeachers||[], capacity: cap, status: status||'upcoming', lab_id: lab?lab.id:null
  };
  DB.batches.push(batch);
  return { batch, clamped: lab && reqCap>lab.capacity };
}

/* ---------------- Teacher/coordinator scoping helpers ---------------- */
function isTeacherRole(userId){ const u=DB.users.find(x=>x.id===userId); return u && u.role_id===5; }
function teacherUsers(){ return DB.users.filter(u=>u.role_id===5); }
function teacherByPhone(phone){ return DB.users.find(u=>u.role_id===5 && u.phone===String(phone).trim()); }

/* ---------------- Profile photo (Admin/staff users & Students — demo-only, kept in-memory as a data URL) ---------------- */
function setUserPhoto(userId, dataUrl){
  const u = DB.users.find(x=>x.id===userId); if(!u) return null;
  u.photo = dataUrl || null;
  return u;
}
function setStudentPhoto(studentId, dataUrl){
  const s = DB.students.find(x=>x.id===studentId); if(!s) return null;
  s.photo = dataUrl || null;
  return s;
}
function scopedBatchesForUser(userId){
  const u = DB.users.find(x=>x.id===userId);
  if(!u) return [];
  if(u.role_id===1 || u.role_id===2 || u.role_id===7) return DB.batches; // full/admin/audit visibility
  if(u.role_id===5) return DB.batches.filter(b => (b.assigned_teachers||[]).includes(userId) || b.coordinator_id===userId);
  return DB.batches; // other roles (marketing/accountant/frontdesk) aren't batch-scoped, module-level perms already gate their access
}
function scopedStudentsForUser(userId){
  const visibleBatchIds = scopedBatchesForUser(userId).map(b=>b.id);
  return DB.students.filter(s => s.courses.some(c => visibleBatchIds.includes(c.batch_id)));
}
function assignTeacherToBatch(batchId, teacherId){
  const b = DB.batches.find(x=>x.id===batchId);
  if(b){ b.assigned_teachers = b.assigned_teachers || []; if(!b.assigned_teachers.includes(teacherId)) b.assigned_teachers.push(teacherId); }
}
function unassignTeacherFromBatch(batchId, teacherId){
  const b = DB.batches.find(x=>x.id===batchId);
  if(b){ b.assigned_teachers = (b.assigned_teachers||[]).filter(id=>id!==teacherId); }
}

DB.classSchedule = [
  { id:1, batch_id:1, module_id:2, teacher_id:6, date:"2026-08-06", start:"10:00", end:"12:00", room:"Lab-1", mode:"physical" },
  { id:2, batch_id:2, module_id:6, teacher_id:7, date:"2026-08-06", start:"12:30", end:"14:30", room:"Lab-2", mode:"physical" },
  { id:3, batch_id:3, module_id:10, teacher_id:6, date:"2026-08-06", start:"15:00", end:"17:00", room:"Workshop-A", mode:"physical" },
  { id:4, batch_id:1, module_id:2, teacher_id:6, date:"2026-08-07", start:"10:00", end:"12:00", room:"Lab-1", mode:"physical" },
  { id:5, batch_id:4, module_id:14, teacher_id:7, date:"2026-08-07", start:"09:00", end:"11:00", room:"Drafting Hall", mode:"physical" },
  { id:6, batch_id:2, module_id:6, teacher_id:7, date:"2026-08-07", start:"12:30", end:"14:30", room:"Lab-2", mode:"online" },
  { id:7, batch_id:3, module_id:10, teacher_id:6, date:"2026-08-08", start:"15:00", end:"17:00", room:"Workshop-A", mode:"physical" },
  { id:8, batch_id:1, module_id:3, teacher_id:6, date:"2026-08-08", start:"10:00", end:"12:00", room:"Lab-1", mode:"physical" },
];

/* ============================================================
   Teacher Payments — per-batch pay rates & disbursement ledger.
   Every teacher/coordinator assigned to a batch (DB.batches[].assigned_teachers) can have a pay RATE set
   for that specific batch (a teacher may be paid differently on different batches). The rate determines
   how much has been "earned" so far (computeEarnedForTeacherBatch) — this is purely informational/suggested,
   NOT an auto-payment. Admin/Accountant still explicitly raises a payment request against that rate, which
   then goes through the same raise → approve → disburse lifecycle used elsewhere in this app (Expenses,
   Cash Management), producing a signed/printable voucher at the end.
   ============================================================ */
const PAY_RATE_TYPE_LABELS = { fixed:"Fixed (Lump Sum)", per_session:"Per Class Held", per_hour:"Per Hour Taught" };
DB.teacherPayRates = [
  { id:1, teacher_id:6, batch_id:1, rate_type:"per_session", rate_amount:800, notes:"" },
  { id:2, teacher_id:7, batch_id:2, rate_type:"fixed", rate_amount:25000, notes:"Negotiated lump sum for the full batch duration." },
  { id:3, teacher_id:6, batch_id:3, rate_type:"per_hour", rate_amount:400, notes:"Shared batch — paid per hour actually taught." },
  { id:4, teacher_id:7, batch_id:3, rate_type:"fixed", rate_amount:15000, notes:"Shared batch — co-teacher's negotiated lump sum." },
  { id:5, teacher_id:7, batch_id:4, rate_type:"per_session", rate_amount:700, notes:"" },
  { id:6, teacher_id:6, batch_id:5, rate_type:"per_session", rate_amount:750, notes:"Batch not yet started — no classes held so nothing earned yet." },
  { id:7, teacher_id:6, batch_id:6, rate_type:"fixed", rate_amount:22000, notes:"Batch completed — fully settled." },
];
function payRateFor(teacherId, batchId){ return DB.teacherPayRates.find(r=>r.teacher_id===teacherId && r.batch_id===batchId) || null; }
function payRatesForBatch(batchId){ return DB.teacherPayRates.filter(r=>r.batch_id===batchId); }
function setPayRate(teacherId, batchId, rateType, rateAmount, notes){
  let r = payRateFor(teacherId, batchId);
  if(r){ r.rate_type = rateType; r.rate_amount = rateAmount; r.notes = notes||''; }
  else { r = { id: nextId(DB.teacherPayRates), teacher_id: teacherId, batch_id: batchId, rate_type: rateType, rate_amount: rateAmount, notes: notes||'' }; DB.teacherPayRates.push(r); }
  return r;
}
/* Every batch+teacher pair that should show up on the Teacher Payments screen — every assigned-teacher
   relationship from DB.batches, whether or not a rate has been set yet (shows as "No rate set"). */
function teacherBatchPairs(batchIds){
  const ids = batchIds || DB.batches.map(b=>b.id);
  return DB.batches.filter(b=>ids.includes(b.id)).flatMap(b => (b.assigned_teachers||[]).map(tid => ({ teacher_id: tid, batch_id: b.id })));
}
/* Classes actually held BY this teacher for this batch — sourced from real attendanceSessions (the same
   record used for attendance reporting), so "Per Class Held" pay is grounded in genuine class-conduct data. */
function sessionsHeldByTeacherForBatch(teacherId, batchId){
  return DB.attendanceSessions.filter(s=>s.batch_id===batchId && s.marked_by===teacherId);
}
/* Hours taught — derived from this teacher's real class-schedule blocks for the batch. */
function hoursTaughtByTeacherForBatch(teacherId, batchId){
  return sum(DB.classSchedule.filter(c=>c.batch_id===batchId && c.teacher_id===teacherId), c=>{
    const [sh,sm] = c.start.split(':').map(Number), [eh,em] = c.end.split(':').map(Number);
    return Math.max(0, ((eh*60+em) - (sh*60+sm)) / 60);
  });
}
/* What this teacher has EARNED so far for this batch, per their rate type. Purely computed/informational —
   independent of what has actually been requested/approved/paid (see DB.teacherPayments below). */
function computeEarnedForTeacherBatch(teacherId, batchId){
  const rate = payRateFor(teacherId, batchId); if(!rate) return 0;
  if(rate.rate_type==='fixed') return rate.rate_amount;
  if(rate.rate_type==='per_session') return rate.rate_amount * sessionsHeldByTeacherForBatch(teacherId, batchId).length;
  if(rate.rate_type==='per_hour') return Math.round(rate.rate_amount * hoursTaughtByTeacherForBatch(teacherId, batchId));
  return 0;
}

/* ---------------- Teacher payment requests / disbursement ledger ---------------- */
const TEACHER_PAY_TYPE_LABELS = { lump_sum:"Lump Sum", installment:"Installment", bonus:"Bonus", adjustment:"Adjustment" };
function generateTeacherPayVoucherNo(){ return "TPV-2026-" + String(DB.teacherPayments.length+1).padStart(4,'0'); }
DB.teacherPayments = [
  { id:1, teacher_id:6, batch_id:6, type:"lump_sum", period_label:"Batch-25-Z — Full Settlement", computed_amount:22000, amount:22000,
    status:"paid", requested_by:2, requested_date:"2026-04-12", approved_by:2, approved_date:"2026-04-13",
    paid_by:5, paid_date:"2026-04-15", payment_method:"bank", txn_ref:"DBBL-TCH-88213", voucher_no:"TPV-2026-0001",
    notes:"Final settlement after batch completion & certificate ceremony." },
  { id:2, teacher_id:6, batch_id:1, type:"installment", period_label:"July 2026", computed_amount:9600, amount:9600,
    status:"paid", requested_by:2, requested_date:"2026-08-01", approved_by:2, approved_date:"2026-08-01",
    paid_by:5, paid_date:"2026-08-02", payment_method:"bkash", txn_ref:"TPBKS-9911", voucher_no:"TPV-2026-0002",
    notes:"12 classes held in July @ ৳800/class." },
  { id:3, teacher_id:7, batch_id:2, type:"lump_sum", period_label:"Batch-26-B — 50% Advance", computed_amount:25000, amount:12500,
    status:"pending", requested_by:2, requested_date:"2026-08-05", approved_by:null, approved_date:null,
    paid_by:null, paid_date:null, payment_method:null, txn_ref:null, voucher_no:"TPV-2026-0003",
    notes:"Advance requested per teacher agreement — remaining 50% due on batch completion." },
  { id:4, teacher_id:6, batch_id:3, type:"installment", period_label:"August 2026 (part-month)", computed_amount:2400, amount:2400,
    status:"approved", requested_by:2, requested_date:"2026-08-04", approved_by:2, approved_date:"2026-08-05",
    paid_by:null, paid_date:null, payment_method:null, txn_ref:null, voucher_no:"TPV-2026-0004",
    notes:"6 hours taught so far in August @ ৳400/hr — approved, awaiting disbursement." },
  { id:5, teacher_id:7, batch_id:4, type:"bonus", period_label:"Performance Bonus", computed_amount:0, amount:3000,
    status:"rejected", requested_by:2, requested_date:"2026-07-30", approved_by:2, approved_date:"2026-07-31",
    paid_by:null, paid_date:null, payment_method:null, txn_ref:null, voucher_no:"TPV-2026-0005",
    rejection_reason:"Bonus pool not approved for this session — resubmit next quarter.", notes:"" },
];
function teacherPaymentsForBatch(batchId){ return DB.teacherPayments.filter(p=>p.batch_id===batchId); }
function teacherPaymentsForTeacher(teacherId){ return DB.teacherPayments.filter(p=>p.teacher_id===teacherId); }
function teacherPaymentsScopedForUser(userId){
  if(!isTeacherRole(userId)) return DB.teacherPayments;
  return DB.teacherPayments.filter(p=>p.teacher_id===userId);
}
function totalPaidToTeacherForBatch(teacherId, batchId){ return sum(DB.teacherPayments.filter(p=>p.teacher_id===teacherId && p.batch_id===batchId && p.status==='paid'), p=>p.amount); }
function totalInFlightForTeacherBatch(teacherId, batchId){ return sum(DB.teacherPayments.filter(p=>p.teacher_id===teacherId && p.batch_id===batchId && (p.status==='pending'||p.status==='approved')), p=>p.amount); }
function outstandingForTeacherBatch(teacherId, batchId){ return Math.max(0, computeEarnedForTeacherBatch(teacherId, batchId) - totalPaidToTeacherForBatch(teacherId, batchId)); }
/* Count relevant to the current user for the sidebar badge — teachers only ever see their OWN pending
   requests (informational; they can't approve), everyone else sees the org-wide pending-approval queue. */
function pendingTeacherPaymentsCountForUser(userId){
  if(isTeacherRole(userId)) return DB.teacherPayments.filter(p=>p.teacher_id===userId && p.status==='pending').length;
  return DB.teacherPayments.filter(p=>p.status==='pending').length;
}
function requestTeacherPayment({teacherId, batchId, type, periodLabel, amount, computedAmount, notes, requestedBy}){
  const rec = {
    id: nextId(DB.teacherPayments), teacher_id: teacherId, batch_id: batchId, type: type||'lump_sum',
    period_label: periodLabel || '', computed_amount: computedAmount||0, amount: Number(amount)||0,
    status: "pending", requested_by: requestedBy||null, requested_date: TODAY,
    approved_by: null, approved_date: null, paid_by: null, paid_date: null, payment_method: null, txn_ref: null,
    voucher_no: generateTeacherPayVoucherNo(), notes: notes||''
  };
  DB.teacherPayments.push(rec);
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:requestedBy, module:"teacher_payment", action:"create", record:`${rec.voucher_no} — ${fmtMoney(rec.amount)} requested for ${userName(teacherId)} (${batchName(batchId)})`, date: TODAY+" "+new Date().toTimeString().slice(0,5) });
  return rec;
}
function approveTeacherPayment(id, approverId){
  const p = DB.teacherPayments.find(x=>x.id===id); if(!p || p.status!=='pending') return null;
  p.status = "approved"; p.approved_by = approverId; p.approved_date = TODAY;
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:approverId, module:"teacher_payment", action:"approve", record:`${p.voucher_no} — ${fmtMoney(p.amount)} approved for ${userName(p.teacher_id)} (${batchName(p.batch_id)})`, date: TODAY+" "+new Date().toTimeString().slice(0,5) });
  return p;
}
function rejectTeacherPayment(id, approverId, reason){
  const p = DB.teacherPayments.find(x=>x.id===id); if(!p || p.status!=='pending') return null;
  p.status = "rejected"; p.approved_by = approverId; p.approved_date = TODAY; p.rejection_reason = reason || 'Not approved';
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:approverId, module:"teacher_payment", action:"reject", record:`${p.voucher_no} — request for ${userName(p.teacher_id)} (${batchName(p.batch_id)}) rejected: ${p.rejection_reason}`, date: TODAY+" "+new Date().toTimeString().slice(0,5) });
  return p;
}
function markTeacherPaymentPaid(id, {paidBy, method, txnRef}){
  const p = DB.teacherPayments.find(x=>x.id===id); if(!p || p.status!=='approved') return null;
  p.status = "paid"; p.paid_by = paidBy||null; p.paid_date = TODAY; p.payment_method = method||'cash'; p.txn_ref = txnRef||null;
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:paidBy, module:"teacher_payment", action:"paid", record:`${p.voucher_no} — ${fmtMoney(p.amount)} disbursed to ${userName(p.teacher_id)} (${batchName(p.batch_id)}) via ${method}`, date: TODAY+" "+new Date().toTimeString().slice(0,5) });
  return p;
}

/* ---------------- Leads & CRM ---------------- */
const LEAD_STATUS_LABELS = {new:'New', contacted:'Contacted', interested:'Interested', visited:'Visited', negotiation:'Negotiation', admitted:'Admitted', lost:'Lost'};
const SOURCE_LABELS = {visit:'Institute Visit', referral:'Referral', 'walk-in':'Walk-in', campaign:'Campaign', online:'Online', online_session:'Online Session/Webinar'};
DB.leads = [
  { id:1, name:"Md. Tanvir Ahmed", phone:"01712340001", email:"tanvir.a@gmail.com", institution_id:1, source:"visit", interested_course_id:1, status:"negotiation", assigned_to:3, created_at:"2026-07-20" },
  { id:2, name:"Sadia Islam", phone:"01712340002", email:"sadia.i@gmail.com", institution_id:1, source:"visit", interested_course_id:2, status:"interested", assigned_to:3, created_at:"2026-07-22" },
  { id:3, name:"Rakibul Hasan", phone:"01712340003", email:null, institution_id:3, source:"walk-in", interested_course_id:1, status:"new", assigned_to:4, created_at:"2026-08-01" },
  { id:4, name:"Nusrat Jahan", phone:"01712340004", email:"nusrat.j@gmail.com", institution_id:2, source:"referral", interested_course_id:3, status:"contacted", assigned_to:4, created_at:"2026-07-30" },
  { id:5, name:"Imran Kabir", phone:"01712340005", email:null, institution_id:4, source:"campaign", interested_course_id:4, status:"visited", assigned_to:9, created_at:"2026-07-18" },
  { id:6, name:"Farzana Akter", phone:"01712340006", email:"farzana.a@gmail.com", institution_id:3, source:"online", interested_course_id:1, status:"admitted", assigned_to:3, created_at:"2026-07-05" },
  { id:7, name:"Jubayer Ahmed", phone:"01712340007", email:null, institution_id:6, source:"visit", interested_course_id:2, status:"lost", lost_reason:"Chose competitor institute (cheaper)", assigned_to:9, created_at:"2026-07-02" },
  { id:8, name:"Mim Sultana", phone:"01712340008", email:"mim.s@gmail.com", institution_id:7, source:"visit", interested_course_id:5, status:"new", assigned_to:3, created_at:"2026-08-02" },
  { id:9, name:"Habibur Rahman", phone:"01712340009", email:null, institution_id:5, source:"referral", interested_course_id:3, status:"contacted", assigned_to:4, created_at:"2026-07-28" },
  { id:10, name:"Taslima Begum", phone:"01712340010", email:"taslima.b@gmail.com", institution_id:1, source:"walk-in", interested_course_id:1, status:"lost", lost_reason:"Financial constraints", assigned_to:3, created_at:"2026-06-28" },
  { id:11, name:"Anisur Rahman", phone:"01712340011", email:null, institution_id:4, source:"visit", interested_course_id:4, status:"visited", assigned_to:9, created_at:"2026-07-26" },
  { id:12, name:"Rumana Sultana", phone:"01712340012", email:"rumana.s@gmail.com", institution_id:2, source:"campaign", interested_course_id:2, status:"interested", assigned_to:4, created_at:"2026-07-31" },
  { id:13, name:"Sohanur Rahman", phone:"01712340013", email:null, institution_id:6, source:"visit", interested_course_id:1, status:"new", assigned_to:9, created_at:"2026-08-03" },
  { id:14, name:"Sharmin Sultana", phone:"01712340014", email:"sharmin.s@gmail.com", institution_id:7, source:"referral", interested_course_id:5, status:"admitted", assigned_to:3, created_at:"2026-07-08" },
];
DB.leadPipeline = ["new","contacted","interested","visited","negotiation","admitted","lost"];

DB.contactHistory = [
  { id:1, lead_id:1, student_id:null, contacted_by:3, type:"visit", notes:"Explained course fee & modules in detail", outcome:"Positive, will decide by next week", date:"2026-07-28 11:20" },
  { id:2, lead_id:1, student_id:null, contacted_by:3, type:"call", notes:"Follow-up call on decision", outcome:"Asked for 5% extra discount", date:"2026-08-02 15:40" },
  { id:3, lead_id:4, student_id:null, contacted_by:4, type:"call", notes:"Introduced course & pricing", outcome:"Requested brochure via email", date:"2026-07-30 10:05" },
  { id:4, lead_id:4, student_id:null, contacted_by:4, type:"email", notes:"Sent brochure and payment plan", outcome:"Awaiting response", date:"2026-07-30 16:00" },
  { id:5, lead_id:6, student_id:1, contacted_by:3, type:"visit", notes:"On-site registration during seminar", outcome:"Registered as lead", date:"2026-07-05 13:00" },
  { id:6, lead_id:6, student_id:1, contacted_by:3, type:"call", notes:"Confirmed admission & payment schedule", outcome:"Admitted", date:"2026-07-12 09:30" },
  { id:7, lead_id:9, student_id:null, contacted_by:4, type:"sms", notes:"Sent reminder SMS about batch start date", outcome:"No response yet", date:"2026-08-01 09:00" },
];

DB.followUps = [
  { id:1, lead_id:1, student_id:null, assigned_to:3, due_date:"2026-08-08 11:00", status:"pending", notes:"Confirm final decision & collect advance payment" },
  { id:2, lead_id:4, student_id:null, assigned_to:4, due_date:"2026-08-07 15:00", status:"pending", notes:"Check on brochure response" },
  { id:3, lead_id:5, student_id:null, assigned_to:9, due_date:"2026-08-05 10:00", status:"pending", notes:"Discuss MOU status with institute" },
  { id:4, lead_id:9, student_id:null, assigned_to:4, due_date:"2026-08-06 12:00", status:"pending", notes:"Follow-up SMS response check" },
  { id:5, lead_id:12, student_id:null, assigned_to:4, due_date:"2026-08-09 14:00", status:"pending", notes:"Discuss institute bulk discount eligibility" },
  { id:6, lead_id:2, student_id:null, assigned_to:3, due_date:"2026-08-01 10:00", status:"done", notes:"Sent revised fee structure" },
  { id:7, lead_id:13, student_id:null, assigned_to:9, due_date:"2026-08-06 16:00", status:"pending", notes:"First intro call after walk-in interest" },
  { id:8, lead_id:3, student_id:null, assigned_to:4, due_date:"2026-08-06 10:30", status:"pending", notes:"Callback on course fee query" },
];

DB.marketingTargets = [
  { user_id:3, month:"2026-08", target:12, achieved:8 },
  { user_id:4, month:"2026-08", target:10, achieved:6 },
  { user_id:9, month:"2026-08", target:8, achieved:3 },
];

/* ---------------- Lead contact logging + status change + follow-up scheduling (single workflow) ----------------
   Whenever a marketer contacts a lead they can, in one step: log what was discussed (type/notes/outcome),
   optionally move the pipeline stage, and optionally schedule the next follow-up (date + note). Scheduling a
   follow-up here is exactly what makes it show up automatically on the "Today's Follow-up" tab once its due
   date arrives — no separate manual step needed. */
function logLeadContact(leadId, opts){
  opts = opts || {};
  const lead = DB.leads.find(l=>l.id===leadId); if(!lead) return null;
  const now = TODAY + " " + new Date().toTimeString().slice(0,5);
  const entry = {
    id: nextId(DB.contactHistory), lead_id: leadId, student_id: lead.student_id||null,
    contacted_by: opts.contactedBy||null, type: opts.type||"call", notes: opts.notes||"", outcome: opts.outcome||"", date: now
  };
  DB.contactHistory.push(entry);

  if(opts.newStatus && opts.newStatus !== lead.status){
    const fromStatus = lead.status;
    lead.status = opts.newStatus;
    if(opts.newStatus==='lost' && opts.lostReason) lead.lost_reason = opts.lostReason;
    DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:opts.contactedBy||null, module:"lead", action:"status_change", record:`${lead.name}: ${LEAD_STATUS_LABELS[fromStatus]} → ${LEAD_STATUS_LABELS[opts.newStatus]}`, date: now });
  }

  let followUp = null;
  if(opts.nextFollowupDate){
    followUp = {
      id: nextId(DB.followUps), lead_id: leadId, student_id: null,
      assigned_to: opts.contactedBy || lead.assigned_to,
      due_date: opts.nextFollowupDate + (opts.nextFollowupTime ? " "+opts.nextFollowupTime : " 10:00"),
      status: "pending", notes: opts.nextFollowupNote || opts.notes || "Follow-up"
    };
    DB.followUps.push(followUp);
  }
  return { entry, followUp };
}

function followupDateOnly(f){ return (f.due_date||'').split(' ')[0]; }
function isFollowupOverdue(f){ return f.status==='pending' && followupDateOnly(f) < TODAY; }
function followupsToday(){ return DB.followUps.filter(f=>f.status==='pending' && followupDateOnly(f)===TODAY); }
function followupsMissed(){ return DB.followUps.filter(f=>isFollowupOverdue(f)); }
function followupsUpcoming(days){ days=days||7; const to=new Date(TODAY); to.setDate(to.getDate()+days); const toStr=to.toISOString().slice(0,10);
  return DB.followUps.filter(f=>f.status==='pending' && followupDateOnly(f)>=TODAY && followupDateOnly(f)<=toStr); }
function followupsAllPending(){ return DB.followUps.filter(f=>f.status==='pending'); }
function followupsDone(){ return DB.followUps.filter(f=>f.status==='done'); }
function followupsInRange(from, to){ return DB.followUps.filter(f=> followupDateOnly(f)>=from && followupDateOnly(f)<=to); }
function markFollowupDone(id, completedBy){
  const f = DB.followUps.find(x=>x.id===id); if(!f) return null;
  f.status='done'; f.completed_by = completedBy||null; f.completed_date = TODAY;
  return f;
}
function leadName(id){ const l=DB.leads.find(x=>x.id===id); return l? l.name : "—"; }
/* Schedules a follow-up without necessarily logging a contact (e.g. "remind me to call back Friday" set
   in advance, before any conversation has happened yet). */
function scheduleFollowup(leadId, dueDate, dueTime, assignedTo, notes){
  const lead = DB.leads.find(l=>l.id===leadId); if(!lead) return null;
  const f = { id: nextId(DB.followUps), lead_id: leadId, student_id: null, assigned_to: assignedTo||lead.assigned_to, due_date: dueDate + (dueTime ? " "+dueTime : " 10:00"), status:"pending", notes: notes||"Follow-up" };
  DB.followUps.push(f);
  return f;
}

/* ================================================================
   BULK LEAD IMPORT (CSV / Excel / pasted spreadsheet data)
   ================================================================
   Marketing comes back from an institute visit or an online session with a spreadsheet of 40-100 names.
   Typing them one by one is the bottleneck this solves. The engine below is deliberately kept free of any
   DOM code so the parse -> map -> validate -> commit pipeline can be unit-tested and reused (the same
   pipeline would work for a student import later).

   Column headers in the wild are never consistent ("Mobile", "Contact No", "Phone Number"), so nothing is
   hard-coded to a fixed column order: the file's own headers are read, auto-matched against the alias lists
   in LEAD_IMPORT_FIELDS, and everything stays re-mappable by the user before anything is written. */

/* ---- Delimited text parsing ---- */
/* Hand-rolled rather than split(',') because exported lead sheets routinely contain quoted commas in
   institution names and embedded newlines in address/notes cells. */
function detectDelimiter(text){
  const firstLine = String(text).split(/\r?\n/).find(l=>l.trim()!=='') || '';
  const counts = { ',':0, '\t':0, ';':0, '|':0 };
  let inQuotes = false;
  for(const ch of firstLine){
    if(ch === '"') inQuotes = !inQuotes;
    else if(!inQuotes && counts[ch] !== undefined) counts[ch]++;
  }
  return Object.keys(counts).reduce((best,k)=> counts[k] > counts[best] ? k : best, ',');
}

function parseDelimitedText(text, delimiter){
  if(text == null) return { headers:[], rows:[], delimiter:',' };
  text = String(text).replace(/^\uFEFF/, '');
  const delim = delimiter || detectDelimiter(text);
  const grid = [];
  let row = [], field = '', inQuotes = false;
  for(let i=0; i<text.length; i++){
    const ch = text[i];
    if(inQuotes){
      if(ch === '"' && text[i+1] === '"'){ field += '"'; i++; }
      else if(ch === '"') inQuotes = false;
      else field += ch;
    } else if(ch === '"'){ inQuotes = true; }
    else if(ch === delim){ row.push(field); field = ''; }
    else if(ch === '\n'){ row.push(field); grid.push(row); row = []; field = ''; }
    else if(ch !== '\r'){ field += ch; }
  }
  row.push(field); grid.push(row);

  const cleaned = grid.filter(r => r.some(c => String(c).trim() !== ''));
  if(!cleaned.length) return { headers:[], rows:[], delimiter:delim };

  /* Duplicate/blank headers get suffixed so they stay addressable as object keys. */
  const used = {};
  const headers = cleaned[0].map((h, i) => {
    let name = String(h).trim() || `Column ${i+1}`;
    if(used[name] !== undefined){ used[name]++; name = `${name} (${used[name]})`; } else used[name] = 1;
    return name;
  });
  const rows = cleaned.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i] !== undefined ? String(r[i]).trim() : ''; });
    return o;
  });
  return { headers, rows, delimiter:delim };
}

/* ---- Value resolvers: turn free text from a spreadsheet into real system values ---- */
function normalizePhone(v){ return String(v==null?'':v).replace(/[^\d]/g, '').replace(/^88/, ''); }
function normalizeKey(v){ return String(v==null?'':v).trim().toLowerCase().replace(/[^a-z0-9]/g, ''); }

/* Matches on exact name first, then a contains-match, so "Dhaka Polytechnic" finds
   "Dhaka Polytechnic Institute" without forcing the user to type the full legal name. */
function resolveByName(list, raw, labelOf){
  const key = normalizeKey(raw);
  if(!key) return null;
  const exact = list.find(x => normalizeKey(labelOf(x)) === key);
  if(exact) return exact;
  return list.find(x => { const l = normalizeKey(labelOf(x)); return l.includes(key) || key.includes(l); }) || null;
}

function resolveInstitutionId(raw){
  const hit = resolveByName(DB.institutions, raw, i=>i.name);
  if(hit) return { value: hit.id };
  const short = DB.institutions.find(i => normalizeKey(i.short_name||'') === normalizeKey(raw));
  if(short) return { value: short.id };
  return { value: null, warning: `Institution "${raw}" not found — will import without an institution` };
}
function resolveCourseId(raw){
  const hit = resolveByName(DB.courses, raw, c=>c.name);
  if(hit) return { value: hit.id };
  const byCode = DB.courses.find(c => normalizeKey(c.code||'') === normalizeKey(raw));
  if(byCode) return { value: byCode.id };
  return { value: null, warning: `Course "${raw}" not found — will import without a course` };
}
function resolveAssigneeId(raw){
  const hit = resolveByName(DB.users, raw, u=>u.name);
  if(hit) return { value: hit.id };
  return { value: null, warning: `Staff "${raw}" not found — will fall back to the importing user` };
}
function resolveLeadSource(raw){
  const key = normalizeKey(raw);
  const byKey = Object.keys(SOURCE_LABELS).find(k => normalizeKey(k) === key);
  if(byKey) return { value: byKey };
  const byLabel = Object.keys(SOURCE_LABELS).find(k => normalizeKey(SOURCE_LABELS[k]) === key);
  if(byLabel) return { value: byLabel };
  const partial = Object.keys(SOURCE_LABELS).find(k => normalizeKey(SOURCE_LABELS[k]).includes(key) && key.length>2);
  if(partial) return { value: partial };
  return { value: 'visit', warning: `Source "${raw}" not recognised — defaulted to Institute Visit` };
}
function resolveLeadStatus(raw){
  const key = normalizeKey(raw);
  const byKey = DB.leadPipeline.find(s => normalizeKey(s) === key);
  if(byKey) return { value: byKey };
  const byLabel = DB.leadPipeline.find(s => normalizeKey(LEAD_STATUS_LABELS[s]) === key);
  if(byLabel) return { value: byLabel };
  return { value: 'new', warning: `Status "${raw}" not recognised — defaulted to New` };
}
/* Accepts ISO, day-first and month-first slash/dash dates, plus raw Excel serial numbers (which is what
   you get when a date column survives an .xlsx -> CSV round trip). */
function resolveImportDate(raw){
  const s = String(raw).trim();
  if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)){
    const [y,m,d] = s.split('-').map(Number);
    return { value: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` };
  }
  const slash = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if(slash){
    let [, a, b, y] = slash;
    a = Number(a); b = Number(b); y = Number(y);
    if(y < 100) y += 2000;
    /* Day-first unless the first part can only be a month. */
    const day = a > 12 ? a : (b > 12 ? b : a);
    const mon = a > 12 ? b : (b > 12 ? a : b);
    if(mon >= 1 && mon <= 12 && day >= 1 && day <= 31){
      return { value: `${y}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}` };
    }
  }
  if(/^\d{5}$/.test(s)){
    const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400000);
    return { value: d.toISOString().slice(0,10) };
  }
  return { value: TODAY, warning: `Date "${raw}" not understood — used today's date` };
}
function resolveEmail(raw){
  const s = String(raw).trim();
  if(!s) return { value: null };
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { value: s, warning: `"${s}" doesn't look like a valid email` };
  return { value: s };
}
/* BD mobile numbers are 11 digits, 01[3-9] + 8 more. Sheets routinely lose the leading zero to number
   formatting, so that case is repaired silently; anything else is imported as-is but flagged, since a
   wrong number is worth importing (the name is still useful) but not worth silently trusting. */
function resolvePhone(raw){
  let digits = normalizePhone(raw);
  if(!digits) return { value: null };
  if(digits.length === 10 && /^1[3-9]/.test(digits)) digits = '0' + digits;
  if(!/^01[3-9]\d{8}$/.test(digits)){
    return { value: digits, warning: `Phone "${raw}" isn't a valid 11-digit mobile number (${digits.length} digits)` };
  }
  return { value: digits };
}

/* ---- Field catalogue ----
   The single source of truth for the whole import UI: the mapping dropdowns, the fixed-value pickers, the
   preview columns and the per-column include toggles are all generated from this list, so adding a future
   lead field means adding one entry here and nothing else. */
const LEAD_IMPORT_FIELDS = [
  { key:'name', label:'Full Name', required:true, type:'text',
    aliases:['name','fullname','full name','lead name','student name','candidate name','candidate','participant'] },
  { key:'phone', label:'Phone', required:true, type:'phone', resolve:resolvePhone,
    aliases:['phone','mobile','contact','contactno','contact no','contact number','phone number','mobile number','cell','msisdn','whatsapp'] },
  { key:'email', label:'Email', type:'email', resolve:resolveEmail,
    aliases:['email','e mail','mail','email address','emailid'] },
  { key:'institution_id', label:'Institution', type:'lookup', resolve:resolveInstitutionId,
    aliases:['institution','institute','college','polytechnic','school','campus','organization'],
    options:()=>DB.institutions.map(i=>({ value:i.id, label:i.name })) },
  { key:'interested_course_id', label:'Interested Course', type:'lookup', resolve:resolveCourseId,
    aliases:['course','interested course','program','programme','subject','trade','technology','interest'],
    options:()=>DB.courses.map(c=>({ value:c.id, label:c.name })) },
  { key:'source', label:'Source', type:'enum', resolve:resolveLeadSource, default:'visit',
    aliases:['source','lead source','channel','origin','camefrom','came from'],
    options:()=>Object.keys(SOURCE_LABELS).map(k=>({ value:k, label:SOURCE_LABELS[k] })) },
  { key:'status', label:'Pipeline Status', type:'enum', resolve:resolveLeadStatus, default:'new',
    aliases:['status','stage','pipeline','pipelinestage','lead status'],
    options:()=>DB.leadPipeline.map(s=>({ value:s, label:LEAD_STATUS_LABELS[s] })) },
  { key:'assigned_to', label:'Assigned To', type:'lookup', resolve:resolveAssigneeId,
    aliases:['assignedto','assigned to','assignee','owner','marketing officer','officer','staff','responsible'],
    options:()=>DB.users.filter(u=>u.status==='active').map(u=>({ value:u.id, label:u.name })) },
  { key:'created_at', label:'Captured On', type:'date', resolve:resolveImportDate,
    aliases:['date','created','createdat','created at','captured on','capturedon','lead date','entry date','visit date'] },
];

function leadImportField(key){ return LEAD_IMPORT_FIELDS.find(f=>f.key===key) || null; }
function leadImportFieldOptions(key){ const f = leadImportField(key); return f && f.options ? f.options() : []; }

/* Renders a stored system value back into something human-readable for the preview grid. */
function leadImportDisplayValue(key, value){
  if(value === null || value === undefined || value === '') return '—';
  const f = leadImportField(key);
  if(f && f.options){
    const hit = f.options().find(o => String(o.value) === String(value));
    return hit ? hit.label : String(value);
  }
  return String(value);
}

/* ---- Auto-mapping ---- */
/* Scores each header against a field's aliases: exact alias match wins, then containment, so a column
   called "Student Mobile No." still lands on `phone` without user intervention. */
function scoreHeaderAgainstField(header, field){
  const h = normalizeKey(header);
  if(!h) return 0;
  if(h === normalizeKey(field.key) || h === normalizeKey(field.label)) return 100;
  for(const a of field.aliases){
    const na = normalizeKey(a);
    if(h === na) return 90;
  }
  for(const a of field.aliases){
    const na = normalizeKey(a);
    if(na.length >= 4 && (h.includes(na) || na.includes(h))) return 60;
  }
  return 0;
}

function autoMapColumns(headers){
  const mapping = {};
  const taken = new Set();
  /* Best global match first so a sheet with both "Name" and "Institution Name" doesn't give
     "Institution Name" to the `name` field just because it appears first. */
  const pairs = [];
  headers.forEach(h => LEAD_IMPORT_FIELDS.forEach(f => {
    const score = scoreHeaderAgainstField(h, f);
    if(score > 0) pairs.push({ header:h, key:f.key, score });
  }));
  pairs.sort((a,b) => b.score - a.score);
  pairs.forEach(p => {
    if(mapping[p.key] || taken.has(p.header)) return;
    mapping[p.key] = p.header;
    taken.add(p.header);
  });
  return mapping;
}

/* ---- Validation / preview ---- */
/* mapping      : { fieldKey: sourceColumnName }  — value read from the file, per row
   fixedValues  : { fieldKey: systemValue }       — one value applied to every row (the common case for a
                                                    single institute visit: same institution, source, owner)
   File mapping always wins over a fixed value when both are set for a field. */
function buildLeadImportPreview(rawRows, mapping, fixedValues, opts){
  mapping = mapping || {}; fixedValues = fixedValues || {}; opts = opts || {};
  const fallbackAssignee = opts.assignedTo || null;
  const existingPhones = new Set(DB.leads.map(l => normalizePhone(l.phone)).filter(Boolean));
  const seenInFile = new Set();

  const rows = (rawRows||[]).map((raw, idx) => {
    const values = {}, issues = [];

    LEAD_IMPORT_FIELDS.forEach(f => {
      const col = mapping[f.key];
      const fromFile = col && raw[col] !== undefined && String(raw[col]).trim() !== '';
      if(fromFile){
        const out = f.resolve ? f.resolve(String(raw[col]).trim()) : { value: String(raw[col]).trim() };
        values[f.key] = out.value;
        if(out.warning) issues.push({ level:'warn', field:f.key, text:out.warning });
      } else if(fixedValues[f.key] !== undefined && fixedValues[f.key] !== '' && fixedValues[f.key] !== null){
        /* Already a system value — it came from a picker built off field.options, so no resolving. */
        const fv = fixedValues[f.key];
        values[f.key] = (f.type === 'lookup' || f.key === 'assigned_to') ? Number(fv) : fv;
      } else {
        values[f.key] = f.default !== undefined ? f.default : null;
      }
      if(f.required && (values[f.key] === null || values[f.key] === '')){
        issues.push({ level:'error', field:f.key, text:`${f.label} is required` });
      }
    });

    if(values.created_at == null) values.created_at = TODAY;
    if(values.assigned_to == null) values.assigned_to = fallbackAssignee;

    const phoneKey = normalizePhone(values.phone);
    let duplicate = false;
    if(phoneKey){
      if(existingPhones.has(phoneKey)){
        duplicate = true;
        issues.push({ level:'dup', field:'phone', text:'This phone already exists in Leads' });
      } else if(seenInFile.has(phoneKey)){
        duplicate = true;
        issues.push({ level:'dup', field:'phone', text:'Duplicate phone earlier in this file' });
      }
      seenInFile.add(phoneKey);
    }

    const hasError = issues.some(i => i.level === 'error');
    const status = hasError ? 'error' : (duplicate ? 'duplicate' : (issues.length ? 'warn' : 'ready'));
    return {
      rowNo: idx + 1, raw, values, issues, status,
      /* Errored and duplicate rows start unticked but stay togglable — the operator may know a repeated
         phone is a genuinely different person (shared family number is common here). */
      include: !hasError && !duplicate
    };
  });

  return { rows, summary: leadImportSummary(rows) };
}

function leadImportSummary(rows){
  return {
    total: rows.length,
    ready: rows.filter(r => r.status === 'ready').length,
    warn: rows.filter(r => r.status === 'warn').length,
    duplicate: rows.filter(r => r.status === 'duplicate').length,
    error: rows.filter(r => r.status === 'error').length,
    selected: rows.filter(r => r.include).length
  };
}

/* Recomputes required-field errors, duplicate detection and row status from the values as they currently
   stand, rather than from the original file. Needed because the preview grid is editable: fixing an
   unmatched institution or a typo'd phone in place has to move that row out of the error/duplicate bucket
   immediately, and can equally push a different row into it. Resolver warnings raised at parse time are
   preserved; the edit handler clears the ones belonging to a field the user has since corrected. */
function revalidateLeadImportPreview(preview){
  if(!preview) return preview;
  const existingPhones = new Set(DB.leads.map(l => normalizePhone(l.phone)).filter(Boolean));
  const seen = new Set();

  preview.rows.forEach(r => {
    const wasBlocked = r.status === 'error';
    const issues = r.issues.filter(i => i.level === 'warn');

    LEAD_IMPORT_FIELDS.forEach(f => {
      if(f.required && (r.values[f.key] === null || r.values[f.key] === '')){
        issues.push({ level:'error', field:f.key, text:`${f.label} is required` });
      }
    });

    const phoneKey = normalizePhone(r.values.phone);
    let duplicate = false;
    if(phoneKey){
      if(existingPhones.has(phoneKey)){
        duplicate = true;
        issues.push({ level:'dup', field:'phone', text:'This phone already exists in Leads' });
      } else if(seen.has(phoneKey)){
        duplicate = true;
        issues.push({ level:'dup', field:'phone', text:'Duplicate phone earlier in this file' });
      }
      seen.add(phoneKey);
    }

    r.issues = issues;
    const hasError = issues.some(i => i.level === 'error');
    r.status = hasError ? 'error' : (duplicate ? 'duplicate' : (issues.length ? 'warn' : 'ready'));
    /* A row that still can't be written must not stay ticked. Conversely, someone who just repaired a
       blocked row did so because they want it in, so it rejoins the selection automatically. */
    if(hasError) r.include = false;
    else if(wasBlocked) r.include = !duplicate;
  });

  preview.summary = leadImportSummary(preview.rows);
  return preview;
}

/* ---- Commit ---- */
/* fieldKeys = the columns the user left ticked on the preview. Unticked optional fields fall back to the
   field default rather than being written as the imported (but rejected) value. */
function importLeads(previewRows, fieldKeys, importedBy, meta){
  meta = meta || {};
  const keys = fieldKeys && fieldKeys.length ? fieldKeys : LEAD_IMPORT_FIELDS.map(f=>f.key);
  const created = [];
  (previewRows||[]).forEach(r => {
    if(!r.include || r.status === 'error') return;
    const lead = {
      id: nextId(DB.leads),
      name: r.values.name,
      phone: r.values.phone,
      email: keys.includes('email') ? (r.values.email || null) : null,
      institution_id: keys.includes('institution_id') ? (r.values.institution_id || null) : null,
      source: keys.includes('source') ? (r.values.source || 'visit') : 'visit',
      source_session_id: meta.sourceSessionId || null,
      interested_course_id: keys.includes('interested_course_id') ? (r.values.interested_course_id || null) : null,
      status: keys.includes('status') ? (r.values.status || 'new') : 'new',
      assigned_to: keys.includes('assigned_to') ? (r.values.assigned_to || importedBy || null) : (importedBy || null),
      created_at: keys.includes('created_at') ? (r.values.created_at || TODAY) : TODAY,
      imported: true,
      import_batch: meta.batchRef || null
    };
    DB.leads.push(lead);
    created.push(lead);
  });

  if(created.length){
    DB.auditLogs.push({
      id: nextId(DB.auditLogs), user_id: importedBy || null, module:"lead", action:"import",
      record: `Bulk import — ${created.length} lead(s) added from ${meta.fileName || 'pasted data'}${meta.skipped ? ` (${meta.skipped} row(s) skipped)` : ''}`,
      date: TODAY + " " + new Date().toTimeString().slice(0,5)
    });
  }
  return created;
}

/* Template the user can download, fill in and re-upload — headers deliberately match the alias lists so a
   round-tripped template auto-maps with zero manual work. */
function leadImportTemplateCsv(){
  const headers = ['Full Name','Phone','Email','Institution','Interested Course','Source','Pipeline Status','Assigned To','Captured On'];
  const sample = [
    ['Md. Karim Hossain','01712345678','karim@example.com', DB.institutions[0]?.name||'Dhaka Polytechnic Institute', DB.courses[0]?.name||'', 'Institute Visit','New', DB.users.find(u=>u.role_id===3)?.name||'', TODAY],
    ['Ayesha Siddiqua','01812345679','','', DB.courses[1]?.name||'', 'Online','Contacted','', '']
  ];
  const esc = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
  return [headers, ...sample].map(r => r.map(esc).join(',')).join('\n');
}

/* ---------------- Online Sessions / Webinars (marketing outreach to polytechnic students) ----------------
   Separate from physical Institution Visits — these are online webinars/live sessions (Zoom/Meet/Facebook Live)
   run for a target polytechnic's students to promote courses. Tracked here so marketing can see attendance and
   how many leads each session produced. */
DB.onlineSessions = [
  { id:1, title:"Industrial Attachment Career Talk — DPI 4th Semester", institution_id:1, platform:"zoom", host_id:3, date:"2026-07-18", time:"15:00", duration_mins:60, meeting_link:"https://zoom.us/j/1234567890", status:"completed", registered_count:52, attended_count:41, leads_generated:9, notes:"Very engaged Q&A — 9 leads captured via post-session form." },
  { id:2, title:"Why Industrial Attachment Matters — RPI Webinar", institution_id:2, platform:"google_meet", host_id:4, date:"2026-07-25", time:"16:00", duration_mins:45, meeting_link:"https://meet.google.com/abc-defg-hij", status:"completed", registered_count:38, attended_count:29, leads_generated:5, notes:"Good turnout despite exam week." },
  { id:3, title:"PLC & Industrial Electrical Career Session", institution_id:5, platform:"facebook_live", host_id:3, date:"2026-08-10", time:"14:00", duration_mins:60, meeting_link:"https://fb.me/live/maktech", status:"scheduled", registered_count:18, attended_count:0, leads_generated:0, notes:"" },
  { id:4, title:"Open Career Counselling — All Polytechnics", institution_id:null, platform:"zoom", host_id:9, date:"2026-08-14", time:"11:00", duration_mins:90, meeting_link:"https://zoom.us/j/9988776655", status:"scheduled", registered_count:31, attended_count:0, leads_generated:0, notes:"Public invite via SMS + Facebook ad." },
  { id:5, title:"CNC & RAC Attachment Info Session — KPI", institution_id:7, platform:"google_meet", host_id:4, date:"2026-06-30", time:"15:30", duration_mins:50, meeting_link:"https://meet.google.com/xyz-uvwx-rst", status:"cancelled", registered_count:12, attended_count:0, leads_generated:0, notes:"Cancelled — institute exam schedule clash, will reschedule." },
];
const ONLINE_SESSION_PLATFORM_LABELS = { zoom:"Zoom", google_meet:"Google Meet", facebook_live:"Facebook Live", youtube_live:"YouTube Live", ms_teams:"MS Teams" };
function upcomingOnlineSessions(){ return DB.onlineSessions.filter(s=>s.status==='scheduled').sort((a,b)=> a.date<b.date?-1:1); }
function pastOnlineSessions(){ return DB.onlineSessions.filter(s=>s.status!=='scheduled').sort((a,b)=> a.date<b.date?1:-1); }
function completeOnlineSession(id, {attendedCount, leadsGenerated, notes}){
  const s = DB.onlineSessions.find(x=>x.id===id); if(!s) return null;
  s.status = 'completed'; s.attended_count = Number(attendedCount)||0; s.leads_generated = Number(leadsGenerated)||0;
  if(notes) s.notes = notes;
  return s;
}
function onlineSessionName(id){ const s=DB.onlineSessions.find(x=>x.id===id); return s? s.title : "—"; }

/* ---------------- Students ---------------- */
/* NOTE ON ENROLLMENT RULE: a student is normally enrolled in exactly ONE course + ONE batch (type:"primary").
   Admin can still add extra enrollments for a student — those are tagged type:"additional" and carry
   added_by / added_reason / added_date so there is a clear audit trail / history of why the rule was overridden. */
DB.students = [
  { id:1, code:"MT-2026-0001", name:"Farzana Akter", dob:"2005-03-14", gender:"Female", nid:"1234567890123", phone:"01712340006", email:"farzana.a@gmail.com",
    present_address:"Mirpur-10, Dhaka", permanent_address:"Bogura Sadar, Bogura", photo:null, institution_id:3, roll:"171233", passing_year:"2025",
    guardian_name:"Abdul Jabbar", guardian_relation:"Father", guardian_phone:"01812340006", status:"active", profile_completed:true, lead_id:6, created_by:3,
    courses:[{course_id:1, batch_id:1, enrolled_price:16200, discount:1800, date:"2026-06-01", status:"active", type:"primary"}],
    documents:[{type:"photo",name:"photo.jpg"},{type:"nid",name:"nid_scan.pdf"},{type:"certificate",name:"ssc_certificate.pdf"}] },
  { id:2, code:"MT-2026-0002", name:"Sharmin Sultana", dob:"2004-11-02", gender:"Female", nid:"2234567890123", phone:"01712340014", email:"sharmin.s@gmail.com",
    present_address:"Khulna City", permanent_address:"Khulna City", photo:null, institution_id:7, roll:"KH-9981", passing_year:"2025",
    guardian_name:"Rezaul Karim", guardian_relation:"Father", guardian_phone:"01812340014", status:"active", profile_completed:true, lead_id:14, created_by:8,
    courses:[{course_id:5, batch_id:5, enrolled_price:16000, discount:0, date:"2026-07-05", status:"active", type:"primary"}],
    documents:[{type:"photo",name:"photo.jpg"},{type:"nid",name:"nid_scan.pdf"}] },
  { id:3, code:"MT-2026-0003", name:"Rezwan Karim", dob:"2004-06-19", gender:"Male", nid:"3234567890123", phone:"01812221001", email:"rezwan.k@gmail.com",
    present_address:"Tejgaon, Dhaka", permanent_address:"Tangail Sadar", photo:null, institution_id:1, roll:"DPI-4471", passing_year:"2024",
    guardian_name:"Karim Uddin", guardian_relation:"Father", guardian_phone:"01912221001", status:"completed", profile_completed:true, lead_id:null, created_by:8,
    courses:[{course_id:1, batch_id:6, enrolled_price:16200, discount:1800, date:"2026-01-10", status:"completed", type:"primary"}],
    documents:[{type:"photo",name:"photo.jpg"},{type:"nid",name:"nid_scan.pdf"},{type:"certificate",name:"hsc_certificate.pdf"}] },
  { id:4, code:"MT-2026-0004", name:"Nusrat Jahan Mim", dob:"2005-01-25", gender:"Female", nid:"4234567890123", phone:"01812221002", email:"nusrat.mim@gmail.com",
    present_address:"Mohammadpur, Dhaka", permanent_address:"Rajshahi Sadar", photo:null, institution_id:2, roll:"RPI-2291", passing_year:"2025",
    guardian_name:"Aminul Islam", guardian_relation:"Father", guardian_phone:"01912221002", status:"active", profile_completed:false, lead_id:null, created_by:8,
    courses:[{course_id:2, batch_id:2, enrolled_price:13500, discount:1500, date:"2026-06-10", status:"active", type:"primary"}],
    documents:[{type:"photo",name:"photo.jpg"}] },
  { id:5, code:"MT-2026-0005", name:"Shahriar Kabir", dob:"2003-09-09", gender:"Male", nid:"5234567890123", phone:"01812221003", email:null,
    present_address:"Chattogram City", permanent_address:"Chattogram City", photo:null, institution_id:4, roll:"CPI-8821", passing_year:"2024",
    guardian_name:"Kabir Hossain", guardian_relation:"Father", guardian_phone:"01912221003", status:"on_hold", profile_completed:true, lead_id:null, created_by:8,
    courses:[{course_id:4, batch_id:4, enrolled_price:10200, discount:1800, date:"2026-07-01", status:"active", type:"primary"}],
    documents:[{type:"photo",name:"photo.jpg"},{type:"nid",name:"nid_scan.pdf"}] },
  { id:6, code:"MT-2026-0006", name:"Ahnaf Tahmid", dob:"2004-12-30", gender:"Male", nid:"6234567890123", phone:"01812221004", email:"ahnaf.t@gmail.com",
    present_address:"Uttara, Dhaka", permanent_address:"Bogura Sadar", photo:null, institution_id:5, roll:"BPI-1102", passing_year:"2025",
    guardian_name:"Tahmid Hasan", guardian_relation:"Father", guardian_phone:"01912221004", status:"active", profile_completed:true, lead_id:null, created_by:6,
    courses:[
      {course_id:3, batch_id:3, enrolled_price:20000, discount:0, date:"2026-05-15", status:"active", type:"primary"},
      {course_id:5, batch_id:5, enrolled_price:16000, discount:0, date:"2026-07-20", status:"active", type:"additional", added_by:2, added_reason:"Student requested a second skill-set (RAC) alongside PLC; approved as a special case by Admin.", added_date:"2026-07-20"}
    ],
    documents:[{type:"photo",name:"photo.jpg"},{type:"nid",name:"nid_scan.pdf"},{type:"certificate",name:"diploma.pdf"}] },
  { id:7, code:"MT-2026-0007", name:"Ismat Ara", dob:"2005-05-05", gender:"Female", nid:"7234567890123", phone:"01812221005", email:"ismat.a@gmail.com",
    present_address:"Ideal School Rd, Dhaka", permanent_address:"Faridpur Sadar", photo:null, institution_id:3, roll:"IPI-3341", passing_year:"2025",
    guardian_name:"Ara Begum", guardian_relation:"Mother", guardian_phone:"01912221005", status:"dropped", profile_completed:true, lead_id:null, created_by:8,
    courses:[{course_id:1, batch_id:1, enrolled_price:16200, discount:1800, date:"2026-06-01", status:"dropped", type:"primary"}],
    documents:[{type:"photo",name:"photo.jpg"}] },
  { id:8, code:"MT-2026-0008", name:"Golam Mostafa", dob:"2003-02-17", gender:"Male", nid:"8234567890123", phone:"01812221006", email:null,
    present_address:"Khulna City", permanent_address:"Khulna City", photo:null, institution_id:7, roll:"KPI-7723", passing_year:"2024",
    guardian_name:"Mostafa Kamal", guardian_relation:"Father", guardian_phone:"01912221006", status:"certified", profile_completed:true, lead_id:null, created_by:6,
    courses:[{course_id:5, batch_id:5, enrolled_price:16000, discount:0, date:"2026-01-05", status:"completed", type:"primary"}],
    documents:[{type:"photo",name:"photo.jpg"},{type:"nid",name:"nid_scan.pdf"}] },
];
function studentName(id){ const s=DB.students.find(x=>x.id===id); return s? s.name : "—"; }
function studentById(id){ return DB.students.find(x=>x.id===id); }
function institutionName(id){ const i=DB.institutions.find(x=>x.id===id); return i? i.name : "—"; }
const STUDENT_STATUS_LABELS = {prospect:'Prospect', admitted:'Admitted', active:'Active', on_hold:'On Hold', completed:'Completed', certified:'Certified', dropped:'Dropped'};
function primaryEnrollment(student){ return student.courses.find(c=>c.type==='primary') || student.courses[0]; }
function additionalEnrollments(student){ return student.courses.filter(c=>c.type==='additional'); }

/* Manual student status change — gated behind Students.ChangeStatus permission (see app.js action handlers). */
function changeStudentStatus(studentId, newStatus, reason, changedBy){
  const s = studentById(studentId); if(!s || !STUDENT_STATUS_LABELS[newStatus]) return null;
  const old = s.status;
  if(old===newStatus) return s;
  s.status = newStatus;
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:changedBy||null, module:"student", action:"status_change",
    record:`${s.name} (${s.code}): ${STUDENT_STATUS_LABELS[old]} → ${STUDENT_STATUS_LABELS[newStatus]}${reason?' — '+reason:''}`,
    date: TODAY+" "+new Date().toTimeString().slice(0,5) });
  return s;
}

DB.moduleProgress = [
  { student_id:1, module_id:1, status:"completed" }, { student_id:1, module_id:2, status:"in_progress" }, { student_id:1, module_id:3, status:"not_started" }, { student_id:1, module_id:4, status:"not_started" },
  { student_id:6, module_id:9, status:"completed" }, { student_id:6, module_id:10, status:"in_progress" }, { student_id:6, module_id:11, status:"not_started" }, { student_id:6, module_id:12, status:"not_started" },
  { student_id:3, module_id:1, status:"completed" }, { student_id:3, module_id:2, status:"completed" }, { student_id:3, module_id:3, status:"completed" }, { student_id:3, module_id:4, status:"completed" },
];

/* ============================================================
   Attendance — real, session-based marking & persisted records.
   Every class actually "held" for a batch creates one attendanceSession row (batch + date + module);
   every student in that batch then gets one attendanceRecord row against that session (present/absent/
   late/excused). All percentages below are ALWAYS derived live from these two arrays — nothing is
   hardcoded — so marking attendance immediately updates every report, dashboard KPI, and the student's
   own portal view.
   ============================================================ */
DB.attendanceSessions = [];
DB.attendanceRecords = [];

/* All students ever linked to this batch (includes dropped — their attendance history up to the drop date
   is still meaningful for reports). Use activeStudentsInBatch() below when marking NEW attendance. */
function studentsInBatch(batchId){
  return DB.students.filter(s => s.courses.some(c => c.batch_id===batchId));
}
function activeStudentsInBatch(batchId){
  return DB.students.filter(s => s.courses.some(c => c.batch_id===batchId && c.status==='active'));
}

/* Seeds believable historical attendance so the prototype isn't empty on first load — each student is
   nudged toward a target attendance rate (roughly matching what the demo used to show) purely for realism;
   all subsequent marking uses the real markAttendance() function below. */
(function seedAttendanceHistory(){
  const targetPct = { 1:94, 7:53, 6:95, 4:87, 5:60, 2:80, 3:98, 8:91 };
  const SESSION_COUNT = 12;
  DB.batches.filter(b=>b.status!=='upcoming').forEach(batch=>{
    const course = DB.courses.find(c=>c.id===batch.course_id);
    const moduleIds = course && course.modules.length ? course.modules.map(m=>m.id) : [null];
    const endAnchor = batch.status==='completed' ? batch.end : TODAY;
    const dates = [];
    let cursor = new Date(endAnchor);
    for(let i=0;i<SESSION_COUNT;i++){
      dates.unshift(cursor.toISOString().slice(0,10));
      cursor.setDate(cursor.getDate() - (i%2===0?2:3));
    }
    const roster = studentsInBatch(batch.id);
    dates.forEach((date, di)=>{
      const sess = { id: nextId(DB.attendanceSessions), batch_id: batch.id, date, module_id: moduleIds[di % moduleIds.length], marked_by: (batch.assigned_teachers&&batch.assigned_teachers[0]) || batch.coordinator_id || null, created_at: date };
      DB.attendanceSessions.push(sess);
      roster.forEach(s=>{
        const pct = targetPct[s.id] ?? 85;
        const seed = (s.id*31 + sess.id*17 + di*7) % 100; // deterministic so history is stable across reloads
        let status;
        if(seed < pct) status = 'present';
        else if(seed < pct + 6) status = 'late';
        else if(seed < pct + 10) status = 'excused';
        else status = 'absent';
        DB.attendanceRecords.push({ id: nextId(DB.attendanceRecords), session_id: sess.id, student_id: s.id, status });
      });
    });
  });
})();

function attendanceSessionsForBatch(batchId){ return DB.attendanceSessions.filter(s=>s.batch_id===batchId).sort((a,b)=> a.date<b.date?-1:1); }
function findAttendanceSession(batchId, date, moduleId){ return DB.attendanceSessions.find(s=>s.batch_id===batchId && s.date===date && s.module_id===(moduleId||null)); }
function attendanceRecordsForSession(sessionId){ return DB.attendanceRecords.filter(r=>r.session_id===sessionId); }

/* Creates the session row if needed, then upserts one record per student. `marksMap` is {studentId: status}. */
function markAttendance(batchId, date, moduleId, marksMap, markedBy){
  let sess = findAttendanceSession(batchId, date, moduleId||null);
  if(!sess){ sess = { id: nextId(DB.attendanceSessions), batch_id:batchId, date, module_id: moduleId||null, marked_by: markedBy||null, created_at: date }; DB.attendanceSessions.push(sess); }
  else sess.marked_by = markedBy || sess.marked_by;
  Object.entries(marksMap||{}).forEach(([sid,status])=>{
    sid = Number(sid);
    let rec = DB.attendanceRecords.find(r=>r.session_id===sess.id && r.student_id===sid);
    if(rec) rec.status = status; else DB.attendanceRecords.push({ id: nextId(DB.attendanceRecords), session_id: sess.id, student_id: sid, status });
  });
  return sess;
}

function attendanceRecordsForStudent(studentId, batchId){
  return DB.attendanceRecords.filter(r=>r.student_id===studentId)
    .map(r=>({ ...r, session: DB.attendanceSessions.find(s=>s.id===r.session_id) }))
    .filter(r=> r.session && (!batchId || r.session.batch_id===batchId))
    .sort((a,b)=> a.session.date<b.session.date?1:-1);
}
/* present + late both count as "attended"; excused sessions are removed from the denominator entirely
   (they don't help or hurt %); absent counts against the student. */
function attendanceStats(records){
  const present = records.filter(r=>r.status==='present').length;
  const late = records.filter(r=>r.status==='late').length;
  const absent = records.filter(r=>r.status==='absent').length;
  const excused = records.filter(r=>r.status==='excused').length;
  const effectiveTotal = present + late + absent;
  const attended = present + late;
  const pct = effectiveTotal>0 ? Math.round(attended/effectiveTotal*100) : 0;
  return { present, late, absent, excused, total: records.length, effectiveTotal, attended, pct };
}
function attendanceSummaryForStudent(studentId, batchId){ return attendanceStats(attendanceRecordsForStudent(studentId, batchId)); }
function attendanceSummaryForBatch(batchId){
  const roster = studentsInBatch(batchId);
  const rows = roster.map(s => ({ student: s, ...attendanceSummaryForStudent(s.id, batchId) }));
  const avgPct = rows.length ? Math.round(sum(rows, r=>r.pct)/rows.length) : 0;
  return { rows, avgPct, sessionsHeld: attendanceSessionsForBatch(batchId).length };
}
function allBatchAttendanceSummaries(batchIds){
  const ids = batchIds || DB.batches.map(b=>b.id);
  return ids.map(id => ({ batch: DB.batches.find(b=>b.id===id), ...attendanceSummaryForBatch(id) })).filter(x=>x.batch && x.sessionsHeld>0);
}
function lowAttendanceStudents(threshold, batchIds){
  threshold = threshold || 70;
  const ids = batchIds || DB.batches.map(b=>b.id);
  const out = [];
  ids.forEach(bid=>{
    studentsInBatch(bid).forEach(s=>{
      const st = attendanceSummaryForStudent(s.id, bid);
      if(st.effectiveTotal>0 && st.pct<threshold) out.push({ student:s, batch: DB.batches.find(b=>b.id===bid), ...st });
    });
  });
  return out;
}

/* ---------------- Payments & Accounting ---------------- */
DB.feeInvoices = [
  { id:1, student_id:1, student_course_idx:0, invoice_no:"INV-2026-0001", total:16200, paid:16200, due:0, due_date:"2026-06-15", status:"paid" },
  { id:2, student_id:2, student_course_idx:0, invoice_no:"INV-2026-0002", total:16000, paid:8000, due:8000, due_date:"2026-08-10", status:"partial" },
  { id:3, student_id:3, student_course_idx:0, invoice_no:"INV-2026-0003", total:16200, paid:16200, due:0, due_date:"2026-01-25", status:"paid" },
  { id:4, student_id:4, student_course_idx:0, invoice_no:"INV-2026-0004", total:13500, paid:5000, due:8500, due_date:"2026-07-20", status:"overdue" },
  { id:5, student_id:5, student_course_idx:0, invoice_no:"INV-2026-0005", total:10200, paid:3000, due:7200, due_date:"2026-07-10", status:"overdue" },
  { id:6, student_id:6, student_course_idx:0, invoice_no:"INV-2026-0006", total:20000, paid:12000, due:8000, due_date:"2026-08-20", status:"partial" },
  { id:7, student_id:7, student_course_idx:0, invoice_no:"INV-2026-0007", total:16200, paid:4000, due:12200, due_date:"2026-06-20", status:"overdue" },
  { id:8, student_id:8, student_course_idx:0, invoice_no:"INV-2026-0008", total:16000, paid:16000, due:0, due_date:"2026-01-15", status:"paid" },
];
function invoiceForStudent(sid){ return DB.feeInvoices.find(x=>x.student_id===sid); }

/* Manual invoice status override — gated behind Payments.ChangeStatus permission. Meant for corrections /
   write-offs / cancellations; normal collections should go through recordPayment() instead. */
const INVOICE_STATUSES = ['due','partial','paid','overdue','cancelled'];
function changeInvoiceStatus(invoiceId, newStatus, reason, changedBy){
  const inv = DB.feeInvoices.find(x=>x.id===invoiceId); if(!inv || !INVOICE_STATUSES.includes(newStatus)) return null;
  const old = inv.status;
  if(old===newStatus) return inv;
  if(newStatus==='paid'){ inv.paid = inv.total; inv.due = 0; }
  else if(newStatus==='cancelled'){ inv.due = 0; }
  inv.status = newStatus;
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:changedBy||null, module:"payment", action:"status_change",
    record:`Invoice ${inv.invoice_no}: ${old} → ${newStatus}${reason?' — '+reason:''}`,
    date: TODAY+" "+new Date().toTimeString().slice(0,5) });
  return inv;
}

DB.paymentInstallments = [
  { id:1, invoice_id:2, no:1, amount:8000, due_date:"2026-06-10", status:"paid" },
  { id:2, invoice_id:2, no:2, amount:8000, due_date:"2026-08-10", status:"pending" },
  { id:3, invoice_id:4, no:1, amount:5000, due_date:"2026-06-10", status:"paid" },
  { id:4, invoice_id:4, no:2, amount:8500, due_date:"2026-07-20", status:"overdue" },
  { id:5, invoice_id:6, no:1, amount:12000, due_date:"2026-05-15", status:"paid" },
  { id:6, invoice_id:6, no:2, amount:8000, due_date:"2026-08-20", status:"pending" },
];

DB.payments = [
  { id:1, invoice_id:1, student_id:1, amount:14400, method:"cash", channel:"physical", collected_by:5, receipt_no:"RCT-1001", date:"2026-06-01 10:15", status:"success" },
  { id:2, invoice_id:1, student_id:1, amount:1800, method:"bkash", channel:"online", gateway_txn_id:"BKS29281JX", receipt_no:"RCT-1002", date:"2026-06-15 18:40", status:"success" },
  { id:3, invoice_id:2, student_id:2, amount:8000, method:"cash", channel:"physical", collected_by:5, receipt_no:"RCT-1003", date:"2026-07-05 11:00", status:"success" },
  { id:4, invoice_id:3, student_id:3, amount:16200, method:"bank", channel:"physical", collected_by:5, receipt_no:"RCT-1004", date:"2026-01-10 09:30", status:"success" },
  { id:5, invoice_id:4, student_id:4, amount:5000, method:"nagad", channel:"online", gateway_txn_id:"NGD11238KP", receipt_no:"RCT-1005", date:"2026-06-10 14:20", status:"success" },
  { id:6, invoice_id:5, student_id:5, amount:3000, method:"cash", channel:"physical", collected_by:5, receipt_no:"RCT-1006", date:"2026-07-01 09:00", status:"success" },
  { id:7, invoice_id:6, student_id:6, amount:12000, method:"cheque", channel:"physical", collected_by:5, receipt_no:"RCT-1007", date:"2026-05-15 12:10", status:"success" },
  { id:8, invoice_id:7, student_id:7, amount:4000, method:"cash", channel:"physical", collected_by:5, receipt_no:"RCT-1008", date:"2026-06-01 10:45", status:"success" },
  { id:9, invoice_id:8, student_id:8, amount:16000, method:"rocket", channel:"online", gateway_txn_id:"RKT77281AA", receipt_no:"RCT-1009", date:"2026-01-05 16:00", status:"success" },
  { id:10, invoice_id:2, student_id:2, amount:2000, method:"card", channel:"online", gateway_txn_id:"SSL99182BX", receipt_no:"RCT-1010", date:"2026-08-01 20:11", status:"pending" },
];

DB.refunds = [
  { id:1, payment_id:8, amount:2000, reason:"Student dropped mid-course, partial refund per policy", approved_by:2, status:"approved", date:"2026-07-01" },
  { id:2, payment_id:6, amount:1000, reason:"Overpayment correction", approved_by:2, status:"requested", date:"2026-08-02" },
];

DB.courseMigrations = [
  { id:1, student_id:5, from_course_id:4, to_course_id:5, requested_by:"student", reason:"Prefers mechanical/RAC track over civil", old_paid:3000, new_price:16000, migration_fee:1000, net_adjustment:12000, status:"requested", date:"2026-08-02" },
  { id:2, student_id:2, from_course_id:2, to_course_id:1, requested_by:"staff", reason:"Batch capacity issue, moved to available course", old_paid:8000, new_price:16200, migration_fee:500, net_adjustment:7700, status:"approved", approved_by:2, date:"2026-07-20" },
];

/* ---------------- Discounts given log ---------------- */
DB.discountsGiven = [
  { id:1, student_id:1, course_id:1, amount:1800, given_by:8, reason:"Early bird discount", date:"2026-06-01" },
  { id:2, student_id:3, course_id:1, amount:1800, given_by:8, reason:"Early bird discount", date:"2026-01-10" },
  { id:3, student_id:4, course_id:2, amount:1500, given_by:8, reason:"Institute bulk deal (RPI)", date:"2026-06-10" },
  { id:4, student_id:5, course_id:4, amount:1800, given_by:6, reason:"Referral discount", date:"2026-07-01" },
];

/* ---------------- Self-enrollment requests (Student Portal → pending Admin approval) ----------------
   Flow: a student self-registers a portal account, browses courses, picks a Session + Batch, then either
   (a) pays online now → enrollment + invoice created immediately, no approval needed, or
   (b) "Enroll without payment" → a request is queued here; Admin/Manager approves or rejects it. On approval
       the enrollment + a DUE invoice are created for the student (they can then pay online later or in person). */
DB.enrollmentRequests = [
  { id:1, student_id:4, course_id:1, session_id:1, batch_id:1, payment_option:"pay_later", status:"pending", requested_date:"2026-08-04", reviewed_by:null, reviewed_date:null, note:"Wants to add Web & App Development alongside her current course — needs Admin review as a second enrollment." },
  { id:2, student_id:7, course_id:5, session_id:6, batch_id:5, payment_option:"pay_later", status:"pending", requested_date:"2026-08-05", reviewed_by:null, reviewed_date:null, note:"" },
  { id:3, student_id:8, course_id:1, session_id:1, batch_id:1, payment_option:"pay_later", status:"approved", requested_date:"2026-07-28", reviewed_by:2, reviewed_date:"2026-07-29", note:"" },
];
function nextId(arr){ return (arr.length ? Math.max(...arr.map(x=>x.id)) : 0) + 1; }
function generateStudentCode(){ return "MT-2026-" + String(DB.students.length+1).padStart(4,'0'); }
function generateInvoiceNo(){ return "INV-2026-" + String(DB.feeInvoices.length+1).padStart(4,'0'); }
function generateReceiptNo(){ return "RCT-" + (1000 + DB.payments.length + 1); }
function daysBetween(dateA, dateB){ return Math.round((new Date(dateA) - new Date(dateB)) / (1000*3600*24)); }

/* Creates the student-side enrollment record + a matching fee invoice. `paidNow` (boolean) decides whether
   the invoice is created fully paid (online instant payment) or fully due (pending-approval / pay-later). */
function createEnrollment(student, courseId, batchId, opts){
  opts = opts || {};
  const course = DB.courses.find(c=>c.id===courseId);
  const price = course ? course.base_price : 0;
  const discount = opts.discount || 0;
  const enrolledPrice = Math.max(0, price - discount);
  const type = student.courses.some(c=>c.type==='primary') ? 'additional' : 'primary';
  const enrollment = { course_id:courseId, batch_id:batchId, enrolled_price:enrolledPrice, discount, date:TODAY, status:"active", type };
  if(type==='additional'){ enrollment.added_by = opts.addedBy ?? null; enrollment.added_reason = opts.reason || 'Approved additional enrollment.'; enrollment.added_date = TODAY; }
  student.courses.push(enrollment);
  if(student.status==='prospect') student.status = 'active';

  let dueDate = opts.dueDate;
  if(!dueDate){ const d = new Date(TODAY); d.setDate(d.getDate() + (opts.paidNow ? 0 : 14)); dueDate = d.toISOString().slice(0,10); }
  const invoice = {
    id: nextId(DB.feeInvoices), student_id: student.id, student_course_idx: student.courses.length-1,
    invoice_no: generateInvoiceNo(), total: enrolledPrice, paid: 0, due: enrolledPrice,
    due_date: dueDate, status: (dueDate > TODAY ? "due" : "overdue")
  };
  DB.feeInvoices.push(invoice);

  let payment = null;
  if(opts.paidNow && enrolledPrice>0){
    payment = recordPayment(student.id, invoice.id, enrolledPrice, opts.method||'bkash', 'online', null, { gatewayTxnId: 'TXN'+Math.floor(Math.random()*90000000+10000000) });
  }
  return { enrollment, invoice, payment };
}

/* Records a payment against an invoice (used by: student online pay, accountant manual/cash collection,
   and admin-approved due settlement). Always generates a receipt-ready payment row. */
function recordPayment(studentId, invoiceId, amount, method, channel, collectedBy, extra){
  extra = extra || {};
  const inv = DB.feeInvoices.find(i=>i.id===invoiceId);
  const payment = {
    id: nextId(DB.payments), invoice_id: invoiceId, student_id: studentId, amount: Number(amount)||0,
    method: method||'cash', channel: channel||'physical',
    collected_by: channel==='physical' ? (collectedBy||null) : null,
    gateway_txn_id: channel==='online' ? (extra.gatewayTxnId || null) : undefined,
    receipt_no: generateReceiptNo(), date: TODAY + " " + new Date().toTimeString().slice(0,5), status: "success"
  };
  DB.payments.push(payment);
  if(inv){
    inv.paid = Math.min(inv.total, inv.paid + payment.amount);
    inv.due = Math.max(0, inv.total - inv.paid);
    inv.status = inv.due<=0 ? "paid" : (inv.paid>0 ? "partial" : "overdue");
  }
  return payment;
}

function applyDiscountToInvoice(invoiceId, amount, reason, givenBy){
  const inv = DB.feeInvoices.find(i=>i.id===invoiceId); if(!inv) return null;
  amount = Math.min(amount, inv.due);
  inv.total = Math.max(0, inv.total - amount);
  inv.due = Math.max(0, inv.due - amount);
  inv.status = inv.due<=0 ? "paid" : (inv.paid>0 ? "partial" : "overdue");
  DB.discountsGiven.push({ id: nextId(DB.discountsGiven), student_id: inv.student_id, course_id: studentById(inv.student_id)?.courses[inv.student_course_idx]?.course_id, amount, given_by: givenBy, reason, date: TODAY });
  return inv;
}

/* Self-registration — creates a bare student account (no course yet) so a visitor can sign up, then
   browse courses and self-enroll. Institution/roll/etc. can be completed later via the profile screen. */
function selfRegisterStudent({name, phone, email}){
  const student = {
    id: nextId(DB.students), code: generateStudentCode(), name, dob:"", gender:"", nid:"", phone, email: email||null,
    present_address:"", permanent_address:"", photo:null, institution_id:null, roll:"", passing_year:"",
    guardian_name:"", guardian_relation:"", guardian_phone:"", status:"prospect", profile_completed:false,
    lead_id:null, created_by:null, courses:[], documents:[]
  };
  DB.students.push(student);
  return student;
}

/* Staff-assisted registration (Students → Register Student form) — creates the student record AND their
   primary enrollment + invoice in one go. Capacity should already have been checked by the caller via
   canEnrollInBatch() before calling this, so the batch's lab-capacity limit is never bypassed. */
function registerStudentWithEnrollment({name, dob, gender, nid, phone, email, presentAddress, permanentAddress, institutionId, roll, guardianName, guardianPhone, courseId, batchId}){
  const student = {
    id: nextId(DB.students), code: generateStudentCode(), name, dob:dob||"", gender:gender||"", nid:nid||"", phone,
    email: email||null, present_address:presentAddress||"", permanent_address:permanentAddress||"", photo:null,
    institution_id: institutionId?Number(institutionId):null, roll:roll||"", passing_year:"",
    guardian_name:guardianName||"", guardian_relation:"", guardian_phone:guardianPhone||"", status:"active",
    profile_completed:true, lead_id:null, created_by:null, courses:[], documents:[]
  };
  DB.students.push(student);
  const { enrollment, invoice } = createEnrollment(student, Number(courseId), Number(batchId), { paidNow:false });
  return { student, enrollment, invoice };
}

function pendingEnrollmentRequest(studentId){ return DB.enrollmentRequests.find(r=>r.student_id===studentId && r.status==='pending'); }

function approveEnrollmentRequest(reqId, approverId){
  const req = DB.enrollmentRequests.find(r=>r.id===reqId); if(!req || req.status!=='pending') return null;
  const student = studentById(req.student_id); if(!student) return null;
  const { invoice } = createEnrollment(student, req.course_id, req.batch_id, { paidNow:false, addedBy:approverId, reason:"Self-enrollment request approved by "+userName(approverId) });
  req.status = "approved"; req.reviewed_by = approverId; req.reviewed_date = TODAY;
  DB.notifications.push({ id:nextId(DB.notifications), recipient:student.name, type:"enrollment_approved", channel:"sms", message:`Your enrollment in ${courseName(req.course_id)} is approved. Amount due: ${fmtMoney(invoice.due)} by ${fmtDate(invoice.due_date)}.`, status:"sent", date: TODAY+" 10:00" });
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:approverId, module:"student", action:"approve", record:`Enrollment request #${reqId} — ${student.name} → ${courseName(req.course_id)}`, date: TODAY+" 10:00" });
  return invoice;
}
function rejectEnrollmentRequest(reqId, approverId, reason){
  const req = DB.enrollmentRequests.find(r=>r.id===reqId); if(!req || req.status!=='pending') return null;
  req.status = "rejected"; req.reviewed_by = approverId; req.reviewed_date = TODAY; req.note = reason || req.note;
  const student = studentById(req.student_id);
  if(student) DB.notifications.push({ id:nextId(DB.notifications), recipient:student.name, type:"enrollment_rejected", channel:"sms", message:`Your enrollment request for ${courseName(req.course_id)} was not approved. ${reason?('Reason: '+reason):'Please contact the office for details.'}`, status:"sent", date: TODAY+" 10:00" });
  return req;
}

/* ---------------- Due-payment tab/date-range + 7-day follow-up (auto-SMS) helpers ---------------- */
function invoiceDaysUntilDue(inv){ return daysBetween(inv.due_date, TODAY); } // negative = overdue
function duesToday(){ return DB.feeInvoices.filter(i=>i.due>0 && invoiceDaysUntilDue(i)<=0); }
function duesAll(){ return DB.feeInvoices.filter(i=>i.due>0); }
function duesInRange(from, to){ return DB.feeInvoices.filter(i=>i.due>0 && i.due_date>=from && i.due_date<=to); }
function duesFollowupWindow(){ return DB.feeInvoices.filter(i=>i.due>0 && invoiceDaysUntilDue(i)<=7); } // due within the next 7 days, or already overdue

/* Idempotent — ensures every invoice inside the follow-up window has at least one auto-SMS logged for today. */
function ensureFollowupSmsSent(){
  duesFollowupWindow().forEach(inv=>{
    const student = studentById(inv.student_id); if(!student) return;
    const already = DB.notifications.find(n=>n.type==='payment_due_followup' && n.invoice_id===inv.id && (n.date||'').startsWith(TODAY));
    if(!already){
      DB.notifications.push({ id:nextId(DB.notifications), recipient:student.name, invoice_id:inv.id, student_id:student.id, type:"payment_due_followup", channel:"sms", message:`Dear ${student.name}, your payment of ${fmtMoney(inv.due)} is due on ${fmtDate(inv.due_date)}. Please pay at your earliest convenience.`, status: student.phone ? "sent" : "failed", date: TODAY+" 09:00" });
    }
  });
}
function followupNotificationsFor(invoiceId){ return DB.notifications.filter(n=>n.type==='payment_due_followup' && n.invoice_id===invoiceId); }
function resendFollowupSms(invoiceId){
  const inv = DB.feeInvoices.find(i=>i.id===invoiceId); if(!inv) return null;
  const student = studentById(inv.student_id); if(!student) return null;
  const n = { id:nextId(DB.notifications), recipient:student.name, invoice_id:inv.id, student_id:student.id, type:"payment_due_followup", channel:"sms", message:`Reminder: your payment of ${fmtMoney(inv.due)} is due on ${fmtDate(inv.due_date)}. Please pay soon to avoid late charges.`, status:"sent", date: TODAY+" "+new Date().toTimeString().slice(0,5) };
  DB.notifications.push(n);
  return n;
}

/* ============================================================
   Cash Management — chain of custody for physical cash collected by accountants.
   Every CASH (method:"cash", channel:"physical") payment received must eventually be either:
     (a) deposited into the bank (with a bank-issued deposit slip number), or
     (b) physically handed over to a senior staff member ("Boss"/Managing Director or Admin), who must
         confirm receipt with a typed digital signature before the handover is considered settled.
   This is the standard internal-control an auditor expects: cash never just "disappears" between the
   moment it's collected at the counter and the moment it's either banked or handed to someone senior.
   ============================================================ */
function cashCustodians(){ return DB.users.filter(u=>u.cash_custodian && u.status==='active'); }

DB.cashHandovers = [
  { id:1, type:"bank_deposit", date:"2026-06-02", amount:14400, payment_ids:[1], created_by:5,
    bank_name:"Dutch-Bangla Bank Ltd.", account_no:"1051-2200-9911", branch:"Dhanmondi Branch", slip_no:"DBBL-88213X",
    receipt_no:"CD-2026-0001", status:"confirmed", notes:"" },
  { id:2, type:"handover", date:"2026-07-05", amount:8000, payment_ids:[3], created_by:5, handed_to:2,
    receipt_no:"CD-2026-0002", status:"confirmed", confirmed_by:2, confirmed_signature:"Nasrin Akter", confirmed_date:"2026-07-05", notes:"End-of-day cash handover" },
  { id:3, type:"bank_deposit", date:"2026-07-01", amount:3000, payment_ids:[6], created_by:5,
    bank_name:"Dutch-Bangla Bank Ltd.", account_no:"1051-2200-9911", branch:"Dhanmondi Branch", slip_no:"DBBL-77102A",
    receipt_no:"CD-2026-0003", status:"confirmed", notes:"" },
  { id:4, type:"handover", date:"2026-08-01", amount:4000, payment_ids:[8], created_by:5, handed_to:11,
    receipt_no:"CD-2026-0004", status:"pending", notes:"Handed over at end of day — awaiting MD signature" },
];
function generateCashReceiptNo(){ return "CD-2026-" + String(DB.cashHandovers.length+1).padStart(4,'0'); }

/* Every cash payment id that has ever been placed into a deposit/handover entry (pending or confirmed) is
   considered "out of the accountant's hand" already — that's what removes it from the undeposited list. */
function coveredCashPaymentIds(){ return new Set(DB.cashHandovers.flatMap(h=>h.payment_ids||[])); }
function undepositedCashPayments(){
  const covered = coveredCashPaymentIds();
  return DB.payments.filter(p=>p.method==='cash' && p.channel==='physical' && p.status==='success' && !covered.has(p.id));
}
function cashInHandTotal(){ return sum(undepositedCashPayments(), p=>p.amount); }
function cashCollectedInRange(from, to){
  return sum(DB.payments.filter(p=>p.method==='cash' && p.channel==='physical' && p.status==='success' && (p.date||'').slice(0,10)>=from && (p.date||'').slice(0,10)<=to), p=>p.amount);
}
function cashCollectedToday(){ return cashCollectedInRange(TODAY, TODAY); }
function cashHandoversInRange(from, to){ return DB.cashHandovers.filter(h=>h.date>=from && h.date<=to); }
function cashHandoversToday(){ return cashHandoversInRange(TODAY, TODAY); }
function cashHandoversThisMonth(){ return cashHandoversInRange(TODAY.slice(0,7)+"-01", TODAY); }
function cashHandoverPayments(h){ return DB.payments.filter(p=>(h.payment_ids||[]).includes(p.id)); }

/* Bank deposits are considered settled immediately — the bank-issued slip number IS the proof of deposit.
   Handovers to a person start "pending" and need that person (or an authorized approver) to sign. */
function createCashHandover({type, paymentIds, createdBy, bankName, accountNo, branch, slipNo, handedTo, notes, attachment}){
  const ids = (paymentIds||[]).map(Number);
  const amount = sum(DB.payments.filter(p=>ids.includes(p.id)), p=>p.amount);
  const entry = {
    id: nextId(DB.cashHandovers), type, date: TODAY, amount, payment_ids: ids, created_by: createdBy,
    receipt_no: generateCashReceiptNo(), notes: notes||"",
    status: type==='bank_deposit' ? "confirmed" : "pending",
    attachment: attachment || null,
  };
  if(type==='bank_deposit'){ entry.bank_name = bankName; entry.account_no = accountNo; entry.branch = branch; entry.slip_no = slipNo; }
  else { entry.handed_to = handedTo; }
  DB.cashHandovers.push(entry);
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:createdBy, module:"cash_management", action:"create",
    record:`${entry.receipt_no} — ${type==='bank_deposit'?'Bank deposit ('+slipNo+')':'Handover to '+userName(handedTo)} of ${fmtMoney(amount)} covering ${ids.length} cash receipt(s)`,
    date: TODAY+" "+new Date().toTimeString().slice(0,5) });
  return entry;
}
function confirmCashHandover(id, confirmedBy, signatureName){
  const h = DB.cashHandovers.find(x=>x.id===id); if(!h || h.status==='confirmed') return null;
  h.status = "confirmed"; h.confirmed_by = confirmedBy; h.confirmed_signature = signatureName; h.confirmed_date = TODAY;
  DB.auditLogs.push({ id:nextId(DB.auditLogs), user_id:confirmedBy, module:"cash_management", action:"approve",
    record:`${h.receipt_no} — cash handover of ${fmtMoney(h.amount)} signed & confirmed received by "${signatureName}"`, date: TODAY+" "+new Date().toTimeString().slice(0,5) });
  return h;
}

/* ---------------- Expenses ---------------- */
DB.expenseCategories = ["Event Cost","Tour Cost","Student Facility Cost","Marketing Cost","Admin/Operational Cost","Vendor Payment"];
DB.vendors = [
  { id:1, name:"Prime Print & Packaging", phone:"01711556677", email:"sales@primeprint.bd", terms:"Net 15" },
  { id:2, name:"Dhaka Catering Services", phone:"01911223344", email:"info@dhk-catering.bd", terms:"Advance 50%" },
  { id:3, name:"Swift Transport Co.", phone:"01611998877", email:"booking@swifttransport.bd", terms:"Net 7" },
  { id:4, name:"TechMart Supplies", phone:"01522334455", email:"sales@techmart.bd", terms:"Net 30" },
];
DB.expenses = [
  { id:1, category:"Event Cost", title:"Career Counselling Seminar — Ideal Polytechnic", amount:22000, batch_id:null, vendor_id:2, expense_date:"2026-07-22", approved_by:2, status:"paid", created_by:3 },
  { id:2, category:"Tour Cost", title:"Industrial Visit — Batch-26-A (Factory Tour)", amount:35000, batch_id:1, vendor_id:3, expense_date:"2026-07-15", approved_by:2, status:"paid", created_by:6 },
  { id:3, category:"Student Facility Cost", title:"Lab Materials — Batch-26-C (PLC Kits)", amount:48000, batch_id:3, vendor_id:4, expense_date:"2026-06-20", approved_by:2, status:"paid", created_by:6 },
  { id:4, category:"Marketing Cost", title:"Bulk SMS Campaign — August Admission Drive", amount:6000, batch_id:null, vendor_id:null, expense_date:"2026-08-01", approved_by:2, status:"approved", created_by:3 },
  { id:5, category:"Admin/Operational Cost", title:"Office Internet & Utility Bill — July", amount:14500, batch_id:null, vendor_id:null, expense_date:"2026-07-31", approved_by:2, status:"paid", created_by:5 },
  { id:6, category:"Vendor Payment", title:"ID Card Printing — 60 units", amount:9600, batch_id:null, vendor_id:1, expense_date:"2026-07-28", approved_by:null, status:"pending", created_by:8 },
  { id:7, category:"Event Cost", title:"Certificate Award Ceremony — Batch-25-Z", amount:28000, batch_id:6, vendor_id:2, expense_date:"2026-04-15", approved_by:2, status:"paid", created_by:2 },
  { id:8, category:"Student Facility Cost", title:"AutoCAD Software Licenses — Batch-26-D", amount:18000, batch_id:4, vendor_id:4, expense_date:"2026-07-05", approved_by:2, status:"paid", created_by:6 },
];

/* ---------------- Certificates & ID Cards ---------------- */
DB.certificates = [
  { id:1, student_id:3, course_id:1, cert_no:"MT-CERT-2026-0001", issue_date:"2026-04-20", status:"issued" },
  { id:2, student_id:8, course_id:5, cert_no:"MT-CERT-2026-0002", issue_date:"2026-01-25", status:"issued" },
  { id:3, student_id:1, course_id:1, cert_no:null, issue_date:null, status:"pending" },
];
DB.idCards = [
  { id:1, student_id:1, card_no:"MT-ID-0001", issue_date:"2026-06-02", valid_till:"2026-12-31", status:"active" },
  { id:2, student_id:2, card_no:"MT-ID-0002", issue_date:"2026-07-06", valid_till:"2027-01-31", status:"active" },
  { id:3, student_id:3, card_no:"MT-ID-0003", issue_date:"2026-01-11", valid_till:"2026-05-11", status:"expired" },
  { id:4, student_id:6, card_no:"MT-ID-0004", issue_date:"2026-05-16", valid_till:"2026-12-31", status:"active" },
];

/* ---------------- Notifications ---------------- */
DB.notifications = [
  { id:1, recipient:"Farzana Akter", type:"due_payment_reminder", channel:"sms", message:"Your next installment of ৳8,000 is due on 10 Aug 2026.", status:"sent", date:"2026-08-03 09:00" },
  { id:2, recipient:"Nusrat Jahan Mim", type:"due_payment_overdue", channel:"sms", message:"Your payment of ৳8,500 is overdue. Please pay at earliest.", status:"sent", date:"2026-07-21 09:00" },
  { id:3, recipient:"Shahriar Kabir", type:"document_missing", channel:"email", message:"Please upload your NID copy to complete your profile.", status:"failed", date:"2026-08-02 09:00" },
  { id:4, recipient:"Rezwan Karim", type:"certificate_ready", channel:"portal", message:"Your certificate for Web & App Development is ready to download.", status:"sent", date:"2026-04-20 12:00" },
  { id:5, recipient:"Shakil Ahmed", type:"follow_up_reminder", channel:"portal", message:"Follow-up due for lead Md. Tanvir Ahmed today.", status:"sent", date:"2026-08-06 08:00" },
  { id:6, recipient:"Ahnaf Tahmid", type:"class_reminder", channel:"sms", message:"Reminder: PLC Programming class today at 3:00 PM, Workshop-A.", status:"sent", date:"2026-08-06 08:30" },
];
DB.notificationRules = [
  { id:1, trigger:"payment_due_in_3_days", channel:"sms", template:"Dear {{name}}, your payment of ৳{{amount}} is due on {{due_date}}.", active:true },
  { id:2, trigger:"payment_overdue", channel:"sms+email", template:"Dear {{name}}, your payment of ৳{{amount}} is overdue since {{due_date}}. Please pay immediately.", active:true },
  { id:3, trigger:"class_reminder_1hr_before", channel:"sms", template:"Reminder: {{course}} class today at {{time}}, {{room}}.", active:true },
  { id:4, trigger:"follow_up_due", channel:"portal", template:"Follow-up due for {{lead_name}} today.", active:true },
  { id:5, trigger:"document_missing_7days", channel:"email", template:"Please complete your profile by uploading missing documents.", active:false },
  { id:6, trigger:"certificate_ready", channel:"portal+sms", template:"Your certificate for {{course}} is ready to download.", active:true },
  { id:7, trigger:"migration_status_change", channel:"portal", template:"Your course migration request has been {{status}}.", active:true },
];

/* ---------------- Audit Log ---------------- */
DB.auditLogs = [
  { id:1, user_id:5, module:"payment", action:"create", record:"INV-2026-0001", date:"2026-06-01 10:15" },
  { id:2, user_id:2, module:"discount", action:"approve", record:"Student #4 - 10% discount", date:"2026-06-10 09:40" },
  { id:3, user_id:6, module:"student", action:"update", record:"MT-2026-0004 profile", date:"2026-07-15 14:12" },
  { id:4, user_id:2, module:"refund", action:"approve", record:"Refund #1", date:"2026-07-01 11:00" },
  { id:5, user_id:1, module:"user", action:"create", record:"User #10 - Abu Sayed", date:"2026-06-25 10:00" },
  { id:6, user_id:2, module:"migration", action:"approve", record:"Migration #2", date:"2026-07-20 16:30" },
  { id:7, user_id:5, module:"expense", action:"create", record:"EXP-0006 ID Card Printing", date:"2026-07-28 13:00" },
  { id:8, user_id:1, module:"settings", action:"update", record:"SMS Gateway Config", date:"2026-06-15 09:00" },
  { id:9, user_id:2, module:"student", action:"approve", record:"Additional course override — Ahnaf Tahmid (MT-2026-0006)", date:"2026-07-20 11:00" },
  { id:10, user_id:2, module:"access_control", action:"update", record:"Assigned Sumaiya Islam to Batch-26-D as teacher", date:"2026-07-18 10:00" },
];

/* ---------------- Helper aggregate / KPI functions ---------------- */
function fmtMoney(n){ return "৳" + Number(n||0).toLocaleString('en-IN'); }
function fmtDate(d){ if(!d) return "—"; const dt = new Date(d); if(isNaN(dt)) return d; return dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function sum(arr, fn){ return arr.reduce((a,x)=>a+fn(x),0); }

const KPI = {
  totalStudents: () => DB.students.length,
  activeStudents: () => DB.students.filter(s=>s.status==='active').length,
  totalLeads: () => DB.leads.length,
  conversionRate: () => Math.round(DB.leads.filter(l=>l.status==='admitted').length / DB.leads.length * 100),
  totalRevenue: () => sum(DB.payments.filter(p=>p.status==='success'), p=>p.amount),
  totalDue: () => sum(DB.feeInvoices, i=>i.due),
  totalExpense: () => sum(DB.expenses.filter(e=>e.status==='paid'), e=>e.amount),
  avgAttendance: () => { const s = allBatchAttendanceSummaries(); return s.length ? Math.round(sum(s, b=>b.avgPct) / s.length) : 0; },
  upcomingClasses: () => DB.classSchedule.filter(c=>c.date>='2026-08-06').length,
  expiringInstallments: () => DB.paymentInstallments.filter(i=>i.status==='pending' || i.status==='overdue').length,
  teacherPaymentsPendingApproval: () => DB.teacherPayments.filter(p=>p.status==='pending').length,
  teacherPaymentsAwaitingDisbursement: () => DB.teacherPayments.filter(p=>p.status==='approved').length,
  teacherPaymentsPaidYTD: () => sum(DB.teacherPayments.filter(p=>p.status==='paid'), p=>p.amount),
  teacherPayablesOutstanding: () => sum(teacherBatchPairs(), pair => outstandingForTeacherBatch(pair.teacher_id, pair.batch_id)),
};
