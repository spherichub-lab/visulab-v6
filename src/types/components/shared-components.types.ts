
/**
 * TypeScript interfaces for shared components
 * Defines the public APIs and contracts for all shared components
 */

import React from 'react';

// ============================================================================
// BASE INTERFACES
// ============================================================================

/**
 * Base props for all shared components
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

/**
 * Size variants for components
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Common alignment options
 */
export type Alignment = 'left' | 'center' | 'right';

/**
 * Common status types
 */
export type StatusType = 'success' | 'warning' | 'error' | 'info';

// ============================================================================
// DATA TABLE COMPONENTS
// ============================================================================

/**
 * Column configuration for DataTable
 */
export interface DataTableColumn<T = any> {
  /** Unique key for the column */
  key: keyof T;
  /** Display label for the column header */
  label: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Fixed width for the column */
  width?: string | number;
  /** Minimum width for the column */
  minWidth?: string | number;
  /** Text alignment for the column */
  align?: Alignment;
  /** Custom render function for cell content */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Additional CSS classes for the column */
  className?: string;
  /** Additional CSS classes for the column header */
  headerClassName?: string;
  /** Whether to hide the column on mobile */
  hiddenMobile?: boolean;
  /** Whether to hide the column on tablet */
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
  /** Unique key for the action */
  key: string;
  /** Display label for the action */
  label: string;
  /** Icon name for the action */
  icon?: string;
  /** Callback when action is triggered */
  onClick: (row: T) => void;
  /** Whether to show the action */
  show?: (row: T) => boolean;
  /** Whether the action is disabled */
  disabled?: (row: T) => boolean;
  /** Action variant */
  variant?: 'default' | 'destructive' | 'warning';
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
  empty?: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    icon?: string;
  };

  /** Accessibility */
  ariaLabel?: string;
  tableCaption?: string;

  /** Responsive behavior */
  responsive?: boolean;
  virtualized?: boolean;
  virtualizedHeight?: number;
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

// ============================================================================
// FORM LAYOUT COMPONENTS
// ============================================================================

/**
 * Form layout options
 */
export type FormLayoutType = 'vertical' | 'horizontal' | 'grid';

/**
 * Form spacing options
 */
export type FormSpacing = 'compact' | 'normal' | 'loose';

/**
 * Form field props
 */
export interface FormFieldProps extends BaseComponentProps {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Field description/help text */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Field error message */
  error?: string;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Field content */
  children: React.ReactNode;
}

/**
 * Form section props
 */
export interface FormSectionProps extends BaseComponentProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Section content */
  children: React.ReactNode;
  /** Whether section is bordered */
  bordered?: boolean;
}

/**
 * Form actions props
 */
export interface FormActionsProps extends BaseComponentProps {
  /** Action alignment */
  align?: Alignment;
  /** Action content */
  children: React.ReactNode;
  /** Whether to show loading state */
  loading?: boolean;
  /** Whether actions are disabled */
  disabled?: boolean;
}

/**
 * Main FormLayout props
 */
export interface FormLayoutProps extends BaseComponentProps {
  /** Form content */
  children: React.ReactNode;
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Layout type */
  layout?: FormLayoutType;
  /** Number of columns for grid layout */
  columns?: 1 | 2 | 3 | 4;
  /** Spacing between fields */
  spacing?: FormSpacing;

  /** Form state */
  loading?: boolean;
  disabled?: boolean;

  /** Form submission */
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;

  /** Actions configuration */
  actions?: React.ReactNode;
  actionsAlign?: Alignment;
  showActions?: boolean;

  /** Custom components */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;

  /** Responsive behavior */
  responsive?: boolean;
  stackedOnMobile?: boolean;
}

// ============================================================================
// PAGE HEADER COMPONENTS
// ============================================================================

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Item label */
  label: string;
  /** Item link */
  href?: string;
  /** Whether item is active */
  active?: boolean;
  /** Custom icon */
  icon?: string;
}

/**
 * Search configuration
 */
export interface PageHeaderSearch {
  /** Search placeholder */
  placeholder?: string;
  /** Current search value */
  value?: string;
  /** Callback when search changes */
  onChange?: (value: string) => void;
  /** Callback when search is cleared */
  onClear?: () => void;
  /** Debounce delay in ms */
  debounce?: number;
  /** Whether to show clear button */
  showClear?: boolean;
}

/**
 * Page header actions
 */
export interface PageHeaderAction {
  /** Action key */
  key: string;
  /** Action label */
  label: string;
  /** Action icon */
  icon?: string;
  /** Action variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Action size */
  size?: ComponentSize;
  /** Whether action is loading */
  loading?: boolean;
  /** Whether action is disabled */
  disabled?: boolean;
  /** Action callback */
  onClick?: () => void;
  /** Action href */
  href?: string;
}

/**
 * Main PageHeader props
 */
export interface PageHeaderProps extends BaseComponentProps {
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle?: string;
  /** Page description */
  description?: string;

  /** Navigation */
  breadcrumb?: BreadcrumbItem[];

  /** Actions */
  actions?: React.ReactNode | PageHeaderAction[];
  primaryAction?: React.ReactNode;

  /** Search */
  search?: PageHeaderSearch;

  /** Filters */
  filters?: React.ReactNode;

  /** Layout */
  size?: ComponentSize;
  sticky?: boolean;
  bordered?: boolean;

