/* Add Expense modal — ported from addExpenseModal() in public/prototype/js/render-finance.js.
   As in the prototype the `save-expense` case only toasts, so the fields stay uncontrolled. */

import { DB } from '../../../lib/db';
import { Icon } from '../../../lib/ui';

export function AddExpenseBody() {
    return (
        <div className="form-grid">
            <div className="field span-2">
                <label>Title *</label>
                <input type="text" placeholder="e.g. Factory Tour — Batch-26-A" />
            </div>
            <div className="field">
                <label>Category *</label>
                <select>
                    {DB.expenseCategories.map((c) => (
                        <option key={c}>{c}</option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Amount (BDT) *</label>
                <input type="number" placeholder="35000" />
            </div>
            <div className="field">
                <label>Linked Batch</label>
                <select>
                    <option>—</option>
                    {DB.batches.map((b) => (
                        <option key={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Vendor</label>
                <select>
                    <option>—</option>
                    {DB.vendors.map((v) => (
                        <option key={v.id}>{v.name}</option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label>Expense Date *</label>
                <input type="date" defaultValue="2026-08-06" />
            </div>
            <div className="field span-2">
                <label>Attachment (invoice/bill)</label>
                <div
                    className="flex-gap"
                    style={{ border: '1.5px dashed var(--gray-300)', borderRadius: 10, padding: 14, justifyContent: 'center', color: 'var(--gray-400)' }}
                >
                    <Icon name="upload" /> Upload bill/invoice scan (demo)
                </div>
            </div>
        </div>
    );
}
