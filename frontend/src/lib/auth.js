const TOKEN_KEY = 'zmp_token';
const USER_KEY = 'zmp_user';
const LEGACY_META_KEYS = ['zmp_logged_in', 'zmp_role', 'zmp_user_name'];

const getSessionStorage = () => (typeof window !== 'undefined' ? window.sessionStorage : null);
const getLocalStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

const clearStorageKeys = (storage, keys) => {
    if (!storage) return;
    keys.forEach((key) => storage.removeItem(key));
};

const clearLegacyLocalAuth = () => {
    const local = getLocalStorage();
    clearStorageKeys(local, [TOKEN_KEY, USER_KEY, ...LEGACY_META_KEYS]);
};

// Force fresh guest state after app boot when there is legacy persistent auth data.
clearLegacyLocalAuth();

export const getStoredUser = () => {
    const session = getSessionStorage();
    const raw = session?.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const getAuthToken = () => {
    const session = getSessionStorage();
    return session?.getItem(TOKEN_KEY) || '';
};

export const getUserRole = () => {
    const user = getStoredUser();
    return user?.role || '';
};

export const isLoggedIn = () => Boolean(getAuthToken());

export const saveAuth = ({ token, user }) => {
    const session = getSessionStorage();
    if (!session) return;

    if (token) {
        session.setItem(TOKEN_KEY, token);
    }
    if (user) {
        session.setItem(USER_KEY, JSON.stringify(user));
    }
};

export const clearAuth = () => {
    const session = getSessionStorage();
    clearStorageKeys(session, [TOKEN_KEY, USER_KEY, ...LEGACY_META_KEYS]);
    clearLegacyLocalAuth();
};

export const authHeaders = (extra = {}) => {
    const token = getAuthToken();
    return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
};
