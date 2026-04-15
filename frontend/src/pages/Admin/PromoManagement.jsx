import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { FaPlus, FaSearch, FaSlidersH, FaTags, FaCheckCircle, FaPercent, FaMoneyBillWave, FaChevronDown, FaChevronUp, FaCheck } from 'react-icons/fa';
import { API_BASE, formatPromoPeriod, formatMoney } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';

const PROMO_TYPE_FILTERS = [
    { key: 'all', label: 'Semua Tipe' },
    { key: 'percent', label: 'Diskon Persen' },
    { key: 'amount', label: 'Potongan Nominal' },
    { key: 'none', label: 'Info Promo' },
];

const STATUS_FILTERS = [
    { key: 'all', label: 'Semua Status' },
    { key: 'active', label: 'Aktif' },
    { key: 'inactive', label: 'Nonaktif' },
];

const SORT_OPTIONS = [
    { key: 'date_desc', label: 'Periode Terbaru' },
    { key: 'date_asc', label: 'Periode Terlama' },
    { key: 'name_asc', label: 'Judul A-Z' },
    { key: 'name_desc', label: 'Judul Z-A' },
    { key: 'value_desc', label: 'Nilai Promo Tertinggi' },
    { key: 'value_asc', label: 'Nilai Promo Terendah' },
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

export default function PromoManagement() {
    const navigate = useNavigate();
    const [promos, setPromos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [promoTypeFilter, setPromoTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const filterPopoverRef = useRef(null);

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

    const statCards = useMemo(() => ([
        {
            key: 'total',
            label: 'Total Promo',
            value: summary.total,
            desc: 'Promo terdaftar saat ini',
            Icon: FaTags,
        },
        {
            key: 'active',
            label: 'Promo Aktif',
            value: summary.active,
            desc: `${summary.total - summary.active} nonaktif`,
            Icon: FaCheckCircle,
        },
        {
            key: 'percent',
            label: 'Diskon Persen',
            value: summary.percent,
            desc: 'Promo berbasis persentase',
            Icon: FaPercent,
        },
        {
            key: 'amount',
            label: 'Potongan Nominal',
            value: summary.amount,
            desc: `${summary.info} info promo tanpa potongan`,
            Icon: FaMoneyBillWave,
        },
    ]), [summary]);

    const getFilterItemClass = (active) => (
        `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
            active
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-slate-700 hover:bg-slate-50'
        }`
    );

    const filterTriggerLabel = useMemo(() => {
        const activeLabels = [];

        if (promoTypeFilter !== 'all') {
            const typeLabel = PROMO_TYPE_FILTERS.find((item) => item.key === promoTypeFilter)?.label || promoTypeFilter;
            activeLabels.push(typeLabel);
        }

        if (statusFilter !== 'all') {
            const statusLabel = STATUS_FILTERS.find((item) => item.key === statusFilter)?.label || statusFilter;
            activeLabels.push(statusLabel);
        }

        if (sortBy !== 'date_desc') {
            const sortLabel = SORT_OPTIONS.find((item) => item.key === sortBy)?.label || 'Urutkan';
            activeLabels.push(sortLabel);
        }

        if (activeLabels.length === 0) return 'All';
        if (activeLabels.length === 1) return activeLabels[0];
        return `${activeLabels.length} Filter`;
    }, [promoTypeFilter, statusFilter, sortBy]);

    const hasActiveFilter = promoTypeFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'date_desc';

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
                {statCards.map((item) => (
                    <article key={item.key} className="admin-stat-card">
                        <div className="admin-stat-head">
                            <div className="admin-stat-info">
                                <p className="admin-stat-label">{item.label}</p>
                                <p className="admin-stat-value">{item.value}</p>
                                <div className="admin-stat-meta">
                                    <p className="admin-stat-desc">{item.desc}</p>
                                    <div className="admin-stat-icon">
                                        <item.Icon />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative min-w-[250px] flex-1">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                        type="text"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                        placeholder="Cari judul promo, kategori, atau perumahan..."
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
                                <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Tipe Promo</p>
                                {PROMO_TYPE_FILTERS.map((option) => {
                                    const isActive = promoTypeFilter === option.key;
                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setPromoTypeFilter(option.key)}
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
                                {STATUS_FILTERS.map((option) => {
                                    const isActive = statusFilter === option.key;
                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setStatusFilter(option.key)}
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
                                <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Urutkan</p>
                                {SORT_OPTIONS.map((option) => {
                                    const isActive = sortBy === option.key;
                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setSortBy(option.key)}
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
                    {filteredPromos.length} data ditemukan
                </div>
            </div>

            <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
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
                                                <div className="flex justify-center items-center">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="h-8 px-3.5 rounded-md text-[11px] font-semibold !shadow-none hover:!shadow-none"
                                                        onClick={() => navigate(`/admin/promos/${promo.id}`)}
                                                    >
                                                        Detail
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
