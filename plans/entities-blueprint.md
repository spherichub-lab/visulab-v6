# Blueprint para Aplicação nas Demais Entidades

## Visão Geral

Este documento estabelece o blueprint para aplicar os componentes compartilhados nas demais entidades do sistema VisuLab, seguindo o padrão validado na refatoração da UI de Empresas.

## Entidades Mapeadas

| Entidade | Componente Atual | Novos Componentes | Complexidade | Prioridade |
|-----------|-------------------|-------------------|---------------|------------|
| Usuários | Components específicos | DataTable + FormLayout + PageHeader + ConfirmActionDialog | Média | Alta |
| Faltas | Components específicos | DataTable + FormLayout + PageHeader + FeedbackState | Alta | Alta |
| Compras | Components específicos | DataTable + FormLayout + PageHeader + ConfirmActionDialog | Média | Média |
| Tratamentos | Components específicos | DataTable + FormLayout + PageHeader + ConfirmActionDialog | Média | Média |
| Tipos | Components específicos | DataTable + FormLayout + PageHeader + ConfirmActionDialog | Baixa | Baixa |

---

## 1. Usuários (Users)

### Análise da Entidade

**Características:**
- Gerenciamento de usuários do sistema
- Relacionamento com empresas
- Controle de acessos e permissões
- Avatar e informações pessoais

**Campos Principais:**
- nome, email, empresa_id, role, status, avatar_url

### Componentização

#### DataTable para Usuários

```typescript
// Column configuration
const usuarioColumns: DataTableColumn<Usuario>[] = [
  {
    key: 'avatar',
    label: 'Usuário',
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <UserAvatar usuario={row} size="sm" />
        <div>
          <p className="font-medium">{row.nome}</p>
          <p className="text-sm text-slate-500">{row.email}</p>
        </div>
      </div>
    ),
    width: 300
  },
  {
    key: 'empresa',
    label: 'Empresa',
    render: (_, row) => row.empresa?.nome || 'N/A',
    sortable: true
  },
  {
    key: 'role',
    label: 'Função',
    align: 'center',
    render: (value) => (
      <RoleBadge role={value} />
    )
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (value) => (
      <StatusIndicator 
        status={value} 
        variants={{
          'Active': { color: 'emerald', label: 'Ativo' },
          'Offline': { color: 'slate', label: 'Offline' },
          'Pending': { color: 'amber', label: 'Pendente' },
          'Inactive': { color: 'red', label: 'Inativo' }
        }}
      />
    )
  },
  {
    key: 'last_login',
    label: 'Último Acesso',
    render: (value) => value ? (
      <span className="text-sm">
        {formatRelativeTime(value)}
      </span>
    ) : 'Nunca'
  }
];

// Usage
<DataTable
  data={usuarios}
  columns={usuarioColumns}
  loading={isLoading}
  error={error}
  selection={{
    selectedIds,
    onSelectionChange: setSelectedIds,
    getRowId: (usuario) => usuario.id
  }}
  actions={[
    {
      key: 'edit',
      label: 'Editar',
      icon: 'edit',
      onClick: (usuario) => editUsuario(usuario)
    },
    {
      key: 'reset-password',
      label: 'Redefinir Senha',
      icon: 'key',
      variant: 'warning',
      onClick: (usuario) => resetPassword(usuario)
    },
    {
      key: 'toggle-status',
      label: usuario.status === 'Active' ? 'Desativar' : 'Ativar',
      icon: usuario.status === 'Active' ? 'block' : 'check_circle',
      onClick: (usuario) => toggleStatus(usuario)
    }
  ]}
  bulkActions={(selectedUsuarios) => (
    <BulkActionsMenu
      selectedCount={selectedUsuarios.length}
      actions={[
        {
          label: 'Exportar Selecionados',
          icon: 'download',
          onClick: () => exportUsuarios(selectedUsuarios)
        },
        {
          label: 'Ativar em Lote',
          icon: 'check_circle',
          onClick: () => bulkActivate(selectedUsuarios)
        },
        {
          label: 'Desativar em Lote',
          icon: 'block',
          variant: 'warning',
          onClick: () => bulkDeactivate(selectedUsuarios)
        }
      ]}
    />
  )}
  pagination={paginationConfig}
  empty={{
    title: 'Nenhum usuário encontrado',
    description: 'Comece adicionando usuários ao sistema',
    action: <Button onClick={createUsuario}>Novo Usuário</Button>,
    icon: 'person'
  }}
/>
```

