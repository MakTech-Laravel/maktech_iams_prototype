/* My Profile modal — ported from myProfileModal() in public/prototype/js/render-admin.js.
   The photo picker is the shared lib/ProfilePhotoBlock. */

import { DB, roleName, setUserPhoto } from '../../../lib/db';
import { useRefresh } from '../../../lib/hooks';
import ProfilePhotoBlock from '../../../lib/ProfilePhotoBlock';
import { StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

function MyProfileBody({ userId, onChange }) {
    const refresh = useRefresh();
    const { toast } = useUi();
    const u = DB.users.find((x) => x.id === userId);

    if (!u) {
        return null;
    }

    const apply = (dataUrl, message) => {
        setUserPhoto(userId, dataUrl);
        refresh();
        onChange?.();
        toast(message);
    };

    return (
        <>
            <div style={{ textAlign: 'center', maxWidth: 320, margin: '0 auto' }}>
                <ProfilePhotoBlock
                    name={u.name}
                    photo={u.photo}
                    inputId="myProfilePhotoInput"
                    previewId="myProfilePhotoPreview"
                    onPhoto={(dataUrl) => apply(dataUrl, 'Profile photo updated')}
                    onRemove={() => apply(null, 'Profile photo removed')}
                />
                <b style={{ display: 'block', margin: '14px 0 2px', fontSize: 15 }}>{u.name}</b>
                <span className="cell-sub">{roleName(u.role_id)}</span>
            </div>
            <div className="hr" />
            <div className="form-grid">
                <div className="field">
                    <label>Phone</label>
                    <div>{u.phone || '—'}</div>
                </div>
                <div className="field">
                    <label>Email</label>
                    <div>{u.email || '—'}</div>
                </div>
                <div className="field span-2">
                    <label>Status</label>
                    <div>
                        <StatusBadge status={u.status} />
                    </div>
                </div>
            </div>
        </>
    );
}

export function useMyProfileModal(onChange) {
    const { openModal } = useUi();

    return (userId) => {
        if (!DB.users.some((x) => x.id === userId)) {
            return;
        }

        openModal({
            title: 'My Profile',
            sub: 'Your account details — update your profile photo here',
            body: <MyProfileBody userId={userId} onChange={onChange} />,
        });
    };
}
