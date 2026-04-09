import { API_BASE, resolveImage } from './promo';

export const emptyPropertyForm = {
    name: '',
    price: '',
    type: '',
    housingType: 'komersil',
    status: 'Available',
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
    marketingName: '',
    marketingWhatsapp: '',
    unitBlocks: [
        { blockName: 'Blok A', unitCount: 1 },
    ],
};

export const normalizeImageSlots = (images = []) => {
    const slots = Array.from({ length: 4 }, (_, index) => ({
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
    type: property?.type || '',
    housingType: property?.category || 'komersil',
    status: property?.status || 'Available',
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
    marketingName: property?.marketingName || '',
    marketingWhatsapp: property?.marketingWhatsapp || '',
    unitBlocks: Array.isArray(property?.blockConfig) && property.blockConfig.length
        ? property.blockConfig.map((item) => ({
            blockName: item?.blockName || '',
            unitCount: Number(item?.unitCount) || 0,
        }))
        : [
            {
                blockName: 'Blok A',
                unitCount: Number(property?.totalUnits) || 1,
            },
        ],
});

export const appendPropertyFormData = (formData, imageSlots, options = {}) => {
    const payload = new FormData();
    payload.append('nama_perumahan', formData.name);
    payload.append('harga', formData.price || 0);
    payload.append('tipe_unit', formData.type || '');
    payload.append('kategori', formData.housingType || 'komersil');
    payload.append('status_label', formData.status || 'Available');
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
    payload.append('nama_marketing', formData.marketingName || '');
    payload.append('whatsapp_marketing', formData.marketingWhatsapp || '');
    payload.append('block_payload', JSON.stringify(formData.unitBlocks || []));

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

export const isValidWhatsapp62 = (value) => /^62[0-9]+$/.test(value || '');

export { API_BASE };
