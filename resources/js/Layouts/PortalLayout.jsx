/* Student portal shell — ported from public/prototype/portal.html plus PORTAL_NAV, buildPortalNav()
   and portalNavigate() in js/portal.js. The portal keeps its own internal navigation, so the active
   screen is chosen by the page that renders this layout. */

import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { invoiceForStudent } from '../lib/db';
import { Avatar, Icon } from '../lib/ui';

/* Grouped sidebar nav (mirrors the Admin Panel's collapsible NAV/buildSidebar pattern) —
   new pages just slot into an existing group (or a new one), so the header never has to grow again. */
export const PORTAL_NAV = [
    {
        id: 'grp-dashboard', label: 'Dashboard', ic: 'dashboard', items: [
            { id: 'dashboard', label: 'Dashboard', ic: 'home', sub: "Here's what's happening with your enrollment today" },
        ],
    },
    {
        id: 'grp-learning', label: 'My Learning', ic: 'bookOpen', items: [
            { id: 'browse', label: 'Browse Courses', ic: 'course', sub: 'Pick a session & batch, then pay online or request enrollment' },
            { id: 'course', label: 'My Course', ic: 'bookOpen', sub: 'Module-by-module progress for your enrolled course' },
            { id: 'attendance', label: 'Attendance', ic: 'attendance', sub: 'Your session-wise attendance record' },
            { id: 'migration', label: 'Migration', ic: 'swap', sub: 'Request to transfer to a different course or batch' },
        ],
    },
    {
        id: 'grp-finance', label: 'Finance & Documents', ic: 'payment', items: [
            {
                id: 'payments', label: 'Payments', ic: 'payment', sub: 'Fee invoice, due amount & payment history',
                count: (studentId) => {
                    const inv = invoiceForStudent(studentId);

                    return inv && inv.due > 0 ? 1 : 0;
                },
            },
            { id: 'certificate', label: 'Certificate', ic: 'certificate', sub: 'Download your QR-verifiable certificate' },
            { id: 'idcard', label: 'ID Card', ic: 'idcard', sub: 'Your digital student ID card' },
        ],
    },
    {
        id: 'grp-account', label: 'Account', ic: 'user', items: [
            { id: 'notifications', label: 'Notifications', ic: 'notification', sub: 'SMS / Email / Portal messages sent to you' },
            { id: 'support', label: 'Support', ic: 'ticket', sub: 'Raise a ticket or contact the office' },
            { id: 'profile', label: 'Profile', ic: 'user', sub: 'Personal information & documents' },
        ],
    },
];

export function portalGroupForView(viewId) {
    return PORTAL_NAV.find((g) => g.items.some((it) => it.id === viewId));
}

export function portalNavItem(viewId) {
    return PORTAL_NAV.flatMap((g) => g.items).find((it) => it.id === viewId);
}

function Sidebar({ view, studentId, open, onNavigate }) {
    const [expanded, setExpanded] = useState('grp-dashboard');

    // portalNavigate() re-expanded the group owning the view on every jump (single-item groups leave it untouched).
    useEffect(() => {
        const group = portalGroupForView(view);

        if (group && group.items.length > 1) {
            setExpanded(group.id);
        }
    }, [view]);

    return (
        <aside className={`sidebar ${open ? 'show' : ''}`.trim()} id="portalSidebar">
            <div className="sidebar-brand">
                <div className="mark logo-chip">
                    <img src="/prototype/assets/logo.svg" alt="MakTech logo" />
                </div>
                <div className="txt">
                    <b>MakTech IAMS</b>
                    <span>Student Portal</span>
                </div>
            </div>

            <nav id="portalNav">
                {PORTAL_NAV.map((group) => {
                    const items = group.items;
                    const hasActive = items.some((it) => it.id === view);

                    if (items.length === 1) {
                        const it = items[0];

                        return (
                            <div className="nav-group" key={group.id}>
                                <div className={`nav-item ${it.id === view ? 'active' : ''}`} onClick={() => onNavigate(it.id)}>
                                    <Icon name={it.ic} />
                                    <span>{it.label}</span>
                                </div>
                            </div>
                        );
                    }

                    const isExpanded = expanded === group.id;
                    const totalCount = items.reduce((sum, it) => sum + (it.count ? it.count(studentId) : 0), 0);

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
                                        const count = it.count ? it.count(studentId) : 0;

                                        return (
                                            <div
                                                key={it.id}
                                                className={`nav-item sub ${it.id === view ? 'active' : ''}`}
                                                onClick={() => onNavigate(it.id)}
                                            >
                                                <Icon name={it.ic} />
                                                <span>{it.label}</span>
                                                {count ? <span className="badge-count">{count}</span> : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">Student Self-Service Portal &middot; v0.1</div>
        </aside>
    );
}

export default function PortalLayout({ view, student, onNavigate, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const item = portalNavItem(view);
    const pageTitle = item ? item.label : 'Not Found';
    const pageSub = item ? item.sub || '' : '';

    // portalNavigate() also scrolled back to the top and closed the mobile sidebar on every jump.
    const navigate = (next) => {
        onNavigate(next);
        window.scrollTo({ top: 0, behavior: 'instant' });
        setSidebarOpen(false);
    };

    return (
        <>
            <Head title={pageTitle} />

            <div className="prototype-banner">
                🧪 <b>Visual Prototype</b> — student self-service portal demo. &nbsp;|&nbsp; <a href="/admin/dashboard">Open Admin Panel ↗</a>{' '}
                &nbsp;|&nbsp; <a href="/teacher/dashboard">Teacher Portal ↗</a> &nbsp;|&nbsp; <a href="/verify">Certificate Verify Page ↗</a>
            </div>

            <div className="app-shell portal-app-shell">
                <Sidebar view={view} studentId={student.id} open={sidebarOpen} onNavigate={navigate} />

                <div className="main-col">
                    <header className="topbar">
                        <button type="button" className="icon-btn hamburger" onClick={() => setSidebarOpen((v) => !v)}>
                            <Icon name="menu" />
                        </button>
                        <div>
                            <div className="page-title" id="portalPageTitle">{pageTitle}</div>
                            <div className="page-sub" id="portalPageSub">{pageSub}</div>
                        </div>
                        <div className="topbar-right">
                            {/* portal.js never injects an icon into this bell — only the unread dot. */}
                            <button type="button" className="icon-btn" onClick={() => navigate('notifications')}>
                                <span className="dot" />
                            </button>
                            <div className="user-chip" onClick={() => navigate('profile')}>
                                <Avatar name={student.name} size="sm" photo={student.photo} />
                                <div className="who">
                                    <b>{student.name}</b>
                                    <span>{student.code}</span>
                                </div>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.post('/student/logout')}>
                                Logout
                            </button>
                        </div>
                    </header>

                    <main className="portal-content" id="portalContent">{children}</main>
                </div>
            </div>
            <div className={`sidebar-scrim ${sidebarOpen ? 'show' : ''}`.trim()} onClick={() => setSidebarOpen(false)} />
        </>
    );
}
