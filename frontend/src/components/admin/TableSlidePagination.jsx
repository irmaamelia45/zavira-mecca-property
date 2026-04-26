import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function TableSlidePagination({
    rangeStart = 0,
    rangeEnd = 0,
    totalItems = 0,
    totalPages = 1,
    currentPage = 0,
    itemLabel = 'data',
    onPrevious,
    onNext,
    canPrevious = false,
    canNext = false,
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm text-gray-600">
                Menampilkan baris {rangeStart}-{rangeEnd} dari {totalItems} {itemLabel}.
            </p>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={!canPrevious}
                    aria-label="Slide sebelumnya"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-primary-200 disabled:hover:bg-transparent"
                >
                    <FaChevronLeft className="text-sm" />
                </button>
                <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-primary-100 bg-white px-3 text-base font-semibold text-gray-900 shadow-sm">
                    {currentPage + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">
                    dari <span className="text-gray-900">{totalPages}</span>
                </span>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canNext}
                    aria-label="Slide berikutnya"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-primary-200 disabled:hover:bg-transparent"
                >
                    <FaChevronRight className="text-sm" />
                </button>
            </div>
        </div>
    );
}
