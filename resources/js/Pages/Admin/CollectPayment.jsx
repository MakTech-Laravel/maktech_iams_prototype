/* Collect Payment — ported from renderCollectPayment(), collectResultsHtml() and
   renderCollectResults() in public/prototype/js/render-finance.js. */

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { DB, batchName, courseName, fmtMoney, invoiceForStudent, primaryEnrollment } from '../../lib/db';
import { Avatar, Icon, StatusBadge } from '../../lib/ui';
import FinanceEmpty from './finance/Empty';
import { useFinanceModals } from './finance/useFinanceModals';

function matchingStudents(query) {
    const q = (query || '').trim().toLowerCase();

    if (q) {
        return DB.students.filter((s) => {
            const batchNames = s.courses.map((c) => batchName(c.batch_id).toLowerCase()).join(' ');

            return s.name.toLowerCase().includes(q) || (s.phone || '').includes(q) || s.code.toLowerCase().includes(q) || batchNames.includes(q);
        });
    }

    return DB.students.filter((s) => (invoiceForStudent(s.id)?.due || 0) > 0).slice(0, 8);
}

function CollectResults({ query, onCollect }) {
    const students = matchingStudents(query);

    if (!students.length) {
        return <FinanceEmpty icon="search" message="No matching students. Try a different name, phone or batch." />;
    }

    return (
        <div className="card">
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th />
                            <th>Student</th>
                            <th>Course</th>
                            <th>Batch</th>
                            <th>Due</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s) => {
                            const inv = invoiceForStudent(s.id);
                            const enr = primaryEnrollment(s);

                            return (
                                <tr key={s.id}>
                                    <td>
                                        <Avatar name={s.name} size="sm" photo={s.photo} />
                                    </td>
                                    <td>
                                        <span className="cell-strong">{s.name}</span>
                                        <div className="cell-sub">
                                            {s.code} · {s.phone}
                                        </div>
                                    </td>
                                    <td>{courseName(enr?.course_id)}</td>
                                    <td>{batchName(enr?.batch_id)}</td>
                                    <td style={{ color: (inv?.due || 0) > 0 ? 'var(--danger-600)' : 'var(--success-700)', fontWeight: 700 }}>
                                        {fmtMoney(inv?.due || 0)}
                                    </td>
                                    <td>{inv ? <StatusBadge status={inv.status} /> : <span className="muted">—</span>}</td>
                                    <td>
                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => onCollect(s.id)}>
                                            <Icon name="payment" /> Collect
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function CollectPayment({ view }) {
    const { openRecordPayment } = useFinanceModals();
    const [query, setQuery] = useState('');

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Collect Payment</h1>
                    <p>Search a student by name, phone, code or batch to record a walk-in / manual payment and print the receipt instantly</p>
                </div>
            </div>
            <div className="card card-pad" style={{ marginBottom: 20 }}>
                <div className="search-input-wrap" style={{ maxWidth: 480 }}>
                    <Icon name="search" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, student code or batch…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <p className="hint" style={{ marginTop: 8 }}>
                    Leave blank to see students who currently have an outstanding due.
                </p>
            </div>
            <div>
                <CollectResults query={query} onCollect={openRecordPayment} />
            </div>
        </AdminLayout>
    );
}
