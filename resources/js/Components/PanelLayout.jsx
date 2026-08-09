import { useForm } from '@inertiajs/react';

export default function PanelLayout({ panel, title, userLabel, userName, logoutUrl, children, prototypeHref }) {
    const { post, processing } = useForm({});

    return (
        <div style={{ minHeight: '100vh', background: 'var(--gray-50, #f8fafc)' }}>
            <header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 2rem',
                    background: '#fff',
                    borderBottom: '1px solid var(--gray-200, #e2e8f0)',
                }}
            >
                <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500, #64748b)' }}>
                        Guard: <code>{panel}</code>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: 14 }}>
                        {userLabel}: <strong>{userName}</strong>
                    </span>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={() => post(logoutUrl)}
                        style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
                    >
                        Log out
                    </button>
                </div>
            </header>
            <main style={{ padding: '2rem' }}>
                {children}
                {prototypeHref ? (
                    <p style={{ marginTop: '2rem' }}>
                        <a href={prototypeHref}>Open prototype reference</a>
                    </p>
                ) : null}
            </main>
        </div>
    );
}
