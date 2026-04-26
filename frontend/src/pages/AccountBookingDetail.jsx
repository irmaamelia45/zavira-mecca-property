import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { FiClock } from 'react-icons/fi';
import {
    formatMoney,
    getPromoPricing as calculatePromoPricing,
    mapPromoFromApi,
    normalizeApiListPayload,
} from '../utils/promo';
import { apiJson, resolveAssetUrl } from '../lib/api';
import { authHeaders } from '../lib/auth';

const STATUS_INSIGHT_THEME = {
    pending: {
        shell: 'border-amber-300 bg-gradient-to-br from-amber-50 via-[#fffdf5] to-white',
        orb: 'bg-amber-200/40',
        icon: 'border-amber-300 bg-white/90 text-amber-700',
        label: 'border-amber-300 bg-amber-100 text-amber-800',
        title: 'text-amber-900',
        text: 'text-amber-800/90',
        nextCard: 'border-amber-200/80 bg-white/80',
        nextLabel: 'text-amber-700',
        dot: 'bg-amber-500',
    },
    positive: {
        shell: 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-[#f7fffb] to-white',
        orb: 'bg-emerald-200/40',
        icon: 'border-emerald-300 bg-white/90 text-emerald-700',
        label: 'border-emerald-300 bg-emerald-100 text-emerald-800',
        title: 'text-emerald-900',
        text: 'text-emerald-800/90',
        nextCard: 'border-emerald-200/80 bg-white/80',
        nextLabel: 'text-emerald-700',
        dot: 'bg-emerald-500',
    },
    'final-positive': {
        shell: 'border-blue-300 bg-gradient-to-br from-blue-50 via-[#f7fbff] to-white',
        orb: 'bg-blue-200/40',
        icon: 'border-blue-300 bg-white/90 text-blue-700',
        label: 'border-blue-300 bg-blue-100 text-blue-800',
        title: 'text-blue-900',
        text: 'text-blue-800/90',
        nextCard: 'border-blue-200/80 bg-white/80',
        nextLabel: 'text-blue-700',
        dot: 'bg-blue-500',
    },
    negative: {
        shell: 'border-red-300 bg-gradient-to-br from-red-50 via-[#fff8f8] to-white',
        orb: 'bg-red-200/40',
        icon: 'border-red-300 bg-white/90 text-red-700',
        label: 'border-red-300 bg-red-100 text-red-800',
        title: 'text-red-900',
        text: 'text-red-800/90',
        nextCard: 'border-red-200/80 bg-white/80',
        nextLabel: 'text-red-700',
        dot: 'bg-red-500',
    },
    'final-negative': {
        shell: 'border-red-300 bg-gradient-to-br from-red-50 via-[#fff8f8] to-white',
        orb: 'bg-red-200/40',
        icon: 'border-red-300 bg-white/90 text-red-700',
        label: 'border-red-300 bg-red-100 text-red-800',
        title: 'text-red-900',
        text: 'text-red-800/90',
        nextCard: 'border-red-200/80 bg-white/80',
        nextLabel: 'text-red-700',
        dot: 'bg-red-500',
    },
};

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
                const data = await apiJson(`/bookings/me/${id}`, {
                    headers: authHeaders(),
                    defaultErrorMessage: 'Detail booking tidak ditemukan.',
                });
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
                const data = await apiJson('/promos');
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
    const formatMonthYear = (value) => {
        if (!value) return 'Belum diatur admin';
        return new Date(value).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
    };

    const formatJobType = (value) => {
        if (value === 'fixed_income') return 'Fixed Income';
        if (value === 'non_fixed_income') return 'Non Fixed Income';
        return '-';
    };

    const formatInstallmentStatus = (value) => (value ? 'Ya' : 'Tidak');

    const normalizeBookingStatus = (value) => {
        const status = String(value || '').trim().toLowerCase();
        if (status === 'menunggu' || status === 'menunggu konfirmasi') return 'pending';
        if (status === 'disetujui') return 'disetujui';
        if (status === 'ditolak') return 'ditolak';
        if (status === 'selesai') return 'selesai';
        if (status === 'dibatalkan') return 'dibatalkan';
        return 'pending';
    };

    const getStatusInsight = (normalizedStatus) => {
        if (normalizedStatus === 'disetujui') {
            return {
                currentTitle: 'Booking Anda sudah disetujui admin perumahan.',
                currentText: 'Pengajuan telah lolos verifikasi awal dan masuk ke tahap proses bank.',
                nextTitle: 'Tahap berikutnya: menunggu hasil proses bank.',
                nextText: 'Status berikutnya akan menjadi Selesai atau Dibatalkan sesuai hasil evaluasi bank.',
                tone: 'positive',
            };
        }

        if (normalizedStatus === 'ditolak') {
            return {
                currentTitle: 'Booking Anda ditolak pada tahap admin perumahan.',
                currentText: 'Pengajuan tidak dapat dilanjutkan ke proses bank.',
                nextTitle: 'Tahap berikutnya: tidak ada proses lanjutan.',
                nextText: 'Silakan cek catatan admin untuk detail alasan penolakan.',
                tone: 'negative',
            };
        }

        if (normalizedStatus === 'selesai') {
            return {
                currentTitle: 'Proses booking Anda telah selesai di bank.',
                currentText: 'Pengajuan dinyatakan siap untuk tahapan akad.',
                nextTitle: 'Tahap berikutnya: persiapan akad.',
                nextText: 'Status booking sudah final pada sistem.',
                tone: 'final-positive',
            };
        }

        if (normalizedStatus === 'dibatalkan') {
            return {
                currentTitle: 'Pengajuan booking dibatalkan pada tahap bank.',
                currentText: 'Pengajuan tidak dapat dilanjutkan karena ditolak oleh bank.',
                nextTitle: 'Tahap berikutnya: tidak ada proses lanjutan.',
                nextText: 'Status booking sudah final pada sistem.',
                tone: 'final-negative',
            };
        }

        return {
            currentTitle: 'Booking Anda sedang menunggu verifikasi awal admin perumahan.',
            currentText: 'Pengajuan belum diputuskan dan masih dalam antrean proses verifikasi.',
            nextTitle: 'Tahap berikutnya: keputusan awal admin perumahan.',
            nextText: 'Status akan berubah menjadi Disetujui atau Ditolak.',
            tone: 'pending',
        };
    };

    const basePrice = Number(booking?.perumahan?.harga) || 0;
    const promoPricing = calculatePromoPricing(promos, booking?.perumahan?.id, basePrice);
    const finalPrice = Math.max(0, basePrice - promoPricing.discount);
    const normalizedStatus = normalizeBookingStatus(booking?.status_booking);
    const statusInsight = getStatusInsight(normalizedStatus);
    const statusTheme = STATUS_INSIGHT_THEME[statusInsight.tone] || STATUS_INSIGHT_THEME.pending;

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

                    <div className={`relative overflow-hidden rounded-2xl border ${statusTheme.shell}`}>
                        <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${statusTheme.orb}`} />
                        <div className="relative p-4 sm:p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <span className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${statusTheme.icon}`}>
                                    <FiClock size={18} />
                                </span>
                                <div className="space-y-2">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${statusTheme.label}`}>
                                        Status Saat Ini
                                    </span>
                                    <p className={`text-base sm:text-lg font-semibold leading-tight ${statusTheme.title}`}>{statusInsight.currentTitle}</p>
                                    <p className={`text-sm leading-relaxed ${statusTheme.text}`}>{statusInsight.currentText}</p>
                                </div>
                            </div>

                            <div className={`rounded-xl border p-3.5 sm:p-4 backdrop-blur-sm ${statusTheme.nextCard}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex h-2 w-2 rounded-full ${statusTheme.dot}`} />
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${statusTheme.nextLabel}`}>Tahap Berikutnya</p>
                                </div>
                                <p className="mt-1.5 text-sm sm:text-base font-semibold text-gray-900">{statusInsight.nextTitle}</p>
                                <p className="mt-1 text-xs sm:text-sm text-gray-600">{statusInsight.nextText}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Unit Dibooking</p>
                            <p className="font-semibold text-gray-900">
                                {booking.unit?.code ? `${booking.unit.code} (${booking.unit.block_name || '-'})` : '-'}
                            </p>
                            {booking.unit?.sales_mode === 'indent' && (
                                <p className="mt-2 text-xs font-medium text-amber-700">
                                    Unit ini masih dalam tahap pembangunan (Indent). Estimasi selesai: {formatMonthYear(booking.unit?.estimated_completion_date)}
                                </p>
                            )}
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Tanggal Booking</p>
                            <p className="font-semibold text-gray-900">{formatDateTime(booking.tanggal_booking)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Catatan Admin</p>
                            <p className="font-semibold text-gray-900">{booking.catatan_admin || '-'}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">No. Rekening</p>
                            <p className="font-semibold text-gray-900">{booking.no_rekening || '-'}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-gray-500">Nominal DP</p>
                            <p className="font-semibold text-gray-900">{booking.range_harga_dp || '-'}</p>
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
                            <p className="text-gray-500">Angsuran Lain Berjalan</p>
                            <p className="font-semibold text-gray-900">{formatInstallmentStatus(booking.memiliki_angsuran_lain)}</p>
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
                                    href={resolveAssetUrl(doc.path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block rounded-md border border-gray-200 px-4 py-3 text-sm text-primary-700 hover:bg-gray-50"
                                >
                                    <span className="block font-semibold text-gray-900">{doc.jenis_dokumen || 'Dokumen'}</span>
                                    <span className="mt-1 block text-sm text-primary-700">{doc.nama_file}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
