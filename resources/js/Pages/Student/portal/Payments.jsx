/* Payments — ported from renderPortalPayments() and simulateOnlinePayment() in the prototype's portal.js. */

import { useState } from 'react';
import { DB, fmtDate, fmtMoney, invoiceForStudent, recordPayment } from '../../../lib/db';
import { Icon, KpiCard, MethodBadge, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useReceiptPreview } from './ReceiptPreview';

const PAY_METHODS = [
    { id: 'bkash', label: 'bKash', logo: 'bK', color: '#e2136e' },
    { id: 'nagad', label: 'Nagad', logo: 'N', color: '#f7941d' },
    { id: 'rocket', label: 'Rocket', logo: 'R', color: '#8c3494' },
    { id: 'card', label: 'Card', logo: '💳', color: '#334155' },
    { id: 'sslcommerz', label: 'SSLCommerz', logo: 'SC', color: '#0ea5e9' },
];

export default function Payments({ student, refresh }) {
    const s = student;
    const inv = invoiceForStudent(s.id);
    const payments = DB.payments.filter((p) => p.student_id === s.id);
    const installments = inv ? DB.paymentInstallments.filter((x) => x.invoice_id === inv.id) : [];
    const { toast } = useUi();
    const openReceipt = useReceiptPreview();
    const [method, setMethod] = useState('bkash');
    const [amount, setAmount] = useState(String(inv?.due ?? ''));

    const simulateOnlinePayment = () => {
        if (!inv || inv.due <= 0) {
            return;
        }

        const paid = Math.min(inv.due, Number(amount || inv.due));
        const payment = recordPayment(s.id, inv.id, paid, method === 'sslcommerz' ? 'card' : method, 'online', null, {
            gatewayTxnId: `TXN${Math.floor(Math.random() * 90000000 + 10000000)}`,
        });
        toast('Payment successful! Receipt generated.');
        setTimeout(() => {
            setAmount(String(inv.due));
            refresh();
            openReceipt(payment.id);
        }, 700);
    };

    return (
        <>
            <div className="grid grid-3" style={{ marginBottom: 20 }}>
                <KpiCard icon="file" label="Total Fee" value={fmtMoney(inv?.total || 0)} color="#ff6533" />
                <KpiCard icon="checkCircle" label="Paid" value={fmtMoney(inv?.paid || 0)} color="#10b981" />
                <KpiCard icon="alertCircle" label="Due" value={fmtMoney(inv?.due || 0)} color={inv?.due > 0 ? '#ef4444' : '#10b981'} />
            </div>

            {inv && inv.due > 0 ? (
                <div className="card" style={{ marginBottom: 22 }}>
                    <div className="card-header">
                        <h3>Pay Now</h3>
                        <p>Choose your preferred payment method</p>
                    </div>
                    <div className="card-pad">
                        <div className="pay-method-grid" style={{ marginBottom: 18 }}>
                            {PAY_METHODS.map((pm) => (
                                <div key={pm.id} className={`pay-method ${method === pm.id ? 'selected' : ''}`.trim()} onClick={() => setMethod(pm.id)}>
                                    <div className="pm-logo" style={{ background: pm.color }}>
                                        {pm.logo}
                                    </div>
                                    {pm.label}
                                </div>
                            ))}
                        </div>
                        <div className="flex-gap" style={{ maxWidth: 280 }}>
                            <div className="field" style={{ flex: 1 }}>
                                <label>Amount to Pay (BDT)</label>
                                <input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
                            </div>
                        </div>
                        <button type="button" className="btn btn-primary" style={{ marginTop: 14 }} onClick={simulateOnlinePayment}>
                            <Icon name="send" /> Proceed to Pay {fmtMoney(inv.due)}
                        </button>
                        <p className="hint" style={{ marginTop: 8 }}>
                            Demo only — no real gateway is triggered.
                        </p>
                    </div>
                </div>
            ) : (
                <div
                    className="due-banner"
                    style={{ background: 'var(--success-50)', borderColor: '#a7f3d0', color: 'var(--success-700)', marginBottom: 22 }}
                >
                    <div className="ic-wrap">
                        <Icon name="checkCircle" />
                    </div>
                    <div>Your fee is fully paid. No action needed. 🎉</div>
                </div>
            )}

            {installments.length ? (
                <div className="card" style={{ marginBottom: 22 }}>
                    <div className="card-header">
                        <h3>Installment Plan</h3>
                    </div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {installments.map((x) => (
                                    <tr key={x.id}>
                                        <td>{x.no}</td>
                                        <td>{fmtMoney(x.amount)}</td>
                                        <td>{fmtDate(x.due_date)}</td>
                                        <td>
                                            <StatusBadge status={x.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            <div className="card">
                <div className="card-header">
                    <h3>Payment History</h3>
                    <p>Every payment — online or in person — gets a signed, printable receipt</p>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Receipt</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length ? (
                                payments
                                    .slice()
                                    .reverse()
                                    .map((p) => (
                                        <tr key={p.id}>
                                            <td className="cell-strong">{p.receipt_no}</td>
                                            <td>{fmtMoney(p.amount)}</td>
                                            <td>
                                                <MethodBadge method={p.method} />
                                            </td>
                                            <td>{fmtDate(p.date)}</td>
                                            <td>
                                                <StatusBadge status={p.status} />
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-outline" onClick={() => openReceipt(p.id)}>
                                                    <Icon name="printer" /> View / Print
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="muted">
                                        No payments yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
