/* Single dispatcher for every academic `data-action` the prototype handled in app.js's global click
   delegation. The Courses / Sessions / Batches screens open each other's modals (a course opens a
   session, a session opens a batch, a batch links back to its course), so all of them share one
   context object instead of importing each other. */

import { router } from '@inertiajs/react';
import { useRefresh } from '../../../lib/hooks';
import { useIdentity } from '../../../lib/identity';
import { useUi } from '../../../lib/UiProvider';
import { openAddBatchModal } from './AddBatchModal';
import { openAddCourseModal } from './AddCourseModal';
import { openAddDepartmentModal } from './AddDepartmentModal';
import { openAddSessionModal } from './AddSessionModal';
import { openBatchDetailModal } from './BatchDetailModal';
import { openCourseDetailModal } from './CourseDetailModal';
import { openCurriculumModal } from './CurriculumModal';
import { openEditBatchModal } from './EditBatchModal';
import { openEditCourseModal } from './EditCourseModal';
import { openAddLabModal, openEditLabModal } from './LabModals';
import { openManageTeachersModal } from './ManageTeachersModal';
import { openSessionDetailModal } from './SessionDetailModal';
import { useStudentDrawer } from '../students/StudentProfileDrawer';
import { useSetPayRateModal } from '../teacherpay/PayRateForm';

export function useAcademicModals() {
    const { openModal, closeModal, toast } = useUi();
    const { userId, can } = useIdentity();
    const refresh = useRefresh();
    // Both of these are owned by sibling modules but reachable from academic screens: the batch
    // roster opens a student, and Manage Teachers sets a pay rate.
    const openStudentDrawer = useStudentDrawer(refresh);
    const openSetPayRate = useSetPayRateModal(refresh);

    const ctx = { openModal, closeModal, toast, refresh, userId, can };

    const actions = {
        viewStudent: (id, tab) => openStudentDrawer(id, tab),
        setPayRate: (teacherId, batchId) => openSetPayRate(teacherId, batchId),
        viewCourse: (id) => openCourseDetailModal(ctx, id),
        addCourse: () => openAddCourseModal(ctx),
        editCourse: (id) => openEditCourseModal(ctx, id),
        manageCurriculum: (id) => openCurriculumModal(ctx, id),
        addDepartment: () => openAddDepartmentModal(ctx),
        viewSession: (id) => openSessionDetailModal(ctx, id),
        addSession: (courseId) => openAddSessionModal(ctx, courseId),
        viewBatch: (id) => openBatchDetailModal(ctx, id),
        addBatch: (sessionId) => openAddBatchModal(ctx, sessionId),
        editBatch: (id) => openEditBatchModal(ctx, id),
        manageTeachers: (id) => openManageTeachersModal(ctx, id),
        addLab: () => openAddLabModal(ctx),
        editLab: (id) => openEditLabModal(ctx, id),
        /* The prototype's `go-view`. The modal host lives above the Inertia page component, so the
           modal has to be dismissed explicitly before leaving the current screen. */
        goView: (viewId) => {
            closeModal();
            router.visit(`/admin/${viewId}`);
        },
    };

    ctx.actions = actions;

    return actions;
}