#### FormLayout para Usuários

```typescript
const UsuarioForm = ({ initialData, onSubmit, mode = 'create' }) => {
  const form = useForm<UsuarioFormData>({
    defaultValues: {
      nome: '',
      email: '',
      empresa_id: '',
      role: 'Usuário',
      status: 'Active',
      avatar_url: '',
      ...initialData
    }
  });

  return (
    <FormLayout
      title={mode === 'edit' ? 'Editar Usuário' : 'Novo Usuário'}
      description={mode === 'edit' 
        ? 'Edite as informações do usuário abaixo.'
        : 'Preencha as informações para criar um novo usuário.'
      }
      layout="grid"
      columns={2}
      onSubmit={form.handleSubmit(onSubmit)}
      loading={form.formState.isSubmitting}
    >
      <FormSection title="Informações Pessoais">
        <FormField name="nome" label="Nome Completo" required>
          <Input
            {...form.register('nome', { required: 'Nome é obrigatório' })}
            error={form.formState.errors.nome?.message}
            placeholder="Ex: João Silva"
          />
        </FormField>
        
        <FormField name="email" label="Email" required>
          <Input
            type="email"
            {...form.register('email', { 
              required: 'Email é obrigatório',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido'
              }
            })}
            error={form.formState.errors.email?.message}
            placeholder="Ex: joao@empresa.com"
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Configurações de Acesso">
        <FormField name="empresa_id" label="Empresa" required>
          <EmpresaSelect
            value={form.watch('empresa_id')}
            onChange={(value) => form.setValue('empresa_id', value)}
            error={form.formState.errors.empresa_id?.message}
          />
        </FormField>
        
        <FormField name="role" label="Função" required>
          <CustomSelect
            value={form.watch('role')}
            onChange={(value) => form.setValue('role', value)}
            options={[
              { value: 'Administrador', label: 'Administrador' },
              { value: 'Usuário', label: 'Usuário' }
            ]}
            error={form.formState.errors.role?.message}
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Status e Avatar">
        <FormField name="status" label="Status">
          <StatusToggle
            value={form.watch('status')}
            onChange={(value) => form.setValue('status', value)}
            options={[
              { value: 'Active', label: 'Ativo' },
              { value: 'Offline', label: 'Offline' },
              { value: 'Pending', label: 'Pendente' },
              { value: 'Inactive', label: 'Inativo' }
            ]}
          />
        </FormField>
        
        <FormField name="avatar_url" label="URL do Avatar">
          <Input
            {...form.register('avatar_url')}
            placeholder="https://exemplo.com/avatar.jpg"
          />
        </FormField>
      </FormSection>
    </FormLayout>
  );
};
```

#### PageHeader para Usuários

```typescript
const UsuarioPageHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<UsuarioFilters>({});
  
  return (
    <PageHeader
      title="Usuários"
      description="Gerencie os usuários e seus acessos ao sistema"
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Usuários', active: true }
      ]}
      search={{
        placeholder: "Buscar por nome ou email...",
        value: searchQuery,
        onChange: setSearchQuery,
        showClear: true
      }}
      actions={[
        {
          key: 'import',
          label: 'Importar',
          icon: 'upload',
          variant: 'outline',
          onClick: importUsuarios
        },
        {
          key: 'export',
          label: 'Exportar',
          icon: 'download',
          variant: 'outline',
          onClick: exportUsuarios
        },
        {
          key: 'create',
          label: 'Novo Usuário',
          icon: 'person_add',
          variant: 'primary',
          onClick: () => setIsCreateModalOpen(true)
        }
      ]}
      filters={
        <div className="flex gap-2">
          <EmpresaSelect
            value={filters.empresa_id || ''}
            onChange={(value) => setFilters({ ...filters, empresa_id: value || undefined })}
            placeholder="Todas as empresas"
            clearable
          />
          <CustomSelect
            value={filters.role || ''}
            onChange={(value) => setFilters({ ...filters, role: value || undefined })}
            options={[
              { value: '', label: 'Todas as funções' },
              { value: 'Administrador', label: 'Administrador' },
              { value: 'Usuário', label: 'Usuário' }
            ]}
            placeholder="Função"
          />
          <CustomSelect
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: value || undefined })}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'Active', label: 'Ativo' },
              { value: 'Offline', label: 'Offline' },
              { value: 'Pending', label: 'Pendente' },
              { value: 'Inactive', label: 'Inativo' }
            ]}
            placeholder="Status"
          />
        </div>
      }
      sticky
    />
  );
};
```

