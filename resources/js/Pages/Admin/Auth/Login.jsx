import { Head, useForm } from '@inertiajs/react';
import AuthLayout from '../../../Components/AuthLayout';

export default function Login({ canResetPassword, status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();
        post('/admin/login');
    };

    return (
        <>
            <Head title="Admin Login" />
            <AuthLayout
                title="Admin sign in"
                subtitle="Staff ERP access with Spatie permission matrix on the admin guard."
                prototypeHref="/prototype/index.html"
                prototypeLabel="Admin prototype reference"
            >
                {status ? <p style={{ color: '#15803d', marginBottom: 16 }}>{status}</p> : null}

                <form onSubmit={submit}>
                    <p>
                        <label>
                            Email
                            <br />
                            <input
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                required
                                autoFocus
                                style={{ width: '100%', padding: '.5rem', marginTop: 4 }}
                            />
                        </label>
                        {errors.email ? <span style={{ color: '#b91c1c', fontSize: 13 }}>{errors.email}</span> : null}
                    </p>
                    <p>
                        <label>
                            Password
                            <br />
                            <input
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                required
                                style={{ width: '100%', padding: '.5rem', marginTop: 4 }}
                            />
                        </label>
                        {errors.password ? <span style={{ color: '#b91c1c', fontSize: 13 }}>{errors.password}</span> : null}
                    </p>
                    <p>
                        <label>
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(event) => setData('remember', event.target.checked)}
                            />{' '}
                            Remember me
                        </label>
                    </p>
                    <button type="submit" disabled={processing} style={{ padding: '.6rem 1rem' }}>
                        Sign in
                    </button>
                </form>

                {canResetPassword ? (
                    <p style={{ marginTop: 16 }}>
                        <a href="/admin/forgot-password">Forgot password?</a>
                    </p>
                ) : null}
            </AuthLayout>
        </>
    );
}
