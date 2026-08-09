/* Teacher portal shell — ported from public/prototype/teacher-portal.html plus
   TP_NAV/buildTpNav/tpNavigate in js/teacherportal.js. */

import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { roleName } from '../lib/db';
import { Avatar, Icon } from '../lib/ui';

export const TP_NAV = [
    {
        id: 'grp-dashboard',
        label: 'Dashboard',
        ic: 'dashboard',
        items: [{ id: 'dashboard', label: 'Dashboard', ic: 'home', sub: "Here's what's happening across your batches today" }],
    },
    {
        id: 'grp-teaching',
        label: 'Teaching',
        ic: 'batch',
        items: [
            { id: 'batches', label: 'My Batches', ic: 'batch', sub: 'Batches assigned to you' },
            { id: 'attendance', label: 'Attendance', ic: 'attendance', sub: 'Mark attendance for your assigned batches' },
            { id: 'students', label: 'My Students', ic: 'students', sub: 'Read-only roster of students in your batches' },
        ],
    },
    {
        id: 'grp-pay',
        label: 'Pay & Account',
        ic: 'graduationCap',
        items: [
            { id: 'payments', label: 'My Payments', ic: 'graduationCap', sub: 'Pay rates, earnings & payment vouchers' },
            { id: 'profile', label: 'Profile', ic: 'user', sub: 'Your account details' },
        ],
    },
];

export function tpGroupForView(viewId) {
    return TP_NAV.find((g) => g.items.some((it) => it.id === viewId));
}

export function tpNavItem(viewId) {
    return TP_NAV.flatMap((g) => g.items).find((it) => it.id === viewId);
}

function Sidebar({ view, onNavigate, open }) {
    const initialGroup = tpGroupForView(view);
    const [expanded, setExpanded] = useState(initialGroup && initialGroup.items.length > 1 ? initialGroup.id : 'grp-dashboard');

    // Navigating into a grouped view opens that group, exactly as tpNavigate() did.
    useEffect(() => {
        const grp = tpGroupForView(view);

        if (grp && grp.items.length > 1) {
            setExpanded(grp.id);
        }
    }, [view]);

    return (
        <aside className={`sidebar ${open ? 'show' : ''}`} id="portalSidebar">
            <div className="sidebar-brand">
                <div className="mark logo-chip">
                    <img src="/prototype/assets/logo.svg" alt="MakTech logo" />
                </div>
                <div className="txt">
                    <b>MakTech IAMS</b>
                    <span>Teacher Portal</span>
                </div>
            </div>

            <nav id="portalNav">
                {TP_NAV.map((group) => {
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

                    return (
                        <div className="nav-group" key={group.id}>
                            <div className={`nav-section ${isExpanded ? 'expanded' : ''}`}>
                                <div
                                    className={`nav-group-header ${hasActive ? 'has-active' : ''}`}
                                    onClick={() => setExpanded(isExpanded ? null : group.id)}
                                >
                                    <Icon name={group.ic} />
                                    <span>{group.label}</span>
                                    <Icon name="chevronRight" cls="chev" />
                                </div>
                                <div className="nav-submenu">
                                    {items.map((it) => (
                                        <div key={it.id} className={`nav-item sub ${it.id === view ? 'active' : ''}`} onClick={() => onNavigate(it.id)}>
                                            <Icon name={it.ic} />
                                            <span>{it.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">Teacher Self-Service Portal &middot; v0.1</div>
        </aside>
    );
}

export default function TeacherPortalLayout({ view, teacher, onNavigate, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const item = tpNavItem(view);
    const pageTitle = item ? item.label : 'Not Found';
    const pageSub = item ? item.sub || '' : '';

    // tpNavigate() closed the mobile sidebar on every navigation.
    useEffect(() => setSidebarOpen(false), [view]);

    return (
        <>
            <Head title={pageTitle} />

            <div className="prototype-banner">
                🧪 <b>Visual Prototype</b> — teacher/coordinator self-service portal demo. &nbsp;|&nbsp;{' '}
                <a href="/admin/dashboard">Open Admin Panel ↗</a> &nbsp;|&nbsp; <a href="/student/dashboard">Student Portal ↗</a>
            </div>

            <div className="app-shell portal-app-shell" id="portalShell">
                <Sidebar view={view} onNavigate={onNavigate} open={sidebarOpen} />

                <div className="main-col">
                    <header className="topbar">
                        <button type="button" className="icon-btn hamburger" id="btnPortalHamburger" onClick={() => setSidebarOpen((v) => !v)}>
                            <Icon name="menu" />
                        </button>
                        <div>
                            <div className="page-title" id="portalPageTitle">
                                {pageTitle}
                            </div>
                            <div className="page-sub" id="portalPageSub">
                                {pageSub}
                            </div>
                        </div>
                        <div className="topbar-right">
                            <div className="user-chip" id="portalUserChip" onClick={() => onNavigate('profile')}>
                                <Avatar name={teacher.name} size="sm" photo={teacher.photo} />
                                <div className="who">
                                    <b id="portalUserName">{teacher.name}</b>
                                    <span id="portalUserCode">{roleName(teacher.role_id)}</span>
                                </div>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.post('/teacher/logout')}>
                                Logout
                            </button>
                        </div>
                    </header>

                    <main className="portal-content" id="portalContent">
                        {children}
                    </main>
                </div>
            </div>
            <div className={`sidebar-scrim ${sidebarOpen ? 'show' : ''}`} id="portalSidebarScrim" onClick={() => setSidebarOpen(false)} />
        </>
    );
}
