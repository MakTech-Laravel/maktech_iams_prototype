/* Expenses & Vendors — ported from renderExpenses() in public/prototype/js/render-finance.js,
   plus the approve-expense case in app.js. */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, batchName, fmtDate, fmtMoney, sum } from '../../lib/db';
import { Donut, Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useFinanceModals } from './finance/useFinanceModals';

const CATEGORY_COLORS = ['#ff6533', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function Expenses({ view }) {
    const { openAddExpense, refresh, toast } = useFinanceModals();

    const approve = (id) => {
        const ex = DB.expenses.find((x) => x.id === id);

        if (ex) {
            ex.status = 'approved';
            ex.approved_by = 2;
            toast('Expense approved');
            refresh();
        }
    };

    const byCategory = DB.expenseCategories
        .map((c, i) => ({
            label: c,
            value: sum(
                DB.expenses.filter((e) => e.category === c),
                (e) => e.amount,
            ),
            color: CATEGORY_COLORS[i],
        }))
        .filter((x) => x.value > 0);

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Expenses &amp; Vendors</h1>
                    <p>Event, tour, facility &amp; operational cost tracking with approval workflow</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={openAddExpense}>
                        <Icon name="plus" /> Add Expense
                    </button>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: 20, alignItems: 'start' }}>
                <div className="card">
                    <div className="card-header">
                        <h3>Expense by Category</h3>
                    </div>
                    <div className="card-pad">
                        <Donut data={byCategory} />
                    </div>
                </div>
                <div className="grid grid-2" style={{ gap: 18 }}>
                    <KpiCard
                        icon="expense"
                        label="Total Expense (Paid)"
                        value={fmtMoney(
                            sum(
                                DB.expenses.filter((e) => e.status === 'paid'),
                                (e) => e.amount,
                            ),
                        )}
                        color="#ef4444"
                    />
                    <KpiCard icon="clock" label="Pending Approval" value={DB.expenses.filter((e) => e.status === 'pending').length} color="#f59e0b" />
                    <KpiCard icon="checkCircle" label="Approved (Unpaid)" value={DB.expenses.filter((e) => e.status === 'approved').length} color="#3b82f6" />
                    <KpiCard icon="building" label="Active Vendors" value={DB.vendors.length} color="#8b5cf6" />
                </div>
            </div>

            <h3 className="report-section-title">Expense Log</h3>
            <div className="card" style={{ marginBottom: 26 }}>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Linked Batch</th>
                                <th>Vendor</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.expenses.map((e) => (
                                <tr key={e.id}>
                                    <td className="cell-strong">{e.title}</td>
                                    <td>
                                        <span className="badge badge-purple">{e.category}</span>
                                    </td>
                                    <td>{fmtMoney(e.amount)}</td>
                                    <td>{e.batch_id ? batchName(e.batch_id) : '—'}</td>
                                    <td>{e.vendor_id ? DB.vendors.find((v) => v.id === e.vendor_id)?.name : '—'}</td>
                                    <td>{fmtDate(e.expense_date)}</td>
                                    <td>
                                        <StatusBadge status={e.status} />
                                    </td>
                                    <td>
                                        {e.status === 'pending' ? (
                                            <button type="button" className="btn btn-sm btn-success" onClick={() => approve(e.id)}>
                                                <Icon name="check" /> Approve
                                            </button>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <h3 className="report-section-title">Vendors / Suppliers</h3>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Payment Terms</th>
                                <th>Total Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB.vendors.map((v) => (
                                <tr key={v.id}>
                                    <td className="cell-strong">{v.name}</td>
                                    <td>{v.phone}</td>
                                    <td>{v.email}</td>
                                    <td>{v.terms}</td>
                                    <td>
                                        {fmtMoney(
                                            sum(
                                                DB.expenses.filter((e) => e.vendor_id === v.id),
                                                (e) => e.amount,
                                            ),
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
