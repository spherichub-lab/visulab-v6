# Shared Components API Documentation

## Overview

This document provides comprehensive API documentation for all shared components in the VisuLab application. Each component includes usage examples, best practices, and implementation guidelines.

---

## DataTable Component

### Purpose

The DataTable component provides a flexible, accessible, and performant table interface for displaying tabular data with support for sorting, pagination, selection, and custom actions.

### Basic Usage

```typescript
import { DataTable } from '@/components/shared/DataTable';

<DataTable
  data={empresas}
  columns={columns}
  loading={isLoading}
  error={error}
  selection={selectionConfig}
  pagination={paginationConfig}
  actions={rowActions}
/>
```

### Props Reference

#### Core Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `data` | `T[]` | **Required** | Array of data items to display |
| `columns` | `DataTableColumn<T>[]` | **Required** | Column configuration array |
| `loading` | `boolean` | `false` | Show loading state |
| `error` | `Error \| null` | `null` | Error object for error state |

#### Selection Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `selection.selectedIds` | `string[]` | `[]` | Currently selected row IDs |
| `selection.onSelectionChange` | `(ids: string[]) => void` | - | Callback when selection changes |
| `selection.getRowId` | `(row: T) => string` | - | Function to get unique ID from row |
| `selection.multiple` | `boolean` | `true` | Allow multiple selection |
| `selection.showSelectAll` | `boolean` | `true` | Show select all checkbox |

#### Sort Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `sort.column` | `keyof T` | - | Currently sorted column |
| `sort.direction` | `'asc' \| 'desc'` | - | Sort direction |
| `sort.onSort` | `(col: keyof T, dir: 'asc' \| 'desc') => void` | - | Sort change callback |

#### Pagination Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `pagination.page` | `number` | `1` | Current page (1-based) |
| `pagination.limit` | `number` | `10` | Items per page |
| `pagination.total` | `number` | - | Total number of items |
| `pagination.onPageChange` | `(page: number) => void` | - | Page change callback |
| `pagination.onLimitChange` | `(limit: number) => void` | - | Page size change callback |
| `pagination.pageSizeOptions` | `number[]` | `[10, 25, 50]` | Available page sizes |
| `pagination.showPageSizeSelector` | `boolean` | `true` | Show page size selector |

#### Actions Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `actions` | `DataTableAction<T>[] \| ((row: T) => ReactNode)` | - | Row actions configuration |
| `bulkActions` | `(selectedRows: T[]) => ReactNode` | - | Bulk actions for selected rows |

#### Customization Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `rowClassName` | `string \| ((row: T, index: number) => string)` | - | Custom row class name |
| `clickable` | `boolean` | `false` | Make rows clickable |
| `onRowClick` | `(row: T, index: number) => void` | - | Row click callback |
| `responsive` | `boolean` | `true` | Enable responsive behavior |
| `virtualized` | `boolean` | `false` | Enable virtualization |
| `virtualizedHeight` | `number` | `400` | Virtualized table height |

### Column Configuration

```typescript
interface DataTableColumn<T> {
  key: keyof T;                    // Required: Column key
  label: string;                   // Required: Header label
  sortable?: boolean;               // Default: false
  width?: string \| number;         // Fixed column width
  minWidth?: string \| number;       // Minimum column width
  align?: 'left' | 'center' | 'right'; // Default: 'left'
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;              // Cell custom class
  headerClassName?: string;         // Header custom class
  hiddenMobile?: boolean;           // Hide on mobile
  hiddenTablet?: boolean;          // Hide on tablet
}
```

### Action Configuration

```typescript
interface DataTableAction<T> {
  key: string;                     // Required: Unique key
  label: string;                   // Required: Display label
  icon?: string;                   // Icon name
  onClick: (row: T) => void;      // Required: Click handler
  show?: (row: T) => boolean;     // Conditional visibility
  disabled?: (row: T) => boolean; // Conditional disabled
  variant?: 'default' | 'destructive' | 'warning';
}
```

### Examples

#### Basic Table

