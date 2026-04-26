import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaArrowLeft,
    FaChevronDown,
    FaEdit,
    FaTrash,
    FaMapMarkerAlt,
    FaTag,
    FaHome,
    FaCheckCircle,
    FaClipboardList,
} from 'react-icons/fa';
import {
    FiActivity,
    FiCheckCircle as FiCheckCircleIcon,
    FiClock,
    FiFlag,
    FiXCircle,
} from 'react-icons/fi';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import UnitPicker from '../../components/booking/UnitPicker';
import { authHeaders } from '../../lib/auth';
import { apiJson, resolveAssetUrl } from '../../lib/api';
import { formatPhoneForDisplay } from '../../lib/phone';

const STATUS_COLORS = {
    tersedia: '#10b981',
    terbooking: '#f59e0b',
    terjual: '#ef4444',
};

const ACTIVE_BOOKING_STATUSES = ['Menunggu', 'Disetujui'];

const propertyStatusBadgeClass = (property) => {
    if (!property?.isActive) return 'rounded-full px-3 py-1 border-slate-200 bg-slate-100 text-slate-700';
    const label = String(property?.status || '').toLowerCase();
    if (label.includes('sold') || label.includes('terjual')) {
        return 'rounded-full px-3 py-1 border-rose-200 bg-rose-100 text-rose-700';
    }
    return 'rounded-full px-3 py-1 border-emerald-200 bg-emerald-100 text-emerald-700';
};

const formatMonthYear = (value) => {
    if (!value) return 'Belum diatur admin';
    return new Date(value).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
    });
};

