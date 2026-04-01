import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBuilding, FaTags, FaClipboardList, FaSignOutAlt, FaBars, FaTimes, FaSearch, FaHandHoldingUsd, FaUserTie } from 'react-icons/fa';
import { cn } from '../../lib/utils';
import logoPt from '../../assets/logo_pt.png';
import { API_BASE } from '../../utils/promo';
import { authHeaders, clearAuth, getUserRole, isLoggedIn } from '../../lib/auth';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        const role = getUserRole();
        if (!isLoggedIn() || (role !== 'admin' && role !== 'superadmin')) {
            navigate('/auth/login');
        }
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                headers: authHeaders(),
            });
        } catch (err) {
            // Ignore logout API failure.
        }
        clearAuth();
        navigate('/auth/login');
    };

    const menuItems = [
        { name: 'Dashboard', path: '/admin', icon: <FaHome /> },
        { name: 'Perumahan', path: '/admin/properties', icon: <FaBuilding /> },
        { name: 'Promo', path: '/admin/promos', icon: <FaTags /> },
        { name: 'Booking', path: '/admin/bookings', icon: <FaClipboardList /> },
        { name: 'Akun Internal', path: '/admin/marketing-users', icon: <FaUserTie /> },
        { name: 'Template Surat', path: '/admin/templates', icon: <FaClipboardList /> },
        { name: 'Kelola KPR', path: '/admin/kpr', icon: <FaHandHoldingUsd /> },
        { name: 'Profil Perusahaan', path: '/admin/company-profile', icon: <FaBuilding /> },
    ];

    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        if (path !== '/admin' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="admin-ui min-h-screen bg-[#f8f7f3] font-sans text-slate-800">
            <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[#e7dfd0] bg-[#fdfcf9]/95 backdrop-blur-sm">
                <div className="h-full px-4 md:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                        </button>
                        <Link to="/admin" className="flex items-center gap-3">
                            <img src={logoPt} alt="Zavira Mecca Property" className="h-9 object-contain" />
                            <span className="text-sm md:text-base font-bold tracking-tight text-[#7d6a45] leading-tight">Zavira Mecca Property</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden md:flex items-center rounded-xl border border-[#e4dbc9] bg-white px-3 py-2 w-64">
                            <FaSearch className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Cari"
                                className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-gray-400 text-gray-700"
                            />
                        </div>
                        <span className="text-xs md:text-sm font-medium text-gray-500 hidden sm:block">
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <div className="h-9 w-9 rounded-full border border-[#e4dbc9] bg-white flex items-center justify-center text-xs font-semibold text-[#7d6a45]">
                            AD
                        </div>
                    </div>
                </div>
            </header>

            <div className="pt-16 flex min-h-[calc(100vh-4rem)]">
                <aside className={cn(
                    "fixed top-16 bottom-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out border-r border-[#e7dfd0] bg-[#fbfaf6] lg:static lg:translate-x-0 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium border",
                                    isActive(item.path)
                                        ? "bg-[#e9efff] text-[#1f3f73] border-[#cfdcf8] shadow-sm"
                                        : "bg-transparent text-slate-600 border-transparent hover:text-[#1f3f73] hover:bg-[#f1f4fb] hover:border-[#dce5f7]"
                                )}
                            >
                                <span className={cn("text-base", isActive(item.path) ? "text-[#1f3f73]" : "text-slate-400")}>{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-[#e7dfd0]">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-sm font-medium w-full border border-transparent hover:border-red-100"
                        >
                            <FaSignOutAlt /> Log out
                        </button>
                    </div>
                </aside>

                <main className="flex-1 min-w-0 px-4 md:px-8 py-6">
                    <Outlet />
                </main>
            </div>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
