/* Access Control — ported from renderAccessControl() in public/prototype/js/render-admin.js.
   The prototype's <select id="acUserSelect"> + delegated `change` listener (which re-ran
   renderAccessControlBody) becomes page-level state; `goto-access-for-user` arrives as ?user=<id>. */

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { DB, roleName } from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { useIdentity } from '../../lib/identity';
import AccessControlBody from './admin/AccessControlBody';

function requestedUserId() {
    if (typeof window === 'undefined') {
        return null;
    }

    const requested = Number(new URLSearchParams(window.location.search).get('user'));

    return DB.users.some((u) => u.id === requested) ? requested : null;
}

export default function Access({ view }) {
    const { userId } = useIdentity();
    const [selectedId, setSelectedId] = useState(() => requestedUserId() ?? userId);
    const refresh = useRefresh();

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Access Control</h1>
                    <p>
                        Grant or restrict menu, page &amp; action-level access for any individual user — this always overrides their role's defaults
                    </p>
                </div>
            </div>
            <div className="card card-pad" style={{ marginBottom: 20 }}>
                <div className="form-grid">
                    <div className="field span-2">
                        <label>Select a user to manage</label>
                        <select id="acUserSelect" value={String(selectedId)} onChange={(event) => setSelectedId(Number(event.target.value))}>
                            {DB.users.map((u) => (
                                <option value={u.id} key={u.id}>
                                    {u.name} — {roleName(u.role_id)}
                                    {u.status === 'inactive' ? ' (inactive)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div id="acBody">
                <AccessControlBody userId={selectedId} onChange={refresh} />
            </div>
        </AdminLayout>
    );
}
