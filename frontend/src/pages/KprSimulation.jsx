import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalculator, FaHome } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

const formatMoney = (value) => (
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0)
);

const extractDigits = (value) => String(value || '').replace(/\D/g, '');

const formatRupiahInput = (value) => {
    const digits = extractDigits(value);
    if (!digits) return '';
    return `Rp ${new Intl.NumberFormat('id-ID').format(Number(digits))}`;
};

const parseCurrency = (value) => Number(extractDigits(value) || 0);

export default function KprSimulation() {
    const [homePrice, setHomePrice] = useState('');
    const [downPayment, setDownPayment] = useState('');
    const [tenorMonths, setTenorMonths] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [monthlyInstallment, setMonthlyInstallment] = useState(null);
    const [formError, setFormError] = useState('');

    const principal = useMemo(() => {
        const priceValue = parseCurrency(homePrice);
        const dpValue = parseCurrency(downPayment);
        return Math.max(0, priceValue - dpValue);
    }, [homePrice, downPayment]);

    const handleCalculate = (event) => {
        event.preventDefault();
        setFormError('');
        setMonthlyInstallment(null);

        const priceValue = parseCurrency(homePrice);
        const dpValue = parseCurrency(downPayment);
        const tenorValue = Number(tenorMonths);
        const interestValue = Number(interestRate);

        if (priceValue <= 0) {
            setFormError('Harga rumah harus lebih dari Rp 0.');
            return;
        }

        if (dpValue < 0) {
            setFormError('DP tidak boleh kurang dari Rp 0.');
            return;
        }

        if (dpValue >= priceValue) {
            setFormError('DP harus lebih kecil dari harga rumah.');
            return;
        }

        if (!Number.isFinite(tenorValue) || tenorValue <= 0) {
            setFormError('Tenor harus lebih dari 0 bulan.');
            return;
        }

        if (!Number.isFinite(interestValue) || interestValue < 0) {
            setFormError('Suku bunga harus 0 atau lebih.');
            return;
        }

        const totalPrincipal = priceValue - dpValue;
        const monthlyRate = (interestValue / 100) / 12;

        if (monthlyRate === 0) {
            setMonthlyInstallment(totalPrincipal / tenorValue);
            return;
        }

        const result = (totalPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -tenorValue));
        setMonthlyInstallment(result);
    };

    return (
        <div className="container-custom py-10 pb-20 space-y-6 animate-in fade-in duration-500">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.28em] text-white/75">Simulasi KPR</p>
                <h1 className="mt-3 text-3xl md:text-4xl font-serif font-semibold leading-tight text-white">
                    Hitung estimasi cicilan KPR Anda secara langsung.
                </h1>
                <p className="mt-3 text-sm md:text-base text-white/80 max-w-3xl leading-relaxed">
                    Masukkan harga rumah, DP, tenor, dan suku bunga untuk melihat proyeksi angsuran bulanan.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-6 md:p-8 space-y-5">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                                <FaCalculator />
                            </span>
                            <div>
                                <h2 className="text-xl font-semibold text-primary-900">Form Kalkulator KPR</h2>
                                <p className="text-sm text-slate-600">Isi semua data untuk menghitung estimasi cicilan.</p>
                            </div>
                        </div>

                        <form onSubmit={handleCalculate} className="space-y-4">
                            <Input
                                label="Harga Rumah"
                                type="text"
                                inputMode="numeric"
                                placeholder="Rp 0"
                                value={homePrice}
                                onChange={(event) => setHomePrice(formatRupiahInput(event.target.value))}
                                required
                            />
                            <Input
                                label="DP"
                                type="text"
                                inputMode="numeric"
                                placeholder="Rp 0"
                                value={downPayment}
                                onChange={(event) => setDownPayment(formatRupiahInput(event.target.value))}
                                required
                            />
                            <Input
                                label="Tenor (bulan)"
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Contoh: 120"
                                value={tenorMonths}
                                onChange={(event) => setTenorMonths(event.target.value)}
                                required
                            />
                            <Input
                                label="Suku Bunga per Tahun (%)"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Contoh: 8.50"
                                value={interestRate}
                                onChange={(event) => setInterestRate(event.target.value)}
                                required
                            />

                            {formError && (
                                <p className="text-sm text-red-600">{formError}</p>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button type="submit" className="w-full sm:w-auto">Hitung Estimasi</Button>
                                <Link to="/perumahan" className="w-full sm:w-auto">
                                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                                        Pilih Perumahan
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-6 md:p-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <FaHome />
                            </span>
                            <div>
                                <h2 className="text-xl font-semibold text-primary-900">Hasil Simulasi</h2>
                                <p className="text-sm text-slate-600">Perkiraan cicilan berdasarkan input Anda.</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">Harga Rumah</span>
                                <span className="font-semibold text-slate-800">{formatMoney(parseCurrency(homePrice))}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">DP</span>
                                <span className="font-semibold text-slate-800">{formatMoney(parseCurrency(downPayment))}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">Pokok Pinjaman</span>
                                <span className="font-semibold text-primary-700">{formatMoney(principal)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">Tenor</span>
                                <span className="font-semibold text-slate-800">{tenorMonths || '-'} bulan</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">Suku Bunga</span>
                                <span className="font-semibold text-slate-800">{interestRate || '-'}%</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 text-center">
                            <p className="text-xs text-primary-700 uppercase tracking-[0.2em]">Estimasi Angsuran / Bulan</p>
                            <p className="mt-2 text-3xl font-bold text-primary-900">
                                {monthlyInstallment === null ? '-' : formatMoney(monthlyInstallment)}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Hasil simulasi, bukan nilai final persetujuan bank.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
