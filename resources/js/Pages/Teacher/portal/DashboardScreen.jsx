/* Teacher portal dashboard — ported from renderTpDashboard() in public/prototype/js/teacherportal.js. */

import { activeStudentsInBatch, computeEarnedForTeacherBatch, fmtMoney, totalPaidToTeacherForBatch } from '../../../lib/db';
import { Icon, KpiCard } from '../../../lib/ui';
import BatchCard from './BatchCard';

export default function DashboardScreen({ teacher, batches, onNavigate }) {
    const activeBatches = batches.filter((b) => b.status === 'ongoing');
    const totalStudents = new Set(batches.flatMap((b) => activeStudentsInBatch(b.id).map((s) => s.id))).size;

    let totalEarned = 0;
    let totalPaid = 0;

    batches.forEach((b) => {
        totalEarned += computeEarnedForTeacherBatch(teacher.id, b.id);
        totalPaid += totalPaidToTeacherForBatch(teacher.id, b.id);
    });

    const outstanding = Math.max(0, totalEarned - totalPaid);

    return (
        <>
            <div className="portal-hero">
                <h2>Welcome back, {teacher.name.split(' ')[0]}</h2>
                <p>
                    You're assigned to {batches.length} batch{batches.length === 1 ? '' : 'es'} — {activeBatches.length} currently ongoing. Use
                    "Attendance" to mark today's class, or check "My Payments" for your earnings.
                </p>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 24 }}>
                <KpiCard icon="batch" label="My Batches" value={batches.length} color="#ff6533" />
                <KpiCard icon="students" label="My Students" value={totalStudents} color="#10b981" />
                <KpiCard icon="graduationCap" label="Earned (All Batches)" value={fmtMoney(totalEarned)} color="#8b5cf6" />
                <KpiCard icon="wallet" label="Outstanding" value={fmtMoney(outstanding)} color="#f59e0b" />
            </div>

            <h3 className="report-section-title">My Batches</h3>
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
        </>
    );
}
