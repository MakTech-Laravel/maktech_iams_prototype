/* Add Institution modal — ported from addInstitutionModal() in render-academic.js plus the
   `save-institution` case in app.js. The prototype's save is a demo stub that never reads the inputs,
   so they stay uncontrolled exactly as the original markup had them. */

import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';
import { useHostedModal } from './hosted';

export default function AddInstitutionModal({ actions }) {
    const { toast } = useUi();

    const save = () => {
        actions.dismiss();
        toast('Institution added');
        actions.bump();
    };

    useHostedModal(
        {
            title: 'Add Institution',
            sub: 'Register a new partner polytechnic',
            body: (
                <div className="form-grid">
                    <div className="field span-2">
                        <label>Institution Name *</label>
                        <input type="text" placeholder="e.g. Sylhet Polytechnic Institute" />
                    </div>
                    <div className="field">
                        <label>Type *</label>
                        <select>
                            <option>Government</option>
                            <option>Private</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>MOU Status</label>
                        <select>
                            <option>None</option>
                            <option>Pending</option>
                            <option>Signed</option>
                        </select>
                    </div>
                    <div className="field span-2">
                        <label>Address</label>
                        <input type="text" placeholder="Full address" />
                    </div>
                    <div className="field">
                        <label>Contact Person</label>
                        <input type="text" placeholder="Principal / coordinator name" />
                    </div>
                    <div className="field">
                        <label>Contact Phone</label>
                        <input type="text" placeholder="01XXXXXXXXX" />
                    </div>
                    <div className="field span-2">
                        <label>Contact Email</label>
                        <input type="text" placeholder="office@institute.edu.bd" />
                    </div>
                    <div className="field span-2">
                        <label>Departments (comma separated)</label>
                        <input type="text" placeholder="Computer Technology, Electrical Technology" />
                    </div>
                    <div className="field span-2">
                        <label>MOU Document</label>
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
                            <Icon name="upload" /> Upload MOU document (demo)
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
                        <Icon name="check" /> Save Institution
                    </button>
                </>
            ),
        },
        [],
    );

    return null;
}
