/* One curriculum module row — the shared markup renderPortalDashboard() and renderPortalCourse()
   both emitted in the prototype's portal.js. */

import { Icon, StatusBadge } from '../../../lib/ui';

const STATUS_COLORS = { completed: 'var(--success-500)', in_progress: 'var(--warning-500)' };

export default function ModuleRow({ module, status }) {
    const color = STATUS_COLORS[status] || 'var(--gray-300)';

    return (
        <div className="module-row">
            <div className="module-check" style={{ background: `${color}1a`, color }}>
                {status === 'completed' ? <Icon name="check" /> : status === 'in_progress' ? <Icon name="clock" /> : null}
            </div>
            <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13, display: 'block' }}>
                    {module.seq}. {module.title}
                </b>
                <span className="cell-sub">{module.hours} hrs</span>
            </div>
            <StatusBadge status={status} />
        </div>
    );
}
