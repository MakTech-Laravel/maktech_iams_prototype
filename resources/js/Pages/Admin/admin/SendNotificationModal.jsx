/* Send Manual Notification modal — ported from the `open-send-notification` case in
   public/prototype/js/app.js. */

import { DB } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export function useSendNotificationModal() {
    const { openModal, closeModal, toast } = useUi();

    return () =>
        openModal({
            title: 'Send Manual Notification',
            sub: 'Send SMS/Email/Portal message to student(s)',
            body: (
                <div className="form-grid">
                    <div className="field span-2">
                        <label>Recipients</label>
                        <select>
                            <option>All Active Students</option>
                            <option>Specific Student</option>
                            <option>Specific Batch</option>
                            <option>Overdue Payment Students</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Channel</label>
                        <select>
                            <option>SMS</option>
                            <option>Email</option>
                            <option>Portal</option>
                            <option>All</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Template</label>
                        <select>
                            {DB.notificationRules.map((r) => (
                                <option key={r.id}>{r.trigger.replace(/_/g, ' ')}</option>
                            ))}
                            <option>Custom Message</option>
                        </select>
                    </div>
                    <div className="field span-2">
                        <label>Message</label>
                        <textarea placeholder="Type your message..." />
                    </div>
                </div>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            closeModal();
                            toast('Notification sent');
                        }}
                    >
                        <Icon name="send" /> Send Now
                    </button>
                </>
            ),
        });
}
