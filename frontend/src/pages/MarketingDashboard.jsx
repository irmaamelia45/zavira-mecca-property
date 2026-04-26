import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList } from 'react-icons/fa';
import { FiActivity, FiCheckCircle, FiClock, FiFlag, FiSearch, FiXCircle } from 'react-icons/fi';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { apiJson } from '../lib/api';
import { authHeaders, getStoredUser } from '../lib/auth';

const statusBadgeVariant = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('setuju') || normalized.includes('selesai')) return 'success';
    if (normalized.includes('tolak') || normalized.includes('batal')) return 'destructive';
    return 'warning';
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

    if (normalized.includes('tunggu') || normalized.includes('menunggu')) {
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

export default function MarketingDashboard() {
    const [summary, setSummary] = useState({ total_booking: 0, status_breakdown: [] });
    const [bookings, setBookings] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [propertyOptions, setPropertyOptions] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedProperty, setSelectedProperty] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const hasFetchedRef = useRef(false);
    const [userName, setUserName] = useState(() => {
        const user = getStoredUser();
        return user?.nama || 'Marketing';
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 250);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();

        if (selectedStatus !== 'all') {
            params.set('status', selectedStatus);
        }

        if (selectedProperty !== 'all') {
            params.set('perumahan_id', selectedProperty);
        }

        if (searchTerm) {
            params.set('q', searchTerm);
        }

        return params.toString();
    }, [selectedProperty, selectedStatus, searchTerm]);

    useEffect(() => {
        const fetchDashboard = async () => {
            setError('');
            if (!hasFetchedRef.current) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            try {
                const endpoint = queryString
                    ? `/marketing/bookings?${queryString}`
                    : '/marketing/bookings';

                const data = await apiJson(endpoint, {
                    headers: authHeaders(),
                });

                setSummary({
                    total_booking: Number(data?.summary?.total_booking) || 0,
                    status_breakdown: Array.isArray(data?.summary?.status_breakdown) ? data.summary.status_breakdown : [],
                });
                setStatusOptions(Array.isArray(data?.filters?.statuses) ? data.filters.statuses : []);
                setPropertyOptions(Array.isArray(data?.filters?.properties) ? data.filters.properties : []);
                setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
                if (data?.current_user?.name) {
                    setUserName(String(data.current_user.name));
                }
            } catch (err) {
                setError(err.message || 'Gagal memuat dashboard marketing.');
            } finally {
                setLoading(false);
                setRefreshing(false);
                hasFetchedRef.current = true;
            }
        };

        fetchDashboard();
    }, [queryString]);

    const statusItems = useMemo(() => (
        (summary.status_breakdown || []).map((item) => ({
            status: String(item?.status || '-'),
            total: Number(item?.total) || 0,
        }))
    ), [summary.status_breakdown]);

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const resetFilters = () => {
        setSelectedStatus('all');
        setSelectedProperty('all');
        setSearchInput('');
        setSearchTerm('');
    };

    const activeFiltersCount = [selectedStatus !== 'all', selectedProperty !== 'all', Boolean(searchTerm)].filter(Boolean).length;

    return (
        <div className="container-custom py-10 pb-20 space-y-8">
            <div className="rounded-xl bg-gradient-to-r from-primary-700 to-primary-900 text-white p-8 md:p-10 shadow-xl">
                <p className="text-primary-100 text-sm mb-2">Dashboard Marketing</p>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">{userName}</h1>
                <p className="text-primary-100 max-w-2xl">
                    Pantau seluruh booking masuk, statusnya, dan temukan data yang dibutuhkan dengan cepat.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/akun/booking">
                        <Button variant="outline" className="border-white text-white hover:bg-white/10">Daftar Booking</Button>
                    </Link>
                    <Link to="/akun/profil">
                        <Button variant="outline" className="border-white text-white hover:bg-white/10">Profil User</Button>
                    </Link>
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary-700 to-primary-900 text-white xl:col-span-2">
                    <CardContent className="p-6 md:p-7">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-primary-100 text-sm">Total Seluruh Booking</p>
                                <p className="mt-1 text-4xl font-bold tracking-tight">{loading ? '...' : summary.total_booking}</p>
                                <p className="mt-2 text-sm text-primary-100">Ringkasan seluruh booking masuk di sistem.</p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl">
                                <FaClipboardList />
                            </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                <FiActivity />
                                {statusItems.length} status aktif
                            </span>
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                {activeFiltersCount} filter aktif
                            </span>
                        </div>
                        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
                        <div className="pointer-events-none absolute -left-14 -bottom-14 h-36 w-36 rounded-full bg-white/10" />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md xl:col-span-2">
                    <CardContent className="p-6 md:p-7">
                        {loading ? (
                            <div className="flex gap-3 overflow-hidden">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="min-w-[220px] sm:min-w-[240px] rounded-xl border border-gray-200 bg-gray-50 p-4 animate-pulse">
                                        <div className="h-5 w-20 rounded bg-gray-200" />
                                        <div className="mt-3 h-7 w-14 rounded bg-gray-200" />
                                        <div className="mt-3 h-2 w-full rounded bg-gray-200" />
                                    </div>
                                ))}
                            </div>
                        ) : statusItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500 text-center">
                                Belum ada status booking yang bisa ditampilkan.
                            </div>
                        ) : (
                            <div
                                className="flex gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {statusItems.map((item) => {
                                    const meta = statusCardMeta(item.status);
                                    const percentage = summary.total_booking > 0
                                        ? Math.round((item.total / summary.total_booking) * 100)
                                        : 0;
                                    const StatusIcon = meta.Icon;

                                    return (
                                        <div
                                            key={item.status}
                                            className={`min-w-[220px] sm:min-w-[240px] md:min-w-[250px] max-w-[270px] shrink-0 snap-start rounded-xl border shadow-sm bg-gradient-to-br ${meta.card}`}
                                        >
                                            <div className="p-4 md:p-5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Badge variant={statusBadgeVariant(item.status)} className="w-fit px-2.5 py-1 text-[11px]">
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

            <Card className="border-none shadow-md">
                <CardContent className="p-6 space-y-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Filter Booking</h2>
                        <p className="text-sm text-gray-500">Gunakan filter perumahan, status, atau pencarian data pemesan/booking.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Cari nama user, email, no hp, kode booking..."
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                            />
                        </div>

                        <select
                            value={selectedProperty}
                            onChange={(event) => setSelectedProperty(event.target.value)}
                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        >
                            <option value="all">Semua Perumahan</option>
                            {propertyOptions.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.name}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-2">
                            <select
                                value={selectedStatus}
                                onChange={(event) => setSelectedStatus(event.target.value)}
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                            >
                                <option value="all">Semua Status</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <Button type="button" variant="outline" onClick={resetFilters} className="shrink-0">
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md">
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Daftar Booking Masuk</h2>
                            <p className="text-sm text-gray-500">
                                Menampilkan {bookings.length} booking {refreshing ? '(memperbarui...)' : ''}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Memuat daftar booking...</p>
                    ) : bookings.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                            Tidak ada booking yang sesuai dengan filter saat ini.
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="text-left text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 pr-4 font-semibold">Nama Pemesan</th>
                                            <th className="py-3 pr-4 font-semibold">Perumahan</th>
                                            <th className="py-3 pr-4 font-semibold">Tipe / Unit</th>
                                            <th className="py-3 pr-4 font-semibold">Tanggal Booking</th>
                                            <th className="py-3 pr-4 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((booking) => (
                                            <tr key={booking.id} className="border-b border-gray-100">
                                                <td className="py-3 pr-4">
                                                    <p className="text-gray-900 font-medium">{booking.user?.name || '-'}</p>
                                                    <p className="text-xs text-gray-500">{booking.user?.email || '-'}</p>
                                                </td>
                                                <td className="py-3 pr-4 text-gray-800">{booking.property?.name || '-'}</td>
                                                <td className="py-3 pr-4 text-gray-700">{booking.property?.type || '-'}</td>
                                                <td className="py-3 pr-4 text-gray-700">{formatDate(booking.date)}</td>
                                                <td className="py-3 pr-4">
                                                    <Badge variant={statusBadgeVariant(booking.status)}>{booking.status || '-'}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="md:hidden space-y-3">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-semibold text-gray-900">{booking.user?.name || '-'}</p>
                                            <Badge variant={statusBadgeVariant(booking.status)}>{booking.status || '-'}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-700">{booking.property?.name || '-'}</p>
                                        <p className="text-xs text-gray-500">Tipe: {booking.property?.type || '-'}</p>
                                        <p className="text-xs text-gray-500">Tanggal: {formatDate(booking.date)}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
