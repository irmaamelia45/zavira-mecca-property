import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBuilding, FaTags, FaClipboardList, FaSignOutAlt, FaBars, FaTimes, FaSearch, FaHandHoldingUsd, FaUserTie, FaUserShield, FaChevronUp, FaLock, FaWhatsapp } from 'react-icons/fa';
import { FiUser } from 'react-icons/fi';
import { cn } from '../../lib/utils';
import logoPt from '../../assets/logo_pt.png';
import { apiFetch } from '../../lib/api';
import { authHeaders, clearAuth, getStoredUser, getUserRole, isLoggedIn } from '../../lib/auth';

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
            { name: 'Riwayat WA', path: '/admin/whatsapp-logs', icon: <FaWhatsapp /> },
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
            { name: 'Akun Marketing', path: '/admin/marketing-users', icon: <FaUserTie /> },
            { name: 'Akun Admin', path: '/admin/admin-users', icon: <FaUserShield />, roles: ['superadmin'] },
        ],
    },
];

export default function AdminLayout() {
    const currentRole = getUserRole();
    const currentUser = getStoredUser();
    const profileLabel = currentUser?.nama || (currentRole === 'superadmin' ? 'Superadmin' : 'Admin');
    const visibleMenuSections = React.useMemo(() => MENU_SECTIONS, []);

    const [sidebarOpen, setSidebarOpen] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    ));
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

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        try {
            await apiFetch('/auth/logout', {
                method: 'POST',
                headers: authHeaders(),
            });
        } catch {
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
        const activeSection = visibleMenuSections.find((section) => (
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
    }, [location.pathname, visibleMenuSections]);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const toggleSection = (title) => {
        setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    const isProfileActive = location.pathname.startsWith('/admin/profile') || location.pathname.startsWith('/admin/profil');

    return (
        <div className="admin-ui min-h-screen bg-[#f8f7f3] font-serif text-slate-800">
            <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[#e7dfd0] bg-[#fdfcf9]/95 backdrop-blur-sm">
                <div className="h-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                        </button>
                        <Link to="/admin" className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <img src={logoPt} alt="Zavira Mecca Property" className="h-9 object-contain" />
                            <span className="hidden sm:block text-sm md:text-base font-bold tracking-tight text-[#7d6a45] leading-tight truncate">
                                Zavira Mecca Property
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 shrink-0">
                        <div className="hidden md:flex items-center rounded-xl border border-[#e4dbc9] bg-white px-3 py-2 w-52 lg:w-64">
                            <FaSearch className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Cari"
                                className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-gray-400 text-gray-700"
                            />
                        </div>
                        <span className="hidden md:inline-flex rounded-full border border-[#e4dbc9] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase text-[#7d6a45]">
                            {currentRole || 'admin'}
                        </span>
                        <span className="text-xs md:text-sm font-medium text-gray-500 hidden sm:block">
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <Link
                            to="/admin/profile"
                            className={cn(
                                "hidden sm:inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors max-w-[190px]",
                                isProfileActive
                                    ? "border-[#9aa9cb] bg-[#e4eaf6] text-[#334155]"
                                    : "border-[#e4dbc9] bg-white text-[#7d6a45] hover:bg-[#f7f3ea]"
                            )}
                            title="Profil Akun"
                            aria-label="Profil Akun"
                        >
                            <FiUser className="text-[16px] shrink-0" />
                            <span className="truncate">{profileLabel}</span>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="pt-16 flex min-h-[calc(100vh-4rem)]">
                <aside className={cn(
                    "fixed top-16 bottom-0 left-0 z-40 w-[85vw] max-w-72 transform transition-transform duration-300 ease-in-out border-r border-[#e7dfd0] bg-[#fbfaf6] lg:static lg:translate-x-0 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 lg:w-72 flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <nav className="p-3 sm:p-4 pt-4 sm:pt-5 flex-1 overflow-y-auto space-y-5">
                        {visibleMenuSections.map((section) => (
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
                                        (() => {
                                            const isLockedItem = Array.isArray(item.roles) && !item.roles.includes(currentRole);
                                            return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => {
                                                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                                    setSidebarOpen(false);
                                                }
                                            }}
                                            className={cn(
                                                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 font-medium border border-transparent",
                                                isActive(item.path)
                                                    ? "bg-gradient-to-r from-[#bcc7df] to-[#aebad6] text-[#334155] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                                                    : isLockedItem
                                                        ? "bg-transparent text-slate-500 hover:bg-[#f1ece1]"
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
                                            {isLockedItem && (
                                                <span
                                                    className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700"
                                                    title="Hanya superadmin yang dapat mengakses fitur ini."
                                                    aria-label="Hanya superadmin yang dapat mengakses fitur ini."
                                                >
                                                    <FaLock className="text-[10px]" />
                                                </span>
                                            )}
                                        </Link>
                                            );
                                        })()
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

                <main className="flex-1 min-w-0 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
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
