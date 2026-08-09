/* My Batches — ported from renderTpBatches() in public/prototype/js/teacherportal.js. */

import { Icon } from '../../../lib/ui';
import BatchCard from './BatchCard';

export default function BatchesScreen({ teacher, batches, onNavigate }) {
    return (
        <div className="grid grid-3">
            {batches.length ? (
                batches.map((b) => <BatchCard key={b.id} teacher={teacher} batch={b} onNavigate={onNavigate} />)
            ) : (
                <div className="empty-state">
                    <Icon name="batch" />
                    <p>No batches assigned yet.</p>
                </div>
            )}
        </div>
    );
}
