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

DB.permModules = ["Institutions","Leads/CRM","Courses","Students","Batches","Attendance","Payments","CashManagement","Expenses","Certificates","Reports","Notifications","Users","Audit","Settings"];
DB.permActions = ["View","Create","Edit","Delete","Approve"];
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
seedPerm(3,"Leads/CRM",["View","Create","Edit"]); seedPerm(3,"Institutions",["View","Create","Edit"]); seedPerm(3,"Reports",["View"]);
seedPerm(4,"Payments",["View","Create","Edit","Approve"]); seedPerm(4,"CashManagement",["View","Create","Edit"]); seedPerm(4,"Expenses",["View","Create","Edit","Approve"]); seedPerm(4,"Reports",["View"]); seedPerm(4,"Students",["View"]);
seedPerm(5,"Batches",["View","Edit"]); seedPerm(5,"Attendance",["View","Create","Edit"]); seedPerm(5,"Students",["View"]); seedPerm(5,"Courses",["View"]);
seedPerm(6,"Students",["View","Create","Edit"]); seedPerm(6,"Courses",["View"]);
seedPerm(7,"Reports",["View"]); seedPerm(7,"Audit",["View"]); DB.permModules.forEach(m=> seedPerm(7,m,["View"]));
// Managing Director/Boss — oversight + the one who signs for cash handed over from Accountants; deliberately
// does NOT get Create on CashManagement (separation of duties: the person who receives cash shouldn't also
// be the one logging the collection) but CAN Approve (= sign/confirm receipt) and view Payments/Reports.
seedPerm(8,"CashManagement",["View","Approve"]); seedPerm(8,"Payments",["View"]); seedPerm(8,"Expenses",["View","Approve"]); seedPerm(8,"Reports",["View"]); seedPerm(8,"Students",["View"]);

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

/* ---------------- Batches / Class Schedule ---------------- */
DB.batches = [
  { id:1, session_id:1, course_id:1, name:"Batch-26-A", start:"2026-06-01", end:"2026-08-30", coordinator_id:6, assigned_teachers:[6], capacity:40, enrolled:34, status:"ongoing", room:"Lab-1" },
  { id:2, session_id:3, course_id:2, name:"Batch-26-B", start:"2026-06-10", end:"2026-08-24", coordinator_id:7, assigned_teachers:[7], capacity:35, enrolled:28, status:"ongoing", room:"Lab-2" },
  { id:3, session_id:4, course_id:3, name:"Batch-26-C", start:"2026-05-15", end:"2026-08-13", coordinator_id:6, assigned_teachers:[6,7], capacity:30, enrolled:22, status:"ongoing", room:"Workshop-A" },
  { id:4, session_id:5, course_id:4, name:"Batch-26-D", start:"2026-07-01", end:"2026-08-30", coordinator_id:7, assigned_teachers:[7], capacity:35, enrolled:19, status:"ongoing", room:"Drafting Hall" },
  { id:5, session_id:6, course_id:5, name:"Batch-26-E", start:"2026-07-05", end:"2026-09-18", coordinator_id:6, assigned_teachers:[6], capacity:25, enrolled:15, status:"upcoming", room:"Workshop-B" },
  { id:6, session_id:2, course_id:1, name:"Batch-25-Z", start:"2026-01-10", end:"2026-04-10", coordinator_id:6, assigned_teachers:[6], capacity:40, enrolled:38, status:"completed", room:"Lab-1" },
];
function batchName(id){ const b=DB.batches.find(x=>x.id===id); return b? b.name : "—"; }

/* ---------------- Teacher/coordinator scoping helpers ---------------- */
function isTeacherRole(userId){ const u=DB.users.find(x=>x.id===userId); return u && u.role_id===5; }
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
};
