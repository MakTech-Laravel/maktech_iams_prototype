/* Profile — ported from renderPortalProfile() plus the profile-photo wiring portalNavigate() attached
   for this view and the 'p-remove-photo' action in the prototype's portal.js. */

import { useState } from 'react';
import { setStudentPhoto } from '../../../lib/db';
import { Icon, IconGlyph, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import ProfilePhotoBlock from '../../../lib/ProfilePhotoBlock';

export default function Profile({ student, refresh }) {
    const s = student;
    const { toast } = useUi();
    const [form, setForm] = useState({
        name: s.name,
        email: s.email || '',
        dob: s.dob,
        present_address: s.present_address,
        permanent_address: s.permanent_address,
        guardian_name: s.guardian_name,
        guardian_phone: s.guardian_phone,
    });

    const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    return (
        <>
            <div className="view-header">
                <div />
                <div className="view-actions">
                    {s.profile_completed ? <StatusBadge status="active" label="Profile Complete" /> : <StatusBadge status="pending" label="Incomplete" />}
                </div>
            </div>
            <div className="grid grid-3" style={{ alignItems: 'start' }}>
                <div className="card card-pad" style={{ textAlign: 'center' }}>
                    <ProfilePhotoBlock
                        name={s.name}
                        photo={s.photo}
                        inputId="pProfilePhotoInput"
                        previewId="pProfilePhotoPreview"
                        onPhoto={(dataUrl) => {
                            setStudentPhoto(s.id, dataUrl);
                            refresh();
                            toast('Profile photo updated');
                        }}
                        onRemove={() => {
                            setStudentPhoto(s.id, null);
                            refresh();
                            toast('Profile photo removed');
                        }}
                    />
                    <b style={{ display: 'block', margin: '12px 0 2px', fontSize: 15 }}>{s.name}</b>
                    <span className="cell-sub">{s.code}</span>
                </div>
                <div className="card card-pad" style={{ gridColumn: 'span 2' }}>
                    <div className="form-grid">
                        <div className="field">
                            <label>Full Name</label>
                            <input type="text" value={form.name} onChange={(event) => setField('name', event.target.value)} />
                        </div>
                        <div className="field">
                            <label>Phone</label>
                            <input type="text" value={s.phone} readOnly />
                        </div>
                        <div className="field">
                            <label>Email</label>
                            <input
                                type="text"
                                value={form.email}
                                placeholder="Add email (optional)"
                                onChange={(event) => setField('email', event.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>Date of Birth</label>
                            <input type="date" value={form.dob} onChange={(event) => setField('dob', event.target.value)} />
                        </div>
                        <div className="field span-2">
                            <label>Present Address</label>
                            <input type="text" value={form.present_address} onChange={(event) => setField('present_address', event.target.value)} />
                        </div>
                        <div className="field span-2">
                            <label>Permanent Address</label>
                            <input type="text" value={form.permanent_address} onChange={(event) => setField('permanent_address', event.target.value)} />
                        </div>
                        <div className="field">
                            <label>Guardian Name</label>
                            <input type="text" value={form.guardian_name} onChange={(event) => setField('guardian_name', event.target.value)} />
                        </div>
                        <div className="field">
                            <label>Guardian Phone</label>
                            <input type="text" value={form.guardian_phone} onChange={(event) => setField('guardian_phone', event.target.value)} />
                        </div>
                    </div>
                    <div className="hr" />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => toast('Profile updated')}>
                        <Icon name="check" /> Save Changes
                    </button>
                </div>
            </div>
            <div className="card mt-16">
                <div className="card-header">
                    <h3>My Documents</h3>
                </div>
                <div className="card-pad grid grid-3">
                    {s.documents.map((d) => (
                        <div className="card card-pad flex-gap" key={d.name}>
                            <div className="kpi-icon" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                                <IconGlyph name="file" />
                            </div>
                            <div>
                                <b style={{ fontSize: '12.5px', display: 'block' }}>{d.name}</b>
                                <span className="cell-sub">{d.type.toUpperCase()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
