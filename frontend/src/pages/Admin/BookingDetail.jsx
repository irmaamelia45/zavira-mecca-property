import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { FiArrowLeft, FiFileText, FiMapPin, FiUser } from 'react-icons/fi';
import { API_BASE, formatMoney } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    const fetchDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/admin/bookings/${id}`, {
                headers: authHeaders(),
            });
            if (!response.ok) {
                throw new Error('Detail booking tidak ditemukan.');
            }
            const data = await response.json();
            setBooking(data);
            setAdminNote(data?.catatan_admin || '');
        } catch (err) {
            setError(err.message || 'Gagal memuat detail booking.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

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
            const response = await fetch(`${API_BASE}/api/admin/bookings/${booking.id}/status`, {
                method: 'PATCH',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({
                    status_booking: nextStatus,
                    catatan_admin: adminNote.trim() || null,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Gagal memperbarui status.');
            }
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
            const response = await fetch(`${API_BASE}/api/admin/bookings/${booking.id}/status`, {
                method: 'PATCH',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({
                    status_booking: booking.status,
                    catatan_admin: adminNote.trim() || null,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Gagal menyimpan catatan admin.');
            }
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

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <Link to="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-700">
                <FiArrowLeft /> Kembali ke Kelola Booking
            </Link>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Booking</h1>
                    <p className="text-gray-500 text-sm">Kode: {booking.code}</p>
                </div>
                <Badge variant={statusVariant(currentStatus)} className="w-fit">{currentStatus}</Badge>
            </div>

            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Tanggal Booking</p>
                        <p className="font-semibold text-gray-900">{formatDateTime(booking.date)}</p>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Catatan Admin</p>
                        <p className="font-semibold text-gray-900">{booking.catatan_admin || '-'}</p>
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
                            <p><span className="text-gray-500">No. HP:</span> <span className="font-medium text-gray-900">{booking.user?.phone || '-'}</span></p>
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
                                    href={doc.path?.startsWith('http') ? doc.path : `${API_BASE}${doc.path}`}
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
                        <Button type="button" onClick={saveAdminNote} disabled={updating}>
                            {updating ? 'Menyimpan...' : 'Simpan Catatan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Aksi Status Booking</h2>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            disabled={updating || !isPendingStatus}
                            onClick={() => updateStatus('Disetujui')}
                        >
                            Setujui
                        </Button>
                        <Button
                            variant="outline"
                            disabled={updating || !isPendingStatus}
                            onClick={() => updateStatus('Ditolak')}
                        >
                            Tolak
                        </Button>
                        <Button
                            variant="outline"
                            disabled={updating || currentStatus !== 'Disetujui'}
                            onClick={() => updateStatus('Selesai')}
                        >
                            Selesai
                        </Button>
                        <Button
                            variant="outline"
                            disabled={updating || currentStatus !== 'Disetujui'}
                            onClick={() => updateStatus('Dibatalkan')}
                        >
                            Batalkan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
