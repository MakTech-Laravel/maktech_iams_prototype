/* Teacher payment voucher sheet & print window — ported from teacherPaymentVoucherTemplate() and
   printTeacherPaymentVoucher() in public/prototype/js/render-teacherpay.js. */

import { renderToStaticMarkup } from 'react-dom/server';
import { DB, TEACHER_PAY_TYPE_LABELS, courseName, fmtDate, fmtMoney, userName } from '../../../lib/db';
import { MethodBadge } from '../../../lib/ui';

const LOGO_SRC = '/prototype/assets/logo.svg';

export const VOUCHER_STATUS_TEXT = {
    pending: 'Pending Approval',
    approved: 'Approved — Awaiting Disbursement',
    paid: 'Disbursed',
    rejected: 'Rejected',
};

export function TeacherPaymentVoucher({ paymentId }) {
    const p = DB.teacherPayments.find((x) => x.id === Number(paymentId));

    if (!p) {
        return <p className="muted">Record not found.</p>;
    }

    const b = DB.batches.find((x) => x.id === p.batch_id);

    return (
        <div className="receipt-sheet">
            <div className="receipt-head">
                <div className="flex-gap">
                    <div className="mark logo-chip" style={{ width: 40, height: 40 }}>
                        <img src={LOGO_SRC} alt="logo" />
                    </div>
                    <div>
                        <b style={{ fontSize: 15, display: 'block' }}>{DB.orgProfile.name}</b>
                        <span style={{ fontSize: 11, color: 'var(--gray-500)', display: 'block' }}>{DB.orgProfile.address}</span>
                        <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                            {DB.orgProfile.phone} · {DB.orgProfile.email}
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-700)' }}>TEACHER PAYMENT VOUCHER</div>
                    <div className="cell-sub">{p.voucher_no}</div>
                </div>
            </div>
            <div className="hr" />

            <div className="grid grid-2" style={{ gap: 14, marginBottom: 16 }}>
                <div>
                    <span className="cell-sub">Paid To</span>
                    <div className="cell-strong">{userName(p.teacher_id)}</div>
                </div>
                <div>
                    <span className="cell-sub">Status</span>
                    <div className="cell-strong">{VOUCHER_STATUS_TEXT[p.status] || 'Pending Approval'}</div>
                </div>
                <div>
                    <span className="cell-sub">Batch</span>
                    <div className="cell-strong">
                        {b ? b.name : '—'} ({courseName(b?.course_id)})
                    </div>
                </div>
                <div>
                    <span className="cell-sub">Payment Type</span>
                    <div className="cell-strong">
                        {TEACHER_PAY_TYPE_LABELS[p.type]} — {p.period_label}
                    </div>
                </div>
            </div>

            <div className="table-wrap" style={{ marginBottom: 16 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style={{ textAlign: 'right' }}>Computed</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {TEACHER_PAY_TYPE_LABELS[p.type]} — {p.period_label}
                                {p.notes ? <div className="cell-sub">{p.notes}</div> : null}
                            </td>
                            <td style={{ textAlign: 'right' }}>{fmtMoney(p.computed_amount)}</td>
                            <td style={{ textAlign: 'right' }} className="cell-strong">
                                {fmtMoney(p.amount)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-2" style={{ gap: 10, marginBottom: 26, fontSize: 13 }}>
                <div className="flex-between">
                    <span className="muted">Requested By</span>
                    <b>
                        {userName(p.requested_by)} · {fmtDate(p.requested_date)}
                    </b>
                </div>
                <div className="flex-between">
                    <span className="muted">{p.status === 'rejected' ? 'Rejected By' : 'Approved By'}</span>
                    <b>{p.approved_by ? userName(p.approved_by) + ' · ' + fmtDate(p.approved_date) : '—'}</b>
                </div>
                {p.status === 'paid' ? (
                    <>
                        <div className="flex-between">
                            <span className="muted">Disbursed By</span>
                            <b>
                                {userName(p.paid_by)} · {fmtDate(p.paid_date)}
                            </b>
                        </div>
                        <div className="flex-between">
                            <span className="muted">Method / Ref.</span>
                            <b>
                                <MethodBadge method={p.payment_method} /> {p.txn_ref || ''}
                            </b>
                        </div>
                    </>
                ) : null}
                {p.status === 'rejected' ? (
                    <div className="flex-between" style={{ gridColumn: 'span 2' }}>
                        <span className="muted">Reason</span>
                        <b style={{ color: 'var(--danger-600)' }}>{p.rejection_reason}</b>
                    </div>
                ) : null}
            </div>

            <div className="flex-between" style={{ marginTop: 30 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 170, marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Teacher / Coordinator Signature — {userName(p.teacher_id)}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 170, marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                        Authorized Signature (Accounts) {p.status === 'paid' ? '· ' + fmtDate(p.paid_date) : ''}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* Print stylesheet copied from printTeacherPaymentVoucher() — the popup window has no access
   to the bundled CSS, so the voucher ships its own minimal styles. */
const PRINT_CSS = `
  :root{ --primary-700:#c93e14; --gray-400:#94a3b8; --gray-500:#64748b; --success-700:#047857; --danger-600:#dc2626; }
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:34px;color:#1e293b;}
  .receipt-sheet{max-width:640px;margin:0 auto;}
  .receipt-head{display:flex;justify-content:space-between;align-items:flex-start;}
  .hr{height:1px;background:#e2e8f0;margin:16px 0;}
  .grid{display:grid;gap:10px;} .grid-2{grid-template-columns:1fr 1fr;}
  .flex-between{display:flex;justify-content:space-between;align-items:center;}
  .flex-gap{display:flex;align-items:center;gap:10px;}
  .cell-strong{font-weight:700;} .cell-sub{font-size:11px;color:#94a3b8;} .muted{color:#64748b;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;padding:8px 10px;border-bottom:1px solid #e2e8f0;}
  td{padding:9px 10px;border-bottom:1px solid #f1f5f9;}
  .badge{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:#f1f5f9;color:#475569;}
  .logo-chip{background:#111;border-radius:9px;overflow:hidden;display:flex;align-items:center;justify-content:center;}
  .logo-chip img{width:80%;height:80%;object-fit:contain;}
  @media print{ body{padding:0;} }
`;

export function printTeacherPaymentVoucher(paymentId, onBlocked) {
    const body = renderToStaticMarkup(<TeacherPaymentVoucher paymentId={paymentId} />);
    const html = `<!DOCTYPE html><html><head><title>Teacher Payment Voucher</title><meta charset="UTF-8"><style>${PRINT_CSS}</style></head><body>${body}</body></html>`;
    const w = window.open('', '_blank', 'width=760,height=920');

    if (w && w.document) {
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => {
            try {
                w.print();
            } catch {
                /* popup closed before print — nothing to recover */
            }
        }, 300);

        return;
    }

    onBlocked?.('Please allow pop-ups to print the voucher (demo)', 'error');
}
