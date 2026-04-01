import { getStoredUser } from './auth';

const FAVORITES_KEY_PREFIX = 'zmp_favorites_user_';
const GUEST_FAVORITES_KEY = 'zmp_favorites_guest';

const getStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

const normalizeFavoriteIds = (value) => {
    if (!Array.isArray(value)) return [];

    const ids = value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));

    return Array.from(new Set(ids));
};

export const getFavoritesStorageKey = (user = getStoredUser()) => {
    const userId = Number(user?.id);
    if (Number.isFinite(userId) && userId > 0) {
        return `${FAVORITES_KEY_PREFIX}${userId}`;
    }

    return GUEST_FAVORITES_KEY;
};

export const getFavoriteIds = (user = getStoredUser()) => {
    const storage = getStorage();
    if (!storage) return [];

    const key = getFavoritesStorageKey(user);
    try {
        return normalizeFavoriteIds(JSON.parse(storage.getItem(key) || '[]'));
    } catch {
        return [];
    }
};

export const setFavoriteIds = (ids, user = getStoredUser()) => {
    const storage = getStorage();
    if (!storage) return [];

    const key = getFavoritesStorageKey(user);
    const normalized = normalizeFavoriteIds(ids);
    storage.setItem(key, JSON.stringify(normalized));
    return normalized;
};

export const isFavoriteProperty = (propertyId, user = getStoredUser()) => {
    const normalizedId = Number(propertyId);
    if (!Number.isFinite(normalizedId)) return false;
    return getFavoriteIds(user).includes(normalizedId);
};

export const toggleFavoriteProperty = (propertyId, user = getStoredUser()) => {
    const normalizedId = Number(propertyId);
    if (!Number.isFinite(normalizedId)) return { exists: false, nextIds: getFavoriteIds(user) };

    const currentIds = getFavoriteIds(user);
    const exists = currentIds.includes(normalizedId);
    const nextIds = exists
        ? currentIds.filter((item) => item !== normalizedId)
        : [...currentIds, normalizedId];

    return {
        exists,
        nextIds: setFavoriteIds(nextIds, user),
    };
};

export const removeFavoriteProperty = (propertyId, user = getStoredUser()) => {
    const normalizedId = Number(propertyId);
    const nextIds = getFavoriteIds(user).filter((item) => item !== normalizedId);
    return setFavoriteIds(nextIds, user);
};
