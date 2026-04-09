import React from 'react';

const STATUS_STYLE = {
    available: {
        label: 'Tersedia',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    pending: {
        label: 'Pending',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    sold: {
        label: 'Terbooking',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
    },
};

const resolveStatus = (status) => {
    if (status === 'pending') return 'pending';
    if (status === 'sold') return 'sold';
    return 'available';
};

export default function UnitPicker({
    unitBlocks = [],
    selectedUnitId = null,
    onSelect,
    loading = false,
    error = '',
    validationError = '',
    title = 'Silakan pilih blok terlebih dahulu sebelum booking',
    helperText = 'Pilih satu unit yang masih tersedia. Unit kuning/merah tidak bisa dipilih.',
}) {
    return (
        <div className="space-y-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-bold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500">{helperText}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {Object.entries(STATUS_STYLE).map(([key, item]) => (
                        <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${item.className}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-500">
                    Memuat data blok dan unit...
                </div>
            ) : unitBlocks.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-4 text-xs text-amber-800">
                    Data unit belum tersedia untuk perumahan ini.
                </div>
            ) : (
                <div className="space-y-2.5">
                    {unitBlocks.map((block) => (
                        <div key={block.blockCode || block.blockName} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2.5">
                            <div className="border-b border-gray-100 pb-1.5">
                                <h4 className="text-sm font-semibold text-gray-900">{block.blockName}</h4>
                            </div>
                            <div className="mt-2 grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10 gap-1.5">
                                {(block.units || []).map((unit) => {
                                    const normalizedStatus = resolveStatus(unit.status);
                                    const statusStyle = STATUS_STYLE[normalizedStatus];
                                    const isDisabled = normalizedStatus !== 'available';
                                    const isSelected = String(unit.id) === String(selectedUnitId);

                                    return (
                                        <button
                                            key={unit.id}
                                            type="button"
                                            onClick={() => !isDisabled && onSelect?.(unit)}
                                            disabled={isDisabled}
                                            title={statusStyle.label}
                                            className={`h-8 rounded border text-xs font-semibold transition-all ${
                                                isSelected
                                                    ? 'border-primary-500 bg-primary-600 text-white shadow-[0_0_0_1px_rgba(16,33,75,0.18)]'
                                                    : statusStyle.className
                                            } ${isDisabled ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5'}`}
                                        >
                                            {unit.code}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}
            {validationError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {validationError}
                </div>
            )}
        </div>
    );
}
