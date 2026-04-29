import { clearAuth } from './auth';

const DEFAULT_API_PATH = '/api';
const DEFAULT_NETWORK_ERROR_MESSAGE = 'Tidak dapat terhubung ke server.';

const stripTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');
const ensureLeadingSlash = (value = '') => {
    const normalized = String(value || '').trim();
    if (!normalized) return '/';
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const hasExplicitScheme = (value = '') => /^[a-z][a-z\d+\-.]*:/i.test(String(value || '').trim());
const isHttpUrl = (value = '') => /^https?:\/\//i.test(String(value || '').trim());

const getCurrentProtocol = () => {
    if (typeof window !== 'undefined' && window.location?.protocol) {
        return window.location.protocol;
    }

    return 'http:';
};

const ensureUrlProtocol = (value = '') => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (isHttpUrl(normalized)) return normalized;
    if (normalized.startsWith('//')) return `${getCurrentProtocol()}${normalized}`;
    if (normalized.startsWith('/')) return normalized;
    return `${getCurrentProtocol()}//${normalized}`;
};

const stripApiSuffix = (value = '') => {
    const normalized = stripTrailingSlash(value);
    return /\/api$/i.test(normalized) ? normalized.slice(0, -4) : normalized;
};

const normalizeRelativeApiBase = (value = '') => {
    const normalized = stripTrailingSlash(ensureLeadingSlash(value));
    const apiBase = /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
    const assetBase = stripApiSuffix(apiBase);

    return {
        raw: value,
        apiBase,
        assetBase,
        isRelative: true,
    };
};

const normalizeAbsoluteApiBase = (value = '') => {
    const normalizedUrl = ensureUrlProtocol(value);
    const parsed = new URL(normalizedUrl);
    const origin = parsed.origin;
    const pathname = stripTrailingSlash(parsed.pathname || '');
    const apiPath = /\/api$/i.test(pathname)
        ? pathname || DEFAULT_API_PATH
        : `${pathname || ''}/api`;
    const assetPath = stripApiSuffix(apiPath);

    return {
        raw: value,
        apiBase: `${origin}${apiPath}`,
        assetBase: assetPath ? `${origin}${assetPath}` : origin,
        isRelative: false,
    };
};

const normalizeApiConfig = (value = '') => {
    const normalized = String(value || '').trim();
    if (!normalized) {
        return normalizeRelativeApiBase(DEFAULT_API_PATH);
    }

    if (normalized.startsWith('/')) {
        return normalizeRelativeApiBase(normalized);
    }

    return normalizeAbsoluteApiBase(normalized);
};

const normalizeApiPath = (value = '') => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (isHttpUrl(normalized)) return normalized;

    const withSlash = ensureLeadingSlash(normalized);
    const withoutApiPrefix = withSlash.replace(/^\/api(?=\/|$)/i, '');
    return withoutApiPrefix || '/';
};

const joinUrl = (base, path) => {
    const normalizedPath = ensureLeadingSlash(path);
    if (!base) return normalizedPath;
    return `${stripTrailingSlash(base)}${normalizedPath}`;
};

const buildRequestHeaders = (headers = {}) => ({
    Accept: 'application/json',
    ...headers,
});

const isAuthEndpoint = (path = '') => normalizeApiPath(path).startsWith('/auth/');

const handleUnauthorizedResponse = (path = '') => {
    if (isAuthEndpoint(path) || typeof window === 'undefined') return;

    clearAuth();

    if (window.location.pathname !== '/auth/login') {
        window.location.assign('/auth/login');
    }
};

const readJsonSafely = async (response) => {
    try {
        const text = await response.text();
        if (!text) return null;
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const getFileNameFromContentDisposition = (value = '') => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';

    const utf8Match = normalized.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]).trim();
        } catch {
            return utf8Match[1].trim();
        }
    }

    const plainMatch = normalized.match(/filename\s*=\s*"([^"]+)"/i) || normalized.match(/filename\s*=\s*([^;]+)/i);
    return plainMatch?.[1] ? plainMatch[1].trim() : '';
};

