/* Profile — ported from renderTpProfile(), the photo wiring in tpNavigate() and the
   'tp-remove-photo' action in public/prototype/js/teacherportal.js. */

import { roleName, setUserPhoto } from '../../../lib/db';
import { useRefresh } from '../../../lib/hooks';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import ProfilePhotoBlock from '../../../lib/ProfilePhotoBlock';

export default function ProfileScreen({ teacher, batches }) {
    const { toast } = useUi();
    const refresh = useRefresh();

    const changePhoto = (dataUrl) => {
        setUserPhoto(teacher.id, dataUrl);
        refresh();
        toast('Profile photo updated');
    };

    const removePhoto = () => {
        setUserPhoto(teacher.id, null);
        refresh();
        toast('Profile photo removed');
    };

    return (
        <div className="card card-pad" style={{ maxWidth: 560, textAlign: 'center' }}>
            <ProfilePhotoBlock
                name={teacher.name}
                photo={teacher.photo}
                inputId="tpProfilePhotoInput"
                previewId="tpProfilePhotoPreview"
                onPhoto={changePhoto}
                onRemove={removePhoto}
            />
            <b style={{ display: 'block', margin: '12px 0 2px', fontSize: 15 }}>{teacher.name}</b>
            <span className="cell-sub">{roleName(teacher.role_id)}</span>
            <div className="hr" />
            <div className="form-grid" style={{ textAlign: 'left' }}>
                <div className="field">
                    <label>Phone</label>
                    <div>{teacher.phone}</div>
                </div>
                <div className="field">
                    <label>Email</label>
                    <div>{teacher.email || '—'}</div>
                </div>
                <div className="field span-2">
                    <label>Assigned Batches</label>
                    <div>{batches.map((b) => b.name).join(', ') || '—'}</div>
                </div>
            </div>
            <div className="hr" />
            <div className="badge badge-gray" style={{ whiteSpace: 'normal', textAlign: 'left' }}>
                <Icon name="shield" /> This portal only shows your own batches, students &amp; payments. If you need broader admin-panel access, ask
                an Admin to grant it from Access Control.
            </div>
        </div>
    );
}
