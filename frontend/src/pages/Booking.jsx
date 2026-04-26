import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { FaCloudUploadAlt, FaFilePdf, FaCheckCircle, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { getPromoPricing as calculatePromoPricing, mapPromoFromApi, normalizeApiListPayload } from '../utils/promo';
import { apiJson } from '../lib/api';
import { authHeaders, getStoredUser } from '../lib/auth';
import { formatPhoneForDisplay, normalizePhone } from '../lib/phone';

export default function Booking() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [propertyLoading, setPropertyLoading] = useState(true);
    const [propertyError, setPropertyError] = useState('');
    const [property, setProperty] = useState(null);
    const [promos, setPromos] = useState([]);
    const [formError, setFormError] = useState('');
    const [showTerms, setShowTerms] = useState(false);
    const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
    const [userForm, setUserForm] = useState({
        nama: '',
        no_hp: '',
        email: '',
        alamat: '',
        no_rekening: '',
        range_harga_dp: '',
        pekerjaan: '',
        jenis_pekerjaan: 'fixed_income',
        gaji_bulanan: '',
        memiliki_angsuran_lain: '0',
    });

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [transferProofFile, setTransferProofFile] = useState(null);
    const [transferProofPreview, setTransferProofPreview] = useState('');

    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const selectedUnitId = String(location.state?.selectedUnitId || queryParams.get('unitId') || '');
    const selectedUnitCode = String(location.state?.selectedUnitCode || queryParams.get('unitCode') || '');

    const parseCurrencyInput = (value) => String(value || '').replace(/\D/g, '');
    const formatCurrencyInput = (value) => {
        const digitsOnly = parseCurrencyInput(value);
        if (!digitsOnly) return '';
        return `Rp ${new Intl.NumberFormat('id-ID').format(Number(digitsOnly))}`;
    };
    const parseAccountNumberInput = (value) => String(value || '').replace(/\D/g, '');
    const formatMonthYear = (value) => {
        if (!value) return 'Belum diatur admin';
        return new Date(value).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
    };

    const handleSalaryChange = (event) => {
        const digitsOnly = parseCurrencyInput(event.target.value);
        setUserForm((prev) => ({
            ...prev,
            gaji_bulanan: digitsOnly ? formatCurrencyInput(digitsOnly) : '',
        }));
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            const isPdf = selected.type === 'application/pdf' || /\.pdf$/i.test(selected.name || '');
            if (!isPdf) {
                setFormError('Dokumen harus berupa 1 file PDF gabungan KTP dan Kartu Keluarga.');
                setFile(null);
                setPreview(null);
                e.target.value = '';
                return;
            }

            setFormError('');
            setFile(selected);
            setPreview(null);
        }
    };

    const handleTransferProofChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        const isImage = ['image/jpeg', 'image/png'].includes(selected.type) || /\.(jpg|jpeg|png)$/i.test(selected.name || '');
        if (!isImage) {
            setFormError('Bukti transfer UTJ harus berupa file JPG, JPEG, atau PNG.');
            setTransferProofFile(null);
            setTransferProofPreview('');
            e.target.value = '';
            return;
        }

        if ((selected.size || 0) > 1024 * 1024) {
            setFormError('Ukuran bukti transfer UTJ maksimal 1MB.');
            setTransferProofFile(null);
            setTransferProofPreview('');
            e.target.value = '';
            return;
        }

        setFormError('');
        setTransferProofFile(selected);
        setTransferProofPreview(URL.createObjectURL(selected));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const requiredTextFields = [
            { key: 'nama', label: 'Nama lengkap' },
            { key: 'no_hp', label: 'No. WhatsApp' },
            { key: 'email', label: 'Alamat email' },
            { key: 'alamat', label: 'Alamat domisili' },
            { key: 'no_rekening', label: 'No. rekening' },
            { key: 'range_harga_dp', label: 'Nominal DP' },
            { key: 'pekerjaan', label: 'Pekerjaan' },
        ];

        for (const field of requiredTextFields) {
            if (!String(userForm?.[field.key] || '').trim()) {
                setFormError(`${field.label} wajib diisi.`);
                return;
            }
        }

        if (!String(userForm?.jenis_pekerjaan || '').trim()) {
            setFormError('Jenis pekerjaan wajib dipilih.');
            return;
        }

        if (!String(parseCurrencyInput(userForm?.gaji_bulanan || '')).trim()) {
            setFormError('Gaji per bulan wajib diisi.');
            return;
        }

        if (!['0', '1'].includes(String(userForm?.memiliki_angsuran_lain))) {
            setFormError('Jawaban angsuran lain wajib dipilih.');
            return;
        }

        if (!file) {
            setFormError('Mohon upload 1 file PDF gabungan KTP dan Kartu Keluarga.');
            return;
        }

        if (!transferProofFile) {
            setFormError('Mohon upload bukti transfer UTJ.');
            return;
        }

        if (!destinationAccountNumber) {
            setFormError('No. rekening tujuan transfer UTJ belum tersedia. Silakan hubungi admin terlebih dahulu.');
            return;
        }

        if (!hasAgreedToTerms) {
            setShowTerms(true);
            setFormError('Anda wajib menyetujui syarat dan ketentuan booking sebelum mengirim booking.');
            return;
        }

        const isConfirmed = window.confirm(
            'Pastikan data pemesan, nominal DP, dokumen PDF, bukti transfer UTJ, dan persetujuan syarat sudah benar. Kirim booking sekarang?'
        );

        if (!isConfirmed) {
            return;
        }

        setSubmitting(true);

        try {
            const payload = new FormData();
            if (!property?.id) {
                throw new Error('Data perumahan tidak ditemukan.');
            }

            if (!selectedUnitId) {
                throw new Error('Silakan pilih blok unit di halaman detail perumahan terlebih dahulu.');
            }

            payload.append('id_perumahan', String(property.id));
            payload.append('id_unit_perumahan', selectedUnitId);
            payload.append('no_rekening', userForm.no_rekening);
            payload.append('range_harga_dp', userForm.range_harga_dp);
            payload.append('pekerjaan', userForm.pekerjaan);
            payload.append('jenis_pekerjaan', userForm.jenis_pekerjaan);
            payload.append('gaji_bulanan', String(parseCurrencyInput(userForm.gaji_bulanan) || '0'));
            payload.append('memiliki_angsuran_lain', userForm.memiliki_angsuran_lain);
            payload.append('persetujuan_syarat', hasAgreedToTerms ? '1' : '0');

            payload.append('dokumen', file);
            payload.append('bukti_transfer_utj', transferProofFile);

            await apiJson('/bookings', {
                method: 'POST',
                headers: authHeaders(),
                body: payload,
                defaultErrorMessage: 'Gagal mengirim booking.',
            });

            setSubmitting(false);
            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err) {
            setFormError(err.message || 'Gagal mengirim booking.');
            setSubmitting(false);
        }
    };

    const formatMoney = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const normalizedCategory = String(property?.category || '').toLowerCase();
    const propertyCategoryLabel = normalizedCategory === 'subsidi'
        ? 'Subsidi'
        : normalizedCategory === 'komersil'
            ? 'Komersial'
            : normalizedCategory === 'townhouse'
                ? 'Townhouse'
                : 'Lainnya';
    const destinationBankName = String(property?.bankNameUtj || '').trim();
    const destinationAccountNumber = parseAccountNumberInput(property?.noRekeningUtj || '');
    const applicableBookingFee = normalizedCategory === 'subsidi'
        ? 2000000
        : normalizedCategory === 'komersil'
            ? 5000000
            : null;
    const bookingSectionClassName = 'overflow-hidden rounded-[28px] border border-slate-200 bg-[#fbfcfe]';
    const bookingSectionHeaderClassName = 'flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6';
    const bookingSectionTitleClassName = 'flex items-start gap-4';
    const bookingSectionStepClassName = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-base font-semibold text-slate-700';
    const bookingSectionContentClassName = 'border-t border-slate-200 px-5 py-5 md:px-6 md:py-6';
    const bookingSectionPillClassName = 'inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700';
    const basePrice = Number(property?.price) || 0;
    const promoPricing = calculatePromoPricing(promos, property?.id, basePrice);
    const finalPrice = Math.max(0, basePrice - promoPricing.discount);
    const selectedUnitDetail = useMemo(() => (
        (property?.unitBlocks || [])
            .flatMap((block) => block.units || [])
            .find((unit) => String(unit.id) === String(selectedUnitId))
    ), [property?.unitBlocks, selectedUnitId]);
    const selectedUnitIsIndent = selectedUnitDetail?.salesMode === 'indent';
    const selectedUnitEstimateLabel = formatMonthYear(selectedUnitDetail?.estimatedCompletionDate);

    useEffect(() => {
        const fetchProperty = async () => {
            setPropertyLoading(true);
            setPropertyError('');
            try {
                const data = await apiJson(`/perumahan/${id}`, {
                    defaultErrorMessage: 'Data perumahan tidak ditemukan.',
                });
                setProperty(data);
            } catch (err) {
                setPropertyError(err.message || 'Gagal memuat data perumahan.');
                setProperty(null);
            } finally {
                setPropertyLoading(false);
            }
        };

        fetchProperty();
    }, [id]);

    useEffect(() => {
        const user = getStoredUser();
        if (user) {
            setUserForm((prev) => ({
                ...prev,
                no_hp: formatPhoneForDisplay(user.no_hp || ''),
                email: user.email || '',
                alamat: user.alamat || '',
            }));
        }
    }, []);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const data = await apiJson('/promos');
                setPromos(normalizeApiListPayload(data).map(mapPromoFromApi));
            } catch {
                setPromos([]);
            }
        };

        fetchPromos();
    }, []);

    if (propertyLoading) {
        return (
            <div className="container-custom py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (propertyError || !property) {
        return (
            <div className="container-custom py-20 text-center">
                <p className="text-red-600">{propertyError || 'Data perumahan tidak ditemukan.'}</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/perumahan')}>
                    Kembali ke Daftar Perumahan
                </Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="container-custom py-20 flex justify-center items-center min-h-[60vh]">
                <div className="text-center p-10 bg-white rounded-xl shadow-2xl max-w-lg border border-gray-200 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 text-5xl shadow-lg shadow-green-200">
                        <FaCheckCircle />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Booking Berhasil!</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">Data booking Anda telah diterima. Kami akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi selanjutnya.</p>
                    <div className="bg-yellow-50 p-4 rounded-xl text-sm border border-yellow-100 mb-8 inline-block w-full">
                        <p className="text-gray-600 mb-1">Status Booking:</p>
                        <span className="font-bold text-yellow-700 text-lg">Menunggu Konfirmasi</span>
                    </div>
                    <Button onClick={() => navigate('/perumahan')} variant="outline" className="w-full">Cari Properti Lain</Button>
                </div>
            </div>
        );
    }

    if (!selectedUnitId) {
        return (
            <div className="container-custom py-20 max-w-2xl">
                <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                    <CardContent className="p-8 text-center space-y-4">
                        <h2 className="text-2xl font-bold text-amber-900">Pilih Unit Terlebih Dahulu</h2>
                        <p className="text-sm text-amber-800">
                            Untuk melanjutkan booking, silakan pilih blok dan unit di halaman detail perumahan.
                        </p>
                        <Button onClick={() => navigate(`/perumahan/${property.id}`)} className="w-full sm:w-auto">
                            Kembali ke Detail Perumahan
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container-custom py-10 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">Formulir Booking Unit</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-primary-900 text-white border-none shadow-xl sticky top-24">
                        <CardContent className="p-8">
                            <h3 className="font-bold text-xl mb-6 text-white border-b border-primary-700 pb-2">Informasi Unit</h3>
                            <div className="space-y-4 text-primary-100">
                                <div>
                                    <span className="block text-xs uppercase opacity-70 mb-1">Properti</span>
                                    <p className="font-semibold text-lg text-white">{property.name}</p>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase opacity-70 mb-1">Unit Terpilih</span>
                                    <p className="font-semibold text-white">{selectedUnitCode || selectedUnitId}</p>
                                    {selectedUnitIsIndent && (
                                        <span className="mt-2 inline-flex items-center rounded-full border border-amber-300/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                                            Indent
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-xs uppercase opacity-70 mb-1">Tipe</span>
                                    <p className="font-semibold text-white">{property.type}</p>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase opacity-70 mb-1">Harga</span>
                                    <div className="space-y-1">
                                        {promoPricing.discount > 0 && (
                                            <p className="text-xs text-primary-200 line-through">{formatMoney(basePrice)}</p>
                                        )}
                                        <p className="font-semibold text-white text-xl">{formatMoney(finalPrice)}</p>
                                        {promoPricing.discount > 0 && (
                                            <span className="inline-flex items-center text-[11px] text-emerald-100 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300/30">
                                                Promo aktif
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-primary-800 mt-6">
                                    {selectedUnitIsIndent && (
                                        <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                                            <p className="font-semibold">Unit ini masih dalam tahap pembangunan (Indent).</p>
                                            <p className="mt-1">Estimasi selesai: {selectedUnitEstimateLabel}</p>
                                        </div>
                                    )}
                                    <p className="font-medium text-white mb-2">Persyaratan Dokumen:</p>
                                    <ul className="list-disc pl-4 space-y-2 text-sm">
                                        <li>KTP + Kartu Keluarga (Wajib) dalam 1 file PDF</li>
                                    </ul>
                                </div>

                                <div className="pt-6 border-t border-primary-800 mt-6">
                                    <p className="font-medium text-white mb-2">Tujuan Transfer UTJ:</p>
                                    <div className="rounded-xl border border-primary-700 bg-primary-950/40 px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.08em] text-primary-200/80">Bank Tujuan</p>
                                        <p className="mt-1 text-base font-semibold text-white">
                                            {destinationBankName || 'Belum diatur admin'}
                                        </p>
                                        <p className="mt-3 text-xs uppercase tracking-[0.08em] text-primary-200/80">No. Rekening Tujuan</p>
                                        <p className="mt-1 text-base font-semibold text-white">
                                            {destinationAccountNumber || 'Belum diatur admin'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card className="shadow-xl border-gray-100 bg-white">
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className={bookingSectionClassName}>
                                    <div className={bookingSectionHeaderClassName}>
                                        <div className={bookingSectionTitleClassName}>
                                            <span className={bookingSectionStepClassName}>1</span>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">Data Pemesan</h3>
                                                <p className="text-sm text-slate-500">
                                                    Lengkapi identitas dan data finansial pemesan dengan benar.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`${bookingSectionContentClassName} space-y-5`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <Input
                                            label="Nama Lengkap"
                                            placeholder="Sesuai KTP"
                                            value={userForm.nama}
                                            onChange={(e) => setUserForm((prev) => ({ ...prev, nama: e.target.value }))}
                                            required
                                        />
                                        <Input
                                            label="No. WhatsApp"
                                            placeholder="08xxxxxxxxxx"
                                            value={userForm.no_hp}
                                            onChange={(e) => setUserForm((prev) => ({ ...prev, no_hp: formatPhoneForDisplay(normalizePhone(e.target.value)) }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-5">
                                        <Input
                                            label="Alamat Email"
                                            type="email"
                                            placeholder="email@contoh.com"
                                            value={userForm.email}
                                            onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                                            required
                                        />
                                        <Input
                                            label="Alamat Domisili"
                                            placeholder="Alamat lengkap saat ini"
                                            value={userForm.alamat}
                                            onChange={(e) => setUserForm((prev) => ({ ...prev, alamat: e.target.value }))}
                                            required
                                        />
                                        <Input
                                            label="No. Rekening"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Masukkan nomor rekening Anda"
                                            value={userForm.no_rekening}
                                            onChange={(e) => {
                                                setFormError('');
                                                setUserForm((prev) => ({ ...prev, no_rekening: parseAccountNumberInput(e.target.value) }));
                                            }}
                                            required
                                        />
                                        <div className="w-full">
                                            <Input
                                                label="Nominal DP yang Akan Dibayarkan"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Rp 0"
                                                value={userForm.range_harga_dp}
                                                onChange={(e) => {
                                                    setFormError('');
                                                    const digitsOnly = parseCurrencyInput(e.target.value);
                                                    setUserForm((prev) => ({
                                                        ...prev,
                                                        range_harga_dp: digitsOnly ? formatCurrencyInput(digitsOnly) : '',
                                                    }));
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <Input
                                                label="Pekerjaan"
                                                placeholder="Contoh: Karyawan Swasta"
                                                value={userForm.pekerjaan}
                                                onChange={(e) => setUserForm((prev) => ({ ...prev, pekerjaan: e.target.value }))}
                                                required
                                            />
                                            <div className="w-full">
                                                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Jenis Pekerjaan</label>
                                                <select
                                                    value={userForm.jenis_pekerjaan}
                                                    onChange={(e) => setUserForm((prev) => ({ ...prev, jenis_pekerjaan: e.target.value }))}
                                                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 hover:border-gray-400"
                                                    required
                                                >
                                                    <option value="fixed_income">Fixed Income</option>
                                                    <option value="non_fixed_income">Non Fixed Income</option>
                                                </select>
                                            </div>
                                        </div>
                                        <Input
                                            label="Gaji per Bulan"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Rp 0"
                                            value={userForm.gaji_bulanan}
                                            onChange={handleSalaryChange}
                                            required
                                        />
                                        <div className="w-full">
                                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                                Apakah Anda memiliki angsuran lain yang sedang berjalan?
                                            </label>
                                            <select
                                                value={userForm.memiliki_angsuran_lain}
                                                onChange={(e) => setUserForm((prev) => ({ ...prev, memiliki_angsuran_lain: e.target.value }))}
                                                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 hover:border-gray-400"
                                                required
                                            >
                                                <option value="0">Tidak</option>
                                                <option value="1">Ya</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                </div>

                                <div className={bookingSectionClassName}>
                                    <div className={bookingSectionHeaderClassName}>
                                        <div className={bookingSectionTitleClassName}>
                                            <span className={bookingSectionStepClassName}>2</span>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">Upload Dokumen PDF</h3>
                                                <p className="text-sm text-slate-500">
                                                    Unggah berkas utama booking dalam satu file PDF yang rapi.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={bookingSectionContentClassName}>
                                    <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-8 text-center hover:bg-gray-50 transition-all duration-300 cursor-pointer relative group">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleFileChange}
                                            accept=".pdf,application/pdf"
                                            required
                                        />
                                        {file ? (
                                            <div className="flex flex-col items-center animate-in zoom-in duration-200">
                                                {preview ? (
                                                    <img src={preview} alt="Preview" className="h-40 object-contain mb-4 rounded-lg shadow-md" />
                                                ) : (
                                                    <FaFilePdf className="text-5xl text-red-500 mb-4" />
                                                )}
                                                <p className="font-bold text-gray-900 text-lg">{file.name}</p>
                                                <p className="text-sm text-gray-500 mb-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                <Badge variant="success" className="bg-green-100 text-green-700">File Siap Upload</Badge>
                                                <p className="text-primary-600 text-sm mt-4 font-medium group-hover:underline">Klik untuk ganti file</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
                                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-primary-500 text-3xl">
                                                    <FaCloudUploadAlt />
                                                </div>
                                                <p className="font-medium text-gray-700 text-lg">Klik atau seret 1 file PDF ke sini</p>
                                                <p className="text-sm text-gray-400 mt-2">Isi file: gabungan KTP + Kartu Keluarga (Max 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                </div>

                                <div className={bookingSectionClassName}>
                                    <div
                                        className={bookingSectionHeaderClassName}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setShowTerms((prev) => !prev)}
                                            className="flex w-full items-center justify-between gap-4 text-left"
                                            aria-expanded={showTerms}
                                        >
                                            <div className={bookingSectionTitleClassName}>
                                                <span className={bookingSectionStepClassName}>3</span>
                                                <div>
                                                    <h3 className="font-bold text-xl text-gray-900">Syarat dan Ketentuan Booking</h3>
                                                    <p className="text-sm text-slate-500">
                                                        Klik untuk {showTerms ? 'menyembunyikan' : 'menampilkan'} detail syarat booking.
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`${bookingSectionPillClassName} gap-2`}>
                                                {showTerms ? 'Sembunyikan' : 'Tampilkan'}
                                                {showTerms ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                                            </span>
                                        </button>
                                    </div>

                                        {showTerms && (
                                            <div className={`${bookingSectionContentClassName} space-y-4`}>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge className="bg-white text-slate-700 border-slate-200">
                                                        Kategori Unit: {propertyCategoryLabel}
                                                    </Badge>
                                                    {applicableBookingFee !== null && (
                                                        <Badge className="bg-primary-50 text-primary-700 border-primary-200">
                                                            UTJ Berlaku: {formatMoney(applicableBookingFee)}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
                                                    <li className="text-justify">
                                                        Konsumen yang melakukan booking pada perumahan subsidi diwajibkan membayar sebesar Rp2.000.000
                                                        (dua juta rupiah) sebagai Uang Tanda Jadi (UTJ) atau booking fee. Pembayaran ini merupakan bukti
                                                        komitmen dan keseriusan konsumen dalam melakukan pemesanan unit rumah.
                                                    </li>
                                                    <li className="text-justify">
                                                        Konsumen yang melakukan booking pada perumahan komersial diwajibkan membayar sebesar Rp5.000.000
                                                        (lima juta rupiah) sebagai Uang Tanda Jadi (UTJ) atau booking fee.
                                                    </li>
                                                    <li className="text-justify">
                                                        Konsumen wajib melengkapi dan menyerahkan seluruh berkas persyaratan kepada pihak developer
                                                        perumahan dalam waktu maksimal 7 (tujuh) hari sejak status booking disetujui oleh admin.
                                                        Apabila dalam jangka waktu tersebut berkas tidak dilengkapi, maka proses booking akan dibatalkan
                                                        secara otomatis oleh sistem.
                                                    </li>
                                                    <li className="text-justify">
                                                        Apabila terjadi kegagalan dalam proses booking yang disebabkan oleh faktor eksternal, seperti
                                                        penolakan pengajuan KPR oleh pihak bank, maka Uang Tanda Jadi (UTJ) akan dikembalikan sebesar
                                                        100% (seratus persen) kepada konsumen.
                                                    </li>
                                                    <li className="text-justify">
                                                        Apabila konsumen mengundurkan diri secara sepihak setelah proses booking disetujui oleh pihak
                                                        bank tanpa alasan yang dapat dipertanggungjawabkan, maka Uang Tanda Jadi (UTJ) tidak dapat
                                                        dikembalikan.
                                                    </li>
                                                </ol>
                                            </div>
                                        )}

                                        <div className="border-t border-slate-200 px-5 py-4 md:px-6">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={hasAgreedToTerms}
                                                    onChange={(e) => {
                                                        setFormError('');
                                                        setHasAgreedToTerms(e.target.checked);
                                                    }}
                                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-sm leading-6 text-slate-700">
                                                    Saya telah membaca dan menyetujui seluruh syarat dan ketentuan booking yang berlaku.
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                <div className={bookingSectionClassName}>
                                    <div className={bookingSectionHeaderClassName}>
                                        <div className={bookingSectionTitleClassName}>
                                            <span className={bookingSectionStepClassName}>4</span>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">Transfer UTJ dan Upload Bukti</h3>
                                                <p className="text-sm text-slate-500">
                                                    Upload bukti transfer UTJ setelah pembayaran dilakukan ke rekening tujuan.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`${bookingSectionContentClassName} space-y-5`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Nominal UTJ</p>
                                                <p className="mt-1 text-lg font-semibold text-slate-900">
                                                    {applicableBookingFee !== null ? formatMoney(applicableBookingFee) : 'Sesuai kebijakan developer'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">No. Rekening Tujuan</p>
                                                <p className="mt-1 text-lg font-semibold text-slate-900">
                                                    {destinationAccountNumber || 'Belum diatur admin'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Transfer Uang Tanda Jadi (UTJ) terlebih dahulu ke rekening tujuan di atas, lalu upload bukti transfer.
                                        </div>

                                        <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-8 text-center hover:bg-gray-50 transition-all duration-300 cursor-pointer relative group">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={handleTransferProofChange}
                                                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                                required
                                            />
                                            {transferProofFile ? (
                                                <div className="flex flex-col items-center animate-in zoom-in duration-200">
                                                    {transferProofPreview ? (
                                                        <img src={transferProofPreview} alt="Preview bukti transfer" className="h-40 object-contain mb-4 rounded-lg shadow-md" />
                                                    ) : (
                                                        <FaCloudUploadAlt className="text-5xl text-primary-500 mb-4" />
                                                    )}
                                                    <p className="font-bold text-gray-900 text-lg">{transferProofFile.name}</p>
                                                    <p className="text-sm text-gray-500 mb-2">{(transferProofFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    <Badge variant="success" className="bg-green-100 text-green-700">Bukti Transfer Siap Upload</Badge>
                                                    <p className="text-primary-600 text-sm mt-4 font-medium group-hover:underline">Klik untuk ganti file</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
                                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-primary-500 text-3xl">
                                                        <FaCloudUploadAlt />
                                                    </div>
                                                    <p className="font-medium text-gray-700 text-lg">Klik atau pilih bukti transfer UTJ</p>
                                                    <p className="text-sm text-gray-400 mt-2">Format JPG, JPEG, PNG dengan ukuran maksimal 1MB</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <Button type="submit" className="w-full text-lg h-14 font-bold shadow-lg shadow-primary-600/20 hover:translate-y-[-2px]" size="lg" disabled={submitting}>
                                        {submitting ? (
                                            <span className="flex items-center"><FaSpinner className="animate-spin mr-2" /> Memproses Booking...</span>
                                        ) : (
                                            'Kirim Booking Sekarang'
                                        )}
                                    </Button>
                                    {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
                                    <p className="text-xs text-center text-gray-400 mt-4 max-w-md mx-auto">
                                        Dengan mengklik tombol di atas, Anda menyetujui syarat dan ketentuan booking serta kebijakan privasi Zavira Mecca Property.
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
