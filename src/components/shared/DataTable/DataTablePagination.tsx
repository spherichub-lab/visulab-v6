/**
 * DataTablePagination - Pagination component for DataTable
 * Handles page navigation and page size selection
 */

import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { Button } from '../../ui';
import { cn } from '../../../utils';
import { DataTablePaginationProps } from './types';

/**
 * Pagination component for DataTable
 */
export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
    pageSizeOptions = [10, 25, 50],
    showPageSizeSelector = true,
    showPaginationInfo = true,
}) => {
    const [pageSizeOpen, setPageSizeOpen] = useState(false);

    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);

    // Generate page numbers to show
    const getVisiblePages = () => {
        const delta = 2; // Number of pages to show around current page
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
            onPageChange(newPage);
        }
    };

    const handlePageSizeChange = (newLimit: number) => {
        if (onLimitChange && newLimit !== limit) {
            onLimitChange(newLimit);
            setPageSizeOpen(false);
        }
    };

    const paginationInfo = showPaginationInfo && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {startIndex}-{endIndex} de {total} itens
        </div>
    );

    const pageSizeSelector = showPageSizeSelector && onLimitChange && (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPageSizeOpen(!pageSizeOpen)}
                className="flex items-center gap-2"
            >
                {limit} por página
                <Icon name="keyboard_arrow_down" className="!text-sm" />
            </Button>

            {pageSizeOpen && (
                <div className="absolute bottom-full mb-2 left-0 z-10 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg py-1 min-w-[120px]">
                    {pageSizeOptions.map((size) => (
                        <button
                            key={size}
                            onClick={() => handlePageSizeChange(size)}
                            className={cn(
                                'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                                size === limit && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            )}
                        >
                            {size} por página
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const pageNavigation = (
        <div className="flex items-center gap-1">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Página anterior"
            >
                <Icon name="chevron_left" />
            </Button>

            {getVisiblePages().map((pageNum, index) => (
                pageNum === '...' ? (
                    <span key={`dots-${index}`} className="px-3 py-1 text-sm text-slate-400">
                        ...
                    </span>
                ) : (
                    <Button
                        key={pageNum}
                        variant={pageNum === page ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum as number)}
                        className="min-w-[40px]"
                        aria-label={`Ir para página ${pageNum}`}
                        aria-current={pageNum === page ? 'page' : undefined}
                    >
                        {pageNum}
                    </Button>
                )
            ))}

            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Próxima página"
            >
                <Icon name="chevron_right" />
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-700">
            {paginationInfo}

            <div className="flex items-center gap-4">
                {pageSizeSelector}
                {pageNavigation}
            </div>
        </div>
    );
};

DataTablePagination.displayName = 'DataTablePagination';

export default DataTablePagination;