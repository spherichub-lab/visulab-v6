# TypeScript Interfaces for Shared Components

## Overview

This document contains the complete TypeScript interface definitions for all shared components in the VisuLab application. These interfaces define the public APIs and contracts that ensure type safety and developer experience.

---

## BASE INTERFACES

### BaseComponentProps

```typescript
/**
 * Base props for all shared components
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}
```

### ComponentSize

```typescript
/**
 * Size variants for components
 */
export type ComponentSize = 'sm' | 'md' | 'lg';
```

### Alignment

```typescript
/**
 * Common alignment options
 */
export type Alignment = 'left' | 'center' | 'right';
```

### StatusType

```typescript
/**
 * Common status types
 */
export type StatusType = 'success' | 'warning' | 'error' | 'info';
```

---

## DATA TABLE COMPONENTS

### DataTableColumn

```typescript
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
```

### DataTablePagination

```typescript
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
```

### DataTableSort

```typescript
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
```

### DataTableSelection

```typescript
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
```

### DataTableAction

```typescript
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
```

### DataTableProps

```typescript
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
```

### DataTableRowProps

```typescript
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
```

### DataTableCellProps

```typescript
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
```

---

## FORM LAYOUT COMPONENTS

### FormLayoutType

```typescript
/**
 * Form layout options
 */
export type FormLayoutType = 'vertical' | 'horizontal' | 'grid';
```

### FormSpacing

```typescript
/**
 * Form spacing options
 */
export type FormSpacing = 'compact' | 'normal' | 'loose';
```

### FormFieldProps

```typescript
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
```

### FormSectionProps

```typescript
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
```

### FormActionsProps

```typescript
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
```

### FormLayoutProps

```typescript
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
```

---

## PAGE HEADER COMPONENTS

### BreadcrumbItem

```typescript
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
```

### PageHeaderSearch

```typescript
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
```

### PageHeaderAction

```typescript
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
```

### PageHeaderProps

```typescript
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
```

---

## FEEDBACK STATE COMPONENTS

### FeedbackType

```typescript
/**
 * Feedback state types
 */
export type FeedbackType = 'loading' | 'empty' | 'error' | 'success' | 'warning' | 'info';
```

### FeedbackVariant

```typescript
/**
 * Feedback variant
 */
export type FeedbackVariant = 'inline' | 'full' | 'modal' | 'card';
```

### FeedbackIconProps

```typescript
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
```

### FeedbackAction

```typescript
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
```

### FeedbackStateProps

```typescript
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
```

---

## CONFIRM ACTION DIALOG COMPONENTS

### ActionSeverity

```typescript
/**
 * Action severity levels
 */
export type ActionSeverity = 'low' | 'medium' | 'high' | 'critical';
```

### DialogVariant

```typescript
/**
 * Dialog variant
 */
export type DialogVariant = 'default' | 'destructive' | 'warning' | 'success';
```

### ConfirmActionItem

```typescript
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
```

### ConfirmDialogAction

```typescript
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
```

### ConfirmActionDialogProps

```typescript
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
```

---

## THEME AND VARIANT SYSTEM

### ColorPalette

```typescript
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
```

### SpacingScale

```typescript
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
```

### TypographyScale

```typescript
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
```

### BorderRadiusScale

```typescript
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
```

### ComponentTheme

```typescript
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
```

### ComponentVariants

```typescript
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
```

---

## UTILITY TYPES

### DeepPartial

```typescript
/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### ComponentProps

```typescript
/**
 * Extract props from React component
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;
```

### Merge

```typescript
/**
 * Merge two types
 */
export type Merge<T, U> = Omit<T, keyof U> & U;
```

### Strict

```typescript
/**
 * Create a strict version of a type (no extra properties)
 */
export type Strict<T> = T & Record<never, unknown>;
```

---

## USAGE EXAMPLES

### DataTable Example

```typescript
interface Empresa {
  id: string;
  nome: string;
  tipo: 'Fornecedor' | 'Filial' | 'Matriz';
  status: 'Ativa' | 'Inativa';
  contato_email?: string;
}

const columns: DataTableColumn<Empresa>[] = [
  {
    key: 'nome',
    label: 'Empresa',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <EmpresaAvatar empresa={row} />
        <span>{value}</span>
      </div>
    )
  },
  {
    key: 'tipo',
    label: 'Tipo',
    align: 'center',
    render: (value) => <TipoBadge tipo={value} />
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (value) => (
      <span className={`status-${value.toLowerCase()}`}>
        {value}
      </span>
    )
  }
];

<DataTable<Empresa>
  data={empresas}
  columns={columns}
  loading={isLoading}
  error={error}
  selection={{
    selectedIds,
    onSelectionChange: setSelectedIds,
    getRowId: (empresa) => empresa.id,
    multiple: true
  }}
  pagination={{
    page: currentPage,
    limit: pageSize,
    total: totalCount,
    onPageChange: setCurrentPage,
    onLimitChange: setPageSize,
    pageSizeOptions: [10, 25, 50, 100]
  }}
  actions={[
    {
      key: 'edit',
      label: 'Editar',
      icon: 'edit',
      onClick: (empresa) => editEmpresa(empresa)
    },
    {
      key: 'delete',
      label: 'Excluir',
      icon: 'delete',
      variant: 'destructive',
      onClick: (empresa) => deleteEmpresa(empresa)
    }
  ]}
  empty={{
    title: 'Nenhuma empresa encontrada',
    description: 'Crie sua primeira empresa para começar',
    action: <Button onClick={createEmpresa}>Nova Empresa</Button>,
    icon: 'business'
  }}
