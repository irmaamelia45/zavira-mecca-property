import React, { useMemo, useState } from 'react';
import TableSlidePagination from './TableSlidePagination';
import useTableSlidePagination from '../../hooks/useTableSlidePagination';
import {
    formatSalesModeLabel,
    formatUnitInventoryLabel,
    unitInventoryBadgeClass,
    unitSalesModeBadgeClass,
} from '../../utils/propertyUnits';

export default function PropertyUnitConfigTable({
    unitBlocks = [],
    onUnitFieldChange,
    title = 'Pengaturan Unit Per Blok',
    helperText = 'Atur mode penjualan unit dan estimasi selesai untuk unit indent. Pengaturan ini akan tersimpan saat data perumahan disimpan.',
}) {
    const [selectedBlockFilter, setSelectedBlockFilter] = useState('all');

    const blockOptions = useMemo(() => (
        (unitBlocks || []).map((block, index) => ({
            value: String(index),
            label: block?.blockName || `Blok ${index + 1}`,
        }))
    ), [unitBlocks]);

    const activeBlockFilter = blockOptions.some((block) => block.value === selectedBlockFilter)
        ? selectedBlockFilter
        : 'all';

    const filteredUnitRows = useMemo(() => (
        (unitBlocks || []).flatMap((block, blockIndex) => {
            if (activeBlockFilter !== 'all' && activeBlockFilter !== String(blockIndex)) {
                return [];
            }

            return (block?.units || []).map((unit, unitIndex) => ({
                ...unit,
                blockIndex,
                unitIndex,
            }));
        })
    ), [activeBlockFilter, unitBlocks]);

    const {
        currentPage,
        totalPages,
        paginatedRows: visibleUnitRows,
        rangeStart,
        rangeEnd,
        canPrevious,
        canNext,
        goPrevious,
        goNext,
    } = useTableSlidePagination(filteredUnitRows, {
        rowsPerPage: 10,
        resetDeps: [activeBlockFilter],
    });

    return (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
                    <p className="text-xs text-gray-500">{helperText}</p>
                </div>

                {blockOptions.length > 0 && (
                    <div className="w-full lg:w-56">
                        <label htmlFor="property-unit-block-filter" className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                            Filter Blok
                        </label>
                        <select
                            id="property-unit-block-filter"
                            value={activeBlockFilter}
                            onChange={(event) => {
                                setSelectedBlockFilter(event.target.value);
                            }}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                            <option value="all">Semua Blok</option>
                            {blockOptions.map((block) => (
                                <option key={block.value} value={block.value}>
                                    {block.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
                <p className="text-sm text-gray-600">
                    {activeBlockFilter === 'all'
                        ? 'Menampilkan seluruh unit dari semua blok.'
                        : `Menampilkan unit untuk ${blockOptions.find((block) => block.value === activeBlockFilter)?.label || 'blok terpilih'}.`}
                </p>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                    {filteredUnitRows.length} Unit
                </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full min-w-[900px] text-left text-sm text-gray-700">
                    <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200 text-[11px] uppercase tracking-[0.08em] text-gray-500">
                            <th className="px-4 py-3 font-semibold">Unit</th>
                            <th className="px-4 py-3 font-semibold">Status Unit</th>
                            <th className="px-4 py-3 font-semibold">Mode Saat Ini</th>
                            <th className="px-4 py-3 font-semibold">Ubah Mode</th>
                            <th className="px-4 py-3 font-semibold">Estimasi Selesai</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/80">
                        {visibleUnitRows.length > 0 ? visibleUnitRows.map((unit) => {
                            const isIndent = unit.salesMode === 'indent';

                            return (
                                <tr key={`${unit.blockIndex}-${unit.unitIndex}`} className="align-middle">
                                    <td className="px-4 py-4">
                                        <p className="text-base font-bold text-[#0b1e45]">{unit.code}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${unitInventoryBadgeClass(unit.status)}`}>
                                            {formatUnitInventoryLabel(unit.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${unitSalesModeBadgeClass(unit.salesMode)}`}>
                                            {formatSalesModeLabel(unit.salesMode)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <select
                                            value={unit.salesMode}
                                            onChange={(event) => {
                                                const nextMode = event.target.value;
                                                onUnitFieldChange?.(unit.blockIndex, unit.unitIndex, 'salesMode', nextMode);
                                                if (nextMode !== 'indent') {
                                                    onUnitFieldChange?.(unit.blockIndex, unit.unitIndex, 'estimatedCompletionDate', '');
                                                }
                                            }}
                                            className="w-full min-w-[170px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                        >
                                            <option value="ready_stock">Ready Stock</option>
                                            <option value="indent">Indent</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4">
                                        <input
                                            type="date"
                                            value={unit.estimatedCompletionDate || ''}
                                            onChange={(event) => onUnitFieldChange?.(unit.blockIndex, unit.unitIndex, 'estimatedCompletionDate', event.target.value)}
                                            disabled={!isIndent}
                                            className="w-full min-w-[170px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                                        />
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                    Tidak ada unit yang bisa ditampilkan untuk filter ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <TableSlidePagination
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                totalItems={filteredUnitRows.length}
                totalPages={totalPages}
                currentPage={currentPage}
                itemLabel="unit"
                canPrevious={canPrevious}
                canNext={canNext}
                onPrevious={goPrevious}
                onNext={goNext}
            />
        </div>
    );
}
