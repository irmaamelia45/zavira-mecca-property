import React from 'react';

export default function AdminChartLegend({ items = [], className = 'mt-3 justify-center' }) {
    const resolveSwatchFill = (color) => (
        typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)
            ? `${color}14`
            : 'transparent'
    );

    return (
        <div className={`flex flex-wrap items-center gap-x-5 gap-y-2.5 ${className}`}>
            {items.map((item, index) => (
                <div
                    key={item.key ?? item.name ?? index}
                    className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700"
                >
                    <span
                        aria-hidden="true"
                        className="inline-flex h-3.5 w-3.5 shrink-0 rounded-[3px] border-2"
                        style={{
                            borderColor: item.color,
                            backgroundColor: item.fillColor ?? resolveSwatchFill(item.color),
                        }}
                    />
                    <span className="leading-none">{item.name}</span>
                </div>
            ))}
        </div>
    );
}
