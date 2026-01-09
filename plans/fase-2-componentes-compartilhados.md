# Fase 2: Consolidação de Componentes Compartilhados de Alto Nível

## Visão Geral

Este documento define a arquitetura dos componentes compartilhados que servirão como base para refatorar a UI de Empresas e estabelecer um blueprint para as demais entidades do sistema VisuLab.

## Abordagem Híbrida

Os componentes seguirão uma abordagem híbrida:
- **Orientados a configuração** para casos comuns (props simples)
- **Orientados a composição** para cenários avançados (children/render props)
- **APIs consistentes** e pontos de extensão claros

## Padrões Identificados

Análise dos componentes existentes revelou estes padrões comuns:

1. **Estados de Carregamento**: Skeletons uniformes com animações consistentes
2. **Estados de Vazio**: Mensagens padronizadas com ícones e CTAs
3. **Estados de Erro**: Tratamento consistente com retry mechanism
4. **Ações em Lote**: Seleção múltipla com operações bulk
5. **Filtros e Busca**: Debouncing e layout responsivo
6. **Validação de Forms**: Real-time feedback com estados touched
7. **Notificações**: Sistema centralizado de feedback
8. **Modal Patterns**: Estrutura consistente para confirmações

---

## 1. DataTable Component

### Responsabilidades
- Exibir dados tabulares com suporte a ordenação, paginação e filtragem
- Gerenciar estados de loading, empty e error
- Suportar seleção simples e múltipla
- Ações inline e em lote
- Responsividade e acessibilidade

### Arquitetura

```typescript
// Core interfaces
interface DataTableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T = any> {
  // Data
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  error?: Error | null;
  empty?: React.ReactNode;
  
  // Selection
  selectable?: boolean;
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  getRowId: (row: T) => string;
  
  // Sorting
  sortable?: boolean;
  sortColumn?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  
  // Pagination
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  
  // Actions
  actions?: (row: T) => React.ReactNode;
  bulkActions?: (selectedRows: T[]) => React.ReactNode;
  
  // Customization
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  headerClassName?: string;
  
  // Composition points
  header?: React.ReactNode;
  footer?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error, retry: () => void) => React.ReactNode;
  emptyComponent?: React.ReactNode;
}
```

### Subcomponentes

```typescript
// DataTable.Header
interface DataTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

// DataTable.Row
interface DataTableRowProps<T> {
  row: T;
  columns: DataTableColumn<T>[];
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  actions?: React.ReactNode;
  className?: string;
}

// DataTable.Cell
interface DataTableCellProps {
  children: React.ReactNode;
  column: DataTableColumn;
  row: any;
  className?: string;
}

// DataTable.Pagination
interface DataTablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}
```

### Estados Integrados

```typescript
// Loading state
const DataTableLoading = ({ columns, rows = 5 }) => (
  <div className="animate-pulse">
    {[...Array(rows)].map((_, index) => (
      <tr key={index}>
        {columns.map((column, colIndex) => (
          <td key={colIndex} className="px-6 py-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          </td>
        ))}
      </tr>
    ))}
  </div>
);

// Empty state
const DataTableEmpty = ({ 
  title = "Nenhum dado encontrado",
  description,
  action,
  icon = "inbox"
}) => (
  <div className="flex flex-col items-center justify-center py-16">
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
);

// Error state
const DataTableError = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <Icon name="error" className="!text-4xl text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
      Erro ao carregar dados
    </h3>
    <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
      {error?.message || 'Ocorreu um erro inesperado.'}
    </p>
    <Button onClick={onRetry} variant="outline">
      Tentar novamente
    </Button>
  </div>
);
```

### Exemplo de Uso

