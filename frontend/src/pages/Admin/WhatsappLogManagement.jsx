import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaCheck,
    FaCheckCircle,
    FaChevronDown,
    FaChevronUp,
    FaClock,
    FaEye,
    FaExternalLinkAlt,
    FaSearch,
    FaSlidersH,
    FaSyncAlt,
    FaTimes,
    FaTimesCircle,
    FaWhatsapp,
} from 'react-icons/fa';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import TableSlidePagination from '../../components/admin/TableSlidePagination';
import { apiJson } from '../../lib/api';
import { authHeaders } from '../../lib/auth';
import useTableSlidePagination from '../../hooks/useTableSlidePagination';
import { formatPhoneForDisplay } from '../../lib/phone';

const STATUS_FILTERS = [
    { key: 'all', label: 'Semua Status' },
    { key: 'success', label: 'Berhasil' },
    { key: 'failed', label: 'Gagal' },
];

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

const isToday = (value) => {
    if (!value) return false;
    const now = new Date();
    const target = new Date(value);
    return now.getFullYear() === target.getFullYear()
        && now.getMonth() === target.getMonth()
        && now.getDate() === target.getDate();
};

const formatResponseData = (value) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    if (typeof value === 'string') {
        return value;
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const getStatusBadge = (status) => {
    if (status === 'success') {
        return <Badge variant="success">Berhasil</Badge>;
    }

    if (status === 'failed') {
        return <Badge variant="destructive">Gagal</Badge>;
    }

    return <Badge>{status || '-'}</Badge>;
};

const getEventBadgeVariant = (event) => {
    if (event === 'booking_status' || event === 'booking_status_mkt') return 'success';
    if (event === 'promo_broadcast') return 'warning';
    return 'secondary';
};

export default function WhatsappLogManagement() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [eventFilter, setEventFilter] = useState('all');
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [selectedLogDetail, setSelectedLogDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const filterPopoverRef = useRef(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiJson('/admin/whatsapp-logs', {
                headers: authHeaders(),
                defaultErrorMessage: 'Gagal memuat riwayat notifikasi WhatsApp.',
            });
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            setLogs([]);
            setError(err.message || 'Gagal memuat riwayat notifikasi WhatsApp.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        if (!filterMenuOpen) return undefined;

        const handleClickOutside = (event) => {
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target)) {
                setFilterMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setFilterMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [filterMenuOpen]);

    const eventOptions = useMemo(() => {
        const seen = new Map();
        (logs || []).forEach((item) => {
            if (!item?.event) return;
            if (!seen.has(item.event)) {
                seen.set(item.event, {
                    key: item.event,
                    label: item.eventLabel || item.event,
                });
            }
        });
        return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label, 'id-ID'));
    }, [logs]);

    useEffect(() => {
        if (eventFilter === 'all') return;
        const exists = eventOptions.some((item) => item.key === eventFilter);
        if (!exists) {
            setEventFilter('all');
        }
    }, [eventFilter, eventOptions]);

    const getStatusFilterLabel = (value) => (
        STATUS_FILTERS.find((item) => item.key === value)?.label || 'Semua Status'
    );

    const getEventFilterLabel = (value) => {
        if (value === 'all') return 'Semua Event';
        return eventOptions.find((item) => item.key === value)?.label || 'Semua Event';
    };

    const filteredLogs = useMemo(() => {
        const query = search.trim().toLowerCase();

        return (logs || []).filter((item) => {
            const searchable = [
                item.eventLabel,
                item.booking?.code,
                item.booking?.propertyName,
                item.user?.name,
                item.user?.email,
                item.tujuanNoHp,
                item.provider,
                item.messagePreview,
            ].join(' ').toLowerCase();

            const matchSearch = !query || searchable.includes(query);
            const matchStatus = statusFilter === 'all' || item.statusKirim === statusFilter;
            const matchEvent = eventFilter === 'all' || item.event === eventFilter;

            return matchSearch && matchStatus && matchEvent;
        });
    }, [logs, search, statusFilter, eventFilter]);

    const {
        currentPage,
        totalPages,
        paginatedRows: paginatedLogs,
        rangeStart,
        rangeEnd,
        startIndex,
        canPrevious,
        canNext,
        goPrevious,
        goNext,
    } = useTableSlidePagination(filteredLogs, {
        rowsPerPage: 10,
        resetDeps: [search, statusFilter, eventFilter],
    });

    const summary = useMemo(() => {
        const total = logs.length;
        const success = logs.filter((item) => item.statusKirim === 'success').length;
        const failed = logs.filter((item) => item.statusKirim === 'failed').length;
        const today = logs.filter((item) => isToday(item.sentAt)).length;
        return { total, success, failed, today };
    }, [logs]);

    const statCards = useMemo(() => ([
        {
            key: 'total',
            label: 'Total Log',
            value: summary.total,
            desc: 'Riwayat notifikasi terekam',
            Icon: FaWhatsapp,
        },
        {
            key: 'success',
            label: 'Berhasil',
            value: summary.success,
            desc: 'Terkirim ke provider',
            Icon: FaCheckCircle,
        },
        {
            key: 'failed',
            label: 'Gagal',
            value: summary.failed,
            desc: 'Perlu pengecekan ulang',
            Icon: FaTimesCircle,
        },
        {
            key: 'today',
            label: 'Hari Ini',
            value: summary.today,
            desc: 'Aktivitas kirim terbaru',
            Icon: FaClock,
        },
    ]), [summary]);

    const filterTriggerLabel = useMemo(() => {
        const activeLabels = [];

        if (statusFilter !== 'all') {
            activeLabels.push(getStatusFilterLabel(statusFilter));
        }

        if (eventFilter !== 'all') {
            activeLabels.push(getEventFilterLabel(eventFilter));
        }

        if (activeLabels.length === 0) return 'All';
        if (activeLabels.length === 1) return activeLabels[0];
        return `${activeLabels.length} Filter`;
    }, [statusFilter, eventFilter, eventOptions]);

    const hasActiveFilter = statusFilter !== 'all' || eventFilter !== 'all';

    const getFilterItemClass = (active) => (
        `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
            active
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-slate-700 hover:bg-slate-50'
        }`
    );

    const handleOpenDetail = async (logId) => {
        setSelectedLogId(logId);
        setSelectedLogDetail(null);
        setDetailError('');
        setDetailLoading(true);

        try {
            const data = await apiJson(`/admin/whatsapp-logs/${logId}`, {
                headers: authHeaders(),
                defaultErrorMessage: 'Gagal memuat detail log WhatsApp.',
            });
            setSelectedLogDetail(data);
        } catch (err) {
            setDetailError(err.message || 'Gagal memuat detail log WhatsApp.');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedLogId(null);
        setSelectedLogDetail(null);
        setDetailError('');
        setDetailLoading(false);
    };

    return (
        <div className="admin-page space-y-7 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="admin-page-title text-[2rem] leading-tight tracking-tight font-semibold text-gray-900">
                        Riwayat Notifikasi WhatsApp
                    </h1>
                    <p className="admin-page-subtitle text-gray-500 text-sm mt-1">
                        Pantau log pengiriman notifikasi WhatsApp untuk alur booking yang sudah terekam sistem.
                    </p>
                </div>
                <Button
                    variant="primary"
                    className="h-11 px-5 rounded-lg w-full sm:w-auto"
                    onClick={fetchLogs}
                    disabled={loading}
                >
                    <FaSyncAlt className="mr-2" /> {loading ? 'Memuat...' : 'Muat Ulang'}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((item) => (
                    <article key={item.key} className="admin-stat-card">
                        <div className="admin-stat-head">
                            <div className="admin-stat-info">
                                <p className="admin-stat-label">{item.label}</p>
                                <p className="admin-stat-value">{item.value}</p>
                                <div className="admin-stat-meta">
                                    <p className="admin-stat-desc">{item.desc}</p>
                                    <div className="admin-stat-icon">
                                        <item.Icon />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {selectedLogId && (
                <Card className="border-gray-200 shadow-sm overflow-hidden rounded-2xl">
                    <CardContent className="p-6 space-y-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Detail Log WhatsApp</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Informasi lengkap pesan, penerima, dan respons provider.
                                </p>
                            </div>
                            <Button type="button" variant="ghost" onClick={closeDetail} className="w-full sm:w-auto">
                                <FaTimes className="mr-2" /> Tutup
                            </Button>
                        </div>

                        {detailLoading ? (
                            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                                Memuat detail log...
                            </div>
                        ) : detailError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                                {detailError}
                            </div>
                        ) : selectedLogDetail ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Event</p>
                                        <div className="mt-2">
                                            <Badge variant={getEventBadgeVariant(selectedLogDetail.event)}>
                                                {selectedLogDetail.eventLabel}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Status Kirim</p>
                                        <div className="mt-2">
                                            {getStatusBadge(selectedLogDetail.statusKirim)}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Waktu Kirim</p>
                                        <p className="mt-2 font-medium text-slate-800">{formatDateTime(selectedLogDetail.sentAt)}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Provider</p>
                                        <p className="mt-2 font-medium text-slate-800 uppercase">{selectedLogDetail.provider || '-'}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Penerima</p>
                                        <p className="mt-2 font-medium text-slate-800">{selectedLogDetail.user?.name || '-'}</p>
                                        <p className="mt-1 text-xs text-slate-500">{selectedLogDetail.user?.email || '-'}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">No. WhatsApp Tujuan</p>
                                        <p className="mt-2 font-medium text-slate-800">
                                            {formatPhoneForDisplay(selectedLogDetail.tujuanNoHp) || selectedLogDetail.tujuanNoHp || '-'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Kode Booking</p>
                                        <p className="mt-2 font-medium text-slate-800">{selectedLogDetail.booking?.code || '-'}</p>
                                        <p className="mt-1 text-xs text-slate-500">{selectedLogDetail.booking?.propertyName || '-'}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Status Booking Saat Kirim</p>
                                        <p className="mt-2 font-medium text-slate-800">{selectedLogDetail.statusBookingAtSend || '-'}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {selectedLogDetail.booking?.id ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate(`/admin/bookings/${selectedLogDetail.booking.id}`)}
                                        >
                                            <FaExternalLinkAlt className="mr-2" /> Buka Booking
                                        </Button>
                                    ) : null}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white">
                                        <div className="border-b border-slate-100 px-5 py-4">
                                            <h3 className="text-base font-semibold text-gray-900">Isi Pesan</h3>
                                        </div>
                                        <div className="px-5 py-4">
                                            <pre className="whitespace-pre-wrap break-words text-sm text-slate-700 font-sans leading-relaxed">
                                                {selectedLogDetail.message || '-'}
                                            </pre>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white">
                                        <div className="border-b border-slate-100 px-5 py-4">
                                            <h3 className="text-base font-semibold text-gray-900">Respons Provider</h3>
                                        </div>
                                        <div className="px-5 py-4">
                                            <pre className="whitespace-pre-wrap break-words text-sm text-slate-700 font-mono leading-relaxed">
                                                {formatResponseData(selectedLogDetail.responseData ?? selectedLogDetail.responseRaw)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div className="relative min-w-[250px] flex-1">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input
                            type="text"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                            placeholder="Cari event, kode booking, penerima, email, no HP, atau perumahan..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="relative w-full sm:w-auto" ref={filterPopoverRef}>
                        <button
                            type="button"
                            onClick={() => setFilterMenuOpen((prev) => !prev)}
                            className={`inline-flex h-11 w-full sm:min-w-[180px] items-center justify-between rounded-full border px-4 text-sm font-medium transition-colors ${
                                hasActiveFilter
                                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <span className="inline-flex items-center gap-2">
                                <FaSlidersH className="text-xs" />
                                {filterTriggerLabel}
                                {hasActiveFilter && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                            </span>
                            {filterMenuOpen ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                        </button>

                        {filterMenuOpen && (
                            <div className="absolute left-0 top-[calc(100%+0.55rem)] z-30 w-[min(92vw,320px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]">
                                <div className="space-y-1">
                                    <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Status</p>
                                    {STATUS_FILTERS.map((item) => {
                                        const isActive = statusFilter === item.key;
                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => setStatusFilter(item.key)}
                                                className={getFilterItemClass(isActive)}
                                            >
                                                <span>{item.label}</span>
                                                {isActive && <FaCheck className="text-xs" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="my-3 h-px bg-slate-200" />

                                <div className="space-y-1">
                                    <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Event</p>
                                    <button
                                        type="button"
                                        onClick={() => setEventFilter('all')}
                                        className={getFilterItemClass(eventFilter === 'all')}
                                    >
                                        <span>Semua Event</span>
                                        {eventFilter === 'all' && <FaCheck className="text-xs" />}
                                    </button>
                                    {eventOptions.map((item) => {
                                        const isActive = eventFilter === item.key;
                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => setEventFilter(item.key)}
                                                className={getFilterItemClass(isActive)}
                                            >
                                                <span>{item.label}</span>
                                                {isActive && <FaCheck className="text-xs" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="inline-flex h-11 items-center rounded-xl border border-primary-100 bg-primary-50 px-4 text-sm font-medium text-primary-700 whitespace-nowrap">
                        {filteredLogs.length} data ditemukan
                    </div>
                </div>
            </div>

            <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto responsive-table-wrap">
                        <table className="admin-table w-full text-[13px] text-left min-w-[1220px]">
                            <thead className="bg-[#f8fafc] text-gray-500 font-semibold uppercase text-[10px] tracking-[0.06em]">
                                <tr>
                                    <th className="px-6 py-4 w-16">No</th>
                                    <th className="px-6 py-4">Waktu Kirim</th>
                                    <th className="px-6 py-4">Event</th>
                                    <th className="px-6 py-4">Booking</th>
                                    <th className="px-6 py-4">Penerima</th>
                                    <th className="px-6 py-4">No. HP</th>
                                    <th className="px-6 py-4">Status Kirim</th>
                                    <th className="px-6 py-4">Provider</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="9">
                                            Memuat riwayat notifikasi WhatsApp...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="9">
                                            Belum ada log notifikasi WhatsApp yang cocok dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedLogs.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 text-gray-500">{startIndex + index + 1}</td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {formatDateTime(item.sentAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getEventBadgeVariant(item.event)}>{item.eventLabel}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <p className="font-semibold text-gray-900 text-sm">{item.booking?.code || '-'}</p>
                                                <p className="text-[11px] text-gray-500 mt-1">{item.booking?.propertyName || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <p className="font-semibold text-gray-900 text-sm">{item.user?.name || '-'}</p>
                                                <p className="text-[11px] text-gray-500 mt-1">{item.user?.email || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatPhoneForDisplay(item.tujuanNoHp) || item.tujuanNoHp || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(item.statusKirim)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 uppercase">{item.provider || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3.5 rounded-md text-[11px] font-semibold"
                                                        onClick={() => handleOpenDetail(item.id)}
                                                    >
                                                        <FaEye className="mr-2" /> Detail
                                                    </Button>
                                                    {item.booking?.id ? (
                                                        <Button
                                                            type="button"
                                                            variant="primary"
                                                            size="sm"
                                                            className="h-8 px-3.5 rounded-md text-[11px] font-semibold !shadow-none hover:!shadow-none"
                                                            onClick={() => navigate(`/admin/bookings/${item.booking.id}`)}
                                                        >
                                                            Booking
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!loading && (
                        <div className="border-t border-slate-100 p-4">
                            <TableSlidePagination
                                rangeStart={rangeStart}
                                rangeEnd={rangeEnd}
                                totalItems={filteredLogs.length}
                                totalPages={totalPages}
                                currentPage={currentPage}
                                itemLabel="log"
                                canPrevious={canPrevious}
                                canNext={canNext}
                                onPrevious={goPrevious}
                                onNext={goNext}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
