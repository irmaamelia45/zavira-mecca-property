import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiClipboard,
    FiFileText,
    FiHome,
    FiLayers,
    FiMessageCircle,
    FiPercent,
    FiShield,
    FiTrendingUp
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import bgPage from '../assets/bg_page.jpg';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const infoCards = [
    {
        id: 'informasi',
        title: 'Informasi KPR',
        headline: 'Pahami skema pembiayaan rumah secara ringkas.',
        desc: 'Ringkasan komponen biaya, tenor, dan bunga agar pengajuan lebih terarah.',
        icon: FiLayers,
        entries: [
            {
                id: 'local-informasi',
                judul: 'Pengertian KPR',
                konten: `Kredit Pemilikan Rumah (KPR) adalah fasilitas pembiayaan yang diberikan oleh bank kepada nasabah untuk membeli rumah atau properti dengan sistem pembayaran secara cicilan dalam jangka waktu tertentu.

Dalam skema ini, bank membiayai sebagian besar harga rumah, sementara nasabah membayar uang muka (down payment) dan melunasi sisanya melalui angsuran bulanan sesuai jangka waktu kredit yang disepakati.

KPR biasanya digunakan untuk pembelian:
- Rumah baru dari developer
- Rumah bekas (secondary)
- Apartemen
- Ruko atau rukan

Selain untuk pembelian rumah, beberapa program KPR juga dapat digunakan untuk renovasi rumah, pembangunan rumah, atau take over kredit dari bank lain.`
            }
        ]
    },
    {
        id: 'syarat',
        title: 'Syarat Pengajuan',
        headline: 'Pastikan dokumen siap sebelum proses dimulai.',
        desc: 'Checklist dokumen utama agar verifikasi bank lebih cepat.',
        icon: FiFileText,
        entries: [
            {
                id: 'local-syarat',
                judul: 'Syarat Pengajuan KPR',
                konten: `Secara umum, bank memiliki beberapa persyaratan yang harus dipenuhi oleh calon debitur sebelum mengajukan KPR.

Syarat umum:
- Warga Negara Indonesia (WNI).
- Berusia minimal 21 tahun atau sudah menikah.
- Memiliki pekerjaan atau penghasilan tetap.
- Usia maksimal saat kredit lunas biasanya 55–65 tahun (tergantung bank).
- Memiliki kemampuan membayar cicilan sesuai analisis bank.

Dokumen yang biasanya diperlukan:
- Fotokopi KTP suami/istri
- Kartu Keluarga (KK)
- NPWP
- Slip gaji atau surat keterangan penghasilan
- Rekening koran/tabungan beberapa bulan terakhir
- Surat keterangan kerja (untuk karyawan)
- Dokumen usaha (untuk wirausaha atau profesional)`
            }
        ]
    },
    {
        id: 'alur',
        title: 'Alur Pengajuan',
        headline: 'Tahapan jelas dari konsultasi sampai akad.',
        desc: 'Panduan proses untuk memastikan Anda tahu setiap langkah.',
        icon: FiClipboard,
        entries: [
            {
                id: 'local-alur',
                judul: 'Alur Pengajuan KPR',
                konten: `Proses pengajuan KPR umumnya melalui beberapa tahap berikut:

1. Pemilihan Properti
Calon pembeli memilih rumah atau properti yang akan dibeli, baik dari developer maupun pemilik rumah.

2. Pengajuan Permohonan Kredit
Calon debitur mengajukan permohonan KPR ke bank dengan mengisi formulir dan melengkapi dokumen yang diminta.

3. Verifikasi dan Analisis Kredit
Bank akan melakukan pemeriksaan terhadap:
- kelengkapan dokumen
- riwayat kredit calon debitur
- kemampuan finansial untuk membayar cicilan

Analisis 5C: Character (karakter peminjam), Capacity (kemampuan membayar), Capital (kondisi keuangan), Collateral (jaminan), Condition of Economy (kondisi ekonomi).

4. Persetujuan Kredit
Jika hasil analisis menunjukkan calon debitur layak menerima kredit, bank akan memberikan persetujuan KPR beserta jumlah kredit, bunga, dan jangka waktu pinjaman.

5. Penandatanganan Akad Kredit
Nasabah dan pihak bank menandatangani perjanjian kredit (akad) yang biasanya dilakukan di hadapan notaris.

6. Pencairan Kredit
Setelah akad selesai, bank mencairkan dana kepada penjual atau developer, dan nasabah mulai melakukan pembayaran cicilan setiap bulan sesuai perjanjian.`
            }
        ]
    }
];

