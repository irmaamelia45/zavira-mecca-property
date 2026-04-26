import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { FaClipboardList, FaTrash } from 'react-icons/fa';
import { FiActivity, FiArrowUpRight, FiCalendar, FiCheckCircle, FiClock, FiFlag, FiHash, FiHome, FiMapPin, FiXCircle } from 'react-icons/fi';
import {
    getPromoPricing as calculatePromoPricing,
    mapPromoFromApi,
    normalizeApiListPayload,
    resolveImage,
} from '../utils/promo';
import { apiJson } from '../lib/api';
import { authHeaders, getStoredUser, saveAuth } from '../lib/auth';
import { getFavoriteIds, removeFavoriteProperty } from '../lib/favorites';

const defaultUser = {
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
};

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
    if (key.includes('sold') || key.includes('terjual')) return 'bg-rose-50/95 text-rose-700 border-rose-200';
    return 'bg-emerald-50/95 text-emerald-700 border-emerald-200';
};

const statusCardMeta = (status) => {
    const normalized = String(status || '').toLowerCase();

    if (normalized.includes('setuju') || normalized.includes('selesai')) {
        return {
            card: 'from-emerald-50 to-white border-emerald-100',
            iconWrap: 'bg-emerald-100 text-emerald-700',
            bar: 'bg-emerald-500',
            Icon: FiCheckCircle,
        };
    }

    if (normalized.includes('tolak') || normalized.includes('batal')) {
        return {
            card: 'from-rose-50 to-white border-rose-100',
            iconWrap: 'bg-rose-100 text-rose-700',
            bar: 'bg-rose-500',
            Icon: FiXCircle,
        };
    }

    if (normalized.includes('tunggu') || normalized.includes('menunggu') || normalized.includes('proses')) {
        return {
            card: 'from-amber-50 to-white border-amber-100',
            iconWrap: 'bg-amber-100 text-amber-700',
            bar: 'bg-amber-500',
            Icon: FiClock,
        };
    }

    return {
        card: 'from-sky-50 to-white border-sky-100',
        iconWrap: 'bg-sky-100 text-sky-700',
        bar: 'bg-sky-500',
        Icon: FiFlag,
    };
};

