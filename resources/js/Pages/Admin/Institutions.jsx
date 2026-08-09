/* Institutions (Polytechnics) — ported from renderInstitutions() in
   public/prototype/js/render-academic.js (the view sits in the CRM & Marketing sidebar group). */

import AdminLayout from '../../Layouts/AdminLayout';
import { DB, fmtMoney, sum } from '../../lib/db';
import { Icon, IconGlyph, KpiCard, StatusBadge } from '../../lib/ui';
import { useCrmHost } from './crm/CrmHost';

export default function Institutions({ view }) {
    const { host, actions } = useCrmHost();

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Institutions (Polytechnics)</h1>
                    <p>Partner polytechnic institutes — profile, MOU status, department &amp; performance</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={actions.addInstitution}>
                        <Icon name="plus" /> Add Institution
                    </button>
                </div>
            </div>
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
                <KpiCard icon="institution" label="Total Institutes" value={DB.institutions.length} color="#ff6533" />
                <KpiCard icon="checkCircle" label="MOU Signed" value={DB.institutions.filter((i) => i.mou_status === 'signed').length} color="#10b981" />
                <KpiCard icon="students" label="Total Students Sourced" value={sum(DB.institutions, (i) => i.students)} color="#06b6d4" />
                <KpiCard icon="payment" label="Total Revenue Generated" value={fmtMoney(sum(DB.institutions, (i) => i.revenue))} color="#f59e0b" />
            </div>
            <div className="grid grid-3">
                {DB.institutions.map((i) => (
                    <div className="card" style={{ padding: '18px 20px', cursor: 'pointer' }} key={i.id} onClick={() => actions.viewInstitution(i.id)}>
                        <div className="flex-between" style={{ marginBottom: 10 }}>
                            <div className="kpi-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                                <IconGlyph name="institution" />
                            </div>
                            <StatusBadge
                                status={i.mou_status === 'signed' ? 'signed' : i.mou_status === 'pending' ? 'pending' : 'none'}
                                label={i.mou_status === 'signed' ? 'MOU Signed' : i.mou_status === 'pending' ? 'MOU Pending' : 'No MOU'}
                            />
                        </div>
                        <b style={{ fontSize: 14, color: 'var(--gray-900)', display: 'block', marginBottom: 4 }}>{i.name}</b>
                        <div className="cell-sub" style={{ marginBottom: 12 }}>
                            {i.type === 'government' ? 'Government' : 'Private'} · {i.address}
                        </div>
                        <div className="grid grid-3" style={{ gap: 8, textAlign: 'center' }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>{i.students}</div>
                                <div className="cell-sub">Students</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>{i.activeLeads}</div>
                                <div className="cell-sub">Active Leads</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-900)' }}>{fmtMoney(i.revenue)}</div>
                                <div className="cell-sub">Revenue</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {host}
        </AdminLayout>
    );
}
