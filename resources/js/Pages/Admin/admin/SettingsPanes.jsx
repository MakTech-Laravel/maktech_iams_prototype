/* System Settings panes — ported from settingsPane() in public/prototype/js/render-admin.js
   (tab ids/labels/order come from renderSettings() + wireSettingsTabs() in app.js). */

import { DB } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export const SETTINGS_TABS = [
    { id: 'org', label: 'Organization' },
    { id: 'session', label: 'Academic Session' },
    { id: 'sms', label: 'SMS / Email' },
    { id: 'gateway', label: 'Payment Gateway' },
    { id: 'rules', label: 'Business Rules' },
    { id: 'backup', label: 'Backup & Export' },
];

export function SettingsPane({ tab }) {
    const { toast } = useUi();

    if (tab === 'org') {
        return (
            <div className="card card-pad">
                <div className="form-grid">
                    <div className="field span-2">
                        <label>Organization Name</label>
                        <input type="text" defaultValue={DB.orgProfile.name} />
                    </div>
                    <div className="field">
                        <label>Branch</label>
                        <input type="text" defaultValue={DB.orgProfile.branch} />
                    </div>
                    <div className="field">
                        <label>Phone</label>
                        <input type="text" defaultValue={DB.orgProfile.phone} />
                    </div>
                    <div className="field span-2">
                        <label>Address</label>
                        <input type="text" defaultValue={DB.orgProfile.address} />
                    </div>
                    <div className="field span-2">
                        <label>Email</label>
                        <input type="text" defaultValue={DB.orgProfile.email} />
                    </div>
                    <div className="field span-2">
                        <label>Logo (used on invoices, certificates, ID cards)</label>
                        <div
                            className="flex-gap"
                            style={{
                                border: '1.5px dashed var(--gray-300)',
                                borderRadius: 10,
                                padding: 14,
                                justifyContent: 'center',
                                color: 'var(--gray-400)',
                            }}
                        >
                            <Icon name="upload" /> Upload logo (demo)
                        </div>
                    </div>
                </div>
                <div className="hr" />
                <button type="button" className="btn btn-primary btn-sm" onClick={() => toast('Settings saved (demo)')}>
                    <Icon name="check" /> Save Changes
                </button>
            </div>
        );
    }

    if (tab === 'session') {
        return (
            <div className="card card-pad">
                <div className="form-grid">
                    <div className="field">
                        <label>Current Academic Session</label>
                        <input type="text" defaultValue={DB.orgProfile.session} />
                    </div>
                    <div className="field">
                        <label>Session Start</label>
                        <input type="date" defaultValue="2025-07-01" />
                    </div>
                    <div className="field">
                        <label>Session End</label>
                        <input type="date" defaultValue="2026-06-30" />
                    </div>
                    <div className="field">
                        <label>Default Currency</label>
                        <select>
                            <option>BDT (৳)</option>
                            <option>USD ($)</option>
                        </select>
                    </div>
                </div>
                <div className="hr" />
                <button type="button" className="btn btn-primary btn-sm" onClick={() => toast('Session settings saved (demo)')}>
                    <Icon name="check" /> Save Changes
                </button>
            </div>
        );
    }

    if (tab === 'sms') {
        return (
            <div className="card card-pad">
                <div className="form-grid">
                    <div className="field">
                        <label>SMS Provider</label>
                        <select>
                            <option>Alpha SMS</option>
                            <option>Bulk SMS BD</option>
                            <option>Custom API</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>SMS API Key</label>
                        <input type="text" defaultValue="••••••••••••3f2a" readOnly />
                    </div>
                    <div className="field">
                        <label>Email Provider (SMTP)</label>
                        <select>
                            <option>SMTP - Custom</option>
                            <option>SendGrid</option>
                            <option>Mailgun</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>SMTP Host</label>
                        <input type="text" placeholder="smtp.example.com" />
                    </div>
                </div>
                <div className="hr" />
                <button type="button" className="btn btn-primary btn-sm" onClick={() => toast('Integration settings saved (demo)')}>
                    <Icon name="check" /> Save Changes
                </button>
            </div>
        );
    }

    if (tab === 'gateway') {
        return (
            <div className="card card-pad">
                <div className="form-grid">
                    <div className="field">
                        <label>Gateway Provider</label>
                        <select>
                            <option>SSLCommerz</option>
                            <option>ShurjoPay</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Store ID</label>
                        <input type="text" defaultValue="maktech_live" readOnly />
                    </div>
                    <div className="field span-2">
                        <label>API Secret Key</label>
                        <input type="text" defaultValue="••••••••••••••••••••8a1c" readOnly />
                    </div>
                    <div className="field">
                        <label>bKash</label>
                        <div>
                            <StatusBadge status="active" label="Enabled" />
                        </div>
                    </div>
                    <div className="field">
                        <label>Nagad</label>
                        <div>
                            <StatusBadge status="active" label="Enabled" />
                        </div>
                    </div>
                    <div className="field">
                        <label>Rocket</label>
                        <div>
                            <StatusBadge status="active" label="Enabled" />
                        </div>
                    </div>
                    <div className="field">
                        <label>Card / VISA / MasterCard</label>
                        <div>
                            <StatusBadge status="active" label="Enabled" />
                        </div>
                    </div>
                </div>
                <div className="hr" />
                <button type="button" className="btn btn-primary btn-sm" onClick={() => toast('Gateway settings saved (demo)')}>
                    <Icon name="check" /> Save Changes
                </button>
            </div>
        );
    }

    if (tab === 'rules') {
        return (
            <div className="card card-pad">
                <div className="form-grid">
                    <div className="field">
                        <label>Certificate release rule</label>
                        <select>
                            <option>Auto (100% payment + attendance ≥ 75%)</option>
                            <option>Manual approval always</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Migration fee</label>
                        <select>
                            <option>Fixed amount (৳1,000)</option>
                            <option>% of new course price (5%)</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Discount approval threshold</label>
                        <input type="text" defaultValue="Above 10% requires Manager approval" />
                    </div>
                    <div className="field">
                        <label>Due-date alert schedule</label>
                        <input type="text" defaultValue="3 days before, on due date, every 3 days overdue" />
                    </div>
                    <div className="field">
                        <label>Minimum first payment</label>
                        <input type="text" defaultValue="30% of total course fee" />
                    </div>
                    <div className="field">
                        <label>Refund policy window</label>
                        <input type="text" defaultValue="Within 14 days, 10% deduction" />
                    </div>
                    <div className="field">
                        <label>Low attendance threshold</label>
                        <input type="text" defaultValue="Below 70% triggers alert + blocks certificate" />
                    </div>
                    <div className="field">
                        <label>Teacher payment approval</label>
                        <input type="text" defaultValue="Any amount requires Admin/Manager approval before disbursement" />
                    </div>
                    <div className="field">
                        <label>Batch capacity rule</label>
                        <input type="text" defaultValue="A batch's capacity can never exceed its assigned lab's capacity — enforced on create/edit" />
                    </div>
                    <div className="field">
                        <label>Student enrollment limit</label>
                        <input type="text" defaultValue="Blocked automatically once a batch reaches its lab's seat capacity" />
                    </div>
                    <div className="field">
                        <label>Portal login without email</label>
                        <div>
                            <StatusBadge status="active" label="Phone + OTP enabled" />
                        </div>
                    </div>
                </div>
                <div className="hr" />
                <button type="button" className="btn btn-primary btn-sm" onClick={() => toast('Business rules saved (demo)')}>
                    <Icon name="check" /> Save Changes
                </button>
            </div>
        );
    }

    if (tab === 'backup') {
        return (
            <div className="card card-pad">
                <div className="flex-between" style={{ marginBottom: 14 }}>
                    <div>
                        <b style={{ display: 'block', fontSize: '13.5px' }}>Last automatic backup</b>
                        <span className="cell-sub">Today, 03:00 AM — 412 MB</span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="download" /> Download Backup
                    </button>
                </div>
                <div className="flex-between" style={{ marginBottom: 14 }}>
                    <div>
                        <b style={{ display: 'block', fontSize: '13.5px' }}>Backup frequency</b>
                        <span className="cell-sub">Daily at 3:00 AM, retained for 30 days</span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm">
                        <Icon name="edit" /> Change Schedule
                    </button>
                </div>
                <div className="flex-between">
                    <div>
                        <b style={{ display: 'block', fontSize: '13.5px' }}>Export all data (Excel)</b>
                        <span className="cell-sub">Students, payments, leads, attendance — full export</span>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm">
                        <Icon name="download" /> Export Now
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
