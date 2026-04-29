export const PASSWORD_POLICY_MESSAGE = 'Password minimal 8 karakter dan wajib memuat huruf kapital, huruf kecil, angka, dan simbol.';

export const PASSWORD_REQUIREMENTS = [
    {
        key: 'length',
        label: 'Minimal 8 karakter',
        isMet: (password) => password.length >= 8,
    },
    {
        key: 'uppercase',
        label: 'Mengandung huruf kapital',
        isMet: (password) => /[A-Z]/.test(password),
    },
    {
        key: 'lowercase',
        label: 'Mengandung huruf kecil',
        isMet: (password) => /[a-z]/.test(password),
    },
    {
        key: 'number',
        label: 'Mengandung angka',
        isMet: (password) => /[0-9]/.test(password),
    },
    {
        key: 'symbol',
        label: 'Mengandung simbol',
        isMet: (password) => /[^A-Za-z0-9]/.test(password),
    },
];

export const getPasswordChecklist = (value = '') => {
    const password = String(value || '');

    return PASSWORD_REQUIREMENTS.map((requirement) => ({
        key: requirement.key,
        label: requirement.label,
        isMet: requirement.isMet(password),
    }));
};

export const isStrongPassword = (value = '') => {
    const password = String(value || '');

    return getPasswordChecklist(password).every((item) => item.isMet);
};
