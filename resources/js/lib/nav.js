/* Sidebar structure and page titles — ported from NAV and VIEWS in the prototype's app.js.
   `id` doubles as the URL segment under /admin, so `leads` renders at /admin/leads. */

import { DB, followupsToday, pendingTeacherPaymentsCountForUser, upcomingOnlineSessions } from './db';

export const NAV = [
    {
        id: 'grp-dashboard', label: 'Dashboard', ic: 'dashboard', items: [
            { id: 'dashboard', label: 'Dashboard', ic: 'dashboard', mod: null },
        ],
    },
    {
        id: 'grp-crm', label: 'CRM & Marketing', ic: 'marketing', items: [
            { id: 'institutions', label: 'Institutions', ic: 'institution', mod: 'Institutions' },
            { id: 'leads', label: 'Leads', ic: 'marketing', mod: 'Leads/CRM', count: () => DB.leads.length },
            { id: 'pipeline', label: 'Pipeline', ic: 'target', mod: 'Leads/CRM' },
            { id: 'visits', label: 'Institution Visits', ic: 'institution', mod: 'Leads/CRM' },
            { id: 'online-sessions', label: 'Online Sessions', ic: 'send', mod: 'Leads/CRM', count: () => upcomingOnlineSessions().length },
            { id: 'followups', label: 'Follow-ups', ic: 'clock', mod: 'Leads/CRM', count: () => followupsToday().length },
        ],
    },
    {
        id: 'grp-courses', label: 'Courses', ic: 'course', items: [
            { id: 'courses', label: 'Departments & Courses', ic: 'course', mod: 'Courses' },
            { id: 'sessions', label: 'Sessions', ic: 'calendar', mod: 'Courses' },
            { id: 'batches', label: 'Batches & Classes', ic: 'batch', mod: 'Batches' },
        ],
    },
    {
        id: 'grp-students', label: 'Students', ic: 'students', items: [
            { id: 'students', label: 'Student Directory', ic: 'students', mod: 'Students', count: () => DB.students.length },
            { id: 'enrollment-requests', label: 'Enrollment Requests', ic: 'students', mod: 'Students', count: () => DB.enrollmentRequests.filter((r) => r.status === 'pending').length },
            { id: 'attendance', label: 'Attendance', ic: 'attendance', mod: 'Attendance' },
        ],
    },
    {
        id: 'grp-finance', label: 'Finance & Payments', ic: 'payment', items: [
            { id: 'invoices', label: 'Invoices & Payments', ic: 'payment', mod: 'Payments' },
            { id: 'collect-payment', label: 'Collect Payment', ic: 'payment', mod: 'Payments' },
            { id: 'due', label: 'Due & Overdue', ic: 'wallet', mod: 'Payments', count: () => DB.feeInvoices.filter((i) => i.due > 0).length },
            { id: 'cash-management', label: 'Cash Management', ic: 'building', mod: 'CashManagement', count: () => DB.cashHandovers.filter((h) => h.status === 'pending').length },
            { id: 'migrations', label: 'Course Migration', ic: 'swap', mod: 'Payments' },
            { id: 'refunds', label: 'Refunds', ic: 'wallet', mod: 'Payments' },
            { id: 'expenses', label: 'Expenses & Vendors', ic: 'expense', mod: 'Expenses' },
            { id: 'teacher-payments', label: 'Teacher Payments', ic: 'graduationCap', mod: 'TeacherPayments', count: (userId) => pendingTeacherPaymentsCountForUser(userId) },
        ],
    },
    {
        id: 'grp-certificates', label: 'Certificates & ID', ic: 'certificate', items: [
            { id: 'certificates', label: 'Certificates', ic: 'certificate', mod: 'Certificates' },
            { id: 'idcards', label: 'ID Cards', ic: 'idcard', mod: 'Certificates' },
        ],
    },
    {
        id: 'grp-reports', label: 'Reports', ic: 'report', items: [
            { id: 'reports', label: 'Reports & Analytics', ic: 'report', mod: 'Reports' },
        ],
    },
    {
        id: 'grp-admin', label: 'Administration', ic: 'settings', items: [
            { id: 'notifications', label: 'Notifications', ic: 'notification', mod: 'Notifications' },
            { id: 'users', label: 'Users & Roles', ic: 'user', mod: 'Users' },
            { id: 'access', label: 'Access Control', ic: 'shield', mod: 'Users' },
            { id: 'audit', label: 'Audit Log', ic: 'eye', mod: 'Audit' },
            { id: 'settings', label: 'Settings', ic: 'settings', mod: 'Settings' },
        ],
    },
];

