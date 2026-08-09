/* Teacher portal — single-page shell from public/prototype/teacher-portal.html, with the active
   screen picked by TP_VIEWS/tpNavigate() in public/prototype/js/teacherportal.js. */

import { useState } from 'react';
import TeacherPortalLayout from '../../Layouts/TeacherPortalLayout';
import { scopedBatchesForUser, teacherByPhone, teacherUsers } from '../../lib/db';
import { readPortalPreviewId } from '../../lib/identity';
import { Icon } from '../../lib/ui';
import AttendanceScreen from './portal/AttendanceScreen';
import BatchesScreen from './portal/BatchesScreen';
import DashboardScreen from './portal/DashboardScreen';
import PaymentsScreen from './portal/PaymentsScreen';
import ProfileScreen from './portal/ProfileScreen';
import StudentsScreen from './portal/StudentsScreen';

/* The portal screens still render from the prototype fixtures, so the signed-in Laravel user is
   matched back onto a fixture teacher: the one picked on the login card, else by phone number. */
function fixtureTeacher(user) {
    const previewed = readPortalPreviewId('teacher');

    return (
        (previewed ? teacherUsers().find((u) => u.id === previewed) : null) ||
        (user?.phone ? teacherByPhone(user.phone) : null) ||
        teacherUsers()[0] ||
        null
    );
}

export default function Dashboard({ user }) {
    const [view, setView] = useState('dashboard');
    const [attBatchId, setAttBatchId] = useState(null);

    const teacher = fixtureTeacher(user);

    const navigate = (nextView, batchId) => {
        if (batchId) {
            setAttBatchId(batchId);
        }

        setView(nextView);
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    if (!teacher) {
        return (
            <div className="empty-state">
                <Icon name="students" />
                <p>No teacher/coordinator account found.</p>
            </div>
        );
    }

    const batches = scopedBatchesForUser(teacher.id);

    let screen = <DashboardScreen teacher={teacher} batches={batches} onNavigate={navigate} />;

    if (view === 'batches') {
        screen = <BatchesScreen teacher={teacher} batches={batches} onNavigate={navigate} />;
    } else if (view === 'attendance') {
        screen = <AttendanceScreen teacher={teacher} batches={batches} batchId={attBatchId} onBatchChange={setAttBatchId} />;
    } else if (view === 'students') {
        screen = <StudentsScreen batches={batches} />;
    } else if (view === 'payments') {
        screen = <PaymentsScreen teacher={teacher} batches={batches} />;
    } else if (view === 'profile') {
        screen = <ProfileScreen teacher={teacher} batches={batches} />;
    }

    return (
        <TeacherPortalLayout view={view} teacher={teacher} onNavigate={navigate}>
            {screen}
        </TeacherPortalLayout>
    );
}
