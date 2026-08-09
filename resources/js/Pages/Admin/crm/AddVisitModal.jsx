/* Log Institution Visit modal — ported from addVisitModal() in render-marketing.js plus the `save-visit`
   case in app.js. The prototype never reads these inputs back (the save is a demo stub), so they stay
   uncontrolled exactly as the original markup had them. */

import { DB } from '../../../lib/db';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

export default function AddVisitModal({ actions }) {
    const { toast } = useUi();

    const save = () => {
        actions.dismiss();
        toast('Visit report saved');
        actions.bump();
    };

    useHostedModal(
        {
            title: 'Log Institution Visit',
            sub: 'Record a polytechnic visit report',
            body: (
                <div className="form-grid">
                    <div className="field span-2">
                        <label>Institution *</label>
                        <select>
                            {DB.institutions.map((i) => (
                                <option key={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Visit Date *</label>
                        <input type="date" defaultValue="2026-08-06" />
                    </div>
                    <div className="field">
                        <label>Visited By *</label>
                        <select>
                            {DB.users
                                .filter((u) => u.role_id === 3)
                                .map((u) => (
                                    <option key={u.id}>{u.name}</option>
                                ))}
                        </select>
                    </div>
                    <div className="field span-2">
                        <label>Purpose</label>
                        <input type="text" placeholder="e.g. New batch promotion" />
                    </div>
                    <div className="field span-2">
                        <label>Outcome Notes</label>
                        <textarea placeholder="What happened during the visit?" />
                    </div>
                    <div className="field">
                        <label>Next Action</label>
                        <input type="text" placeholder="e.g. Send brochure" />
                    </div>
                    <div className="field">
                        <label>Next Action Date</label>
                        <input type="date" />
                    </div>
                    <div className="field span-2">
                        <label>Attachments</label>
                        <div
                            className="flex-gap"
                            style={{
                                border: '1.5px dashed var(--gray-300)',
                                borderRadius: 10,
                                padding: 16,
                                justifyContent: 'center',
                                color: 'var(--gray-400)',
                            }}
                        >
                            <Icon name="upload" /> Drop photos/documents here (demo)
                        </div>
                    </div>
                </div>
            ),
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={actions.dismiss}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={save}>
                        <Icon name="check" /> Save Visit Report
                    </button>
                </>
            ),
        },
        [],
    );

    return null;
}
