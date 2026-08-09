/* Deposit & handover history tab panes — ported from cashHandoverRow(), cashHandoverTableHtml(),
   cashPane() and applyCashRangeFilter() in public/prototype/js/render-finance.js. The prototype
   re-injected #cashPane's innerHTML from wireCashTabs(); here the active tab is page state. */

import { useState } from 'react';
import { cashHandoversInRange, cashHandoversThisMonth, cashHandoversToday, fmtDate, fmtMoney, userName } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';
import FinanceEmpty from './Empty';

function CashHandoverRow({ handover, canConfirm, onViewAttachment, onViewReceipt, onConfirm }) {
    const h = handover;

    return (
        <tr>
            <td className="cell-strong">{h.receipt_no}</td>
            <td>{fmtDate(h.date)}</td>
            <td>{h.type === 'bank_deposit' ? <StatusBadge status="active" label="Bank Deposit" /> : <StatusBadge status="in_progress" label="Handover" />}</td>
            <td>{fmtMoney(h.amount)}</td>
            <td>{(h.payment_ids || []).length} receipt(s)</td>
            <td>{userName(h.created_by)}</td>
            <td>
                {h.type === 'bank_deposit' ? (
                    <>
                        {h.bank_name} <span className="cell-sub">({h.slip_no})</span>
                    </>
                ) : (
                    userName(h.handed_to)
                )}
            </td>
            <td>{h.status === 'confirmed' ? <StatusBadge status="active" label="Confirmed & Signed" /> : <StatusBadge status="pending" label="Awaiting Signature" />}</td>
            <td>
                <div className="flex-gap">
                    {h.attachment ? (
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            title={`View attached ${h.attachment.mime.startsWith('image/') ? 'photo' : 'document'}`}
                            onClick={() => onViewAttachment(h.id)}
                        >
                            <Icon name="file" />
                        </button>
                    ) : null}
                    <button type="button" className="btn btn-sm btn-ghost" title="View & print receipt" onClick={() => onViewReceipt(h.id)}>
                        <Icon name="printer" />
                    </button>
                    {canConfirm ? (
                        <button type="button" className="btn btn-sm btn-success" onClick={() => onConfirm(h.id)}>
                            <Icon name="check" /> Confirm
                        </button>
                    ) : null}
                </div>
            </td>
        </tr>
    );
}

export function CashHandoverTable({ list, emptyMsg, handlers }) {
    if (!list.length) {
        return <FinanceEmpty icon="wallet" message={emptyMsg || 'No records found.'} />;
    }

    return (
        <div className="card">
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Receipt</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Covers</th>
                            <th>Handled By</th>
                            <th>To</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {list
                            .slice()
                            .reverse()
                            .map((h) => (
                                <CashHandoverRow key={h.id} handover={h} {...handlers} canConfirm={handlers.canConfirm(h)} />
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CashRangePane({ handlers }) {
    const [from, setFrom] = useState('2026-08-01');
    const [to, setTo] = useState('2026-08-06');
    const [applied, setApplied] = useState({ from: '2026-08-01', to: '2026-08-06' });

    return (
        <>
            <div className="card card-pad" style={{ marginBottom: 18 }}>
                <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
                    <div className="field">
                        <label>From</label>
                        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                    </div>
                    <div className="field">
                        <label>To</label>
                        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ marginTop: 18 }}
                        onClick={() => setApplied({ from: from || '2026-01-01', to: to || '2026-12-31' })}
                    >
                        <Icon name="filter" /> Apply Filter
                    </button>
                </div>
            </div>
            <div>
                <CashHandoverTable
                    list={cashHandoversInRange(applied.from, applied.to)}
                    emptyMsg="No deposits or handovers in this date range."
                    handlers={handlers}
                />
            </div>
        </>
    );
}

export default function CashPane({ tab, handlers }) {
    if (tab === 'today') {
        return <CashHandoverTable list={cashHandoversToday()} emptyMsg="No deposits or handovers recorded today." handlers={handlers} />;
    }

    if (tab === 'month') {
        return <CashHandoverTable list={cashHandoversThisMonth()} emptyMsg="No deposits or handovers recorded this month." handlers={handlers} />;
    }

    if (tab === 'range') {
        return <CashRangePane handlers={handlers} />;
    }

    return null;
}
