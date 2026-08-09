/* Role default permission matrix modal — ported from roleMatrixModal() in
   public/prototype/js/render-admin.js (plus the `toggle-perm` case in app.js). */

import { DB } from '../../../lib/db';
import { useRefresh } from '../../../lib/hooks';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { ListAccessGrid, ReportAccessGrid } from './PermissionGrids';

function RoleMatrixBody({ roleId }) {
    const refresh = useRefresh();
    const matrix = DB.rolePermMatrix[roleId];

    const toggle = (mod, act, checked) => {
        DB.rolePermMatrix[roleId][mod][act] = checked;
        refresh();
    };

    return (
        <>
            <div className="table-wrap" style={{ marginBottom: 22 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Module</th>
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
                                {DB.permActions.map((a) => (
                                    <td style={{ textAlign: 'center' }} key={a}>
                                        <input type="checkbox" checked={!!matrix[m][a]} onChange={(event) => toggle(m, a, event.target.checked)} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <h3 className="report-section-title" style={{ marginTop: 0 }}>
                Report Access (Role Default)
            </h3>
            <div className="card card-pad" style={{ marginBottom: 20 }}>
                <ReportAccessGrid id={roleId} isRole />
            </div>
            <h3 className="report-section-title">List / Data Visibility (Role Default)</h3>
            <div className="card card-pad" style={{ marginBottom: 8 }}>
                <ListAccessGrid id={roleId} isRole />
            </div>
            <div className="badge badge-gray" style={{ whiteSpace: 'normal', textAlign: 'left', marginTop: 10 }}>
                <Icon name="shield" /> Admin Panel Access for Coordinators/Teachers is managed per-user in Access Control, since a role may include
                some staff who should stay portal-only and others who shouldn't.
            </div>
        </>
    );
}

export function useRoleMatrixModal() {
    const { openModal, closeModal, toast } = useUi();

    return (roleId) => {
        const role = DB.roles.find((r) => r.id === roleId);

        if (!role) {
            return;
        }

        openModal({
            size: 'xl',
            title: `${role.name} — Default Permission Matrix`,
            sub: `${role.desc} · These are role-level defaults; use Access Control to override for a specific person.`,
            body: <RoleMatrixBody roleId={roleId} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            closeModal();
                            toast('Role defaults updated (demo)');
                        }}
                    >
                        <Icon name="check" /> Save Changes
                    </button>
                </>
            ),
        });
    };
}