```typescript
// Uso básico (configuração)
<EmpresaDataTable
  data={empresas}
  columns={[
    { key: 'nome', label: 'Empresa', sortable: true },
    { key: 'tipo', label: 'Tipo' },
    { key: 'status', label: 'Status', render: (status) => (
      <StatusBadge status={status} />
    )}
  ]}
  loading={isLoading}
  error={error}
  selectable
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
  getRowId={(empresa) => empresa.id}
  actions={(empresa) => (
    <ActionMenu
      onEdit={() => editEmpresa(empresa)}
      onDelete={() => deleteEmpresa(empresa)}
    />
  )}
  pagination={paginationConfig}
/>

// Uso avançado (composição)
<DataTable data={empresas} columns={columns}>
  <DataTable.Header>
    <div className="flex justify-between items-center">
      <h2>Empresas</h2>
      <Button onClick={createEmpresa}>Nova Empresa</Button>
    </div>
  </DataTable.Header>
  
  <DataTable.Row>
    {(row) => (
      <>
        <DataTable.Cell column={columns[0]}>
          <EmpresaAvatar empresa={row} />
        </DataTable.Cell>
        <DataTable.Cell column={columns[1]}>
          <TipoBadge tipo={row.tipo} />
        </DataTable.Cell>
      </>
    )}
  </DataTable.Row>
  
  <DataTable.Footer>
    <DataTable.Pagination {...paginationConfig} />
  </DataTable.Footer>
</DataTable>
```

---

## 2. FormLayout Component

### Responsabilidades
- Prover estrutura consistente para formulários
- Gerenciar layout responsivo
- Integrar validação e estados
- Suportar diferentes tipos de campos
- Organizar ações do formulário

### Arquitetura

```typescript
interface FormLayoutProps {
  // Content
  children: React.ReactNode;
  title?: string;
  description?: string;
  
  // Layout
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: 1 | 2 | 3 | 4;
  spacing?: 'compact' | 'normal' | 'loose';
  
  // State
  loading?: boolean;
  disabled?: boolean;
  
  // Actions
  actions?: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  
  // Customization
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  
  // Composition
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
}

// Form sections
interface FormSectionProps {
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Form field wrapper
interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}
```

### Subcomponentes

```typescript
// FormLayout.Field (wrapper para inputs)
const FormLayoutField = ({ 
  label, 
  description, 
  error, 
  required, 
  children,
  className 
}: FormFieldProps) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {description && (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    )}
    {error && (
      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
        <Icon name="error_outline" className="!text-sm" />
        {error}
      </p>
    )}
  </div>
);

// FormLayout.Actions
const FormLayoutActions = ({ 
  children, 
  align = 'right',
  className 
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) => (
  <div className={cn(
    'flex gap-3 pt-4',
    {
      'justify-start': align === 'left',
      'justify-center': align === 'center',
      'justify-end': align === 'right',
    },
    className
  )}>
    {children}
  </div>
);
```

### Exemplo de Uso

```typescript
// Uso básico
<FormLayout
  title="Nova Empresa"
  description="Preencha as informações para criar uma nova empresa"
  onSubmit={handleSubmit}
  loading={isSubmitting}
>
  <FormLayout.Field name="nome" label="Nome da Empresa" required>
    <Input
      value={formData.nome}
      onChange={(value) => setFormData({ ...formData, nome: value })}
      error={errors.nome}
    />
  </FormLayout.Field>
  
  <FormLayout.Field name="tipo" label="Tipo">
    <CustomSelect
      value={formData.tipo}
      onChange={(value) => setFormData({ ...formData, tipo: value })}
      options={['Fornecedor', 'Filial', 'Matriz']}
    />
  </FormLayout.Field>
</FormLayout>

// Uso avançado com seções
<FormLayout layout="grid" columns={2}>
  <FormLayout.Section title="Informações Básicas">
    <FormLayout.Field name="nome" label="Nome" required>
      <Input {...form.register('nome')} />
    </FormLayout.Field>
    <FormLayout.Field name="tipo" label="Tipo">
      <Select {...form.register('tipo')} />
    </FormLayout.Field>
  </FormLayout.Section>
  
  <FormLayout.Section title="Informações de Contato">
    <FormLayout.Field name="contato_nome" label="Nome do Contato">
      <Input {...form.register('contato_nome')} />
    </FormLayout.Field>
    <FormLayout.Field name="contato_email" label="Email">
      <Input type="email" {...form.register('contato_email')} />
    </FormLayout.Field>
  </FormLayout.Section>
</FormLayout>
```

