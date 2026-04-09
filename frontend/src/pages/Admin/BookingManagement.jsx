import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { FaHome, FaSearch, FaSyncAlt } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import { API_BASE, formatMoney } from '../../utils/promo';
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
    const [propertyFilter, setPropertyFilter] = useState('all');
    const [exporting, setExporting] = useState(false);

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

    const propertyFilterOptions = useMemo(() => {
        const seen = new Map();
        (bookings || []).forEach((booking) => {
            const id = booking.property?.id;
            const name = booking.property?.name;
            if (!name) return;

            const key = String(id ?? name);
            if (!seen.has(key)) {
                seen.set(key, { key, label: name });
            }
        });

        return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label, 'id-ID'));
    }, [bookings]);

    useEffect(() => {
        if (propertyFilter === 'all') return;
        const isStillAvailable = propertyFilterOptions.some((item) => item.key === propertyFilter);
        if (!isStillAvailable) {
            setPropertyFilter('all');
        }
    }, [propertyFilter, propertyFilterOptions]);

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
            const propertyKey = String(booking.property?.id ?? booking.property?.name ?? '');
            const matchProperty = propertyFilter === 'all' || propertyKey === propertyFilter;
            return matchSearch && matchStatus && matchProperty;
        });

        return list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }, [bookings, search, statusFilter, propertyFilter]);

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

    const formatDateTime = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
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

    const getStatusFilterLabel = (value) => STATUS_FILTERS.find((item) => item.key === value)?.label || 'Semua Status';
    const getPropertyFilterLabel = (value) => {
        if (value === 'all') return 'Semua Perumahan';
        return propertyFilterOptions.find((item) => item.key === value)?.label || 'Semua Perumahan';
    };

    const downloadBookingExcel = async () => {
        if (filteredBookings.length === 0) return;

        setExporting(true);
        setError('');

        try {
            const { Workbook } = await import('exceljs');
            const workbook = new Workbook();
            workbook.creator = 'Sistem Informasi Pemasaran Perumahan';
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet('Daftar Booking');

            const headers = [
                'No',
                'Kode Booking',
                'Tanggal Booking',
                'Nama Pemesan',
                'Email Pemesan',
                'No HP Pemesan',
                'Jenis Pekerjaan',
                'Kerjaan',
                'Gaji',
                'Dokumen',
                'Nama Properti / Perumahan',
                'Tipe Properti',
                'Harga Properti',
                'Lokasi',
                'Status',
                'Catatan Admin',
            ];

            const rows = filteredBookings.map((booking, index) => [
                index + 1,
                booking.code || '-',
                formatDateTime(booking.date),
                booking.user?.name || '-',
                booking.user?.email || '-',
                booking.user?.phone || '-',
                formatJobType(booking.jenis_pekerjaan),
                booking.pekerjaan || '-',
                formatMoney(booking.gaji_bulanan || 0),
                (booking.documents || []).length,
                booking.property?.name || '-',
                booking.property?.type || '-',
                formatMoney(booking.property?.price || 0),
                booking.property?.location || '-',
                booking.status || '-',
                booking.catatan_admin || '-',
            ]);

            worksheet.mergeCells(1, 1, 1, headers.length);
            const titleCell = worksheet.getCell(1, 1);
            titleCell.value = 'Daftar Booking';
            titleCell.font = { bold: true, size: 16, color: { argb: 'FF1F3A64' } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getRow(1).height = 24;

            worksheet.mergeCells(2, 1, 2, headers.length);
            const subtitleCell = worksheet.getCell(2, 1);
            subtitleCell.value = `Filter Status: ${getStatusFilterLabel(statusFilter)} | Filter Perumahan: ${getPropertyFilterLabel(propertyFilter)} | Pencarian: ${search.trim() || '-'} | Jumlah Data: ${filteredBookings.length}`;
            subtitleCell.font = { size: 11, color: { argb: 'FF475569' } };
            subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getRow(2).height = 20;

            worksheet.addRow([]);
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF2F497F' },
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD7DEE8' } },
                    left: { style: 'thin', color: { argb: 'FFD7DEE8' } },
                    bottom: { style: 'thin', color: { argb: 'FFD7DEE8' } },
                    right: { style: 'thin', color: { argb: 'FFD7DEE8' } },
                };
            });

            rows.forEach((rowData) => {
                const row = worksheet.addRow(rowData);
                row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    };
                });
            });

            headers.forEach((header, columnIndex) => {
                const contentMaxLength = Math.max(
                    header.length,
                    ...rows.map((row) => String(row[columnIndex] ?? '').split('\n').reduce((max, line) => Math.max(max, line.length), 0))
                );
                worksheet.getColumn(columnIndex + 1).width = Math.min(Math.max(contentMaxLength + 4, 12), 40);
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob(
                [buffer],
                { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
            );

            const now = new Date();
            const timestamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0'),
                '-',
                String(now.getHours()).padStart(2, '0'),
                String(now.getMinutes()).padStart(2, '0'),
            ].join('');
            const safeFilter = statusFilter.replace(/[^a-zA-Z0-9_-]/g, '_');
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `daftar-booking-${safeFilter}-${timestamp}.xlsx`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Gagal menyiapkan file Excel daftar booking.');
        } finally {
            setExporting(false);
        }
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
        <div className="admin-page space-y-7 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="admin-page-title text-[2rem] leading-tight tracking-tight font-semibold text-gray-900">Kelola Booking</h1>
                    <p className="admin-page-subtitle text-gray-500 text-sm mt-1">Lihat, filter, dan buka detail booking. Semua aksi status dilakukan di halaman detail booking.</p>
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
                        <div className="admin-toolbar flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
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
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                                <span className="text-sm text-gray-500">{filteredBookings.length} data ditemukan</span>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-auto">
                                        <FaHome className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                        <select
                                            className="w-full sm:w-auto h-10 rounded-lg border border-gray-200 pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                                            value={propertyFilter}
                                            onChange={(e) => setPropertyFilter(e.target.value)}
                                        >
                                            <option value="all">Semua Perumahan</option>
                                            {propertyFilterOptions.map((item) => (
                                                <option key={item.key} value={item.key}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button variant="outline" className="h-10 px-3.5 w-full sm:w-auto" onClick={fetchBookings}>
                                        <FaSyncAlt className="mr-2" /> Refresh
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-10 px-3.5 w-full sm:w-auto"
                                        onClick={downloadBookingExcel}
                                        disabled={loading || exporting || filteredBookings.length === 0}
                                    >
                                        <FiDownload className="mr-2" />
                                        {exporting ? 'Menyiapkan Excel...' : 'Download Excel'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="admin-chip-group flex flex-wrap items-center gap-2">
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

                    <div className="overflow-x-auto responsive-table-wrap">
                        <table className="admin-table w-full text-[13px] text-left min-w-[980px]">
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
