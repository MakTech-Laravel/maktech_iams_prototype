import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div style={{ padding: '3rem 2rem', fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto' }}>
                <h1 style={{ fontSize: 32, marginBottom: 12 }}>MakTech IAMS</h1>
                <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
                    Laravel + React (Inertia) application. Choose a panel to sign in, or browse the static prototype reference.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <Link href="/admin/login" style={{ padding: '0.75rem 1rem', background: '#0f172a', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
                        Admin panel
                    </Link>
                    <Link href="/teacher/login" style={{ padding: '0.75rem 1rem', background: '#1e40af', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
                        Teacher portal
                    </Link>
                    <Link href="/student/login" style={{ padding: '0.75rem 1rem', background: '#0369a1', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
                        Student portal
                    </Link>
                    <a href="/prototype/index.html" style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#0f172a', borderRadius: 8, textDecoration: 'none' }}>
                        Static prototype
                    </a>
                </div>
            </div>
        </>
    );
}
