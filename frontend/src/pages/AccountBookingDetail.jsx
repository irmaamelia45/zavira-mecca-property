import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import {
    API_BASE,
    formatMoney,
    getPromoPricing as calculatePromoPricing,
    mapPromoFromApi,
    normalizeApiListPayload,
} from '../utils/promo';
import { authHeaders } from '../lib/auth';

export default function AccountBookingDetail() {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/api/bookings/me/${id}`, {
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Detail booking tidak ditemukan.');
                }
                const data = await response.json();
                setBooking(data);
            } catch (err) {
                setError(err.message || 'Gagal memuat detail booking.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/promos`);
                if (!response.ok) {
                    setPromos([]);
                    return;
                }

                const data = await response.json();
                setPromos(normalizeApiListPayload(data).map(mapPromoFromApi));
            } catch {
                setPromos([]);
            }
        };

        fetchPromos();
    }, []);

    const statusVariant = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized.includes('setuju')) return 'success';
        if (normalized.includes('selesai')) return 'secondary';
        if (normalized.includes('tolak') || normalized.includes('batal')) return 'destructive';
        return 'warning';
    };

    const formatDateTime = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatJobType = (value) => {
        if (value === 'fixed_income') return 'Fixed Income';
        if (value === 'non_fixed_income') return 'Non Fixed Income';
        return '-';
    };

    const basePrice = Number(booking?.perumahan?.harga) || 0;
    const promoPricing = calculatePromoPricing(promos, booking?.perumahan?.id, basePrice);
    const finalPrice = Math.max(0, basePrice - promoPricing.discount);

    if (loading) {
        return <div className="container-custom py-16 text-sm text-gray-500">Memuat detail booking...</div>;
    }

    if (error || !booking) {
        return (
            <div className="container-custom py-16 space-y-4">
                <p className="text-red-600">{error || 'Detail booking tidak ditemukan.'}</p>
                <Link to="/akun/booking">
                    <Button variant="outline">Kembali ke Riwayat Booking</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container-custom py-10 pb-20 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Detail Riwayat Booking</h1>
                    <p className="text-gray-500">Kode: {booking.kode_booking}</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/akun/booking">
                        <Button variant="outline">Kembali</Button>
                    </Link>
                    <Link to={`/perumahan/${booking.perumahan?.id || 1}`}>
                        <Button>Detail Perumahan</Button>
                    </Link>
                </div>
            </div>

            <Card className="border-none shadow-md">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Status Booking</h2>
                        <Badge variant={statusVariant(booking.status_booking)}>{booking.status_booking}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Tanggal Booking</p>
                            <p className="font-semibold text-gray-900">{formatDateTime(booking.tanggal_booking)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Catatan Admin</p>
                            <p className="font-semibold text-gray-900">{booking.catatan_admin || '-'}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Pekerjaan</p>
                            <p className="font-semibold text-gray-900">{booking.pekerjaan || '-'}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Jenis Pekerjaan</p>
                            <p className="font-semibold text-gray-900">{formatJobType(booking.jenis_pekerjaan)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Gaji per Bulan</p>
                            <p className="font-semibold text-gray-900">{formatMoney(booking.gaji_bulanan || 0)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Selesai Pada</p>
                            <p className="font-semibold text-gray-900">{formatDateTime(booking.finished_at)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md">
                <CardContent className="p-6 space-y-3">
                    <h2 className="text-xl font-bold text-gray-900">Perumahan Yang Dibooking</h2>
                    <p className="font-semibold text-gray-900">{booking.perumahan?.nama || '-'}</p>
                    <p className="text-sm text-gray-500">{booking.perumahan?.lokasi || '-'}</p>
                    <div className="space-y-1">
                        {promoPricing.discount > 0 && (
                            <p className="text-sm text-gray-400 line-through">{formatMoney(basePrice)}</p>
                        )}
                        <p className="text-primary-700 font-semibold">{formatMoney(finalPrice)}</p>
                        {promoPricing.discount > 0 && (
                            <p className="text-xs text-emerald-700">
                                Termasuk diskon promo {formatMoney(promoPricing.discount)}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md">
                <CardContent className="p-6 space-y-2">
                    <h2 className="text-xl font-bold text-gray-900">Dokumen</h2>
                    {(booking.documents || []).length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada dokumen terlampir.</p>
                    ) : (
                        <div className="space-y-2">
                            {booking.documents.map((doc) => (
                                <a
                                    key={doc.id}
                                    href={`${API_BASE}${doc.path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block rounded-md border border-gray-200 px-4 py-3 text-sm text-primary-700 hover:bg-gray-50"
                                >
                                    {doc.nama_file}
                                </a>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
