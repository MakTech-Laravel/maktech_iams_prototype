/* Certificates — ported from renderCertificates(), certificatePreviewModal() and certTemplateModal()
   in public/prototype/js/render-certificates.js, plus the preview-certificate / issue-certificate /
   open-cert-template cases of the prototype's app.js click delegation. */

import AdminLayout from '../../Layouts/AdminLayout';
import { CertificateSheet } from '../../lib/CertificateArt';
import { DB, courseName, fmtDate, studentById } from '../../lib/db';
import { useRefresh } from '../../lib/hooks';
import { Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useUi } from '../../lib/UiProvider';

export default function Certificates({ view }) {
    const { openModal, closeModal, toast } = useUi();
    const refresh = useRefresh();

    /* ---- preview-certificate ---- */
    const openPreview = (id) => {
        const c = DB.certificates.find((x) => x.id === id);
        const s = studentById(c.student_id);

        openModal({
            size: 'lg',
            title: 'Certificate Preview',
            sub: `${s.name} — ${c.cert_no}`,
            body: <CertificateSheet studentName={s.name} courseName={courseName(c.course_id)} certNo={c.cert_no} date={c.issue_date} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-outline">
                        <Icon name="qr" /> View Verify Page
                    </button>
                    <button type="button" className="btn btn-primary">
                        <Icon name="download" /> Download PDF
                    </button>
                </>
            ),
        });
    };

    /* ---- issue-certificate ---- */
    const issue = (id) => {
        const c = DB.certificates.find((x) => x.id === id);

        if (c) {
            c.status = 'issued';
            c.cert_no = 'MT-CERT-2026-0' + (100 + id);
            c.issue_date = '2026-08-06';
            toast('Certificate issued & sent to student portal');
            refresh();
        }
    };

    /* ---- open-cert-template ---- */
    const openTemplate = () =>
        openModal({
            size: 'lg',
            title: 'Certificate Template',
            sub: 'Drag/drop builder (visual placeholder for prototype)',
            body: (
                <>
                    <CertificateSheet studentName="[[Student Name]]" courseName="[[Course Name]]" certNo="MT-CERT-XXXX-XXXX" date="2026-08-06" />
                    <div className="grid grid-3 mt-16" style={{ gap: 10 }}>
                        <button type="button" className="btn btn-secondary btn-sm">
                            <Icon name="edit" /> Edit Logo
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm">
                            <Icon name="edit" /> Edit Signatures
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm">
                            <Icon name="qr" /> QR Position
                        </button>
                    </div>
                </>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-primary">
                        <Icon name="check" /> Save Template
                    </button>
                </>
            ),
        });

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Certificates</h1>
                    <p>Auto-generation on course completion, with QR-verifiable authenticity</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={openTemplate}>
                        <Icon name="edit" /> Edit Template
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="printer" /> Bulk Print
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="certificate" label="Issued" value={DB.certificates.filter((c) => c.status === 'issued').length} color="#10b981" />
                <KpiCard
                    icon="clock"
                    label="Pending (Completed, Not Certified)"
                    value={DB.certificates.filter((c) => c.status === 'pending').length}
                    color="#f59e0b"
                />
                <KpiCard icon="shield" label="Auto-rule" value="Payment 100% + Attendance ≥ 75%" color="#ff6533" />
                <KpiCard icon="qr" label="Verification Page" value="Public / QR-based" color="#06b6d4" />
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <h3>Business Rule</h3>
                    <p>Configurable trigger for automatic certificate release</p>
                </div>
                <div className="card-pad flex-gap" style={{ flexWrap: 'wrap' }}>
                    <span className="badge badge-green">
                        <Icon name="checkCircle" /> Course marked Completed
                    </span>
                    <span className="badge badge-green">
                        <Icon name="checkCircle" /> Attendance ≥ 75%
                    </span>
                    <span className="badge badge-green">
                        <Icon name="checkCircle" /> No outstanding due
                    </span>
                    <span className="muted" style={{ fontSize: '12.5px' }}>
                        → Certificate auto-generated &amp; notification sent to student portal
                    </span>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Certificate Register</h3>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Course</th>
                                <th>Certificate No.</th>
                                <th>Issue Date</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.certificates.map((c) => {
                                const s = studentById(c.student_id);

                                return (
                                    <tr key={c.id}>
                                        <td className="cell-strong">{s.name}</td>
                                        <td>{courseName(c.course_id)}</td>
                                        <td>{c.cert_no || '—'}</td>
                                        <td>{fmtDate(c.issue_date)}</td>
                                        <td>
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td>
                                            {c.status === 'issued' ? (
                                                <button type="button" className="btn btn-sm btn-outline" onClick={() => openPreview(c.id)}>
                                                    <Icon name="eye" /> Preview
                                                </button>
                                            ) : (
                                                <button type="button" className="btn btn-sm btn-primary" onClick={() => issue(c.id)}>
                                                    <Icon name="certificate" /> Issue Now
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