---

## 2. Faltas (Shortages)

### Análise da Entidade

**Características:**
- Gestão de faltas de óptica
- Relacionamento com usuário, empresa, tipo, índice, tratamento
- Fluxo de aprovação
- Cálculos automáticos

**Campos Principais:**
- usuario_id, empresa_id, tipo_id, indice_id, tratamento_id, esf, cil, quantidade

### Componentização

#### DataTable para Faltas

```typescript
// Column configuration
const faltaColumns: DataTableColumn<Falta>[] = [
  {
    key: 'usuario',
    label: 'Usuário',
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <UserAvatar usuario={row.usuario} size="sm" />
        <div>
          <p className="font-medium">{row.usuario?.nome}</p>
          <p className="text-sm text-slate-500">{row.usuario?.empresa?.nome}</p>
        </div>
      </div>
    ),
    width: 250
  },
  {
    key: 'tipo',
    label: 'Tipo',
    render: (_, row) => (
      <TipoBadge tipo={row.tipo} />
    )
  },
  {
    key: 'indice',
    label: 'Índice',
    render: (_, row) => (
      <div className="text-center">
        <p className="font-mono">{row.indice?.esf}</p>
        <p className="font-mono">{row.indice?.cil}</p>
      </div>
    ),
    align: 'center'
  },
  {
    key: 'prescricao',
    label: 'Prescrição',
    render: (_, row) => (
      <div className="text-center font-mono">
        <p>{row.esf}</p>
        <p>{row.cil}</p>
      </div>
    ),
    align: 'center'
  },
  {
    key: 'quantidade',
    label: 'Qtd',
    align: 'center',
    render: (value) => (
      <span className="font-medium">{value}</span>
    )
  },
  {
    key: 'tratamento',
    label: 'Tratamento',
    render: (_, row) => row.tratamento?.nome || 'N/A'
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (value) => (
      <StatusBadge 
        status={value} 
        variants={{
          'Pendente': { color: 'amber', label: 'Pendente' },
          'Em Andamento': { color: 'blue', label: 'Em Andamento' },
          'Resolvida': { color: 'emerald', label: 'Resolvida' },
          'Cancelada': { color: 'red', label: 'Cancelada' }
        }}
      />
    )
  },
  {
    key: 'created_at',
    label: 'Data',
    render: (value) => (
      <span className="text-sm">
        {formatDate(value)}
      </span>
    )
  }
];

// Usage with advanced features
<DataTable
  data={faltas}
  columns={faltaColumns}
  loading={isLoading}
  error={error}
  selection={{
    selectedIds,
    onSelectionChange: setSelectedIds,
    getRowId: (falta) => falta.id,
    multiple: true
  }}
  sort={{
    column: 'created_at',
    direction: 'desc',
    onSort: handleSort
  }}
  actions={[
    {
      key: 'edit',
      label: 'Editar',
      icon: 'edit',
      show: (falta) => falta.status === 'Pendente',
      onClick: (falta) => editFalta(falta)
    },
    {
      key: 'approve',
      label: 'Aprovar',
      icon: 'check_circle',
      variant: 'success',
      show: (falta) => falta.status === 'Pendente',
      onClick: (falta) => approveFalta(falta)
    },
    {
      key: 'cancel',
      label: 'Cancelar',
      icon: 'cancel',
      variant: 'destructive',
      show: (falta) => ['Pendente', 'Em Andamento'].includes(falta.status),
      onClick: (falta) => cancelFalta(falta)
    }
  ]}
  bulkActions={(selectedFaltas) => (
    <BulkActionsMenu
      selectedCount={selectedFaltas.length}
      actions={[
        {
          label: 'Aprovar Selecionadas',
          icon: 'check_circle',
          onClick: () => bulkApprove(selectedFaltas)
        },
        {
          label: 'Cancelar Selecionadas',
          icon: 'cancel',
          variant: 'warning',
          onClick: () => bulkCancel(selectedFaltas)
        },
        {
          label: 'Exportar para Planilha',
          icon: 'download',
          onClick: () => exportToExcel(selectedFaltas)
        }
      ]}
    />
  )}
  pagination={paginationConfig}
  empty={{
    title: 'Nenhuma falta registrada',
    description: 'Registre as primeiras faltas de óptica',
    action: <Button onClick={createFalta}>Nova Falta</Button>,
    icon: 'visibility_off'
  }}
/>
```

