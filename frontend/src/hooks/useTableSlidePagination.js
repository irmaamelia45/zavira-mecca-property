import { useCallback, useMemo, useState } from 'react';

export default function useTableSlidePagination(rows = [], options = {}) {
    const {
        rowsPerPage = 10,
        resetDeps = [],
    } = options;

    const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);
    const resetKey = JSON.stringify(Array.isArray(resetDeps) ? resetDeps : []);
    const [pagination, setPagination] = useState(() => ({
        page: 0,
        resetKey,
    }));

    const totalItems = safeRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const requestedPage = pagination.resetKey === resetKey ? pagination.page : 0;
    const currentPage = Math.min(requestedPage, totalPages - 1);

    const setCurrentPage = useCallback((value) => {
        setPagination((prev) => {
            const basePage = prev.resetKey === resetKey ? prev.page : 0;
            const boundedBasePage = Math.min(basePage, totalPages - 1);
            const nextPage = typeof value === 'function' ? value(boundedBasePage) : value;
            const normalizedPage = Math.max(0, Math.min(Number(nextPage) || 0, totalPages - 1));

            return {
                page: normalizedPage,
                resetKey,
            };
        });
    }, [resetKey, totalPages]);

    const paginatedRows = useMemo(() => (
        safeRows.slice(
            currentPage * rowsPerPage,
            (currentPage * rowsPerPage) + rowsPerPage
        )
    ), [currentPage, rowsPerPage, safeRows]);

    const rangeStart = totalItems === 0 ? 0 : (currentPage * rowsPerPage) + 1;
    const rangeEnd = Math.min((currentPage + 1) * rowsPerPage, totalItems);

    return {
        currentPage,
        setCurrentPage,
        totalItems,
        totalPages,
        paginatedRows,
        rangeStart,
        rangeEnd,
        startIndex: currentPage * rowsPerPage,
        canPrevious: currentPage > 0,
        canNext: totalItems > 0 && currentPage < totalPages - 1,
        goPrevious: () => setCurrentPage((prev) => Math.max(prev - 1, 0)),
        goNext: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1)),
    };
}
