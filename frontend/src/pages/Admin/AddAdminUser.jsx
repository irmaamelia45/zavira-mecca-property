import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { fetchJsonWithFallback } from '../../utils/promo';
import { authHeaders, getUserRole } from '../../lib/auth';
import { normalizePhone62 } from '../../lib/phone';

const initialAdminForm = {
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
    password: '',
    password_confirmation: '',
    is_active: true,
};

export default function AddAdminUser() {
    const navigate = useNavigate();
    const currentRole = getUserRole();
    const isSuperadmin = currentRole === 'superadmin';

    const [adminForm, setAdminForm] = useState(initialAdminForm);
    const [savingAdmin, setSavingAdmin] = useState(false);
    const [error, setError] = useState('');

    const updateAdminField = (key, value) => {
        setAdminForm((prev) => ({
            ...prev,
            [key]: key === 'no_hp' ? normalizePhone62(value) : value,
        }));

        if (error) {
            setError('');
        }
    };

    const handleCreateAdmin = async (event) => {
        event.preventDefault();
        if (!isSuperadmin) return;

        setSavingAdmin(true);
        setError('');

        try {
            const data = await fetchJsonWithFallback('/api/admin/users/admins', {
                method: 'POST',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(adminForm),
            });

            navigate('/admin/admin-users', {
                state: {
                    successMessage: data?.message || 'Akun Admin Perumahan berhasil dibuat.',
                },
            });
        } catch (err) {
            setError(err.message || 'Gagal membuat akun Admin Perumahan.');
        } finally {
            setSavingAdmin(false);
        }
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin/admin-users')} className="p-2 shrink-0">
                        <FaArrowLeft />
                    </Button>
                    <div>
                        <h1 className="admin-page-title text-2xl font-bold text-primary-900">Tambah Akun Admin Perumahan</h1>
                        <p className="admin-page-subtitle text-gray-500 text-sm">
                            Hanya superadmin yang dapat membuat akun Admin Perumahan.
                        </p>
                    </div>
                </div>
                <div className="admin-page-head-actions flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/admin-users')}
                        className="w-full sm:w-auto"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleCreateAdmin}
                        disabled={savingAdmin || !isSuperadmin}
                        className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto"
                    >
                        {savingAdmin ? 'Menyimpan...' : (
                            <>
                                <FaSave className="mr-2" />
                                Simpan Akun
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {!isSuperadmin && (
                <Card className="border border-amber-200 shadow-sm bg-amber-50/60">
                    <CardContent className="p-6 space-y-2">
                        <h2 className="text-lg font-semibold text-amber-900">Fitur Terkunci</h2>
                        <p className="text-sm text-amber-800">Hanya superadmin yang dapat mengakses fitur ini.</p>
                    </CardContent>
                </Card>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {isSuperadmin && (
                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Form Akun Admin Perumahan</h2>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nama"
                                    value={adminForm.nama}
                                    onChange={(e) => updateAdminField('nama', e.target.value)}
                                    placeholder="Nama lengkap admin perumahan"
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={adminForm.email}
                                    onChange={(e) => updateAdminField('email', e.target.value)}
                                    placeholder="adminperumahan@email.com"
                                    required
                                />
                                <Input
                                    label="No. HP"
                                    value={adminForm.no_hp}
                                    onChange={(e) => updateAdminField('no_hp', e.target.value)}
                                    placeholder="628xxxxxxxxxx"
                                    required
                                />
                                <Input
                                    label="Alamat"
                                    value={adminForm.alamat}
                                    onChange={(e) => updateAdminField('alamat', e.target.value)}
                                    placeholder="Alamat admin perumahan"
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    value={adminForm.password}
                                    onChange={(e) => updateAdminField('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    required
                                />
                                <Input
                                    label="Konfirmasi Password"
                                    type="password"
                                    value={adminForm.password_confirmation}
                                    onChange={(e) => updateAdminField('password_confirmation', e.target.value)}
                                    placeholder="Ulangi password"
                                    required
                                />
                            </div>

                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={adminForm.is_active}
                                    onChange={(e) => updateAdminField('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                Akun aktif
                            </label>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
