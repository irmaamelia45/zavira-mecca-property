import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiJson, ApiRequestError } from '../lib/api';
import { saveAuth } from '../lib/auth';
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
        } else if (password.length < 8) {
            nextErrors.password = 'Password minimal 8 karakter.';
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
        <div className="container-custom py-20 flex justify-center items-center min-h-[60vh] animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-serif text-primary-900">Daftar Akun</CardTitle>
                    <p className="text-gray-500 text-sm mt-1">Buat akun untuk mempermudah proses booking</p>
                </CardHeader>
                <CardContent className="p-8">
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
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Buat password"
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
                            required
                        />
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
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <Button type="submit" className="w-full shadow-lg shadow-primary-500/20" isLoading={isLoading}>
                            Daftar
                        </Button>

                        <p className="text-center text-sm text-gray-500">
                            Sudah punya akun?{' '}
                            <Link to="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                Masuk
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
