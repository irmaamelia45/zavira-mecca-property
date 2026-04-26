import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiJson } from '../lib/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setStatus('');
        setError('');

        try {
            const data = await apiJson('/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                defaultErrorMessage: 'Permintaan reset password tidak dapat diproses saat ini.',
            });

            setStatus(data?.message || 'Permintaan reset password berhasil diproses.');
        } catch (err) {
            setError(err.message || 'Permintaan reset password gagal.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-custom py-20 min-h-[60vh] flex items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Card className="w-full shadow-xl border-gray-100 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-serif text-primary-900">Lupa Password</CardTitle>
                        <p className="text-gray-500 text-sm mt-1">Masukkan email akun Anda untuk menerima tautan reset password.</p>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                placeholder="nama@email.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                autoComplete="email"
                            />

                            {status && <p className="text-sm text-green-700">{status}</p>}
                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <Button type="submit" className="w-full shadow-lg shadow-primary-500/20" isLoading={isLoading}>
                                Kirim Link Reset Password
                            </Button>

                            <Link to="/auth/login" className="block text-center text-sm font-medium text-primary-700 hover:text-primary-800">
                                Kembali ke Login
                            </Link>
                        </form>
                    </CardContent>
                </Card>

                <div className="rounded-lg border border-gray-200 bg-white/70 p-4 md:sticky md:top-24">
                    <p className="text-sm font-semibold text-gray-800">Petunjuk</p>
                    <div className="mt-3 space-y-3 text-sm text-gray-600">
                        <p>Gunakan email yang terdaftar pada akun Anda.</p>
                        <p>Tautan reset akan dikirim ke email tersebut dan hanya berlaku dalam waktu terbatas.</p>
                        <p>Jika email tidak ditemukan, sistem tetap menampilkan pesan yang aman untuk melindungi data akun.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
