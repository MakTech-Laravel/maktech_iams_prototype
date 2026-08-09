/* Certificate — ported from renderPortalCertificate() in the prototype's portal.js. */

import { CertificateSheet } from '../../../lib/CertificateArt';
import { DB, attendanceSummaryForStudent, courseName, invoiceForStudent } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export default function Certificate({ student }) {
    const s = student;
    const cert = DB.certificates.find((c) => c.student_id === s.id);
    const enr = s.courses[0];
    const att = enr ? attendanceSummaryForStudent(s.id, enr.batch_id) : { pct: 0, effectiveTotal: 0 };
    const inv = invoiceForStudent(s.id);
    const { toast } = useUi();
    const conditions = [
        { label: 'Course marked Completed', ok: ['completed', 'certified'].includes(s.status) },
        { label: 'Attendance ≥ 75%', ok: att.effectiveTotal > 0 && att.pct >= 75 },
        { label: 'No outstanding due', ok: !inv || inv.due === 0 },
    ];

    return (
        <>
            <div className="card card-pad" style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14.5px' }}>Eligibility Checklist</h3>
                {conditions.map((c) => (
                    <div className="flex-gap" style={{ marginBottom: 10 }} key={c.label}>
                        <span style={{ color: c.ok ? 'var(--success-500)' : 'var(--gray-300)' }}>
                            <Icon name="checkCircle" />
                        </span>
                        <span style={{ fontSize: 13 }}>{c.label}</span>
                        {c.ok ? <StatusBadge status="active" label="Met" /> : <StatusBadge status="pending" label="Not yet" />}
                    </div>
                ))}
            </div>
            {cert && cert.status === 'issued' ? (
                <>
                    <div className="showcase-wrap">
                        <CertificateSheet studentName={s.name} courseName={courseName(cert.course_id)} certNo={cert.cert_no} date={cert.issue_date} />
                    </div>
                    <div className="flex-gap" style={{ justifyContent: 'center', marginTop: 18 }}>
                        <button type="button" className="btn btn-primary" onClick={() => toast('Downloading certificate PDF (demo)')}>
                            <Icon name="download" /> Download Certificate
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                window.location.href = '/verify';
                            }}
                        >
                            <Icon name="qr" /> View Public Verification
                        </button>
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <Icon name="certificate" />
                    <p>Your certificate isn't ready yet. Complete the conditions above to unlock it.</p>
                </div>
            )}
        </>
    );
}
