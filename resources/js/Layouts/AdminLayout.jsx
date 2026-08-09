/* Admin panel shell — ported from public/prototype/index.html plus buildSidebar/applyIdentity in app.js. */

import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { DB, fmtDate } from '../lib/db';
import { useRefresh } from '../lib/hooks';
import { ROLE_SWITCH_OPTIONS, useIdentity } from '../lib/identity';
import { NAV, VIEW_META, groupForView } from '../lib/nav';
import { Avatar, Icon } from '../lib/ui';
import { useUi } from '../lib/UiProvider';
import { useMyProfileModal } from '../Pages/Admin/admin/MyProfileModal';

function Sidebar({ view, open }) {
    const { userId, can } = useIdentity();
    const initialGroup = groupForView(view);
    const [expanded, setExpanded] = useState(initialGroup && initialGroup.items.length > 1 ? initialGroup.id : null);

    return (
        <aside className={`sidebar ${open ? 'show' : ''}`.trim()}>
            <div className="sidebar-brand">
                <div className="mark logo-chip">
                    <img src="/prototype/assets/logo.svg" alt="MakTech logo" />
                </div>
                <div className="txt">
                    <b>MakTech IAMS</b>
                    <span>Industrial Attachment Management</span>
                </div>
            </div>

            <nav id="nav-root">
                {NAV.map((group) => {
                    const items = group.items.filter((it) => it.mod === null || can(it.mod, 'View'));

                    if (!items.length) {
                        return null;
                    }

                    const hasActive = items.some((it) => it.id === view);

                    // A group with a single item (Dashboard, Reports) renders as a flat link — no accordion.
                    if (items.length === 1) {
                        const it = items[0];
                        const count = it.count ? it.count(userId) : 0;

                        return (
                            <div className="nav-group" key={group.id}>
                                <div className={`nav-item ${it.id === view ? 'active' : ''}`} onClick={() => router.visit(`/admin/${it.id}`)}>
                                    <Icon name={it.ic} />
                                    <span>{it.label}</span>
                                    {it.count ? <span className="badge-count">{count}</span> : null}
                                </div>
                            </div>
                        );
                    }

                    const isExpanded = expanded === group.id;
                    const totalCount = items.reduce((sum, it) => sum + (it.count ? it.count(userId) : 0), 0);

                    return (
                        <div className="nav-group" key={group.id}>
                            <div className={`nav-section ${isExpanded ? 'expanded' : ''}`}>
                                <div
                                    className={`nav-group-header ${hasActive ? 'has-active' : ''}`}
                                    onClick={() => setExpanded(isExpanded ? null : group.id)}
                                >
                                    <Icon name={group.ic} />
                                    <span>{group.label}</span>
                                    {totalCount ? <span className="badge-count">{totalCount}</span> : null}
                                    <Icon name="chevronRight" cls="chev" />
                                </div>
                                <div className="nav-submenu">
                                    {items.map((it) => {
                                        const count = it.count ? it.count(userId) : 0;

                                        return (
                                            <div
                                                key={it.id}
                                                className={`nav-item sub ${it.id === view ? 'active' : ''}`}
                                                onClick={() => router.visit(`/admin/${it.id}`)}
                                            >
                                                <Icon name={it.ic} />
                                                <span>{it.label}</span>
                                                {it.count ? <span className="badge-count">{count}</span> : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">Session: 2025–2026 &middot; v0.1 Prototype</div>
        </aside>
    );
}

/* Portal-only users (Coordinators/Teachers by default) never see the admin panel —
   mirrors renderAdminPanelBlocked() in app.js. */
function AdminPanelBlocked() {
    const { user, roleLabel } = useIdentity();

    return (
        <div className="card card-pad" style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
            <div className="kpi-icon" style={{ width: 56, height: 56, margin: '0 auto 16px', background: 'var(--danger-50)', color: 'var(--danger-600)' }}>
                <Icon name="shield" />
            </div>
            <h2 style={{ marginBottom: 8 }}>Admin Panel Access Restricted</h2>
            <p className="muted" style={{ marginBottom: 22 }}>
                <b>{user.name}</b> ({roleLabel}) doesn't have permission to use this admin panel. Coordinators/Teachers use a dedicated Teacher
                Portal for their batches, attendance, students &amp; payments instead. An Admin can grant this specific person full admin-panel
                access from <b>Access Control</b> if needed.
            </p>
            <a className="btn btn-primary" href="/teacher/dashboard">
                <Icon name="send" /> Open Teacher Portal ↗
            </a>
        </div>
    );
}

export default function AdminLayout({ view, title, sub, children }) {
    const { user, userId, role, roleLabel, setRole, canAccessAdminPanel } = useIdentity();
    const { openModal, closeModal, toast } = useUi();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const refresh = useRefresh();
    // The photo lives on the DB.users row, so the topbar avatar needs a nudge once it changes.
    const openMyProfile = useMyProfileModal(refresh);

    const meta = VIEW_META[view] || {};
    const pageTitle = title ?? meta.title ?? '';
    const pageSub = sub ?? meta.sub ?? '';
    const allowed = canAccessAdminPanel();

    const showNotifications = () =>
        openModal({
            title: 'Notifications',
            sub: 'Recent alerts across the system',
            body: (
                <div className="timeline">
                    {DB.notifications
                        .slice(-6)
                        .reverse()
                        .map((n) => (
                            <div className="timeline-item" key={n.id}>
                                <div className="when">
                                    {fmtDate(n.date)} · {n.channel.toUpperCase()}
                                </div>
                                <div className="what">
                                    {n.recipient} — {n.type.replace(/_/g, ' ')}
                                </div>
                                <div className="who">{n.message}</div>
                            </div>
                        ))}
                </div>
            ),
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
                            router.visit('/admin/notifications');
                        }}
                    >
                        View All
                    </button>
                </>
            ),
        });

    return (
        <>
            <Head title={pageTitle} />

            <div className="prototype-banner">
                🧪 <b>Visual Prototype</b> — click-through demo, no real backend. Data resets on refresh. &nbsp;|&nbsp;{' '}
                <a href="/student/dashboard">Open Student Portal ↗</a> &nbsp;|&nbsp; <a href="/teacher/dashboard">Open Teacher Portal ↗</a>{' '}
                &nbsp;|&nbsp; <a href="/verify">Open Certificate Verify Page ↗</a>
            </div>

            <div className="app-shell">
                {allowed ? <Sidebar view={view} open={sidebarOpen} /> : <aside className="sidebar" />}

                <div className="main-col">
                    <header className="topbar">
                        <button type="button" className="icon-btn hamburger" onClick={() => setSidebarOpen((v) => !v)}>
                            <Icon name="menu" />
                        </button>
                        <div>
                            <div className="page-title">{allowed ? pageTitle : 'Access Restricted'}</div>
                            <div className="page-sub">{allowed ? pageSub : 'This account only has Teacher Portal access'}</div>
                        </div>
                        <div className="topbar-search">
                            <Icon name="search" />
                            <input
                                type="text"
                                placeholder="Search students, leads, invoices, institutions…"
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        toast('Search is a visual placeholder in this prototype');
                                    }
                                }}
                            />
                        </div>
                        <div className="topbar-right">
                            <div className="role-switcher">
                                <select
                                    value={String(role)}
                                    onChange={(event) => {
                                        setRole(event.target.value);
                                        router.visit('/admin/dashboard');
                                    }}
                                >
                                    {ROLE_SWITCH_OPTIONS.map((opt) => (
                                        <option key={opt.role} value={String(opt.role)}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="button" className="icon-btn" onClick={showNotifications}>
                                <span className="dot" />
                                <Icon name="bell" />
                            </button>
                            <div className="user-chip" style={{ cursor: 'pointer' }} title="My Profile" onClick={() => openMyProfile(userId)}>
                                <Avatar name={user.name} size="sm" photo={user.photo} />
                                <div className="who">
                                    <b>{user.name}</b>
                                    <span>{roleLabel}</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="content">{allowed ? children : <AdminPanelBlocked />}</main>
                </div>
            </div>
        </>
    );
}