#### FormLayout para Faltas

```typescript
const FaltaForm = ({ initialData, onSubmit, mode = 'create' }) => {
  const form = useForm<FaltaFormData>({
    defaultValues: {
      usuario_id: '',
      empresa_id: '',
      tipo_id: '',
      indice_id: '',
      tratamento_id: '',
      esf: '',
      cil: '',
      quantidade: 1,
      ...initialData
    }
  });

  return (
    <FormLayout
      title={mode === 'edit' ? 'Editar Falta' : 'Nova Falta'}
      description="Registre as informações da falta de óptica"
      layout="grid"
      columns={2}
      onSubmit={form.handleSubmit(onSubmit)}
      loading={form.formState.isSubmitting}
    >
      <FormSection title="Informações do Paciente">
        <FormField name="usuario_id" label="Usuário" required>
          <UsuarioSelect
            value={form.watch('usuario_id')}
            onChange={(value) => {
              form.setValue('usuario_id', value);
              // Auto-fill empresa if available
              const usuario = usuarios.find(u => u.id === value);
              if (usuario?.empresa_id) {
                form.setValue('empresa_id', usuario.empresa_id);
              }
            }}
            error={form.formState.errors.usuario_id?.message}
          />
        </FormField>
        
        <FormField name="empresa_id" label="Empresa" required>
          <EmpresaSelect
            value={form.watch('empresa_id')}
            onChange={(value) => form.setValue('empresa_id', value)}
            error={form.formState.errors.empresa_id?.message}
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Informações da Falta">
        <FormField name="tipo_id" label="Tipo" required>
          <TipoSelect
            value={form.watch('tipo_id')}
            onChange={(value) => form.setValue('tipo_id', value)}
            error={form.formState.errors.tipo_id?.message}
          />
        </FormField>
        
        <FormField name="tratamento_id" label="Tratamento">
          <TratamentoSelect
            value={form.watch('tratamento_id')}
            onChange={(value) => form.setValue('tratamento_id', value)}
            error={form.formState.errors.tratamento_id?.message}
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Prescrição">
        <FormField name="indice_id" label="Índice" required>
          <IndiceSelect
            value={form.watch('indice_id')}
            onChange={(value) => {
              form.setValue('indice_id', value);
              // Auto-fill prescription if available
              const indice = indices.find(i => i.id === value);
              if (indice) {
                form.setValue('esf', indice.esf.toString());
                form.setValue('cil', indice.cil.toString());
              }
            }}
            error={form.formState.errors.indice_id?.message}
          />
        </FormField>
        
        <FormField name="quantidade" label="Quantidade" required>
          <Input
            type="number"
            {...form.register('quantidade', { 
              required: 'Quantidade é obrigatória',
              min: { value: 1, message: 'Mínimo de 1 unidade' }
            })}
            error={form.formState.errors.quantidade?.message}
            min="1"
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Valores da Prescrição">
        <FormField name="esf" label="Esférico (ESF)">
          <PrescriptionInput
            value={form.watch('esf')}
            onChange={(value) => form.setValue('esf', value)}
            placeholder="Ex: -2.00"
            error={form.formState.errors.esf?.message}
          />
        </FormField>
        
        <FormField name="cil" label="Cilíndrico (CIL)">
          <PrescriptionInput
            value={form.watch('cil')}
            onChange={(value) => form.setValue('cil', value)}
            placeholder="Ex: -0.75"
            error={form.formState.errors.cil?.message}
          />
        </FormField>
      </FormSection>
    </FormLayout>
  );
};
```

---

## 3. Compras (Purchases)

### Análise da Entidade

**Características:**
- Gestão de compras de materiais
- Controle de fornecedores
- Status de pagamento
- Valores e datas

**Campos Principais:**
- fornecedor, data_compra, valor_total, status, descricao

