import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';
import { apiJson } from '../lib/api';
import { clearAuth, saveAuth } from '../lib/auth';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const successMessage = location.state?.message || (searchParams.get('reset') === 'success'
        ? 'Password berhasil diperbarui. Silakan login menggunakan password baru Anda.'
        : '');
    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);

    useEffect(() => {
        clearAuth();

        // Pastikan form login selalu mulai dari kondisi kosong dan tidak memakai nilai default apa pun.
        const clearCredentials = () => {
            setEmail('');
            setPassword('');
            if (emailInputRef.current) emailInputRef.current.value = '';
            if (passwordInputRef.current) passwordInputRef.current.value = '';
        };

        clearCredentials();
        const timer = window.setTimeout(clearCredentials, 120);

        return () => window.clearTimeout(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await apiJson('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    device_name: 'web',
                }),
                defaultErrorMessage: 'Login gagal.',
            });

            saveAuth({
                token: data.token,
                user: data.user,
            });

            if (data?.user?.role === 'admin' || data?.user?.role === 'superadmin') {
                navigate('/admin');
            } else {
                const redirectTo = location.state?.from?.pathname || '/akun';
                navigate(redirectTo);
            }
        } catch (err) {
            clearAuth();
            setError(err.message || 'Login gagal.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthSplitLayout
            title="Masuk ke akun Anda"
            description="Gunakan email dan password yang telah terdaftar untuk masuk ke portal pemasaran perumahan Zavira Mecca Property."
            panelDescription="Akses informasi perumahan, lakukan booking unit, dan pantau proses pengajuan Anda dengan lebih mudah dalam satu sistem."
        >
            <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
                <input type="text" name="fake_username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
                <input type="password" name="fake_password" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />

                <Input
                    label="Email"
                    type="email"
                    placeholder="nama@email.com"
                    name="login_email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    ref={emailInputRef}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white/90 px-4 shadow-none"
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="Masukkan password"
                    name="login_password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    ref={passwordInputRef}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white/90 px-4 shadow-none"
                />

                {successMessage && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-3 text-slate-600">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Ingat saya</span>
                    </label>
                    <Link to="/auth/forgot-password" className="font-medium text-primary-600 transition-colors hover:text-primary-700">
                        Lupa Password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    className="h-12 w-full rounded-xl shadow-[0_16px_32px_-18px_rgba(47,73,127,0.7)]"
                    isLoading={isLoading}
                >
                    Masuk
                </Button>

                <Link to="/auth/register" className="block">
                    <Button
                        variant="outline"
                        type="button"
                        className="h-12 w-full rounded-xl border-slate-300 bg-white text-primary-800 hover:bg-slate-50"
                    >
                        Daftar Akun Baru
                    </Button>
                </Link>
            </form>
        </AuthSplitLayout>
    );
}