```typescript
const columns: DataTableColumn<Empresa>[] = [
  { key: 'nome', label: 'Empresa', sortable: true },
  { key: 'tipo', label: 'Tipo' },
  { key: 'status', label: 'Status' }
];

<DataTable
  data={empresas}
  columns={columns}
  loading={isLoading}
/>
```

#### Advanced Table with Actions

```typescript
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
      <StatusIndicator status={value} />
    )
  }
];

const actions: DataTableAction<Empresa>[] = [
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
];

<DataTable
  data={empresas}
  columns={columns}
  actions={actions}
  selection={{
    selectedIds,
    onSelectionChange: setSelectedIds,
    getRowId: (empresa) => empresa.id
  }}
  pagination={{
    page: currentPage,
    limit: pageSize,
    total: totalCount,
    onPageChange: setCurrentPage,
    onLimitChange: setPageSize
  }}
  empty={{
    title: 'Nenhuma empresa encontrada',
    description: 'Crie sua primeira empresa para começar',
    action: <Button onClick={createEmpresa}>Nova Empresa</Button>,
    icon: 'business'
  }}
/>
```

---

## FormLayout Component

### Purpose

The FormLayout component provides a consistent structure for forms with support for different layouts, validation states, and responsive behavior.

### Basic Usage

```typescript
import { FormLayout, FormField, FormSection } from '@/components/shared/FormLayout';

<FormLayout
  title="Nova Empresa"
  onSubmit={handleSubmit}
  loading={isSubmitting}
>
  <FormField name="nome" label="Nome da Empresa" required>
    <Input {...form.register('nome')} />
  </FormField>
</FormLayout>
```

### Props Reference

#### Core Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | **Required** | Form content |
| `title` | `string` | - | Form title |
| `description` | `string` | - | Form description |
| `layout` | `'vertical' \| 'horizontal' \| 'grid'` | `'vertical'` | Layout type |
| `columns` | `1 \| 2 \| 3 \| 4` | `1` | Grid columns count |
| `spacing` | `'compact' \| 'normal' \| 'loose'` | `'normal'` | Field spacing |

#### State Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `loading` | `boolean` | `false` | Show loading state |
| `disabled` | `boolean` | `false` | Disable entire form |
| `submitLoading` | `boolean` | `false` | Submit button loading |
| `submitDisabled` | `boolean` | `false` | Disable submit button |

#### Action Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `onSubmit` | `() => void \| Promise<void>` | - | Submit callback |
| `onCancel` | `() => void` | - | Cancel callback |
| `submitText` | `string` | `'Salvar'` | Submit button text |
| `cancelText` | `string` | `'Cancelar'` | Cancel button text |
| `actions` | `ReactNode` | - | Custom actions |
| `actionsAlign` | `'left' \| 'center' \| 'right'` | `'right'` | Actions alignment |
| `showActions` | `boolean` | `true` | Show default actions |

#### Customization Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `header` | `ReactNode` | - | Custom header |
| `footer` | `ReactNode` | - | Custom footer |
| `sidebar` | `ReactNode` | - | Custom sidebar |
| `responsive` | `boolean` | `true` | Enable responsive behavior |
| `stackedOnMobile` | `boolean` | `true` | Stack on mobile |

### FormField Component

```typescript
interface FormFieldProps {
  name: string;                    // Required: Field name
  label?: string;                  // Field label
  description?: string;            // Help text
  required?: boolean;             // Required indicator
  error?: string;                 // Error message
  disabled?: boolean;              // Disabled state
  children: ReactNode;            // Required: Field content
}
```

### FormSection Component

```typescript
interface FormSectionProps {
  title?: string;                 // Section title
  description?: string;            // Section description
  collapsible?: boolean;          // Collapsible section
  defaultCollapsed?: boolean;      // Default collapsed state
  bordered?: boolean;            // Show border
  children: ReactNode;           // Required: Section content
}
```

### Examples

#### Basic Form

```typescript
<FormLayout
  title="Nova Empresa"
  description="Preencha as informações abaixo"
  onSubmit={handleSubmit}
  submitText="Criar Empresa"
>
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
    />
  </FormField>
</FormLayout>
```

