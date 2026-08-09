/* "Assign Teachers" modal — ported from manageTeachersModal() in public/prototype/js/render-academic.js
   plus the `toggle-batch-teacher` / `save-teacher-assignment` cases in app.js. */

import { useState } from 'react';
import {
    DB,
    PAY_RATE_TYPE_LABELS,
    assignTeacherToBatch,
    courseName,
    fmtMoney,
    payRateFor,
    roleName,
    teacherUsers,
    unassignTeacherFromBatch,
    userName,
} from '../../../lib/db';
import { Avatar, Icon } from '../../../lib/ui';

function ManageTeachersBody({ ctx, batch: b, canPay }) {
    const [, setTick] = useState(0);
    const teachers = teacherUsers();

    const toggle = (teacherId, checked) => {
        if (checked) {
            assignTeacherToBatch(b.id, teacherId);
        } else {
            unassignTeacherFromBatch(b.id, teacherId);
        }

        setTick((n) => n + 1);
    };

    return (
        <>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th />
                            <th>Teacher</th>
                            <th>Role</th>
                            <th style={{ textAlign: 'center' }}>Assigned</th>
                            {canPay ? <th>Pay Rate</th> : null}
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.map((t) => {
                            const assigned = (b.assigned_teachers || []).includes(t.id);
                            const rate = payRateFor(t.id, b.id);

                            return (
                                <tr key={t.id}>
                                    <td>
                                        <Avatar name={t.name} size="sm" photo={t.photo} />
                                    </td>
                                    <td className="cell-strong">{t.name}</td>
                                    <td>{roleName(t.role_id)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input type="checkbox" checked={assigned} onChange={(event) => toggle(t.id, event.target.checked)} />
                                    </td>
                                    {canPay ? (
                                        <td>
                                            {assigned ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => ctx.actions.setPayRate(t.id, b.id)}
                                                >
                                                    {rate ? (
                                                        `${fmtMoney(rate.rate_amount)} ${PAY_RATE_TYPE_LABELS[rate.rate_type]}`
                                                    ) : (
                                                        <>
                                                            <Icon name="plus" /> Set Rate
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="muted">—</span>
                                            )}
                                        </td>
                                    ) : null}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="hr" />
            <div className="cell-sub">
                Current coordinator (primary contact): <b>{userName(b.coordinator_id)}</b>
            </div>
        </>
    );
}

export function openManageTeachersModal(ctx, batchId) {
    const b = DB.batches.find((x) => x.id === batchId);

    if (!b) {
        return;
    }

    const canPay = ctx.can('TeacherPayments', 'Edit');

    ctx.openModal({
        title: `Assign Teachers — ${b.name}`,
        sub: `${courseName(b.course_id)} · Assigned teachers can ONLY access this batch (not the whole system)`,
        body: <ManageTeachersBody ctx={ctx} batch={b} canPay={canPay} />,
        foot: (
            <>
                <button type="button" className="btn btn-secondary" onClick={ctx.closeModal}>
                    Close
                </button>
                {canPay ? (
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => ctx.actions.goView('teacher-payments')}
                    >
                        <Icon name="graduationCap" /> Open Teacher Payments
                    </button>
                ) : null}
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                        ctx.closeModal();
                        ctx.toast('Teacher assignment updated');
                        ctx.refresh();
                    }}
                >
                    <Icon name="check" /> Done
                </button>
            </>
        ),
    });
}
