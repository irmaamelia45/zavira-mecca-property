import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import logoPt from '../../assets/logo_pt.png';
import { apiFetch } from '../../lib/api';
import { authHeaders, clearAuth, getStoredUser, isLoggedIn as hasToken } from '../../lib/auth';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('Pengguna');
    const [userRole, setUserRole] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const isUserPortalRole = userRole === 'user' || userRole === 'marketing';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const syncAuth = () => {
            const loggedIn = hasToken();
            setIsLoggedIn(loggedIn);
            const user = getStoredUser();
            setUserName(user?.nama || 'Pengguna');
            setUserRole(user?.role || '');
        };
        syncAuth();
    }, [location.pathname]);

    const navLinks = [
        { name: 'Beranda', path: '/' },
        { name: 'Perumahan', path: '/perumahan' },
        { name: 'Promo', path: '/promo' },
        { name: 'Informasi KPR', path: '/kpr' },
        { name: 'Profil Perusahaan', path: '/profil' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

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
        setIsLoggedIn(false);
        setUserName('Pengguna');
        setMobileMenuOpen(false);
        navigate('/auth/login');
    };

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
            isScrolled ? "bg-[#f8f2e6]/95 backdrop-blur-md shadow-sm border-secondary-200 py-3" : "bg-[#fdfbf6]/90 backdrop-blur-md py-3 sm:py-4 md:py-5"
        )}>
            <div className="container-custom flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 md:gap-3 group min-w-0">
                    <img
                        src={logoPt}
                        alt="Zavira Mecca Property"
                        className="h-9 md:h-10 w-auto object-contain shrink-0"
                        loading="eager"
                        decoding="async"
                    />
                    <span className="font-serif text-sm sm:text-base md:text-xl font-bold tracking-tight text-secondary-600 group-hover:text-secondary-700 transition-colors truncate">
                        Zavira Mecca Property
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6 xl:gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary-600",
                                isActive(link.path) ? "text-primary-600 font-bold" : "text-gray-600"
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}
                    {!isLoggedIn ? (
                        <div className="flex items-center gap-3">
                            <Link to="/auth/login">
                                <Button variant="primary" size="sm" className="px-6">Masuk</Button>
                            </Link>
                            <Link to="/auth/register">
                                <Button variant="outline" size="sm" className="px-6">Daftar</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to={isUserPortalRole ? '/akun' : '/admin'}
                                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-primary-200 hover:text-primary-700 transition-colors"
                            >
                                <FiUser className="text-primary-600" />
                                <span className="max-w-[120px] truncate">{userName}</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                title="Keluar"
                            >
                                <FiLogOut /> Keluar
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-gray-700 rounded-lg border border-secondary-200 bg-white/90"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
                >
                    {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg p-4 flex max-h-[calc(100vh-4.75rem)] overflow-y-auto flex-col gap-4 animate-in slide-in-from-top-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className="text-base font-medium text-gray-700 hover:text-primary-600 p-2 border-b border-gray-50 last:border-0"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    {!isLoggedIn ? (
                        <div className="flex flex-col gap-3">
                            <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full">Masuk</Button>
                            </Link>
                            <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="outline" className="w-full">Daftar</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {isUserPortalRole ? (
                                <>
                                    <Link to="/akun" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-700 hover:text-primary-600 p-2 border-b border-gray-50">
                                        {userRole === 'marketing' ? 'Dashboard Marketing' : 'Dashboard Akun'}
                                    </Link>
                                    <Link to="/akun/booking" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-700 hover:text-primary-600 p-2 border-b border-gray-50">
                                        Riwayat Booking
                                    </Link>
                                    <Link to="/akun/favorit" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-700 hover:text-primary-600 p-2 border-b border-gray-50">
                                        Perumahan Favorit
                                    </Link>
                                    <Link to="/akun/profil" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-700 hover:text-primary-600 p-2 border-b border-gray-50">
                                        Profil User
                                    </Link>
                                </>
                            ) : (
                                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-700 hover:text-primary-600 p-2 border-b border-gray-50">
                                    Dashboard Admin
                                </Link>
                            )}
                            <button onClick={handleLogout} className="text-left text-base font-medium text-red-600 hover:text-red-700 p-2">
                                Keluar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
