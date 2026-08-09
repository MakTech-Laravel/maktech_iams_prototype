/* Certificate sheet and student ID card artwork — ported from certificateTemplatePreview()
   and idCardPreview() in the prototype's render-certificates.js. Shared by the admin
   Certificates/ID Cards pages and the student portal. */

import { DB, courseName, fmtDate } from './db';
import { initials } from './ui';

export function CertificateSheet({ studentName, courseName: course, certNo, date }) {
    return (
        <div
            style={{
                border: '10px solid var(--primary-700)',
                borderRadius: 6,
                padding: 30,
                textAlign: 'center',
                background: 'linear-gradient(180deg,#fdfdff,#f3f4ff)',
                position: 'relative',
            }}
        >
            <div style={{ position: 'absolute', top: 14, right: 14 }} className="qr-box" />
            <div style={{ fontSize: 11, letterSpacing: '.15em', color: 'var(--primary-600)', fontWeight: 700 }}>
                {DB.orgProfile.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '16px 0 4px', color: 'var(--gray-900)', fontFamily: 'Georgia,serif' }}>
                Certificate of Completion
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 20 }}>This is proudly presented to</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary-700)', fontFamily: 'Georgia,serif', marginBottom: 16 }}>
                {studentName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 420, margin: '0 auto 20px' }}>
                for successfully completing the industrial attachment course
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20 }}>{course}</div>
            <div className="flex-between" style={{ maxWidth: 360, margin: '26px auto 0' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 120, marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Course Coordinator</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5px solid var(--gray-400)', width: 120, marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Executive Director</span>
                </div>
            </div>
            <div style={{ marginTop: 20, fontSize: '10.5px', color: 'var(--gray-400)' }}>
                Certificate No: {certNo || '—'} &nbsp;·&nbsp; Issue Date: {fmtDate(date)}
            </div>
        </div>
    );
}

export function IdCard({ student, card }) {
    return (
        <div
            style={{
                width: 320,
                borderRadius: 16,
                background: 'linear-gradient(135deg,var(--primary-700),var(--primary-900))',
                color: '#fff',
                padding: '18px 20px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
            }}
        >
            <div style={{ position: 'absolute', right: -40, top: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
            <div style={{ fontSize: 10, letterSpacing: '.1em', opacity: 0.85 }}>{DB.orgProfile.name.toUpperCase()}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 14 }}>STUDENT IDENTITY CARD</div>
            <div className="flex-gap" style={{ alignItems: 'flex-start' }}>
                <div
                    style={{
                        width: 60,
                        height: 74,
                        background: 'rgba(255,255,255,.15)',
                        borderRadius: 8,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        fontWeight: 800,
                    }}
                >
                    {initials(student.name)}
                </div>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{student.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{student.code}</div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>{courseName(student.courses?.[0]?.course_id)}</div>
                </div>
            </div>
            <div className="flex-between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
                <div style={{ fontSize: 10, opacity: 0.75 }}>Valid till: {fmtDate(card.valid_till)}</div>
                <div style={{ width: 44, height: 44, background: '#fff', borderRadius: 6 }} />
            </div>
        </div>
    );
}
