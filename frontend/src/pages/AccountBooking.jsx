import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { FiArrowLeft } from 'react-icons/fi';
import { FiCalendar, FiHome, FiHash } from 'react-icons/fi';
import { API_BASE } from '../utils/promo';
import { authHeaders, getUserRole } from '../lib/auth';

export default function AccountBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isMarketing = getUserRole() === 'marketing';

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const endpoint = isMarketing ? '/api/marketing/bookings' : '/api/bookings/me';
                const response = await fetch(`${API_BASE}${endpoint}`, {
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Gagal memuat riwayat booking.');
                }
                const data = await response.json();
                const rawBookings = isMarketing
                    ? (Array.isArray(data?.bookings) ? data.bookings : [])
                    : (Array.isArray(data) ? data : []);

                const mappedBookings = rawBookings.map((booking) => (
                    isMarketing
                        ? {
                            id: booking.id,
                            propertyName: booking.property?.name || 'Perumahan',
                            propertyType: booking.property?.type || '-',
                            submittedAt: booking.date,
                            code: booking.code,
                            status: booking.status,
                            requesterName: booking.user?.name || '-',
                            requesterEmail: booking.user?.email || '-',
                            detailPath: '',
                        }
                        : {
                            id: booking.id,
                            propertyName: booking.perumahan?.nama || 'Perumahan',
                            propertyType: booking.perumahan?.tipe || '-',
                            submittedAt: booking.tanggal_booking,
                            code: booking.kode_booking,
                            status: booking.status_booking,
                            requesterName: '',
                            requesterEmail: '',
                            detailPath: `/akun/booking/${booking.id}`,
                        }
                ));

                setBookings(mappedBookings);
            } catch (err) {
                setError(err.message || 'Gagal memuat riwayat booking.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [isMarketing]);

    const statusVariant = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized.includes('setuju')) return 'success';
        if (normalized.includes('selesai')) return 'success';
        if (normalized.includes('tolak') || normalized.includes('batal')) return 'destructive';
        return 'warning';
    };

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
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
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
                        {isMarketing ? 'Daftar Booking User' : 'Riwayat Booking'}
                    </h1>
                    <p className="text-gray-500">
                        {isMarketing
                            ? 'Pantau seluruh booking yang diajukan user.'
                            : 'Pantau status booking dan proses pengajuan Anda.'}
                    </p>
                </div>
                {!isMarketing && (
                    <Link to="/perumahan">
                        <Button variant="outline" className="w-full sm:w-auto">Booking Baru</Button>
                    </Link>
                )}
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Memuat data booking...</p>
            ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : bookings.length === 0 ? (
                <Card className="border-none shadow-md">
                    <CardContent className="p-6 text-sm text-gray-500">
                        {isMarketing ? 'Belum ada booking dari user.' : 'Belum ada booking yang diajukan.'}
                    </CardContent>
                </Card>
            ) : isMarketing ? (
                <Card className="border-none shadow-md">
                    <CardContent className="p-6">
                        <div className="mb-4">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Daftar Booking Masuk</h2>
                            <p className="mt-1 text-sm text-gray-500">Menampilkan {bookings.length} booking</p>
                        </div>
                        <div className="overflow-x-auto responsive-table-wrap">
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
                                            <td className="py-4 pr-4">
                                                <p className="text-gray-900 font-semibold">{booking.requesterName || '-'}</p>
                                                <p className="text-gray-500">{booking.requesterEmail || '-'}</p>
                                            </td>
                                            <td className="py-3 pr-4 text-gray-800">{booking.propertyName || '-'}</td>
                                            <td className="py-3 pr-4 text-gray-700">{booking.propertyType || '-'}</td>
                                            <td className="py-3 pr-4 text-gray-700">{formatDate(booking.submittedAt)}</td>
                                            <td className="py-3 pr-4">
                                                <Badge variant={statusVariant(booking.status)}>{booking.status || '-'}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <Card key={booking.id} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <span className="absolute left-0 top-0 h-full w-1 bg-primary-500/75" />
                            <CardContent className="p-6 md:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <FiHome className="text-primary-600" />
                                        <p className="font-bold text-xl md:text-2xl leading-tight">{booking.propertyName}</p>
                                    </div>
                                    {isMarketing && (
                                        <p className="text-sm text-gray-600">
                                            Diajukan oleh <span className="font-semibold text-gray-900">{booking.requesterName}</span> ({booking.requesterEmail})
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                            <FiCalendar className="text-gray-500" />
                                            Diajukan {formatDate(booking.submittedAt)}
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs text-gray-500">
                                            <FiHash className="text-gray-400" />
                                            {booking.code}
                                        </div>
                                    </div>
                                    <div>
                                        <Badge variant={statusVariant(booking.status)} className="text-sm px-3 py-1">
                                            {booking.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center lg:justify-end">
                                    {!isMarketing && booking.detailPath && (
                                        <Link to={booking.detailPath}>
                                            <Button variant="outline" className="min-w-[130px] w-full sm:w-auto">Lihat Detail</Button>
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
