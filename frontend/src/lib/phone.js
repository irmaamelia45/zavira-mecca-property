const MAX_PHONE_LENGTH = 16;

export const normalizePhone62 = (value = '') => {
    let digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';

    // Support common international prefix patterns such as 0062.
    digits = digits.replace(/^00+/, '');

    if (digits.startsWith('62')) {
        const localPart = digits.slice(2).replace(/^0+/, '');
        digits = `62${localPart}`;
    } else if (digits.startsWith('0')) {
        digits = `62${digits.replace(/^0+/, '')}`;
    } else if (digits.startsWith('8')) {
        digits = `62${digits}`;
    } else {
        digits = `62${digits.replace(/^62/, '')}`;
    }

    return digits.slice(0, MAX_PHONE_LENGTH);
};

export const isValidPhone62 = (value = '') => /^628[0-9]{7,13}$/.test(String(value || '').trim());
