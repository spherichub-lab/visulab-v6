/**
 * DataTable - Advanced tabular data display component
 * Features sorting, pagination, filtering, and row selection
 */

import React, { useMemo, useCallback } from 'react';
import { Icon } from '../../../../components/Icon';
import { LoadingSpinner } from '../../ui';
import { cn } from '../../../utils';
import { DataTableProps } from './types';
import { DataTableRow } from './DataTableRow';
import { DataTablePagination } from './DataTablePagination';
import { RlsStatusIndicator, RlsContextDisplay } from '../../rls';

/**
 * Loading state component
 */
const DataTableLoading = ({ columns, rows = 5 }: { columns: any[], rows?: number }) => (
    <div className="animate-pulse">
        {[...Array(rows)].map((_, index) => (
            <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    </td>
                ))}
            </tr>
        ))}
    </div>
);

/**
 * Empty state component
 */
const DataTableEmpty = ({
    title = "Nenhum dado encontrado",
    description,
    action,
    icon = "inbox"
}: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    icon?: string;
}) => (
    <tr>
        <td colSpan={999} className="px-6 py-16">
            <div className="flex flex-col items-center justify-center">
                <Icon name={icon} className="!text-4xl text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {title}
                </h3>
                {description && (
                    <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                        {description}
                    </p>
                )}
                {action}
            </div>
        </td>
    </tr>
);

/**
 * Error state component
 */
const DataTableError = ({
    error,
    onRetry
}: {
    error?: Error | null;
    onRetry?: () => void;
}) => (
    <tr>
        <td colSpan={999} className="px-6 py-16">
            <div className="flex flex-col items-center justify-center">
                <Icon name="error" className="!text-4xl text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Erro ao carregar dados
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                    {error?.message || 'Ocorreu um erro inesperado.'}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                    >
                        <Icon name="refresh" className="!text-sm mr-2" />
                        Tentar novamente
                    </button>
                )}
            </div>
        </td>
    </tr>
);

/**
 * Main DataTable component
 */
