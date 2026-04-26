import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiJson } from '../lib/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const email = useMemo(() => searchParams.get('email') || '', [searchParams]);
    const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
    const hasValidPayload = email !== '' && token !== '';

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await apiJson('/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    token,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
                defaultErrorMessage: 'Password gagal diperbarui. Silakan coba lagi.',
            });

            navigate('/auth/login?reset=success', {
                replace: true,
                state: { message: data?.message || 'Password berhasil diperbarui.' },
            });
        } catch (err) {
            setError(err.message || 'Password gagal diperbarui.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-custom py-20 min-h-[60vh] flex items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Card className="w-full shadow-xl border-gray-100 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-serif text-primary-900">Reset Password</CardTitle>
                        <p className="text-gray-500 text-sm mt-1">Buat password baru yang aman untuk akun Anda.</p>
                    </CardHeader>
                    <CardContent className="p-8">
                        {!hasValidPayload ? (
                            <div className="space-y-4">
                                <p className="text-sm text-red-600">Tautan reset password tidak valid atau data email tidak lengkap.</p>
                                <Link to="/auth/forgot-password" className="inline-flex text-sm font-medium text-primary-700 hover:text-primary-800">
                                    Minta link reset baru
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Email"
                                    type="email"
                                    value={email}
                                    readOnly
                                    disabled
                                />
                                <Input
                                    label="Password Baru"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                />
                                <Input
                                    label="Konfirmasi Password"
                                    type="password"
                                    placeholder="Ulangi password baru"
                                    value={passwordConfirmation}
                                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                />

                                {error && <p className="text-sm text-red-600">{error}</p>}

                                <Button type="submit" className="w-full shadow-lg shadow-primary-500/20" isLoading={isLoading}>
                                    Simpan Password Baru
                                </Button>

                                <Link to="/auth/login" className="block text-center text-sm font-medium text-primary-700 hover:text-primary-800">
                                    Kembali ke Login
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="rounded-lg border border-gray-200 bg-white/70 p-4 md:sticky md:top-24">
                    <p className="text-sm font-semibold text-gray-800">Keamanan</p>
                    <div className="mt-3 space-y-3 text-sm text-gray-600">
                        <p>Password baru wajib minimal 8 karakter.</p>
                        <p>Setelah reset berhasil, sesi login lama akan dinonaktifkan sehingga Anda perlu login kembali.</p>
                        <p>Jika tautan sudah kedaluwarsa, Anda dapat meminta email reset yang baru dari halaman lupa password.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
