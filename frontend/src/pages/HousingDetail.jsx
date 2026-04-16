import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Card, CardContent, CardTitle } from '../components/ui/Card';
import { FiArrowLeft, FiCheck, FiMapPin, FiHeart, FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { FaWhatsapp, FaTag, FaClock } from 'react-icons/fa';
import { API_BASE, mapPromoFromApi, formatPromoPeriod, getPromoPricing as calculatePromoPricing, isPromoActive, resolveImage } from '../utils/promo';
import { isFavoriteProperty, toggleFavoriteProperty } from '../lib/favorites';
import { isLoggedIn } from '../lib/auth';
import UnitPicker from '../components/booking/UnitPicker';

export default function HousingDetail() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    const [unitBlocks, setUnitBlocks] = useState([]);
    const [unitLoading, setUnitLoading] = useState(false);
    const [unitError, setUnitError] = useState('');
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [unitValidationError, setUnitValidationError] = useState('');

    const [dp, setDp] = useState('');
    const [tenorMonths, setTenorMonths] = useState('');
    const [interest, setInterest] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteMessage, setFavoriteMessage] = useState('');
    const [showFavoriteToast, setShowFavoriteToast] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [promos, setPromos] = useState([]);

    const formatThousandDots = (value) => {
        const digitsOnly = String(value || '').replace(/\D/g, '');
        if (!digitsOnly) return '';
        return new Intl.NumberFormat('id-ID').format(Number(digitsOnly));
    };

    const parseFormattedNumber = (value) => Number(String(value || '').replace(/\D/g, '') || 0);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/api/perumahan/${id}`);
                if (!response.ok) {
                    throw new Error('Properti tidak ditemukan.');
                }
                const data = await response.json();
                const normalized = {
                    ...data,
                    images: (data.images || []).map((item) => resolveImage(item)),
                };
                setProperty(normalized);
                setActiveImage(0);
                setIsFavorite(isLoggedIn() ? isFavoriteProperty(normalized.id) : false);
            } catch (err) {
                setError(err.message || 'Gagal memuat detail properti.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/promos`);
                if (!response.ok) {
                    throw new Error('Gagal memuat promo.');
                }
                const data = await response.json();
                setPromos((data || []).map(mapPromoFromApi));
            } catch {
                // Silent fail for promo section
            }
        };

        fetchPromos();
    }, []);

    useEffect(() => {
        if (!showUnitDropdown) return;

        let isMounted = true;
        let intervalId = null;

        const fetchUnitAvailability = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/perumahan/${id}/units`);
                if (!response.ok) {
                    throw new Error('Gagal memuat status unit.');
                }
                const data = await response.json();
                if (!isMounted) return;

                setUnitBlocks(Array.isArray(data?.unitBlocks) ? data.unitBlocks : []);
                setUnitError('');
            } catch (err) {
                if (!isMounted) return;
                setUnitError(err.message || 'Gagal memuat status unit.');
            } finally {
                if (isMounted) {
                    setUnitLoading(false);
                }
            }
        };

        setUnitLoading(true);
        fetchUnitAvailability();
        intervalId = setInterval(fetchUnitAvailability, 15000);

        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [id, showUnitDropdown]);

    useEffect(() => {
        if (!selectedUnit?.id) return;
        const latest = unitBlocks
            .flatMap((block) => block.units || [])
            .find((item) => String(item.id) === String(selectedUnit.id));

        if (!latest || latest.status !== 'available') {
            setSelectedUnit(null);
        }
    }, [unitBlocks, selectedUnit]);

    const images = useMemo(() => {
        if (!property?.images?.length) return [];
        return property.images.slice(0, 4);
    }, [property]);

    useEffect(() => {
        if (activeImage >= images.length) {
            setActiveImage(0);
        }
    }, [images.length, activeImage]);

    if (loading) {
        return (
            <div className="container-custom py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="container-custom py-20 text-center">
                <p className="text-red-600">{error || 'Properti tidak ditemukan.'}</p>
                <Link to="/perumahan" className="mt-4 inline-block">
                    <Button variant="outline">Kembali ke Daftar</Button>
                </Link>
            </div>
        );
    }

    const formatMoney = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
    const categoryLabel = (value) => {
        if (!value) return '-';
        if (value === 'subsidi') return 'Subsidi';
        if (value === 'komersil') return 'Komersil';
        if (value === 'townhouse') return 'Townhouse';
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const activePromos = promos.filter((promo) => (
        isPromoActive(promo) && (promo.perumahanIds || []).includes(property.id)
    ));

    const basePrice = Number(property.price) || 0;
    const promoPricing = calculatePromoPricing(promos, property.id, basePrice);
    const finalPrice = Math.max(0, basePrice - promoPricing.discount);

    const handleCalculate = (e) => {
        e.preventDefault();
        if (dp === '' || tenorMonths === '' || interest === '') {
            setMonthlyPayment(null);
            return;
        }

        const price = Number(finalPrice) || 0;
        const dpValue = parseFormattedNumber(dp);
        const principal = price - dpValue;
        const n = Math.max(1, Number(tenorMonths) || 0);
        const annualRate = Number(interest) || 0;
        const monthlyRate = (annualRate / 100) / 12;

        if (principal <= 0) {
            setMonthlyPayment(0);
            return;
        }

        if (monthlyRate === 0) {
            setMonthlyPayment(principal / n);
            return;
        }

        const result = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
        setMonthlyPayment(result);
    };

    const toggleFavorite = () => {
        if (!isLoggedIn()) {
            setIsFavorite(false);
            setFavoriteMessage('Silakan login terlebih dahulu untuk menambahkan favorit.');
            setShowFavoriteToast(true);
            setToastVisible(true);
            setTimeout(() => setToastVisible(false), 1500);
            setTimeout(() => {
                setShowFavoriteToast(false);
                setFavoriteMessage('');
                navigate('/auth/login', { state: { from: location } });
            }, 1700);
            return;
        }

        const { exists } = toggleFavoriteProperty(property.id);
        setIsFavorite(!exists);
        setFavoriteMessage(exists ? 'Dihapus dari favorit.' : 'Berhasil ditambahkan ke favorit.');
        setShowFavoriteToast(true);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 1800);
        setTimeout(() => {
            setShowFavoriteToast(false);
            setFavoriteMessage('');
        }, 2300);
    };

    const goPrevImage = () => {
        if (!images.length) return;
        setActiveImage((prev) => (prev - 1 + images.length) % images.length);
    };

    const goNextImage = () => {
        if (!images.length) return;
        setActiveImage((prev) => (prev + 1) % images.length);
    };

    const getWhatsappLink = () => {
        const raw = property?.marketingWhatsapp || '';
        const digits = raw.replace(/\D/g, '');
        if (!digits) return '';
        if (digits.startsWith('62')) return `https://wa.me/${digits}`;
        const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : `62${digits}`;
        return `https://wa.me/${normalized}`;
    };

    const whatsappLink = getWhatsappLink();

    const handleDpChange = (event) => {
        const numericValue = parseFormattedNumber(event.target.value);
        if (!numericValue) {
            setDp('');
            return;
        }

        const cappedValue = Math.min(numericValue, finalPrice);
        setDp(`Rp ${formatThousandDots(cappedValue)}`);
    };

    const handleToggleUnitDropdown = () => {
        setShowUnitDropdown((prev) => !prev);
    };

    const handleChooseUnit = (unit) => {
        setSelectedUnit(unit);
        setUnitValidationError('');
    };

    const handleGoBooking = () => {
        if (!selectedUnit?.id) {
            setShowUnitDropdown(true);
            setUnitValidationError('Silakan pilih unit terlebih dahulu sebelum booking.');
            return;
        }

        const params = new URLSearchParams({
            unitId: String(selectedUnit.id),
            unitCode: selectedUnit.code || '',
        });

        navigate(`/booking/${property.id}?${params.toString()}`, {
            state: {
                selectedUnitId: selectedUnit.id,
                selectedUnitCode: selectedUnit.code,
            },
        });
    };

    return (
        <div className="container-custom py-8 pb-20 animate-in fade-in duration-500">
            {showFavoriteToast && (
                <div className="fixed top-24 right-6 z-50">
                    <div className={`bg-white border border-secondary-200 shadow-lg rounded-md px-4 py-3 text-sm text-primary-900 transition-all duration-300 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                        {favoriteMessage}
                    </div>
                </div>
            )}

            <Link to="/perumahan" className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-5 transition-colors font-medium">
                <FiArrowLeft className="mr-2" /> Kembali ke Daftar
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-lg overflow-hidden shadow-md relative">
                        <div className="h-[260px] md:h-[380px] bg-gray-100 relative">
                            {images.length ? (
                                <img src={images[activeImage]} alt={property.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">Belum ada foto</div>
                            )}
                            <div className="absolute top-4 right-4">
                                <Badge className="bg-white/90 backdrop-blur-md text-primary-800 text-sm px-3 py-1 shadow-sm">{property.status || 'Available'}</Badge>
                            </div>
                            {images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 hover:bg-white text-primary-900 flex items-center justify-center shadow"
                                        onClick={goPrevImage}
                                        aria-label="Previous image"
                                    >
                                        <FiChevronLeft />
                                    </button>
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 hover:bg-white text-primary-900 flex items-center justify-center shadow"
                                        onClick={goNextImage}
                                        aria-label="Next image"
                                    >
                                        <FiChevronRight />
                                    </button>
                                </>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 p-3 bg-white border-t border-gray-100">
                                {images.map((img, idx) => (
                                    <button
                                        key={`${img}-${idx}`}
                                        type="button"
                                        onClick={() => setActiveImage(idx)}
                                        className={`aspect-[4/3] rounded-md overflow-hidden border ${idx === activeImage ? 'border-primary-600' : 'border-gray-200'}`}
                                    >
                                        <img src={img} alt={`${property.name} ${idx + 1}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Card className="shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">{property.name}</h1>
                                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                                        <FiMapPin className="text-primary-600" />
                                        {property.location || '-'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleFavorite}
                                    className="h-10 w-10 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-200 transition-colors"
                                    aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}
                                >
                                    <FiHeart className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
                                </button>
                            </div>

                            <p className="text-gray-600 leading-relaxed">{property.description || '-'}</p>

                            <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Alamat</span>
                                    {property.gmapsUrl ? (
                                        <a href={property.gmapsUrl} target="_blank" rel="noreferrer" className="text-right font-medium text-primary-700 hover:text-primary-800 underline">
                                            {property.address || '-'}
                                        </a>
                                    ) : (
                                        <span className="font-medium text-gray-900">{property.address || '-'}</span>
                                    )}
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Luas Tanah</span>
                                    <span className="font-medium text-gray-900">{property.land || '-'} m2</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Luas Bangunan</span>
                                    <span className="font-medium text-gray-900">{property.building || '-'} m2</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Harga</span>
                                    <div className="text-right">
                                        {promoPricing.discount > 0 && (
                                            <p className="text-xs text-gray-400 line-through">{formatMoney(basePrice)}</p>
                                        )}
                                        <p className="font-semibold text-primary-700">{formatMoney(finalPrice)}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Jenis Rumah</span>
                                    <span className="font-medium text-gray-900">{categoryLabel(property.category)}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-gray-500">Fasilitas</span>
                                    <div className="flex flex-wrap gap-2">
                                        {(property.facilities || []).length ? (
                                            property.facilities.map((fac, i) => (
                                                <div key={`${fac}-${i}`} className="flex items-center bg-gray-50 px-3 py-1 rounded-md text-xs font-medium text-gray-700 border border-gray-200">
                                                    <FiCheck className="text-primary-500 mr-2" /> {fac}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400">Belum ada fasilitas.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {activePromos.length > 0 && (
                                <div className="rounded-lg border border-secondary-200 bg-gradient-to-r from-secondary-50 to-white p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold text-primary-900">Promo Aktif</p>
                                        <span className="text-[11px] text-gray-400">Terbatas</span>
                                    </div>
                                    <div className="space-y-3">
                                        {activePromos.slice(0, 2).map((promo) => (
                                            <div key={promo.id} className="rounded-md border border-secondary-100 bg-white p-3 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge className="bg-secondary-100 text-secondary-700 border-secondary-200">{promo.category}</Badge>
                                                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                                        <FaClock className="text-gray-400" />
                                                        {formatPromoPeriod(promo.startDate, promo.endDate)}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">{promo.title}</p>
                                                <p className="text-xs text-primary-700 mt-1">
                                                    <FaTag className="inline-block mr-1" />
                                                    {promo.highlight}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-gray-700">
                                <span className="font-semibold">Jumlah Unit Tersedia</span>
                                <span className="font-bold text-gray-900">{property.availableUnits || 0}/{property.totalUnits || 0}</span>
                            </div>

                            <div className="space-y-3 border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={handleToggleUnitDropdown}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
                                >
                                    <span className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-gray-900">
                                            Pilih Blok & Unit (Wajib)
                                            {selectedUnit?.code ? ` - ${selectedUnit.code}` : ''}
                                        </span>
                                        <FiChevronDown className={`text-gray-500 transition-transform ${showUnitDropdown ? 'rotate-180' : ''}`} />
                                    </span>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Klik untuk menampilkan pilihan blok dan unit sebelum booking.
                                    </p>
                                </button>

                                {showUnitDropdown && (
                                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                                        <UnitPicker
                                            unitBlocks={unitBlocks}
                                            selectedUnitId={selectedUnit?.id}
                                            onSelect={handleChooseUnit}
                                            loading={unitLoading}
                                            error={unitError}
                                            validationError={unitValidationError}
                                            title="Pilih blok dan unit rumah"
                                            helperText="Unit hijau tersedia untuk booking. Unit kuning/merah tidak dapat dipilih."
                                        />
                                    </div>
                                )}
                                {!showUnitDropdown && unitValidationError && (
                                    <p className="text-sm text-amber-700">{unitValidationError}</p>
                                )}

                                <Button
                                    type="button"
                                    className="w-full h-12 text-base font-bold"
                                    onClick={handleGoBooking}
                                >
                                    Booking Sekarang
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-md overflow-hidden">
                        <div className="bg-[#10214b] text-white px-6 py-4">
                            <CardTitle className="text-lg text-white">Simulasi KPR</CardTitle>
                            <p className="text-secondary-100 text-xs">Harga rumah otomatis mengikuti perumahan</p>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleCalculate} className="space-y-4">
                                <Input label="Harga Rumah" value={formatMoney(finalPrice)} readOnly />
                                <Input
                                    label="DP"
                                    type="text"
                                    inputMode="numeric"
                                    value={dp}
                                    onChange={handleDpChange}
                                    placeholder="Rp 0"
                                    required
                                />
                                <Input label="Tenor (bulan)" type="number" value={tenorMonths} onChange={(e) => setTenorMonths(e.target.value)} min={1} placeholder="Masukkan tenor" required />
                                <Input label="Suku Bunga (%)" type="number" value={interest} onChange={(e) => setInterest(e.target.value)} step={0.1} placeholder="Masukkan suku bunga" required />
                                <Button type="submit" className="w-full">Hitung KPR</Button>
                            </form>

                            <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4 text-center">
                                <p className="text-xs text-gray-500 mb-1">Estimasi Angsuran / Bulan</p>
                                <p className="text-2xl font-bold text-primary-700">
                                    {monthlyPayment === null ? '-' : formatMoney(monthlyPayment)}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-2">*Hasil simulasi, bukan nilai final.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md overflow-hidden">
                        <div className="bg-emerald-600 text-white px-6 py-4">
                            <CardTitle className="text-lg text-white">Hubungi Marketing</CardTitle>
                            <p className="text-emerald-100 text-xs">Tanyakan info detail langsung via WhatsApp</p>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500">Nama Marketing</p>
                                <p className="text-base font-semibold text-gray-900">{property.marketingName || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500">Nomor WhatsApp</p>
                                <p className="text-sm font-medium text-gray-800">{property.marketingWhatsapp ? `+${property.marketingWhatsapp}` : '-'}</p>
                            </div>
                            <Button
                                type="button"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => whatsappLink && window.open(whatsappLink, '_blank', 'noopener,noreferrer')}
                                disabled={!whatsappLink}
                            >
                                <FaWhatsapp className="mr-2" /> Chat WhatsApp
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