### Componentização

#### DataTable para Compras

```typescript
// Column configuration
const compraColumns: DataTableColumn<Compra>[] = [
  {
    key: 'fornecedor',
    label: 'Fornecedor',
    sortable: true,
    render: (value) => (
      <div className="flex items-center gap-2">
        <Icon name="business" className="!text-slate-400" />
        <span className="font-medium">{value}</span>
      </div>
    )
  },
  {
    key: 'data_compra',
    label: 'Data da Compra',
    sortable: true,
    render: (value) => (
      <span className="text-sm">
        {formatDate(value)}
      </span>
    )
  },
  {
    key: 'valor_total',
    label: 'Valor Total',
    align: 'right',
    sortable: true,
    render: (value) => (
      <span className="font-medium">
        {formatCurrency(value)}
      </span>
    )
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (value) => (
      <StatusBadge 
        status={value} 
        variants={{
          'Pendente': { color: 'amber', label: 'Pendente' },
          'Pago': { color: 'emerald', label: 'Pago' },
          'Cancelado': { color: 'red', label: 'Cancelado' }
        }}
      />
    )
  },
  {
    key: 'descricao',
    label: 'Descrição',
    render: (value) => (
      <span className="text-sm max-w-xs truncate" title={value}>
        {value || '-'}
      </span>
    )
  }
];

// Usage
<DataTable
  data={compras}
  columns={compraColumns}
  loading={isLoading}
  error={error}
  selection={{
    selectedIds,
    onSelectionChange: setSelectedIds,
    getRowId: (compra) => compra.id
  }}
  sort={{
    column: 'data_compra',
    direction: 'desc',
    onSort: handleSort
  }}
  actions={[
    {
      key: 'edit',
      label: 'Editar',
      icon: 'edit',
      show: (compra) => compra.status === 'Pendente',
      onClick: (compra) => editCompra(compra)
    },
    {
      key: 'pay',
      label: 'Marcar como Pago',
      icon: 'payments',
      variant: 'success',
      show: (compra) => compra.status === 'Pendente',
      onClick: (compra) => markAsPaid(compra)
    },
    {
      key: 'cancel',
      label: 'Cancelar',
      icon: 'cancel',
      variant: 'destructive',
      show: (compra) => compra.status === 'Pendente',
      onClick: (compra) => cancelCompra(compra)
    },
    {
      key: 'receipt',
      label: 'Ver Comprovante',
      icon: 'receipt',
      show: (compra) => compra.status === 'Pago',
      onClick: (compra) => viewReceipt(compra)
    }
  ]}
  bulkActions={(selectedCompras) => (
    <BulkActionsMenu
      selectedCount={selectedCompras.length}
      actions={[
        {
          label: 'Marcar como Pagas',
          icon: 'payments',
          onClick: () => bulkMarkAsPaid(selectedCompras)
        },
        {
          label: 'Cancelar Selecionadas',
          icon: 'cancel',
          variant: 'warning',
          onClick: () => bulkCancel(selectedCompras)
        },
        {
          label: 'Exportar Relatório',
          icon: 'download',
          onClick: () => exportReport(selectedCompras)
        }
      ]}
    />
  )}
  pagination={paginationConfig}
  empty={{
    title: 'Nenhuma compra registrada',
    description: 'Registre as primeiras compras de materiais',
    action: <Button onClick={createCompra}>Nova Compra</Button>,
    icon: 'shopping_cart'
  }}
/>
```

---

## 4. Tratamentos (Treatments)

### Análise da Entidade

**Características:**
- Catálogo de tratamentos ópticos
- Preços e descrições
- Categorias
- Status ativo/inativo

**Campos Principais:**
- nome, descricao, categoria, preco, status

### Componentização

#### DataTable para Tratamentos

