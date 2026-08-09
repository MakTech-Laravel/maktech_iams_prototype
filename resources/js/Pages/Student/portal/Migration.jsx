/* Migration — ported from renderPortalMigration() and updatePortalMigPreview() in the prototype's portal.js. */

import { useState } from 'react';
import { DB, courseName, fmtDate, fmtMoney, sum } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export default function Migration({ student }) {
    const s = student;
    const enr = s.courses[0];
    const course = DB.courses.find((c) => c.id === enr?.course_id);
    const myMigrations = DB.courseMigrations.filter((m) => m.student_id === s.id);
    const options = DB.courses.filter((c) => c.id !== course?.id && c.status === 'active');
    const paid = sum(
        DB.payments.filter((p) => p.student_id === s.id),
        (p) => p.amount,
    );
    const { toast } = useUi();
    const [migTo, setMigTo] = useState(String(options[0]?.id ?? ''));
    // The prototype only filled the preview on the select's change event, so it starts as em dashes.
    const [preview, setPreview] = useState(null);

    const changeMigTo = (value) => {
        setMigTo(value);
        setPreview(Number(DB.courses.find((c) => c.id === Number(value))?.base_price || 0));
    };

    return (
        <>
            <div className="card" style={{ marginBottom: 22 }}>
                <div className="card-header">
                    <h3>Request New Migration</h3>
                </div>
                <div className="card-pad">
                    <div className="form-grid" style={{ marginBottom: 16 }}>
                        <div className="field span-2">
                            <label>Currently Enrolled</label>
                            <div>
                                <b>{course?.name || '—'}</b>
                            </div>
                        </div>
                        <div className="field span-2">
                            <label>Migrate To</label>
                            <select value={migTo} onChange={(event) => changeMigTo(event.target.value)}>
                                {options.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.name} — {fmtMoney(c.base_price)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field span-2">
                            <label>Reason</label>
                            <textarea placeholder="Why would you like to migrate?" />
                        </div>
                    </div>
                    <div className="card card-pad" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
                        <b style={{ fontSize: '12.5px', color: 'var(--primary-700)', display: 'block', marginBottom: 10 }}>
                            Real-time Fee Difference Preview
                        </b>
                        <div className="grid grid-2" style={{ gap: 10, fontSize: 13 }}>
                            <div className="flex-between">
                                <span className="muted">Already Paid</span>
                                <b>{fmtMoney(paid)}</b>
                            </div>
                            <div className="flex-between">
                                <span className="muted">New Course Price</span>
                                <b>{preview == null ? '—' : fmtMoney(preview)}</b>
                            </div>
                            <div className="flex-between">
                                <span className="muted">Migration Fee</span>
                                <b>৳1,000</b>
                            </div>
                            <div className="flex-between">
                                <span className="muted">Net Additional Due</span>
                                <b style={{ color: 'var(--primary-700)' }}>{preview == null ? '—' : fmtMoney(Math.max(0, preview - paid + 1000))}</b>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ marginTop: 16 }}
                        onClick={() => toast('Migration request submitted for approval')}
                    >
                        <Icon name="send" /> Submit Request
                    </button>
                </div>
            </div>
            <div className="card">
                <div className="card-header">
                    <h3>My Migration History</h3>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>From → To</th>
                                <th>Requested</th>
                                <th>Net Adjustment</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myMigrations.length ? (
                                myMigrations.map((m) => (
                                    <tr key={m.id}>
                                        <td className="cell-strong">
                                            {courseName(m.from_course_id)} → {courseName(m.to_course_id)}
                                        </td>
                                        <td>{fmtDate(m.date)}</td>
                                        <td>{fmtMoney(m.net_adjustment)}</td>
                                        <td>
                                            <StatusBadge status={m.status} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="muted">
                                        No migration requests yet.
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