#### Advanced Grid Form

```typescript
<FormLayout
  layout="grid"
  columns={2}
  spacing="loose"
  title="Editar Empresa"
  onSubmit={handleSubmit}
  loading={isSubmitting}
>
  <FormSection title="Informações Básicas" bordered>
    <FormField name="nome" label="Nome" required>
      <Input {...form.register('nome')} error={form.errors.nome?.message} />
    </FormField>
    
    <FormField name="tipo" label="Tipo" required>
      <Select {...form.register('tipo')} />
    </FormField>
  </FormSection>
  
  <FormSection title="Informações de Contato" collapsible>
    <FormField name="contato_nome" label="Nome do Contato">
      <Input {...form.register('contato_nome')} />
    </FormField>
    
    <FormField name="contato_email" label="Email">
      <Input type="email" {...form.register('contato_email')} />
    </FormField>
  </FormSection>
</FormLayout>
```

---

## PageHeader Component

### Purpose

The PageHeader component provides a consistent header structure for pages with support for breadcrumbs, search, actions, and filters.

### Basic Usage

```typescript
import { PageHeader } from '@/components/shared/PageHeader';

<PageHeader
  title="Empresas"
  description="Gerencie as empresas cadastradas"
  actions={headerActions}
  search={searchConfig}
/>
```

### Props Reference

#### Core Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `title` | `string` | **Required** | Page title |
| `subtitle` | `string` | - | Page subtitle |
| `description` | `string` | - | Page description |

#### Navigation Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `breadcrumb` | `BreadcrumbItem[]` | - | Breadcrumb items |

#### Actions Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `actions` | `ReactNode \| PageHeaderAction[]` | - | Header actions |
| `primaryAction` | `ReactNode` | - | Primary action |

#### Search Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `search.placeholder` | `string` | `'Buscar...'` | Search placeholder |
| `search.value` | `string` | - | Search value |
| `search.onChange` | `(value: string) => void` | - | Search change callback |
| `search.onClear` | `() => void` | - | Clear callback |
| `search.debounce` | `number` | `300` | Debounce delay (ms) |
| `search.showClear` | `boolean` | `true` | Show clear button |

#### Layout Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Header size |
| `sticky` | `boolean` | `false` | Sticky positioning |
| `bordered` | `boolean` | `false` | Show bottom border |

#### Customization Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `left` | `ReactNode` | - | Custom left content |
| `right` | `ReactNode` | - | Custom right content |
| `center` | `ReactNode` | - | Custom center content |
| `filters` | `ReactNode` | - | Filter components |
| `collapsibleOnMobile` | `boolean` | `true` | Collapse on mobile |

### Breadcrumb Item

```typescript
interface BreadcrumbItem {
  label: string;                   // Required: Item label
  href?: string;                   // Link URL
  active?: boolean;                 // Active state
  icon?: string;                   // Custom icon
}
```

### Page Header Action

```typescript
interface PageHeaderAction {
  key: string;                     // Required: Unique key
  label: string;                   // Required: Button label
  icon?: string;                   // Icon name
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';   // Button size
  loading?: boolean;                // Loading state
  disabled?: boolean;               // Disabled state
  onClick?: () => void;            // Click callback
  href?: string;                   // Link URL
}
```

### Examples

#### Basic Header

```typescript
<PageHeader
  title="Empresas"
  description="Gerencie as empresas cadastradas no sistema"
  primaryAction={
    <Button onClick={createEmpresa}>
      <Icon name="add" />
      Nova Empresa
    </Button>
  }
  search={{
    placeholder: "Buscar empresas...",
    value: searchQuery,
    onChange: setSearchQuery,
    debounce: 300
  }}
/>
```

#### Advanced Header with Breadcrumb

```typescript
<PageHeader
  title="Empresas"
  subtitle={`${totalCount} empresas cadastradas`}
  breadcrumb={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Empresas', active: true }
  ]}
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
  search={{
    placeholder: "Buscar por nome ou email...",
    value: searchQuery,
    onChange: setSearchQuery,
    showClear: true
  }}
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

---

## FeedbackState Component

### Purpose

The FeedbackState component provides consistent feedback for loading, empty, error, and success states throughout the application.

### Basic Usage

```typescript
import { FeedbackState } from '@/components/shared/FeedbackState';

