import { resolveAssetUrl } from '../lib/api';

export const normalizeApiListPayload = (payload) => {
    if (Array.isArray(payload)) return payload.filter((item) => item && typeof item === 'object');
    if (Array.isArray(payload?.data)) return payload.data.filter((item) => item && typeof item === 'object');
    return [];
};

export const normalizeApiItemPayload = (payload) => {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
            return payload.data;
        }
        return payload;
    }

    if (Array.isArray(payload)) {
        return payload.find((item) => item && typeof item === 'object') || null;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data.find((item) => item && typeof item === 'object') || null;
    }

    return null;
};

export const resolveImage = (path) => {
    if (!path) return '';
    if (typeof path !== 'string') return '';

    const normalizedPath = path.trim();
    if (!normalizedPath) return '';
    return resolveAssetUrl(normalizedPath);
};

export const formatMoney = (value) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
}).format(value || 0);

export const formatPromoPeriod = (startDate, endDate) => {
    if (!startDate && !endDate) return '-';

    const formatter = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const startRaw = startDate ? new Date(startDate) : null;
    const endRaw = endDate ? new Date(endDate) : null;
    const start = startRaw && !Number.isNaN(startRaw.getTime()) ? formatter.format(startRaw) : null;
    const end = endRaw && !Number.isNaN(endRaw.getTime()) ? formatter.format(endRaw) : null;

    if (start && end) {
        const isSameDay = startRaw.toDateString() === endRaw.toDateString();
        return isSameDay ? start : `${start} - ${end}`;
    }

    return start || end || '-';
};

const parseReferenceDate = (referenceDate) => {
    if (referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())) {
        return referenceDate;
    }

    if (typeof referenceDate === 'string') {
        const parsed = new Date(referenceDate);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return new Date();
};

const parsePromoDate = (value) => {
    if (!value) return null;

    const normalizedValue = String(value).trim();
    const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(normalizedValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const parseActiveFlag = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'aktif' || normalized === 'active';
    }
    return Boolean(value);
};

export const isPromoActive = (promo, referenceDate = new Date()) => {
    const activeFlag = promo?.isActive ?? promo?.is_active;
    if (!parseActiveFlag(activeFlag)) return false;

    const safeDate = parseReferenceDate(referenceDate);
    const today = new Date(safeDate.getFullYear(), safeDate.getMonth(), safeDate.getDate());
    const start = parsePromoDate(promo?.startDate ?? promo?.tanggal_mulai);
    const end = parsePromoDate(promo?.endDate ?? promo?.tanggal_selesai);

    if (start && start > today) return false;
    if (end && end < today) return false;
    return true;
};

export const mapPromoFromApi = (promo) => {
    const discountType = promo?.tipe_promo === 'percent'
        ? 'percent'
        : promo?.tipe_promo === 'amount'
            ? 'amount'
            : 'none';
    const discountValue = Number(promo?.nilai_promo || 0);
    const category = promo?.kategori || (discountType === 'percent' ? 'Diskon' : discountType === 'amount' ? 'Cashback' : 'Promo');
    const highlight = buildHighlight(discountType, discountValue, category);
    const properties = promo?.properties || [];
    const propertyNames = properties.map((item) => item?.name).filter(Boolean).join(', ');
    const propertyIdsFromPayload = Array.isArray(promo?.property_ids) ? promo.property_ids : [];
    const propertyIdsFromRelation = properties
        .map((item) => item?.id ?? item?.id_perumahan)
        .filter((value) => value !== null && value !== undefined && String(value).trim() !== '');
    const propertyIdsSource = propertyIdsFromPayload.length ? propertyIdsFromPayload : propertyIdsFromRelation;
    const perumahanIds = Array.from(new Set(
        propertyIdsSource.map((value) => {
            const numeric = Number(value);
            return Number.isNaN(numeric) ? String(value) : numeric;
        })
    ));

    return {
        id: promo?.id,
        title: promo?.judul || '',
        property: propertyNames || 'Semua Perumahan',
        period: formatPromoPeriod(promo?.tanggal_mulai, promo?.tanggal_selesai),
        highlight,
        category,
        details: promo?.deskripsi || '',
        startDate: promo?.tanggal_mulai || '',
        endDate: promo?.tanggal_selesai || '',
        isActive: isPromoActive({
            is_active: promo?.is_active,
            tanggal_mulai: promo?.tanggal_mulai,
            tanggal_selesai: promo?.tanggal_selesai,
        }),
        discountType,
        discountValue,
        perumahanIds,
        banner: promo?.banner_path ? resolveImage(promo.banner_path) : '',
    };
};

export const buildHighlight = (discountType, discountValue, category) => {
    if (discountType === 'percent') {
        return `Diskon ${discountValue || 0}%`;
    }
    if (discountType === 'amount') {
        return `Hemat ${formatMoney(discountValue || 0)}`;
    }
    return `Promo ${category}`;
};

export const getPromoPricing = (promos, propertyId, basePrice) => {
    const activePromos = (promos || []).filter((promo) =>
        isPromoActive(promo) &&
        (promo.perumahanIds || []).includes(propertyId)
    );

    return activePromos.reduce(
        (acc, promo) => {
            let discount = 0;
            if (promo.discountType === 'percent') {
                discount = (basePrice * (promo.discountValue || 0)) / 100;
            } else if (promo.discountType === 'amount') {
                discount = promo.discountValue || 0;
            }

            if (discount > acc.discount) {
                return { discount, promo };
            }
            return acc;
        },
        { discount: 0, promo: null }
    );
};
