import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';
import PasswordChecklist from '../components/auth/PasswordChecklist';
import { apiJson, ApiRequestError } from '../lib/api';
import { saveAuth } from '../lib/auth';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../lib/password';
import { formatPhoneForDisplay, isValidPhone, normalizePhone } from '../lib/phone';

export default function Register() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);

    useEffect(() => {
        // Pastikan form register selalu kosong saat pertama dibuka.
        const clearCredentials = () => {
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            if (emailInputRef.current) emailInputRef.current.value = '';
            if (passwordInputRef.current) passwordInputRef.current.value = '';
            if (confirmPasswordInputRef.current) confirmPasswordInputRef.current.value = '';
        };

        clearCredentials();
        const timer = window.setTimeout(clearCredentials, 120);

        return () => window.clearTimeout(timer);
    }, []);

    const pickFirstError = (value) => {
        if (Array.isArray(value)) return value.find(Boolean) || '';
        if (typeof value === 'string') return value;
        return '';
    };

    const validateForm = () => {
        const nextErrors = {};
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedPhone = normalizePhone(phone.trim());

        if (!trimmedName) {
            nextErrors.nama = 'Nama lengkap wajib diisi.';
        }

        if (!trimmedEmail) {
            nextErrors.email = 'Email wajib diisi.';
        } else if (!/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(trimmedEmail)) {
            nextErrors.email = 'Email harus menggunakan domain @gmail.com.';
        }

        if (!trimmedPhone) {
            nextErrors.no_hp = 'Nomor WhatsApp wajib diisi.';
        } else if (!isValidPhone(trimmedPhone)) {
            nextErrors.no_hp = 'Format nomor WhatsApp tidak valid. Gunakan 08xxxxxxxxxx.';
        }

        if (!password) {
            nextErrors.password = 'Password wajib diisi.';
        } else if (!isStrongPassword(password)) {
            nextErrors.password = PASSWORD_POLICY_MESSAGE;
        }

        if (!confirmPassword) {
            nextErrors.password_confirmation = 'Konfirmasi password wajib diisi.';
        } else if (confirmPassword !== password) {
            nextErrors.password_confirmation = 'Konfirmasi password harus sama.';
        }

        return nextErrors;
    };

    const clearFieldError = (fieldName) => {
        setFieldErrors((prev) => {
            if (!prev[fieldName]) return prev;
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setFieldErrors({});

        const clientErrors = validateForm();
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            setError('Periksa kembali form yang ditandai.');
            setIsLoading(false);
            return;
        }

        try {
            const data = await apiJson('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nama: name.trim(),
                    email: email.trim(),
                    no_hp: normalizePhone(phone.trim()),
                    password,
                    password_confirmation: confirmPassword,
                    device_name: 'web',
                }),
                defaultErrorMessage: 'Registrasi gagal.',
            });

            saveAuth({
                token: data.token,
                user: data.user,
            });
            navigate('/akun');
        } catch (err) {
            if (err instanceof ApiRequestError && err?.data?.errors) {
                const parsedErrors = Object.entries(err.data.errors).reduce((acc, [key, value]) => {
                    const message = pickFirstError(value);
                    if (message) acc[key] = message;
                    return acc;
                }, {});

                if (Object.keys(parsedErrors).length > 0) {
                    setFieldErrors(parsedErrors);
                    setError('Periksa kembali form yang ditandai.');
                    return;
                }
            }

            const message = String(err?.message || '');
            if (message.toLowerCase().includes('failed to fetch')) {
                setError('Tidak dapat terhubung ke server. Coba lagi beberapa saat.');
            } else {
                setError(message || 'Registrasi gagal.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthSplitLayout
            title="Buat akun baru"
            description="Daftar untuk mempercepat proses booking, melacak aktivitas akun, dan mengelola langkah berikutnya dari satu tempat."
            panelTitle="Mulai dari portal yang bersih dan fokus."
            panelDescription="Buat akun publik melalui form di sisi kanan. Jalur internal dan superadmin akan dipisahkan ke sistem lain."
        >
            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
                <input type="text" name="fake_username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
                <input type="password" name="fake_password" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />
                <Input
                    label="Nama Lengkap"
                    placeholder="Nama Anda"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        clearFieldError('nama');
                    }}
                    error={fieldErrors.nama}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white/90 px-4 shadow-none"
                />
                <Input
                    label="Email"
                    type="email"
                    placeholder="nama@email.com"
                    name="register_email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                    }}
                    ref={emailInputRef}
                    error={fieldErrors.email}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white/90 px-4 shadow-none"
                />
                <Input
                    label="No. WhatsApp"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChange={(e) => {
                        setPhone(formatPhoneForDisplay(normalizePhone(e.target.value)));
                        clearFieldError('no_hp');
                    }}
                    error={fieldErrors.no_hp}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white/90 px-4 shadow-none"
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="Minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol"
                    name="register_password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                        clearFieldError('password_confirmation');
                    }}
                    ref={passwordInputRef}
                    error={fieldErrors.password}
                    minLength={8}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white/90 px-4 shadow-none"
                />
                <PasswordChecklist password={password} />
                <Input
                    label="Konfirmasi Password"
                    type="password"
                    placeholder="Ulangi password"
                    name="register_password_confirmation"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFieldError('password_confirmation');
                    }}
                    ref={confirmPasswordInputRef}
                    error={fieldErrors.password_confirmation}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white/90 px-4 shadow-none"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                    type="submit"
                    className="h-12 w-full rounded-xl shadow-[0_16px_32px_-18px_rgba(47,73,127,0.7)]"
                    isLoading={isLoading}
                >
                    Daftar
                </Button>

                <p className="text-center text-sm text-gray-500">
                    Sudah punya akun?{' '}
                    <Link to="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                        Masuk
                    </Link>
                </p>
            </form>
        </AuthSplitLayout>
    );
}
