import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { FaArrowLeft, FaClock, FaTag } from 'react-icons/fa';
import { fetchJsonWithFallback, mapPromoFromApi, normalizeApiItemPayload, normalizeApiListPayload } from '../utils/promo';

export default function PromoDetail() {
    const { id } = useParams();
    const [promo, setPromo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPromo = async () => {
            try {
                let data = null;

                try {
                    data = await fetchJsonWithFallback(`/api/promos/${id}`);
                } catch {
                    // Fallback when detail endpoint is unavailable in some environments.
                    const listData = await fetchJsonWithFallback('/api/promos');
                    const list = normalizeApiListPayload(listData);
                    const matched = list.find((item) => String(item?.id ?? item?.id_promo) === String(id));
                    if (!matched) {
                        throw new Error('Promo tidak ditemukan.');
                    }
                    setPromo(mapPromoFromApi(matched));
                    return;
                }

                const normalizedPromo = normalizeApiItemPayload(data);
                if (!normalizedPromo) {
                    throw new Error('Promo tidak ditemukan.');
                }

                setPromo(mapPromoFromApi(normalizedPromo));
            } catch (err) {
                setError(err.message || 'Gagal memuat promo.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromo();
    }, [id]);

    if (isLoading) {
        return (
            <div className="container-custom py-20 text-center">
                <p className="text-gray-600 mb-4">Memuat promo...</p>
            </div>
        );
    }

    if (error || !promo) {
        return (
            <div className="container-custom py-20 text-center">
                <p className="text-gray-600 mb-4">{error || 'Promo tidak ditemukan.'}</p>
                <Link to="/promo">
                    <Button variant="outline">Kembali ke Daftar Promo</Button>
                </Link>
            </div>
        );
    }

    const targetPropertyId = Array.isArray(promo.perumahanIds)
        ? promo.perumahanIds.find((propertyId) => propertyId !== null && propertyId !== undefined && String(propertyId).trim() !== '')
        : null;
    const targetPropertyUrl = targetPropertyId ? `/perumahan/${targetPropertyId}` : '/perumahan';

    return (
        <div className="container-custom py-10 pb-20">
            <Link to="/promo" className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-6 transition-colors font-medium">
                <FaArrowLeft className="mr-2" /> Kembali ke Promo
            </Link>

            <Card className="border-none shadow-xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-secondary-50 text-secondary-700 border-secondary-200">{promo.category}</Badge>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <FaClock className="text-gray-400" /> {promo.period}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">{promo.title}</h1>
                        <p className="text-gray-500">Untuk {promo.property}</p>
                    </div>

                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-primary-700">
                        <FaTag className="inline-block mr-2" />
                        {promo.highlight}
                    </div>

                    <p className="text-gray-600 leading-relaxed">{promo.details}</p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link to={targetPropertyUrl}>
                            <Button className="w-full sm:w-auto">Lihat Perumahan</Button>
                        </Link>
                        <Link to="/auth/login">
                            <Button variant="outline" className="w-full sm:w-auto">Konsultasi Promo</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
