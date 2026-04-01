import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiArrowLeft } from 'react-icons/fi';
import { API_BASE } from '../utils/promo';
import { authHeaders, getStoredUser, saveAuth } from '../lib/auth';

const initialProfile = {
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
};

export default function AccountProfile() {
    const [profile, setProfile] = useState(initialProfile);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    useEffect(() => {
        const localUser = getStoredUser();
        if (localUser) {
            setProfile({
                nama: localUser.nama || '',
                email: localUser.email || '',
                no_hp: localUser.no_hp || '',
                alamat: localUser.alamat || '',
            });
        }

        const fetchProfile = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Gagal memuat profil user.');
                }
                const data = await response.json();
                if (data?.user) {
                    setProfile({
                        nama: data.user.nama || '',
                        email: data.user.email || '',
                        no_hp: data.user.no_hp || '',
                        alamat: data.user.alamat || '',
                    });
                    saveAuth({ token: undefined, user: data.user });
                }
            } catch (err) {
                setError(err.message || 'Gagal memuat profil user.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch(`${API_BASE}/api/auth/profile`, {
                method: 'PUT',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(profile),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Gagal memperbarui profil.');
            }

            if (data?.user) {
                saveAuth({ token: undefined, user: data.user });
            }
            setMessage(data?.message || 'Profil berhasil diperbarui.');
        } catch (err) {
            setError(err.message || 'Gagal memperbarui profil.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setSavingPassword(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch(`${API_BASE}/api/auth/password`, {
                method: 'PUT',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(passwordForm),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Gagal mengubah password.');
            }

            setPasswordForm({
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
            });
            setMessage(data?.message || 'Password berhasil diubah.');
        } catch (err) {
            setError(err.message || 'Gagal mengubah password.');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="container-custom py-10 pb-20 space-y-6">
            <Link
                to="/akun"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-700"
            >
                <FiArrowLeft className="text-xl" />
                <span className="text-base font-medium">Kembali ke Akun</span>
            </Link>
            <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Profil User</h1>
                <p className="text-gray-500">Kelola data diri dan kata sandi akun Anda.</p>
            </div>

            {message && <p className="text-sm text-green-700">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <Card className="border-none shadow-md">
                <CardContent className="p-6">
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900">Data Diri</h2>
                        <Input
                            label="Nama Lengkap"
                            value={profile.nama}
                            onChange={(e) => setProfile((prev) => ({ ...prev, nama: e.target.value }))}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                            required
                        />
                        <Input
                            label="No. WhatsApp"
                            value={profile.no_hp}
                            onChange={(e) => setProfile((prev) => ({ ...prev, no_hp: e.target.value }))}
                            required
                        />
                        <Input
                            label="Alamat"
                            value={profile.alamat}
                            onChange={(e) => setProfile((prev) => ({ ...prev, alamat: e.target.value }))}
                        />
                        <Button type="submit" isLoading={savingProfile || loading}>
                            Simpan Data Diri
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md">
                <CardContent className="p-6">
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900">Ubah Kata Sandi</h2>
                        <Input
                            label="Password Saat Ini"
                            type="password"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                            required
                        />
                        <Input
                            label="Password Baru"
                            type="password"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                            required
                        />
                        <Input
                            label="Konfirmasi Password Baru"
                            type="password"
                            value={passwordForm.new_password_confirmation}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password_confirmation: e.target.value }))}
                            required
                        />
                        <Button type="submit" variant="outline" isLoading={savingPassword}>
                            Ubah Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
