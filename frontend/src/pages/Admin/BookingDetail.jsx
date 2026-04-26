import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { FiArrowLeft, FiCheckCircle, FiFileText, FiMapPin, FiSlash, FiUser, FiXCircle } from 'react-icons/fi';
import { formatMoney } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';
import { apiJson, resolveAssetUrl } from '../../lib/api';
import { formatPhoneForDisplay } from '../../lib/phone';

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiJson(`/admin/bookings/${id}`, {
                headers: authHeaders(),
                defaultErrorMessage: 'Detail booking tidak ditemukan.',
            });
            setBooking(data);
            setAdminNote(data?.catatan_admin || '');
        } catch (err) {
            setError(err.message || 'Gagal memuat detail booking.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

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

    const updateStatus = async (nextStatus) => {
        if (!booking) return;

        const actionLabel = {
            Disetujui: 'menyetujui',
            Ditolak: 'menolak',
            Selesai: 'menyelesaikan',
            Dibatalkan: 'membatalkan',
        }[nextStatus] || 'mengubah status';

        const confirmed = window.confirm(
            `Yakin ingin ${actionLabel} booking ${booking.code}?`
        );

        if (!confirmed) return;

        setUpdating(true);
        setError('');
        try {
            const data = await apiJson(`/admin/bookings/${booking.id}/status`, {
                method: 'PATCH',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({
                    status_booking: nextStatus,
                    catatan_admin: adminNote.trim() || null,
                }),
                defaultErrorMessage: 'Gagal memperbarui status.',
            });
            const nextBooking = data.booking || booking;
            setBooking(nextBooking);
            setAdminNote(nextBooking?.catatan_admin || '');
        } catch (err) {
            setError(err.message || 'Gagal memperbarui status.');
        } finally {
            setUpdating(false);
        }
    };

    const saveAdminNote = async () => {
        if (!booking) return;

        setUpdating(true);
        setError('');
        try {
            const data = await apiJson(`/admin/bookings/${booking.id}/status`, {
                method: 'PATCH',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({
                    status_booking: booking.status,
                    catatan_admin: adminNote.trim() || null,
                }),
                defaultErrorMessage: 'Gagal menyimpan catatan admin.',
            });
            const nextBooking = data.booking || booking;
            setBooking(nextBooking);
            setAdminNote(nextBooking?.catatan_admin || '');
        } catch (err) {
            setError(err.message || 'Gagal menyimpan catatan admin.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-sm text-gray-500">Memuat detail booking...</div>;
    }

    if (!booking) {
        return (
            <div className="space-y-4 p-2">
                <p className="text-sm text-red-600">{error || 'Detail booking tidak ditemukan.'}</p>
                <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
                    Kembali ke Kelola Booking
                </Button>
            </div>
        );
    }

    const currentStatus = booking.status;
    const isPendingStatus = currentStatus === 'Menunggu Konfirmasi' || currentStatus === 'Menunggu';

    const statusActions = [
        {
            key: 'Disetujui',
            buttonLabel: 'Setujui',
            hint: 'Disetujui admin perumahan',
            helper: 'Booking lanjut ke tahap proses bank setelah disetujui admin perumahan.',
            group: 'Tahap Awal',
            tone: 'positive',
            icon: FiCheckCircle,
            disabled: updating || !isPendingStatus,
        },
        {
            key: 'Ditolak',
            buttonLabel: 'Tolak',
            hint: 'Ditolak admin perumahan',
            helper: 'Booking berhenti di tahap awal karena ditolak admin perumahan.',
            group: 'Tahap Awal',
            tone: 'negative',
            icon: FiXCircle,
            disabled: updating || !isPendingStatus,
        },
        {
            key: 'Selesai',
            buttonLabel: 'Selesai',
            hint: 'Proses bank selesai, siap akad',
            helper: 'Gunakan saat proses di bank selesai dan booking siap masuk tahap akad.',
            group: 'Tahap Lanjutan Bank',
            tone: 'final-positive',
            icon: FiCheckCircle,
            disabled: updating || currentStatus !== 'Disetujui',
        },
        {
            key: 'Dibatalkan',
            buttonLabel: 'Batalkan',
            hint: 'Pengajuan ditolak oleh bank',
            helper: 'Gunakan saat pengajuan bank ditolak sehingga proses booking dibatalkan.',
            group: 'Tahap Lanjutan Bank',
            tone: 'final-negative',
            icon: FiSlash,
            disabled: updating || currentStatus !== 'Disetujui',
        },
    ];

    const getActionToneClasses = (tone) => {
        if (tone === 'positive') {
            return {
                badge: 'bg-green-50 text-green-700 border-green-200',
                iconWrap: 'bg-green-100 text-green-700 border-green-200',
                activeCard: 'border-green-300 bg-green-50/50',
            };
        }
        if (tone === 'negative') {
            return {
                badge: 'bg-red-50 text-red-700 border-red-200',
                iconWrap: 'bg-red-100 text-red-700 border-red-200',
                activeCard: 'border-red-300 bg-red-50/50',
            };
        }
        if (tone === 'final-positive') {
            return {
                badge: 'bg-blue-50 text-blue-700 border-blue-200',
                iconWrap: 'bg-blue-100 text-blue-700 border-blue-200',
                activeCard: 'border-blue-300 bg-blue-50/50',
            };
        }

        return {
            badge: 'bg-gray-100 text-gray-700 border-gray-200',
            iconWrap: 'bg-slate-100 text-slate-700 border-slate-200',
            activeCard: 'border-slate-300 bg-slate-50/50',
        };
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-300">
            <Link to="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-700">
                <FiArrowLeft /> Kembali ke Kelola Booking
            </Link>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Booking</h1>
                    <p className="text-gray-500 text-sm">Kode: {booking.code}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(currentStatus)} className="w-fit">{currentStatus}</Badge>
                </div>
            </div>

            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Unit Booking</p>
                        <p className="font-semibold text-gray-900">
                            {booking.unit?.code ? `${booking.unit.code} (${booking.unit.block_name || '-'})` : '-'}
                        </p>
                        {booking.unit?.sales_mode === 'indent' && (
                            <p className="mt-2 text-xs font-medium text-amber-700">
                                Unit ini masih dalam tahap pembangunan (Indent). Estimasi selesai: {formatMonthYear(booking.unit?.estimated_completion_date)}
                            </p>
                        )}
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Tanggal Booking</p>
                        <p className="font-semibold text-gray-900">{formatDateTime(booking.date)}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Catatan Admin</p>
                        <p className="font-semibold text-gray-900">{booking.catatan_admin || '-'}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">No. Rekening</p>
                        <p className="font-semibold text-gray-900">{booking.no_rekening || '-'}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Nominal DP</p>
                        <p className="font-semibold text-gray-900">{booking.range_harga_dp || '-'}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Pekerjaan</p>
                        <p className="font-semibold text-gray-900">{booking.pekerjaan || '-'}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Jenis Pekerjaan</p>
                        <p className="font-semibold text-gray-900">{formatJobType(booking.jenis_pekerjaan)}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Gaji per Bulan</p>
                        <p className="font-semibold text-gray-900">{formatMoney(booking.gaji_bulanan || 0)}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Angsuran Lain Berjalan</p>
                        <p className="font-semibold text-gray-900">{formatInstallmentStatus(booking.memiliki_angsuran_lain)}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Dokumen</p>
                        <p className="font-semibold text-gray-900">{booking.documents?.length || 0} file</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FiUser /> Data Pemesan</h2>
                        <div className="text-sm space-y-2">
                            <p><span className="text-gray-500">Nama:</span> <span className="font-medium text-gray-900">{booking.user?.name || '-'}</span></p>
                            <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{booking.user?.email || '-'}</span></p>
                            <p><span className="text-gray-500">No. HP:</span> <span className="font-medium text-gray-900">{formatPhoneForDisplay(booking.user?.phone) || '-'}</span></p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FiMapPin /> Properti</h2>
                        <div className="text-sm space-y-2">
                            <p><span className="text-gray-500">Nama:</span> <span className="font-medium text-gray-900">{booking.property?.name || '-'}</span></p>
                            <p><span className="text-gray-500">Tipe:</span> <span className="font-medium text-gray-900">{booking.property?.type || '-'}</span></p>
                            <p><span className="text-gray-500">Lokasi:</span> <span className="font-medium text-gray-900">{booking.property?.location || '-'}</span></p>
                            <p><span className="text-gray-500">Harga:</span> <span className="font-medium text-gray-900">{formatMoney(booking.property?.price || 0)}</span></p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FiFileText /> Dokumen Terlampir</h2>
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

            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">Catatan Admin</h2>
                    <textarea
                        rows="4"
                        value={adminNote}
                        onChange={(event) => setAdminNote(event.target.value)}
                        placeholder="Tulis catatan admin untuk booking ini..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500"
                    />
                    <div className="flex justify-end">
                        <Button type="button" onClick={saveAdminNote} disabled={updating} className="w-full sm:w-auto">
                            {updating ? 'Menyimpan...' : 'Simpan Catatan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold text-gray-900">Aksi Status Booking</h2>
                        <p className="text-sm text-gray-600">
                            Pilih tindakan verifikasi booking sesuai tahapan proses.
                        </p>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-800">
                            Tahap awal hanya untuk keputusan admin perumahan. Tahap lanjutan bank hanya aktif setelah status booking Disetujui.
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {statusActions.map((action) => {
                            const isActiveStatus = currentStatus === action.key;
                            const toneClasses = getActionToneClasses(action.tone);
                            const Icon = action.icon;
                            const disabled = action.disabled || isActiveStatus;

                            return (
                                <div
                                    key={action.key}
                                    className={`rounded-xl border p-4 transition-colors ${isActiveStatus
                                        ? toneClasses.activeCard
                                        : 'border-gray-200 bg-white'
                                        } ${disabled && !isActiveStatus ? 'opacity-70' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${toneClasses.iconWrap}`}>
                                                <Icon size={18} />
                                            </span>
                                            <div>
                                                <p className="text-sm text-gray-500">{action.group}</p>
                                                <p className="text-base font-semibold text-gray-900">{action.key}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClasses.badge}`}>
                                                {action.tone === 'positive' ? 'Positif' : action.tone === 'negative' ? 'Negatif' : 'Final'}
                                            </span>
                                            {isActiveStatus && (
                                                <span className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                                                    Status Saat Ini
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        <p className="text-sm font-medium text-gray-800">{action.hint}</p>
                                        <p className="text-xs text-gray-500">{action.helper}</p>
                                    </div>

                                    <div className="mt-4">
                                        <Button
                                            variant={isActiveStatus ? 'secondary' : 'outline'}
                                            disabled={disabled}
                                            onClick={() => updateStatus(action.key)}
                                            className="w-full sm:w-auto"
                                            title={disabled && !isActiveStatus ? 'Belum dapat dipilih pada tahap ini' : ''}
                                        >
                                            {isActiveStatus ? 'Status Aktif' : action.buttonLabel}
                                        </Button>
                                        {disabled && !isActiveStatus && (
                                            <p className="mt-2 text-xs text-gray-500">
                                                Belum tersedia pada status saat ini.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
