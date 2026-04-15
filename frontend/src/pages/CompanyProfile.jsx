import React, { useEffect, useMemo, useState } from 'react';
import { FaAward, FaRegBuilding, FaUsers, FaCompass, FaBullseye } from 'react-icons/fa';
import { Card, CardContent } from '../components/ui/Card';
import logo from '../assets/logo_pt.png';
import { fetchJsonWithFallback, resolveImage as resolveApiImage } from '../utils/promo';

const defaultProfile = {
    nama_perusahaan: '',
    deskripsi: '',
    visi: '',
    misi: '',
    penghargaan: [],
    struktur_organisasi: []
};

export default function CompanyProfile() {
    const [profile, setProfile] = useState(defaultProfile);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await fetchJsonWithFallback('/api/company-profile');
                if (data) {
                    setProfile((prev) => ({
                        ...prev,
                        ...data
                    }));
                }
            } catch (err) {
                setError(err.message || 'Gagal memuat profil perusahaan.');
            }
        };

        fetchProfile();
    }, []);

    const resolveImage = (path) => {
        if (!path) return '';
        return resolveApiImage(path);
    };

    const missionItems = useMemo(() => {
        if (!profile.misi) {
            return [];
        }
        return profile.misi
            .split('\n')
            .map((item) => item.replace(/^-\s*/, '').trim())
            .filter(Boolean);
    }, [profile.misi]);

    const awards = profile.penghargaan || [];
    const organization = profile.struktur_organisasi || [];

    return (
        <div className="space-y-0 pb-20">
            <section className="bg-[#fdfbf6] pt-16 pb-16 border-b border-secondary-100">
                <div className="container-custom">
                    <div className="flex flex-col items-center text-center gap-5">
                        <div className="h-32 w-32 md:h-36 md:w-36 rounded-3xl bg-white shadow-sm border border-secondary-100 flex items-center justify-center overflow-hidden">
                            <img
                                src={profile.logo_path ? resolveImage(profile.logo_path) : logo}
                                alt="Zavira Mecca Property"
                                className="h-full w-full object-contain p-4 transition-transform duration-300 hover:scale-105"
                            />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-primary-900">
                            {profile.nama_perusahaan || 'Nama Perusahaan'}
                        </h1>
                        <p className="text-sm md:text-base text-secondary-800 max-w-2xl leading-relaxed whitespace-pre-line">
                            {profile.deskripsi || 'Deskripsi perusahaan belum ditambahkan.'}
                        </p>
                        {error && (
                            <p className="text-xs text-amber-600">
                                {error} Menampilkan data default.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-[#fdfbf6] py-16 border-b border-secondary-100">
                <div className="container-custom space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm">
                            <FaAward />
                        </span>
                        <h2 className="text-xl font-semibold text-primary-900">Penghargaan</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {awards.length ? (
                            awards.map((award) => (
                                <Card
                                    key={award.title || award.desc}
                                    className="border border-secondary-200 shadow-sm bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] min-h-[140px]">
                                            <div className="flex items-center justify-center bg-secondary-100 overflow-hidden">
                                                {award.image ? (
                                                    <img
                                                        src={resolveImage(award.image)}
                                                        alt={award.title || 'Penghargaan'}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sm text-secondary-700">Foto</span>
                                                )}
                                            </div>
                                            <div className="p-6 bg-gradient-to-br from-white via-secondary-50 to-secondary-100 text-secondary-900">
                                                <h3 className="text-base md:text-lg font-semibold text-primary-900">
                                                    {award.title || 'Judul Penghargaan'}
                                                </h3>
                                                <p className="mt-2 text-sm text-secondary-700 leading-relaxed">
                                                    {award.desc || 'Deskripsi'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <p className="text-sm text-secondary-600">Belum ada data penghargaan.</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="container-custom py-16 border-b border-secondary-100">
                <div className="flex flex-col gap-6">
                    <div className="rounded-[28px] bg-white border border-gray-200 p-6 md:p-10 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 shadow-sm">
                                <FaCompass />
                            </span>
                            <h2 className="text-xl font-semibold text-primary-900">Visi</h2>
                        </div>
                        <p className="text-sm md:text-base text-secondary-800 leading-relaxed">
                            {profile.visi || 'Visi belum ditambahkan.'}
                        </p>
                    </div>
                    <div className="rounded-[28px] bg-primary-900 text-white p-6 md:p-10 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white shadow-sm">
                                <FaBullseye />
                            </span>
                            <h2 className="text-xl font-semibold text-white">Misi</h2>
                        </div>
                        <ul className="space-y-3 text-sm md:text-base text-white/85 leading-relaxed">
                            {missionItems.length ? missionItems.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-2.5 h-2 w-2 rounded-full bg-secondary-300 flex-shrink-0" />
                                    <span className="text-white/90">{item}</span>
                                </li>
                            )) : (
                                <li className="text-white/80">Belum ada misi yang ditambahkan.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="bg-[#fdfbf6] py-16">
                <div className="container-custom space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm">
                            <FaUsers />
                        </span>
                        <h2 className="text-xl font-semibold text-primary-900">Struktur Organisasi</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {organization.length ? (
                            organization.map((person) => (
                                <Card
                                    key={person.name || person.role}
                                    className="group border border-slate-200 shadow-md bg-white rounded-[30px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <CardContent className="p-0">
                                        <div className="flex h-full flex-col">
                                            <div className="aspect-[4/3] bg-stone-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                                                {person.image ? (
                                                    <img
                                                        src={resolveImage(person.image)}
                                                        alt={person.name || 'Struktur'}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <span className="text-sm text-slate-500">Foto</span>
                                                )}
                                            </div>
                                            <div className="bg-primary-900 px-5 py-4 text-center text-white">
                                                <p className="text-base md:text-lg font-semibold tracking-wide">
                                                    {person.name || 'Nama'}
                                                </p>
                                                <p className="text-xs md:text-sm text-slate-200">
                                                    {person.role || 'Jabatan'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <p className="text-sm text-secondary-600">Belum ada data struktur organisasi.</p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
