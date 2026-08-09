/* Student login / self-registration — ported from the auth screen in public/prototype/portal.html
   plus populateDemoSelect(), showAuthPane() and the "Create Account" handler in js/portal.js.

   The login pane posts for real to /student/login (phone + portal password) instead of running the
   prototype's fake OTP round-trip; the signup pane stays client-side on the fixtures, exactly as the
   prototype had it. */

import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { DB, STUDENT_STATUS_LABELS, selfRegisterStudent } from '../../../lib/db';
import { setPortalPreviewId } from '../../../lib/identity';
import { useUi } from '../../../lib/UiProvider';

export default function Login() {
    const { toast } = useUi();
    // Prefilled with the seeded demo student (DemoAccessSeeder::STUDENT_PHONE) rather than the
    // prototype's fixture number, so the form submits successfully out of the box.
    const { data, setData, post, processing, errors } = useForm({ phone: '017123456789', password: '' });
    const [pane, setPane] = useState('login');
    const [demoStudentId, setDemoStudentId] = useState('');
    const [signup, setSignup] = useState({ name: '', phone: '', email: '' });

    const submitLogin = (event) => {
        event.preventDefault();
        post('/student/login');
    };

    const createAccount = () => {
        const name = signup.name.trim();
        const phone = signup.phone.trim();
        const email = signup.email.trim();

        if (!name || !phone) {
            toast('Please enter your name and phone number', 'error');

            return;
        }

        selfRegisterStudent({ name, phone, email });
        toast('Account created — welcome to MakTech IAMS!');
        setData('phone', phone);
        setPane('login');
    };

    return (
        <>
            <Head title="Student Login" />

            <div className="prototype-banner">
                🧪 <b>Visual Prototype</b> — student self-service portal demo. &nbsp;|&nbsp; <a href="/admin/dashboard">Open Admin Panel ↗</a>{' '}
                &nbsp;|&nbsp; <a href="/teacher/dashboard">Teacher Portal ↗</a> &nbsp;|&nbsp; <a href="/verify">Certificate Verify Page ↗</a>
            </div>

            <div className="auth-shell">
                <div className="auth-visual">
                    <div>
                        <div className="flex-gap" style={{ marginBottom: 34 }}>
                            <div className="mark logo-chip" style={{ width: 42, height: 42 }}>
                                <img src="/prototype/assets/logo.svg" alt="MakTech logo" />
                            </div>
                            <div>
                                <b style={{ fontSize: 16, display: 'block' }}>MakTech IAMS</b>
                                <span style={{ fontSize: '11.5px', opacity: 0.7 }}>Student Portal</span>
                            </div>
                        </div>
                        <h1 style={{ fontSize: 32, lineHeight: 1.3, maxWidth: 420, marginBottom: 14 }}>
                            Your courses, attendance & payments — all in one place.
                        </h1>
                        <p style={{ opacity: 0.8, maxWidth: 400, fontSize: 14 }}>
                            Track module progress, pay fees online via bKash/Nagad/Rocket, download your certificate & digital ID card — right from
                            your phone.
                        </p>
                    </div>
                    <div className="flex-gap" style={{ gap: 14, flexWrap: 'wrap' }}>
                        <div className="stat-pill">
                            <div>
                                <b>8</b>
                                <span>Active Courses</span>
                            </div>
                        </div>
                        <div className="stat-pill">
                            <div>
                                <b>92%</b>
                                <span>Avg Attendance</span>
                            </div>
                        </div>
                        <div className="stat-pill">
                            <div>
                                <b>1,240+</b>
                                <span>Certified Alumni</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="auth-form-side">
                    <div className="auth-card">
                        <div className="auth-toggle">
                            <button type="button" className={`auth-toggle-btn ${pane === 'login' ? 'active' : ''}`.trim()} onClick={() => setPane('login')}>
                                Login
                            </button>
                            <button
                                type="button"
                                className={`auth-toggle-btn ${pane === 'signup' ? 'active' : ''}`.trim()}
                                onClick={() => setPane('signup')}
                            >
                                Create Account
                            </button>
                        </div>

                        <div style={{ display: pane === 'login' ? 'block' : 'none' }}>
                            <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Student Login</h2>
                            <p className="muted" style={{ margin: '0 0 26px', fontSize: 13 }}>
                                Login with your phone number. Email is optional.
                            </p>

                            <form onSubmit={submitLogin}>
                                <div className="field" style={{ marginBottom: 14 }}>
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="01712340006"
                                        value={data.phone}
                                        onChange={(event) => setData('phone', event.target.value)}
                                        required
                                    />
                                    {errors.phone ? (
                                        <span className="hint" style={{ color: 'var(--danger-600)' }}>
                                            {errors.phone}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="field" style={{ marginBottom: 14 }}>
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        placeholder="Your portal password"
                                        value={data.password}
                                        onChange={(event) => setData('password', event.target.value)}
                                        required
                                    />
                                    {errors.password ? (
                                        <span className="hint" style={{ color: 'var(--danger-600)' }}>
                                            {errors.password}
                                        </span>
                                    ) : null}
                                </div>
                                <button type="submit" className="btn btn-primary btn-block" disabled={processing}>
                                    Login
                                </button>
                            </form>

                            <div className="hr" />
                            <label className="hint" style={{ fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: 8 }}>
                                Demo: log in as any sample student
                            </label>
                            <select
                                className="field"
                                style={{ width: '100%', border: '1px solid var(--gray-200)', borderRadius: 9, padding: '9px 12px', fontSize: 13 }}
                                value={demoStudentId}
                                onChange={(event) => {
                                    const demo = DB.students.find((s) => String(s.id) === event.target.value);
                                    setDemoStudentId(event.target.value);

                                    if (demo) {
                                        setPortalPreviewId('student', demo.id);
                                    }
                                }}
                            >
                                <option value="">— choose a demo student —</option>
                                {DB.students.map((s) => (
                                    <option key={s.id} value={String(s.id)}>
                                        {s.name} ({s.code}) — {STUDENT_STATUS_LABELS[s.status]}
                                    </option>
                                ))}
                            </select>
                            <p className="hint" style={{ marginTop: 16 }}>
                                Demo login: <b>017123456789</b> / <b>017123456789</b>. The picker above chooses which sample student the portal
                                displays — the fixture students have no accounts of their own yet.
                            </p>
                        </div>

                        <div style={{ display: pane === 'signup' ? 'block' : 'none' }}>
                            <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Create Your Account</h2>
                            <p className="muted" style={{ margin: '0 0 22px', fontSize: 13 }}>
                                Register once, then browse courses and enroll for your industrial attachment.
                            </p>
                            <div className="field" style={{ marginBottom: 12 }}>
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    placeholder="Your full name"
                                    value={signup.name}
                                    onChange={(event) => setSignup((current) => ({ ...current, name: event.target.value }))}
                                />
                            </div>
                            <div className="field" style={{ marginBottom: 12 }}>
                                <label>Phone Number *</label>
                                <input
                                    type="text"
                                    placeholder="01XXXXXXXXX"
                                    value={signup.phone}
                                    onChange={(event) => setSignup((current) => ({ ...current, phone: event.target.value }))}
                                />
                            </div>
                            <div className="field" style={{ marginBottom: 16 }}>
                                <label>Email (optional)</label>
                                <input
                                    type="text"
                                    placeholder="you@example.com"
                                    value={signup.email}
                                    onChange={(event) => setSignup((current) => ({ ...current, email: event.target.value }))}
                                />
                            </div>
                            <button type="button" className="btn btn-primary btn-block" onClick={createAccount}>
                                Create Account & Continue
                            </button>
                            <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
                                By continuing you agree this is a demo prototype — no real OTP/verification is sent.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