/* Page title / subtitle pairs — copied from VIEWS in app.js. */
export const VIEW_META = {
    dashboard: { title: 'Dashboard', sub: "Welcome back, here's what's happening today" },
    leads: { title: 'Leads', sub: 'Manage captured leads across the pipeline' },
    pipeline: { title: 'Lead Pipeline', sub: 'Funnel view of all leads by stage' },
    visits: { title: 'Institution Visits', sub: 'Polytechnic visit scheduling & reports' },
    'online-sessions': { title: 'Online Sessions', sub: 'Webinars & live sessions for polytechnic students' },
    followups: { title: 'Follow-ups', sub: "Today's due follow-ups, upcoming reminders & full history" },
    institutions: { title: 'Institutions', sub: 'Partner polytechnic institutes' },
    courses: { title: 'Departments & Courses', sub: 'Course catalogue, pricing & discounts' },
    sessions: { title: 'Course Sessions', sub: 'Sessions/terms per course — batches live inside a session' },
    batches: { title: 'Batches & Classes', sub: 'Batch structure, teacher assignment & timetable' },
    students: { title: 'Student Directory', sub: 'All registered students' },
    'enrollment-requests': { title: 'Enrollment Requests', sub: 'Self-enrolled via portal, awaiting approval' },
    attendance: { title: 'Attendance', sub: 'Session-wise attendance marking & tracking' },
    invoices: { title: 'Invoices & Payments', sub: 'Fee invoices and transaction log' },
    'collect-payment': { title: 'Collect Payment', sub: 'Search a student and record a walk-in / manual payment' },
    due: { title: 'Due & Overdue', sub: 'Tabs for today, all, date-range & 7-day follow-up automation' },
    'cash-management': { title: 'Cash Management', sub: 'Bank deposits & signed handovers — daily, monthly & date-range tracking' },
    migrations: { title: 'Course Migration', sub: 'Course transfer requests & fee recalculation' },
    refunds: { title: 'Refunds', sub: 'Refund requests & approval workflow' },
    expenses: { title: 'Expenses & Vendors', sub: 'Cost tracking with approval workflow' },
    'teacher-payments': { title: 'Teacher Payments', sub: 'Per-batch pay rates, payment requests & disbursement vouchers' },
    certificates: { title: 'Certificates', sub: 'Auto-generated, QR-verifiable certificates' },
    idcards: { title: 'ID Cards', sub: 'QR-coded student identity cards' },
    reports: { title: 'Reports & Analytics', sub: '44 reports across every module' },
    notifications: { title: 'Notifications & Automation', sub: 'Delivery log and automation rules' },
    users: { title: 'Users & Roles', sub: 'Staff accounts and role defaults' },
    access: { title: 'Access Control', sub: 'Per-user menu, page & data access permissions' },
    audit: { title: 'Audit Log', sub: 'System-wide activity trail' },
    settings: { title: 'System Settings', sub: 'Organization, session & integrations' },
};

export const ALL_VIEW_IDS = NAV.flatMap((g) => g.items.map((it) => it.id));

export function navItemFor(viewId) {
    return NAV.flatMap((g) => g.items).find((it) => it.id === viewId) || null;
}

export function groupForView(viewId) {
    return NAV.find((g) => g.items.some((it) => it.id === viewId)) || null;
}
