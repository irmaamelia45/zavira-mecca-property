import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaArrowLeft,
    FaEdit,
    FaTrash,
    FaMapMarkerAlt,
    FaTag,
    FaHome,
    FaCheckCircle,
    FaClipboardList,
    FaArrowRight,
} from 'react-icons/fa';
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
import { API_BASE } from '../../utils/property';
import { authHeaders } from '../../lib/auth';

const STATUS_COLORS = {
    tersedia: '#10b981',
    terbooking: '#ef4444',
    prosesBooking: '#f59e0b',
};

const ACTIVE_BOOKING_STATUSES = ['Menunggu', 'Disetujui'];

const resolveImagePath = (path) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
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

    useEffect(() => {
        const fetchProperty = async () => {
            setLoadingProperty(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/api/admin/perumahan/${id}`, {
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Gagal memuat detail perumahan.');
                }
                const data = await response.json();
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
                const response = await fetch(`${API_BASE}/api/admin/bookings`, {
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Gagal memuat data booking.');
                }
                const data = await response.json();
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

    const propertyBookings = useMemo(() => {
        if (!property?.id) return [];
        return (bookings || []).filter((booking) => String(booking?.property?.id) === String(property.id));
    }, [bookings, property]);

    const bookingSummary = useMemo(() => {
        const active = propertyBookings.filter((item) => ACTIVE_BOOKING_STATUSES.includes(item.status)).length;
        const approved = propertyBookings.filter((item) => item.status === 'Disetujui').length;
        const pending = propertyBookings.filter((item) => item.status === 'Menunggu' || item.status === 'Menunggu Konfirmasi').length;
        return {
            total: propertyBookings.length,
            active,
            approved,
            pending,
        };
    }, [propertyBookings]);

    const unitStatusSummary = useMemo(() => {
        const hasBlocks = Array.isArray(property?.unitBlocks) && property.unitBlocks.length > 0;
        if (hasBlocks) {
            const counts = { tersedia: 0, terbooking: 0, prosesBooking: 0 };

            property.unitBlocks.forEach((block) => {
                (block?.units || []).forEach((unit) => {
                    const status = String(unit?.status || '').toLowerCase();
                    if (status === 'available') {
                        counts.tersedia += 1;
                    } else if (status === 'pending') {
                        counts.prosesBooking += 1;
                    } else if (status === 'sold') {
                        counts.terbooking += 1;
                    }
                });
            });

            const countedTotal = counts.tersedia + counts.terbooking + counts.prosesBooking;
            return {
                ...counts,
                total: countedTotal || (Number(property?.totalUnits) || 0),
            };
        }

        const fallbackTotal = Number(property?.totalUnits) || 0;
        const fallbackAvailable = Number(property?.availableUnits) || 0;
        const fallbackBooked = Math.max(fallbackTotal - fallbackAvailable, 0);
        return {
            tersedia: fallbackAvailable,
            terbooking: fallbackBooked,
            prosesBooking: 0,
            total: fallbackTotal,
        };
    }, [property?.unitBlocks, property?.totalUnits, property?.availableUnits]);

    const totalUnits = unitStatusSummary.total;
    const availableUnits = unitStatusSummary.tersedia;
    const bookedUnits = unitStatusSummary.terbooking;
    const pendingUnits = unitStatusSummary.prosesBooking;

    const unitStatusData = useMemo(() => ([
        { name: 'Tersedia', value: availableUnits, color: STATUS_COLORS.tersedia },
        { name: 'Terbooking', value: bookedUnits, color: STATUS_COLORS.terbooking },
        { name: 'Proses Booking', value: pendingUnits, color: STATUS_COLORS.prosesBooking },
    ]), [availableUnits, bookedUnits, pendingUnits]);

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
            const response = await fetch(`${API_BASE}/api/admin/perumahan/${property.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.message || 'Gagal menghapus perumahan.');
            }
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

    const activeBookings = propertyBookings.filter((item) => ACTIVE_BOOKING_STATUSES.includes(item.status));
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
            desc: 'Stok siap dipasarkan',
            Icon: FaCheckCircle,
            toneClass: 'tone-emerald',
        },
        {
            key: 'booked',
            label: 'Unit Terbooking',
            value: bookedUnits,
            desc: 'Unit sudah terbooking',
            Icon: FaHome,
            toneClass: 'tone-amber',
        },
        {
            key: 'active',
            label: 'Booking Aktif',
            value: loadingBookings ? '-' : bookingSummary.active,
            desc: 'Menunggu dan disetujui',
            Icon: FaClipboardList,
            toneClass: 'tone-sky',
        },
    ];

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
                        <Badge className={property.isActive ? 'rounded-full px-3 py-1 border-emerald-200 bg-emerald-100 text-emerald-700' : 'rounded-full px-3 py-1 border-slate-200 bg-slate-100 text-slate-700'}>
                            {property.status || (property.isActive ? 'Available' : 'Nonaktif')}
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
                            <span className="text-xs uppercase tracking-[0.1em] text-slate-500">Tersedia / Terbooking / Proses</span>
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

                <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-semibold text-[#0b1e45]">Ringkasan Booking</h3>
                        <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-4">
                            <p className="text-sm font-semibold text-primary-700">Booking Aktif</p>
                            <p className="text-4xl font-bold text-[#0b1e45] mt-1 leading-none">{loadingBookings ? '-' : bookingSummary.active}</p>
                            <p className="text-xs text-primary-700 mt-2">Status aktif: Menunggu / Disetujui</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-xs text-slate-500">Total Booking</p>
                                <p className="text-2xl font-bold text-[#0b1e45] mt-1">{loadingBookings ? '-' : bookingSummary.total}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-xs text-slate-500">Disetujui</p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">{loadingBookings ? '-' : bookingSummary.approved}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 col-span-2">
                                <p className="text-xs text-slate-500">Menunggu Konfirmasi</p>
                                <p className="text-2xl font-bold text-amber-700 mt-1">{loadingBookings ? '-' : bookingSummary.pending}</p>
                            </div>
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
                                <p className="text-xs text-slate-500">Marketing</p>
                                <p className="font-medium text-slate-800 mt-1">{property.marketingName || '-'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">WhatsApp Marketing</p>
                                <p className="font-medium text-slate-800 mt-1">{property.marketingWhatsapp ? `+${property.marketingWhatsapp}` : '-'}</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs text-slate-500 mb-1">Deskripsi</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{property.description || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-2">Fasilitas</p>
                            <div className="flex flex-wrap gap-2">
                                {(property.facilities || []).length ? (
                                    property.facilities.map((facility) => (
                                        <span key={facility} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                                            <FaTag className="mr-1 text-primary-500" />
                                            {facility}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-500">Belum ada fasilitas.</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-semibold text-[#0b1e45]">Foto Perumahan</h3>
                        {(property.images || []).length ? (
                            <div className="grid grid-cols-2 gap-3">
                                {property.images.slice(0, 4).map((image, index) => (
                                    <div key={`${image}-${index}`} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                        <img src={resolveImagePath(image)} alt={`${property.name} ${index + 1}`} className="h-full w-full object-cover" />
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

            <Card className="rounded-2xl border border-[#e7dfd0] bg-white shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="px-5 py-4 border-b border-slate-200 bg-white">
                        <h3 className="text-xl font-semibold text-[#0b1e45] flex items-center gap-2">
                            <FaClipboardList className="text-primary-600" /> Booking Aktif Pada Perumahan Ini
                        </h3>
                    </div>
                    <div className="overflow-x-auto responsive-table-wrap">
                        <table className="admin-table w-full text-[13px] text-left min-w-[860px]">
                            <thead className="font-semibold uppercase text-[10px] tracking-[0.06em]">
                                <tr>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Kode Booking</th>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Nama Pemesan</th>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Tanggal</th>
                                    <th className="px-6 py-4 !bg-primary-700 !text-white">Status</th>
                                    <th className="px-6 py-4 text-center !bg-primary-700 !text-white">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingBookings ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="5">Memuat data booking...</td>
                                    </tr>
                                ) : activeBookings.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="5">Belum ada booking aktif untuk perumahan ini.</td>
                                    </tr>
                                ) : (
                                    activeBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-5 font-medium text-gray-700">{booking.code || '-'}</td>
                                            <td className="px-6 py-5 text-gray-900 font-medium">{booking.user?.name || '-'}</td>
                                            <td className="px-6 py-5 text-gray-500">{formatDate(booking.date)}</td>
                                            <td className="px-6 py-5">
                                                <Badge variant={booking.status === 'Disetujui' ? 'success' : 'warning'}>
                                                    {booking.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="h-9 px-4 rounded-lg text-[11px] font-semibold shadow-sm hover:shadow-md"
                                                    onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                                                >
                                                    Lihat Booking <FaArrowRight className="ml-2 text-xs" />
                                                </Button>
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
