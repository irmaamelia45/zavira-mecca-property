import React from 'react';
import { FiArrowUpRight, FiLock, FiShield } from 'react-icons/fi';
import logoProperty from '../../assets/logo_pt.png';
import pageBackground from '../../assets/bg_page.jpg';

const externalAccessButtons = [
    {
        label: 'Login Internal',
        helper: 'Sistem internal',
        status: 'Segera hadir',
        icon: FiLock,
    },
    {
        label: 'Login Superadmin',
        helper: 'Portal terpisah',
        status: 'Segera hadir',
        icon: FiShield,
    },
];

function BrandPanel({ title, description, className = '' }) {
    return (
        <div className={`relative flex min-h-[15rem] flex-col justify-between overflow-hidden bg-primary-900 text-white ${className}`}>
            <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${pageBackground})` }}
                aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(16,33,75,0.96)_0%,rgba(47,73,127,0.9)_100%)]" aria-hidden="true" />
            <div className="absolute -left-16 top-10 h-40 w-40 rounded-full border border-white/10 bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-[-3rem] left-8 h-28 w-28 rounded-full border border-secondary-300/25 bg-secondary-300/12 blur-2xl" aria-hidden="true" />

            <div className="relative flex h-full flex-col px-6 py-7 sm:px-8 sm:py-8 lg:px-12 lg:py-11">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/14 bg-white/12 p-2.5 backdrop-blur-sm">
                        <img src={logoProperty} alt="Zavira Mecca Property" className="h-full w-full object-contain" />
                    </div>
                    <div>
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-secondary-200">
                            Zavira Mecca Property
                        </p>
                        <p className="mt-1 text-sm text-primary-50/78">
                            Portal pemasaran perumahan
                        </p>
                    </div>
                </div>

                <div className="mt-8 max-w-md lg:mt-12">
                    <h1 className="text-3xl font-semibold leading-tight text-white sm:text-[2.3rem]">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-primary-50/80 sm:text-base">
                        {description}
                    </p>
                </div>

                <div className="mt-8 grid gap-3 sm:max-w-md sm:grid-cols-2">
                    {externalAccessButtons.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.label}
                                type="button"
                                className="group relative overflow-hidden rounded-2xl border border-white/18 bg-white/10 px-4 py-4 text-left text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/28 hover:bg-white/14"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0))]" aria-hidden="true" />
                                <div className="relative flex items-start justify-between gap-3">
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/14 bg-white/12 text-secondary-200">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-primary-100/80">
                                        {item.status}
                                    </span>
                                </div>
                                <div className="relative mt-5">
                                    <span className="block text-sm font-semibold tracking-[0.01em] text-white">
                                        {item.label}
                                    </span>
                                    <span className="mt-2 block text-sm text-primary-50/72">
                                        {item.helper}
                                    </span>
                                </div>
                                <div className="relative mt-5 flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-secondary-200">
                                    <span>Placeholder</span>
                                    <FiArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <p className="mt-6 max-w-sm text-xs leading-6 text-primary-100/68 lg:mt-auto lg:pt-10">
                    Tombol akses internal dan superadmin akan diarahkan ke sistem terpisah pada tahap berikutnya.
                </p>
            </div>
        </div>
    );
}

export default function AuthSplitLayout({
    title,
    description,
    panelTitle,
    panelDescription,
    children,
}) {
    return (
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f1e7_0%,#ffffff_42%,#f3eee5_100%)] py-8 sm:py-10 lg:py-12">
            <div className="absolute inset-0 opacity-40" aria-hidden="true">
                <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-secondary-200 blur-3xl" />
                <div className="absolute bottom-12 right-0 h-72 w-72 rounded-full bg-primary-100 blur-3xl" />
            </div>

            <div className="container-custom relative">
                <div className="mx-auto max-w-6xl overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-[0_30px_90px_-38px_rgba(16,33,75,0.35)] backdrop-blur-sm">
                    <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
                        <aside className="hidden lg:block">
                            <BrandPanel title={panelTitle} description={panelDescription} className="min-h-full" />
                        </aside>

                        <main className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,237,0.96)_100%)]">
                            <div className="lg:hidden">
                                <BrandPanel title={panelTitle} description={panelDescription} />
                            </div>

                            <div className="px-5 py-8 sm:px-8 sm:py-9 md:px-10 lg:px-12 lg:py-12 xl:px-14">
                                <div className="mx-auto w-full max-w-xl">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">
                                            Zavira Mecca Property
                                        </p>
                                        <h2 className="mt-4 text-3xl font-semibold leading-tight text-primary-900 sm:text-4xl">
                                            {title}
                                        </h2>
                                        <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
                                            {description}
                                        </p>
                                    </div>

                                    <div className="mt-8">
                                        {children}
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </section>
    );
}
