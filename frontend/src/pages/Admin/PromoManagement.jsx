import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { FaPlus, FaSearch, FaSyncAlt, FaSlidersH } from 'react-icons/fa';
import { API_BASE, formatPromoPeriod, formatMoney } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';

const PROMO_TYPE_FILTERS = [
    { key: 'all', label: 'Semua Tipe' },
    { key: 'percent', label: 'Diskon Persen' },
    { key: 'amount', label: 'Potongan Nominal' },
    { key: 'none', label: 'Info Promo' },
];

const normalizePromoType = (value) => {
    if (value === 'percent') return 'percent';
    if (value === 'amount') return 'amount';
    if (value === 'none') return 'none';
    return 'none';
};

const promoTypeLabel = (value) => {
    if (value === 'percent') return 'Diskon Persen';
    if (value === 'amount') return 'Potongan Nominal';
    return 'Info Promo';
};

const statusChipClass = (activeFilter, value) => (
    activeFilter === value
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-600 border-gray-200'
);

const typeChipClass = (activeFilter, value) => (
    activeFilter === value
        ? 'bg-primary-600 text-white border-primary-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:text-primary-700'
);

export default function PromoManagement() {
    const navigate = useNavigate();
    const [promos, setPromos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [promoTypeFilter, setPromoTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');

    const fetchPromos = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/promos`, {
                headers: authHeaders(),
            });
            if (!response.ok) {
                throw new Error('Gagal memuat data promo.');
            }

            const data = await response.json();
            const mapped = (data || []).map((promo) => {
                const typeKey = normalizePromoType(promo.tipe_promo);
                const value = Number(promo.nilai_promo || 0);

                return {
                    id: promo.id,
                    title: promo.judul || '-',
                    category: promo.kategori || '-',
                    property: (promo.properties || []).map((item) => item.name).join(', ') || 'Semua Perumahan',
                    period: formatPromoPeriod(promo.tanggal_mulai, promo.tanggal_selesai),
                    startDate: promo.tanggal_mulai || null,
                    endDate: promo.tanggal_selesai || null,
                    isActive: Boolean(promo.is_active),
                    promoType: typeKey,
                    promoTypeLabel: promoTypeLabel(typeKey),
                    promoValue: value,
                    promoValueLabel: typeKey === 'percent'
                        ? `${value}%`
                        : typeKey === 'amount'
                            ? formatMoney(value)
                            : 'Tanpa potongan',
                };
            });

            setPromos(mapped);
        } catch (err) {
            setError(err.message || 'Gagal memuat data promo.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus promo ini?')) {
            try {
                const response = await fetch(`${API_BASE}/api/promos/${id}`, {
                    method: 'DELETE',
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Gagal menghapus promo.');
                }
                setPromos((prev) => prev.filter((promo) => promo.id !== id));
            } catch (err) {
                alert(err.message || 'Gagal menghapus promo.');
            }
        }
    };

    const filteredPromos = useMemo(() => {
        const q = search.trim().toLowerCase();

        const list = promos.filter((promo) => {
            const matchesSearch = !q
                || (promo.title || '').toLowerCase().includes(q)
                || (promo.property || '').toLowerCase().includes(q)
                || (promo.period || '').toLowerCase().includes(q)
                || (promo.category || '').toLowerCase().includes(q);

            const matchesType = promoTypeFilter === 'all' || promo.promoType === promoTypeFilter;
            const matchesStatus = statusFilter === 'all'
                || (statusFilter === 'active' && promo.isActive)
                || (statusFilter === 'inactive' && !promo.isActive);

            return matchesSearch && matchesType && matchesStatus;
        });

        return list.sort((a, b) => {
            if (sortBy === 'name_asc') return (a.title || '').localeCompare(b.title || '');
            if (sortBy === 'name_desc') return (b.title || '').localeCompare(a.title || '');
            if (sortBy === 'value_desc') return (Number(b.promoValue) || 0) - (Number(a.promoValue) || 0);
            if (sortBy === 'value_asc') return (Number(a.promoValue) || 0) - (Number(b.promoValue) || 0);
            if (sortBy === 'date_asc') return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
            return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
        });
    }, [promos, search, promoTypeFilter, statusFilter, sortBy]);

    const summary = useMemo(() => {
        const total = promos.length;
        const active = promos.filter((item) => item.isActive).length;
        const percent = promos.filter((item) => item.promoType === 'percent').length;
        const amount = promos.filter((item) => item.promoType === 'amount').length;
        const info = promos.filter((item) => item.promoType === 'none').length;

        return { total, active, percent, amount, info };
    }, [promos]);

    return (
        <div className="admin-page space-y-7 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="admin-page-title text-[2rem] leading-tight tracking-tight font-semibold text-gray-900">Manajemen Promo</h1>
                    <p className="admin-page-subtitle text-gray-500 text-sm mt-1">Kelola promo yang tampil di halaman user dan detail perumahan.</p>
                </div>
                <Button onClick={() => navigate('/admin/promos/add')} className="w-full sm:w-auto">
                    <FaPlus className="mr-2" /> Tambah Promo
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-blue-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-blue-700 font-medium">Total Promo</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.total}</p>
                        <p className="text-xs text-gray-500 mt-1">Promo terdaftar saat ini</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-emerald-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-emerald-700 font-medium">Promo Aktif</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.active}</p>
                        <p className="text-xs text-gray-500 mt-1">{summary.total - summary.active} nonaktif</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-violet-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-violet-700 font-medium">Diskon Persen</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.percent}</p>
                        <p className="text-xs text-gray-500 mt-1">Promo berbasis persentase</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-amber-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-amber-700 font-medium">Potongan Nominal</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.amount}</p>
                        <p className="text-xs text-gray-500 mt-1">{summary.info} info promo tanpa potongan</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
                    <div className="p-5 border-b border-gray-100 flex flex-col gap-4 bg-white">
                        <div className="admin-toolbar flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="relative w-full lg:max-w-sm">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    className="w-full h-11 rounded-lg border border-gray-200 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    placeholder="Cari judul promo, kategori, atau perumahan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                                <span className="text-sm text-gray-500">{filteredPromos.length} data ditemukan</span>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-auto">
                                        <FaSlidersH className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                        <select
                                            className="w-full sm:w-auto h-10 rounded-lg border border-gray-200 pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="date_desc">Periode Terbaru</option>
                                            <option value="date_asc">Periode Terlama</option>
                                            <option value="name_asc">Judul A-Z</option>
                                            <option value="name_desc">Judul Z-A</option>
                                            <option value="value_desc">Nilai Promo Tertinggi</option>
                                            <option value="value_asc">Nilai Promo Terendah</option>
                                        </select>
                                    </div>
                                    <Button variant="outline" className="h-10 px-3.5 w-full sm:w-auto" onClick={fetchPromos}>
                                        <FaSyncAlt className="mr-2" /> Refresh
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="admin-filter-row flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="admin-chip-group flex flex-wrap items-center gap-2">
                                {PROMO_TYPE_FILTERS.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setPromoTypeFilter(item.key)}
                                        className={`h-8 px-3.5 rounded-md text-[11px] border transition-colors ${typeChipClass(promoTypeFilter, item.key)}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <div className="admin-chip-group flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className={`h-8 px-3.5 rounded-md text-[11px] border transition-colors ${statusChipClass(statusFilter, 'all')}`}
                                >
                                    Semua Status
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('active')}
                                    className={`h-8 px-3.5 rounded-md text-[11px] border transition-colors ${statusFilter === 'active' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    Aktif
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('inactive')}
                                    className={`h-8 px-3.5 rounded-md text-[11px] border transition-colors ${statusFilter === 'inactive' ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    Nonaktif
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto responsive-table-wrap">
                        <table className="admin-table w-full text-[13px] text-left min-w-[1080px]">
                            <thead className="bg-[#f8fafc] text-gray-500 font-semibold uppercase text-[10px] tracking-[0.06em]">
                                <tr>
                                    <th className="px-6 py-4">Promo</th>
                                    <th className="px-6 py-4">Perumahan</th>
                                    <th className="px-6 py-4">Tipe</th>
                                    <th className="px-6 py-4">Periode</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="6">Memuat data promo...</td>
                                    </tr>
                                ) : filteredPromos.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="6">Data promo tidak ditemukan. Coba ubah kata kunci atau filter.</td>
                                    </tr>
                                ) : (
                                    filteredPromos.map((promo) => (
                                        <tr key={promo.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{promo.title}</p>
                                                    <p className="text-[11px] text-gray-500 mt-1">{promo.category}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-[320px]">
                                                <p className="leading-relaxed break-words">{promo.property}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1.5">
                                                    <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] uppercase text-gray-700">
                                                        {promo.promoTypeLabel}
                                                    </span>
                                                    <p className="text-[11px] text-gray-500">{promo.promoValueLabel}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{promo.period}</td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    className={promo.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-xs' : 'bg-gray-100 text-gray-700 border-gray-200 text-xs'}
                                                >
                                                    {promo.isActive ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="h-8 px-3.5 rounded-md text-[11px] font-semibold !shadow-none hover:!shadow-none"
                                                        onClick={() => navigate(`/admin/promos/edit/${promo.id}`)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-3.5 rounded-md text-[11px] font-semibold text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(promo.id)}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
