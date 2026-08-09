/* First-login profile gate — ported from openProfileCompletionModal() in the prototype's portal.js. */

import { useState } from 'react';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

const DROPZONE_STYLE = {
    border: '1.5px dashed var(--gray-300)',
    borderRadius: 10,
    padding: 14,
    justifyContent: 'center',
    color: 'var(--gray-400)',
};

function ProfileCompletionForm({ student }) {
    const [name, setName] = useState(student.name);
    const [email, setEmail] = useState('');
    const [presentAddress, setPresentAddress] = useState(student.present_address);

    return (
        <div className="form-grid">
            <div className="field">
                <label>Full Name</label>
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="field">
                <label>Email (optional)</label>
                <input type="text" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field span-2">
                <label>Present Address</label>
                <input type="text" value={presentAddress} onChange={(event) => setPresentAddress(event.target.value)} />
            </div>
            <div className="field span-2">
                <label>Upload Photo</label>
                <div className="flex-gap" style={DROPZONE_STYLE}>
                    <Icon name="upload" /> Upload photo (demo)
                </div>
            </div>
            <div className="field span-2">
                <label>Upload NID / Birth Certificate</label>
                <div className="flex-gap" style={DROPZONE_STYLE}>
                    <Icon name="upload" /> Upload document (demo)
                </div>
            </div>
        </div>
    );
}

export function useProfileCompletionModal(student, refresh) {
    const { openModal, closeModal, toast } = useUi();

    return () =>
        openModal({
            size: 'lg',
            title: 'Complete Your Profile',
            sub: 'Please finish setting up your profile before continuing',
            body: <ProfileCompletionForm student={student} />,
            foot: (
                <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => {
                        student.profile_completed = true;
                        closeModal();
                        toast('Profile completed! Welcome aboard.');
                        refresh();
                    }}
                >
                    <Icon name="check" /> Complete Profile
                </button>
            ),
        });
}
