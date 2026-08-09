/* Printable payment & cash-handover receipts — ported from receiptTemplate() and
   cashHandoverReceiptTemplate() in the prototype's ui.js. Shared by the admin finance
   module and the student portal, so both render the identical sheet. */

import { renderToStaticMarkup } from 'react-dom/server';
import {
    DB,
    batchName,
    cashHandoverPayments,
    courseName,
    fmtDate,
    fmtMoney,
    primaryEnrollment,
    studentById,
    studentName,
    userName,
} from './db';
import { Icon, MethodBadge } from './ui';

const LOGO_SRC = '/prototype/assets/logo.svg';

export function receiptData(paymentId) {
    const p = DB.payments.find((x) => x.id === Number(paymentId));

    if (!p) {
        return null;
    }

    const inv = DB.feeInvoices.find((i) => i.id === p.invoice_id);
    const s = studentById(p.student_id);
    const enr = inv && s ? s.courses[inv.student_course_idx] : s ? primaryEnrollment(s) : null;

    return { p, inv, s, enr };
}

function OrgHeader({ title, reference }) {
    return (
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
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-700)' }}>{title}</div>
                <div className="cell-sub">{reference}</div>
            </div>
        </div>
    );
}

export function PaymentReceipt({ paymentId }) {
    const d = receiptData(paymentId);

    if (!d || !d.s) {
        return <p className="muted">Receipt not found.</p>;
    }

    const { p, inv, s, enr } = d;
    const due = inv?.due || 0;

    return (
        <div className="receipt-sheet">
            <OrgHeader title="PAYMENT RECEIPT" reference={p.receipt_no} />
            <div className="hr" />

            <div className="grid grid-2" style={{ gap: 14, marginBottom: 16 }}>
                <div>
                    <span className="cell-sub">Received From</span>
                    <div className="cell-strong">
                        {s.name} ({s.code})
                    </div>
                </div>
                <div>
                    <span className="cell-sub">Date</span>
                    <div className="cell-strong">
                        {fmtDate(p.date)} {p.date.split(' ')[1] || ''}
                    </div>
                </div>
                <div>
                    <span className="cell-sub">Course</span>
                    <div className="cell-strong">{courseName(enr?.course_id)}</div>
                </div>
                <div>
                    <span className="cell-sub">Batch</span>
                    <div className="cell-strong">{batchName(enr?.batch_id)}</div>
                </div>
            </div>

            <div className="table-wrap" style={{ marginBottom: 16 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Method</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Course fee payment{p.channel === 'physical' ? ' (received in person)' : ' (paid online)'}</td>
                            <td>
                                <MethodBadge method={p.method} />
                            </td>
                            <td style={{ textAlign: 'right' }} className="cell-strong">
                                {fmtMoney(p.amount)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-2" style={{ gap: 10, marginBottom: 26, fontSize: 13 }}>
                <div className="flex-between">
                    <span className="muted">Total Course Fee</span>
                    <b>{fmtMoney(inv?.total ?? p.amount)}</b>
                </div>
                <div className="flex-between">
                    <span className="muted">Paid Till Date</span>
                    <b style={{ color: 'var(--success-700)' }}>{fmtMoney(inv?.paid ?? p.amount)}</b>
                </div>
                <div className="flex-between">
                    <span className="muted">Remaining Due</span>
                    <b style={{ color: due > 0 ? 'var(--danger-600)' : 'var(--success-700)' }}>{fmtMoney(due)}</b>
                </div>
                <div className="flex-between">
                    <span className="muted">Received By</span>
                    <b>{p.collected_by ? userName(p.collected_by) : p.gateway_txn_id || 'Online Gateway'}</b>
                </div>
            </div>

            <div className="flex-between" style={{ marginTop: 30 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 150, marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Student / Guardian Signature</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 150, marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Authorized Signature (Accountant) · {fmtDate(p.date)}</span>
                </div>
            </div>
        </div>
    );
}

export function CashHandoverReceipt({ handoverId }) {
    const h = DB.cashHandovers.find((x) => x.id === Number(handoverId));

    if (!h) {
        return <p className="muted">Record not found.</p>;
    }

    const payments = cashHandoverPayments(h);
    const isBank = h.type === 'bank_deposit';

    return (
        <div className="receipt-sheet">
            <OrgHeader title={isBank ? 'BANK DEPOSIT RECEIPT' : 'CASH HANDOVER RECEIPT'} reference={h.receipt_no} />
            <div className="hr" />

            <div className="grid grid-2" style={{ gap: 14, marginBottom: 16 }}>
                <div>
                    <span className="cell-sub">Date</span>
                    <div className="cell-strong">{fmtDate(h.date)}</div>
                </div>
                <div>
                    <span className="cell-sub">Amount</span>
                    <div className="cell-strong" style={{ color: 'var(--primary-700)' }}>
                        {fmtMoney(h.amount)}
                    </div>
                </div>
                <div>
                    <span className="cell-sub">Handed Over By</span>
                    <div className="cell-strong">{userName(h.created_by)} (Accountant)</div>
                </div>
                <div>
                    <span className="cell-sub">{isBank ? 'Deposited To' : 'Received By'}</span>
                    <div className="cell-strong">{isBank ? h.bank_name : userName(h.handed_to)}</div>
                </div>
                {isBank ? (
                    <>
                        <div>
                            <span className="cell-sub">Branch</span>
                            <div className="cell-strong">{h.branch || '—'}</div>
                        </div>
                        <div>
                            <span className="cell-sub">Account No.</span>
                            <div className="cell-strong">{h.account_no || '—'}</div>
                        </div>
                        <div>
                            <span className="cell-sub">Deposit Slip No.</span>
                            <div className="cell-strong">{h.slip_no || '—'}</div>
                        </div>
                    </>
                ) : (
                    <div>
                        <span className="cell-sub">Status</span>
                        <div className="cell-strong">{h.status === 'confirmed' ? 'Confirmed & Signed' : 'Pending Signature'}</div>
                    </div>
                )}
            </div>

            <div className="table-wrap" style={{ marginBottom: 16 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Receipt No.</th>
                            <th>Student</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((p) => (
                            <tr key={p.id}>
                                <td>{p.receipt_no}</td>
                                <td>{studentName(p.student_id)}</td>
                                <td style={{ textAlign: 'right' }}>{fmtMoney(p.amount)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={2} style={{ textAlign: 'right', fontWeight: 800 }}>
                                Total
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtMoney(h.amount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {h.notes ? (
                <div className="cell-sub" style={{ marginBottom: 8 }}>
                    Notes: {h.notes}
                </div>
            ) : null}
            {h.attachment ? (
                <div className="cell-sub" style={{ marginBottom: 16 }}>
                    <Icon name="file" /> Attachment on file: {h.attachment.name}
                </div>
            ) : null}

            <div className="flex-between" style={{ marginTop: 30 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 170, marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Handed Over By — {userName(h.created_by)}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    {isBank ? (
                        <>
                            <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 170, marginBottom: 6 }} />
                            <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                                Bank Authorized Signature / Stamp (Slip {h.slip_no || '—'})
                            </span>
                        </>
                    ) : h.status === 'confirmed' ? (
                        <>
                            <div
                                style={{
                                    fontFamily: "'Brush Script MT',cursive",
                                    fontSize: 20,
                                    color: 'var(--primary-700)',
                                    borderBottom: '1.5px solid var(--gray-400)',
                                    width: 170,
                                    marginBottom: 6,
                                    paddingBottom: 2,
                                }}
                            >
                                {h.confirmed_signature}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                                Received &amp; Signed by {userName(h.confirmed_by)} · {fmtDate(h.confirmed_date)}
                            </span>
                        </>
                    ) : (
                        <>
                            <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 170, marginBottom: 6 }} />
                            <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Awaiting Signature — {userName(h.handed_to)}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* Print stylesheet copied from printReceipt() in ui.js — the popup window has no access to
   the bundled CSS, so the receipt ships its own minimal styles. */
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

function printSheet(title, element, onBlocked) {
    const body = renderToStaticMarkup(element);
    const html = `<!DOCTYPE html><html><head><title>${title}</title><meta charset="UTF-8"><style>${PRINT_CSS}</style></head><body>${body}</body></html>`;
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

    onBlocked?.('Please allow pop-ups to print the receipt (demo)', 'error');
}

export function printPaymentReceipt(paymentId, onBlocked) {
    printSheet('Payment Receipt', <PaymentReceipt paymentId={paymentId} />, onBlocked);
}

export function printCashHandoverReceipt(handoverId, onBlocked) {
    printSheet('Cash Receipt', <CashHandoverReceipt handoverId={handoverId} />, onBlocked);
}
