const defaultBlockName = (index = 0) => `Blok ${String.fromCharCode(65 + Math.min(index, 25))}`;

export const normalizeBlockCode = (blockName, index = 0) => {
    const normalized = String(blockName || '')
        .trim()
        .toUpperCase()
        .replace(/^BLOK\s*/, '')
        .replace(/[^A-Z0-9]/g, '');

    return normalized || `B${index + 1}`;
};

const resolveUnitNumber = (unit, fallbackNumber) => {
    const explicitNumber = Number(unit?.unitNumber ?? unit?.unit_number);
    if (Number.isInteger(explicitNumber) && explicitNumber > 0) {
        return explicitNumber;
    }

    const match = String(unit?.code || '').match(/(\d+)$/);
    if (match) {
        return Number(match[1]);
    }

    return fallbackNumber;
};

export const formatUnitInventoryLabel = (status) => {
    if (status === 'pending') return 'Terbooking';
    if (status === 'sold') return 'Terjual';
    return 'Tersedia';
};

export const unitInventoryBadgeClass = (status) => {
    if (status === 'pending') return 'border-amber-200 bg-amber-100 text-amber-700';
    if (status === 'sold') return 'border-rose-200 bg-rose-100 text-rose-700';
    return 'border-emerald-200 bg-emerald-100 text-emerald-700';
};

export const formatSalesModeLabel = (salesMode) => (
    salesMode === 'indent' ? 'Indent' : 'Ready Stock'
);

export const unitSalesModeBadgeClass = (salesMode) => (
    salesMode === 'indent'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-sky-200 bg-sky-50 text-sky-700'
);

export const syncPropertyUnitBlock = (block = {}, index = 0) => {
    const blockName = String(block?.blockName || block?.block_name || '').trim() || defaultBlockName(index);
    const unitCount = Math.max(1, Number(block?.unitCount ?? block?.unit_count) || 1);
    const blockCode = normalizeBlockCode(blockName, index);
    const existingUnits = Array.isArray(block?.units) ? block.units : [];
    const unitsByNumber = existingUnits.reduce((accumulator, unit, unitIndex) => {
        const unitNumber = resolveUnitNumber(unit, unitIndex + 1);
        accumulator[unitNumber] = {
            ...unit,
            unitNumber,
        };
        return accumulator;
    }, {});

    const units = Array.from({ length: unitCount }, (_, indexUnit) => {
        const unitNumber = indexUnit + 1;
        const existing = unitsByNumber[unitNumber] || {};

        return {
            id: existing?.id ?? null,
            unitNumber,
            code: `${blockCode}${unitNumber}`,
            status: existing?.status || 'available',
            salesMode: existing?.salesMode || existing?.sales_mode || 'ready_stock',
            estimatedCompletionDate: existing?.estimatedCompletionDate || existing?.estimated_completion_date || '',
        };
    });

    return {
        blockName,
        unitCount,
        units,
    };
};

export const createPropertyUnitBlock = (index = 0) => (
    syncPropertyUnitBlock({
        blockName: defaultBlockName(index),
        unitCount: 1,
        units: [{ unitNumber: 1, salesMode: 'ready_stock', estimatedCompletionDate: '', status: 'available' }],
    }, index)
);

export const normalizePropertyUnitBlocks = (blocks = []) => {
    const sourceBlocks = Array.isArray(blocks) && blocks.length
        ? blocks
        : [createPropertyUnitBlock(0)];

    return sourceBlocks.map((block, index) => syncPropertyUnitBlock(block, index));
};
