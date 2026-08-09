/* Cash Management — ported from renderCashManagement(), wireCashTabs() and
   toggleAllCashCheckboxes() in public/prototype/js/render-finance.js. */

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    TODAY,
    cashCollectedInRange,
    cashCollectedToday,
    cashHandoversToday,
    cashInHandTotal,
    fmtDate,
    fmtMoney,
    studentName,
    sum,
    undepositedCashPayments,
    userName,
} from '../../lib/db';
import { useIdentity } from '../../lib/identity';
import { Icon, KpiCard, Tabs } from '../../lib/ui';
import CashPane from './finance/CashPanes';
import FinanceEmpty from './finance/Empty';
import { useFinanceModals } from './finance/useFinanceModals';

const CASH_TABS = [
    { id: 'today', label: 'Today' },
    { id: 'month', label: 'This Month' },
    { id: 'range', label: 'Date-to-Date Filter' },
];

export default function CashManagement({ view }) {
    const { userId, can } = useIdentity();
    const { openCashHandover, openConfirmCashHandover, openCashAttachment, openCashHandoverReceipt } = useFinanceModals();
    const [tab, setTab] = useState('today');
    const [selected, setSelected] = useState([]);

    const undeposited = undepositedCashPayments();
    const selectedIds = selected.filter((id) => undeposited.some((p) => p.id === id));
    const allChecked = undeposited.length > 0 && selectedIds.length === undeposited.length;
    const cashInHand = cashInHandTotal();

    const toggleAll = (checked) => setSelected(checked ? undeposited.map((p) => p.id) : []);
    const toggleOne = (id, checked) => setSelected((current) => (checked ? [...current, id] : current.filter((x) => x !== id)));

    const handlers = {
        canConfirm: (h) => h.status === 'pending' && (userId === h.handed_to || can('CashManagement', 'Approve')),
        onViewAttachment: openCashAttachment,
        onViewReceipt: openCashHandoverReceipt,
        onConfirm: openConfirmCashHandover,
    };

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Cash Management</h1>
                    <p>Every cash receipt, tracked from collection to bank deposit or a signed handover — daily, monthly &amp; date-range views</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openCashHandover('handover', selectedIds)}>
                        <Icon name="user" /> Handover to Boss / Director
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => openCashHandover('bank_deposit', selectedIds)}>
                        <Icon name="building" /> New Bank Deposit
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="payment" label="Cash Collected Today" value={fmtMoney(cashCollectedToday())} color="#10b981" />
                <KpiCard icon="wallet" label="Cash In Hand (Undeposited)" value={fmtMoney(cashInHand)} color={cashInHand > 0 ? '#ef4444' : '#10b981'} />
                <KpiCard
                    icon="building"
                    label="Deposited / Handed Over Today"
                    value={fmtMoney(sum(cashHandoversToday(), (h) => h.amount))}
                    color="#3b82f6"
                />
                <KpiCard
                    icon="report"
                    label="Collected This Month"
                    value={fmtMoney(cashCollectedInRange(`${TODAY.slice(0, 7)}-01`, TODAY))}
                    color="#8b5cf6"
                />
            </div>

            <div className="card" style={{ marginBottom: 26 }}>
                <div className="card-header">
                    <h3>Undeposited Cash In Hand</h3>
                    <p>Select receipts below, then create a bank deposit or a handover — leave nothing selected to bundle everything</p>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 34 }}>
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        disabled={!undeposited.length}
                                        onChange={(event) => toggleAll(event.target.checked)}
                                    />
                                </th>
                                <th>Receipt</th>
                                <th>Student</th>
                                <th>Amount</th>
                                <th>Collected By</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {undeposited.length ? (
                                undeposited.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="cash-pay-cb"
                                                value={p.id}
                                                checked={selectedIds.includes(p.id)}
                                                onChange={(event) => toggleOne(p.id, event.target.checked)}
                                            />
                                        </td>
                                        <td className="cell-strong">{p.receipt_no}</td>
                                        <td>{studentName(p.student_id)}</td>
                                        <td>{fmtMoney(p.amount)}</td>
                                        <td>{p.collected_by ? userName(p.collected_by) : '—'}</td>
                                        <td>{fmtDate(p.date)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: 0 }}>
                                        <FinanceEmpty
                                            icon="checkCircle"
                                            message="All collected cash has already been deposited or handed over — nothing pending."
                                            style={{ padding: '34px 20px' }}
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <h3 className="report-section-title">Deposit &amp; Handover History</h3>
            <Tabs tabs={CASH_TABS} active={tab} onChange={setTab} />
            <div>
                <CashPane tab={tab} handlers={handlers} />
            </div>
        </AdminLayout>
    );
}
