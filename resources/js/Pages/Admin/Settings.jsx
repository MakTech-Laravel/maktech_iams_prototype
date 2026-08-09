/* System Settings — ported from renderSettings() in public/prototype/js/render-admin.js;
   wireSettingsTabs() in app.js (which re-injected #settingsPane) becomes local tab state. */

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Tabs } from '../../lib/ui';
import { SETTINGS_TABS, SettingsPane } from './admin/SettingsPanes';

export default function Settings({ view }) {
    const [tab, setTab] = useState('org');

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>System Settings</h1>
                    <p>Organization profile, academic session, integrations &amp; branding</p>
                </div>
            </div>
            <Tabs tabs={SETTINGS_TABS} active={tab} onChange={setTab} />
            <div id="settingsPane">
                <SettingsPane tab={tab} />
            </div>
        </AdminLayout>
    );
}
