import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    FaHome,
    FaUserTie,
    FaMoneyBillWave,
    FaBookmark,
    FaEllipsisV,
    FaSlidersH,
    FaChevronDown,
    FaChevronUp,
    FaCheck,
} from 'react-icons/fa';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import logoPt from '../../assets/logo_pt.png';
import { API_BASE } from '../../utils/promo';
import { authHeaders, getStoredUser } from '../../lib/auth';

const DEFAULT_CARDS = Object.freeze({
    subsidi: 0,
    komersil: 0,
    townhouse: 0,
    total_booking: 0,
});

const PROPERTY_CATEGORY_SECTIONS = [
    { key: 'subsidi', label: 'Perumahan Subsidi' },
    { key: 'komersil', label: 'Perumahan Komersil' },
    { key: 'townhouse', label: 'Townhouse' },
    { key: 'lainnya', label: 'Lainnya' },
];

function OutlineLegend({ items, className = '' }) {
    return (
        <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
            {items.map((item) => (
                <div
                    key={item.name}
                    className="inline-flex items-center gap-2"
                >
                    <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[11px] font-medium text-slate-600">{item.name}</span>
                </div>
            ))}
        </div>
    );
}

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('all');
    const [propertyFilterMenuOpen, setPropertyFilterMenuOpen] = useState(false);
    const propertyFilterPopoverRef = useRef(null);
    const user = getStoredUser();

    useEffect(() => {
        if (!propertyFilterMenuOpen) return undefined;

        const handleClickOutside = (event) => {
            if (propertyFilterPopoverRef.current && !propertyFilterPopoverRef.current.contains(event.target)) {
                setPropertyFilterMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setPropertyFilterMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [propertyFilterMenuOpen]);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/api/admin/dashboard/summary`, {
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Gagal memuat data dashboard.');
                }
                const data = await response.json();

                let propertyCountByCategory = null;
                let propertyCategoryLookup = null;
                try {
                    const propertyResponse = await fetch(`${API_BASE}/api/admin/perumahan`, {
                        headers: authHeaders(),
                    });

                    if (propertyResponse.ok) {
                        const properties = await propertyResponse.json();
                        const counts = { subsidi: 0, komersil: 0, townhouse: 0 };
                        const categoryLookup = {};

                        (properties || []).forEach((property) => {
                            const key = String(property?.category || '').toLowerCase();
                            if (property?.id !== undefined && property?.id !== null) {
                                categoryLookup[String(property.id)] = key;
                            }
                            if (Object.prototype.hasOwnProperty.call(counts, key)) {
                                counts[key] += 1;
                            }
                        });

                        propertyCountByCategory = counts;
                        propertyCategoryLookup = categoryLookup;
                    }
                } catch {
                    // Keep fallback to summary cards when perumahan list fails to load.
                }

                setSummary({
                    ...data,
                    cards: {
                        ...DEFAULT_CARDS,
                        ...(data?.cards || {}),
                        ...(propertyCountByCategory || {}),
                    },
                    property_category_lookup: propertyCategoryLookup || {},
                });
            } catch (err) {
                setError(err.message || 'Gagal memuat data dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    const salesData = summary?.sales_data || [];
    const cards = useMemo(() => summary?.cards || DEFAULT_CARDS, [summary?.cards]);

    const statCards = useMemo(() => ([
        {
            key: 'subsidi',
            label: 'Perumahan Subsidi',
            value: cards.subsidi,
            desc: 'Total perumahan subsidi',
            Icon: FaHome,
            toneClass: 'tone-rose',
        },
        {
            key: 'komersil',
            label: 'Perumahan Komersil',
            value: cards.komersil,
            desc: 'Total perumahan komersil',
            Icon: FaHome,
            toneClass: 'tone-amber',
        },
        {
            key: 'townhouse',
            label: 'Perumahan Townhouse',
            value: cards.townhouse,
            desc: 'Total perumahan townhouse',
            Icon: FaHome,
            toneClass: 'tone-sky',
        },
        {
            key: 'total_booking',
            label: 'Total Booking Masuk',
            value: cards.total_booking,
            desc: 'Seluruh booking terdaftar',
            Icon: FaBookmark,
            toneClass: 'tone-indigo',
        },
    ]), [cards]);

    const propertyFilterOptions = useMemo(() => {
        const rawOptions = summary?.property_filter_options || summary?.property_status_by_property || [];
        const categoryLookup = summary?.property_category_lookup || {};

        return rawOptions
            .map((item) => ({
                id: String(item?.id ?? ''),
                name: item?.name || '-',
                category: String(categoryLookup[String(item?.id)] || '').toLowerCase(),
            }))
            .filter((item) => item.id)
            .sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
    }, [summary?.property_filter_options, summary?.property_status_by_property, summary?.property_category_lookup]);

    const groupedPropertyFilterOptions = useMemo(() => {
        const grouped = {
            subsidi: [],
            komersil: [],
            townhouse: [],
            lainnya: [],
        };

        propertyFilterOptions.forEach((item) => {
            if (Object.prototype.hasOwnProperty.call(grouped, item.category)) {
                grouped[item.category].push(item);
                return;
            }
            grouped.lainnya.push(item);
        });

        return grouped;
    }, [propertyFilterOptions]);

    const selectedPropertyLabel = useMemo(() => {
        if (selectedPropertyFilter === 'all') {
            return 'All';
        }
        return propertyFilterOptions.find((item) => item.id === String(selectedPropertyFilter))?.name || 'All';
    }, [propertyFilterOptions, selectedPropertyFilter]);

    const selectedPropertyStatus = useMemo(() => {
        const fallback = {
            tersedia: Number(summary?.property_status?.tersedia) || 0,
            terbooking: Number(summary?.property_status?.terbooking ?? summary?.property_status?.terjual) || 0,
            proses_booking: Number(summary?.property_status?.proses_booking) || 0,
            total_unit: Number(summary?.property_status?.total_unit) || 0,
        };

        if (selectedPropertyFilter === 'all') {
            return fallback;
        }

        const selectedItem = (summary?.property_status_by_property || []).find(
            (item) => String(item?.id) === String(selectedPropertyFilter)
        );

        if (!selectedItem) {
            return {
                tersedia: 0,
                terbooking: 0,
                proses_booking: 0,
                total_unit: 0,
            };
        }

        return {
            tersedia: Number(selectedItem?.tersedia) || 0,
            terbooking: Number(selectedItem?.terbooking ?? selectedItem?.terjual) || 0,
            proses_booking: Number(selectedItem?.proses_booking) || 0,
            total_unit: Number(selectedItem?.total_unit) || 0,
        };
    }, [summary, selectedPropertyFilter]);

    const propertyStatusData = useMemo(() => ([
        { name: 'Tersedia', value: selectedPropertyStatus.tersedia, color: '#10b981' },
        { name: 'Terbooking', value: selectedPropertyStatus.terbooking, color: '#ef4444' },
        { name: 'Proses Booking', value: selectedPropertyStatus.proses_booking, color: '#f59e0b' },
    ]), [selectedPropertyStatus]);
    const salesLegendData = useMemo(() => ([
        { name: 'Subsidi', color: '#35518b' },
        { name: 'Komersil', color: '#10b981' },
        { name: 'Townhouse', color: '#f59e0b' },
    ]), []);

    const totalUnit = selectedPropertyStatus.total_unit || 0;
    const recentBookingsData = summary?.recent_bookings || [];
    const recentActivities = summary?.recent_activities || [];

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatStatusClass = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized.includes('setuju') || normalized.includes('selesai')) {
            return 'bg-green-50 text-green-700 border-green-200';
        }
        if (normalized.includes('tolak') || normalized.includes('batal')) {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    };

    const activityIconClass = (iconType) => {
        if (iconType === 'approved') return 'bg-green-50 text-green-600 border border-green-200';
        if (iconType === 'rejected') return 'bg-red-50 text-red-600 border border-red-200';
        if (iconType === 'done') return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
        if (iconType === 'new') return 'bg-blue-50 text-blue-600 border border-blue-200';
        return 'bg-gray-50 text-gray-500 border border-gray-200';
    };

    const renderActivityIcon = (iconType) => {
        if (iconType === 'approved' || iconType === 'done') return <FaBookmark size={15} />;
        if (iconType === 'rejected') return <FaMoneyBillWave size={15} />;
        if (iconType === 'new') return <FaUserTie size={15} />;
        return <FaHome size={15} />;
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="admin-page-title text-3xl md:text-5xl font-bold tracking-tight text-[#0b1e45]">Dashboard</h1>
                <p className="admin-page-subtitle text-sm text-slate-500 mt-2">Ringkasan performa sistem pemasaran perumahan.</p>
            </div>

            <div className="rounded-2xl border border-[#e7dfd0] bg-white p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <img src={logoPt} alt="Zavira Mecca Property" className="h-12 w-12 rounded-xl border border-[#e7dfd0] bg-[#fbfaf6] p-1.5 object-contain" />
                    <div>
                        <p className="text-2xl font-bold text-[#0b1e45] leading-none">Selamat Datang</p>
                        <p className="text-slate-500 mt-1">{user?.nama || 'Admin'}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-[#e7dfd0] bg-[#fbfaf6] px-4 py-2 text-sm text-slate-600 w-full sm:w-auto text-center sm:text-left">
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((item) => (
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#e7dfd0] bg-white p-5 lg:col-span-2 shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-[#0b1e45]">Data Penjualan</h2>
                            <p className="text-xs text-slate-500">Booking per kategori ({new Date().getFullYear()})</p>
                        </div>
                        <OutlineLegend items={salesLegendData} className="justify-end" />
                    </div>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-sm text-slate-500">Memuat grafik...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede7db" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f8f7f3' }}
                                        contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e7dfd0', boxShadow: '0 10px 20px -12px rgba(15, 23, 42, 0.35)' }}
                                    />
                                    <Bar dataKey="Subsidi" fill="#35518b" radius={[6, 6, 0, 0]} barSize={10} />
                                    <Bar dataKey="Komersil" fill="#10b981" radius={[6, 6, 0, 0]} barSize={10} />
                                    <Bar dataKey="Townhouse" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#e7dfd0] bg-white p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2 gap-2">
                        <h2 className="text-xl font-bold text-[#0b1e45]">Status Properti</h2>
                        <div className="relative" ref={propertyFilterPopoverRef}>
                            <button
                                type="button"
                                onClick={() => setPropertyFilterMenuOpen((prev) => !prev)}
                                disabled={loading}
                                className="inline-flex h-9 min-w-[190px] items-center justify-between rounded-full border border-[#e7dfd0] bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <FaSlidersH className="text-[10px]" />
                                    {selectedPropertyLabel}
                                </span>
                                {propertyFilterMenuOpen ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                            </button>

                            {propertyFilterMenuOpen && (
                                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(90vw,330px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]">
                                    <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Kategori</p>
                                    <div className="mt-2 space-y-1 border-b border-slate-200 pb-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPropertyFilter('all');
                                                setPropertyFilterMenuOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                                selectedPropertyFilter === 'all'
                                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>All</span>
                                            {selectedPropertyFilter === 'all' && <FaCheck className="text-xs" />}
                                        </button>
                                    </div>

                                    {PROPERTY_CATEGORY_SECTIONS.map((section) => {
                                        const options = groupedPropertyFilterOptions[section.key] || [];
                                        if (options.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <div key={section.key} className="mt-3 first:mt-2">
                                                <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">{section.label}</p>
                                                <div className="mt-2 space-y-1">
                                                    {options.map((option) => {
                                                        const isActive = String(selectedPropertyFilter) === option.id;
                                                        return (
                                                            <button
                                                                key={option.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedPropertyFilter(option.id);
                                                                    setPropertyFilterMenuOpen(false);
                                                                }}
                                                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                                                    isActive
                                                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                                                        : 'text-slate-700 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span className="truncate text-left">{option.name}</span>
                                                                {isActive && <FaCheck className="text-xs shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-64 relative flex justify-center items-center">
                        {loading ? (
                            <div className="text-sm text-slate-500">Memuat ringkasan...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={propertyStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {propertyStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                            <span className="text-sm text-slate-500">Total Unit</span>
                            <span className="text-3xl font-bold text-[#0b1e45]">{totalUnit}</span>
                        </div>
                    </div>
                    <OutlineLegend items={propertyStatusData} className="mt-2 justify-center" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#e7dfd0] bg-white p-5 lg:col-span-2 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[#0b1e45]">Daftar Booking Terbaru</h2>
                        <button className="text-slate-400 hover:text-slate-600"><FaEllipsisV size={14} /></button>
                    </div>
                    <div className="overflow-x-auto responsive-table-wrap">
                        <table className="admin-table w-full text-sm text-left min-w-[860px]">
                            <thead className="text-slate-600 border-b border-[#ece4d6]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Nama</th>
                                    <th className="px-4 py-3 font-semibold">ID Booking</th>
                                    <th className="px-4 py-3 font-semibold">Perumahan</th>
                                    <th className="px-4 py-3 font-semibold">Tipe</th>
                                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0eadf]">
                                {recentBookingsData.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-8 text-slate-500" colSpan="6">
                                            Belum ada data booking.
                                        </td>
                                    </tr>
                                ) : (
                                    recentBookingsData.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-[#fbfaf7] transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#eef2fb] text-[#35518b] flex items-center justify-center text-xs font-bold">
                                                        {(booking.name || 'U').slice(0, 1).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-700">{booking.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-500 font-medium">{booking.code}</td>
                                            <td className="px-4 py-4 text-slate-700 font-medium">{booking.property}</td>
                                            <td className="px-4 py-4 text-slate-700 font-medium">{booking.type}</td>
                                            <td className="px-4 py-4 text-slate-500 font-medium">{formatDate(booking.date)}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg border ${formatStatusClass(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#e7dfd0] bg-white p-5 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#0b1e45]">Aktivitas Terbaru</h2>
                        <button className="text-slate-400 hover:text-slate-600"><FaEllipsisV size={14} /></button>
                    </div>

                    <div className="flex-1 space-y-5">
                        {recentActivities.length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada aktivitas terbaru.</p>
                        ) : (
                            recentActivities.map((item, idx) => (
                                <div key={`${item.subtitle}-${idx}`} className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${activityIconClass(item.icon_type)}`}>
                                        {renderActivityIcon(item.icon_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                                        <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                                    </div>
                                    <div className="text-xs text-slate-400 whitespace-nowrap">
                                        {item.time}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