export default function AccountDashboard() {
    const [user, setUser] = useState(defaultUser);
    const [bookings, setBookings] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [promos, setPromos] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [loadingFavorites, setLoadingFavorites] = useState(true);
    const [error, setError] = useState('');

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatMoney = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val || 0);

    const getPromoPricing = (propertyId, basePrice) => (
        calculatePromoPricing(promos, propertyId, basePrice)
    );

    const statusVariant = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized.includes('setuju')) return 'success';
        if (normalized.includes('selesai')) return 'secondary';
        if (normalized.includes('tolak') || normalized.includes('batal')) return 'destructive';
        return 'warning';
    };

    useEffect(() => {
        const localUser = getStoredUser();
        if (localUser) {
            setUser({
                nama: localUser.nama || '',
                email: localUser.email || '',
                no_hp: localUser.no_hp || '',
                alamat: localUser.alamat || '',
            });
        }

        const fetchUser = async () => {
            try {
                const data = await apiJson('/auth/me', {
                    headers: authHeaders(),
                    defaultErrorMessage: 'Gagal memuat data profil.',
                });
                if (data?.user) {
                    const nextUser = {
                        nama: data.user.nama || '',
                        email: data.user.email || '',
                        no_hp: data.user.no_hp || '',
                        alamat: data.user.alamat || '',
                    };
                    setUser(nextUser);
                    saveAuth({ token: undefined, user: data.user });
                }
            } catch (err) {
                setError((prev) => prev || err.message || 'Gagal memuat data profil.');
            }
        };

        const fetchBookings = async () => {
            setLoadingBookings(true);
            try {
                const data = await apiJson('/bookings/me', {
                    headers: authHeaders(),
                    defaultErrorMessage: 'Gagal memuat riwayat booking.',
                });
                setBookings(data || []);
            } catch (err) {
                setError((prev) => prev || err.message || 'Gagal memuat riwayat booking.');
            } finally {
                setLoadingBookings(false);
            }
        };

        const fetchFavorites = async () => {
            setLoadingFavorites(true);
            try {
                const ids = getFavoriteIds();
                if (ids.length === 0) {
                    setFavorites([]);
                    return;
                }
                const data = await apiJson('/perumahan', {
                    defaultErrorMessage: 'Gagal memuat daftar favorit.',
                });
                const normalizedProperties = normalizeApiListPayload(data);
                const byId = new Map(normalizedProperties.map((item) => [Number(item.id), item]));
                setFavorites(ids.map((id) => byId.get(id)).filter(Boolean));
            } catch (err) {
                setError((prev) => prev || err.message || 'Gagal memuat daftar favorit.');
            } finally {
                setLoadingFavorites(false);
            }
        };

        const fetchPromos = async () => {
            try {
                const data = await apiJson('/promos');
                setPromos(normalizeApiListPayload(data).map(mapPromoFromApi));
            } catch {
                setPromos([]);
            }
        };

        fetchUser();
        fetchBookings();
        fetchFavorites();
        fetchPromos();
    }, []);

    const stats = useMemo(() => {
        const statusMap = new Map();
        const normalized = bookings.map((item) => String(item.status_booking || '').toLowerCase());

        bookings.forEach((item) => {
            const label = String(item.status_booking || 'Belum ditentukan').trim() || 'Belum ditentukan';
            statusMap.set(label, (statusMap.get(label) || 0) + 1);
        });

        const statusItems = Array.from(statusMap.entries())
            .map(([status, total]) => ({ status, total }))
            .sort((a, b) => b.total - a.total);

        return {
            total: bookings.length,
            selesai: normalized.filter((status) => status.includes('setuju') || status.includes('selesai')).length,
            statusItems,
            favorit: favorites.length,
        };
    }, [bookings, favorites.length]);

    const latestBookings = useMemo(() => (
        [...bookings]
            .sort((a, b) => new Date(b?.tanggal_booking || 0).getTime() - new Date(a?.tanggal_booking || 0).getTime())
            .slice(0, 3)
    ), [bookings]);

    const removeFavorite = (id) => {
        removeFavoriteProperty(id);
        setFavorites((prev) => prev.filter((item) => Number(item.id) !== Number(id)));
    };

    const userName = user.nama || 'Pengguna';

    return (
        <div className="container-custom py-10 pb-20 space-y-8">
            <div className="rounded-xl bg-gradient-to-r from-primary-700 to-primary-900 text-white p-8 md:p-10 shadow-xl">
                <p className="text-primary-100 text-sm mb-2">Akun User</p>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">{userName}</h1>
                <p className="text-primary-100 max-w-2xl">
                    Pantau akun Anda di satu tempat: profil lengkap, riwayat booking, dan daftar favorit.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/akun/profil">
                        <Button className="bg-white text-primary-800 hover:bg-gray-100 w-full sm:w-auto">Profile</Button>
                    </Link>
                    <Link to="/akun/booking">
                        <Button variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">Riwayat Booking</Button>
                    </Link>
                    <Link to="/akun/favorit">
                        <Button variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">Perumahan Favorit</Button>
                    </Link>
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary-700 to-primary-900 text-white xl:col-span-2">
                    <CardContent className="p-6 md:p-7">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-primary-100 text-sm">Total Booking Anda</p>
                                <p className="mt-1 text-4xl font-bold tracking-tight">{loadingBookings ? '...' : stats.total}</p>
                                <p className="mt-2 text-sm text-primary-100">Ringkasan booking yang Anda lakukan.</p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl">
                                <FaClipboardList />
                            </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                <FiActivity />
                                {stats.statusItems.length} status aktif
                            </span>
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                {stats.selesai} booking selesai
                            </span>
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                {stats.favorit} favorit tersimpan
                            </span>
                        </div>
                        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
                        <div className="pointer-events-none absolute -left-14 -bottom-14 h-36 w-36 rounded-full bg-white/10" />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md xl:col-span-2">
                    <CardContent className="p-6 md:p-7">
                        {loadingBookings ? (
                            <div className="flex gap-3 overflow-hidden">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="min-w-[220px] sm:min-w-[240px] rounded-xl border border-gray-200 bg-gray-50 p-4 animate-pulse">
                                        <div className="h-5 w-20 rounded bg-gray-200" />
                                        <div className="mt-3 h-7 w-14 rounded bg-gray-200" />
                                        <div className="mt-3 h-2 w-full rounded bg-gray-200" />
                                    </div>
                                ))}
                            </div>
                        ) : stats.statusItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500 text-center">
                                Belum ada booking yang bisa ditampilkan.
                            </div>
                        ) : (
                            <div className="flex gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {stats.statusItems.map((item) => {
                                    const meta = statusCardMeta(item.status);
                                    const percentage = stats.total > 0
                                        ? Math.round((item.total / stats.total) * 100)
                                        : 0;
                                    const StatusIcon = meta.Icon;

                                    return (
                                        <div
                                            key={item.status}
                                            className={`min-w-[220px] sm:min-w-[240px] md:min-w-[250px] max-w-[270px] shrink-0 snap-start rounded-xl border shadow-sm bg-gradient-to-br ${meta.card}`}
                                        >
                                            <div className="p-4 md:p-5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Badge variant={statusVariant(item.status)} className="w-fit px-2.5 py-1 text-[11px]">
                                                        {item.status}
                                                    </Badge>
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${meta.iconWrap}`}>
                                                        <StatusIcon />
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-2xl font-bold text-gray-900">{item.total}</p>
                                                <p className="text-xs text-gray-500">{percentage}% dari total booking</p>
                                                <div className="mt-2.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                                    <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${Math.max(6, percentage)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card id="booking" className="border-none shadow-md">
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Riwayat Booking</h2>
                            <p className="text-sm text-gray-500">Status booking terbaru Anda.</p>
                        </div>
                        <Link to="/akun/booking">
                            <Button variant="outline">Lihat Semua</Button>
                        </Link>
                    </div>
                    {loadingBookings ? (
                        <p className="text-sm text-gray-500">Memuat riwayat booking...</p>
                    ) : bookings.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada booking yang diajukan.</p>
                    ) : (
                        <div className="space-y-3">
                            {latestBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-md transition-all duration-300"
                                >
                                    <span className="absolute left-0 top-0 h-full w-1 bg-primary-500/70" />
                                    <div className="space-y-2 pl-1">
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <FiHome className="text-primary-600" />
                                            <p className="font-semibold text-lg leading-tight">{booking.perumahan?.nama || 'Perumahan'}</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                            <FiCalendar className="text-gray-500" />
                                            Diajukan {formatDate(booking.tanggal_booking)}
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs text-gray-500">
                                            <FiHash className="text-gray-400" />
                                            {booking.kode_booking}
                                        </div>
                                        <div>
                                            <Badge variant={statusVariant(booking.status_booking)} className="text-sm px-3 py-1">
                                                {booking.status_booking}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link to={`/akun/booking/${booking.id}`}>
                                            <Button variant="outline" size="sm" className="min-w-[125px] w-full sm:w-auto">Detail Booking</Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card id="favorit" className="border-none shadow-md">
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Perumahan Favorit</h2>
                            <p className="text-sm text-gray-500">Unit yang Anda simpan untuk dibandingkan.</p>
                        </div>
                        <Link to="/akun/favorit">
                            <Button variant="outline">Lihat Semua</Button>
                        </Link>
                    </div>
                    {loadingFavorites ? (
                        <p className="text-sm text-gray-500">Memuat daftar favorit...</p>
                    ) : favorites.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada perumahan favorit.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
                            {favorites.slice(0, 4).map((item) => {
                                const basePrice = Number(item.price) || 0;
                                const promoPricing = getPromoPricing(item.id, basePrice);
                                const finalPrice = Math.max(0, basePrice - promoPricing.discount);
                                const mainImage = item.image ? resolveImage(item.image) : '';
                                const statusLabel = String(item.status || 'Tersedia');
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
                                                    title="Hapus favorit"
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
                </CardContent>
            </Card>
        </div>
    );
}
