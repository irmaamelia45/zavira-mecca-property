const MAX_CANONICAL_LENGTH = 16;
const CANONICAL_PHONE_PATTERN = /^628[0-9]{7,13}$/;

export const stripPhoneToDigits = (input = '') => String(input ?? '').replace(/\D/g, '');

export const normalizePhone = (input = '') => {
    let digits = stripPhoneToDigits(input);
    if (!digits) return '';

    digits = digits.replace(/^00+/, '');

    let localPart = '';
    if (digits.startsWith('62')) {
        localPart = digits.slice(2).replace(/^0+/, '');
    } else if (digits.startsWith('0')) {
        localPart = digits.replace(/^0+/, '');
    } else if (digits.startsWith('8')) {
        localPart = digits;
    } else {
        return '';
    }

    if (!localPart.startsWith('8')) {
        return '';
    }

    return `62${localPart}`.slice(0, MAX_CANONICAL_LENGTH);
};

export const formatPhoneForDisplay = (canonical = '') => {
    const normalized = normalizePhone(canonical);
    if (!normalized) return '';

    const localPart = normalized.slice(2);
    if (!localPart) return '';

    return `0${localPart}`;
};

export const isValidPhone = (input = '') => CANONICAL_PHONE_PATTERN.test(normalizePhone(input));

// Backward-compatible aliases for existing modules.
export const normalizePhone62 = normalizePhone;
export const isValidPhone62 = isValidPhone;
