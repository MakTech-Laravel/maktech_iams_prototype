/* Batch card — ported from tpBatchCardHtml() in public/prototype/js/teacherportal.js. */

import {
    PAY_RATE_TYPE_LABELS,
    batchEnrolledCount,
    courseName,
    effectiveBatchCapacity,
    fmtDate,
    fmtMoney,
    labName,
    payRateFor,
} from '../../../lib/db';
import { Icon, StatusBadge } from '../../../lib/ui';

export default function BatchCard({ teacher, batch, onNavigate }) {
    const rate = payRateFor(teacher.id, batch.id);

    return (
        <div className="card card-pad">
            <div className="flex-between" style={{ marginBottom: 6, gap: 8 }}>
                <b>{batch.name}</b>
                <StatusBadge status={batch.status} />
            </div>
            <div className="cell-sub" style={{ marginBottom: 10 }}>
                {courseName(batch.course_id)} · {labName(batch.lab_id)}
            </div>
            <div className="cell-sub" style={{ marginBottom: 4 }}>
                {batchEnrolledCount(batch.id)}/{effectiveBatchCapacity(batch)} students enrolled
            </div>
            <div className="cell-sub" style={{ marginBottom: 12 }}>
                {fmtDate(batch.start)} – {fmtDate(batch.end)}
            </div>
            {rate ? (
                <div className="badge badge-gray" style={{ marginBottom: 10 }}>
                    {PAY_RATE_TYPE_LABELS[rate.rate_type]} · {fmtMoney(rate.rate_amount)}
                </div>
            ) : null}
            <div className="flex-gap">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => onNavigate('attendance', batch.id)}>
                    <Icon name="attendance" /> Attendance
                </button>
            </div>
        </div>
    );
}
