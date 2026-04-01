import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import PromoCard from '../components/ui/PromoCard';
import { fetchJsonWithFallback, mapPromoFromApi, isPromoActive, normalizeApiListPayload } from '../utils/promo';

export default function PromoList() {
    const [promos, setPromos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const data = await fetchJsonWithFallback('/api/promos');
                setPromos(normalizeApiListPayload(data).map(mapPromoFromApi));
            } catch (err) {
                setError(err.message || 'Gagal memuat data promo. Pastikan backend aktif dan URL API benar.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromos();
    }, []);

    const activePromos = promos.filter((promo) => isPromoActive(promo));

    return (
        <div className="container-custom py-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Promo Terbaru</h1>
                    <p className="text-gray-500">Dapatkan penawaran terbaik untuk hunian impian Anda.</p>
                </div>
                <Link to="/perumahan">
                    <Button variant="outline">Lihat Perumahan</Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="text-sm text-gray-500">Memuat promo...</div>
            ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
            ) : promos.length === 0 ? (
                <div className="text-sm text-gray-500">Belum ada promo yang tersedia.</div>
            ) : activePromos.length === 0 ? (
                <div className="text-sm text-gray-500">Belum ada promo aktif saat ini.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activePromos.map((promo) => (
                        <PromoCard key={promo.id} promo={promo} />
                    ))}
                </div>
            )}
        </div>
    );
}
