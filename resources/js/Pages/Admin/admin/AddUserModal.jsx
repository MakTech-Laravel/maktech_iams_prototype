/* Add Staff User modal — ported from addUserModal() in public/prototype/js/render-admin.js
   (the `save-user` case in app.js closes the modal, toasts and refreshes the view). */

import { DB } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export function useAddUserModal(onSaved) {
    const { openModal, closeModal, toast } = useUi();

    return () =>
        openModal({
            title: 'Add Staff User',
            sub: 'Create a new system user account',
            body: (
                <div className="form-grid">
                    <div className="field span-2">
                        <label>Full Name *</label>
                        <input type="text" />
                    </div>
                    <div className="field">
                        <label>Email *</label>
                        <input type="text" />
                    </div>
                    <div className="field">
                        <label>Phone *</label>
                        <input type="text" />
                    </div>
                    <div className="field">
                        <label>Role *</label>
                        <select>
                            {DB.roles.map((r) => (
                                <option key={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Status</label>
                        <select>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                    </div>
                    <div className="field span-2">
                        <label>Temporary Password</label>
                        <input type="text" defaultValue="MakTech@12345" readOnly />
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
                            toast('User created & credentials sent');
                            onSaved?.();
                        }}
                    >
                        <Icon name="check" /> Create User
                    </button>
                </>
            ),
        });
}
