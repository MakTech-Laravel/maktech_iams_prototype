/* Enrollment Requests — ported from renderEnrollmentRequests() in
   public/prototype/js/render-students.js plus the approve/reject-enrollment-request cases in
   public/prototype/js/app.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import {
    DB,
    approveEnrollmentRequest,
    batchName,
    canEnrollInBatch,
    courseName,
    fmtDate,
    fmtMoney,
    rejectEnrollmentRequest,
    sessionName,
    studentById,
    userName,
} from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { useIdentity } from '../../lib/identity';
import { Avatar, Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useUi } from '../../lib/UiProvider';

function RequestRows({ list, withActions, canApprove, onApprove, onReject }) {
    return list.map((r) => {
        const s = studentById(r.student_id);

        return (
            <tr key={r.id}>
                <td>
                    <Avatar name={s?.name || '—'} size="sm" photo={s?.photo} />
                </td>
                <td>
                    <span className="cell-strong">{s?.name || '—'}</span>
                    <div className="cell-sub">{s?.phone || ''}</div>
                </td>
                <td>{courseName(r.course_id)}</td>
                <td>
                    {sessionName(r.session_id)} · {batchName(r.batch_id)}
                </td>
                <td>
                    {r.payment_option === 'pay_later' ? (
                        <span className="badge badge-amber">Enroll w/o payment</span>
                    ) : (
                        <span className="badge badge-blue">Paid Online</span>
                    )}
                </td>
                <td>{fmtDate(r.requested_date)}</td>
                <td>
                    <StatusBadge status={r.status} />
                </td>
                <td>
                    {withActions ? (
                        canApprove ? (
                            <div className="flex-gap">
                                <button type="button" className="btn btn-sm btn-success" onClick={() => onApprove(r.id)}>
                                    <Icon name="check" /> Approve
                                </button>
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => onReject(r.id)}>
                                    <Icon name="close" /> Reject
                                </button>
                            </div>
                        ) : (
                            <span className="muted" style={{ fontSize: 12 }}>
                                Awaiting an Approver
                            </span>
                        )
                    ) : r.reviewed_by ? (
                        `${userName(r.reviewed_by)} · ${fmtDate(r.reviewed_date)}`
                    ) : (
                        '—'
                    )}
                </td>
            </tr>
        );
    });
}

export default function EnrollmentRequests({ view }) {
    const { userId, can } = useIdentity();
    const { toast } = useUi();
    const refresh = useRefresh();

    const pending = DB.enrollmentRequests.filter((r) => r.status === 'pending');
    const resolved = DB.enrollmentRequests.filter((r) => r.status !== 'pending').slice().reverse();
    const canApprove = can('Students', 'Approve');

    const onApprove = (id) => {
        const req = DB.enrollmentRequests.find((r) => r.id === id);
        const cap = req ? canEnrollInBatch(req.batch_id) : { ok: false, reason: 'Request not found.' };

        if (!cap.ok) {
            toast(`Cannot approve — ${cap.reason}`, 'error');

            return;
        }

        const inv = approveEnrollmentRequest(id, userId);

        if (inv) {
            toast(`Enrollment approved — invoice ${inv.invoice_no} created, due ${fmtMoney(inv.due)}`);
        }

        refresh();
    };

    const onReject = (id) => {
        rejectEnrollmentRequest(id, userId, null);
        toast('Enrollment request rejected', 'error');
        refresh();
    };

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Enrollment Requests</h1>
                    <p>Students who self-enrolled via the portal without paying yet — approve to activate a due invoice, or reject</p>
                </div>
            </div>

            {!canApprove ? (
                <div className="badge badge-gray" style={{ marginBottom: 16 }}>
                    <Icon name="shield" /> You can view requests here, but approving/rejecting requires the "Approve" permission on Students —
                    managed by Admin via Access Control.
                </div>
            ) : null}

            <div className="grid grid-3" style={{ marginBottom: 20 }}>
                <KpiCard icon="clock" label="Pending Review" value={pending.length} color="#f59e0b" />
                <KpiCard
                    icon="checkCircle"
                    label="Approved (All Time)"
                    value={DB.enrollmentRequests.filter((r) => r.status === 'approved').length}
                    color="#10b981"
                />
                <KpiCard
                    icon="alertCircle"
                    label="Rejected (All Time)"
                    value={DB.enrollmentRequests.filter((r) => r.status === 'rejected').length}
                    color="#ef4444"
                />
            </div>

            <h3 className="report-section-title">Pending Requests</h3>
            <div className="card" style={{ marginBottom: 26 }}>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th />
                                <th>Student</th>
                                <th>Course</th>
                                <th>Session · Batch</th>
                                <th>Payment</th>
                                <th>Requested</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {pending.length ? (
                                <RequestRows list={pending} withActions canApprove={canApprove} onApprove={onApprove} onReject={onReject} />
                            ) : (
                                <tr>
                                    <td colSpan={8} className="muted">
                                        No pending enrollment requests right now.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <h3 className="report-section-title">Request History</h3>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th />
                                <th>Student</th>
                                <th>Course</th>
                                <th>Session · Batch</th>
                                <th>Payment</th>
                                <th>Requested</th>
                                <th>Status</th>
                                <th>Reviewed By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resolved.length ? (
                                <RequestRows list={resolved} withActions={false} canApprove={canApprove} onApprove={onApprove} onReject={onReject} />
                            ) : (
                                <tr>
                                    <td colSpan={8} className="muted">
                                        No resolved requests yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