<FeedbackState
  type="loading"
  title="Carregando dados..."
  description="Aguarde um momento"
/>
```

### Props Reference

#### Core Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `type` | `'loading' \| 'empty' \| 'error' \| 'success' \| 'warning' \| 'info'` | **Required** | Feedback type |
| `variant` | `'inline' \| 'full' \| 'modal' \| 'card'` | `'full'` | Display variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |

#### Content Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `title` | `string` | - | State title |
| `description` | `string` | - | State description |
| `action` | `ReactNode \| FeedbackAction` | - | Action button/link |

#### Icon Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `icon` | `string` | - | Icon name (auto-selected by type) |
| `iconProps.size` | `string` | - | Icon size |
| `iconProps.className` | `string` | - | Icon custom class |

#### Error-Specific Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `error` | `Error` | - | Error object |
| `onRetry` | `() => void` | - | Retry callback |
| `retryText` | `string` | `'Tentar novamente'` | Retry button text |

#### Customization Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | - | Custom content |
| `animated` | `boolean` | `true` | Show animations |
| `animationDuration` | `number` | `300` | Animation duration (ms) |

### Feedback Action

```typescript
interface FeedbackAction {
  label: string;                   // Required: Button label
  onClick: () => void;            // Required: Click callback
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: string;                   // Button icon
  loading?: boolean;                // Loading state
}
```

### Examples

#### Loading State

```typescript
<FeedbackState
  type="loading"
  title="Carregando empresas..."
  description="Aguarde um momento enquanto buscamos os dados"
  size="lg"
  animated
/>
```

#### Empty State

```typescript
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
```

#### Error State

```typescript
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

#### Success State

```typescript
<FeedbackState
  type="success"
  title="Empresa criada com sucesso!"
  description="A empresa já está disponível no sistema"
  icon="check_circle"
  action={{
    label: "Ver Todas as Empresas",
    onClick: () => navigate('/empresas'),
    variant: "primary"
  }}
  variant="modal"
  size="md"
/>
```

---

## ConfirmActionDialog Component

### Purpose

The ConfirmActionDialog component provides a consistent interface for confirming destructive or critical actions with appropriate warnings and context.

### Basic Usage

```typescript
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';

<ConfirmActionDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Excluir Empresa"
  description="Tem certeza que deseja excluir esta empresa?"
  variant="destructive"
/>
```

### Props Reference

#### Core Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | **Required** | Dialog visibility |
| `onClose` | `() => void` | **Required** | Close callback |
| `onConfirm` | `() => Promise<void> \| void` | **Required** | Confirm callback |

#### Content Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `title` | `string` | - | Dialog title |
| `description` | `string` | - | Dialog description |
| `warning` | `string` | - | Warning message |

#### Item Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `item.name` | `string` | - | Item name |
| `item.description` | `string` | - | Item description |
| `item.avatar` | `ReactNode` | - | Item avatar/icon |
| `item.metadata` | `Record<string, any>` | - | Additional metadata |

#### Action Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `confirmText` | `string` | `'Confirmar'` | Confirm button text |
| `cancelText` | `string` | `'Cancelar'` | Cancel button text |
| `severity` | `'low' \| 'medium' \| 'high' \| 'critical'` | `'medium'` | Action severity |
| `variant` | `'default' \| 'destructive' \| 'warning' \| 'success'` | `'default'` | Dialog variant |

#### State Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `loading` | `boolean` | `false` | Loading state |
| `disabled` | `boolean` | `false` | Disabled state |
| `closeOnConfirm` | `boolean` | `true` | Close on confirm |

#### Customization Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Dialog size |
| `icon` | `string` | - | Custom icon |
| `header` | `ReactNode` | - | Custom header |
| `content` | `ReactNode` | - | Custom content |
| `actions` | `ReactNode` | - | Custom actions |

