import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { FaTrash } from 'react-icons/fa';
import { FiArrowLeft, FiArrowUpRight, FiMapPin } from 'react-icons/fi';
import {
    API_BASE,
    getPromoPricing as calculatePromoPricing,
    mapPromoFromApi,
    normalizeApiListPayload,
    resolveImage,
} from '../utils/promo';
import { getFavoriteIds, removeFavoriteProperty } from '../lib/favorites';

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

export default function AccountFavorites() {
    const [favorites, setFavorites] = useState([]);
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatMoney = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val || 0);

    const getPromoPricing = (propertyId, basePrice) => (
        calculatePromoPricing(promos, propertyId, basePrice)
    );

    useEffect(() => {
        const fetchFavorites = async () => {
            setLoading(true);
            setError('');
            try {
                const ids = getFavoriteIds();
                if (ids.length === 0) {
                    setFavorites([]);
                    setPromos([]);
                    return;
                }

                const propertiesResponse = await fetch(`${API_BASE}/api/perumahan`);
                if (!propertiesResponse.ok) {
                    throw new Error('Gagal memuat data favorit.');
                }

                const propertiesData = await propertiesResponse.json();
                const normalizedProperties = normalizeApiListPayload(propertiesData);
                const byId = new Map(normalizedProperties.map((item) => [Number(item.id), item]));
                const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
                setFavorites(ordered);

                try {
                    const promosResponse = await fetch(`${API_BASE}/api/promos`);
                    if (!promosResponse.ok) {
                        setPromos([]);
                        return;
                    }
                    const promosData = await promosResponse.json();
                    setPromos(normalizeApiListPayload(promosData).map(mapPromoFromApi));
                } catch {
                    setPromos([]);
                }
            } catch (err) {
                setError(err.message || 'Gagal memuat data favorit.');
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    const removeFavorite = (id) => {
        removeFavoriteProperty(id);
        setFavorites((prev) => prev.filter((item) => Number(item.id) !== Number(id)));
    };

    return (
        <div className="container-custom py-10 pb-20 space-y-8">
            <Link
                to="/akun"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-700"
            >
                <FiArrowLeft className="text-xl" />
                <span className="text-base font-medium">Kembali ke Akun</span>
            </Link>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Perumahan Favorit</h1>
                    <p className="text-gray-500">Daftar perumahan yang Anda simpan.</p>
                </div>
                <Link to="/perumahan">
                    <Button variant="outline">Cari Lainnya</Button>
                </Link>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Memuat data favorit...</p>
            ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : favorites.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-4">Belum ada properti favorit.</p>
                    <Link to="/perumahan">
                        <Button>Jelajahi Perumahan</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
                    {favorites.map((item) => {
                        const basePrice = Number(item.price) || 0;
                        const promoPricing = getPromoPricing(item.id, basePrice);
                        const finalPrice = Math.max(0, basePrice - promoPricing.discount);
                        const mainImage = item.image ? resolveImage(item.image) : '';
                        const statusLabel = String(item.status || 'Available');
                        const availableUnits = Number(item.availableUnits) || 0;

                        return (
                            <Card key={item.id} className="group h-full overflow-hidden rounded-2xl transition-all duration-300 border border-slate-200/85 bg-white hover:-translate-y-1 hover:shadow-[0_24px_55px_-35px_rgba(16,33,75,0.5)] flex flex-col">
                                <Link to={`/perumahan/${item.id}`} className="relative aspect-[16/11] overflow-hidden bg-slate-100">
                                    {mainImage ? (
                                        <img src={mainImage} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Tidak ada foto</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#10214b]/68 via-[#10214b]/20 to-transparent" />
                                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                                        <Badge className={`px-3 py-1 backdrop-blur-sm ${getStatusBadgeClass(statusLabel)}`}>
                                            {statusLabel}
                                        </Badge>
                                        <Badge className={`px-3 py-1 backdrop-blur-sm ${getCategoryBadgeClass(item.category)}`}>
                                            {getCategoryLabel(item.category)}
                                        </Badge>
                                    </div>
                                    {promoPricing.discount > 0 && (
                                        <div className="absolute left-4 bottom-4 rounded-lg border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary-700 shadow-sm">
                                            Promo -{formatMoney(promoPricing.discount)}
                                        </div>
                                    )}
                                </Link>
                                <CardContent className="p-5 md:p-6 flex flex-col flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-lg md:text-xl font-semibold text-[#10214b] leading-snug line-clamp-2">{item.name}</h3>
                                        <span className="shrink-0 rounded-lg border border-secondary-200 bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                                            Type {item.type || '-'}
                                        </span>
                                    </div>

                                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <FiMapPin className="text-primary-600 shrink-0" />
                                        <span className="line-clamp-1">{item.location || item.city || '-'}</span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                                            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Unit Tersedia</p>
                                            <p className="mt-1 text-base font-semibold text-slate-800">{availableUnits}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                                            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Harga Mulai</p>
                                            <p className="mt-1 text-base font-semibold text-primary-700">{formatMoney(finalPrice)}</p>
                                            {promoPricing.discount > 0 && (
                                                <p className="text-[11px] text-slate-400 line-through">{formatMoney(basePrice)}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-5 flex items-center gap-2">
                                        <Link to={`/perumahan/${item.id}`} className="flex-1">
                                            <Button className="w-full justify-between bg-primary-600 hover:bg-primary-700 text-white">
                                                Lihat Detail
                                                <FiArrowUpRight />
                                            </Button>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => removeFavorite(item.id)}
                                            className="h-10 w-10 shrink-0 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                                            title="Hapus dari favorit"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
