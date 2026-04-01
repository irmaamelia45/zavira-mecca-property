import React from 'react';
import { Link } from 'react-router-dom';
import { FaTag, FaClock } from 'react-icons/fa';
import { FiArrowUpRight } from 'react-icons/fi';
import Button from './Button';
import { Card, CardContent } from './Card';
import Badge from './Badge';

export default function PromoCard({ promo }) {
    return (
        <Card className="group overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)] hover:-translate-y-1 hover:border-primary-100 hover:shadow-[0_18px_35px_-24px_rgba(37,99,235,0.45)]">
            <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-secondary-50 text-secondary-700 border-secondary-200 text-[11px] px-2.5 py-1">
                        {promo.category}
                    </Badge>
                    <div className="flex items-start gap-1.5 text-[11px] text-gray-500 max-w-[68%] text-right leading-tight">
                        <FaClock className="text-gray-400 shrink-0" />
                        <span>{promo.period}</span>
                    </div>
                </div>

                <div>
                    <h3 className="mb-1 text-base font-semibold leading-snug text-gray-900 md:text-lg">{promo.title}</h3>
                    <p className="text-xs text-gray-500">{promo.property}</p>
                </div>

                <div className="rounded-lg border border-primary-100 bg-gradient-to-r from-primary-50 to-secondary-50 px-3 py-2 text-xs font-medium text-primary-700">
                    <FaTag className="mr-1.5 inline-block text-primary-500" />
                    {promo.highlight}
                </div>

                <Link to={`/promo/${promo.id}`}>
                    <Button size="sm" className="w-full justify-between">
                        <span>Detail Promo</span>
                        <FiArrowUpRight className="text-sm" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
