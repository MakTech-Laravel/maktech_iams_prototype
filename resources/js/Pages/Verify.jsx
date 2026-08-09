/* Public certificate verification — ported from public/prototype/verify.html (page shell,
   page-local styles and the doVerify() lookup against DB.certificates). */

import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { DB, courseName, fmtDate, studentById } from '../lib/db';
import { IconGlyph } from '../lib/ui';

/* verify.html carried its own <style> block (these classes are not part of theme.css/portal.css),
   so it is ported verbatim. */
const VERIFY_CSS = `
  body{ background:var(--bg-app); }
  .verify-shell{ min-height:calc(100vh - var(--banner-h)); display:flex; flex-direction:column; align-items:center; }
  .verify-topbar{ width:100%; background:#fff; border-bottom:1px solid var(--gray-200); padding:16px 26px; display:flex; align-items:center; gap:10px; }
  .verify-main{ max-width:640px; width:100%; padding:50px 20px; }
  .verify-search-card{ background:#fff; border-radius:20px; padding:32px 30px; box-shadow:var(--shadow-md); text-align:center; }
  .verify-result{ margin-top:22px; }
  .big-icon{ width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
  .big-icon svg{ width:28px; height:28px; }
`;

function VerifiedResult({ cert }) {
    const s = studentById(cert.student_id);

    return (
        <>
            <div className="big-icon" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                <IconGlyph name="checkCircle" />
            </div>
            <h3 style={{ margin: '0 0 4px', color: 'var(--success-700)', fontSize: 16 }}>Certificate Verified ✓</h3>
            <p className="muted" style={{ fontSize: '12.5px', margin: '0 0 18px' }}>
                This is a genuine certificate issued by MakTech IAMS.
            </p>
            <div className="card card-pad" style={{ textAlign: 'left' }}>
                <div className="form-grid single" style={{ gap: 10 }}>
                    <div className="flex-between">
                        <span className="muted" style={{ fontSize: '12.5px' }}>
                            Student Name
                        </span>
                        <b>{s.name}</b>
                    </div>
                    <div className="flex-between">
                        <span className="muted" style={{ fontSize: '12.5px' }}>
                            Course
                        </span>
                        <b>{courseName(cert.course_id)}</b>
                    </div>
                    <div className="flex-between">
                        <span className="muted" style={{ fontSize: '12.5px' }}>
                            Certificate No.
                        </span>
                        <b>{cert.cert_no}</b>
                    </div>
                    <div className="flex-between">
                        <span className="muted" style={{ fontSize: '12.5px' }}>
                            Issue Date
                        </span>
                        <b>{fmtDate(cert.issue_date)}</b>
                    </div>
                    <div className="flex-between">
                        <span className="muted" style={{ fontSize: '12.5px' }}>
                            Status
                        </span>
                        <span className="badge badge-green">Valid</span>
                    </div>
                </div>
            </div>
        </>
    );
}

function NotFoundResult({ query }) {
    return (
        <>
            <div className="big-icon" style={{ background: 'var(--danger-50)', color: 'var(--danger-600)' }}>
                <IconGlyph name="alertCircle" />
            </div>
            <h3 style={{ margin: '0 0 4px', color: 'var(--danger-700)', fontSize: 16 }}>Certificate Not Found</h3>
            <p className="muted" style={{ fontSize: '12.5px', margin: 0 }}>
                We couldn't verify "<b>{query}</b>". Please check the certificate number and try again, or contact the issuing office.
            </p>
        </>
    );
}

export default function Verify() {
    const [certNo, setCertNo] = useState('');
    const [result, setResult] = useState(null);

    const doVerify = () => {
        const val = certNo.trim();

        if (!val) {
            setResult(null);

            return;
        }

        const cert = DB.certificates.find((c) => c.cert_no && c.cert_no.toLowerCase() === val.toLowerCase());

        setResult(cert ? { cert } : { query: val });
    };

    return (
        <>
            <Head title="Certificate Verification" />
            <style>{VERIFY_CSS}</style>

            <div className="prototype-banner">
                🧪 <b>Visual Prototype</b> — public certificate verification page. &nbsp;|&nbsp; <a href="/admin/dashboard">Admin Panel ↗</a>{' '}
                &nbsp;|&nbsp; <a href="/student/dashboard">Student Portal ↗</a>
            </div>

            <div className="verify-shell">
                <div className="verify-topbar">
                    <div className="mark logo-chip" style={{ width: 34, height: 34 }}>
                        <img src="/prototype/assets/logo.svg" alt="MakTech logo" />
                    </div>
                    <b style={{ fontSize: '14.5px' }}>MakTech IAMS — Certificate Verification</b>
                </div>

                <div className="verify-main">
                    <div className="verify-search-card">
                        <div
                            className="kpi-icon"
                            id="qrIconWrap"
                            style={{ width: 52, height: 52, background: 'var(--primary-50)', color: 'var(--primary-600)', margin: '0 auto 16px' }}
                        >
                            <IconGlyph name="qr" />
                        </div>
                        <h2 style={{ margin: '0 0 6px', fontSize: 19 }}>Verify a Certificate</h2>
                        <p className="muted" style={{ fontSize: 13, margin: '0 0 22px' }}>
                            Scan the QR code on the certificate, or enter the certificate number below to confirm its authenticity.
                        </p>
                        <div className="flex-gap" style={{ maxWidth: 420, margin: '0 auto' }}>
                            <input
                                type="text"
                                id="certInput"
                                placeholder="e.g. MT-CERT-2026-0001"
                                style={{ flex: 1, border: '1px solid var(--gray-200)', borderRadius: 10, padding: '11px 14px', fontSize: '13.5px' }}
                                value={certNo}
                                onChange={(event) => setCertNo(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        doVerify();
                                    }
                                }}
                            />
                            <button type="button" className="btn btn-primary" id="btnVerify" onClick={doVerify}>
                                Verify
                            </button>
                        </div>
                        <p className="hint" style={{ marginTop: 10 }}>
                            Try: <code>MT-CERT-2026-0001</code> (valid) or <code>MT-CERT-9999-0000</code> (invalid)
                        </p>
                        <div className="verify-result" id="verifyResult">
                            {result ? result.cert ? <VerifiedResult cert={result.cert} /> : <NotFoundResult query={result.query} /> : null}
                        </div>
                    </div>

                    <div className="card card-pad mt-16" style={{ textAlign: 'center' }}>
                        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                            This public page lets employers, institutes and third parties confirm that a certificate issued by{' '}
                            <b>MakTech Industrial Attachment Institute</b> is genuine, without needing to contact the office directly.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
