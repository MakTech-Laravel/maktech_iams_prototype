/* The 44-report catalogue — ported verbatim from the REPORTS constant in
   public/prototype/js/render-reports.js (groups, ids, titles, descriptions and ordering unchanged). */

export const REPORTS = [
    {
        sec: 'Marketing Reports',
        items: [
            { id: 1, t: 'Lead Source-wise Report', d: 'Which institute/campaign generates most leads', ic: 'marketing' },
            { id: 2, t: 'Lead Status Pipeline Report', d: 'Funnel view of lead stages', ic: 'target' },
            { id: 3, t: 'Polytechnic Visit Report', d: 'Date-wise, staff-wise visit log', ic: 'institution' },
            { id: 4, t: 'Follow-up Due/Overdue Report', d: 'Pending and missed follow-ups', ic: 'clock' },
            { id: 5, t: 'Contact History Report', d: 'Per student/lead communication timeline', ic: 'phone' },
            { id: 6, t: 'Marketing Staff Performance', d: 'Targets vs achieved conversions', ic: 'target' },
            { id: 7, t: 'Lost-Lead Reason Analysis', d: 'Why leads are lost, by reason', ic: 'alertCircle' },
            { id: 8, t: 'Institute-wise Conversion Report', d: 'Lead-to-student conversion by institute', ic: 'building' },
        ],
    },
    {
        sec: 'Student & Academic Reports',
        items: [
            { id: 9, t: 'Total Student List', d: 'Filterable by course, batch, institute, status', ic: 'students' },
            { id: 10, t: 'New Admission Report', d: 'Daily/weekly/monthly admissions', ic: 'students' },
            { id: 11, t: 'Course-wise Enrollment Report', d: 'Enrollment counts per course', ic: 'course' },
            { id: 12, t: 'Batch/Class-wise Student List', d: 'Roster per batch', ic: 'batch' },
            { id: 13, t: 'Attendance Report', d: 'Daily/monthly, per class, per student', ic: 'attendance' },
            { id: 14, t: 'Low-Attendance Alert Report', d: 'Students below attendance threshold', ic: 'alertCircle' },
            { id: 15, t: 'Course Completion / Progress Report', d: 'Module completion tracking', ic: 'checkCircle' },
            { id: 16, t: 'Dropout Report', d: 'Dropped students with reasons', ic: 'alertCircle' },
            { id: 17, t: 'Course Migration Report', d: 'History and fee impact of migrations', ic: 'swap' },
        ],
    },
    {
        sec: 'Financial Reports',
        items: [
            { id: 18, t: 'Daily Collection Report', d: 'Cash + online, accountant-wise', ic: 'payment' },
            { id: 19, t: 'Physical vs Online Payment Split', d: 'Channel-wise breakdown', ic: 'wallet' },
            { id: 20, t: 'Due Payment Report (Aging)', d: '0–7 / 8–15 / 15–30 / 30+ days overdue', ic: 'clock' },
            { id: 21, t: 'Partial Payment / Installment Status', d: 'Installment plan tracking', ic: 'wallet' },
            { id: 22, t: 'Discount Given Report', d: 'Staff-wise, course-wise discount totals', ic: 'expense' },
            { id: 23, t: 'Refund Report', d: 'All refunds with reasons & approvers', ic: 'wallet' },
            { id: 24, t: 'Migration Fee Collection Report', d: 'Fees collected via course migration', ic: 'swap' },
            { id: 25, t: 'Course-wise Revenue Report', d: 'Revenue generated per course', ic: 'course' },
            { id: 26, t: 'Institute-wise Revenue Report', d: 'Which polytechnic brings most revenue', ic: 'building' },
            { id: 27, t: 'Income Statement (আয়)', d: 'Filter by date/month/year/course/department', ic: 'payment' },
            { id: 28, t: 'Expense Statement (ব্যয়)', d: 'By category, filter by date/month/year', ic: 'expense' },
            { id: 29, t: 'Event Cost Report', d: 'All event-linked expenses', ic: 'expense' },
            { id: 30, t: 'Tour Cost Report', d: 'All tour-linked expenses', ic: 'expense' },
            { id: 31, t: 'Student Facility Cost Report', d: 'Transport, meals, materials, venue costs', ic: 'expense' },
            { id: 32, t: 'Net Profit/Loss Report', d: 'Income − Expense, filterable', ic: 'report' },
            { id: 33, t: 'Vendor Payment Report', d: 'Payments made to each vendor', ic: 'building' },
            { id: 34, t: 'Invoice/Receipt Register', d: 'All generated invoices, searchable', ic: 'file' },
            { id: 35, t: 'Accountant-wise Collection Reconciliation', d: 'Collections tallied per accountant', ic: 'payment' },
            { id: 42, t: 'Cash Deposit & Handover Report', d: 'Chain of custody: cash collected → bank deposit / signed handover', ic: 'wallet' },
        ],
    },
    {
        sec: 'Teacher Payment Reports',
        items: [
            { id: 43, t: 'Teacher Payment Summary Report', d: 'Per teacher, per batch — rate, computed earnings, paid & outstanding', ic: 'graduationCap' },
            { id: 44, t: 'Teacher Payment Voucher Log', d: 'All payment requests & vouchers with approval/disbursement status', ic: 'wallet' },
        ],
    },
    {
        sec: 'Certificate / ID Card Reports',
        items: [
            { id: 36, t: 'Certificates Issued Report', d: 'Date range, course-wise', ic: 'certificate' },
            { id: 37, t: 'Pending Certificate Report', d: 'Completed but not yet certified', ic: 'clock' },
            { id: 38, t: 'ID Card Issuance Report', d: 'All ID cards issued/expired/reissued', ic: 'idcard' },
        ],
    },
    {
        sec: 'System Reports',
        items: [
            { id: 39, t: 'User Activity / Audit Log Report', d: 'Who changed what, when', ic: 'shield' },
            { id: 40, t: 'SMS/Email Notification Delivery Report', d: 'Delivery success/failure stats', ic: 'notification' },
            { id: 41, t: 'Login History Report', d: 'Student portal usage statistics', ic: 'user' },
        ],
    },
];

export const ALL_REPORTS = REPORTS.flatMap((g) => g.items);