#### Accessibility Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `closeOnEscape` | `boolean` | `true` | Close on escape key |
| `closeOnBackdrop` | `boolean` | `true` | Close on backdrop click |
| `preventClose` | `boolean` | `false` | Prevent closing |

### Examples

#### Basic Confirmation

```typescript
<ConfirmActionDialog
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleDelete}
  title="Excluir Empresa"
  description={`Tem certeza que deseja excluir "${empresa?.nome}"?`}
  warning="Esta ação não pode ser desfeita."
  confirmText="Excluir Permanentemente"
  cancelText="Cancelar"
  severity="critical"
  variant="destructive"
  loading={isDeleting}
  icon="delete_forever"
/>
```

#### Advanced Confirmation with Item Details

```typescript
<ConfirmActionDialog
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={onConfirm}
  loading={loading}
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
      'Criado em': new Date(empresa?.created_at).toLocaleDateString('pt-BR'),
      'Contato': empresa?.contato_email
    }
  }}
  title="Excluir Empresa"
  description={`Tem certeza que deseja excluir "${empresa?.nome}"?`}
  warning="Esta ação não pode ser desfeita e todos os dados associados serão perdidos."
  confirmText="Excluir Permanentemente"
  cancelText="Cancelar"
  severity="critical"
  variant="destructive"
  size="md"
  closeOnEscape
  closeOnBackdrop
/>
```

#### Custom Content Dialog

```typescript
<ConfirmActionDialog
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={onConfirm}
  title="Ação Irreversível"
  size="lg"
>
  <ConfirmActionDialog.Header>
    <div className="text-center">
      <Icon name="warning" className="!text-4xl text-amber-500 mb-4" />
      <h3 className="text-lg font-semibold">Atenção</h3>
    </div>
  </ConfirmActionDialog.Header>
  
  <ConfirmActionDialog.Content>
    <div className="space-y-4">
      <p>Esta ação afetará os seguintes itens:</p>
      <ul className="space-y-2">
        {affectedItems.map(item => (
          <li key={item.id} className="flex items-center gap-2">
            <Icon name="circle" className="!text-xs text-slate-400" />
            {item.name}
          </li>
        ))}
      </ul>
      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Importante:</strong> Esta ação não pode ser desfeita.
        </p>
      </div>
    </div>
  </ConfirmActionDialog.Content>
  
  <ConfirmActionDialog.Actions>
    <Button variant="outline" onClick={onClose}>
      Cancelar
    </Button>
    <Button onClick={onConfirm} loading={loading} variant="danger">
      Confirmar Ação
    </Button>
  </ConfirmActionDialog.Actions>
</ConfirmActionDialog>
```

---

## Best Practices

### DataTable

1. **Performance**: Use virtualization for large datasets (>1000 rows)
2. **Accessibility**: Always provide table captions and ARIA labels
3. **Mobile**: Hide non-essential columns on mobile devices
4. **Selection**: Use meaningful row IDs for stable selection
5. **Sorting**: Implement server-side sorting for large datasets

### FormLayout

1. **Validation**: Always show validation errors clearly
2. **Accessibility**: Use proper labeling and ARIA attributes
3. **Mobile**: Stack fields vertically on mobile devices
4. **Loading**: Disable form during submission to prevent double submits
5. **Sections**: Group related fields in logical sections

### PageHeader

1. **Consistency**: Use consistent title hierarchy
2. **Search**: Implement debouncing for better UX
3. **Actions**: Limit primary actions to 2-3 most important
4. **Breadcrumbs**: Keep breadcrumbs shallow (max 4-5 levels)
5. **Responsive**: Collapse secondary actions on mobile

### FeedbackState

1. **Context**: Provide relevant context for each state
2. **Actions**: Always provide a clear next action
3. **Icons**: Use consistent iconography for each state type
4. **Animations**: Use subtle animations for better UX
5. **Errors**: Provide retry mechanisms when appropriate

### ConfirmActionDialog

1. **Clarity**: Be very clear about the action consequences
2. **Severity**: Match visual severity to action impact
3. **Context**: Show relevant item information
4. **Alternatives**: Provide less destructive alternatives when possible
5. **Confirmation**: Require explicit confirmation for critical actions

