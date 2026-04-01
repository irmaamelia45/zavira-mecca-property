import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { FaCloudUploadAlt, FaFilePdf, FaImage, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { API_BASE, mapPromoFromApi, getPromoPricing as calculatePromoPricing } from '../utils/promo';
import { authHeaders, getStoredUser } from '../lib/auth';

export default function Booking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [propertyLoading, setPropertyLoading] = useState(true);
    const [propertyError, setPropertyError] = useState('');
    const [property, setProperty] = useState(null);
    const [promos, setPromos] = useState([]);
    const [formError, setFormError] = useState('');
    const [userForm, setUserForm] = useState({
        nama: '',
        no_hp: '',
        email: '',
        alamat: '',
        pekerjaan: '',
        jenis_pekerjaan: 'fixed_income',
        gaji_bulanan: '',
    });

    // Form State
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const extractApiError = (data, fallback) => {
        if (data?.errors && typeof data.errors === 'object') {
            const firstError = Object.values(data.errors).flat().find(Boolean);
            if (firstError) return String(firstError);
        }

        if (data?.message) return String(data.message);
        return fallback;
    };

    const parseCurrencyInput = (value) => String(value || '').replace(/\D/g, '');
    const formatCurrencyInput = (value) => {
        const digitsOnly = parseCurrencyInput(value);
        if (!digitsOnly) return '';
        return `Rp ${new Intl.NumberFormat('id-ID').format(Number(digitsOnly))}`;
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
                setFormError('Dokumen harus berupa 1 file PDF gabungan KTP dan slip gaji.');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');

        try {
            const payload = new FormData();
            if (!property?.id) {
                throw new Error('Data perumahan tidak ditemukan.');
            }

            payload.append('id_perumahan', String(property.id));
            payload.append('pekerjaan', userForm.pekerjaan);
            payload.append('jenis_pekerjaan', userForm.jenis_pekerjaan);
            payload.append('gaji_bulanan', String(parseCurrencyInput(userForm.gaji_bulanan) || '0'));

            if (!file) {
                throw new Error('Mohon upload 1 file PDF gabungan KTP dan slip gaji.');
            }

            if (file) {
                payload.append('dokumen', file);
            }

            const response = await fetch(`${API_BASE}/api/bookings`, {
                method: 'POST',
                headers: authHeaders(),
                body: payload,
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(extractApiError(data, 'Gagal mengirim booking.'));
            }

            setSubmitting(false);
            setSuccess(true);
            setTimeout(() => {
                navigate('/'); // Redirect to home or dashboard
            }, 3000);
        } catch (err) {
            setFormError(err.message || 'Gagal mengirim booking.');
            setSubmitting(false);
        }
    };

    const formatMoney = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    useEffect(() => {
        const fetchProperty = async () => {
            setPropertyLoading(true);
            setPropertyError('');
            try {
                const response = await fetch(`${API_BASE}/api/perumahan/${id}`);
                if (!response.ok) {
                    throw new Error('Data perumahan tidak ditemukan.');
                }
                const data = await response.json();
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
                nama: user.nama || '',
                no_hp: user.no_hp || '',
                email: user.email || '',
                alamat: user.alamat || '',
            }));
        }
    }, []);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/promos`);
                if (!response.ok) {
                    throw new Error('Gagal memuat promo.');
                }
                const data = await response.json();
                setPromos((data || []).map(mapPromoFromApi));
            } catch (err) {
                // Silent fail for booking pricing
            }
        };

        fetchPromos();
    }, []);

    const basePrice = Number(property?.price) || 0;
    const promoPricing = calculatePromoPricing(promos, property?.id, basePrice);

    const finalPrice = Math.max(0, basePrice - promoPricing.discount);

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

    return (
        <div className="container-custom py-10 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">Formulir Booking Unit</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Info Column */}
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
                                    <p className="font-medium text-white mb-2">Persyaratan Dokumen:</p>
                                    <ul className="list-disc pl-4 space-y-2 text-sm">
                                        <li>KTP + Slip Gaji (Wajib) dalam 1 file PDF</li>
                                        <li>NPWP (Opsional, gabungkan di PDF yang sama jika ada)</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Form Column */}
                <div className="md:col-span-2">
                    <Card className="shadow-xl border-gray-100 bg-white">
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
                                        <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                                        Data Pemesan
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                        <Input
                                            label="Nama Lengkap"
                                            placeholder="Sesuai KTP"
                                            value={userForm.nama}
                                            onChange={(e) => setUserForm((prev) => ({ ...prev, nama: e.target.value }))}
                                            required
                                        />
                                        <Input
                                            label="No. WhatsApp"
                                            placeholder="0812..."
                                            value={userForm.no_hp}
                                            onChange={(e) => setUserForm((prev) => ({ ...prev, no_hp: e.target.value }))}
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
                                                    className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 hover:border-gray-400"
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
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-8">
                                    <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
                                        <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                                        Upload Dokumen PDF
                                    </h3>

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-all duration-300 cursor-pointer relative group">
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
                                                <p className="text-sm text-gray-400 mt-2">Isi file: gabungan KTP + slip gaji (Max 5MB)</p>
                                            </div>
                                        )}
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
                                        Dengan mengklik tombol di atas, Anda menyetujui syarat & ketentuan serta kebijakan privasi Zavira Mecca Property.
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
