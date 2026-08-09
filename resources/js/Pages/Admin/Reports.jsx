/* Reports & Analytics — ported from renderReports() in public/prototype/js/render-reports.js
   (open-report / open-locked-report cases in app.js). */

import { Fragment } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { useIdentity } from '../../lib/identity';
import { Icon, IconGlyph } from '../../lib/ui';
import { useUi } from '../../lib/UiProvider';
import { REPORTS } from './admin/reportCatalog';
import { useOpenReport } from './admin/ReportModal';

export default function Reports({ view }) {
    const { canReport } = useIdentity();
    const { toast } = useUi();
    const openReport = useOpenReport();

    const lockedCount = REPORTS.flatMap((g) => g.items).filter((r) => !canReport(r.id)).length;

    return (
        <AdminLayout view={view}>
            {lockedCount ? (
                <div className="badge badge-gray" style={{ whiteSpace: 'normal', textAlign: 'left', marginBottom: 14 }}>
                    <Icon name="lock" /> {lockedCount} report(s) are locked for your account — an Admin can grant access per report from Access
                    Control.
                </div>
            ) : null}

            <div className="view-header">
                <div>
                    <h1>Reports &amp; Analytics</h1>
                    <p>All 44 reports from the blueprint — every report supports date-range filter, Excel/PDF export, print view</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="filter" /> Global Filters
                    </button>
                </div>
            </div>

            {REPORTS.map((g) => (
                <Fragment key={g.sec}>
                    <h3 className="report-section-title">{g.sec}</h3>
                    <div className="grid grid-4" style={{ marginBottom: 8 }}>
                        {g.items.map((r) => {
                            const allowed = canReport(r.id);

                            return allowed ? (
                                <div className="report-card" key={r.id} onClick={() => openReport(r.id)}>
                                    <div className="ric">
                                        <IconGlyph name={r.ic} />
                                    </div>
                                    <div>
                                        <b>{r.t}</b>
                                        <span>{r.d}</span>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="report-card"
                                    key={r.id}
                                    onClick={() => toast("You don't have access to this report — ask an Admin to grant it from Access Control", 'error')}
                                    style={{ opacity: 0.5, cursor: 'not-allowed', position: 'relative' }}
                                    title="You don't have access to this report"
                                >
                                    <div className="ric">
                                        <IconGlyph name={r.ic} />
                                    </div>
                                    <div>
                                        <b>{r.t}</b>
                                        <span>{r.d}</span>
                                    </div>
                                    <div style={{ position: 'absolute', top: 10, right: 10, color: 'var(--gray-400)' }}>
                                        <Icon name="lock" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Fragment>
            ))}
        </AdminLayout>
    );
}
