import React, { useEffect, useMemo, useState } from 'react';
import { FaHome, FaUserTie, FaMoneyBillWave, FaBookmark, FaEllipsisV } from 'react-icons/fa';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import logoPt from '../../assets/logo_pt.png';
import { API_BASE } from '../../utils/promo';
import { authHeaders, getStoredUser } from '../../lib/auth';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const user = getStoredUser();

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
                setSummary(data);
            } catch (err) {
                setError(err.message || 'Gagal memuat data dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    const salesData = summary?.sales_data || [];
    const cards = summary?.cards || {
        subsidi: 0,
        komersil: 0,
        townhouse: 0,
        total_booking: 0,
    };

    const statCards = useMemo(() => ([
        {
            key: 'subsidi',
            label: 'Perumahan Subsidi',
            value: cards.subsidi,
            desc: 'Unit kategori subsidi',
            Icon: FaHome,
            iconClass: 'text-[#35518b] bg-[#edf3ff]',
            accentClass: 'bg-[#35518b]',
        },
        {
            key: 'komersil',
            label: 'Perumahan Komersil',
            value: cards.komersil,
            desc: 'Unit kategori komersil',
            Icon: FaHome,
            iconClass: 'text-[#35518b] bg-[#edf3ff]',
            accentClass: 'bg-[#35518b]',
        },
        {
            key: 'townhouse',
            label: 'Perumahan Townhouse',
            value: cards.townhouse,
            desc: 'Unit kategori townhouse',
            Icon: FaHome,
            iconClass: 'text-[#35518b] bg-[#edf3ff]',
            accentClass: 'bg-[#35518b]',
        },
        {
            key: 'total_booking',
            label: 'Total Booking Masuk',
            value: cards.total_booking,
            desc: 'Seluruh booking terdaftar',
            Icon: FaBookmark,
            iconClass: 'text-[#35518b] bg-[#edf3ff]',
            accentClass: 'bg-[#35518b]',
        },
    ]), [cards]);

    const propertyStatusData = useMemo(() => {
        const terjual = summary?.property_status?.terjual || 0;
        const tersedia = summary?.property_status?.tersedia || 0;
        return [
            { name: 'Terjual', value: terjual, color: '#35518b' },
            { name: 'Tersedia', value: tersedia, color: '#10b981' },
        ];
    }, [summary]);

    const totalUnit = summary?.property_status?.total_unit || 0;
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
                    <div key={item.key} className="rounded-2xl border border-[#e7dfd0] bg-white overflow-hidden shadow-sm">
                        <div className={`h-1 ${item.accentClass}`} />
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                                    <p className="text-4xl font-bold text-[#0b1e45] mt-2 leading-none">{item.value}</p>
                                    <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
                                </div>
                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${item.iconClass}`}>
                                    <item.Icon />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#e7dfd0] bg-white p-5 lg:col-span-2 shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-[#0b1e45]">Data Penjualan</h2>
                            <p className="text-xs text-slate-500">Booking per kategori ({new Date().getFullYear()})</p>
                        </div>
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
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', top: -40, right: 0 }} />
                                    <Bar dataKey="Subsidi" fill="#35518b" radius={[6, 6, 0, 0]} barSize={10} />
                                    <Bar dataKey="Komersil" fill="#10b981" radius={[6, 6, 0, 0]} barSize={10} />
                                    <Bar dataKey="Townhouse" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#e7dfd0] bg-white p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-[#0b1e45]">Status Properti</h2>
                        <button className="text-slate-400 hover:text-slate-600"><FaEllipsisV size={14} /></button>
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
                    <div className="flex justify-center gap-6 mt-2">
                        {propertyStatusData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                            </div>
                        ))}
                    </div>
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
