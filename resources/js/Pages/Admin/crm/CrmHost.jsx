/* One place for every CRM `data-action` the prototype's app.js click-delegation switch handled.

   A page calls useCrmHost(), renders `host` somewhere in its tree (it paints nothing itself) and wires
   `actions` to the buttons and rows that used to carry data-action attributes. Keeping the dialogs here
   means Leads, Pipeline and Follow-ups all reach the same lead drawer and contact-log modal, exactly as
   they shared one global handler in the prototype. */

import { useMemo, useRef, useState } from 'react';
import { DB, markFollowupDone } from '../../../lib/db';
import { useRefresh } from '../../../lib/hooks';
import { useIdentity } from '../../../lib/identity';
import { useUi } from '../../../lib/UiProvider';
import AddInstitutionModal from './AddInstitutionModal';
import AddLeadModal from './AddLeadModal';
import AddOnlineSessionModal from './AddOnlineSessionModal';
import AddVisitModal from './AddVisitModal';
import CompleteOnlineSessionModal from './CompleteOnlineSessionModal';
import ContactLogModal from './ContactLogModal';
import GenericFollowupModal from './GenericFollowupModal';
import InstitutionDetailDrawer from './InstitutionDetailDrawer';
import LeadDetailDrawer from './LeadDetailDrawer';
import LeadImportWizard from './LeadImportWizard';
import ScheduleFollowupModal from './ScheduleFollowupModal';
import { useStudentDrawer } from '../students/StudentProfileDrawer';

export function useCrmHost() {
    const { closeModal, closeDrawer, toast } = useUi();
    const { userId, can } = useIdentity();
    const refresh = useRefresh();
    const openStudentDrawer = useStudentDrawer(refresh);
    const [tick, setTick] = useState(0);
    const [drawer, setDrawer] = useState(null);
    const [modal, setModal] = useState(null);
    const seq = useRef(0);

    const actions = useMemo(() => {
        const nextSeq = () => (seq.current += 1);
        const showModal = (kind, props) => setModal({ kind, seq: nextSeq(), ...props });
        const showDrawer = (kind, id) => setDrawer({ kind, id, seq: nextSeq() });

        const a = {
            /* The prototype's refreshCurrentView() — re-reads the mutated DB into every open surface. */
            bump: () => {
                setTick((t) => t + 1);
                refresh();
            },
            dismiss: () => {
                closeModal();
                setModal(null);
            },
            viewLead: (id) => {
                a.dismiss();
                showDrawer('lead', id);
            },
            addLead: () => showModal('add-lead'),
            leadImport: () => {
                if (!can('Leads/CRM', 'Create')) {
                    toast("You don't have permission to add leads", 'error');

                    return;
                }

                showModal('lead-import');
            },
            contactLog: (leadId, presetStatus, followupId) => showModal('contact-log', { leadId, presetStatus, followupId }),
            completeFollowup: (id) => {
                const f = DB.followUps.find((x) => x.id === id);

                if (!f) {
                    toast('Follow-up not found', 'error');

                    return;
                }

                if (f.lead_id) {
                    a.contactLog(f.lead_id, null, f.id);
                } else {
                    markFollowupDone(f.id, userId);
                    toast('Follow-up marked done');
                    a.bump();
                }
            },
            scheduleFollowup: (leadId) => {
                closeDrawer();
                setDrawer(null);
                showModal('schedule-followup', { leadId });
            },
            addFollowupGeneric: () => showModal('generic-followup'),
            addVisit: () => showModal('add-visit'),
            addOnlineSession: () => showModal('add-online-session'),
            completeOnlineSession: (id) => showModal('complete-online-session', { id }),
            cancelOnlineSession: (id) => {
                const s = DB.onlineSessions.find((x) => x.id === id);

                if (s) {
                    s.status = 'cancelled';
                    toast('Session cancelled', 'error');
                    a.bump();
                }
            },
            viewInstitution: (id) => showDrawer('institution', id),
            addInstitution: () => showModal('add-institution'),
            /* The institution drawer lists that institute's students; the prototype's `view-student`
               swapped the open drawer for the student profile one. */
            viewStudent: (id) => {
                a.dismiss();
                openStudentDrawer(id);
            },
        };

        return a;
    }, [can, closeDrawer, closeModal, openStudentDrawer, refresh, toast, userId]);

    const host = (
        <>
            {drawer && drawer.kind === 'lead' ? (
                <LeadDetailDrawer key={`drawer-${drawer.seq}`} id={drawer.id} tick={tick} actions={actions} />
            ) : null}
            {drawer && drawer.kind === 'institution' ? (
                <InstitutionDetailDrawer key={`drawer-${drawer.seq}`} id={drawer.id} tick={tick} actions={actions} />
            ) : null}

            {modal && modal.kind === 'add-lead' ? <AddLeadModal key={`modal-${modal.seq}`} actions={actions} /> : null}
            {modal && modal.kind === 'lead-import' ? <LeadImportWizard key={`modal-${modal.seq}`} actions={actions} /> : null}
            {modal && modal.kind === 'contact-log' ? (
                <ContactLogModal
                    key={`modal-${modal.seq}`}
                    leadId={modal.leadId}
                    presetStatus={modal.presetStatus}
                    followupId={modal.followupId}
                    actions={actions}
                />
            ) : null}
            {modal && modal.kind === 'schedule-followup' ? (
                <ScheduleFollowupModal key={`modal-${modal.seq}`} leadId={modal.leadId} actions={actions} />
            ) : null}
            {modal && modal.kind === 'generic-followup' ? <GenericFollowupModal key={`modal-${modal.seq}`} actions={actions} /> : null}
            {modal && modal.kind === 'add-visit' ? <AddVisitModal key={`modal-${modal.seq}`} actions={actions} /> : null}
            {modal && modal.kind === 'add-online-session' ? <AddOnlineSessionModal key={`modal-${modal.seq}`} actions={actions} /> : null}
            {modal && modal.kind === 'complete-online-session' ? (
                <CompleteOnlineSessionModal key={`modal-${modal.seq}`} id={modal.id} actions={actions} />
            ) : null}
            {modal && modal.kind === 'add-institution' ? <AddInstitutionModal key={`modal-${modal.seq}`} actions={actions} /> : null}
        </>
    );

    return { host, actions, tick };
}