const kprSteps = [
    { title: 'Konsultasi Awal', desc: 'Diskusikan kebutuhan dan target hunian.', icon: FiMessageCircle },
    { title: 'Pilih Perumahan', desc: 'Tentukan lokasi dan tipe rumah sesuai anggaran.', icon: FiHome },
    { title: 'Simulasi Cicilan', desc: 'Sesuaikan tenor dan DP untuk cicilan ideal.', icon: FiPercent },
    { title: 'Verifikasi Bank', desc: 'Proses analisis dan survey oleh bank.', icon: FiShield },
    { title: 'Akad & Serah Terima', desc: 'Tanda tangan akad dan jadwal serah terima.', icon: FiTrendingUp }
];

export default function KprInfo() {
    const [activeCard, setActiveCard] = useState(infoCards[0].id);
    const [remoteItems, setRemoteItems] = useState([]);
    const [remoteError, setRemoteError] = useState('');

    useEffect(() => {
        const fetchKprContent = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/kpr-contents`);
                if (!response.ok) {
                    throw new Error('Gagal memuat konten KPR.');
                }
                const data = await response.json();
                setRemoteItems(data || []);
            } catch (err) {
                setRemoteError(err.message || 'Gagal memuat konten KPR.');
            }
        };

        fetchKprContent();
    }, []);

    const cardsWithContent = useMemo(() => {
        const grouped = {
            informasi: [],
            syarat: [],
            alur: []
        };

        remoteItems.forEach((item) => {
            if (grouped[item.jenis_konten]) {
                grouped[item.jenis_konten].push(item);
            }
        });

        return infoCards.map((card) => ({
            ...card,
            entries: grouped[card.id]?.length ? grouped[card.id] : card.entries
        }));
    }, [remoteItems]);

    const activeDetail = useMemo(
        () => cardsWithContent.find((item) => item.id === activeCard) || cardsWithContent[0],
        [activeCard, cardsWithContent]
    );

    return (
        <div className="pb-20 space-y-16">
            <section className="relative min-h-[68vh] md:min-h-[580px] lg:min-h-[680px] flex items-center justify-start text-white overflow-hidden py-12 md:py-16 lg:py-20">
                <div className="absolute inset-0 bg-gradient-to-r from-[#10214b]/95 via-[#10214b]/70 to-black/30 z-10" />

                <img
                    src={bgPage}
                    alt="Hero Informasi KPR"
                    className="absolute inset-0 w-full h-full object-cover object-center animate-in fade-in zoom-in duration-1000"
                />

                <div className="relative z-20 text-left w-full mt-4 md:mt-10 lg:mt-12 px-5 md:px-10 lg:px-16 xl:px-20">
                    <div className="max-w-4xl flex flex-col items-start">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/80 mb-4">
                            Informasi KPR
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.2] md:leading-[1.1] text-white animate-in slide-in-from-bottom-8 duration-700 delay-100 drop-shadow-xl mb-4">
                            KPR lebih mudah, terukur,
                            <span className="block">dan siap diajukan.</span>
                        </h1>

                        <p className="text-sm md:text-base lg:text-lg text-gray-200 leading-relaxed max-w-xl animate-in slide-in-from-bottom-8 duration-700 delay-200 drop-shadow-lg font-light mb-6 md:mb-8">
                            Dapatkan panduan lengkap mulai dari syarat, simulasi cicilan, hingga alur pengajuan yang jelas. Semua dirancang agar keputusan Anda lebih percaya diri.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-in slide-in-from-bottom-8 duration-700 delay-300">
                            <Link to="/perumahan" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto px-6 py-2.5 md:py-3 text-sm md:text-base font-semibold shadow-xl shadow-black/30 transform hover:-translate-y-1 hover:shadow-2xl hover:bg-primary-600 transition-all duration-300">
                                    Mulai Simulasi
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-custom space-y-16">
                <section className="space-y-8">
                <div className="text-center space-y-2">
                    <p className="text-xs uppercase tracking-[0.28em] text-secondary-700">Ringkasan</p>
                    <h2 className="text-3xl md:text-4xl font-serif font-semibold">Fokus pada tiga informasi utama</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cardsWithContent.map((card) => {
                        const Icon = card.icon;
                        const isActive = card.id === activeCard;
                        return (
                            <button
                                key={card.id}
                                type="button"
                                onClick={() => setActiveCard(card.id)}
                                className={`group w-full rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                                    isActive
                                        ? 'border-primary-500 bg-primary-50 shadow-md'
                                        : 'border-secondary-200 bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-secondary-700">Informasi</p>
                                        <h3 className="mt-2 text-lg font-semibold text-primary-900">{card.title}</h3>
                                    </div>
                                    <span
                                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                                            isActive
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-secondary-100 text-primary-700 group-hover:bg-secondary-200'
                                        }`}
                                    >
                                        <Icon className="text-xl" />
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-secondary-800 leading-relaxed">{card.desc}</p>
                            </button>
                        );
                    })}
                </div>
                </section>

                <section
                id="detail"
                className="rounded-[28px] bg-gradient-to-br from-secondary-50 via-white to-secondary-100 border border-secondary-200 p-6 md:p-10"
            >
                <div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6 w-full">
                        <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                                <activeDetail.icon className="text-2xl" />
                            </span>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-secondary-700">Konten</p>
                                <p className="text-lg font-semibold text-primary-900">Ringkasan detail</p>
                            </div>
                        </div>
                        {remoteError && (
                            <p className="text-sm text-amber-600">
                                {remoteError} Menampilkan konten default.
                            </p>
                        )}
                        <div className="space-y-4">
                            {activeDetail.entries?.length ? (
                                activeDetail.entries.map((entry) => (
                                    <div key={entry.id_kpr_info || entry.id || entry.judul} className="rounded-xl border border-secondary-200 bg-secondary-50/70 p-4">
                                        <h3 className="text-base font-semibold text-primary-900">{entry.judul}</h3>
                                        <p className="mt-3 text-sm text-secondary-800 leading-relaxed whitespace-pre-line">
                                            {entry.konten}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-secondary-700">Belum ada konten untuk kategori ini.</p>
                            )}
                        </div>
                    </div>
                </div>
                </section>

                <section
                id="simulasi"
                className="rounded-[28px] bg-gradient-to-br from-primary-50 via-white to-primary-100 border border-primary-200 p-6 md:p-10"
            >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 items-center">
                    <div className="space-y-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-secondary-700">Simulasi KPR</p>
                        <h2 className="text-3xl md:text-4xl font-serif font-semibold">
                            Mulai simulasi dan pilih perumahan yang tepat.
                        </h2>
                        <p className="text-sm text-secondary-800 leading-relaxed">
                            Simulasi KPR akan tampil lebih akurat jika Anda sudah memilih perumahan dan tipe unit.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/perumahan">
                                <Button size="md">Pilih Perumahan</Button>
                            </Link>
                            <a
                                href="#detail"
                                className="inline-flex items-center justify-center rounded-md border border-secondary-500 px-4 h-10 text-sm font-medium text-primary-900 transition-all duration-200 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            >
                                Lihat Detail KPR
                            </a>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {kprSteps.map((step) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.title}
                                    className="rounded-2xl border border-primary-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                                            <Icon className="text-lg" />
                                        </span>
                                        <h3 className="text-sm font-semibold text-primary-900">{step.title}</h3>
                                    </div>
                                    <p className="mt-3 text-xs text-secondary-700 leading-relaxed">{step.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                </section>

            </div>
        </div>
    );
}