  /** Custom sections */
  left?: React.ReactNode;
  right?: React.ReactNode;
  center?: React.ReactNode;

  /** Responsive behavior */
  collapsibleOnMobile?: boolean;
  showBreadcrumbOnMobile?: boolean;
}

// ============================================================================
// FEEDBACK STATE COMPONENTS
// ============================================================================

/**
 * Feedback state types
 */
export type FeedbackType = 'loading' | 'empty' | 'error' | 'success' | 'warning' | 'info';

/**
 * Feedback variant
 */
export type FeedbackVariant = 'inline' | 'full' | 'modal' | 'card';

/**
 * Icon configuration
 */
export interface FeedbackIconProps {
  /** Icon name */
  name?: string;
  /** Icon size */
  size?: string;
  /** Icon custom class name */
  className?: string;
}

/**
 * Action configuration
 */
export interface FeedbackAction {
  /** Action label */
  label: string;
  /** Action callback */
  onClick: () => void;
  /** Action variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Action icon */
  icon?: string;
  /** Whether action is loading */
  loading?: boolean;
}

/**
 * Main FeedbackState props
 */
export interface FeedbackStateProps extends BaseComponentProps {
  /** Feedback type */
  type: FeedbackType;
  /** Feedback variant */
  variant?: FeedbackVariant;
  /** Component size */
  size?: ComponentSize;

  /** Content */
  title?: string;
  description?: string;
  action?: React.ReactNode | FeedbackAction;

  /** Icon configuration */
  icon?: string;
  iconProps?: FeedbackIconProps;

  /** Error specific */
  error?: Error;
  onRetry?: () => void;
  retryText?: string;

  /** Custom content */
  children?: React.ReactNode;

  /** Animation */
  animated?: boolean;
  animationDuration?: number;
}

// ============================================================================
// CONFIRM ACTION DIALOG COMPONENTS
// ============================================================================

/**
 * Action severity levels
 */
export type ActionSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Dialog variant
 */
export type DialogVariant = 'default' | 'destructive' | 'warning' | 'success';

/**
 * Item information
 */
export interface ConfirmActionItem {
  /** Item name */
  name: string;
  /** Item description */
  description?: string;
  /** Item avatar/icon */
  avatar?: React.ReactNode;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Dialog action
 */
export interface ConfirmDialogAction {
  /** Action label */
  label: string;
  /** Action callback */
  onClick: () => void | Promise<void>;
  /** Action variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  /** Action icon */
  icon?: string;
  /** Whether action is loading */
  loading?: boolean;
  /** Whether action is disabled */
  disabled?: boolean;
}

/**
 * Main ConfirmActionDialog props
 */
export interface ConfirmActionDialogProps extends BaseComponentProps {
  /** Dialog state */
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;

  /** Content */
  title?: string;
  description?: string;
  warning?: string;

  /** Item information */
  item?: ConfirmActionItem;

  /** Action configuration */
  confirmText?: string;
  cancelText?: string;
  severity?: ActionSeverity;
  variant?: DialogVariant;

  /** State */
  loading?: boolean;
  disabled?: boolean;
  closeOnConfirm?: boolean;

  /** Icon configuration */
  icon?: string;

  /** Dialog size */
  size?: ComponentSize;

  /** Custom sections */
  header?: React.ReactNode;
  content?: React.ReactNode;
  actions?: React.ReactNode;

  /** Accessibility */
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  preventClose?: boolean;
}

// ============================================================================
// THEME AND VARIANT SYSTEM
// ============================================================================

/**
 * Color palette
 */
export interface ColorPalette {
  /** Primary colors */
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  /** Secondary colors */
  secondary: ColorPalette['primary'];
  /** Success colors */
  success: ColorPalette['primary'];
  /** Warning colors */
  warning: ColorPalette['primary'];
  /** Error colors */
  error: ColorPalette['primary'];
  /** Neutral colors */
  neutral: ColorPalette['primary'];
}

/**
 * Spacing scale
 */
export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

/**
 * Typography scale
 */
export interface TypographyScale {
  xs: {
    fontSize: string;
    lineHeight: string;
    fontWeight: string;
  };
  sm: TypographyScale['xs'];
  md: TypographyScale['xs'];
  lg: TypographyScale['xs'];
  xl: TypographyScale['xs'];
  '2xl': TypographyScale['xs'];
  '3xl': TypographyScale['xs'];
}

/**
 * Border radius scale
 */
export interface BorderRadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Component theme configuration
 */
export interface ComponentTheme {
  /** Color palette */
  colors: ColorPalette;
  /** Spacing scale */
  spacing: SpacingScale;
  /** Typography scale */
  typography: TypographyScale;
  /** Border radius scale */
  borderRadius: BorderRadiusScale;
  /** Shadows */
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  /** Transitions */
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

/**
 * Component variant configuration
 */
export interface ComponentVariants {
  /** Size variants */
  size: ComponentSize;
  /** Color variants */
  variant: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** State variants */
  state: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract props from React component
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * Merge two types
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Create a strict version of a type (no extra properties)
 */
export type Strict<T> = T & Record<never, unknown>;

// ============================================================================
// EXPORTS
// ============================================================================

// All types are already exported via 'export interface' and 'export type' above
// No need for redundant export block
