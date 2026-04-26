import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { formatMoney, formatPromoPeriod } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';
import { apiJson } from '../../lib/api';
import { FaArrowLeft, FaClock, FaEdit, FaHome, FaPercent, FaTag, FaTrash } from 'react-icons/fa';

const promoTypeLabel = (value) => {
    if (value === 'percent') return 'Diskon Persen';
    if (value === 'amount') return 'Potongan Nominal';
    return 'Info Promo';
};

export default function PromoDetailAdmin() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [promo, setPromo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const fetchPromo = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiJson(`/promos/${id}`, {
                headers: authHeaders(),
                defaultErrorMessage: 'Detail promo tidak ditemukan.',
            });
            setPromo(data || null);
        } catch (err) {
            setError(err.message || 'Gagal memuat detail promo.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPromo();
    }, [fetchPromo]);

    const handleDelete = async () => {
        if (!promo?.id) return;
        if (!window.confirm('Apakah Anda yakin ingin menghapus promo ini?')) {
            return;
        }

        setDeleting(true);
        try {
            await apiJson(`/promos/${promo.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
                defaultErrorMessage: 'Gagal menghapus promo.',
            });

            alert('Promo berhasil dihapus.');
            navigate('/admin/promos');
        } catch (err) {
            alert(err.message || 'Gagal menghapus promo.');
        } finally {
            setDeleting(false);
        }
    };

    const propertyItems = useMemo(() => {
        const list = Array.isArray(promo?.properties) ? promo.properties : [];
        return list
            .map((item) => ({
                id: item?.id ?? item?.id_perumahan ?? null,
                name: item?.name || '',
            }))
            .filter((item) => item.name);
    }, [promo]);

    const promoType = promo?.tipe_promo || 'none';
    const promoValue = Number(promo?.nilai_promo || 0);
    const promoValueLabel = promoType === 'percent'
        ? `${promoValue}%`
        : promoType === 'amount'
            ? formatMoney(promoValue)
            : 'Tanpa potongan';
    const statusLabel = promo?.is_active ? 'Aktif' : 'Nonaktif';
    const periodLabel = formatPromoPeriod(promo?.tanggal_mulai, promo?.tanggal_selesai);

    if (loading) {
        return <div className="p-8 text-sm text-gray-500">Memuat detail promo...</div>;
    }

    if (error || !promo) {
        return (
            <div className="space-y-4 p-6">
                <p className="text-red-600">{error || 'Detail promo tidak ditemukan.'}</p>
                <Button variant="outline" onClick={() => navigate('/admin/promos')}>
                    <FaArrowLeft className="mr-2" /> Kembali ke Manajemen Promo
                </Button>
            </div>
        );
    }

    return (
        <div className="admin-page space-y-7 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button variant="ghost" onClick={() => navigate('/admin/promos')} className="px-2 w-full sm:w-auto text-slate-700">
                    <FaArrowLeft className="mr-2" /> Kembali
                </Button>
                <div className="admin-page-head-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        className="h-11 px-5 rounded-lg w-full sm:w-auto"
                        onClick={() => navigate(`/admin/promos/edit/${promo.id}`)}
                    >
                        <FaEdit className="mr-2" /> Edit Promo
                    </Button>
                    <Button
                        variant="danger"
                        className="h-11 px-5 rounded-lg w-full sm:w-auto"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        <FaTrash className="mr-2" /> {deleting ? 'Menghapus...' : 'Hapus Promo'}
                    </Button>
                </div>
            </div>

            <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm">
                <CardContent className="p-6 md:p-7">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-[#0b1e45]">{promo.judul || '-'}</h1>
                            <div className="mt-2 flex items-center gap-2 text-slate-600 text-sm">
                                <FaClock className="text-[#35518b]" />
                                {periodLabel}
                            </div>
                        </div>
                        <div className="text-left lg:text-right">
                            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Nilai Promo</p>
                            <p className="text-4xl font-bold text-[#0b1e45] mt-1 leading-none">{promoValueLabel}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <Badge className={promo?.is_active ? 'rounded-full px-3 py-1 border-emerald-200 bg-emerald-100 text-emerald-700' : 'rounded-full px-3 py-1 border-slate-200 bg-slate-100 text-slate-700'}>
                            {statusLabel}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1 border-primary-200 bg-primary-50 text-primary-700">
                            <FaTag className="mr-1" /> {promo.kategori || '-'}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1 border-slate-200 bg-slate-50 text-slate-700">
                            <FaPercent className="mr-1" /> {promoTypeLabel(promoType)}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm lg:col-span-2">
                    <CardContent className="p-6 space-y-5">
                        <h3 className="text-xl font-semibold text-[#0b1e45]">Informasi Promo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Kategori</p>
                                <p className="font-medium text-slate-800 mt-1">{promo.kategori || '-'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Tipe Promo</p>
                                <p className="font-medium text-slate-800 mt-1">{promoTypeLabel(promoType)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Nilai Promo</p>
                                <p className="font-medium text-slate-800 mt-1">{promoValueLabel}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Periode</p>
                                <p className="font-medium text-slate-800 mt-1">{periodLabel}</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs text-slate-500 mb-1">Deskripsi</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{promo.deskripsi || '-'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-semibold text-[#0b1e45]">Perumahan Terkait</h3>
                        {propertyItems.length ? (
                            <div className="space-y-2">
                                {propertyItems.map((item) => (
                                    <button
                                        key={`${item.name}-${item.id ?? 'no-id'}`}
                                        type="button"
                                        onClick={() => item.id && navigate(`/admin/properties/${item.id}`)}
                                        disabled={!item.id}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 inline-flex items-center gap-2 w-full text-left transition-colors hover:bg-primary-50 hover:border-primary-200 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:border-slate-200"
                                    >
                                        <FaHome className="text-primary-600" />
                                        <span>{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                                Belum ada perumahan terkait.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
