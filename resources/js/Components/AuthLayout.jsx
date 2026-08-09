export default function AuthLayout({ title, subtitle, children, prototypeHref, prototypeLabel = 'Prototype reference' }) {
    return (
        <div className="auth-shell">
            <div className="auth-visual">
                <div>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>MakTech IAMS</div>
                    <p style={{ marginTop: 12, opacity: 0.85, maxWidth: 360, lineHeight: 1.6 }}>{subtitle}</p>
                </div>
                <div style={{ opacity: 0.7, fontSize: 13 }}>Industrial Attachment Management System</div>
            </div>
            <div className="auth-form-side">
                <div className="auth-card">
                    <h1 style={{ marginBottom: 8, fontSize: 24 }}>{title}</h1>
                    {children}
                    {prototypeHref ? (
                        <p style={{ marginTop: '2rem' }}>
                            <a href={prototypeHref}>{prototypeLabel}</a>
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