---

## 3. PageHeader Component

### Responsabilidades
- Prover estrutura consistente para cabeçalhos de página
- Exibir título, descrição e ações principais
- Suportar navegação (breadcrumb)
- Integrar busca e filtros rápidos
- Responsividade e acessibilidade

### Arquitetura

```typescript
interface PageHeaderProps {
  // Content
  title: string;
  subtitle?: string;
  description?: string;
  
  // Navigation
  breadcrumb?: BreadcrumbItem[];
  
  // Actions
  actions?: React.ReactNode;
  primaryAction?: React.ReactNode;
  
  // Search
  search?: {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onClear?: () => void;
  };
  
  // Filters
  filters?: React.ReactNode;
  
  // Layout
  size?: 'sm' | 'md' | 'lg';
  sticky?: boolean;
  className?: string;
  
  // Composition
  left?: React.ReactNode;
  right?: React.ReactNode;
  center?: React.ReactNode;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}
```

### Subcomponentes

```typescript
// PageHeader.Breadcrumb
const PageHeaderBreadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav className="flex items-center space-x-2 text-sm">
    {items.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && (
          <Icon name="chevron_right" className="!text-sm text-slate-400" />
        )}
        {item.href ? (
          <Link
            to={item.href}
            className={cn(
              'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              item.active && 'text-slate-900 dark:text-white font-medium'
            )}
          >
            {item.label}
          </Link>
        ) : (
          <span className={cn(
            'text-slate-500 dark:text-slate-400',
            item.active && 'text-slate-900 dark:text-white font-medium'
          )}>
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

// PageHeader.Actions
const PageHeaderActions = ({ 
  children, 
  align = 'right',
  className 
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) => (
  <div className={cn(
    'flex items-center gap-3',
    {
      'justify-start': align === 'left',
      'justify-center': align === 'center',
      'justify-end': align === 'right',
    },
    className
  )}>
    {children}
  </div>
);
```

### Exemplo de Uso

```typescript
// Uso básico
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
    onChange: setSearchQuery
  }}
/>

// Uso avançado com breadcrumb e filtros
<PageHeader
  title="Empresas"
  breadcrumb={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Empresas', active: true }
  ]}
>
  <PageHeader.Actions align="left">
    <Button variant="outline" onClick={exportData}>
      <Icon name="download" />
      Exportar
    </Button>
  </PageHeader.Actions>
  
  <PageHeader.Actions>
    <CustomSelect
      value={filterTipo}
      onChange={setFilterTipo}
      options={tipoOptions}
      placeholder="Tipo"
    />
    <Button onClick={createEmpresa}>
      <Icon name="add" />
      Nova Empresa
    </Button>
  </PageHeader.Actions>
</PageHeader>
```

---

## 4. FeedbackState Component

### Responsabilidades
- Exibir estados de feedback de forma consistente
- Suportar loading, empty, error e success states
- Ser reutilizável para diferentes contextos
- Prover ações relevantes para cada estado
- Acessibilidade e responsividade

### Arquitetura

```typescript
type FeedbackType = 'loading' | 'empty' | 'error' | 'success';

interface FeedbackStateProps {
  type: FeedbackType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'full' | 'modal';
  className?: string;
  
  // Error specific
  error?: Error;
  onRetry?: () => void;
  
  // Custom content
  children?: React.ReactNode;
  
  // Customization
  iconProps?: {
    size?: string;
    className?: string;
  };
}
```

### Variações Predefinidas

