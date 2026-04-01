import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { FaSearch, FaSyncAlt, FaSlidersH } from 'react-icons/fa';
import { API_BASE } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';

const STATUS_FILTERS = [
    { key: 'all', label: 'Semua Status' },
    { key: 'pending', label: 'Menunggu' },
    { key: 'approved', label: 'Disetujui' },
    { key: 'rejected', label: 'Ditolak' },
    { key: 'canceled', label: 'Dibatalkan' },
    { key: 'done', label: 'Selesai' },
];

const normalizeStatusKey = (status) => {
    if (status === 'Menunggu' || status === 'Menunggu Konfirmasi') return 'pending';
    if (status === 'Disetujui') return 'approved';
    if (status === 'Ditolak') return 'rejected';
    if (status === 'Dibatalkan') return 'canceled';
    if (status === 'Selesai') return 'done';
    return 'other';
};

export default function BookingManagement() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');

    const fetchBookings = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/admin/bookings`, {
                headers: authHeaders(),
            });
            if (!response.ok) {
                throw new Error('Gagal memuat data booking.');
            }
            const data = await response.json();
            setBookings(data || []);
        } catch (err) {
            setError(err.message || 'Gagal memuat data booking.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = (bookings || []).filter((booking) => {
            const searchable = [
                booking.code,
                booking.user?.name,
                booking.user?.email,
                booking.property?.name,
            ].join(' ').toLowerCase();

            const matchSearch = !q || searchable.includes(q);
            const matchStatus = statusFilter === 'all' || normalizeStatusKey(booking.status) === statusFilter;
            return matchSearch && matchStatus;
        });

        return list.sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
            if (sortBy === 'date_asc') return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
            if (sortBy === 'name_asc') return (a.user?.name || '').localeCompare(b.user?.name || '');
            if (sortBy === 'name_desc') return (b.user?.name || '').localeCompare(a.user?.name || '');
            if (sortBy === 'property_asc') return (a.property?.name || '').localeCompare(b.property?.name || '');
            return 0;
        });
    }, [bookings, search, statusFilter, sortBy]);

    const summary = useMemo(() => {
        const total = bookings.length;
        const pending = bookings.filter((x) => normalizeStatusKey(x.status) === 'pending').length;
        const approved = bookings.filter((x) => normalizeStatusKey(x.status) === 'approved').length;
        const done = bookings.filter((x) => normalizeStatusKey(x.status) === 'done').length;
        return { total, pending, approved, done };
    }, [bookings]);

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status) => {
        switch (normalizeStatusKey(status)) {
            case 'pending': return <Badge variant="warning" className="bg-yellow-100 text-yellow-800 border-yellow-200">Menunggu</Badge>;
            case 'approved': return <Badge variant="success" className="bg-green-100 text-green-700 border-green-200">Disetujui</Badge>;
            case 'rejected': return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">Ditolak</Badge>;
            case 'canceled': return <Badge variant="secondary" className="bg-gray-200 text-gray-700 border-gray-300">Dibatalkan</Badge>;
            case 'done': return <Badge className="bg-primary-100 text-primary-700 border-primary-200">Selesai</Badge>;
            default: return <Badge>{status || '-'}</Badge>;
        }
    };

    const statusChipClass = (value) => (
        statusFilter === value
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200'
    );

    return (
        <div className="space-y-7 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[2rem] leading-tight tracking-tight font-semibold text-gray-900">Kelola Booking</h1>
                    <p className="text-gray-500 text-sm mt-1">Lihat, filter, dan buka detail booking. Semua aksi status dilakukan di halaman detail booking.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-blue-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-blue-700 font-medium">Total Booking</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.total}</p>
                        <p className="text-xs text-gray-500 mt-1">Semua pengajuan booking</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-yellow-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-yellow-700 font-medium">Menunggu</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.pending}</p>
                        <p className="text-xs text-gray-500 mt-1">Belum diproses admin</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-emerald-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-emerald-700 font-medium">Disetujui</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.approved}</p>
                        <p className="text-xs text-gray-500 mt-1">Booking yang approved</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white overflow-hidden">
                    <div className="h-1.5 bg-violet-500" />
                    <div className="px-5 py-5">
                        <p className="text-xs text-violet-700 font-medium">Selesai</p>
                        <p className="text-3xl leading-tight font-semibold text-gray-900 mt-0.5">{summary.done}</p>
                        <p className="text-xs text-gray-500 mt-1">Booking selesai transaksi</p>
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
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="relative w-full lg:max-w-sm">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    className="w-full h-11 rounded-lg border border-gray-200 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    placeholder="Cari kode booking, nama user, email, atau perumahan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sm text-gray-500">{filteredBookings.length} data ditemukan</span>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <FaSlidersH className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                        <select
                                            className="h-10 rounded-lg border border-gray-200 pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="date_desc">Tanggal Terbaru</option>
                                            <option value="date_asc">Tanggal Terlama</option>
                                            <option value="name_asc">Nama A-Z</option>
                                            <option value="name_desc">Nama Z-A</option>
                                            <option value="property_asc">Perumahan A-Z</option>
                                        </select>
                                    </div>
                                    <Button variant="outline" className="h-10 px-3.5" onClick={fetchBookings}>
                                        <FaSyncAlt className="mr-2" /> Refresh
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {STATUS_FILTERS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setStatusFilter(item.key)}
                                    className={`h-8 px-3.5 rounded-md text-[11px] border transition-colors ${statusChipClass(item.key)}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px] text-left min-w-[980px]">
                            <thead className="bg-[#f8fafc] text-gray-500 font-semibold uppercase text-[10px] tracking-[0.06em]">
                                <tr>
                                    <th className="px-6 py-4">Kode</th>
                                    <th className="px-6 py-4">Pemesan</th>
                                    <th className="px-6 py-4">Perumahan</th>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Dokumen</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="7">Memuat data booking...</td>
                                    </tr>
                                ) : filteredBookings.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="7">Tidak ada data yang cocok.</td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-700">{booking.code}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900 text-sm">{booking.user?.name || '-'}</p>
                                                <p className="text-[11px] text-gray-500 mt-1">{booking.user?.email || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <p className="font-semibold text-gray-900 text-sm">{booking.property?.name || '-'}</p>
                                                <p className="text-[11px] text-gray-500 mt-1">Tipe {booking.property?.type || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{formatDate(booking.date)}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600">
                                                    {booking.documents?.length || 0} file
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(booking.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center items-center">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="h-8 px-3.5 rounded-md text-[11px] font-semibold !shadow-none hover:!shadow-none"
                                                        title="Buka detail booking"
                                                        onClick={() => navigate(`/admin/bookings/${booking.id}`)}
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
