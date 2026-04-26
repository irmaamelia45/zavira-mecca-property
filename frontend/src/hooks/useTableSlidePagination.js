import { useEffect, useMemo, useState } from 'react';

export default function useTableSlidePagination(rows = [], options = {}) {
    const {
        rowsPerPage = 10,
        resetDeps = [],
    } = options;

    const safeRows = Array.isArray(rows) ? rows : [];
    const [currentPage, setCurrentPage] = useState(0);

    const totalItems = safeRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

    useEffect(() => {
        setCurrentPage(0);
    }, resetDeps);

    useEffect(() => {
        setCurrentPage((prev) => Math.min(prev, totalPages - 1));
    }, [totalPages]);

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
