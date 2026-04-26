import { resolveImage } from './promo';
import { formatPhoneForDisplay } from '../lib/phone';
import { normalizePropertyUnitBlocks } from './propertyUnits';

export const createEmptyPropertyForm = () => ({
    name: '',
    price: '',
    kprInterest: '',
    type: '',
    housingType: 'komersil',
    isActive: true,
    totalUnits: '',
    availableUnits: '',
    description: '',
    address: '',
    city: '',
    gmapsUrl: '',
    location: '',
    landArea: '',
    buildingArea: '',
    bedrooms: '',
    bathrooms: '',
    facilities: [],
    marketingUserId: '',
    marketingName: '',
    marketingWhatsapp: '',
    bankNameUtj: '',
    noRekeningUtj: '',
    unitBlocks: normalizePropertyUnitBlocks([]),
});

export const emptyPropertyForm = createEmptyPropertyForm();

export const normalizeImageSlots = (images = []) => {
    const slots = Array.from({ length: 5 }, (_, index) => ({
        index,
        url: images[index] ? resolveImage(images[index]) : '',
        preview: images[index] ? resolveImage(images[index]) : '',
        originalPath: images[index] || '',
        file: null,
    }));

    return slots;
};

export const mapApiPropertyToForm = (property) => ({
    name: property?.name || '',
    price: property?.price ?? '',
    kprInterest: property?.kprInterest ?? '',
    type: property?.type || '',
    housingType: property?.category || 'komersil',
    isActive: Boolean(property?.isActive ?? property?.statusAktif ?? true),
    totalUnits: property?.totalUnits ?? '',
    availableUnits: property?.availableUnits ?? '',
    description: property?.description || '',
    address: property?.address || '',
    city: property?.city || '',
    gmapsUrl: property?.gmapsUrl || '',
    location: property?.location || '',
    landArea: property?.land ?? '',
    buildingArea: property?.building ?? '',
    bedrooms: property?.beds ?? '',
    bathrooms: property?.baths ?? '',
    facilities: Array.isArray(property?.facilities) ? property.facilities : [],
    marketingUserId: property?.marketingUserId ?? '',
    marketingName: property?.marketingName || '',
    marketingWhatsapp: formatPhoneForDisplay(property?.marketingWhatsapp || ''),
    bankNameUtj: property?.bankNameUtj || '',
    noRekeningUtj: property?.noRekeningUtj || '',
    unitBlocks: normalizePropertyUnitBlocks(
        Array.isArray(property?.unitBlocks) && property.unitBlocks.length
            ? property.unitBlocks.map((block) => ({
                blockName: block?.blockName || '',
                unitCount: (block?.units || []).length,
                units: (block?.units || []).map((unit) => ({
                    id: unit?.id ?? null,
                    code: unit?.code || '',
                    status: unit?.status || 'available',
                    salesMode: unit?.salesMode || 'ready_stock',
                    estimatedCompletionDate: unit?.estimatedCompletionDate || '',
                })),
            }))
            : Array.isArray(property?.blockConfig) && property.blockConfig.length
                ? property.blockConfig.map((item) => ({
                    blockName: item?.blockName || '',
                    unitCount: Number(item?.unitCount) || 0,
                }))
                : [
                    {
                        blockName: 'Blok A',
                        unitCount: Number(property?.totalUnits) || 1,
                    },
                ]
    ),
});

export const appendPropertyFormData = (formData, imageSlots, options = {}) => {
    const payload = new FormData();
    payload.append('nama_perumahan', formData.name);
    payload.append('harga', formData.price || 0);
    payload.append('suku_bunga_kpr', formData.kprInterest || 0);
    payload.append('tipe_unit', formData.type || '');
    payload.append('kategori', formData.housingType || 'komersil');
    payload.append('status_aktif', formData.isActive ? '1' : '0');
    payload.append('jumlah_seluruh_unit', formData.totalUnits || 0);
    payload.append('jumlah_unit_tersedia', formData.availableUnits || 0);
    payload.append('deskripsi', formData.description || '');
    payload.append('alamat_lengkap', formData.address || '');
    payload.append('kota', formData.city || '');
    payload.append('gmaps_url', formData.gmapsUrl || '');
    payload.append('lokasi', formData.location || '');
    payload.append('luas_tanah', formData.landArea || '');
    payload.append('luas_bangunan', formData.buildingArea || '');
    payload.append('jumlah_kamar_tidur', formData.bedrooms || '');
    payload.append('jumlah_kamar_mandi', formData.bathrooms || '');
    payload.append('fasilitas', JSON.stringify(formData.facilities || []));
    payload.append('marketing_user_id', formData.marketingUserId || '');
    payload.append('nama_bank_utj', String(formData.bankNameUtj || '').trim());
    payload.append('no_rekening_utj', String(formData.noRekeningUtj || '').replace(/\D/g, ''));
    payload.append('block_payload', JSON.stringify(
        normalizePropertyUnitBlocks(formData.unitBlocks || []).map((block) => ({
            blockName: block.blockName,
            unitCount: Number(block.unitCount) || 0,
            units: (block.units || []).map((unit) => ({
                id: unit?.id ?? null,
                unitNumber: Number(unit?.unitNumber) || 0,
                salesMode: unit?.salesMode || 'ready_stock',
                estimatedCompletionDate: unit?.salesMode === 'indent'
                    ? (unit?.estimatedCompletionDate || '')
                    : '',
            })),
        }))
    ));

    const mediaPayload = imageSlots.map((slot) => ({
        index: slot.index,
        url_file: slot.file ? '' : (slot.originalPath || ''),
    }));
    payload.append('media_payload', JSON.stringify(mediaPayload));

    imageSlots.forEach((slot) => {
        if (slot.file) {
            payload.append(`photos[${slot.index}]`, slot.file);
        }
    });

    if (options.methodOverride) {
        payload.append('_method', options.methodOverride);
    }

    return payload;
};
