import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { API_BASE } from '../../utils/promo';
import { authHeaders, getStoredUser, getUserRole, saveAuth } from '../../lib/auth';
import { normalizePhone62 } from '../../lib/phone';

const initialProfile = {
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
};

const initialPasswordForm = {
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
};

const isGmailAddress = (email = '') => /^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(String(email || '').trim());

export default function AdminProfile() {
    const role = getUserRole();
    const roleLabel = role === 'superadmin' ? 'Superadmin' : 'Admin Perumahan';

    const [profile, setProfile] = useState(initialProfile);
    const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const localUser = getStoredUser();
        if (localUser) {
            setProfile({
                nama: localUser.nama || '',
                email: localUser.email || '',
                no_hp: normalizePhone62(localUser.no_hp || ''),
                alamat: localUser.alamat || '',
            });
        }

        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: authHeaders(),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.message || 'Gagal memuat profil akun.');
                }

                if (data?.user) {
                    setProfile({
                        nama: data.user.nama || '',
                        email: data.user.email || '',
                        no_hp: normalizePhone62(data.user.no_hp || ''),
                        alamat: data.user.alamat || '',
                    });
                    saveAuth({ token: undefined, user: data.user });
                }
            } catch (err) {
                setError(err.message || 'Gagal memuat profil akun.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileSubmit = async (event) => {
        event.preventDefault();
        setSavingProfile(true);
        setError('');
        setSuccess('');

        try {
            if (!isGmailAddress(profile.email)) {
                throw new Error('Email harus menggunakan domain @gmail.com.');
            }

            const response = await fetch(`${API_BASE}/api/auth/profile`, {
                method: 'PUT',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({
                    ...profile,
                    no_hp: normalizePhone62(profile.no_hp),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Gagal memperbarui profil akun.');
            }

            if (data?.user) {
                saveAuth({ token: undefined, user: data.user });
                setProfile({
                    nama: data.user.nama || '',
                    email: data.user.email || '',
                    no_hp: normalizePhone62(data.user.no_hp || ''),
                    alamat: data.user.alamat || '',
                });
            }

            setSuccess(data?.message || 'Profil akun berhasil diperbarui.');
        } catch (err) {
            setError(err.message || 'Gagal memperbarui profil akun.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        setSavingPassword(true);
        setError('');
        setSuccess('');

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
                throw new Error(data?.message || 'Gagal mengubah password akun.');
            }

            setPasswordForm(initialPasswordForm);
            setSuccess(data?.message || 'Password akun berhasil diubah.');
        } catch (err) {
            setError(err.message || 'Gagal mengubah password akun.');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-300 py-2">
            <div>
                <h1 className="admin-page-title text-2xl font-bold text-gray-800">Profil Akun</h1>
                <p className="admin-page-subtitle text-sm text-gray-500 mt-1">
                    Kelola data diri dan keamanan login akun {roleLabel}.
                </p>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Data Diri</h2>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nama"
                                value={profile.nama}
                                onChange={(event) => setProfile((prev) => ({ ...prev, nama: event.target.value }))}
                                placeholder="Nama lengkap"
                                required
                                disabled={loading}
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={profile.email}
                                onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                                placeholder="contoh@gmail.com"
                                required
                                disabled={loading}
                            />
                            <Input
                                label="No. HP"
                                value={profile.no_hp}
                                onChange={(event) => setProfile((prev) => ({ ...prev, no_hp: normalizePhone62(event.target.value) }))}
                                placeholder="628xxxxxxxxxx"
                                required
                                disabled={loading}
                            />
                            <Input
                                label="Alamat"
                                value={profile.alamat}
                                onChange={(event) => setProfile((prev) => ({ ...prev, alamat: event.target.value }))}
                                placeholder="Alamat akun"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <Button type="submit" isLoading={savingProfile || loading}>
                                Simpan Data Diri
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Ubah Password</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Password Saat Ini"
                                type="password"
                                value={passwordForm.current_password}
                                onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
                                placeholder="Masukkan password saat ini"
                                required
                            />
                            <div className="hidden md:block" />
                            <Input
                                label="Password Baru"
                                type="password"
                                value={passwordForm.new_password}
                                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                                placeholder="Minimal 8 karakter"
                                required
                            />
                            <Input
                                label="Konfirmasi Password Baru"
                                type="password"
                                value={passwordForm.new_password_confirmation}
                                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password_confirmation: event.target.value }))}
                                placeholder="Ulangi password baru"
                                required
                            />
                        </div>

                        <div>
                            <Button type="submit" variant="outline" isLoading={savingPassword}>
                                Ubah Password
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
