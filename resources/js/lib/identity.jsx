/* Who is "logged in" during the static-UI phase.

   The prototype drives the whole admin panel off a single `currentUserId` plus the role
   switcher in the topbar (app.js: applyIdentity / applyRoleSwitch). Permissions come from
   effectivePerm(), so the sidebar and every page reacts to the switch. Inertia does a full
   page component swap on navigation, so the choice is persisted in sessionStorage to survive
   visits until real authentication replaces it. */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DB, canAccessAdminPanel, canAccessReport, canViewList, effectivePerm, roleName } from './db';

const STORAGE_KEY = 'iams.previewUserId';

/* Mirrors ROLE_USER_MAP in app.js — the demo user shown for each role in the switcher. */
export const ROLE_USER_MAP = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 6, 6: 8, 8: 11 };

export const ROLE_SWITCH_OPTIONS = [
    { role: 1, label: '👑 Super Admin view' },
    { role: 2, label: '🧑‍💼 Admin / Manager view' },
    { role: 3, label: '📣 Marketing Officer view' },
    { role: 4, label: '💰 Accountant view' },
    { role: 5, label: '🎓 Coordinator / Teacher view' },
    { role: 6, label: '🗂️ Front Desk view' },
    { role: 8, label: '🕴️ Managing Director / Boss view' },
];

/* The two portals' equivalent of the role switcher: which fixture student or teacher the ported
   screens display. Both prototype login cards could "log in as any sample account" purely
   client-side; a real session can only carry the one account that actually authenticated, so those
   selects record a preview choice here instead. Remove once portal users have real data of their own. */
const PORTAL_PREVIEW = {
    student: { key: 'iams.portalStudentId', exists: (id) => DB.students.some((s) => s.id === id) },
    teacher: { key: 'iams.portalTeacherId', exists: (id) => DB.users.some((u) => u.id === id) },
};

export function readPortalPreviewId(kind) {
    const conf = PORTAL_PREVIEW[kind];

    if (!conf || typeof window === 'undefined') {
        return null;
    }

    const stored = Number(window.sessionStorage.getItem(conf.key));

    return conf.exists(stored) ? stored : null;
}

export function setPortalPreviewId(kind, id) {
    const conf = PORTAL_PREVIEW[kind];

    if (conf && typeof window !== 'undefined') {
        window.sessionStorage.setItem(conf.key, String(Number(id)));
    }
}

const IdentityContext = createContext(null);

export function useIdentity() {
    const ctx = useContext(IdentityContext);

    if (!ctx) {
        throw new Error('useIdentity must be used inside <IdentityProvider>');
    }

    return ctx;
}

function readStoredUserId() {
    if (typeof window === 'undefined') {
        return 1;
    }

    const stored = Number(window.sessionStorage.getItem(STORAGE_KEY));

    return DB.users.some((u) => u.id === stored) ? stored : 1;
}

export function IdentityProvider({ children }) {
    const [userId, setUserId] = useState(readStoredUserId);

    const setUser = useCallback((id) => {
        const next = Number(id);
        setUserId(next);

        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(STORAGE_KEY, String(next));
        }
    }, []);

    const value = useMemo(() => {
        const user = DB.users.find((u) => u.id === userId) || DB.users[0];

        return {
            user,
            userId: user.id,
            role: user.role_id,
            roleLabel: roleName(user.role_id),
            setUser,
            setRole: (roleId) => setUser(ROLE_USER_MAP[Number(roleId)] ?? DB.users[0].id),
            can: (mod, action) => effectivePerm(user.id, mod, action),
            canList: (mod, key) => canViewList(user.id, mod, key),
            canReport: (reportId) => canAccessReport(user.id, reportId),
            canAccessAdminPanel: () => canAccessAdminPanel(user.id),
        };
    }, [userId, setUser]);

    return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}
