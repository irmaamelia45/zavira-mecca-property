import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { FiArrowUpRight, FiCheck, FiChevronDown, FiMapPin, FiSearch, FiSliders } from 'react-icons/fi';
import { API_BASE, mapPromoFromApi, getPromoPricing as calculatePromoPricing, resolveImage } from '../utils/promo';

const normalizeListPayload = (payload) => {
    if (Array.isArray(payload)) return payload.filter((item) => item && typeof item === 'object');
    if (Array.isArray(payload?.data)) return payload.data.filter((item) => item && typeof item === 'object');
    return [];
};

const categoryOptions = [
    { value: 'all', label: 'All' },
    { value: 'subsidi', label: 'Perumahan Subsidi' },
    { value: 'komersil', label: 'Perumahan Komersil' },
    { value: 'townhouse', label: 'Townhouse' },
];

const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'low', label: 'Harga Terendah' },
    { value: 'high', label: 'Harga Tertinggi' },
];

const getCategoryLabel = (category) => {
    const key = String(category || '').toLowerCase();
    if (key === 'subsidi') return 'Subsidi';
    if (key === 'komersil') return 'Komersil';
    if (key === 'townhouse') return 'Townhouse';
    return 'Lainnya';
};

const getCategoryBadgeClass = (category) => {
    const key = String(category || '').toLowerCase();
    if (key === 'subsidi') return 'bg-emerald-50/95 text-emerald-700 border-emerald-200';
    if (key === 'komersil') return 'bg-blue-50/95 text-blue-700 border-blue-200';
    if (key === 'townhouse') return 'bg-amber-50/95 text-amber-700 border-amber-200';
    return 'bg-slate-100/95 text-slate-700 border-slate-200';
};

const getStatusBadgeClass = (status) => {
    const key = String(status || '').toLowerCase();
    if (key.includes('coming')) return 'bg-amber-50/95 text-amber-700 border-amber-200';
    if (key.includes('sold')) return 'bg-rose-50/95 text-rose-700 border-rose-200';
    return 'bg-emerald-50/95 text-emerald-700 border-emerald-200';
};