const isGenericValidationMessage = (message = '') => {
    const normalized = String(message || '').trim().toLowerCase();
    return normalized === 'the given data was invalid.' || normalized === 'the given data was invalid';
};

const extractFirstValidationError = (body) => {
    if (!body || typeof body !== 'object' || typeof body.errors !== 'object' || !body.errors) {
        return '';
    }

    const first = Object.values(body.errors).flat().find(Boolean);
    return typeof first === 'string' ? first.trim() : '';
};

export const getApiErrorMessage = (body, fallbackMessage = '') => {
    if (body && typeof body === 'object') {
        const apiMessage = typeof body?.message === 'string' ? body.message.trim() : '';
        const validationMessage = extractFirstValidationError(body);

        if (validationMessage && (!apiMessage || isGenericValidationMessage(apiMessage))) {
            return validationMessage;
        }

        if (apiMessage) {
            return apiMessage;
        }
    }

    return fallbackMessage;
};

export class ApiRequestError extends Error {
    constructor(message, { status = 0, data = null, url = '', cause = null } = {}) {
        super(message);
        this.name = 'ApiRequestError';
        this.status = status;
        this.data = data;
        this.url = url;
        this.cause = cause;
    }
}

export const API_CONFIG = normalizeApiConfig(import.meta.env.VITE_API_URL);

export const buildApiUrl = (path = '') => {
    const normalized = String(path || '').trim();
    if (!normalized) return API_CONFIG.apiBase;
    if (isHttpUrl(normalized)) return normalized;

    return joinUrl(API_CONFIG.apiBase, normalizeApiPath(normalized));
};

export const resolveAssetUrl = (path = '') => {
    const normalized = String(path || '').trim();
    if (!normalized) return '';
    if (hasExplicitScheme(normalized) || normalized.startsWith('//')) return normalized;

    return joinUrl(API_CONFIG.assetBase, normalized);
};

export const apiFetch = (path, options = {}) => {
    const { headers, ...requestOptions } = options;

    return fetch(buildApiUrl(path), {
        ...requestOptions,
        headers: buildRequestHeaders(headers),
    });
};

export const apiJson = async (path, options = {}) => {
    const {
        defaultErrorMessage = '',
        ...fetchOptions
    } = options;

    let response;
    try {
        response = await apiFetch(path, fetchOptions);
    } catch (error) {
        throw new ApiRequestError(
            defaultErrorMessage || error?.message || DEFAULT_NETWORK_ERROR_MESSAGE,
            {
                cause: error,
                url: buildApiUrl(path),
            }
        );
    }

    const data = await readJsonSafely(response);

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorizedResponse(path);
        }

        throw new ApiRequestError(
            getApiErrorMessage(data, defaultErrorMessage || `Request gagal (${response.status}).`),
            {
                status: response.status,
                data,
                url: response.url,
            }
        );
    }

    return data;
};

export const apiBlob = async (path, options = {}) => {
    const {
        defaultErrorMessage = '',
        ...fetchOptions
    } = options;

    let response;
    try {
        response = await apiFetch(path, fetchOptions);
    } catch (error) {
        throw new ApiRequestError(
            defaultErrorMessage || error?.message || DEFAULT_NETWORK_ERROR_MESSAGE,
            {
                cause: error,
                url: buildApiUrl(path),
            }
        );
    }

    if (!response.ok) {
        const data = await readJsonSafely(response);
        if (response.status === 401) {
            handleUnauthorizedResponse(path);
        }

        throw new ApiRequestError(
            getApiErrorMessage(data, defaultErrorMessage || `Request gagal (${response.status}).`),
            {
                status: response.status,
                data,
                url: response.url,
            }
        );
    }

    const blob = await response.blob();
    const filename = getFileNameFromContentDisposition(response.headers.get('Content-Disposition'));

    return {
        blob,
        filename,
    };
};

export const downloadApiFile = async (path, options = {}) => {
    const {
        fallbackFileName = 'download',
        ...requestOptions
    } = options;

    const { blob, filename } = await apiBlob(path, requestOptions);
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename || fallbackFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);

    return {
        filename: filename || fallbackFileName,
    };
};
