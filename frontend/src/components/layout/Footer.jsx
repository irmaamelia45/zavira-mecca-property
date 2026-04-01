import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiPhone, FiMail, FiMapPin, FiHome } from 'react-icons/fi';

export default function Footer() {
    return (
        <footer className="bg-[#10214b] text-white pt-10 md:pt-12 pb-8">
            <div className="container-custom grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <h3 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-primary-500"><FiHome /></span> Zavira Mecca
                    </h3>
                    <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
                        Wujudkan hunian impian Anda bersama kami. Kami menyediakan hunian nyaman, amanah, dan terpercaya dengan proses yang mudah dan transparan.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#10214b] border border-secondary-500 rounded-md hover:bg-secondary-500 hover:text-[#10214b] transition-all duration-300" aria-label="Facebook">
                            <FiFacebook />
                        </a>
                        <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#10214b] border border-secondary-500 rounded-md hover:bg-secondary-500 hover:text-[#10214b] transition-all duration-300" aria-label="Instagram">
                            <FiInstagram />
                        </a>
                        <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#10214b] border border-secondary-500 rounded-md hover:bg-secondary-500 hover:text-[#10214b] transition-all duration-300" aria-label="WhatsApp">
                            <FiPhone />
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-4 text-white">Navigasi</h4>
                    <ul className="space-y-3 text-gray-400">
                        <li><Link to="/" className="hover:text-primary-400 transition-colors flex items-center gap-2">Beranda</Link></li>
                        <li><Link to="/perumahan" className="hover:text-primary-400 transition-colors flex items-center gap-2">Perumahan</Link></li>
                        <li><Link to="/promo" className="hover:text-primary-400 transition-colors flex items-center gap-2">Promo</Link></li>
                        <li><Link to="/kpr" className="hover:text-primary-400 transition-colors flex items-center gap-2">Informasi KPR</Link></li>
                        <li><Link to="/profil" className="hover:text-primary-400 transition-colors flex items-center gap-2">Profil Perusahaan</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-4 text-white">Hubungi Kami</h4>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex gap-3 items-start">
                            <span className="mt-1 text-primary-500"><FiMapPin /></span>
                            <span>Jl. Raja Ratu, Labuhan Ratu, Kec. Kedaton, Kota Bandar Lampung</span>
                        </li>
                        <li className="flex gap-3 items-center">
                            <span className="text-primary-500"><FiMail /></span>
                            <span>zaviramecca@gmail.com</span>
                        </li>
                        <li className="flex gap-3 items-center">
                            <span className="text-primary-500"><FiPhone /></span>
                            <span>+62 822-8009-0324</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="container-custom pt-8 border-t border-gray-800 text-center text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Zavira Mecca Property. All rights reserved.
            </div>
        </footer>
    );
}