```typescript
// Loading state
const FeedbackLoading = ({ 
  title = "Carregando...",
  description,
  size = 'md'
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    <LoadingSpinner size={size === 'lg' ? 'lg' : 'md'} />
    {title && (
      <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
        {title}
      </h3>
    )}
    {description && (
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    )}
  </div>
);

// Empty state
const FeedbackEmpty = ({
  title = "Nenhum dado encontrado",
  description,
  action,
  icon = "inbox"
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon name={icon} className="!text-4xl text-slate-400 mb-4" />
    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
        {description}
      </p>
    )}
    {action}
  </div>
);

// Error state
const FeedbackError = ({
  title = "Ocorreu um erro",
  description,
  error,
  onRetry,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon name="error" className="!text-4xl text-red-500 mb-4" />
    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
      {description || error?.message || 'Ocorreu um erro inesperado.'}
    </p>
    <div className="flex gap-3">
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <Icon name="refresh" />
          Tentar novamente
        </Button>
      )}
      {action}
    </div>
  </div>
);

// Success state
const FeedbackSuccess = ({
  title = "Operação concluída",
  description,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon name="check_circle" className="!text-4xl text-emerald-500 mb-4" />
    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
        {description}
      </p>
    )}
    {action}
  </div>
);
```

### Exemplo de Uso

```typescript
// Uso direto
<FeedbackState
  type="loading"
  title="Carregando empresas..."
  description="Aguarde um momento..."
/>

// Uso com customização
<FeedbackState
  type="error"
  title="Erro ao carregar empresas"
  error={error}
  onRetry={() => refetch()}
  action={
    <Button variant="outline" onClick={() => navigate('/empresas/new')}>
      Criar nova empresa
    </Button>
  }
/>

// Uso em contexto específico
<DataTable>
  {/* ... */}
  {data.length === 0 && (
    <FeedbackState
      type="empty"
      title="Nenhuma empresa encontrada"
      description="Comece criando sua primeira empresa"
      action={
        <Button onClick={createEmpresa}>
          <Icon name="add" />
          Nova Empresa
        </Button>
      }
    />
  )}
</DataTable>
```

---

## 5. ConfirmActionDialog Component

### Responsabilidades
- Prover interface consistente para confirmações de ações
- Suportar diferentes tipos de ações (delete, activate, etc.)
- Exibir informações relevantes sobre o item
- Customizar mensagens e ações conforme contexto
- Acessibilidade e foco management

### Arquitetura

```typescript
type ActionSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ConfirmActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  
  // Content
  title: string;
  description?: string;
  warning?: string;
  
  // Item info
  item?: {
    name: string;
    description?: string;
    avatar?: React.ReactNode;
    metadata?: Record<string, any>;
  };
  
  // Action customization
  confirmText?: string;
  cancelText?: string;
  severity?: ActionSeverity;
  variant?: 'default' | 'destructive' | 'warning';
  
  // State
  loading?: boolean;
  disabled?: boolean;
  
  // Customization
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  
  // Composition
  header?: React.ReactNode;
  content?: React.ReactNode;
  actions?: React.ReactNode;
}
```

### Configurações Predefinidas

```typescript
const actionConfigs = {
  delete: {
    title: 'Excluir item',
    icon: 'delete_forever',
    severity: 'critical' as const,
    variant: 'destructive' as const,
    confirmText: 'Excluir permanentemente',
    warning: 'Esta ação não pode ser desfeita.',
    confirmVariant: 'danger' as const
  },
  deactivate: {
    title: 'Desativar item',
    icon: 'block',
    severity: 'medium' as const,
    variant: 'warning' as const,
    confirmText: 'Desativar',
    warning: 'O item permanecerá no sistema mas ficará inativo.',
    confirmVariant: 'warning' as const
  },
  activate: {
    title: 'Ativar item',
    icon: 'check_circle',
    severity: 'low' as const,
    variant: 'default' as const,
    confirmText: 'Ativar',
    confirmVariant: 'primary' as const
  }
};
```

### Exemplo de Uso

