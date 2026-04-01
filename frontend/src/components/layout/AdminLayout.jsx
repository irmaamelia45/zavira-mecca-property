import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBuilding, FaTags, FaClipboardList, FaSignOutAlt, FaBars, FaTimes, FaSearch, FaHandHoldingUsd, FaUserTie, FaChevronUp } from 'react-icons/fa';
import { cn } from '../../lib/utils';
import logoPt from '../../assets/logo_pt.png';
import { API_BASE } from '../../utils/promo';
import { authHeaders, clearAuth, getUserRole, isLoggedIn } from '../../lib/auth';

const MENU_SECTIONS = [
    {
        title: 'Dashboard',
        items: [
            { name: 'Dashboard', path: '/admin', icon: <FaHome /> },
        ],
    },
    {
        title: 'Manajemen Pemasaran',
        items: [
            { name: 'Perumahan', path: '/admin/properties', icon: <FaBuilding /> },
            { name: 'Promo', path: '/admin/promos', icon: <FaTags /> },
            { name: 'Booking', path: '/admin/bookings', icon: <FaClipboardList /> },
        ],
    },
    {
        title: 'Manajemen Informasi dan Layanan',
        items: [
            { name: 'Profil Perusahaan', path: '/admin/company-profile', icon: <FaBuilding /> },
            { name: 'Kelola KPR', path: '/admin/kpr', icon: <FaHandHoldingUsd /> },
            { name: 'Template Surat', path: '/admin/templates', icon: <FaClipboardList /> },
        ],
    },
    {
        title: 'Manajemen Pengguna',
        items: [
            { name: 'Akun Internal', path: '/admin/marketing-users', icon: <FaUserTie /> },
        ],
    },
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [openSections, setOpenSections] = useState(() => (
        Object.fromEntries(MENU_SECTIONS.map((section) => [section.title, true]))
    ));

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

    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        if (path !== '/admin' && location.pathname.startsWith(path)) return true;
        return false;
    };

    React.useEffect(() => {
        const activeSection = MENU_SECTIONS.find((section) => (
            section.items.some((item) => (
                item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path)
            ))
        ));

        if (!activeSection) return;
        setOpenSections((prev) => (
            prev[activeSection.title] ? prev : { ...prev, [activeSection.title]: true }
        ));
    }, [location.pathname]);

    const toggleSection = (title) => {
        setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
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
                    <nav className="p-4 pt-5 flex-1 overflow-y-auto space-y-5">
                        {MENU_SECTIONS.map((section) => (
                            <div key={section.title}>
                                {section.title !== 'Dashboard' && (
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(section.title)}
                                        className="w-full px-2 mb-2 flex items-center justify-between gap-2"
                                    >
                                        <p className="w-full text-left text-[15px] font-semibold text-slate-600 tracking-tight leading-6">
                                            {section.title}
                                        </p>
                                        <FaChevronUp
                                            className={cn(
                                                "shrink-0 text-[11px] text-slate-400 transition-transform duration-200",
                                                openSections[section.title] ? "rotate-0" : "rotate-180"
                                            )}
                                        />
                                    </button>
                                )}
                                <div
                                    className={cn(
                                        "space-y-0.5 overflow-hidden transition-all duration-200",
                                        openSections[section.title] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                    )}
                                >
                                    {section.items.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 font-medium border border-transparent",
                                                isActive(item.path)
                                                    ? "bg-gradient-to-r from-[#bcc7df] to-[#aebad6] text-[#334155] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                                                    : "bg-transparent text-slate-600 hover:text-slate-700 hover:bg-[#ece7dc]"
                                            )}
                                        >
                                            <span className={cn(
                                                "flex h-5 w-5 shrink-0 items-center justify-center text-[15px]",
                                                isActive(item.path) ? "text-slate-700" : "text-slate-400 group-hover:text-slate-500"
                                            )}
                                            >
                                                {item.icon}
                                            </span>
                                            <span className="text-[15px] leading-5">{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
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
