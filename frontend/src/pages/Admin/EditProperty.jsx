import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaSave, FaTimes, FaTrashAlt, FaImage } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { API_BASE, appendPropertyFormData, isValidWhatsapp62, mapApiPropertyToForm, normalizeImageSlots } from '../../utils/property';
import { authHeaders } from '../../lib/auth';

const facilityOptions = [
    'Masjid',
    'Taman Bermain',
    'Keamanan 24 Jam',
    'One Gate System',
    'Dekat Tol',
    'Dekat Sekolah',
    'Dekat Pasar',
    'Bebas Banjir',
];

export default function EditProperty() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState(null);
    const [imageSlots, setImageSlots] = useState(() => normalizeImageSlots([]));

    const extractApiError = (data, fallback) => {
        if (data?.errors && typeof data.errors === 'object') {
            const firstError = Object.values(data.errors).flat().find(Boolean);
            if (firstError) return String(firstError);
        }

        if (data?.message) return String(data.message);
        return fallback;
    };

    useEffect(() => {
        const fetchDetail = async () => {
            setIsFetching(true);
            setFormError('');
            try {
                const response = await fetch(`${API_BASE}/api/admin/perumahan/${id}`, {
                    headers: authHeaders(),
                });
                if (!response.ok) {
                    throw new Error('Gagal memuat detail perumahan.');
                }
                const data = await response.json();
                setFormData(mapApiPropertyToForm(data));
                setImageSlots(normalizeImageSlots(data.images || []));
            } catch (err) {
                setFormError(err.message || 'Gagal memuat detail perumahan.');
            } finally {
                setIsFetching(false);
            }
        };

        fetchDetail();
    }, [id]);

    const setField = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const updateBlock = (index, key, value) => {
        setFormData((prev) => ({
            ...prev,
            unitBlocks: (prev.unitBlocks || []).map((item, itemIndex) => (
                itemIndex === index ? { ...item, [key]: value } : item
            )),
        }));
    };

    const addBlockRow = () => {
        const nextIndex = (formData?.unitBlocks || []).length;
        setFormData((prev) => ({
            ...prev,
            unitBlocks: [
                ...(prev.unitBlocks || []),
                { blockName: `Blok ${String.fromCharCode(65 + Math.min(nextIndex, 25))}`, unitCount: 1 },
            ],
        }));
    };

    const removeBlockRow = (index) => {
        setFormData((prev) => {
            const nextBlocks = (prev.unitBlocks || []).filter((_, itemIndex) => itemIndex !== index);
            return {
                ...prev,
                unitBlocks: nextBlocks.length ? nextBlocks : [{ blockName: 'Blok A', unitCount: 1 }],
            };
        });
    };

    const totalUnitsFromBlocks = (formData?.unitBlocks || []).reduce(
        (total, item) => total + (Number(item?.unitCount) || 0),
        0
    );

    const toggleFacility = (facility) => {
        setFormData((prev) => {
            const exists = prev.facilities.includes(facility);
            return {
                ...prev,
                facilities: exists
                    ? prev.facilities.filter((item) => item !== facility)
                    : [...prev.facilities, facility],
            };
        });
    };

    const handleSlotFile = (index, file) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setImageSlots((prev) => prev.map((slot) => (
            slot.index === index
                ? { ...slot, file, preview, url: preview, originalPath: '' }
                : slot
        )));
    };

    const clearSlot = (index) => {
        setImageSlots((prev) => prev.map((slot) => (
            slot.index === index
                ? { ...slot, file: null, preview: '', url: '', originalPath: '' }
                : slot
        )));
    };

    const validate = () => {
        if (!formData?.name?.trim()) return 'Nama perumahan wajib diisi.';
        if (!formData.price) return 'Harga wajib diisi.';
        if (!(formData.unitBlocks || []).length) return 'Minimal satu blok unit wajib diisi.';
        const hasInvalidBlock = (formData.unitBlocks || []).some((item) => (
            !String(item?.blockName || '').trim() || Number(item?.unitCount) < 1
        ));
        if (hasInvalidBlock) return 'Nama blok dan jumlah unit per blok harus valid.';
        if (totalUnitsFromBlocks < 1) return 'Jumlah unit minimal 1.';
        if (!formData.marketingName?.trim()) return 'Nama marketing wajib diisi.';
        if (!isValidWhatsapp62(formData.marketingWhatsapp)) return 'Nomor WhatsApp harus diawali 62 dan hanya angka.';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validate();
        if (error) {
            setFormError(error);
            return;
        }

        setIsLoading(true);
        setFormError('');
        try {
            const payloadFormData = {
                ...formData,
                totalUnits: totalUnitsFromBlocks,
                availableUnits: formData.availableUnits ?? totalUnitsFromBlocks,
            };
            const payload = appendPropertyFormData(payloadFormData, imageSlots, { methodOverride: 'PUT' });
            const response = await fetch(`${API_BASE}/api/admin/perumahan/${id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: payload,
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(extractApiError(data, 'Gagal memperbarui perumahan.'));
            }

            navigate('/admin/properties');
        } catch (err) {
            setFormError(err.message || 'Gagal memperbarui perumahan.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching || !formData) {
        return <div className="p-8 text-center text-gray-500">Memuat data perumahan...</div>;
    }

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin/properties')} className="p-2 shrink-0">
                        <FaArrowLeft />
                    </Button>
                    <div>
                        <h1 className="admin-page-title text-2xl font-bold text-primary-900">Edit Perumahan</h1>
                        <p className="admin-page-subtitle text-gray-500 text-sm">Perubahan akan tampil langsung di halaman user.</p>
                    </div>
                </div>
                <div className="admin-page-head-actions flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <Button variant="outline" onClick={() => navigate('/admin/properties')} className="w-full sm:w-auto">Batal</Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto">
                        {isLoading ? 'Menyimpan...' : <><FaSave className="mr-2" /> Update Data</>}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Informasi Umum</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Nama Perumahan" value={formData.name} onChange={(e) => setField('name', e.target.value)} required />
                                <Input label="Harga (Rp)" type="number" value={formData.price} onChange={(e) => setField('price', e.target.value)} required />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Kategori</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        value={formData.housingType}
                                        onChange={(e) => setField('housingType', e.target.value)}
                                    >
                                        <option value="subsidi">Subsidi</option>
                                        <option value="komersil">Komersil</option>
                                        <option value="townhouse">Townhouse</option>
                                    </select>
                                </div>
                                <Input label="Tipe Unit" placeholder="Contoh: 36/60" value={formData.type} onChange={(e) => setField('type', e.target.value)} />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Label Status</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        value={formData.status}
                                        onChange={(e) => setField('status', e.target.value)}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Sold Out">Sold Out</option>
                                        <option value="Coming Soon">Coming Soon</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Status Aktif</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        value={formData.isActive ? '1' : '0'}
                                        onChange={(e) => setField('isActive', e.target.value === '1')}
                                    >
                                        <option value="1">Aktif</option>
                                        <option value="0">Nonaktif</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Spesifikasi</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <Input label="Luas Tanah (m2)" type="number" value={formData.landArea} onChange={(e) => setField('landArea', e.target.value)} />
                                <Input label="Luas Bangunan (m2)" type="number" value={formData.buildingArea} onChange={(e) => setField('buildingArea', e.target.value)} />
                                <Input label="Kamar Tidur" type="number" value={formData.bedrooms} onChange={(e) => setField('bedrooms', e.target.value)} />
                                <Input label="Kamar Mandi" type="number" value={formData.bathrooms} onChange={(e) => setField('bathrooms', e.target.value)} />
                            </div>
                            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-800">Konfigurasi Blok & Unit</h4>
                                        <p className="text-xs text-gray-500">Perubahan unit terjual/pending akan ditolak otomatis oleh sistem.</p>
                                    </div>
                                    <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addBlockRow}>
                                        <FaPlus className="mr-1" /> Tambah Blok
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {(formData.unitBlocks || []).map((block, index) => (
                                        <div key={`block-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_170px_auto] gap-2 items-end rounded-md border border-gray-200 bg-white p-3">
                                            <Input
                                                label={`Nama Blok ${index + 1}`}
                                                placeholder="Contoh: Blok A"
                                                value={block.blockName || ''}
                                                onChange={(event) => updateBlock(index, 'blockName', event.target.value)}
                                                required
                                            />
                                            <Input
                                                label="Jumlah Unit"
                                                type="number"
                                                min="1"
                                                value={block.unitCount ?? 1}
                                                onChange={(event) => updateBlock(index, 'unitCount', event.target.value)}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-11 px-3 text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => removeBlockRow(index)}
                                                disabled={(formData.unitBlocks || []).length === 1}
                                            >
                                                <FaTrashAlt />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
                                        <p className="text-xs text-gray-500">Total Unit (otomatis)</p>
                                        <p className="text-lg font-bold text-gray-900">{totalUnitsFromBlocks}</p>
                                    </div>
                                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                                        <p className="text-xs text-emerald-700">Unit Tersedia Saat Ini</p>
                                        <p className="text-lg font-bold text-emerald-800">{formData.availableUnits ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Fasilitas</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {facilityOptions.map((option) => (
                                        <label key={option} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={formData.facilities.includes(option)}
                                                onChange={() => toggleFacility(option)}
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Lokasi & Kontak</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Alamat Lengkap" value={formData.address} onChange={(e) => setField('address', e.target.value)} />
                                <Input label="Kota/Kabupaten" value={formData.city} onChange={(e) => setField('city', e.target.value)} />
                                <Input label="Lokasi Ringkas" placeholder="Contoh: Bandar Lampung" value={formData.location} onChange={(e) => setField('location', e.target.value)} />
                                <Input label="Link Google Maps" value={formData.gmapsUrl} onChange={(e) => setField('gmapsUrl', e.target.value)} />
                                <Input label="Nama Marketing" value={formData.marketingName} onChange={(e) => setField('marketingName', e.target.value)} required />
                                <Input label="WhatsApp Marketing (62...)" value={formData.marketingWhatsapp} onChange={(e) => setField('marketingWhatsapp', e.target.value.replace(/\D/g, ''))} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Deskripsi</label>
                                <textarea
                                    rows="4"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    value={formData.description}
                                    onChange={(e) => setField('description', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Foto Perumahan (Maks 4)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {imageSlots.map((slot, index) => (
                                    <div key={slot.index} className="rounded-lg border border-dashed border-gray-300 p-2 bg-gray-50">
                                        <input
                                            id={`photo-slot-edit-${index}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleSlotFile(slot.index, e.target.files?.[0])}
                                        />
                                        <label htmlFor={`photo-slot-edit-${index}`} className="block cursor-pointer">
                                            <div className="aspect-square w-full overflow-hidden rounded-md bg-white flex items-center justify-center">
                                                {slot.preview ? (
                                                    <img src={slot.preview} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="text-center text-gray-400">
                                                        <FaImage className="mx-auto mb-1" />
                                                        <p className="text-xs">Foto {index + 1}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                        {slot.preview && (
                                            <button
                                                type="button"
                                                className="mt-2 w-full rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                                onClick={() => clearSlot(slot.index)}
                                            >
                                                <FaTimes className="inline mr-1" /> Hapus
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