const bookingStatusCardMeta = (status) => {
    const normalized = String(status || '').toLowerCase();

    if (normalized.includes('setuju') || normalized.includes('selesai')) {
        return {
            card: 'from-emerald-50 to-white border-emerald-100',
            iconWrap: 'bg-emerald-100 text-emerald-700',
            bar: 'bg-emerald-500',
            Icon: FiCheckCircleIcon,
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

const bookingStatusVariant = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('setuju')) return 'success';
    if (normalized.includes('selesai')) return 'secondary';
    if (normalized.includes('tolak') || normalized.includes('batal')) return 'destructive';
    return 'warning';
};

export default function PropertyDetail() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [property, setProperty] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loadingProperty, setLoadingProperty] = useState(true);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [showUnitInfo, setShowUnitInfo] = useState(true);

    useEffect(() => {
        const fetchProperty = async () => {
            setLoadingProperty(true);
            setError('');
            try {
                const data = await apiJson(`/admin/perumahan/${id}`, {
                    headers: authHeaders(),
                    defaultErrorMessage: 'Gagal memuat detail perumahan.',
                });
                setProperty(data);
            } catch (err) {
                setError(err.message || 'Gagal memuat detail perumahan.');
            } finally {
                setLoadingProperty(false);
            }
        };

        const fetchBookings = async () => {
            setLoadingBookings(true);
            try {
                const data = await apiJson('/admin/bookings', {
                    headers: authHeaders(),
                    defaultErrorMessage: 'Gagal memuat data booking.',
                });
                setBookings(data || []);
            } catch {
                setBookings([]);
            } finally {
                setLoadingBookings(false);
            }
        };

        fetchProperty();
        fetchBookings();
    }, [id]);

    useEffect(() => {
        if (!selectedUnit?.id) return;

        const latestUnit = (property?.unitBlocks || [])
            .flatMap((block) => block.units || [])
            .find((unit) => String(unit.id) === String(selectedUnit.id));

        if (!latestUnit) {
            setSelectedUnit(null);
            return;
        }

        if (
            latestUnit.status !== selectedUnit.status
            || latestUnit.salesMode !== selectedUnit.salesMode
            || latestUnit.estimatedCompletionDate !== selectedUnit.estimatedCompletionDate
            || latestUnit.code !== selectedUnit.code
        ) {
            setSelectedUnit(latestUnit);
        }
    }, [property?.unitBlocks, selectedUnit]);

    const propertyBookings = useMemo(() => {
        if (!property?.id) return [];
        return (bookings || []).filter((booking) => String(booking?.property?.id) === String(property.id));
    }, [bookings, property]);

    const bookingSummary = useMemo(() => {
        const active = propertyBookings.filter((item) => ACTIVE_BOOKING_STATUSES.includes(item.status)).length;
        const approved = propertyBookings.filter((item) => item.status === 'Disetujui').length;
        const pending = propertyBookings.filter((item) => item.status === 'Menunggu' || item.status === 'Menunggu Konfirmasi').length;
        const completed = propertyBookings.filter((item) => item.status === 'Selesai').length;
        const rejected = propertyBookings.filter((item) => item.status === 'Ditolak' || item.status === 'Dibatalkan').length;
        return {
            total: propertyBookings.length,
            active,
            approved,
            pending,
            completed,
            rejected,
        };
    }, [propertyBookings]);

    const bookingStatusItems = useMemo(() => {
        const items = [
            { status: 'Menunggu', total: bookingSummary.pending },
            { status: 'Disetujui', total: bookingSummary.approved },
            { status: 'Selesai', total: bookingSummary.completed },
            { status: 'Ditolak', total: bookingSummary.rejected },
        ];

        return items.filter((item) => item.total > 0);
    }, [bookingSummary]);

    const unitStatusSummary = useMemo(() => {
        const hasBlocks = Array.isArray(property?.unitBlocks) && property.unitBlocks.length > 0;
        if (hasBlocks) {
            const counts = { tersedia: 0, terbooking: 0, terjual: 0 };

            property.unitBlocks.forEach((block) => {
                (block?.units || []).forEach((unit) => {
                    const status = String(unit?.status || '').toLowerCase();
                    if (status === 'available') {
                        counts.tersedia += 1;
                    } else if (status === 'pending') {
                        counts.terbooking += 1;
                    } else if (status === 'sold') {
                        counts.terjual += 1;
                    }
                });
            });

            const countedTotal = counts.tersedia + counts.terbooking + counts.terjual;
            return {
                ...counts,
                total: countedTotal || (Number(property?.totalUnits) || 0),
            };
        }

        const fallbackTotal = Number(property?.totalUnits) || 0;
        const fallbackAvailable = Number(property?.availableUnits) || 0;
        const fallbackSold = Math.max(fallbackTotal - fallbackAvailable, 0);
        return {
            tersedia: fallbackAvailable,
            terbooking: 0,
            terjual: fallbackSold,
            total: fallbackTotal,
        };
    }, [property?.unitBlocks, property?.totalUnits, property?.availableUnits]);

    const totalUnits = unitStatusSummary.total;
    const availableUnits = unitStatusSummary.tersedia;
    const bookedUnits = unitStatusSummary.terbooking;
    const soldUnits = unitStatusSummary.terjual;

    const unitStatusData = useMemo(() => ([
        { name: 'Tersedia', value: availableUnits, color: STATUS_COLORS.tersedia },
        { name: 'Terbooking', value: bookedUnits, color: STATUS_COLORS.terbooking },
        { name: 'Terjual', value: soldUnits, color: STATUS_COLORS.terjual },
    ]), [availableUnits, bookedUnits, soldUnits]);

    const formatMoney = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val || 0);

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleDelete = async () => {
        if (!property?.id) return;
        if (!window.confirm('Apakah Anda yakin ingin menghapus perumahan ini?')) {
            return;
        }

        setDeleting(true);
        try {
            await apiJson(`/admin/perumahan/${property.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
                defaultErrorMessage: 'Gagal menghapus perumahan.',
            });
            alert('Perumahan berhasil dihapus.');
            navigate('/admin/properties');
        } catch (err) {
            alert(err.message || 'Gagal menghapus perumahan.');
        } finally {
            setDeleting(false);
        }
    };

    if (loadingProperty) {
        return <div className="p-8 text-center text-gray-500">Memuat detail perumahan...</div>;
    }

    if (error || !property) {
        return (
            <div className="space-y-4 p-6">
                <p className="text-red-600">{error || 'Perumahan tidak ditemukan.'}</p>
                <Button variant="outline" onClick={() => navigate('/admin/properties')}>
                    <FaArrowLeft className="mr-2" /> Kembali ke Daftar
                </Button>
            </div>
        );
    }

    const detailStatCards = [
        {
            key: 'total',
            label: 'Total Unit',
            value: totalUnits,
            desc: 'Akumulasi unit terdaftar',
            Icon: FaTag,
            toneClass: 'tone-indigo',
        },
        {
            key: 'available',
            label: 'Unit Tersedia',
            value: availableUnits,
            desc: 'Unit yang dapat dibooking',
            Icon: FaCheckCircle,
            toneClass: 'tone-emerald',
        },
        {
            key: 'booked',
            label: 'Unit Terbooking',
            value: bookedUnits,
            desc: 'Booking masih dalam proses',
            Icon: FaHome,
            toneClass: 'tone-amber',
        },
        {
            key: 'sold',
            label: 'Unit Terjual',
            value: soldUnits,
            desc: 'Unit sudah selesai terjual',
            Icon: FaClipboardList,
            toneClass: 'tone-rose',
        },
    ];
    const selectedUnitIsIndent = selectedUnit?.salesMode === 'indent';
    const selectedUnitEstimateLabel = formatMonthYear(selectedUnit?.estimatedCompletionDate);

    return (
        <div className="admin-page space-y-7 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button variant="ghost" onClick={() => navigate('/admin/properties')} className="px-2 w-full sm:w-auto text-slate-700">
                    <FaArrowLeft className="mr-2" /> Kembali
                </Button>
                <div className="admin-page-head-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => navigate(`/admin/properties/edit/${property.id}`)} className="h-11 px-5 rounded-lg w-full sm:w-auto">
                        <FaEdit className="mr-2" /> Edit Perumahan
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting} className="h-11 px-5 rounded-lg w-full sm:w-auto">
                        <FaTrash className="mr-2" /> {deleting ? 'Menghapus...' : 'Hapus Perumahan'}
                    </Button>
                </div>
            </div>

            <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm">
                <div className="p-6 md:p-7">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-[#0b1e45]">{property.name}</h1>
                            <p className="text-base text-slate-600 mt-2 flex items-center gap-2">
                                <FaMapMarkerAlt className="text-[#35518b]" />
                                {property.location || '-'}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Harga Unit</p>
                            <p className="text-4xl font-bold text-[#0b1e45] mt-1 leading-none">{formatMoney(property.price)}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Badge className={propertyStatusBadgeClass(property)}>
                            {property.status || 'Tersedia'}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1 border-primary-200 bg-primary-50 text-primary-700">
                            Kategori: {(property.category || '-').toString().toUpperCase()}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1 border-slate-200 bg-slate-50 text-slate-700">
                            Tipe Unit: {property.type || '-'}
                        </Badge>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {detailStatCards.map((item) => (
                    <article key={item.key} className={`admin-stat-card ${item.toneClass}`}>
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm xl:col-span-2">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xl font-semibold text-[#0b1e45]">Status Unit Perumahan</h3>
                            <span className="text-xs uppercase tracking-[0.1em] text-slate-500">Tersedia / Terbooking / Terjual</span>
                        </div>
                        <div className="h-72 relative max-w-[460px] mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={unitStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={72}
                                        outerRadius={94}
                                        dataKey="value"
                                        paddingAngle={4}
                                        stroke="none"
                                    >
                                        {unitStatusData.map((item) => (
                                            <Cell key={item.name} fill={item.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-sm text-slate-500">Total</span>
                                <span className="text-3xl font-bold text-[#0b1e45]">{totalUnits}</span>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3">
                            {unitStatusData.map((item) => (
                                <div key={item.name} className="inline-flex items-center gap-2.5">
                                    <span
                                        aria-hidden="true"
                                        className="inline-block h-4 w-4 rounded-[3px] border-2 bg-transparent"
                                        style={{ borderColor: item.color }}
                                    />
                                    <span className="text-[17px] font-semibold text-slate-800 leading-none">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md h-full">
                    <CardContent className="p-6 md:p-7 h-full flex flex-col">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 px-5 py-5 text-white">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-primary-100 text-sm">Total Booking Perumahan</p>
                                    <p className="mt-1 text-4xl font-bold tracking-tight">{loadingBookings ? '...' : bookingSummary.total}</p>
                                    <p className="mt-2 text-sm text-primary-100">Ringkasan booking yang masuk untuk perumahan ini.</p>
                                </div>
                                <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl">
                                    <FaClipboardList />
                                </div>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                    <FiActivity />
                                    {loadingBookings ? '...' : `${bookingSummary.active} status aktif`}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                    {loadingBookings ? '...' : `${bookingSummary.completed} booking selesai`}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                    {loadingBookings ? '...' : `${bookingSummary.rejected} booking ditolak`}
                                </span>
                            </div>
                            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
                            <div className="pointer-events-none absolute -left-14 -bottom-14 h-36 w-36 rounded-full bg-white/10" />
                        </div>

                        <div className="mt-5 flex-1">
                            {loadingBookings ? (
                                <div className="flex gap-3 overflow-hidden">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} className="min-w-full shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-4 animate-pulse">
                                            <div className="h-5 w-20 rounded bg-gray-200" />
                                            <div className="mt-3 h-7 w-14 rounded bg-gray-200" />
                                            <div className="mt-3 h-2 w-full rounded bg-gray-200" />
                                        </div>
                                    ))}
                                </div>
                            ) : bookingStatusItems.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500 text-center">
                                    Belum ada booking yang bisa ditampilkan untuk perumahan ini.
                                </div>
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    {bookingStatusItems.map((item) => {
                                        const meta = bookingStatusCardMeta(item.status);
                                        const percentage = bookingSummary.total > 0
                                            ? Math.round((item.total / bookingSummary.total) * 100)
                                            : 0;
                                        const StatusIcon = meta.Icon;

                                        return (
                                            <div
                                                key={item.status}
                                                className={`min-w-full shrink-0 snap-start rounded-xl border shadow-sm bg-gradient-to-br ${meta.card}`}
                                            >
                                                <div className="p-4 md:p-5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <Badge variant={bookingStatusVariant(item.status)} className="w-fit px-2.5 py-1 text-[11px]">
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
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm xl:col-span-2">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-semibold text-[#0b1e45]">Informasi Perumahan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Alamat</p>
                                <p className="font-medium text-slate-800 mt-1">{property.address || '-'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Kota</p>
                                <p className="font-medium text-slate-800 mt-1">{property.city || '-'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Luas Tanah / Bangunan</p>
                                <p className="font-medium text-slate-800 mt-1">{property.land || 0} m2 / {property.building || 0} m2</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Kamar Tidur / Mandi</p>
                                <p className="font-medium text-slate-800 mt-1">{property.beds || 0} / {property.baths || 0}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Suku Bunga KPR</p>
                                <p className="font-medium text-slate-800 mt-1">{property.kprInterest !== null && property.kprInterest !== undefined ? `${Number(property.kprInterest).toFixed(2)}%` : '-'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Marketing</p>
                                <p className="font-medium text-slate-800 mt-1">{property.marketingName || '-'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">WhatsApp Marketing</p>
                                <p className="font-medium text-slate-800 mt-1">{formatPhoneForDisplay(property.marketingWhatsapp) || '-'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Bank Tujuan UTJ</p>
                                <p className="font-medium text-slate-800 mt-1">{property.bankNameUtj || '-'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">No. Rekening Tujuan UTJ</p>
                                <p className="font-medium text-slate-800 mt-1">{property.noRekeningUtj || '-'}</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs text-slate-500 mb-1">Deskripsi</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{property.description || '-'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-semibold text-[#0b1e45]">Foto Perumahan</h3>
                        {(property.images || []).length ? (
                            <div className="grid grid-cols-2 gap-3">
                                {property.images.slice(0, 5).map((image, index) => (
                                    <div key={`${image}-${index}`} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                        <img src={resolveAssetUrl(image)} alt={`${property.name} ${index + 1}`} className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                                Belum ada foto perumahan.
                            </div>
                        )}
                        {property.gmapsUrl && (
                            <a
                                href={property.gmapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-sm font-medium text-primary-700 hover:text-primary-800"
                            >
                                <FaMapMarkerAlt className="mr-2" /> Buka Lokasi di Google Maps
                            </a>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm">
                <CardContent className="p-6 space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-[#0b1e45]">Informasi Unit Per Blok</h3>
                            <p className="text-sm text-slate-500">
                                Tampilan unit di halaman admin disamakan dengan yang dilihat user. Untuk mengubah unit, gunakan halaman edit perumahan.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => setShowUnitInfo((prev) => !prev)}
                        >
                            {showUnitInfo ? 'Sembunyikan' : 'Tampilkan'}
                            <FaChevronDown className={`ml-2 transition-transform ${showUnitInfo ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>

                    {showUnitInfo ? (
                        Array.isArray(property.unitBlocks) && property.unitBlocks.length > 0 ? (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <UnitPicker
                                        unitBlocks={property.unitBlocks || []}
                                        selectedUnitId={selectedUnit?.id}
                                        onSelect={setSelectedUnit}
                                        title="Lihat blok dan unit rumah"
                                        helperText="Informasi blok dan unit di halaman admin mengikuti tampilan yang sama seperti di halaman user."
                                    />
                                </div>

                                {selectedUnitIsIndent && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        <p className="font-semibold">Unit ini masih dalam tahap pembangunan (Indent).</p>
                                        <p className="mt-1">Estimasi selesai: {selectedUnitEstimateLabel}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                                Data unit belum tersedia untuk perumahan ini.
                            </div>
                        )
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                            Informasi unit sedang disembunyikan. Klik tombol <span className="font-medium text-slate-700">Tampilkan</span> untuk melihatnya kembali.
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
