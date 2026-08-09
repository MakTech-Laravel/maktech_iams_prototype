/* Due & Overdue Payments — ported from renderDue() and wireDueTabs() in
   public/prototype/js/render-finance.js. */

import { router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { duesFollowupWindow, resendFollowupSms } from '../../lib/db';
import { Icon, Tabs } from '../../lib/ui';
import DuePane from './finance/DuePanes';
import { useFinanceModals } from './finance/useFinanceModals';

export default function Due({ view }) {
    const { openInvoiceDetail, openRecordPayment, sendReminder, refresh, toast } = useFinanceModals();
    const [tab, setTab] = useState('today');

    const tabs = [
        { id: 'today', label: "Today's Due" },
        { id: 'all', label: 'All Due' },
        { id: 'range', label: 'Date-to-Date Filter' },
        {
            id: 'followup',
            label: (
                <>
                    Due Follow-up{' '}
                    <span className="badge badge-amber" style={{ marginLeft: 4 }}>
                        {duesFollowupWindow().length}
                    </span>
                </>
            ),
        },
    ];

    const resendSms = (invoiceId) => {
        resendFollowupSms(invoiceId);
        toast('Reminder SMS re-sent to student');
        refresh();
    };

    return (
        <AdminLayout view={view}>
            <div className="view-header">
                <div>
                    <h1>Due &amp; Overdue Payments</h1>
                    <p>Student-wise due tracking, date filters and a 7-day follow-up with auto-SMS reminders</p>
                </div>
                <div className="view-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => router.visit('/admin/collect-payment')}>
                        <Icon name="payment" /> Collect Payment
                    </button>
                </div>
            </div>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
            <div>
                <DuePane
                    tab={tab}
                    handlers={{ onViewInvoice: openInvoiceDetail, onSendReminder: sendReminder, onCollect: openRecordPayment }}
                    onResendSms={resendSms}
                />
            </div>
        </AdminLayout>
    );
}
