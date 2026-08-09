/* ID Cards — ported from renderIdCards() and idCardPreviewModal() in
   public/prototype/js/render-certificates.js, plus the preview-idcard / open-idcard-template cases
   of the prototype's app.js click delegation. */

import AdminLayout from '../../Layouts/AdminLayout';
import { IdCard } from '../../lib/CertificateArt';
import { DB, fmtDate, studentById } from '../../lib/db';
import { Icon, KpiCard, StatusBadge } from '../../lib/ui';
import { useUi } from '../../lib/UiProvider';

export default function Idcards({ view }) {
    const { openModal, closeModal } = useUi();

    /* ---- preview-idcard ---- */
    const openPreview = (id) => {
        const c = DB.idCards.find((x) => x.id === id);
        const s = studentById(c.student_id);

        openModal({
            title: 'ID Card Preview',
            sub: `${s.name} — ${c.card_no}`,
            body: (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <IdCard student={s} card={c} />
                </div>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-primary">
                        <Icon name="download" /> Download PDF
                    </button>
                </>
            ),
        });
    };

    /* ---- open-idcard-template ---- */
    const openTemplate = () =>
        openModal({
            size: 'lg',
            title: 'ID Card Template',
            sub: 'Layout builder (visual placeholder)',
            body: (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <IdCard student={{ name: '[[Student Name]]', code: '[[Code]]', courses: [{ course_id: 1 }] }} card={{ valid_till: '2026-12-31' }} />
                </div>
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
                    <h1>ID Cards</h1>
                    <p>QR-coded student ID card generation &amp; bulk print production</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={openTemplate}>
                        <Icon name="edit" /> Edit Template
                    </button>
                    <button type="button" className="btn btn-primary btn-sm">
                        <Icon name="printer" /> Bulk Print
                    </button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="idcard" label="Active Cards" value={DB.idCards.filter((c) => c.status === 'active').length} color="#10b981" />
                <KpiCard icon="clock" label="Expired" value={DB.idCards.filter((c) => c.status === 'expired').length} color="#ef4444" />
                <KpiCard icon="swap" label="Reissued" value={DB.idCards.filter((c) => c.status === 'reissued').length} color="#f59e0b" />
                <KpiCard icon="qr" label="QR Verification" value="Enabled" color="#ff6533" />
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>ID Card Register</h3>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Card No.</th>
                                <th>Issue Date</th>
                                <th>Valid Till</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {DB.idCards.map((c) => {
                                const s = studentById(c.student_id);

                                return (
                                    <tr key={c.id}>
                                        <td className="cell-strong">{s.name}</td>
                                        <td>{c.card_no}</td>
                                        <td>{fmtDate(c.issue_date)}</td>
                                        <td>{fmtDate(c.valid_till)}</td>
                                        <td>
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td>
                                            <button type="button" className="btn btn-sm btn-outline" onClick={() => openPreview(c.id)}>
                                                <Icon name="eye" /> Preview
                                            </button>
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
