import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PromoCard from '../components/ui/PromoCard';
import { FiMapPin, FiHome, FiDroplet, FiShield, FiFileText, FiUsers, FiTrendingUp, FiCheckCircle, FiCalendar, FiPhoneCall, FiArrowUpRight, FiAward, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import bgPage from '../assets/bg_page.jpg';
import { API_BASE, mapPromoFromApi, getPromoPricing as calculatePromoPricing, isPromoActive, resolveImage } from '../utils/promo';

const INSIGHT_DUMMY_IMAGES = [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=900&q=80',
];

const normalizeListPayload = (payload) => {
    const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : [];

    return list.filter((item) => item && typeof item === 'object');
};

const getCategoryCount = (items, categoryKey) => {
    if (categoryKey === 'all') return items.length;
    return items.filter((prop) => prop?.category === categoryKey).length;
};
const getCategoryItems = (items, categoryKey) => {
    if (categoryKey === 'all') return items;
    return items.filter((prop) => prop?.category === categoryKey);
};
const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};
const asString = (value, fallback = '') => {
    if (typeof value === 'string') return value;
    if (value == null) return fallback;
    return String(value);
};
const getPropertyCategoryLabel = (category) => {
    const key = asString(category).toLowerCase();
    if (key === 'subsidi') return 'Perumahan Subsidi';
    if (key === 'komersil') return 'Perumahan Komersil';
    if (key === 'townhouse') return 'Townhouse';
    return 'Kategori Lainnya';
};