```typescript
// Uso básico com configuração predefinida
<ConfirmActionDialog
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleDelete}
  title="Excluir Empresa"
  description={`Tem certeza que deseja excluir "${empresa?.nome}"?`}
  warning="Esta ação não pode ser desfeita."
  item={{
    name: empresa?.nome || '',
    description: `${empresa?.tipo} • ${empresa?.status}`,
    avatar: (
      <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
        {empresa?.nome?.substring(0, 2).toUpperCase()}
      </div>
    )
  }}
  confirmText="Excluir Permanentemente"
  variant="destructive"
  loading={isDeleting}
/>

// Uso com composição avançada
<ConfirmActionDialog
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={onConfirm}
  loading={loading}
>
  <ConfirmActionDialog.Header>
    <div className="text-center">
      <Icon name="warning" className="!text-4xl text-amber-500 mb-4" />
      <h3 className="text-lg font-semibold">Ação irreversível</h3>
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
    </div>
  </ConfirmActionDialog.Content>
  
  <ConfirmActionDialog.Actions>
    <Button variant="outline" onClick={onClose}>
      Cancelar
    </Button>
    <Button onClick={onConfirm} loading={loading}>
      Confirmar Ação
    </Button>
  </ConfirmActionDialog.Actions>
</ConfirmActionDialog>
```

---

## Sistema de Temas e Variantes

### Design Tokens

```typescript
interface ComponentTheme {
  // Spacing
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    neutral: string;
  };
  
  // Typography
  typography: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Borders
  borders: {
    radius: {
      sm: string;
      md: string;
      lg: string;
    };
    width: {
      thin: string;
      normal: string;
      thick: string;
    };
  };
}
```

### Variant System

```typescript
interface ComponentVariants {
  size: 'sm' | 'md' | 'lg';
  variant: 'default' | 'outline' | 'ghost' | 'destructive';
  state: 'default' | 'hover' | 'active' | 'disabled';
}

const getVariantClasses = (
  component: string,
  variants: ComponentVariants
): string => {
  // Lógica para gerar classes CSS baseadas nas variantes
};
```

---

## Plano de Refatoração - UI de Empresas

### Mapeamento de Componentes

| Componente Atual | Novo Componente | Complexidade |
|------------------|----------------|-------------|
| EmpresaTable | DataTable | Média |
| EmpresaForm | FormLayout + FormField | Baixa |
| EmpresaModal | Modal + FormLayout | Baixa |
| EmpresaFilters | PageHeader + CustomSelect | Baixa |
| EmpresaActionModal | ConfirmActionDialog | Baixa |

### Fases de Migração

1. **Fase 1**: Criar componentes compartilhados
2. **Fase 2**: Refatorar EmpresaTable para DataTable
3. **Fase 3**: Refatorar EmpresaForm para FormLayout
4. **Fase 4**: Refatorar EmpresaModal e EmpresaActionModal
5. **Fase 5**: Refatorar EmpresaFilters para PageHeader
6. **Fase 6**: Integração e testes

### Blueprint para Demais Entidades

O mesmo padrão será aplicado para:
- **Usuários**: DataTable + FormLayout + ConfirmActionDialog
- **Faltas**: DataTable + FormLayout + PageHeader
- **Compras**: DataTable + FormLayout + ConfirmActionDialog
- **Tratamentos**: DataTable + FormLayout + PageHeader
- **Tipos**: DataTable + FormLayout + ConfirmActionDialog

---

## Próximos Passos

1. **Validação** com stakeholders da arquitetura proposta
2. **Implementação** dos componentes compartilhados
3. **Documentação** detalhada das APIs
4. **Refatoração** da UI de Empresas como prova de conceito
5. **Extensão** para as demais entidades
6. **Treinamento** da equipe de desenvolvimento

Esta arquitetura proporciona:
- **Consistência** visual e comportamental
- **Reusabilidade** máxima dos componentes
- **Flexibilidade** para casos específicos
- **Manutenibilidade** a longo prazo
- **Escalabilidade** para novas funcionalidades