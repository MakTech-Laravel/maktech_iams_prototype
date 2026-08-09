/* Student portal app — ported from the PORTAL_VIEWS switch, portalNavigate()/portalRefresh() and
   portalLogin()'s profile-completion gate in public/prototype/js/portal.js.

   The prototype is a single-page portal with its own navigation, so this one Inertia page hosts every
   screen and PortalLayout renders the shell around whichever screen is active. Screens still read the
   ported fixtures in lib/db.js (this is the static-UI phase), matched to the signed-in student by phone. */

import { useEffect, useState } from 'react';
import PortalLayout from '../../Layouts/PortalLayout';
import { DB, studentById } from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { readPortalPreviewId } from '../../lib/identity';
import Attendance from './portal/Attendance';
import BrowseCourses from './portal/BrowseCourses';
import Certificate from './portal/Certificate';
import Course from './portal/Course';
import IdCard from './portal/IdCard';
import Migration from './portal/Migration';
import Notifications from './portal/Notifications';
import Payments from './portal/Payments';
import PortalDashboard from './portal/PortalDashboard';
import Profile from './portal/Profile';
import { useProfileCompletionModal } from './portal/ProfileCompletionModal';
import Support from './portal/Support';

const PORTAL_VIEWS = {
    dashboard: PortalDashboard,
    browse: BrowseCourses,
    course: Course,
    attendance: Attendance,
    payments: Payments,
    migration: Migration,
    certificate: Certificate,
    idcard: IdCard,
    notifications: Notifications,
    support: Support,
    profile: Profile,
};

export default function Dashboard({ student }) {
    // Preference order: the demo student picked on the login card, then a fixture matching the
    // authenticated phone, then the prototype's own fallback.
    const fixture =
        studentById(readPortalPreviewId('student')) || DB.students.find((s) => s.phone === student.phone) || studentById(1);
    const [view, setView] = useState('dashboard');
    const refresh = useRefresh();
    const openProfileCompletion = useProfileCompletionModal(fixture, refresh);

    useEffect(() => {
        if (fixture.profile_completed) {
            return undefined;
        }

        const timer = setTimeout(openProfileCompletion, 400);

        return () => clearTimeout(timer);
    }, []);

    const Screen = PORTAL_VIEWS[view];

    return (
        <PortalLayout view={view} student={fixture} onNavigate={setView}>
            {Screen ? <Screen student={fixture} onNavigate={setView} refresh={refresh} /> : <p>Not found</p>}
        </PortalLayout>
    );
}
