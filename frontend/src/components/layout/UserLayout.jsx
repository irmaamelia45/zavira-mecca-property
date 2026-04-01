import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

export default function UserLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-[#fdfbf6]">
            <Navbar />
            <main className="flex-grow pt-[72px]">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
