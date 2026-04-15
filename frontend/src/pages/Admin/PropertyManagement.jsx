import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { FaPlus, FaSearch, FaSlidersH, FaMapMarkerAlt, FaHome, FaBuilding, FaChevronDown, FaChevronUp, FaCheck } from 'react-icons/fa';
import { API_BASE } from '../../utils/property';
import { authHeaders } from '../../lib/auth';

const STATUS_FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
];

const PRICE_SORT_OPTIONS = [
    { value: 'default', label: 'Default' },
    { value: 'price_asc', label: 'Harga Terendah' },
    { value: 'price_desc', label: 'Harga Tertinggi' },
];

export default function PropertyManagement() {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name_asc');
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const filterPopoverRef = useRef(null);

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

    useEffect(() => {
        if (!filterMenuOpen) return undefined;

        const handleClickOutside = (event) => {
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target)) {
                setFilterMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setFilterMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [filterMenuOpen]);

    const categoryOptions = useMemo(() => {
        const values = Array.from(new Set(
            (properties || [])
                .map((item) => (item.category || '').toString().trim().toLowerCase())
                .filter(Boolean)
        ));
        return values.sort();
    }, [properties]);

    const categoryFilterOptions = useMemo(() => {
        const baseOptions = [
            { value: 'all', label: 'All' },
            { value: 'subsidi', label: 'Perumahan Subsidi' },
            { value: 'komersil', label: 'Perumahan Komersil' },
            { value: 'townhouse', label: 'Townhouse' },
        ];

        const knownValues = new Set(baseOptions.map((item) => item.value));
        const extraOptions = categoryOptions
            .filter((item) => !knownValues.has(item))
            .map((item) => ({ value: item, label: item.toUpperCase() }));

        return [...baseOptions, ...extraOptions];
    }, [categoryOptions]);

    const currentPriceSort = sortBy === 'price_asc' || sortBy === 'price_desc' ? sortBy : 'default';

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
                || (statusFilter === 'active' && item.isActive)
                || (statusFilter === 'inactive' && !item.isActive);

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
        const totalSubsidi = properties.filter(
            (item) => String(item?.category || '').toLowerCase() === 'subsidi'
        ).length;
        const totalKomersil = properties.filter(
            (item) => String(item?.category || '').toLowerCase() === 'komersil'
        ).length;
        const totalTownhouse = properties.filter(
            (item) => String(item?.category || '').toLowerCase() === 'townhouse'
        ).length;

        return { total, totalSubsidi, totalKomersil, totalTownhouse };
    }, [properties]);

    const statCards = useMemo(() => ([
        {
            key: 'total',
            label: 'Total Perumahan',
            value: summary.total,
            desc: 'Total seluruh perumahan',
            icon: FaBuilding,
            toneClass: 'tone-indigo',
        },
        {
            key: 'subsidi',
            label: 'Perumahan Subsidi',
            value: summary.totalSubsidi,
            desc: 'Total perumahan subsidi',
            icon: FaHome,
            toneClass: 'tone-rose',
        },
        {
            key: 'komersil',
            label: 'Perumahan Komersil',
            value: summary.totalKomersil,
            desc: 'Total perumahan komersil',
            icon: FaHome,
            toneClass: 'tone-amber',
        },
        {
            key: 'townhouse',
            label: 'Perumahan Townhouse',
            value: summary.totalTownhouse,
            desc: 'Total perumahan townhouse',
            icon: FaHome,
            toneClass: 'tone-sky',
        },
    ]), [summary]);

    const statusBadgeClass = (prop) => {
        if (!prop.isActive) return 'bg-gray-100 text-gray-700 border-gray-200';
        const label = (prop.status || '').toString().toLowerCase();
        if (label.includes('coming')) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (label.includes('sold')) return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    const filterTriggerLabel = useMemo(() => {
        const activeLabels = [];

        if (categoryFilter !== 'all') {
            const categoryLabel = categoryFilterOptions.find((item) => item.value === categoryFilter)?.label || categoryFilter;
            activeLabels.push(categoryLabel);
        }

        if (statusFilter !== 'all') {
            const statusLabel = STATUS_FILTER_OPTIONS.find((item) => item.value === statusFilter)?.label || statusFilter;
            activeLabels.push(statusLabel);
        }

        if (currentPriceSort !== 'default') {
            const sortLabel = PRICE_SORT_OPTIONS.find((item) => item.value === currentPriceSort)?.label || 'Sorting Harga';
            activeLabels.push(sortLabel);
        }

        if (activeLabels.length === 0) return 'All';
        if (activeLabels.length === 1) return activeLabels[0];
        return `${activeLabels.length} Filter`;
    }, [categoryFilter, statusFilter, currentPriceSort, categoryFilterOptions]);

    const hasActiveFilter = categoryFilter !== 'all' || statusFilter !== 'all' || currentPriceSort !== 'default';

    const getFilterItemClass = (active) => (
        `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
            active
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-slate-700 hover:bg-slate-50'
        }`
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <article key={card.key} className={`admin-stat-card ${card.toneClass}`}>
                            <div className="admin-stat-head">
                                <div className="admin-stat-info">
                                    <p className="admin-stat-label">{card.label}</p>
                                    <p className="admin-stat-value">{card.value}</p>
                                    <div className="admin-stat-meta">
                                        <p className="admin-stat-desc">{card.desc}</p>
                                        <div className="admin-stat-icon">
                                            <Icon />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative min-w-[250px] flex-1">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input
                                type="text"
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                placeholder="Cari nama atau lokasi perumahan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="relative w-full sm:w-auto" ref={filterPopoverRef}>
                            <button
                                type="button"
                                onClick={() => setFilterMenuOpen((prev) => !prev)}
                                className={`inline-flex h-11 w-full sm:min-w-[180px] items-center justify-between rounded-full border px-4 text-sm font-medium transition-colors ${
                                    hasActiveFilter
                                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <FaSlidersH className="text-xs" />
                                    {filterTriggerLabel}
                                    {hasActiveFilter && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                                </span>
                                {filterMenuOpen ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                            </button>

                            {filterMenuOpen && (
                                <div className="absolute left-0 top-[calc(100%+0.55rem)] z-30 w-[min(92vw,320px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]">
                                    <div className="space-y-1">
                                        <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Kategori</p>
                                        {categoryFilterOptions.map((option) => {
                                            const isActive = categoryFilter === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setCategoryFilter(option.value)}
                                                    className={getFilterItemClass(isActive)}
                                                >
                                                    <span>{option.label}</span>
                                                    {isActive && <FaCheck className="text-xs" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="my-3 h-px bg-slate-200" />

                                    <div className="space-y-1">
                                        <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Status</p>
                                        {STATUS_FILTER_OPTIONS.map((option) => {
                                            const isActive = statusFilter === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setStatusFilter(option.value)}
                                                    className={getFilterItemClass(isActive)}
                                                >
                                                    <span>{option.label}</span>
                                                    {isActive && <FaCheck className="text-xs" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="my-3 h-px bg-slate-200" />

                                    <div className="space-y-1">
                                        <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Sorting Harga</p>
                                        {PRICE_SORT_OPTIONS.map((option) => {
                                            const isActive = currentPriceSort === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setSortBy(option.value === 'default' ? 'name_asc' : option.value)}
                                                    className={getFilterItemClass(isActive)}
                                                >
                                                    <span>{option.label}</span>
                                                    {isActive && <FaCheck className="text-xs" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="inline-flex h-11 items-center rounded-xl border border-primary-100 bg-primary-50 px-4 text-sm font-medium text-primary-700 whitespace-nowrap">
                            {filtered.length} data ditemukan
                        </div>
                    </div>
                </div>

            <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-0">

                    {error && (
                        <div className="px-6 py-4 text-sm text-red-600 border-b border-gray-100 bg-red-50/60">{error}</div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px] text-left min-w-[980px]">
                            <thead className="font-semibold uppercase text-[11px] tracking-[0.05em]">
                                <tr>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Perumahan</th>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Lokasi</th>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Kategori</th>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Harga</th>
                                    <th className="px-6 py-4 text-center !bg-primary-700 !text-white">Stok</th>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Status</th>
                                    <th className="px-6 py-4 text-center !bg-primary-700 !text-white">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td className="px-6 py-10 text-gray-500" colSpan="7">Memuat data perumahan...</td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-10 text-gray-500" colSpan="7">Data tidak ditemukan. Coba ubah kata kunci atau filter.</td>
                                    </tr>
                                ) : (
                                    filtered.map((prop) => {
                                        const available = Number(prop.availableUnits) || 0;
                                        const total = Math.max(Number(prop.totalUnits) || 0, 1);
                                        const stockPercent = Math.max(0, Math.min(100, Math.round((available / total) * 100)));

                                        return (
                                            <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{prop.name}</p>
                                                        <p className="text-[11px] text-gray-500 mt-1">Tipe {prop.type || '-'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-gray-600">
                                                    <p className="inline-flex items-center gap-2">
                                                        <FaMapMarkerAlt className="text-primary-500 text-xs" />
                                                        {prop.location || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-[11px] uppercase text-primary-700">
                                                        {(prop.category || '-').toString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 font-semibold text-primary-700">{formatMoney(prop.price)}</td>
                                                <td className="px-6 py-5">
                                                    <div className="max-w-[180px] mx-auto">
                                                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                                                            <span className="text-gray-500">Tersedia</span>
                                                            <span className="font-semibold text-gray-700">{available}/{total}</span>
                                                        </div>
                                                        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${stockPercent <= 25 ? 'bg-red-500' : stockPercent <= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${stockPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Badge className={`rounded-full px-3 py-1 text-xs ${statusBadgeClass(prop)}`}>
                                                        {prop.status || (prop.isActive ? 'Available' : 'Nonaktif')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="h-9 px-4 rounded-lg text-[11px] font-semibold shadow-sm hover:shadow-md"
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