/>
```

### FormLayout Example

```typescript
<FormLayout
  title="Nova Empresa"
  description="Preencha as informações abaixo para criar uma nova empresa"
  layout="grid"
  columns={2}
  spacing="normal"
  onSubmit={handleSubmit}
  loading={isSubmitting}
  submitText="Criar Empresa"
>
  <FormSection title="Informações Básicas">
    <FormField name="nome" label="Nome da Empresa" required>
      <Input
        value={formData.nome}
        onChange={(value) => setFormData({ ...formData, nome: value })}
        error={errors.nome}
        placeholder="Ex: LensTech Soluções"
      />
    </FormField>
    
    <FormField name="tipo" label="Tipo" required>
      <CustomSelect
        value={formData.tipo}
        onChange={(value) => setFormData({ ...formData, tipo: value })}
        options={['Fornecedor', 'Filial', 'Matriz']}
        placeholder="Selecione o tipo"
      />
    </FormField>
  </FormSection>
  
  <FormSection title="Informações de Contato">
    <FormField name="contato_nome" label="Nome do Contato">
      <Input
        value={formData.contato_nome}
        onChange={(value) => setFormData({ ...formData, contato_nome: value })}
        placeholder="Ex: João Silva"
      />
    </FormField>
    
    <FormField name="contato_email" label="Email do Contato">
      <Input
        type="email"
        value={formData.contato_email}
        onChange={(value) => setFormData({ ...formData, contato_email: value })}
        placeholder="Ex: joao@empresa.com"
        error={errors.contato_email}
      />
    </FormField>
  </FormSection>
</FormLayout>
```

### PageHeader Example

```typescript
<PageHeader
  title="Empresas"
  description="Gerencie as empresas cadastradas no sistema"
  breadcrumb={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Empresas', active: true }
  ]}
  search={{
    placeholder: "Buscar empresas...",
    value: searchQuery,
    onChange: setSearchQuery,
    debounce: 300,
    showClear: true
  }}
  actions={[
    {
      key: 'export',
      label: 'Exportar',
      icon: 'download',
      variant: 'outline',
      onClick: exportData
    },
    {
      key: 'create',
      label: 'Nova Empresa',
      icon: 'add',
      variant: 'primary',
      onClick: createEmpresa
    }
  ]}
  filters={
    <div className="flex gap-2">
      <CustomSelect
        value={filterTipo}
        onChange={setFilterTipo}
        options={tipoOptions}
        placeholder="Tipo"
      />
      <CustomSelect
        value={filterStatus}
        onChange={setFilterStatus}
        options={statusOptions}
        placeholder="Status"
      />
    </div>
  }
  sticky
  size="md"
/>
```

### FeedbackState Example

```typescript
// Loading state
<FeedbackState
  type="loading"
  title="Carregando empresas..."
  description="Aguarde um momento enquanto buscamos os dados"
  size="lg"
  animated
/>

// Empty state
<FeedbackState
  type="empty"
  title="Nenhuma empresa encontrada"
  description="Comece criando sua primeira empresa"
  icon="business"
  action={{
    label: "Criar Empresa",
    onClick: createEmpresa,
    variant: "primary",
    icon: "add"
  }}
  variant="full"
  size="md"
/>

// Error state
<FeedbackState
  type="error"
  title="Erro ao carregar empresas"
  description="Não foi possível carregar a lista de empresas"
  error={error}
  onRetry={() => refetch()}
  retryText="Tentar novamente"
  action={{
    label: "Criar Nova Empresa",
    onClick: () => navigate('/empresas/new'),
    variant: "outline"
  }}
  variant="full"
/>
```

### ConfirmActionDialog Example

```typescript
<ConfirmActionDialog
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleDelete}
  title="Excluir Empresa"
  description={`Tem certeza que deseja excluir "${empresa?.nome}"?`}
  warning="Esta ação não pode ser desfeita e todos os dados associados serão perdidos."
  item={{
    name: empresa?.nome || '',
    description: `${empresa?.tipo} • ${empresa?.status}`,
    avatar: (
      <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
        {empresa?.nome?.substring(0, 2).toUpperCase()}
      </div>
    ),
    metadata: {
      'ID': empresa?.id,
      'Criado em': new Date(empresa?.created_at).toLocaleDateString('pt-BR')
    }
  }}
  confirmText="Excluir Permanentemente"
  cancelText="Cancelar"
  severity="critical"
  variant="destructive"
  loading={isDeleting}
  icon="delete_forever"
  size="md"
  closeOnEscape
  closeOnBackdrop
/>
```

---

## IMPLEMENTATION NOTES

1. **Type Safety**: All interfaces are strictly typed to ensure compile-time safety
2. **Extensibility**: Components support composition and customization through props
3. **Accessibility**: All interfaces include accessibility-related properties
4. **Responsive**: Components have built-in responsive behavior options
5. **Performance**: Interfaces support virtualization and optimization features
6. **Theming**: Complete theme system with design tokens
7. **Internationalization**: Text content is externalized through props
8. **Testing**: All interfaces include testId for automated testing

These interfaces provide a solid foundation for implementing the shared components while maintaining type safety and developer experience throughout the VisuLab application.