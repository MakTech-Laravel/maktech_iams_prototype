/* Add Custom Role modal — ported from addRoleModal() in public/prototype/js/render-admin.js
   (the `save-role` case in app.js closes the modal, toasts and refreshes the view). */

import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export function useAddRoleModal(onSaved) {
    const { openModal, closeModal, toast } = useUi();

    return () =>
        openModal({
            title: 'Add Custom Role',
            sub: 'Create a role and configure granular permissions afterward',
            body: (
                <div className="form-grid single">
                    <div className="field">
                        <label>Role Name *</label>
                        <input type="text" placeholder="e.g. Regional Manager" />
                    </div>
                    <div className="field">
                        <label>Description</label>
                        <textarea placeholder="What can this role access?" />
                    </div>
                </div>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            closeModal();
                            toast('Role created');
                            onSaved?.();
                        }}
                    >
                        <Icon name="check" /> Create Role
                    </button>
                </>
            ),
        });
}