export default function HousingList() {
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [priceSort, setPriceSort] = useState('default');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const filterDropdownRef = useRef(null);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price || 0);
    };

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/api/perumahan`);
                if (!response.ok) {
                    throw new Error('Gagal memuat daftar perumahan.');
                }
                const data = await response.json();
                setProperties(normalizeListPayload(data));
            } catch (err) {
                setError(err.message || 'Gagal memuat daftar perumahan.');
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/promos`);
                if (!response.ok) {
                    throw new Error('Gagal memuat promo.');
                }
                const data = await response.json();
                setPromos(normalizeListPayload(data).map(mapPromoFromApi));
            } catch (err) {
                // Silent fail for promo pricing.
                setPromos([]);
            }
        };

        fetchPromos();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProperties = useMemo(() => {
        const filtered = properties.filter((p) => {
            const query = searchTerm.trim().toLowerCase();
            const searchable = [
                p?.name,
                p?.location,
                p?.type,
                p?.city,
                p?.status,
            ].map((item) => String(item || '')).join(' ').toLowerCase();
            const matchesSearch = !query || searchable.includes(query);

            const category = String(p?.category || '').toLowerCase();
            const matchesPrimaryFilter = filterType === 'all' || category === filterType;
            return matchesSearch && matchesPrimaryFilter;
        });

        if (priceSort === 'low') {
            return [...filtered].sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
        }

        if (priceSort === 'high') {
            return [...filtered].sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
        }

        return filtered;
    }, [properties, searchTerm, filterType, priceSort]);

    const getPromoPricing = (propertyId, basePrice) => (
        calculatePromoPricing(promos, propertyId, basePrice)
    );

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterType('all');
        setPriceSort('default');
    };

    const hasActiveFilters = searchTerm.trim() || filterType !== 'all' || priceSort !== 'default';
    const activeCategoryLabel = categoryOptions.find((option) => option.value === filterType)?.label || 'All';
    const activeSortLabel = sortOptions.find((option) => option.value === priceSort)?.label || 'Default';

    return (
        <div className="container-custom py-12 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-semibold text-[#10214b] mb-2">Daftar Perumahan</h1>
                    <p className="text-gray-600">Cari perumahan favorit yang nyaman bagi keluarga Anda.</p>
                </div>
            </div>

            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for perumahan..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        />
                    </div>

                    <div ref={filterDropdownRef} className="relative lg:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                            aria-expanded={isFilterDropdownOpen}
                            className="h-11 min-w-[210px] w-full lg:w-auto rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-200 inline-flex items-center justify-between gap-3"
                        >
                            <span className="inline-flex items-center gap-2">
                                <FiSliders className="text-primary-500" />
                                {activeCategoryLabel}
                            </span>
                            <FiChevronDown className={`text-slate-500 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <div
                            className={`absolute right-0 z-20 mt-2 w-full min-w-[280px] max-w-[340px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg transition-all duration-200 origin-top ${
                                isFilterDropdownOpen
                                    ? 'pointer-events-auto scale-100 opacity-100'
                                    : 'pointer-events-none scale-95 opacity-0'
                            }`}
                        >
                            <div className="space-y-1">
                                <p className="px-2 pt-1 pb-1 text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">Kategori</p>
                                {categoryOptions.map((option) => {
                                    const isActive = filterType === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFilterType(option.value)}
                                            className={`w-full rounded-lg px-2.5 py-2 text-sm inline-flex items-center justify-between transition-colors ${
                                                isActive
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>{option.label}</span>
                                            {isActive && <FiCheck className="text-primary-600" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="my-2 h-px bg-slate-200" />

                            <div className="space-y-1">
                                <p className="px-2 pt-1 pb-1 text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">Sorting Harga</p>
                                {sortOptions.map((option) => {
                                    const isActive = priceSort === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setPriceSort(option.value)}
                                            className={`w-full rounded-lg px-2.5 py-2 text-sm inline-flex items-center justify-between transition-colors ${
                                                isActive
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>{option.label}</span>
                                            {isActive && <FiCheck className="text-primary-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Menampilkan <span className="font-semibold text-primary-700">{filteredProperties.length}</span> perumahan
                        <span className="ml-2 text-slate-400">• {activeSortLabel}</span>
                    </p>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="w-fit text-xs font-medium text-slate-500 hover:text-slate-700"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-pulse">
                            <div className="aspect-[16/11] bg-slate-200" />
                            <div className="p-5 space-y-3">
                                <div className="h-4 w-2/3 rounded bg-slate-200" />
                                <div className="h-3 w-1/2 rounded bg-slate-200" />
                                <div className="h-10 rounded-xl bg-slate-100" />
                                <div className="h-10 rounded-xl bg-slate-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-red-600 shadow-sm">
                    {error}
                </div>
            ) : filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
                    {filteredProperties.map((prop) => {
                        const basePrice = Number(prop.price) || 0;
                        const promoPricing = getPromoPricing(prop.id, basePrice);
                        const finalPrice = Math.max(0, basePrice - promoPricing.discount);
                        const mainImage = prop.image ? resolveImage(prop.image) : '';
                        const statusLabel = String(prop.status || 'Available');
                        const availableUnits = Number(prop.availableUnits) || 0;

                        return (
                            <Card key={prop.id} className="group h-full overflow-hidden rounded-2xl transition-all duration-300 border border-slate-200/85 bg-white hover:-translate-y-1 hover:shadow-[0_24px_55px_-35px_rgba(16,33,75,0.5)] flex flex-col">
                                <Link to={`/perumahan/${prop.id}`} className="relative aspect-[16/11] overflow-hidden bg-slate-100">
                                    {mainImage ? (
                                        <img src={mainImage} alt={prop.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Tidak ada foto</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#10214b]/68 via-[#10214b]/20 to-transparent" />
                                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                                        <Badge className={`px-3 py-1 backdrop-blur-sm ${getStatusBadgeClass(statusLabel)}`}>
                                            {statusLabel}
                                        </Badge>
                                        <Badge className={`px-3 py-1 backdrop-blur-sm ${getCategoryBadgeClass(prop.category)}`}>
                                            {getCategoryLabel(prop.category)}
                                        </Badge>
                                    </div>
                                    {promoPricing.discount > 0 && (
                                        <div className="absolute left-4 bottom-4 rounded-lg border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary-700 shadow-sm">
                                            Promo -{formatPrice(promoPricing.discount)}
                                        </div>
                                    )}
                                </Link>
                                <CardContent className="p-5 md:p-6 flex flex-col flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-lg md:text-xl font-semibold text-[#10214b] leading-snug line-clamp-2">{prop.name}</h3>
                                        <span className="shrink-0 rounded-lg border border-secondary-200 bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                                            Type {prop.type || '-'}
                                        </span>
                                    </div>

                                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <FiMapPin className="text-primary-600 shrink-0" />
                                        <span className="line-clamp-1">{prop.location || prop.city || '-'}</span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                                            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Unit Tersedia</p>
                                            <p className="mt-1 text-base font-semibold text-slate-800">{availableUnits}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                                            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Harga Mulai</p>
                                            <p className="mt-1 text-base font-semibold text-primary-700">{formatPrice(finalPrice)}</p>
                                            {promoPricing.discount > 0 && (
                                                <p className="text-[11px] text-slate-400 line-through">{formatPrice(basePrice)}</p>
                                            )}
                                        </div>
                                    </div>

                                    <Link to={`/perumahan/${prop.id}`} className="mt-5">
                                        <Button className="w-full justify-between bg-primary-600 hover:bg-primary-700 text-white">
                                            Lihat Detail
                                            <FiArrowUpRight />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-2xl shadow-sm">
                        <FiSearch />
                    </div>
                    <p className="text-slate-900 font-medium text-lg mb-2">Tidak ada properti yang ditemukan</p>
                    <p className="text-slate-500 mb-6">Coba ubah kata kunci atau pilihan filter yang sedang aktif.</p>
                    <Button variant="outline" onClick={handleResetFilters}>Reset Pencarian</Button>
                </div>
            )}
        </div>
    );
}
