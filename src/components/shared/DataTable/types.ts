/**
 * DataTable component TypeScript interfaces
 * Defines the public API and contracts for DataTable functionality
 */

import React from 'react';
import type { RlsStatus } from '../../rls';

/**
 * Base component props for shared components
 */
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
    testId?: string;
}

/**
 * Common alignment options
 */
export type Alignment = 'left' | 'center' | 'right';

/**
 * Column configuration for DataTable
 */
export interface DataTableColumn<T = any> {
    /** Unique key for column */
    key: keyof T;
    /** Display label for column header */
    label: string;
    /** Whether column is sortable */
    sortable?: boolean;
    /** Fixed width for column */
    width?: string | number;
    /** Minimum width for column */
    minWidth?: string | number;
    /** Text alignment for column */
    align?: Alignment;
    /** Custom render function for cell content */
    render?: (value: any, row: T, index: number) => React.ReactNode;
    /** Additional CSS classes for column */
    className?: string;
    /** Additional CSS classes for column header */
    headerClassName?: string;
    /** Whether to hide column on mobile */
    hiddenMobile?: boolean;
    /** Whether to hide column on tablet */
    hiddenTablet?: boolean;
}

/**
 * Pagination configuration
 */
export interface DataTablePagination {
    /** Current page number (1-based) */
    page: number;
    /** Number of items per page */
    limit: number;
    /** Total number of items */
    total: number;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Callback when limit changes */
    onLimitChange?: (limit: number) => void;
    /** Available page size options */
    pageSizeOptions?: number[];
    /** Whether to show page size selector */
    showPageSizeSelector?: boolean;
    /** Whether to show pagination info */
    showPaginationInfo?: boolean;
}

/**
 * Sort configuration
 */
export interface DataTableSort<T = any> {
    /** Currently sorted column */
    column?: keyof T;
    /** Sort direction */
    direction?: 'asc' | 'desc';
    /** Callback when sort changes */
    onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
}

/**
 * Selection configuration
 */
export interface DataTableSelection<T = any> {
    /** Currently selected row IDs */
    selectedIds: string[];
    /** Callback when selection changes */
    onSelectionChange: (selectedIds: string[]) => void;
    /** Function to get unique ID from row */
    getRowId: (row: T) => string;
    /** Whether to allow multiple selection */
    multiple?: boolean;
    /** Whether to show select all checkbox */
    showSelectAll?: boolean;
}

/**
 * Action configuration for rows
 */
export interface DataTableAction<T = any> {
    /** Unique key for action */
    key: string;
    /** Display label for action */
    label: string;
    /** Icon name for action */
    icon?: string;
    /** Callback when action is triggered */
    onClick: (row: T) => void;
    /** Whether to show action */
    show?: (row: T) => boolean;
    /** Whether action is disabled */
    disabled?: (row: T) => boolean;
    /** Action variant */
    variant?: 'default' | 'destructive' | 'warning';
}

/**
 * Empty state configuration
 */
export interface DataTableEmptyState {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    icon?: string;
}

/**
 * Main DataTable props
 */
export interface DataTableProps<T = any> extends BaseComponentProps {
    /** Data to display */
    data: T[];
    /** Column configuration */
    columns: DataTableColumn<T>[];
    /** Loading state */
    loading?: boolean;
    /** Error state */
    error?: Error | null;

    /** Selection configuration */
    selection?: DataTableSelection<T>;

    /** Sort configuration */
    sort?: DataTableSort<T>;

    /** Pagination configuration */
    pagination?: DataTablePagination;

    /** Row actions */
    actions?: DataTableAction<T>[] | ((row: T) => React.ReactNode);

    /** Bulk actions for selected rows */
    bulkActions?: (selectedRows: T[]) => React.ReactNode;

    /** Row configuration */
    getRowId?: (row: T) => string;
    /** Custom row class name */
    rowClassName?: string | ((row: T, index: number) => string);
    /** Whether rows are clickable */
    clickable?: boolean;
    /** Callback when row is clicked */
    onRowClick?: (row: T, index: number) => void;

    /** Custom components */
    loadingComponent?: React.ReactNode;
    errorComponent?: (error: Error, retry: () => void) => React.ReactNode;
    emptyComponent?: React.ReactNode;
    headerComponent?: React.ReactNode;
    footerComponent?: React.ReactNode;

    /** Empty state configuration */
    empty?: DataTableEmptyState;

    /** Accessibility */
    ariaLabel?: string;
    tableCaption?: string;

    /** Responsive behavior */
    responsive?: boolean;
    virtualized?: boolean;
    virtualizedHeight?: number;

    /** RLS (Row Level Security) configuration */
    rlsStatus?: RlsStatus;
    rlsStatusPosition?: 'header' | 'footer' | 'both' | 'none';
    showRlsContext?: boolean;
    rlsUserRole?: string;
    rlsEmpresaId?: string;
    rlsEmpresaName?: string;
}

/**
 * DataTable row props
 */
export interface DataTableRowProps<T = any> {
    /** Row data */
    row: T;
    /** Column configuration */
    columns: DataTableColumn<T>[];
    /** Whether row is selected */
    selected?: boolean;
    /** Callback when selection changes */
    onSelect?: (selected: boolean) => void;
    /** Row actions */
    actions?: React.ReactNode;
    /** Custom class name */
    className?: string;
    /** Whether row is clickable */
    clickable?: boolean;
    /** Callback when row is clicked */
    onClick?: () => void;
    /** Row index */
    index: number;
    /** Status attribute for E2E testing */
    dataStatus?: string;
}

/**
 * DataTable cell props
 */
export interface DataTableCellProps {
    /** Cell content */
    children: React.ReactNode;
    /** Column configuration */
    column: DataTableColumn;
    /** Row data */
    row: any;
    /** Cell value */
    value: any;
    /** Row index */
    rowIndex: number;
    /** Custom class name */
    className?: string;
}

/**
 * DataTable pagination props
 */
export interface DataTablePaginationProps {
    /** Current page */
    page: number;
    /** Page limit */
    limit: number;
    /** Total items */
    total: number;
    /** Page change callback */
    onPageChange: (page: number) => void;
    /** Limit change callback */
    onLimitChange: (limit: number) => void;
    /** Available page sizes */
    pageSizeOptions?: number[];
    /** Show page size selector */
    showPageSizeSelector?: boolean;
    /** Show pagination info */
    showPaginationInfo?: boolean;
}