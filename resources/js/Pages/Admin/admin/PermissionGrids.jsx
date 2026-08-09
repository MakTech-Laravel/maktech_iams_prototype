/* Report Access & List Visibility grids plus the Admin Panel Access card — ported from
   reportAccessGridHtml / listAccessGridHtml / adminPanelAccessCardHtml in public/prototype/js/render-admin.js.
   Each grid is shared by BOTH the role-default matrix modal and the per-user Access Control screen. */

import { DB, PAYMENT_LIST_KEYS, STUDENT_LIST_KEYS, effectivePerm, setUserPermOverride } from '../../../lib/db';
import { useRefresh } from '../../../lib/hooks';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { REPORTS } from './reportCatalog';

/* toggle-role-report-perm / toggle-user-report-perm */
export function ReportAccessGrid({ id, isRole, onChange }) {
    const localRefresh = useRefresh();
    const mod = 'Reports';

    const toggle = (reportId, checked) => {
        if (isRole) {
            DB.rolePermMatrix[id][mod][`Report_${reportId}`] = checked;
        } else {
            setUserPermOverride(id, mod, `Report_${reportId}`, checked);
        }

        localRefresh();
        onChange?.();
    };

    return (
        <>
            {REPORTS.map((g) => (
                <div style={{ marginBottom: 14 }} key={g.sec}>
                    <b style={{ fontSize: 12, display: 'block', marginBottom: 6, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '.02em' }}>
                        {g.sec}
                    </b>
                    <div className="grid grid-4" style={{ gap: 6 }}>
                        {g.items.map((r) => {
                            const key = `Report_${r.id}`;
                            const val = isRole ? !!DB.rolePermMatrix[id][mod][key] : effectivePerm(id, mod, key);
                            const isOverridden = !isRole && DB.userPermOverrides[id]?.[mod]?.[key] !== undefined;

                            return (
                                <label
                                    className="flex-gap"
                                    key={r.id}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        padding: '5px 8px',
                                        borderRadius: 8,
                                        ...(isOverridden ? { background: 'var(--primary-50)' } : {}),
                                    }}
                                >
                                    <input type="checkbox" checked={!!val} onChange={(event) => toggle(r.id, event.target.checked)} /> <span>{r.t}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}
        </>
    );
}

/* toggle-role-list-perm / toggle-user-list-perm */
function ListAccessColumn({ id, isRole, mod, keys, label, onToggle }) {
    return (
        <div>
            <b style={{ fontSize: '12.5px', display: 'block', marginBottom: 8 }}>{label}</b>
            <div className="flex-gap" style={{ flexWrap: 'wrap', gap: 8 }}>
                {keys.map((k) => {
                    const key = `List_${k}`;
                    const val = isRole ? !!DB.rolePermMatrix[id][mod][key] : effectivePerm(id, mod, key);
                    const isOverridden = !isRole && DB.userPermOverrides[id]?.[mod]?.[key] !== undefined;

                    return (
                        <label
                            className="flex-gap"
                            key={k}
                            style={{
                                cursor: 'pointer',
                                fontSize: '12.5px',
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: '1px solid var(--gray-200)',
                                ...(isOverridden ? { background: 'var(--primary-50)' } : {}),
                            }}
                        >
                            <input type="checkbox" checked={!!val} onChange={(event) => onToggle(mod, k, event.target.checked)} /> {k}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

export function ListAccessGrid({ id, isRole, onChange }) {
    const localRefresh = useRefresh();

    const toggle = (mod, key, checked) => {
        if (isRole) {
            DB.rolePermMatrix[id][mod][`List_${key}`] = checked;
        } else {
            setUserPermOverride(id, mod, `List_${key}`, checked);
        }

        localRefresh();
        onChange?.();
    };

    return (
        <div className="grid grid-2" style={{ gap: 20 }}>
            <ListAccessColumn
                id={id}
                isRole={isRole}
                mod="Payments"
                keys={PAYMENT_LIST_KEYS}
                label="Payments — which status lists can this role/user browse"
                onToggle={toggle}
            />
            <ListAccessColumn
                id={id}
                isRole={isRole}
                mod="Students"
                keys={STUDENT_LIST_KEYS}
                label="Students — which status lists can this role/user browse"
                onToggle={toggle}
            />
        </div>
    );
}

/* toggle-user-adminpanel-access */
export function AdminPanelAccessCard({ userId, onChange }) {
    const localRefresh = useRefresh();
    const { toast } = useUi();
    const u = DB.users.find((x) => x.id === userId);

    if (!u) {
        return null;
    }

    const val = effectivePerm(userId, 'Users', 'AdminPanelAccess');
    const isOverridden = DB.userPermOverrides[userId]?.Users?.AdminPanelAccess !== undefined;

    const toggle = (checked) => {
        setUserPermOverride(userId, 'Users', 'AdminPanelAccess', checked);
        toast(checked ? 'Admin panel access granted' : 'Admin panel access revoked — user will use the Teacher Portal instead');
        localRefresh();
        onChange?.();
    };

    return (
        <div
            className="card card-pad"
            style={{ marginBottom: 20, ...(val ? {} : { background: 'var(--danger-50)', borderColor: '#fecaca' }) }}
        >
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div style={{ maxWidth: 520 }}>
                    <b style={{ display: 'block', fontSize: 13 }}>
                        <Icon name="shield" /> Admin Panel Access
                    </b>
                    <span className="cell-sub">
                        {u.role_id === 5
                            ? 'Coordinators/Teachers use the dedicated Teacher Portal (teacher-portal.html) by default and cannot log into this admin panel. Enable this to grant this specific teacher full admin-panel access instead.'
                            : 'Controls whether this user can log into the admin panel at all.'}
                    </span>
                </div>
                <label className="flex-gap" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!val} onChange={(event) => toggle(event.target.checked)} />
                    <span className={`badge ${val ? 'badge-green' : 'badge-red'}`}>{val ? 'Admin Panel Allowed' : 'Portal-Only (Admin Panel Blocked)'}</span>
                    {isOverridden ? <span className="badge badge-amber">Custom</span> : null}
                </label>
            </div>
        </div>
    );
}
