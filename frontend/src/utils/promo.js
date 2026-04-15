const stripTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');
const ensureLeadingSlash = (value = '') => (String(value || '').startsWith('/') ? String(value || '') : `/${String(value || '')}`);
const parseApiMessage = async (response) => {
    try {
        const body = await response.clone().json();
        return typeof body?.message === 'string' ? body.message.trim() : '';
    } catch {
        return '';
    }
};

const isGenericNotFoundMessage = (message = '') => {
    const normalized = String(message || '').trim().toLowerCase();
    if (!normalized) return true;
    if (normalized === 'not found' || normalized === 'not found.') return true;
    if (normalized.startsWith('the route ') && normalized.includes(' could not be found')) return true;
    return false;
};

const createRequestError = (message, stopFallback = false) => {
    const error = new Error(message);
    if (stopFallback) {
        error.stopFallback = true;
    }
    return error;
};

export const getApiBaseCandidates = () => {
    const envValue = String(import.meta.env.VITE_API_URL || '').trim();
    const envBaseRaw = stripTrailingSlash(envValue);
    const preferRelativeApi = envBaseRaw === '/api';
    const envBase = envBaseRaw.toLowerCase().endsWith('/api')
        ? stripTrailingSlash(envBaseRaw.slice(0, -4))
        : envBaseRaw;
    const defaultBase = 'http://127.0.0.1:8000';
    const origin = typeof window !== 'undefined' ? stripTrailingSlash(window.location.origin) : '';
    const originHostBase = (() => {
        if (!origin) return '';
        try {
            const parsed = new URL(origin);
            const isViteDevPort = parsed.port === '5173' || parsed.port === '5174' || parsed.port === '4173';
            const withPort = parsed.port && !isViteDevPort ? `:${parsed.port}` : '';
            return `${parsed.protocol}//${parsed.hostname}${withPort}`;
        } catch {
            return origin;
        }
    })();

    const candidates = [
        ...(preferRelativeApi ? [''] : [envBase]),
        defaultBase,
        originHostBase,
        originHostBase ? `${originHostBase}/backend/public` : '',
        originHostBase ? `${originHostBase}/sistem-pemasaran-perumahan/backend/public` : '',
        originHostBase ? `${originHostBase}/zavira-mecca-property/sistem-pemasaran-perumahan/backend/public` : '',
    ]
        .filter((value) => value !== null && value !== undefined)
        .filter((value, index, array) => array.indexOf(value) === index);
    
    return candidates;
};

export const API_BASE = getApiBaseCandidates()[0] ?? 'http://127.0.0.1:8000';

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

export const fetchJsonWithFallback = async (path, options = {}) => {
    const normalizedPath = ensureLeadingSlash(path);
    const candidates = getApiBaseCandidates();
    let lastError = null;

    for (const base of candidates) {
        const url = `${stripTrailingSlash(base)}${normalizedPath}`;
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const apiMessage = await parseApiMessage(response);

                // Try another base URL when endpoint is not found on current base.
                if (response.status === 404) {
                    // Stop fallback when backend returns a domain-specific 404 message
                    // (for example: "Akun Admin Perumahan tidak ditemukan.").
                    if (!isGenericNotFoundMessage(apiMessage)) {
                        throw createRequestError(apiMessage, true);
                    }

                    lastError = createRequestError(`Endpoint tidak ditemukan di ${url}`);
                    continue;
                }

                const fallbackMessage = `Gagal memuat data (${response.status}).`;
                throw createRequestError(apiMessage || fallbackMessage, true);
            }

            return await response.json();
        } catch (error) {
            if (error?.stopFallback) {
                throw error;
            }
            lastError = error;
        }
    }

    throw lastError || new Error('Tidak dapat terhubung ke backend.');
};

export const resolveImage = (path) => {
    if (!path) return '';
    if (typeof path !== 'string') return '';

    const normalizedPath = path.trim();
    if (!normalizedPath) return '';
    if (normalizedPath.startsWith('http')) return normalizedPath;

    return `${API_BASE}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
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
        isActive: Boolean(promo?.is_active),
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
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const isPromoActive = (promo, referenceDate = new Date()) => {
    if (!promo?.isActive) return false;

    const safeDate = parseReferenceDate(referenceDate);
    const today = new Date(safeDate.getFullYear(), safeDate.getMonth(), safeDate.getDate());
    const start = parsePromoDate(promo?.startDate);
    const end = parsePromoDate(promo?.endDate);

    if (start && start > today) return false;
    if (end && end < today) return false;
    return true;
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