```typescript
// Column configuration
const tratamentoColumns: DataTableColumn<Tratamento>[] = [
  {
    key: 'nome',
    label: 'Tratamento',
    sortable: true,
    render: (value) => (
      <div className="flex items-center gap-2">
        <Icon name="medical_services" className="!text-slate-400" />
        <span className="font-medium">{value}</span>
      </div>
    )
  },
  {
    key: 'categoria',
    label: 'Categoria',
    align: 'center',
    render: (value) => (
      <CategoriaBadge categoria={value} />
    )
  },
  {
    key: 'preco',
    label: 'Preço',
    align: 'right',
    sortable: true,
    render: (value) => (
      <span className="font-medium">
        {formatCurrency(value)}
      </span>
    )
  },
  {
    key: 'descricao',
    label: 'Descrição',
    render: (value) => (
      <span className="text-sm max-w-xs truncate" title={value}>
        {value || '-'}
      </span>
    )
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (value) => (
      <StatusToggle
        value={value}
        onChange={(newValue) => updateStatus(tratamento.id, newValue)}
        options={[
          { value: 'Ativo', label: 'Ativo' },
          { value: 'Inativo', label: 'Inativo' }
        ]}
      />
    )
  }
];
```

---

## 5. Tipos (Types)

### Análise da Entidade

**Características:**
- Tipos de materiais/lentes
- Classificações
- Configurações

**Campos Principais:**
- nome, descricao, categoria

### Componentização

#### DataTable para Tipos

```typescript
// Column configuration
const tipoColumns: DataTableColumn<Tipo>[] = [
  {
    key: 'nome',
    label: 'Tipo',
    sortable: true,
    render: (value) => (
      <div className="flex items-center gap-2">
        <Icon name="category" className="!text-slate-400" />
        <span className="font-medium">{value}</span>
      </div>
    )
  },
  {
    key: 'descricao',
    label: 'Descrição',
    render: (value) => (
      <span className="text-sm">{value || '-'}</span>
    )
  },
  {
    key: 'created_at',
    label: 'Criado em',
    render: (value) => (
      <span className="text-sm">
        {formatDate(value)}
      </span>
    )
  }
];
```

---

## Padrão de Migração

### Template de Migração

```typescript
// 1. Definir colunas
const [entity]Columns: DataTableColumn<[Entity]>[] = [
  // Column definitions
];

// 2. Criar formulário
const [Entity]Form = ({ initialData, onSubmit, mode }) => {
  // Form implementation
  return (
    <FormLayout>
      {/* Form fields */}
    </FormLayout>
  );
};

// 3. Criar header
const [Entity]PageHeader = () => {
  // Header implementation
  return (
    <PageHeader>
      {/* Header content */}
    </PageHeader>
  );
};

// 4. Criar página
const [Entity]Page = () => {
  // Page implementation
  return (
    <>
      <[Entity]PageHeader />
      <DataTable columns={[entity]Columns} />
      <[Entity]Modal />
      <ConfirmActionDialog />
    </>
  );
};
```

### Checklist de Migração

- [ ] **Análise**: Mapear campos e relacionamentos
- [ ] **Colunas**: Definir configuração de colunas
- [ ] **Formulário**: Implementar com FormLayout
- [ ] **Header**: Implementar com PageHeader
- [ ] **Ações**: Configurar ações em linha e em lote
- [ ] **Estados**: Implementar loading, empty, error
- [ ] **Validação**: Configurar validação de formulários
- [ ] **Testes**: Criar testes unitários e de integração
- [ ] **Documentação**: Atualizar documentação

---

## Componentes Específicos por Entidade

### Componentes Auxiliares

#### UserAvatar
```typescript
interface UserAvatarProps {
  usuario: Usuario;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ usuario, size = 'md', showStatus = false }) => {
  return (
    <div className="relative">
      <img
        src={usuario.avatar_url || `https://ui-avatars.com/api/?name=${usuario.nome}&background=random`}
        alt={usuario.nome}
        className={`rounded-full ${sizeClasses[size]}`}
      />
      {showStatus && (
        <StatusIndicator 
          status={usuario.status} 
          size="sm"
          className="absolute -bottom-1 -right-1"
        />
      )}
    </div>
  );
};
```

#### StatusBadge
```typescript
interface StatusBadgeProps {
  status: string;
  variants: Record<string, { color: string; label: string }>;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variants, size = 'md' }) => {
  const config = variants[status] || { color: 'slate', label: status };
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      colorClasses[config.color],
      sizeClasses[size]
    )}>
      <Icon name="circle" className="!text-xs" />
      {config.label}
    </span>
  );
};
```

#### PrescriptionInput
```typescript
interface PrescriptionInputProps extends InputProps {
  allowNegative?: boolean;
  precision?: number;
}

