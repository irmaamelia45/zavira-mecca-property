import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaSave, FaTimes, FaTrashAlt, FaImage } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import PropertyUnitConfigTable from '../../components/admin/PropertyUnitConfigTable';
import { appendPropertyFormData, mapApiPropertyToForm, normalizeImageSlots } from '../../utils/property';
import { authHeaders } from '../../lib/auth';
import { apiJson } from '../../lib/api';
import { formatPhoneForDisplay, normalizePhone } from '../../lib/phone';
import { createPropertyUnitBlock, normalizePropertyUnitBlocks } from '../../utils/propertyUnits';

export default function EditProperty() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState(null);
    const [imageSlots, setImageSlots] = useState(() => normalizeImageSlots([]));
    const [marketingOptions, setMarketingOptions] = useState([]);
    const [loadingMarketingOptions, setLoadingMarketingOptions] = useState(true);

    const parseCurrencyInput = (value) => String(value || '').replace(/\D/g, '');
    const formatCurrencyInput = (value) => {
        const digitsOnly = parseCurrencyInput(value);
        if (!digitsOnly) return '';
        return `Rp ${new Intl.NumberFormat('id-ID').format(Number(digitsOnly))}`;
    };

    useEffect(() => {
        const fetchDetail = async () => {
            setIsFetching(true);
            setFormError('');
            try {
                const data = await apiJson(`/admin/perumahan/${id}`, {
                    headers: authHeaders(),
                    defaultErrorMessage: 'Gagal memuat detail perumahan.',
                });
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

    useEffect(() => {
        const fetchMarketingOptions = async () => {
            setLoadingMarketingOptions(true);
            try {
                const data = await apiJson('/admin/users/marketing', {
                    headers: authHeaders(),
                    defaultErrorMessage: 'Gagal memuat daftar marketing.',
                });
                const options = (Array.isArray(data) ? data : [])
                    .filter((item) => Boolean(item?.is_active))
                    .map((item) => ({
                        id: item?.id,
                        nama: item?.nama || '',
                        no_hp: item?.no_hp || '',
                    }));

                setMarketingOptions(options);
            } catch (err) {
                setFormError(err.message || 'Gagal memuat daftar marketing.');
            } finally {
                setLoadingMarketingOptions(false);
            }
        };

        fetchMarketingOptions();
    }, []);

    const setField = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const setSelectedMarketing = (marketingId) => {
        const selected = marketingOptions.find((item) => String(item.id) === String(marketingId));
        setFormData((prev) => ({
            ...prev,
            marketingUserId: marketingId,
            marketingName: selected?.nama || '',
            marketingWhatsapp: formatPhoneForDisplay(selected?.no_hp || '') || '',
        }));
    };

    useEffect(() => {
        if (!formData || !marketingOptions.length) {
            return;
        }

        if (String(formData.marketingUserId || '').trim() !== '') {
            const selected = marketingOptions.find((item) => String(item.id) === String(formData.marketingUserId));
            if (!selected) {
                return;
            }

            const nextWhatsapp = formatPhoneForDisplay(selected.no_hp || '') || '';
            if (formData.marketingName !== selected.nama || formData.marketingWhatsapp !== nextWhatsapp) {
                setFormData((prev) => ({
                    ...prev,
                    marketingName: selected.nama,
                    marketingWhatsapp: nextWhatsapp,
                }));
            }

            return;
        }

        const normalizedWhatsapp = normalizePhone(formData.marketingWhatsapp || '');
        const matched = marketingOptions.find((item) => (
            item.nama === formData.marketingName || item.no_hp === normalizedWhatsapp
        ));

        if (matched) {
            const matchedWhatsapp = formatPhoneForDisplay(matched.no_hp || '') || '';
            setFormData((prev) => ({
                ...prev,
                marketingUserId: String(matched.id),
                marketingName: matched.nama,
                marketingWhatsapp: matchedWhatsapp,
            }));
        }
    }, [formData, marketingOptions]);

    const updateBlock = (index, key, value) => {
        setFormData((prev) => ({
            ...prev,
            unitBlocks: normalizePropertyUnitBlocks((prev.unitBlocks || []).map((item, itemIndex) => (
                itemIndex === index ? { ...item, [key]: value } : item
            ))),
        }));
    };

    const addBlockRow = () => {
        const nextIndex = (formData?.unitBlocks || []).length;
        setFormData((prev) => ({
            ...prev,
            unitBlocks: normalizePropertyUnitBlocks([
                ...(prev.unitBlocks || []),
                createPropertyUnitBlock(nextIndex),
            ]),
        }));
    };

    const removeBlockRow = (index) => {
        setFormData((prev) => {
            const nextBlocks = (prev.unitBlocks || []).filter((_, itemIndex) => itemIndex !== index);
            return {
                ...prev,
                unitBlocks: normalizePropertyUnitBlocks(nextBlocks),
            };
        });
    };

    const updateUnitConfig = (blockIndex, unitIndex, field, value) => {
        setFormData((prev) => ({
            ...prev,
            unitBlocks: normalizePropertyUnitBlocks((prev.unitBlocks || []).map((block, currentBlockIndex) => {
                if (currentBlockIndex !== blockIndex) {
                    return block;
                }

                return {
                    ...block,
                    units: (block.units || []).map((unit, currentUnitIndex) => (
                        currentUnitIndex === unitIndex ? { ...unit, [field]: value } : unit
                    )),
                };
            })),
        }));
    };

    const totalUnitsFromBlocks = (formData?.unitBlocks || []).reduce(
        (total, item) => total + (Number(item?.unitCount) || 0),
        0
    );

    const handlePriceChange = (event) => {
        setField('price', parseCurrencyInput(event.target.value));
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
        if (String(formData.kprInterest ?? '').trim() === '') return 'Suku bunga KPR wajib diisi.';
        const kprInterest = Number(formData.kprInterest);
        if (Number.isNaN(kprInterest)) return 'Suku bunga KPR harus berupa angka.';
        if (kprInterest < 0 || kprInterest > 100) return 'Suku bunga KPR harus di antara 0% sampai 100%.';
        if (!(formData.unitBlocks || []).length) return 'Minimal satu blok unit wajib diisi.';
        const hasInvalidBlock = (formData.unitBlocks || []).some((item) => (
            !String(item?.blockName || '').trim() || Number(item?.unitCount) < 1
        ));
        if (hasInvalidBlock) return 'Nama blok dan jumlah unit per blok harus valid.';
        if (totalUnitsFromBlocks < 1) return 'Jumlah unit minimal 1.';
        const invalidIndentUnit = (formData.unitBlocks || [])
            .flatMap((block) => block.units || [])
            .find((unit) => unit.salesMode === 'indent' && !String(unit.estimatedCompletionDate || '').trim());
        if (invalidIndentUnit) {
            return `Estimasi selesai untuk unit ${invalidIndentUnit.code} wajib diisi jika mode penjualan Indent.`;
        }
        if (!String(formData.marketingUserId || '').trim()) return 'Pilih marketing dari akun yang terdaftar.';
        if (!String(formData.bankNameUtj || '').trim()) return 'Nama bank tujuan UTJ wajib diisi.';
        if (!String(formData.noRekeningUtj || '').trim()) return 'No. rekening tujuan UTJ wajib diisi.';
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
            await apiJson(`/admin/perumahan/${id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: payload,
                defaultErrorMessage: 'Gagal memperbarui perumahan.',
            });

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
                                <Input
                                    label="Harga (Rp)"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Rp 0"
                                    value={formatCurrencyInput(formData.price)}
                                    onChange={handlePriceChange}
                                    required
                                />
                                <Input
                                    label="Suku Bunga KPR (%)"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={formData.kprInterest}
                                    onChange={(e) => setField('kprInterest', e.target.value)}
                                    placeholder="Contoh: 8.50"
                                    required
                                />
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Nama Bank Tujuan UTJ"
                                        value={formData.bankNameUtj || ''}
                                        onChange={(e) => setField('bankNameUtj', e.target.value)}
                                        placeholder="Contoh: BCA, BRI, Mandiri"
                                        required
                                    />
                                    <Input
                                        label="No. Rekening Tujuan UTJ"
                                        value={formData.noRekeningUtj || ''}
                                        onChange={(e) => setField('noRekeningUtj', e.target.value.replace(/\D/g, ''))}
                                        placeholder="Masukkan nomor rekening tujuan UTJ"
                                        inputMode="numeric"
                                        required
                                    />
                                </div>
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
                                        <p className="text-xs text-gray-500">Perubahan unit terbooking atau terjual akan ditolak otomatis oleh sistem.</p>
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

                                <PropertyUnitConfigTable
                                    unitBlocks={formData.unitBlocks || []}
                                    onUnitFieldChange={updateUnitConfig}
                                    helperText="Atur mode penjualan unit di halaman edit ini. Simpan perubahan perumahan untuk menerapkan pembaruan unit."
                                />
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Pilih Marketing</label>
                                    <select
                                        value={formData.marketingUserId || ''}
                                        onChange={(e) => setSelectedMarketing(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        required
                                        disabled={loadingMarketingOptions}
                                    >
                                        <option value="">{loadingMarketingOptions ? 'Memuat akun marketing...' : 'Pilih akun marketing'}</option>
                                        {marketingOptions.map((marketing) => (
                                            <option key={marketing.id} value={marketing.id}>
                                                {marketing.nama} - {formatPhoneForDisplay(marketing.no_hp) || marketing.no_hp}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Input label="Nama Marketing (Otomatis)" value={formData.marketingName || '-'} readOnly />
                                <Input label="WhatsApp Marketing (Otomatis)" value={formData.marketingWhatsapp || '-'} readOnly />
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
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Foto Perumahan (Maks 5)</h3>
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