---

## Migration Guide

### From EmpresaTable to DataTable

```typescript
// Before
<EmpresaTable
  empresas={empresas}
  isLoading={isLoading}
  error={error}
  onEdit={editEmpresa}
  onDelete={deleteEmpresa}
  onToggleStatus={toggleStatus}
  selectedIds={selectedIds}
  onSelectAll={selectAll}
  onSelectOne={selectOne}
/>

// After
<DataTable
  data={empresas}
  columns={columns}
  loading={isLoading}
  error={error}
  selection={{
    selectedIds,
    onSelectionChange: setSelectedIds,
    getRowId: (empresa) => empresa.id
  }}
  actions={[
    { key: 'edit', label: 'Editar', onClick: editEmpresa },
    { key: 'delete', label: 'Excluir', onClick: deleteEmpresa },
    { key: 'toggle', label: 'Ativar/Desativar', onClick: toggleStatus }
  ]}
/>
```

### From EmpresaForm to FormLayout

```typescript
// Before
<EmpresaForm
  initialData={initialData}
  onSubmit={handleSubmit}
  mode="create"
/>

// After
<FormLayout
  title="Nova Empresa"
  onSubmit={handleSubmit}
  submitText="Criar Empresa"
>
  <FormField name="nome" label="Nome da Empresa" required>
    <Input {...form.register('nome')} />
  </FormField>
  {/* Other fields... */}
</FormLayout>
```

### From EmpresaActionModal to ConfirmActionDialog

```typescript
// Before
<EmpresaActionModal
  isOpen={isOpen}
  onClose={onClose}
  empresa={empresa}
  mode="delete"
  onConfirm={handleDelete}
  isLoading={isDeleting}
/>

// After
<ConfirmActionDialog
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Excluir Empresa"
  description={`Tem certeza que deseja excluir "${empresa?.nome}"?`}
  warning="Esta ação não pode ser desfeita."
  item={empresa}
  variant="destructive"
  severity="critical"
  loading={isDeleting}
/>
```

---

## Testing Guidelines

### Unit Testing

```typescript
// DataTable testing
describe('DataTable', () => {
  it('renders data correctly', () => {
    const data = [{ id: '1', name: 'Test' }];
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    render(<DataTable data={[]} columns={columns} loading />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});

// FormLayout testing
describe('FormLayout', () => {
  it('submits form data', async () => {
    const onSubmit = jest.fn();
    render(<FormLayout onSubmit={onSubmit}><input name="test" /></FormLayout>);
    
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ test: 'test' });
    });
  });
});
```

### Integration Testing

```typescript
// Full flow testing
describe('Empresa Management Flow', () => {
  it('should create and display new empresa', async () => {
    render(<EmpresaPage />);
    
    // Open create form
    fireEvent.click(screen.getByText('Nova Empresa'));
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Nome da Empresa'), {
      target: { value: 'Test Empresa' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Criar Empresa'));
    
    // Verify in table
    await waitFor(() => {
      expect(screen.getByText('Test Empresa')).toBeInTheDocument();
    });
  });
});
```

---

## Performance Considerations

### DataTable Optimization

1. **Virtualization**: Enable for datasets > 1000 rows
2. **Memoization**: Memoize render functions and row data
3. **Pagination**: Implement server-side pagination
4. **Debouncing**: Debounce search and filter inputs
5. **Lazy Loading**: Load data on demand

### FormLayout Optimization

1. **Validation**: Debounce validation functions
2. **Fields**: Unmount unused fields
3. **Submission**: Prevent duplicate submissions
4. **Memory**: Clean up event listeners
5. **Re-renders**: Use React.memo for field components

### General Optimization

1. **Code Splitting**: Lazy load components
2. **Bundle Size**: Tree-shake unused components
3. **Images**: Optimize icons and images
4. **CSS**: Use CSS modules for scoping
5. **Caching**: Cache API responses appropriately

This comprehensive API documentation provides all the necessary information for developers to effectively use and extend the shared components in the VisuLab application.