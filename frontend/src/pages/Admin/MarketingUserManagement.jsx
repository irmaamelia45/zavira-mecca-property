import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { fetchJsonWithFallback } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';
import { normalizePhone62 } from '../../lib/phone';

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const initialMarketingForm = {
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
    password: '',
    password_confirmation: '',
    is_active: true,
};

export default function MarketingUserManagement() {
    const [marketingForm, setMarketingForm] = useState(initialMarketingForm);
    const [marketingUsers, setMarketingUsers] = useState([]);
    const [loadingMarketingUsers, setLoadingMarketingUsers] = useState(true);
    const [savingMarketing, setSavingMarketing] = useState(false);
    const [deletingMarketingId, setDeletingMarketingId] = useState(null);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchMarketingUsers = async () => {
        setLoadingMarketingUsers(true);
        setError('');
        try {
            const data = await fetchJsonWithFallback('/api/admin/users/marketing', {
                headers: authHeaders(),
            });
            setMarketingUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Gagal memuat akun marketing.');
        } finally {
            setLoadingMarketingUsers(false);
        }
    };

    useEffect(() => {
        fetchMarketingUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateMarketingField = (key, value) => {
        setMarketingForm((prev) => ({
            ...prev,
            [key]: key === 'no_hp' ? normalizePhone62(value) : value,
        }));
    };

    const handleCreateMarketing = async (event) => {
        event.preventDefault();
        setSavingMarketing(true);
        setError('');
        setSuccess('');

        try {
            const data = await fetchJsonWithFallback('/api/admin/users/marketing', {
                method: 'POST',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(marketingForm),
            });

            setSuccess(data?.message || 'Akun marketing berhasil dibuat.');
            setMarketingForm(initialMarketingForm);
            await fetchMarketingUsers();
        } catch (err) {
            setError(err.message || 'Gagal membuat akun marketing.');
        } finally {
            setSavingMarketing(false);
        }
    };

    const handleDeleteMarketing = async (user) => {
        const confirmed = window.confirm(`Hapus akun marketing "${user.nama}"?`);
        if (!confirmed) return;

        setDeletingMarketingId(user.id);
        setError('');
        setSuccess('');

        try {
            const data = await fetchJsonWithFallback(`/api/admin/users/marketing/${user.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });

            setSuccess(data?.message || 'Akun marketing berhasil dihapus.');
            setMarketingUsers((prev) => prev.filter((item) => Number(item.id) !== Number(user.id)));
        } catch (err) {
            setError(err.message || 'Gagal menghapus akun marketing.');
        } finally {
            setDeletingMarketingId(null);
        }
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-300 py-2">
            <div>
                <h1 className="admin-page-title text-2xl font-bold text-gray-800">Kelola Akun Marketing</h1>
                <p className="admin-page-subtitle text-sm text-gray-500 mt-1">
                    Register publik hanya untuk User. Akun Marketing dibuat oleh Admin Perumahan atau Superadmin.
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
                    <h2 className="text-lg font-semibold text-gray-900">Buat Akun Marketing</h2>
                    <form onSubmit={handleCreateMarketing} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nama"
                                value={marketingForm.nama}
                                onChange={(e) => updateMarketingField('nama', e.target.value)}
                                placeholder="Nama lengkap marketing"
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={marketingForm.email}
                                onChange={(e) => updateMarketingField('email', e.target.value)}
                                placeholder="marketing@email.com"
                                required
                            />
                            <Input
                                label="No. HP"
                                value={marketingForm.no_hp}
                                onChange={(e) => updateMarketingField('no_hp', e.target.value)}
                                placeholder="628xxxxxxxxxx"
                                required
                            />
                            <Input
                                label="Alamat"
                                value={marketingForm.alamat}
                                onChange={(e) => updateMarketingField('alamat', e.target.value)}
                                placeholder="Alamat marketing"
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={marketingForm.password}
                                onChange={(e) => updateMarketingField('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                required
                            />
                            <Input
                                label="Konfirmasi Password"
                                type="password"
                                value={marketingForm.password_confirmation}
                                onChange={(e) => updateMarketingField('password_confirmation', e.target.value)}
                                placeholder="Ulangi password"
                                required
                            />
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={marketingForm.is_active}
                                onChange={(e) => updateMarketingField('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            Akun aktif
                        </label>

                        <div>
                            <Button type="submit" isLoading={savingMarketing} className="w-full sm:w-auto">
                                Buat Akun Marketing
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Akun Marketing</h2>
                    {loadingMarketingUsers ? (
                        <p className="text-sm text-gray-500">Memuat akun marketing...</p>
                    ) : marketingUsers.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada akun marketing.</p>
                    ) : (
                        <div className="overflow-x-auto responsive-table-wrap">
                            <table className="admin-table min-w-full text-sm">
                                <thead className="text-left text-gray-500 border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 pr-4 font-semibold">Nama</th>
                                        <th className="py-3 pr-4 font-semibold">Email</th>
                                        <th className="py-3 pr-4 font-semibold">No. HP</th>
                                        <th className="py-3 pr-4 font-semibold">Status</th>
                                        <th className="py-3 pr-4 font-semibold">Dibuat</th>
                                        <th className="py-3 pr-4 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marketingUsers.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-100">
                                            <td className="py-3 pr-4 text-gray-900 font-medium">{user.nama}</td>
                                            <td className="py-3 pr-4 text-gray-700">{user.email}</td>
                                            <td className="py-3 pr-4 text-gray-700">{user.no_hp}</td>
                                            <td className="py-3 pr-4">
                                                <Badge variant={user.is_active ? 'success' : 'destructive'}>
                                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 pr-4 text-gray-700">{formatDate(user.created_at)}</td>
                                            <td className="py-3 pr-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMarketing(user)}
                                                    disabled={deletingMarketingId === user.id}
                                                    className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <FaTrash />
                                                    {deletingMarketingId === user.id ? 'Menghapus...' : 'Hapus'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