const PrescriptionInput: React.FC<PrescriptionInputProps> = ({
  allowNegative = true,
  precision = 2,
  ...props
}) => {
  const formatValue = (value: string) => {
    // Format prescription values
  };
  
  const parseValue = (value: string) => {
    // Parse prescription values
  };
  
  return (
    <Input
      {...props}
      onChange={(value) => props.onChange?.(parseValue(value))}
      value={formatValue(props.value || '')}
    />
  );
};
```

---

## Estrutura de Arquivos por Entidade

### Padrão de Estrutura

```
src/pages/[entity]/
├── [Entity]Page.tsx
├── [Entity]Form.tsx
├── [Entity]Modal.tsx
├── [Entity]PageHeader.tsx
├── components/
│   ├── [Entity]Avatar.tsx
│   ├── [Entity]Badge.tsx
│   ├── [Entity]Select.tsx
│   └── index.ts
├── hooks/
│   ├── use[Entity].ts
│   ├── use[Entity]Form.ts
│   └── index.ts
├── types/
│   └── [entity].types.ts
└── __tests__/
    ├── [Entity]Page.test.tsx
    ├── [Entity]Form.test.tsx
    └── [Entity]Page.integration.test.tsx
```

### Exemplo para Usuários

```
src/pages/usuarios/
├── UsuariosPage.tsx
├── UsuarioForm.tsx
├── UsuarioModal.tsx
├── UsuarioPageHeader.tsx
├── components/
│   ├── UserAvatar.tsx
│   ├── RoleBadge.tsx
│   ├── UserSelect.tsx
│   └── index.ts
├── hooks/
│   ├── useUsuarios.ts
│   ├── useUsuarioForm.ts
│   └── index.ts
├── types/
│   └── usuario.types.ts
└── __tests__/
    ├── UsuariosPage.test.tsx
    ├── UsuarioForm.test.tsx
    └── UsuariosPage.integration.test.tsx
```

---

## Timeline de Implementação

### Sprint 1: Fundação (2 semanas)

**Semana 1: Usuários**
- Dia 1-2: DataTable e PageHeader
- Dia 3-4: FormLayout e componentes auxiliares
- Dia 5: Integração e testes

**Semana 2: Faltas**
- Dia 1-2: DataTable com prescrições
- Dia 3-4: FormLayout complexo
- Dia 5: Integração e validação

### Sprint 2: Expansão (2 semanas)

**Semana 3: Compras e Tratamentos**
- Dia 1-3: Compras components
- Dia 4-5: Tratamentos components

**Semana 4: Tipos e Finalização**
- Dia 1-2: Tipos components
- Dia 3-4: Refinamento e otimização
- Dia 5: Documentação e treinamento

### Sprint 3: Consolidação (1 semana)

**Semana 5: Integração Final**
- Dia 1-2: Integração cross-entity
- Dia 3-4: Performance e acessibilidade
- Dia 5: Deploy e monitoramento

---

## Métricas de Sucesso

### Métricas Técnicas

1. **Code Reuse**: 80%+ dos componentes compartilhados utilizados
2. **Performance**: < 2s para carregamento de páginas
3. **Bundle Size**: Redução de 30% no tamanho total
4. **Test Coverage**: 90%+ de cobertura de testes
5. **Type Safety**: 100% de cobertura TypeScript

### Métricas de Negócio

1. **Development Velocity**: +40% em velocidade de desenvolvimento
2. **Bug Reduction**: -70% em bugs relacionados a UI
3. **User Satisfaction**: +30% em satisfação do usuário
4. **Maintenance Time**: -60% em tempo de manutenção
5. **Feature Delivery**: +50% em velocidade de entrega

---

## Conclusão

Este blueprint estabelece uma abordagem sistemática para aplicar os componentes compartilhados em todas as entidades do VisuLab, garantindo consistência, manutenibilidade e escalabilidade.

A adoção deste padrão permitirá:
- **Desenvolvimento mais rápido** através de componentes reutilizáveis
- **Experiência consistente** para todos os usuários
- **Manutenibilidade simplificada** com código centralizado
- **Escalabilidade** para novas funcionalidades
- **Qualidade garantida** através de componentes testados

O sucesso desta implementação criará uma base sólida para a evolução contínua do sistema, mantendo alta qualidade de código e experiência do usuário.