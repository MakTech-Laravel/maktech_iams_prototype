/* Teacher portal login — ported from the auth screen in public/prototype/teacher-portal.html plus
   populateTeacherDemoSelect()/teacherPortalLoginByPhone() in js/teacherportal.js. The prototype logged in
   from the phone number alone; here the same card posts phone + password to Laravel. */

import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { teacherUsers } from '../../../lib/db';
import { setPortalPreviewId } from '../../../lib/identity';

export default function Login() {
    // Prefilled with the seeded demo teacher (DemoAccessSeeder::TEACHER_PHONE) rather than the
    // prototype's fixture number, so the form submits successfully out of the box.
    const { data, setData, post, processing, errors } = useForm({
        phone: '017123456789',
        password: '',
    });
    const [demoTeacherId, setDemoTeacherId] = useState('');

    const submit = (event) => {
        event.preventDefault();
        post('/teacher/login');
    };

    return (
        <>
            <Head title="Teacher Portal" />

            <div className="prototype-banner">
                🧪 <b>Visual Prototype</b> — teacher/coordinator self-service portal demo. &nbsp;|&nbsp;{' '}
                <a href="/admin/dashboard">Open Admin Panel ↗</a> &nbsp;|&nbsp; <a href="/student/dashboard">Student Portal ↗</a>
            </div>

            <div className="auth-shell" id="authScreen">
                <div className="auth-visual">
                    <div>
                        <div className="flex-gap" style={{ marginBottom: 34 }}>
                            <div className="mark logo-chip" style={{ width: 42, height: 42 }}>
                                <img src="/prototype/assets/logo.svg" alt="MakTech logo" />
                            </div>
                            <div>
                                <b style={{ fontSize: 16, display: 'block' }}>MakTech IAMS</b>
                                <span style={{ fontSize: '11.5px', opacity: 0.7 }}>Teacher Portal</span>
                            </div>
                        </div>
                        <h1 style={{ fontSize: 32, lineHeight: 1.3, maxWidth: 420, marginBottom: 14 }}>
                            Your batches, attendance &amp; payments — all in one place.
                        </h1>
                        <p style={{ opacity: 0.8, maxWidth: 400, fontSize: 14 }}>
                            Mark attendance for your classes, keep track of your students, and see exactly what you've earned &amp; been paid — right
                            from your phone.
                        </p>
                    </div>
                    <div className="flex-gap" style={{ gap: 14, flexWrap: 'wrap' }}>
                        <div className="stat-pill">
                            <div>
                                <b>6</b>
                                <span>Coordinators/Teachers</span>
                            </div>
                        </div>
                        <div className="stat-pill">
                            <div>
                                <b>Live</b>
                                <span>Attendance Sync</span>
                            </div>
                        </div>
                        <div className="stat-pill">
                            <div>
                                <b>Auto</b>
                                <span>Earnings Calculator</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="auth-form-side">
                    <form className="auth-card" onSubmit={submit}>
                        <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Teacher / Coordinator Login</h2>
                        <p className="muted" style={{ margin: '0 0 26px', fontSize: 13 }}>
                            Login with your registered phone number.
                        </p>

                        <div className="field" style={{ marginBottom: 14 }}>
                            <label>Phone Number</label>
                            <input
                                type="text"
                                id="tpLoginPhone"
                                placeholder="01722998877"
                                value={data.phone}
                                onChange={(event) => setData('phone', event.target.value)}
                                required
                            />
                            {errors.phone ? (
                                <p className="hint" style={{ color: 'var(--danger-600)', marginTop: 6 }}>
                                    {errors.phone}
                                </p>
                            ) : null}
                        </div>
                        <div className="field" style={{ marginBottom: 14 }}>
                            <label>Password</label>
                            <input
                                type="password"
                                id="tpLoginPassword"
                                placeholder="Your portal password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                required
                            />
                            {errors.password ? (
                                <p className="hint" style={{ color: 'var(--danger-600)', marginTop: 6 }}>
                                    {errors.password}
                                </p>
                            ) : null}
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" id="btnTpLogin" disabled={processing}>
                            Login
                        </button>

                        <div className="hr" />
                        <label className="hint" style={{ fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: 8 }}>
                            Demo: log in as any sample teacher
                        </label>
                        <select
                            id="demoTeacherSelect"
                            className="field"
                            style={{ width: '100%', border: '1px solid var(--gray-200)', borderRadius: 9, padding: '9px 12px', fontSize: 13 }}
                            value={demoTeacherId}
                            onChange={(event) => {
                                setDemoTeacherId(event.target.value);

                                if (event.target.value) {
                                    setPortalPreviewId('teacher', event.target.value);
                                }
                            }}
                        >
                            <option value="">— choose a demo teacher —</option>
                            {teacherUsers().map((u) => (
                                <option key={u.id} value={String(u.id)}>
                                    {u.name} ({u.phone})
                                    {u.status === 'inactive' ? ' — inactive' : ''}
                                </option>
                            ))}
                        </select>
                        <p className="hint" style={{ marginTop: 16 }}>
                            Demo login: <b>017123456789</b> / <b>017123456789</b>. The picker above chooses which sample teacher the portal displays —
                            the fixture teachers have no accounts of their own yet. Admin can grant a specific teacher full Admin Panel access instead
                            of this portal from Access Control.
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}
