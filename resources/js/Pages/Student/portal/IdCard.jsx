/* ID Card — ported from renderPortalIdCard() in the prototype's portal.js. */

import { IdCard as IdCardArt } from '../../../lib/CertificateArt';
import { DB } from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export default function IdCard({ student }) {
    const s = student;
    const card = DB.idCards.find((c) => c.student_id === s.id);
    const { toast } = useUi();

    if (!card) {
        return (
            <div className="empty-state">
                <Icon name="idcard" />
                <p>Your ID card has not been issued yet. It will be available once your admission is confirmed.</p>
            </div>
        );
    }

    return (
        <>
            <div className="showcase-wrap">
                <IdCardArt student={s} card={card} />
            </div>
            <div className="flex-gap" style={{ justifyContent: 'center', marginTop: 18 }}>
                <span className={`badge ${card.status === 'active' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '12.5px', padding: '6px 14px' }}>
                    <StatusBadge status={card.status} />
                </span>
            </div>
            <div className="flex-gap" style={{ justifyContent: 'center', marginTop: 14 }}>
                <button type="button" className="btn btn-primary" onClick={() => toast('Downloading ID card PDF (demo)')}>
                    <Icon name="download" /> Download ID Card
                </button>
                {card.status === 'expired' ? (
                    <button type="button" className="btn btn-secondary" onClick={() => toast('Reissue request submitted')}>
                        <Icon name="swap" /> Request Reissue
                    </button>
                ) : null}
            </div>
        </>
    );
}
