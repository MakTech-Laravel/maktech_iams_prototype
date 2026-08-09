/* Users & Roles (RBAC) — ported from renderUsers() in public/prototype/js/render-admin.js
   (open-add-user / save-user / open-edit-user / toggle-user-status / open-add-role / save-role /
   view-role-matrix / goto-access-for-user cases in app.js). */

import { router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { DB, hasAnyOverride, roleName } from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { Avatar, Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useUi } from '../../lib/UiProvider';
import { useAddRoleModal } from './admin/AddRoleModal';
import { useAddUserModal } from './admin/AddUserModal';
import { useRoleMatrixModal } from './admin/RoleMatrixModal';

export default function Users({ view }) {
    const refresh = useRefresh();
    const { toast } = useUi();
    const openAddUser = useAddUserModal(refresh);
    const openAddRole = useAddRoleModal(refresh);
    const openRoleMatrix = useRoleMatrixModal();

    const toggleUserStatus = (id) => {
        const u = DB.users.find((x) => x.id === id);

        if (u) {
            u.status = u.status === 'active' ? 'inactive' : 'active';
            toast(`User ${u.status === 'active' ? 'activated' : 'deactivated'}`);
            refresh();
        }
    };

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Users &amp; Roles</h1>
                    <p>Role-Based Access Control (RBAC) — granular permissions per module</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={openAddRole}>
                        <Icon name="plus" /> Add Role
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={openAddUser}>
                        <Icon name="plus" /> Add User
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="user" label="Total Staff Users" value={DB.users.length} color="#ff6533" />
                <KpiCard icon="shield" label="Roles Defined" value={DB.roles.length} color="#8b5cf6" />
                <KpiCard icon="checkCircle" label="Active Users" value={DB.users.filter((u) => u.status === 'active').length} color="#10b981" />
                <KpiCard icon="alertCircle" label="Inactive Users" value={DB.users.filter((u) => u.status === 'inactive').length} color="#ef4444" />
            </div>

            <h3 className="report-section-title">
                Roles{' '}
                <span className="cell-sub" style={{ fontWeight: 400 }}>
                    — default permission templates, applied to every new user of that role
                </span>
            </h3>
            <div className="card" style={{ marginBottom: 26 }}>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Description</th>
                                <th>Users</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.roles.map((r) => (
                                <tr className="row-link" key={r.id} onClick={() => openRoleMatrix(r.id)}>
                                    <td className="cell-strong">{r.name}</td>
                                    <td style={{ maxWidth: 340, whiteSpace: 'normal' }}>{r.desc}</td>
                                    <td>{r.users}</td>
                                    <td>
                                        <button type="button" className="btn btn-sm btn-outline">
                                            <Icon name="shield" /> View Permissions
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card card-pad" style={{ marginBottom: 26, background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
                <div className="flex-gap">
                    <div className="kpi-icon" style={{ width: 36, height: 36, background: '#fff', color: 'var(--primary-600)', flexShrink: 0 }}>
                        <Icon name="shield" />
                    </div>
                    <div>
                        <b style={{ display: 'block', fontSize: 13 }}>Need to change access for one specific person?</b>
                        <span className="cell-sub">
                            Role permissions above are just the starting default. Open <b>Access Control</b> to grant or restrict any individual
                            user's menu/page access, edit rights, or assigned batches — independent of their role.
                        </span>
                    </div>
                </div>
                <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => router.visit('/admin/access')}>
                    <Icon name="shield" /> Open Access Control
                </button>
            </div>

            <h3 className="report-section-title">Staff Users</h3>
            <div className="card">
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th />
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Access</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <Avatar name={u.name} size="sm" photo={u.photo} />
                                    </td>
                                    <td className="cell-strong">{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.phone}</td>
                                    <td>
                                        <span className="badge badge-purple">{roleName(u.role_id)}</span>
                                    </td>
                                    <td>
                                        <StatusBadge status={u.status} />
                                    </td>
                                    <td>
                                        {hasAnyOverride(u.id) ? (
                                            <span className="badge badge-amber">
                                                <Icon name="alertCircle" /> Custom
                                            </span>
                                        ) : (
                                            <span className="badge badge-gray">Role default</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex-gap">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost"
                                                title="Manage this user's access"
                                                onClick={() => router.visit(`/admin/access?user=${u.id}`)}
                                            >
                                                <Icon name="shield" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => toast('Edit user form would open here (demo)')}
                                            >
                                                <Icon name="edit" />
                                            </button>
                                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleUserStatus(u.id)}>
                                                <Icon name={u.status === 'active' ? 'trash' : 'checkCircle'} />
                                            </button>
                                        </div>
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
