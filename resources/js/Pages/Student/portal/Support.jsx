/* Support — ported from renderPortalSupport() in the prototype's portal.js. */

import { useState } from 'react';
import { Icon, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

const CATEGORIES = ['Payment Issue', 'Attendance Issue', 'Certificate Query', 'Technical Issue', 'Other'];

export default function Support() {
    const { toast } = useUi();
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');

    return (
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div className="card card-pad">
                <h3 style={{ margin: '0 0 14px', fontSize: '14.5px' }}>New Support Ticket</h3>
                <div className="field" style={{ marginBottom: 12 }}>
                    <label>Subject</label>
                    <input
                        type="text"
                        placeholder="e.g. Payment not reflecting"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                    />
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                    <label>Category</label>
                    <select value={category} onChange={(event) => setCategory(event.target.value)}>
                        {CATEGORIES.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="field" style={{ marginBottom: 14 }}>
                    <label>Description</label>
                    <textarea placeholder="Describe your issue..." value={description} onChange={(event) => setDescription(event.target.value)} />
                </div>
                <button type="button" className="btn btn-primary" onClick={() => toast('Support ticket submitted — office will respond soon')}>
                    <Icon name="send" /> Submit Ticket
                </button>
            </div>
            <div>
                <h3 style={{ margin: '0 0 14px', fontSize: '14.5px' }}>My Tickets</h3>
                <div className="ticket-item">
                    <div className="flex-between">
                        <b style={{ fontSize: 13 }}>Receipt not generated for RCT-1006</b>
                        <StatusBadge status="pending" label="Open" />
                    </div>
                    <div className="cell-sub" style={{ marginTop: 4 }}>
                        Raised 3 days ago · Payment Issue
                    </div>
                </div>
                <div className="ticket-item">
                    <div className="flex-between">
                        <b style={{ fontSize: 13 }}>Wrong attendance marked on Jul 30</b>
                        <StatusBadge status="completed" label="Resolved" />
                    </div>
                    <div className="cell-sub" style={{ marginTop: 4 }}>
                        Raised 1 week ago · Attendance Issue
                    </div>
                </div>
            </div>
        </div>
    );
}