export const DataTable = <T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    error = null,
    selection,
    sort,
    pagination,
    actions,
    bulkActions,
    getRowId,
    rowClassName,
    clickable = false,
    onRowClick,
    loadingComponent,
    errorComponent,
    emptyComponent,
    headerComponent,
    footerComponent,
    empty,
    ariaLabel,
    tableCaption,
    responsive = true,
    virtualized = false,
    virtualizedHeight = 400,
    className,
    testId,
    rlsStatus,
    rlsStatusPosition = 'header',
    showRlsContext = false,
    rlsUserRole,
    rlsEmpresaId,
    rlsEmpresaName,
}: DataTableProps<T>) => {
    // Handle sort change
    const handleSort = useCallback((column: keyof T) => {
        if (!sort?.onSort || !columns.find(col => col.key === column)?.sortable) {
            return;
        }

        const newDirection = sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc';
        sort.onSort(column, newDirection);
    }, [sort, columns]);

    // Handle selection change
    const handleSelectionChange = useCallback((row: T, selected: boolean) => {
        if (!selection) return;

        const rowId = selection.getRowId(row);
        const newSelectedIds = selected
            ? [...selection.selectedIds, rowId]
            : selection.selectedIds.filter(id => id !== rowId);

        selection.onSelectionChange(newSelectedIds);
    }, [selection]);

    // Handle select all
    const handleSelectAll = useCallback((selected: boolean) => {
        if (!selection) return;

        const newSelectedIds = selected
            ? data.map(selection.getRowId)
            : [];

        selection.onSelectionChange(newSelectedIds);
    }, [selection, data]);

    // Handle row click
    const handleRowClick = useCallback((row: T, index: number) => {
        if (onRowClick) {
            onRowClick(row, index);
        }
    }, [onRowClick]);

    // Render row actions
    const renderRowActions = useCallback((row: T) => {
        if (!actions) return null;

        if (Array.isArray(actions)) {
            return (
                <div className="flex items-center gap-1">
                    {actions.map((action) => {
                        if (action.show && !action.show(row)) return null;

                        const isDisabled = action.disabled && action.disabled(row);

                        return (
                            <button
                                key={action.key}
                                onClick={() => action.onClick(row)}
                                disabled={isDisabled}
                                className={cn(
                                    'p-1.5 rounded-lg transition-colors',
                                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                                    'text-slate-500 dark:text-slate-400',
                                    'hover:text-slate-700 dark:hover:text-slate-300',
                                    isDisabled && 'opacity-50 cursor-not-allowed'
                                )}
                                title={action.label}
                                data-action={action.key}
                            >
                                <Icon name={action.icon || 'more_vert'} className="!text-sm" />
                            </button>
                        );
                    })}
                </div>
            );
        }

        return typeof actions === 'function' ? actions(row) : null;
    }, [actions]);

    // Check if all items are selected
    const isAllSelected = useMemo(() => {
        if (!selection || data.length === 0) return false;
        return data.every(row =>
            selection.selectedIds.includes(selection.getRowId(row))
        );
    }, [selection, data]);

    // Check if some items are selected (for indeterminate state)
    const isSomeSelected = useMemo(() => {
        if (!selection || data.length === 0) return false;
        const selectedCount = data.filter(row =>
            selection.selectedIds.includes(selection.getRowId(row))
        ).length;
        return selectedCount > 0 && selectedCount < data.length;
    }, [selection, data]);

    const tableClasses = cn(
        'w-full border-collapse',
        className
    );

    const containerClasses = cn(
        'relative overflow-x-auto',
        virtualized && 'overflow-y-auto'
    );

    const renderTable = () => (
        <table
            className={tableClasses}
            aria-label={ariaLabel}
            role="table"
            data-testid={testId}
        >
            {tableCaption && (
                <caption className="sr-only">{tableCaption}</caption>
            )}

            {/* Table Header */}
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                    {/* Selection header */}
                    {selection && selection.showSelectAll !== false && (
                        <th className="w-12 px-6 py-3 text-left">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                ref={(el) => {
                                    if (el) el.indeterminate = isSomeSelected;
                                }}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-primary-500 dark:focus:ring-primary-400"
                                aria-label="Selecionar todos os itens"
                            />
                        </th>
                    )}

                    {/* Column headers */}
                    {columns.map((column) => {
                        const isSorted = sort?.column === column.key;
                        const sortDirection = isSorted ? sort.direction : undefined;

                        const headerClasses = cn(
                            'px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider',
                            column.headerClassName,
                            {
                                'text-center': column.align === 'center',
                                'text-right': column.align === 'right',
                                'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700': column.sortable,
                                'bg-slate-100 dark:bg-slate-700': isSorted,
                            }
                        );

                        return (
                            <th
                                key={String(column.key)}
                                scope="col"
                                className={headerClasses}
                                style={{
                                    width: column.width,
                                    minWidth: column.minWidth,
                                }}
                                onClick={() => column.sortable && handleSort(column.key)}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{column.label}</span>
                                    {column.sortable && (
                                        <div className="flex flex-col">
                                            <Icon
                                                name="arrow_upward"
                                                className={cn(
                                                    '!text-xs',
                                                    isSorted && sortDirection === 'asc'
                                                        ? 'text-primary-600 dark:text-primary-400'
                                                        : 'text-slate-400'
                                                )}
                                            />
                                            <Icon
                                                name="arrow_downward"
                                                className={cn(
                                                    '!text-xs -mt-1',
                                                    isSorted && sortDirection === 'desc'
                                                        ? 'text-primary-600 dark:text-primary-400'
                                                        : 'text-slate-400'
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                            </th>
                        );
                    })}

                    {/* Actions header */}
                    {actions && (
                        <th
                            className="w-12 px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                            style={{ width: '48px' }}
                        >
                            Ações
                        </th>
                    )}
                </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white dark:bg-surface-dark divide-y divide-slate-100 dark:divide-slate-700">
                {loading && (
                    <DataTableLoading columns={columns} rows={5} />
                )}

                {!loading && error && (
                    <DataTableError error={error} onRetry={() => { }} />
                )}

                {!loading && !error && data.length === 0 && (
                    <DataTableEmpty
                        title={empty?.title}
                        description={empty?.description}
                        icon={empty?.icon}
                        action={empty?.action}
                    />
                )}

                {!loading && !error && data.length > 0 && (
                    data.map((row, index) => {
                        const rowId = getRowId ? getRowId(row) : String(index);
                        const isSelected = selection?.selectedIds.includes(rowId);

                        return (
                            <DataTableRow
                                key={rowId}
                                row={row}
                                columns={columns}
                                selected={isSelected}
                                onSelect={selection ? (selected) => handleSelectionChange(row, selected) : undefined}
                                actions={renderRowActions(row)}
                                className={rowClassName}
                                clickable={clickable}
                                onClick={() => handleRowClick(row, index)}
                                index={index}
                                dataStatus={(row as any).status}
                            />
                        );
                    })
                )}
            </tbody>
        </table>
    );

    const renderBulkActions = () => {
        if (!bulkActions || !selection || selection.selectedIds.length === 0) {
            return null;
        }

        const selectedRows = data.filter(row =>
            selection.selectedIds.includes(selection.getRowId(row))
        );

        return (
            <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-b border-slate-100 dark:border-slate-700 px-6 py-3" data-testid="bulk-actions">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        {selection.selectedIds.length} item(s) selecionado(s)
                    </span>
                    {bulkActions(selectedRows)}
                </div>
            </div>
        );
    };

    // Render RLS status indicator
    const renderRlsStatus = () => {
        if (!rlsStatus || rlsStatusPosition === 'none') {
            return null;
        }

        return (
            <div className="flex items-center justify-end mb-3">
                {showRlsContext && rlsStatus ? (
                    <RlsContextDisplay
                        status={rlsStatus}
                        userRole={rlsUserRole}
                        empresaId={rlsEmpresaId}
                        empresaName={rlsEmpresaName}
                    />
                ) : (
                    <RlsStatusIndicator
                        status={rlsStatus}
                        size="sm"
                    />
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* Custom header component */}
            {headerComponent && (
                <div className="mb-4">
                    {headerComponent}
                </div>
            )}

            {/* RLS status in header */}
            {(rlsStatusPosition === 'header' || rlsStatusPosition === 'both') && renderRlsStatus()}

            {/* Bulk actions */}
            {renderBulkActions()}

            {/* Table container */}
            <div className={containerClasses} style={{ height: virtualized ? virtualizedHeight : undefined }}>
                {renderTable()}
            </div>

            {/* Pagination */}
            {pagination && !loading && !error && data.length > 0 && (
                <DataTablePagination {...pagination} />
            )}

            {/* RLS status in footer */}
            {(rlsStatusPosition === 'footer' || rlsStatusPosition === 'both') && renderRlsStatus()}

            {/* Custom footer component */}
            {footerComponent && (
                <div className="mt-4">
                    {footerComponent}
                </div>
            )}
        </div>
    );
};

DataTable.displayName = 'DataTable';

export default DataTable;