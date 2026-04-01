import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { FaPlus, FaSearch, FaSyncAlt, FaSlidersH, FaMapMarkerAlt } from 'react-icons/fa';
import { API_BASE } from '../../utils/property';
import { authHeaders } from '../../lib/auth';

export default function PropertyManagement() {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name_asc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatMoney = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val || 0);

    const fetchProperties = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/admin/perumahan`, {
                headers: authHeaders(),
            });
            if (!response.ok) {
                throw new Error('Gagal memuat data perumahan.');
            }
            const data = await response.json();
            setProperties(data || []);
        } catch (err) {
            setError(err.message || 'Gagal memuat data perumahan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const categoryOptions = useMemo(() => {
        const values = Array.from(new Set(
            (properties || [])
                .map((item) => (item.category || '').toString().trim().toLowerCase())
                .filter(Boolean)
        ));
        return values.sort();
    }, [properties]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const result = (properties || []).filter((item) => {
            const matchSearch = !q
                || (item.name || '').toLowerCase().includes(q)
                || (item.location || '').toLowerCase().includes(q)
                || (item.city || '').toLowerCase().includes(q);

            const category = (item.category || '').toString().toLowerCase();
            const matchCategory = categoryFilter === 'all' || category === categoryFilter;

            const matchStatus = statusFilter === 'all'
                || (statusFilter === 'active' && Boolean(item.isActive))
                || (statusFilter === 'inactive' && !Boolean(item.isActive));

            return matchSearch && matchCategory && matchStatus;
        });

        return result.sort((a, b) => {
            if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
            if (sortBy === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
            if (sortBy === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
            if (sortBy === 'stock_asc') return (Number(a.availableUnits) || 0) - (Number(b.availableUnits) || 0);
            if (sortBy === 'stock_desc') return (Number(b.availableUnits) || 0) - (Number(a.availableUnits) || 0);
            return 0;
        });
    }, [properties, search, categoryFilter, statusFilter, sortBy]);

    const summary = useMemo(() => {
        const total = properties.length;
        const totalActive = properties.filter((item) => item.isActive).length;
        const totalInactive = total - totalActive;
        const totalAvailableUnits = properties.reduce((acc, item) => acc + (Number(item.availableUnits) || 0), 0);
        const totalSoldUnits = properties.reduce((acc, item) => {
            const totalUnits = Number(item.totalUnits) || 0;
            const available = Number(item.availableUnits) || 0;
            return acc + Math.max(totalUnits - available, 0);
        }, 0);

        return { total, totalActive, totalInactive, totalAvailableUnits, totalSoldUnits };
    }, [properties]);

    const statusBadgeClass = (prop) => {
        if (!prop.isActive) return 'bg-gray-100 text-gray-700 border-gray-200';
        const label = (prop.status || '').toString().toLowerCase();
        if (label.includes('coming')) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (label.includes('sold')) return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    const categoryChipClass = (value) => (
        categoryFilter === value
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:text-primary-700'
    );

    return (
        <div className="space-y-7 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[2rem] leading-tight tracking-tight font-semibold text-gray-900">Manajemen Perumahan</h1>
                    <p className="text-gray-500 text-sm mt-1">Data di sini akan tampil pada halaman perumahan dan detail user.</p>
                </div>
                <Button onClick={() => navigate('/admin/properties/add')}>
                    <FaPlus className="mr-2" /> Tambah Perumahan
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-blue-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-blue-700 font-medium">Total Perumahan</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.total}</p>
                        <p className="text-xs text-gray-500 mt-1">Unit terdaftar saat ini</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-emerald-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-emerald-700 font-medium">Perumahan Aktif</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.totalActive}</p>
                        <p className="text-xs text-gray-500 mt-1">{summary.totalInactive} nonaktif</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-violet-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-violet-700 font-medium">Unit Tersedia</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.totalAvailableUnits}</p>
                        <p className="text-xs text-gray-500 mt-1">Akumulasi semua perumahan</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-amber-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-amber-700 font-medium">Unit Terjual</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.totalSoldUnits}</p>
                        <p className="text-xs text-gray-500 mt-1">Akumulasi unit yang sudah terjual</p>
                    </div>
                </div>
            </div>

            <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
                    <div className="p-5 border-b border-gray-100 flex flex-col gap-4 bg-white">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="relative w-full lg:max-w-sm">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    className="w-full h-11 rounded-lg border border-gray-200 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    placeholder="Cari nama atau lokasi perumahan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sm text-gray-500">{filtered.length} data ditemukan</span>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <FaSlidersH className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                        <select
                                            className="h-10 rounded-lg border border-gray-200 pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="name_asc">Nama A-Z</option>
                                            <option value="name_desc">Nama Z-A</option>
                                            <option value="price_desc">Harga Tertinggi</option>
                                            <option value="price_asc">Harga Terendah</option>
                                            <option value="stock_desc">Stok Terbanyak</option>
                                            <option value="stock_asc">Stok Tersedikit</option>
                                        </select>
                                    </div>
                                    <Button variant="outline" className="h-10 px-3.5" onClick={fetchProperties}>
                                        <FaSyncAlt className="mr-2" /> Refresh
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCategoryFilter('all')}
                                    className={`h-8 px-3.5 rounded-md text-[11px] border transition-colors ${categoryChipClass('all')}`}
                                >
                                    Semua Kategori
                                </button>
                                {categoryOptions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setCategoryFilter(item)}
                                        className={`h-8 px-3.5 rounded-md text-[11px] border uppercase transition-colors ${categoryChipClass(item)}`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className={`h-8 px-3.5 rounded-md text-[11px] border transition-colors ${statusFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
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

                    {error && (
                        <div className="px-6 py-4 text-sm text-red-600 border-b border-gray-100 bg-red-50/60">{error}</div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px] text-left min-w-[980px]">
                            <thead className="bg-[#f8fafc] text-gray-500 font-semibold uppercase text-[10px] tracking-[0.06em]">
                                <tr>
                                    <th className="px-6 py-4">Perumahan</th>
                                    <th className="px-6 py-4">Lokasi</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Harga</th>
                                    <th className="px-6 py-4 text-center">Stok</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="7">Memuat data perumahan...</td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="7">Data tidak ditemukan. Coba ubah kata kunci atau filter.</td>
                                    </tr>
                                ) : (
                                    filtered.map((prop) => {
                                        const available = Number(prop.availableUnits) || 0;
                                        const total = Math.max(Number(prop.totalUnits) || 0, 1);
                                        const stockPercent = Math.max(0, Math.min(100, Math.round((available / total) * 100)));

                                        return (
                                            <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{prop.name}</p>
                                                        <p className="text-[11px] text-gray-500 mt-1">Tipe {prop.type || '-'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    <p className="inline-flex items-center gap-2">
                                                        <FaMapMarkerAlt className="text-primary-500 text-xs" />
                                                        {prop.location || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] uppercase text-gray-700">
                                                        {(prop.category || '-').toString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-primary-700">{formatMoney(prop.price)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[180px] mx-auto">
                                                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                                                            <span className="text-gray-500">Tersedia</span>
                                                            <span className="font-semibold text-gray-700">{available}/{total}</span>
                                                        </div>
                                                        <div className="h-2 w-full rounded-sm bg-gray-100 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-sm ${stockPercent <= 25 ? 'bg-red-500' : stockPercent <= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${stockPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`text-xs ${statusBadgeClass(prop)}`}>
                                                        {prop.status || (prop.isActive ? 'Available' : 'Nonaktif')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="h-8 px-3.5 rounded-md text-[11px] font-semibold !shadow-none hover:!shadow-none"
                                                            onClick={() => navigate(`/admin/properties/${prop.id}`)}
                                                        >
                                                            Detail
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
