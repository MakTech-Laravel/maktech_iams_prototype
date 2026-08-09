/* React ports of the prototype's shared UI helpers (public/prototype/js/ui.js).
   Class names, inline styles and DOM structure are kept identical so theme.css applies unchanged. */

import { ICONS } from './icons';

export function Icon({ name, cls }) {
    const svg = ICONS[name] || '';

    return <span className={`ic ${cls || ''}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/**
 * A bare glyph, for the places the prototype interpolated `${ICONS.x}` instead of `icon('x')`.
 *
 * That distinction is load-bearing: `.ic` is a fixed 16px box, so an icon wrapped in it shrinks
 * to 16px even inside a container whose own rule asks for more (`.kpi-icon svg` wants 19px,
 * `.report-card .ric svg` wants 18px). The wrapper here is `display:contents`, so the <svg> lands
 * directly in the parent's flex box and those container rules apply exactly as they did in the
 * prototype. Use <Icon> everywhere the prototype called icon(); use this only where it did not.
 */
export function IconGlyph({ name }) {
    return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />;
}

/* ---------------- Badge helpers ---------------- */
export const STATUS_MAP = {
    active: 'green', paid: 'green', present: 'green', completed: 'green', issued: 'green', approved: 'green', signed: 'green', success: 'green', sent: 'green', admitted: 'green', done: 'green', ongoing: 'blue',
    pending: 'amber', partial: 'amber', requested: 'amber', upcoming: 'blue', in_progress: 'amber', new: 'blue', contacted: 'blue', interested: 'cyan', visited: 'purple', negotiation: 'amber',
    overdue: 'red', dropped: 'red', lost: 'red', failed: 'red', absent: 'red', rejected: 'red', missed: 'red', locked: 'red', expired: 'red', inactive: 'gray', archived: 'gray', cancelled: 'gray',
    none: 'gray', draft: 'gray', on_hold: 'amber', certified: 'purple', prospect: 'gray', excused: 'cyan', not_started: 'gray', late: 'amber', refunded: 'purple', revoked: 'red', reissued: 'blue', due: 'amber',
};

export function StatusBadge({ status, label }) {
    const color = STATUS_MAP[status] || 'gray';
    const text = label || (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <span className={`badge badge-${color}`}>
            <span className="dot-i" style={{ background: 'currentColor' }} />
            {text}
        </span>
    );
}

const METHOD_MAP = { cash: 'green', cheque: 'blue', bank: 'blue', bkash: 'purple', nagad: 'amber', rocket: 'cyan', card: 'gray' };

export function MethodBadge({ method }) {
    return <span className={`badge badge-${METHOD_MAP[method] || 'gray'}`}>{(method || '').toUpperCase()}</span>;
}

/* ---------------- Mini bar chart (CSS) ---------------- */
export function BarChart({ data, max: maxOpt, fmt }) {
    const max = maxOpt || Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="bar-chart">
            {data.map((d, i) => (
                <div className="bar-col" key={i}>
                    <div className="bar-value">{fmt ? fmt(d.value) : d.value}</div>
                    <div className="bar" style={{ height: `${Math.max(6, (d.value / max) * 100)}%`, ...(d.color ? { background: d.color } : {}) }} />
                    <div className="bar-label">{d.label}</div>
                </div>
            ))}
        </div>
    );
}

/* ---------------- Donut chart (conic-gradient) ---------------- */
export function Donut({ data }) {
    const total = data.reduce((a, d) => a + d.value, 0) || 1;
    let acc = 0;
    const stops = data
        .map((d) => {
            const start = (acc / total) * 360;
            acc += d.value;
            const end = (acc / total) * 360;

            return `${d.color} ${start}deg ${end}deg`;
        })
        .join(', ');

    return (
        <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(${stops})` }} />
            <div className="donut-legend">
                {data.map((d, i) => (
                    <div className="item" key={i}>
                        <span className="sw" style={{ background: d.color }} />
                        {d.label} <b>{d.value}</b>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------------- Horizontal bar list ---------------- */
export function HBarList({ data, fmt }) {
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="hbar-list">
            {data.map((d, i) => (
                <div className="hbar-row" key={i}>
                    <div className="top">
                        <b>{d.label}</b>
                        <span>{fmt ? fmt(d.value) : d.value}</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${(d.value / max) * 100}%`, ...(d.color ? { background: d.color } : {}) }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------------- Tabs ---------------- */
export function Tabs({ tabs, active, onChange }) {
    return (
        <div className="tabs">
            {tabs.map((t) => (
                <button key={t.id} type="button" className={`tab-btn ${t.id === active ? 'active' : ''}`} onClick={() => onChange(t.id)}>
                    {t.label}
                </button>
            ))}
        </div>
    );
}

/* ---------------- KPI card ---------------- */
export function KpiCard({ icon, label, value, trend, color }) {
    return (
        <div className="card kpi-card">
            <div className="kpi-top">
                <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
                    <IconGlyph name={icon} />
                </div>
                {trend != null ? (
                    <span className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
                        <Icon name={trend >= 0 ? 'arrowUp' : 'arrowDown'} />
                        {Math.abs(trend)}%
                    </span>
                ) : null}
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
        </div>
    );
}

/* ---------------- Avatar ---------------- */
export function initials(name) {
    return (name || '?')
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function Avatar({ name, size, photo, className, ...rest }) {
    const classes = ['avatar', photo ? 'has-photo' : '', size || '', className || ''].filter(Boolean).join(' ');

    return (
        <div className={classes} {...rest}>
            {photo ? <img src={photo} alt="" /> : initials(name)}
        </div>
    );
}

/* ---------------- Pagination footer (visual only) ---------------- */
export function Pagination({ total, shown }) {
    return (
        <div className="flex-between" style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-100)', fontSize: '12.3px', color: 'var(--gray-500)' }}>
            <span>
                Showing <b>{shown}</b> of <b>{total}</b> records
            </span>
            <div className="flex-gap">
                <button type="button" className="btn btn-secondary btn-sm" disabled>
                    Previous
                </button>
                <button type="button" className="btn btn-secondary btn-sm">
                    Next
                </button>
            </div>
        </div>
    );
}

/* No EmptyState component on purpose: the prototype emits `.empty-state` inline as
   `<div class="empty-state">${icon('x')}<p>message</p></div>`, with no title element and no
   inner wrapper. Pages reproduce that shape directly so the DOM stays identical. */
