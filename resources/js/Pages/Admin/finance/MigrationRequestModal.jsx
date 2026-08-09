/* Course Migration Request modal — ported from migrationRequestModal() and
   updateMigrationPreview() in public/prototype/js/render-finance.js. */

import { useState } from 'react';
import { DB, fmtMoney, sum } from '../../../lib/db';

const MIGRATION_FEE = 1000;

export function migrationRequestSub(student, currentCourse) {
    return `${student.name} — currently enrolled in ${currentCourse?.name}`;
}

export function MigrationRequestBody({ student, currentCourse }) {
    const [price, setPrice] = useState(null);
    const paid = sum(
        DB.payments.filter((p) => p.student_id === student.id),
        (p) => p.amount,
    );

    return (
        <>
            <div className="form-grid" style={{ marginBottom: 18 }}>
                <div className="field span-2">
                    <label>Migrate To *</label>
                    <select onChange={(event) => setPrice(Number(event.target.selectedOptions[0].dataset.price))}>
                        {DB.courses
                            .filter((c) => c.id !== currentCourse?.id && c.status === 'active')
                            .map((c) => (
                                <option key={c.id} value={c.id} data-price={c.base_price}>
                                    {c.name} — {fmtMoney(c.base_price)}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="field span-2">
                    <label>Reason for Migration</label>
                    <textarea placeholder="Why is the student requesting to migrate?" />
                </div>
            </div>
            <div className="card card-pad" id="migrationPreview" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
                <b style={{ fontSize: '12.5px', color: 'var(--primary-700)', display: 'block', marginBottom: 10 }}>Real-time Fee Difference Preview</b>
                <div className="grid grid-2" style={{ gap: 10, fontSize: 13 }}>
                    <div className="flex-between">
                        <span className="muted">Already Paid (carried over)</span>
                        <b>{fmtMoney(paid)}</b>
                    </div>
                    <div className="flex-between">
                        <span className="muted">New Course Price</span>
                        <b>{price == null ? '—' : fmtMoney(price)}</b>
                    </div>
                    <div className="flex-between">
                        <span className="muted">Migration Fee (configurable)</span>
                        <b>৳1,000</b>
                    </div>
                    <div className="flex-between">
                        <span className="muted">Net Additional Due</span>
                        <b style={{ color: 'var(--primary-700)' }}>{price == null ? '—' : fmtMoney(Math.max(0, price - paid + MIGRATION_FEE))}</b>
                    </div>
                </div>
            </div>
        </>
    );
}
