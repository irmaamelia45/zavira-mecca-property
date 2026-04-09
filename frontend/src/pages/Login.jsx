import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { API_BASE } from '../utils/promo';
import { clearAuth, saveAuth } from '../lib/auth';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
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
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    device_name: 'web',
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Login gagal.');
            }

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
        <div className="container-custom py-20 flex justify-center items-center min-h-[60vh] animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-serif text-primary-900">Selamat Datang</CardTitle>
                    <p className="text-gray-500 text-sm mt-1">Masuk untuk melanjutkan booking</p>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
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
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="********"
                            name="login_password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            ref={passwordInputRef}
                            required
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-gray-600 cursor-pointer">
                                <input type="checkbox" className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                Ingat saya
                            </label>
                            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Lupa Password?</a>
                        </div>

                        <Button type="submit" className="w-full shadow-lg shadow-primary-500/20" isLoading={isLoading}>
                            Masuk
                        </Button>

                        <div className="relative my-6 text-center text-sm">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                            <span className="relative bg-white px-2 text-gray-500">Atau</span>
                        </div>

                        <Link to="/auth/register" className="block">
                            <Button variant="outline" type="button" className="w-full">
                                Daftar Akun Baru
                            </Button>
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
