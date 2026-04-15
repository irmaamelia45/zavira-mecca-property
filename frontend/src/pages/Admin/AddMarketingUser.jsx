import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { fetchJsonWithFallback } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';
import { normalizePhone62 } from '../../lib/phone';

const initialMarketingForm = {
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
    password: '',
    password_confirmation: '',
    is_active: true,
};

export default function AddMarketingUser() {
    const navigate = useNavigate();
    const [marketingForm, setMarketingForm] = useState(initialMarketingForm);
    const [savingMarketing, setSavingMarketing] = useState(false);
    const [error, setError] = useState('');

    const updateMarketingField = (key, value) => {
        setMarketingForm((prev) => ({
            ...prev,
            [key]: key === 'no_hp' ? normalizePhone62(value) : value,
        }));
        if (error) {
            setError('');
        }
    };

    const handleCreateMarketing = async (event) => {
        event.preventDefault();
        setSavingMarketing(true);
        setError('');

        try {
            const data = await fetchJsonWithFallback('/api/admin/users/marketing', {
                method: 'POST',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(marketingForm),
            });

            navigate('/admin/marketing-users', {
                state: {
                    successMessage: data?.message || 'Akun marketing berhasil dibuat.',
                },
            });
        } catch (err) {
            setError(err.message || 'Gagal membuat akun marketing.');
        } finally {
            setSavingMarketing(false);
        }
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin/marketing-users')} className="p-2 shrink-0">
                        <FaArrowLeft />
                    </Button>
                    <div>
                        <h1 className="admin-page-title text-2xl font-bold text-primary-900">Tambah Akun Marketing</h1>
                        <p className="admin-page-subtitle text-gray-500 text-sm">
                            Buat akun marketing baru untuk kebutuhan pemasaran perumahan.
                        </p>
                    </div>
                </div>
                <div className="admin-page-head-actions flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/marketing-users')}
                        className="w-full sm:w-auto"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleCreateMarketing}
                        disabled={savingMarketing}
                        className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto"
                    >
                        {savingMarketing ? 'Menyimpan...' : (
                            <>
                                <FaSave className="mr-2" />
                                Simpan Akun
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Form Akun Marketing</h2>
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
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
