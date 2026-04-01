import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { API_BASE } from '../../utils/promo';
import { authHeaders } from '../../lib/auth';

export default function AddPromo() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        promoType: 'percent',
        promoValue: '',
        propertyIds: [],
        startDate: '',
        endDate: '',
        isActive: true,
        description: '',
    });
    const [formErrors, setFormErrors] = useState({});

    const [propertyOptions, setPropertyOptions] = useState([]);
    const [propertyLoading, setPropertyLoading] = useState(true);
    const [propertyError, setPropertyError] = useState('');

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/admin/perumahan/options`, {
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Gagal memuat data perumahan.');
                }
                const data = await response.json();
                setPropertyOptions(data || []);
            } catch (err) {
                setPropertyError(err.message || 'Gagal memuat data perumahan.');
            } finally {
                setPropertyLoading(false);
            }
        };

        fetchProperties();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const toggleProperty = (id) => {
        setFormData(prev => {
            const exists = prev.propertyIds.includes(id);
            const next = exists
                ? prev.propertyIds.filter((item) => item !== id)
                : [...prev.propertyIds, id];
            return { ...prev, propertyIds: next };
        });
        if (formErrors.propertyIds) {
            setFormErrors(prev => ({ ...prev, propertyIds: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = {};

        if (!formData.title.trim()) {
            nextErrors.title = 'Judul promo wajib diisi.';
        }
        if (!formData.promoType) {
            nextErrors.promoType = 'Tipe promo wajib dipilih.';
        }
        if (formData.promoType !== 'none' && !formData.promoValue) {
            nextErrors.promoValue = 'Nilai promo wajib diisi.';
        }
        if (formData.propertyIds.length === 0) {
            nextErrors.propertyIds = 'Pilih minimal satu perumahan.';
        }
        if (!formData.startDate) {
            nextErrors.startDate = 'Tanggal mulai wajib diisi.';
        }
        if (!formData.endDate) {
            nextErrors.endDate = 'Tanggal selesai wajib diisi.';
        }
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            nextErrors.endDate = 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
        }

        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setIsLoading(true);
        try {
            const payload = new FormData();
            payload.append('judul', formData.title);
            payload.append('kategori', formData.category);
            payload.append('tipe_promo', formData.promoType);
            payload.append('nilai_promo', formData.promoValue || 0);
            payload.append('tanggal_mulai', formData.startDate);
            payload.append('tanggal_selesai', formData.endDate);
            payload.append('is_active', formData.isActive ? 1 : 0);
            payload.append('deskripsi', formData.description || '');
            formData.propertyIds.forEach((id) => payload.append('property_ids[]', id));

            const response = await fetch(`${API_BASE}/api/promos`, {
                method: 'POST',
                headers: authHeaders(),
                body: payload,
            });

            if (!response.ok) {
                const message = await response.json().catch(() => ({}));
                throw new Error(message?.message || 'Gagal menyimpan promo.');
            }

            alert('Promo Berhasil Ditambahkan!');
            navigate('/admin/promos');
        } catch (err) {
            setFormErrors((prev) => ({ ...prev, submit: err.message || 'Gagal menyimpan promo.' }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin/promos')} className="p-2">
                        <FaArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary-900">Tambah Promo Baru</h1>
                        <p className="text-gray-500 text-sm">Buat promo menarik untuk pelanggan.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/admin/promos')}>Batal</Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary-600 hover:bg-primary-700 text-white">
                        {isLoading ? 'Menyimpan...' : <><FaSave className="mr-2" /> Simpan Promo</>}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <Card className="border-none shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Detail Promo</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Judul Promo</label>
                                <Input
                                    name="title"
                                    placeholder="Contoh: Diskon DP 50% Akhir Tahun"
                                    value={formData.title}
                                    onChange={handleChange}
                                    error={formErrors.title}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Kategori Promo</label>
                                    <Input
                                        name="category"
                                        placeholder="Contoh: DP, Cashback, Biaya"
                                        value={formData.category}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Status Promo</label>
                                    <select
                                        name="isActive"
                                        value={formData.isActive ? 'true' : 'false'}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="true">Aktif</option>
                                        <option value="false">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Tipe Promo</label>
                                    <select
                                        name="promoType"
                                        value={formData.promoType}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="percent">Diskon Persen</option>
                                        <option value="amount">Potongan Nominal</option>
                                        <option value="none">Info Promo (tanpa potongan)</option>
                                    </select>
                                    {formErrors.promoType && (
                                        <p className="text-xs text-red-600 font-medium">{formErrors.promoType}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Nilai Promo</label>
                                    <Input
                                        name="promoValue"
                                        type="number"
                                        min="0"
                                        placeholder="Contoh: 10 atau 5000000"
                                        value={formData.promoValue}
                                        onChange={handleChange}
                                        error={formErrors.promoValue}
                                        disabled={formData.promoType === 'none'}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Perumahan Terkait</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {propertyLoading ? (
                                        <p className="text-sm text-gray-500">Memuat data perumahan...</p>
                                    ) : propertyOptions.length === 0 ? (
                                        <p className="text-sm text-gray-500">Data perumahan belum tersedia.</p>
                                    ) : (
                                        propertyOptions.map((opt) => (
                                            <label key={opt.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.propertyIds.includes(opt.id)}
                                                    onChange={() => toggleProperty(opt.id)}
                                                    className="rounded text-primary-600 focus:ring-primary-500"
                                                />
                                                <span>{opt.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {formErrors.propertyIds && (
                                    <p className="text-xs text-red-600 font-medium">{formErrors.propertyIds}</p>
                                )}
                                {propertyError && <p className="text-xs text-red-600 font-medium">{propertyError}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                                    <Input
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        error={formErrors.startDate}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Tanggal Selesai</label>
                                    <Input
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        error={formErrors.endDate}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Deskripsi Promo</label>
                                <textarea
                                    name="description"
                                    rows="6"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Jelaskan detail promo, syarat, dan ketentuan..."
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>
                            {formErrors.submit && (
                                <p className="text-sm text-red-600 font-medium">{formErrors.submit}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