export default function Home() {
    const [properties, setProperties] = useState([]);
    const [propertyLoading, setPropertyLoading] = useState(true);
    const [propertyError, setPropertyError] = useState('');
    const [companyWhatsapp, setCompanyWhatsapp] = useState('');

    const [promos, setPromos] = useState([]);
    const [promoError, setPromoError] = useState('');

    const [activeCategory, setActiveCategory] = useState('all');
    const [categorySearch, setCategorySearch] = useState('');
    const [categorySlideIndex, setCategorySlideIndex] = useState(0);
    const [displayedCategoryProperty, setDisplayedCategoryProperty] = useState(null);
    const [isCategoryTransitioning, setIsCategoryTransitioning] = useState(false);

    const formatMoney = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val) => new Intl.NumberFormat('id-ID').format(val || 0);

    useEffect(() => {
        const fetchProperties = async () => {
            setPropertyLoading(true);
            setPropertyError('');
            try {
                const response = await fetch(`${API_BASE}/api/perumahan`);
                if (!response.ok) {
                    throw new Error('Gagal memuat daftar perumahan.');
                }
                const data = await response.json();
                setProperties(normalizeListPayload(data));
            } catch (err) {
                setPropertyError(err.message || 'Gagal memuat daftar perumahan.');
                setProperties([]);
            } finally {
                setPropertyLoading(false);
            }
        };

        fetchProperties();
    }, []);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/promos`);
                if (!response.ok) {
                    throw new Error('Gagal memuat promo.');
                }
                const data = await response.json();
                setPromos(normalizeListPayload(data).map(mapPromoFromApi));
            } catch (err) {
                setPromoError(err.message || 'Gagal memuat promo.');
                setPromos([]);
            }
        };

        fetchPromos();
    }, []);

    useEffect(() => {
        const fetchCompanyProfile = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/company-profile`);
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                setCompanyWhatsapp(data?.whatsapp || '');
            } catch {
                // Silent fail, consultation button will be disabled.
            }
        };

        fetchCompanyProfile();
    }, []);

    const activePromos = useMemo(() => promos.filter((promo) => isPromoActive(promo)), [promos]);

    const categories = useMemo(() => ([
        {
            key: 'all',
            title: 'Semua Kategori',
            description: 'Lihat semua pilihan perumahan',
            count: getCategoryCount(properties, 'all'),
            icon: FiHome,
            accent: 'bg-slate-50 text-slate-700 border-slate-200'
        },
        {
            key: 'subsidi',
            title: 'Perumahan Subsidi',
            description: 'Harga terjangkau, akses mudah',
            count: getCategoryCount(properties, 'subsidi'),
            icon: FiHome,
            accent: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        {
            key: 'komersil',
            title: 'Perumahan Komersil',
            description: 'Fasilitas lengkap & premium',
            count: getCategoryCount(properties, 'komersil'),
            icon: FiShield,
            accent: 'bg-blue-50 text-blue-700 border-blue-200'
        },
        {
            key: 'townhouse',
            title: 'Townhouse',
            description: 'Eksklusif & privat',
            count: getCategoryCount(properties, 'townhouse'),
            icon: FiDroplet,
            accent: 'bg-amber-50 text-amber-700 border-amber-200'
        }
    ]), [properties]);

    useEffect(() => {
        const activeCategoryExists = categories.some((category) => category.key === activeCategory && category.count > 0);
        if (activeCategoryExists) {
            return;
        }

        const firstAvailableCategory = categories.find((category) => category.count > 0);
        if (firstAvailableCategory) {
            setActiveCategory(firstAvailableCategory.key);
        }
    }, [categories, activeCategory]);

    const activeCategoryDetail = useMemo(
        () => categories.find((category) => category.key === activeCategory) || categories[0] || null,
        [categories, activeCategory]
    );

    const activeCategoryItems = useMemo(
        () => getCategoryItems(properties, activeCategory),
        [properties, activeCategory]
    );

    const activeCategoryProperties = useMemo(() => {
        const query = categorySearch.trim().toLowerCase();
        if (!query) return activeCategoryItems;

        return activeCategoryItems.filter((item) => {
            const searchable = [
                asString(item?.name),
                asString(item?.location),
                asString(item?.type),
                asString(item?.status),
            ].join(' ').toLowerCase();

            return searchable.includes(query);
        });
    }, [activeCategoryItems, categorySearch]);

    useEffect(() => {
        setCategorySlideIndex(0);
    }, [activeCategory, categorySearch]);

    useEffect(() => {
        if (activeCategoryProperties.length <= 1) return undefined;
        const timer = setInterval(() => {
            setCategorySlideIndex((prev) => (prev + 1) % activeCategoryProperties.length);
        }, 7000);
        return () => clearInterval(timer);
    }, [activeCategoryProperties]);

    const activeCategoryProperty = useMemo(() => {
        if (activeCategoryProperties.length === 0) return null;
        return activeCategoryProperties[categorySlideIndex] || activeCategoryProperties[0];
    }, [activeCategoryProperties, categorySlideIndex]);

    useEffect(() => {
        if (!activeCategoryProperty) {
            setDisplayedCategoryProperty(null);
            return;
        }

        if (!displayedCategoryProperty) {
            setDisplayedCategoryProperty(activeCategoryProperty);
            return;
        }

        if (displayedCategoryProperty.id === activeCategoryProperty.id) {
            return;
        }

        setIsCategoryTransitioning(true);
        const timer = setTimeout(() => {
            setDisplayedCategoryProperty(activeCategoryProperty);
            setIsCategoryTransitioning(false);
        }, 420);

        return () => clearTimeout(timer);
    }, [activeCategoryProperty, displayedCategoryProperty]);

    const currentCategoryProperty = useMemo(
        () => displayedCategoryProperty || activeCategoryProperty,
        [displayedCategoryProperty, activeCategoryProperty]
    );

    const currentCategoryLabel = useMemo(() => {
        if (activeCategory === 'all') {
            return getPropertyCategoryLabel(currentCategoryProperty?.category);
        }
        return activeCategoryDetail?.title || 'Kategori';
    }, [activeCategory, activeCategoryDetail, currentCategoryProperty]);

    const activePropertyPricing = useMemo(() => {
        const basePrice = toNumber(currentCategoryProperty?.price);
        const promoPricing = currentCategoryProperty
            ? calculatePromoPricing(promos, currentCategoryProperty.id, basePrice)
            : { discount: 0, promo: null };

        return {
            basePrice,
            discount: promoPricing.discount || 0,
            finalPrice: Math.max(0, basePrice - (promoPricing.discount || 0)),
            promo: promoPricing.promo || null,
        };
    }, [promos, currentCategoryProperty]);

    const goToPrevCategorySlide = () => {
        if (activeCategoryProperties.length <= 1) return;
        setCategorySlideIndex((prev) => (prev - 1 + activeCategoryProperties.length) % activeCategoryProperties.length);
    };

    const goToNextCategorySlide = () => {
        if (activeCategoryProperties.length <= 1) return;
        setCategorySlideIndex((prev) => (prev + 1) % activeCategoryProperties.length);
    };

    const consultationLink = useMemo(() => {
        const digits = String(companyWhatsapp || '').replace(/\D/g, '');
        if (!digits) return '';

        const normalized = digits.startsWith('62')
            ? digits
            : digits.startsWith('0')
                ? `62${digits.slice(1)}`
                : digits;

        const message = encodeURIComponent('Halo, saya ingin konsultasi properti.');
        return `https://wa.me/${normalized}?text=${message}`;
    }, [companyWhatsapp]);

    const handleConsultationClick = () => {
        if (!consultationLink) return;
        window.open(consultationLink, '_blank', 'noopener,noreferrer');
    };

    const insightCards = useMemo(() => {
        const totalAvailableUnits = properties.reduce((total, item) => total + toNumber(item?.availableUnits), 0);

        return [
            {
                title: 'Perumahan Aktif',
                value: propertyLoading ? '...' : formatNumber(properties.length),
            },
            {
                title: 'Unit Tersedia',
                value: propertyLoading ? '...' : formatNumber(totalAvailableUnits),
            },
            {
                title: 'Promo Berjalan',
                value: formatNumber(activePromos.length),
            }
        ];
    }, [properties, activePromos, propertyLoading]);

    const insightFeaturedProperty = useMemo(() => {
        const availableFirst = properties.filter((item) => toNumber(item?.availableUnits) > 0);
        const source = availableFirst.length > 0 ? availableFirst : properties;
        if (source.length === 0) return null;

        return [...source].sort((a, b) => toNumber(a?.price) - toNumber(b?.price))[0];
    }, [properties]);

    const homeJourney = [
        {
            step: '01',
            title: 'Eksplor Perumahan',
            description: 'Bandingkan lokasi, tipe unit, fasilitas, dan harga dari data terbaru.',
            icon: FiMapPin
        },
        {
            step: '02',
            title: 'Pilih Promo Terbaik',
            description: 'Cek promo aktif yang otomatis dihitung sesuai properti pilihan Anda.',
            icon: FiTrendingUp
        },
        {
            step: '03',
            title: 'Booking Online',
            description: 'Isi data booking secara praktis dan transparan langsung dari website.',
            icon: FiFileText
        },
        {
            step: '04',
            title: 'Pendampingan Tim',
            description: 'Tim kami membantu proses lanjutan sampai akad dan serah terima.',
            icon: FiUsers
        }
    ];

    const excellenceStats = [
        {
            value: '30+',
            label: 'Customer',
            icon: FiUsers,
            tone: 'bg-[#f2f4f8] text-[#10214b] border-gray-200'
        },
        {
            value: '5+',
            label: 'Award',
            icon: FiAward,
            tone: 'bg-[#e8eeff] text-[#10214b] border-blue-100'
        },
        {
            value: '7+',
            label: 'Tahun Pengalaman',
            icon: FiCalendar,
            tone: 'bg-[#f5f7fb] text-[#10214b] border-gray-200'
        },
        {
            value: '33+',
            label: 'Properti Terjual',
            icon: FiHome,
            tone: 'bg-[#edf4ff] text-[#10214b] border-blue-100'
        }
    ];

    const trustPoints = [
        {
            title: 'Lokasi strategis',
            description: 'Akses mudah ke jalan utama, pusat belanja, dan fasilitas publik.',
            icon: FiMapPin
        },
        {
            title: 'Legalitas aman',
            description: 'Dokumen lengkap dan jelas untuk proses transaksi yang lebih tenang.',
            icon: FiShield
        },
        {
            title: 'Bisa KPR',
            description: 'Pilihan unit mendukung pengajuan pembiayaan KPR sesuai kebutuhan.',
            icon: FiFileText
        },
        {
            title: 'Lingkungan nyaman',
            description: 'Kawasan tertata rapi dengan suasana hunian yang ramah keluarga.',
            icon: FiHome
        }
    ];

    return (
        <div className="flex flex-col gap-0 pb-0 scroll-smooth">
            <section className="relative min-h-[calc(100vh-68px)] sm:min-h-[calc(100vh-72px)] md:min-h-[580px] lg:min-h-[680px] flex items-center justify-start text-white overflow-hidden py-10 md:py-16 lg:py-20">
                <div className="absolute inset-0 bg-gradient-to-r from-[#10214b]/95 via-[#10214b]/70 to-black/30 z-10" />

                <img
                    src={bgPage}
                    alt="Hero Background"
                    className="absolute inset-0 w-full h-full object-cover object-center animate-in fade-in zoom-in duration-1000"
                />

                <div className="relative z-20 text-left w-full px-4 sm:px-5 md:px-10 lg:px-16 xl:px-20">
                    <div className="w-full max-w-3xl flex flex-col items-start">
                        <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.15] md:leading-[1.1] text-white animate-in slide-in-from-bottom-8 duration-700 delay-100 drop-shadow-xl mb-4">
                            Temukan hunian
                            <span className="block">impianmu</span>
                        </h1>

                        <p className="text-sm sm:text-base md:text-base lg:text-lg text-gray-200 leading-relaxed w-full max-w-xl animate-in slide-in-from-bottom-8 duration-700 delay-200 drop-shadow-lg font-light mb-6 md:mb-8">
                            Hunian modern dengan lokasi strategis, lingkungan nyaman, dan harga terjangkau. Siap huni & cocok untuk masa depan keluarga Anda.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-in slide-in-from-bottom-8 duration-700 delay-300">
                            <Link to="/perumahan" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto px-6 py-2.5 md:py-3 text-sm md:text-base font-semibold shadow-xl shadow-black/30 transform hover:-translate-y-1 hover:shadow-2xl hover:bg-primary-600 transition-all duration-300">
                                    Lihat Perumahan
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto px-6 py-2.5 md:py-3 text-sm md:text-base font-semibold border-2 border-white text-white hover:bg-white hover:text-[#10214b] shadow-lg hover:-translate-y-1 hover:shadow-white/20 transition-all duration-300 backdrop-blur-sm"
                                onClick={handleConsultationClick}
                                disabled={!consultationLink}
                            >
                                Konsultasi
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#fdfbf6] py-12 md:py-14">
                <div className="container-custom">
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
                        {trustPoints.map((point) => {
                            const Icon = point.icon;
                            return (
                                <div
                                    key={point.title}
                                    className="group rounded-2xl border border-primary-100 bg-white px-4 py-5 text-center shadow-[0_8px_20px_-18px_rgba(16,33,75,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_14px_26px_-18px_rgba(16,33,75,0.55)]"
                                >
                                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary-100 bg-primary-50 text-primary-600">
                                        <Icon className="text-[18px]" strokeWidth={1.9} />
                                    </div>
                                    <h3 className="mb-1.5 text-base md:text-lg font-serif font-semibold text-primary-900 leading-tight">{point.title}</h3>
                                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{point.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="bg-[#fdfbf6] py-8">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#10214b] mb-3">Kategori Perumahan</h2>
                            <p className="text-gray-600 text-sm md:text-lg">Pilih kategori favorit Anda, lalu telusuri hunian terbaiknya.</p>
                        </div>
                        <Link to="/perumahan">
                            <Button variant="outline" className="w-full md:w-auto">Lihat Semua Perumahan</Button>
                        </Link>
                    </div>

                    <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="relative w-full lg:max-w-2xl">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                            <input
                                type="text"
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                placeholder={activeCategory === 'all'
                                    ? 'Cari perumahan dari semua kategori...'
                                    : `Cari perumahan ${activeCategoryDetail?.title?.replace('Perumahan ', '').toLowerCase() || ''}...`}
                                className="w-full h-12 rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                            />
                        </div>
                        <p className="text-xs md:text-sm text-gray-500">
                            Menampilkan <span className="font-semibold text-primary-700">{activeCategoryProperties.length}</span> perumahan
                        </p>
                    </div>

                    <div className="mb-8">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>

                    <div className="flex flex-wrap gap-3 mb-8">
                        {categories.map((category) => {
                            const isActive = activeCategory === category.key;
                            const Icon = category.icon;
                            return (
                                <button
                                    key={category.key}
                                    type="button"
                                    onClick={() => setActiveCategory(category.key)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                                        isActive
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-700'
                                    }`}
                                >
                                    <Icon className="text-base" />
                                    {category.title}
                                </button>
                            );
                        })}
                    </div>

                    {propertyLoading ? (
                        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-gray-500">
                            Memuat data kategori perumahan...
                        </div>
                    ) : propertyError ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
                            {propertyError}
                        </div>
                    ) : activeCategoryProperties.length === 0 ? (
                        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-gray-500">
                            {categorySearch.trim()
                                ? `Tidak ada perumahan yang cocok dengan pencarian "${categorySearch}".`
                                : 'Belum ada perumahan pada kategori ini.'}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-gray-200 bg-white p-5 md:p-8 shadow-xl shadow-slate-200/60">
                            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
                                <div className="relative">
                                <div
                                    className={`relative rounded-3xl border-[10px] border-white overflow-hidden shadow-2xl shadow-slate-300/50 transition-all duration-700 ease-out ${
                                        isCategoryTransitioning ? 'opacity-60 scale-[0.99]' : 'opacity-100 scale-100'
                                    }`}
                                >
                                    <img
                                        src={resolveImage(asString(currentCategoryProperty?.image)) || bgPage}
                                        alt={asString(currentCategoryProperty?.name, activeCategoryDetail?.title || 'Kategori Perumahan')}
                                        className="w-full aspect-[4/3] object-cover transition-transform duration-700"
                                    />
                                    <div className="absolute bottom-4 right-4 max-w-[75%] rounded-full bg-white/95 text-primary-700 px-4 py-2 shadow-lg border border-primary-100 backdrop-blur-sm">
                                        <p className="text-xs font-semibold truncate">{asString(currentCategoryProperty?.location, 'Lokasi strategis tersedia')}</p>
                                    </div>
                                </div>

                                {activeCategoryProperties.length > 1 && (
                                    <div className="mt-6 flex items-center justify-center gap-4">
                                            <button
                                                type="button"
                                                onClick={goToPrevCategorySlide}
                                                className="h-10 w-10 rounded-full border border-gray-200 bg-white text-primary-700 flex items-center justify-center hover:bg-primary-50 transition-colors"
                                                aria-label="Perumahan sebelumnya"
                                            >
                                                <FiChevronLeft />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                {activeCategoryProperties.map((item, index) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setCategorySlideIndex(index)}
                                                        className={`h-2.5 rounded-full transition-all duration-300 ${
                                                            index === categorySlideIndex ? 'w-7 bg-primary-600' : 'w-2.5 bg-gray-300'
                                                        }`}
                                                        aria-label={`Lihat perumahan ${index + 1}`}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={goToNextCategorySlide}
                                                className="h-10 w-10 rounded-full border border-gray-200 bg-white text-primary-700 flex items-center justify-center hover:bg-primary-50 transition-colors"
                                                aria-label="Perumahan berikutnya"
                                            >
                                                <FiChevronRight />
                                            </button>
                                        </div>
                                    )}
                                </div>

                            <div
                                className={`transition-all duration-700 ease-out ${
                                    isCategoryTransitioning ? 'opacity-60 translate-x-1' : 'opacity-100 translate-x-0'
                                }`}
                            >
                                    <Badge className="mb-4 bg-primary-50 text-primary-700 border-primary-100">
                                        {currentCategoryLabel}
                                    </Badge>
                                    <h3 className="text-3xl md:text-4xl font-serif font-semibold text-[#10214b] leading-tight mb-3">
                                        {asString(currentCategoryProperty?.name, `Pilihan Hunian ${activeCategoryDetail?.title?.replace('Perumahan ', '') || 'Terbaik'}`)}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed mb-6 truncate-2-lines">
                                        {asString(currentCategoryProperty?.description, activeCategoryDetail?.description || 'Temukan properti yang sesuai dengan kebutuhan Anda.')}
                                    </p>

                                    <div className="mb-4 flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                                            Type {asString(currentCategoryProperty?.type, '-')}
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                            {asString(currentCategoryProperty?.status, 'Available')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div className="rounded-2xl border border-gray-200 bg-[#f8fbff] p-4">
                                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Harga Perumahan</p>
                                            {activePropertyPricing.discount > 0 && (
                                                <p className="text-xs text-gray-400 line-through">{formatMoney(activePropertyPricing.basePrice)}</p>
                                            )}
                                            <p className="text-xl font-semibold text-primary-700">
                                                {activePropertyPricing.basePrice > 0 ? formatMoney(activePropertyPricing.finalPrice) : '-'}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-gray-200 bg-[#f8fbff] p-4">
                                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Unit Tersedia</p>
                                            <p className="text-xl font-semibold text-primary-700">{formatNumber(toNumber(currentCategoryProperty?.availableUnits))}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Link to={currentCategoryProperty ? `/perumahan/${currentCategoryProperty.id}` : '/perumahan'}>
                                            <Button className="w-full sm:w-auto">Lihat Detail Perumahan</Button>
                                        </Link>
                                        <Link to="/perumahan">
                                            <Button variant="outline" className="w-full sm:w-auto">Lihat Semua Perumahan</Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-[#fdfbf6] py-8">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                        <div>
                            <p className="text-sm font-semibold text-primary-500 mb-2">Promo Pilihan</p>
                            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#10214b] mb-2">Promo Perumahan</h2>
                            <p className="text-gray-500">Penawaran spesial untuk unit pilihan Anda.</p>
                        </div>
                        <Link to="/promo" className="md:block">
                            <Button variant="outline">Lihat Semua Promo</Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {promoError ? (
                            <div className="col-span-full text-sm text-red-600">{promoError}</div>
                        ) : activePromos.length === 0 ? (
                            <div className="col-span-full text-sm text-gray-500">Belum ada promo yang aktif saat ini.</div>
                        ) : (
                            activePromos.slice(0, 3).map((promo) => (
                                <PromoCard key={promo.id} promo={promo} />
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-[#fdfbf6] py-8">
                <div className="border-y border-slate-200 bg-[#fdfbf6] py-8 md:py-10">
                    <div className="container-custom">
                        <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-8 xl:gap-10 items-stretch">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#10214b] mb-3">Langkah Cepat Punya Rumah</h2>
                                <p className="text-gray-600 text-lg">Alur dibuat rapi dan terstruktur agar user bisa mengikuti proses dari awal sampai selesai tanpa kebingungan.</p>

                                <div className="mt-8 space-y-4">
                                    {homeJourney.map((item, index) => {
                                        const Icon = item.icon;
                                        const isLastStep = index === homeJourney.length - 1;

                                        return (
                                            <div key={item.step} className="relative pl-14">
                                                {!isLastStep && (
                                                    <span className="absolute left-[19px] top-10 h-[calc(100%-1.2rem)] w-px bg-slate-200" />
                                                )}

                                                <div className="absolute left-0 top-0 h-10 w-10 border border-primary-100 bg-primary-50 text-primary-700 text-xs font-bold tracking-[0.15em] flex items-center justify-center">
                                                    {item.step}
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:p-5 hover:border-primary-100 hover:bg-white hover:shadow-md transition-all duration-300">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <h3 className="text-base md:text-lg font-semibold text-[#10214b]">{item.title}</h3>
                                                        <div className="h-9 w-9 bg-white border border-slate-200 text-primary-600 flex items-center justify-center shrink-0">
                                                            <Icon />
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-700 via-primary-800 to-[#0b1736] p-7 md:p-8 text-white shadow-xl h-full">
                                <div
                                    className="pointer-events-none absolute inset-0 opacity-55"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle at 12% 15%, rgba(255,255,255,0.22), transparent 35%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.14), transparent 42%)'
                                    }}
                                />
                                <div className="relative z-10 h-full flex flex-col">
                                    <p className="text-xs uppercase tracking-[0.24em] text-white/75 mb-3">Konsultasi Gratis</p>
                                    <h3 className="text-white/100 md:text-3xl font-serif font-semibold mb-4">Butuh Rekomendasi yang Cocok dengan Budget?</h3>
                                    <p className="text-white/85 leading-relaxed mb-6">
                                        Tim kami siap bantu hitung simulasi, pilih promo terbaik, dan merekomendasikan unit yang paling sesuai kebutuhan keluarga Anda.
                                    </p>

                                    <div className="space-y-3 mb-7">
                                        <div className="flex items-center gap-2.5 text-sm text-white/90">
                                            <FiCheckCircle className="text-emerald-300" />
                                            Respons cepat via WhatsApp
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-white/90">
                                            <FiCheckCircle className="text-emerald-300" />
                                            Prioritas update unit dan promo terbaru
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-white/90">
                                            <FiCheckCircle className="text-emerald-300" />
                                            Pendampingan dari booking hingga akad
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Link to="/perumahan" className="w-full">
                                                <Button className="w-full bg-white text-[#10214b] hover:bg-gray-100">
                                                    Mulai Pilih Hunian
                                                </Button>
                                            </Link>
                                            <Link to="/kpr" className="w-full">
                                                <Button variant="outline" className="w-full border-white/40 text-white hover:bg-white hover:text-[#10214b]">
                                                    Simulasi KPR
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="mt-6 inline-flex items-center border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white/85">
                                            <FiPhoneCall className="mr-2" />
                                            Siap dibantu tim profesional
                                            <FiArrowUpRight className="ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#fdfbf6] py-8">
                <div className="relative overflow-hidden border-y border-slate-200 bg-[#fdfbf6] py-7 md:py-10">
                    <div className="container-custom">
                        <div
                            className="pointer-events-none absolute inset-0 opacity-60"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 8% 10%, rgba(47,73,127,0.16), transparent 32%), radial-gradient(circle at 92% 88%, rgba(215,189,136,0.2), transparent 35%)'
                            }}
                        />
                        <div className="relative z-10 grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
                            <div className="relative">
                                <div className="grid grid-cols-12 gap-3 md:gap-4">
                                    <div className="col-span-7">
                                        <img
                                            src={INSIGHT_DUMMY_IMAGES[0]}
                                            alt="Tim dan aktivitas pemasaran properti"
                                            className="h-44 md:h-56 w-full rounded-[24px] object-cover shadow-lg"
                                        />
                                    </div>
                                    <div className="col-span-5 pt-4">
                                        <img
                                            src={INSIGHT_DUMMY_IMAGES[1]}
                                            alt="Pendampingan konsultasi properti"
                                            className="h-40 md:h-52 w-full rounded-[24px] object-cover shadow-lg"
                                        />
                                    </div>
                                    <div className="col-span-6">
                                        <img
                                            src={INSIGHT_DUMMY_IMAGES[2]}
                                            alt="Kunjungan perumahan"
                                            className="h-32 md:h-40 w-full rounded-[22px] object-cover shadow-md"
                                        />
                                    </div>
                                    <div className="col-span-6">
                                        {insightFeaturedProperty?.id ? (
                                            <Link
                                                to={`/perumahan/${insightFeaturedProperty.id}`}
                                                className="block h-32 md:h-40 w-full rounded-[22px] overflow-hidden border border-primary-100 shadow-md group"
                                            >
                                                <img
                                                    src={resolveImage(asString(insightFeaturedProperty.image)) || INSIGHT_DUMMY_IMAGES[2]}
                                                    alt={asString(insightFeaturedProperty.name, 'Perumahan pilihan')}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            </Link>
                                        ) : (
                                            <div className="h-32 md:h-40 w-full rounded-[22px] overflow-hidden border border-primary-100 shadow-md">
                                                <img
                                                    src={INSIGHT_DUMMY_IMAGES[2]}
                                                    alt="Gambar perumahan"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600 text-white w-20 h-20 md:w-24 md:h-24 border-4 border-white shadow-xl flex flex-col items-center justify-center">
                                    <span className="text-[10px] uppercase tracking-wide text-primary-100">Live</span>
                                    <span className="text-sm md:text-base font-semibold leading-none">Data</span>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl md:text-5xl font-serif font-semibold text-[#10214b] leading-tight mb-4">
                                    Ringkasan Pasar Properti
                                    <span className="block text-primary-500">Untuk Membantu Keputusan Anda</span>
                                </h2>
                                <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-7">
                                    Lihat gambaran kondisi perumahan terkini, ketersediaan unit, hingga promo aktif secara real-time
                                    agar Anda lebih percaya diri dalam memilih hunian.
                                </p>

                                <div className="mb-7 overflow-hidden rounded-2xl border border-primary-500 bg-primary-600">
                                    <div className="grid grid-cols-1 sm:grid-cols-3">
                                        {insightCards.map((item, index) => (
                                            <div
                                                key={item.title}
                                                className={`px-4 py-4 md:px-5 md:py-5 ${
                                                    index < insightCards.length - 1
                                                        ? 'border-b border-white/20 sm:border-b-0 sm:border-r'
                                                        : ''
                                                }`}
                                            >
                                                <p className="text-3xl md:text-4xl font-semibold text-white leading-none mb-2">{item.value}</p>
                                                <p className="text-sm md:text-base text-white">{item.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#fdfbf6] py-12">
                <div className="container-custom">
                    <div className="rounded-3xl border border-secondary-200 bg-white p-6 md:p-8 lg:p-10 shadow-xl shadow-slate-200/40">
                        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-10 items-center mb-10">
                            <div>
                                <Badge variant="secondary" className="mb-4 px-4 py-1 text-xs font-semibold tracking-wide bg-secondary-500/20 text-secondary-700 border border-secondary-500/30">
                                    Keunggulan Perusahaan
                                </Badge>
                                <h2 className="text-[#10214b] text-3xl md:text-5xl font-serif font-semibold mb-4 leading-tight">
                                    Partner Terpercaya untuk Properti Anda
                                </h2>
                                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-2xl">
                                    Zavira Mecca Property membantu Anda menemukan hunian terbaik dengan data yang transparan,
                                    proses yang nyaman, dan pendampingan profesional dari awal hingga transaksi selesai.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {excellenceStats.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={item.label}
                                            className={`rounded-2xl border ${item.tone} p-4 md:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-white/70 border border-white flex items-center justify-center mb-3 text-lg">
                                                <Icon />
                                            </div>
                                            <p className="text-3xl md:text-[32px] leading-none font-semibold mb-2">{item.value}</p>
                                            <p className="text-sm md:text-base text-gray-600">{item.label}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-7 rounded-2xl bg-white border border-secondary-200 hover:-translate-y-2 group shadow-lg hover:shadow-2xl transition-all duration-300">
                                <div className="w-14 h-14 bg-[#f5e7c6] text-[#b1842d] rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                                    <FiFileText />
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-[#10214b]">Legalitas Terjamin</h3>
                                <p className="text-gray-600 leading-relaxed">Dokumen lengkap dan proses yang tertata rapi untuk keamanan hukum.</p>
                            </div>

                            <div className="p-7 rounded-2xl bg-white border border-secondary-200 hover:-translate-y-2 group shadow-lg hover:shadow-2xl transition-all duration-300">
                                <div className="w-14 h-14 bg-[#f5e7c6] text-[#b1842d] rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                                    <FiUsers />
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-[#10214b]">Proses Mudah</h3>
                                <p className="text-gray-600 leading-relaxed">Tim profesional kami mendampingi dari awal hingga serah terima.</p>
                            </div>

                            <div className="p-7 rounded-2xl bg-white border border-secondary-200 hover:-translate-y-2 group shadow-lg hover:shadow-2xl transition-all duration-300">
                                <div className="w-14 h-14 bg-[#f5e7c6] text-[#b1842d] rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                                    <FiHome />
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-[#10214b]">Harga Kompetitif</h3>
                                <p className="text-gray-600 leading-relaxed">Penawaran terbaik dengan nilai investasi yang tetap menarik.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
