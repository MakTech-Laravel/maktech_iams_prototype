/* Per-user Access Control body — ported from accessControlBodyHtml() / renderAccessControlBody() in
   public/prototype/js/render-admin.js, plus the toggle-user-perm, reset-user-perms,
   toggle-user-batch-scope and preview-as-user cases in public/prototype/js/app.js. */

import { router } from '@inertiajs/react';
import {
    DB,
    assignTeacherToBatch,
    clearUserPermOverrides,
    courseName,
    effectivePerm,
    hasAnyOverride,
    roleName,
    setUserPermOverride,
    unassignTeacherFromBatch,
} from '../../../lib/db';
import { useRefresh } from '../../../lib/hooks';
import { useIdentity } from '../../../lib/identity';
import { Avatar, Icon, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { AdminPanelAccessCard, ListAccessGrid, ReportAccessGrid } from './PermissionGrids';

export default function AccessControlBody({ userId, onChange }) {
    const localRefresh = useRefresh();
    const { toast } = useUi();
    const { setUser } = useIdentity();
    const u = DB.users.find((x) => x.id === userId);

    const refresh = () => {
        localRefresh();
        onChange?.();
    };

    if (!u) {
        return <div className="muted">User not found.</div>;
    }

    const overridden = hasAnyOverride(userId);
    const isTeacher = u.role_id === 5;

    const togglePerm = (mod, act, checked) => {
        setUserPermOverride(userId, mod, act, checked);
        refresh();
    };

    const resetPerms = () => {
        clearUserPermOverrides(userId);
        toast('Reset to role defaults for this user');
        refresh();
    };

    const previewAsUser = () => {
        setUser(u.id);
        toast(`Now previewing the app as ${u.name} (${roleName(u.role_id)})`);
        router.visit('/admin/dashboard');
    };

    const toggleBatchScope = (batchId, checked) => {
        if (checked) {
            assignTeacherToBatch(batchId, userId);
        } else {
            unassignTeacherFromBatch(batchId, userId);
        }

        refresh();
    };

    return (
        <>
            <div className="flex-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div className="flex-gap">
                    <Avatar name={u.name} photo={u.photo} />
                    <div>
                        <b style={{ display: 'block', fontSize: 14 }}>{u.name}</b>
                        <span className="cell-sub">{roleName(u.role_id)} · role default applies unless overridden below</span>
                    </div>
                </div>
                <div className="flex-gap">
                    {overridden ? (
                        <span className="badge badge-amber">
                            <Icon name="alertCircle" /> Has custom overrides
                        </span>
                    ) : (
                        <span className="badge badge-gray">Using role defaults</span>
                    )}
                    <button type="button" className="btn btn-outline btn-sm" onClick={resetPerms}>
                        <Icon name="trash" /> Reset to Role Default
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={previewAsUser}>
                        <Icon name="eye" /> Preview App as This User
                    </button>
                </div>
            </div>

            <AdminPanelAccessCard userId={userId} onChange={onChange} />

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <h3>Menu / Page &amp; Action Permissions</h3>
                    <p>
                        Checked = this user can access that page/action. Highlighted cells are custom overrides for this user only. The "Change
                        Status" column is deliberately separate from "Edit" — e.g. someone can edit a student's profile without being allowed to
                        change their status.
                    </p>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Module (Menu / Page)</th>
                                {DB.permActions.map((a) => (
                                    <th style={{ textAlign: 'center' }} key={a}>
                                        {a}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DB.permModules.map((m) => (
                                <tr key={m}>
                                    <td className="cell-strong">{m}</td>
                                    {DB.permActions.map((a) => {
                                        const isOverridden = DB.userPermOverrides[userId]?.[m]?.[a] !== undefined;
                                        const val = effectivePerm(userId, m, a);

                                        return (
                                            <td key={a} style={{ textAlign: 'center', ...(isOverridden ? { background: 'var(--primary-50)' } : {}) }}>
                                                <input type="checkbox" checked={!!val} onChange={(event) => togglePerm(m, a, event.target.checked)} />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <h3>Report Access</h3>
                    <p>
                        A report is completely hidden/blocked in Reports &amp; Analytics unless individually checked here — not every report is
                        accessible to every user.
                    </p>
                </div>
                <div className="card-pad">
                    <ReportAccessGrid id={userId} isRole={false} onChange={onChange} />
                </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <h3>List / Data Visibility Permissions</h3>
                    <p>
                        Fine-grained control over which status-filtered lists this user can browse (e.g. Paid vs Due invoices, Active vs Dropped
                        students) — independent from the base module View permission above.
                    </p>
                </div>
                <div className="card-pad">
                    <ListAccessGrid id={userId} isRole={false} onChange={onChange} />
                </div>
            </div>

            {isTeacher ? (
                <div className="card">
                    <div className="card-header">
                        <h3>Assigned Courses &amp; Batches</h3>
                        <p>
                            This teacher/coordinator can ONLY see &amp; manage the batches checked below — this restriction applies regardless of the
                            module permissions above.
                        </p>
                    </div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Batch</th>
                                    <th>Course</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Assigned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DB.batches.map((b) => (
                                    <tr key={b.id}>
                                        <td className="cell-strong">{b.name}</td>
                                        <td>{courseName(b.course_id)}</td>
                                        <td>
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={(b.assigned_teachers || []).includes(userId)}
                                                onChange={(event) => toggleBatchScope(b.id, event.target.checked)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card card-pad" style={{ color: 'var(--gray-500)', fontSize: '12.5px' }}>
                    <Icon name="alertCircle" /> Batch/course scoping applies to Course Coordinator / Teacher role users — it restricts which batches
                    they see inside Batches, Attendance &amp; Student Directory. This user's role isn't batch-scoped, so their access is controlled
                    purely by the module permissions above.
                </div>
            )}
        </>
    );
}
