/**
 * Shared components index file
 * Central export point for all shared components
 */

// DataTable
export {
    DataTable,
    DataTableRow,
    DataTableCell,
    DataTablePagination
} from './DataTable';
export type {
    DataTableColumn,
    DataTablePagination as DataTablePaginationType,
    DataTableSort,
    DataTableSelection,
    DataTableAction,
    DataTableEmptyState,
    DataTableProps,
    DataTableRowProps,
    DataTableCellProps,
    DataTablePaginationProps,
} from './DataTable';

// FormLayout
export {
    FormLayout,
    FormField,
    FormSection,
    FormActions
} from './FormLayout';
export type {
    FormLayoutType,
    FormSpacing,
    FormFieldProps,
    FormSectionProps,
    FormActionsProps,
    FormLayoutProps,
} from './FormLayout';

// PageHeader
export {
    PageHeader,
    PageHeaderBreadcrumb,
    PageHeaderSearch,
    PageHeaderActions,
    renderActions
} from './PageHeader';
export type {
    BreadcrumbItem,
    PageHeaderSearch as PageHeaderSearchType,
    PageHeaderAction,
    PageHeaderProps,
    PageHeaderBreadcrumbProps,
    PageHeaderActionsProps,
    PageHeaderSearchProps,
} from './PageHeader';

// FeedbackState
export { FeedbackState } from './FeedbackState';
export type {
    FeedbackType,
    FeedbackVariant,
    FeedbackIconProps,
    FeedbackAction,
    FeedbackStateProps,
} from './FeedbackState';

// ConfirmActionDialog
export { ConfirmActionDialog } from './ConfirmActionDialog';
export type {
    ActionSeverity,
    DialogVariant,
    ConfirmActionItem,
    ConfirmDialogAction,
    ConfirmActionDialogProps,
} from './ConfirmActionDialog';

// Common types
export type {
    BaseComponentProps,
    Alignment,
    ComponentSize,
} from './types';