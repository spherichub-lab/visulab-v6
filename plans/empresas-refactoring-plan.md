# Plano de Refatoração - UI de Empresas

## Visão Geral

Este documento detalha o plano de refatoração da interface de usuário de Empresas para utilizar os novos componentes compartilhados, servindo como prova de conceito para a arquitetura definida na Fase 2.

## Objetivos

1. **Consistência**: Aplicar componentes compartilhados para garantir consistência visual e comportamental
2. **Manutenibilidade**: Reduzir código duplicado e facilitar manutenção futura
3. **Reusabilidade**: Validar que os componentes compartilhados funcionam em cenários reais
4. **Performance**: Melhorar performance através de componentes otimizados
5. **Acessibilidade**: Garantir conformidade com WCAG através de componentes acessíveis

## Mapeamento de Componentes

| Componente Atual | Novo Componente | Complexidade | Risco |
|------------------|------------------|---------------|---------|
| EmpresaTable | DataTable | Média | Médio |
| EmpresaForm | FormLayout + FormField | Baixa | Baixo |
| EmpresaModal | Modal + FormLayout | Baixa | Baixo |
| EmpresaFilters | PageHeader + CustomSelect | Baixa | Baixo |
| EmpresaActionModal | ConfirmActionDialog | Baixa | Baixo |

## Fases de Migração

### Fase 1: Preparação (Dia 1)

**Objetivos:**
- Configurar estrutura de pastas para componentes compartilhados
- Implementar componentes base (Button, Input, Icon)
- Configurar tema e design tokens

**Tarefas:**
1. Criar estrutura `src/components/shared/`
2. Implementar componentes UI base
3. Configurar sistema de temas
4. Criar utilitários e hooks compartilhados

**Entregáveis:**
- Estrutura de pastas organizada
- Componentes base funcionando
- Sistema de temas configurado

### Fase 2: DataTable (Dia 2-3)

**Objetivos:**
- Implementar componente DataTable genérico
- Migrar EmpresaTable para novo DataTable
- Validar funcionalidades críticas

**Tarefas:**
1. Implementar DataTable com subcomponentes
2. Criar configuração de colunas para Empresa
3. Implementar ações em linha e em lote
4. Migrar EmpresaTable.tsx
5. Testar funcionalidades (sort, pagination, selection)

**Entregáveis:**
- Componente DataTable funcional
- EmpresaTable refatorado
- Testes unitários para DataTable

### Fase 3: FormLayout (Dia 3-4)

**Objetivos:**
- Implementar componente FormLayout genérico
- Migrar EmpresaForm para novo FormLayout
- Integrar com sistema de validação

**Tarefas:**
1. Implementar FormLayout com subcomponentes
2. Integrar com react-hook-form
3. Migrar EmpresaForm.tsx
4. Implementar validação e estados de erro
5. Testar fluxos de criação e edição

**Entregáveis:**
- Componente FormLayout funcional
- EmpresaForm refatorado
- Integração com validação funcionando

### Fase 4: PageHeader (Dia 4)

**Objetivos:**
- Implementar componente PageHeader genérico
- Migrar EmpresaFilters para PageHeader
- Implementar busca e filtros

**Tarefas:**
1. Implementar PageHeader com subcomponentes
2. Migrar EmpresaFilters.tsx
3. Implementar busca com debouncing
4. Integrar filtros de tipo e status
5. Testar responsividade

**Entregáveis:**
- Componente PageHeader funcional
- EmpresaFilters refatorado
- Busca e filtros funcionando

### Fase 5: Modais (Dia 5)

**Objetivos:**
- Implementar ConfirmActionDialog genérico
- Migrar EmpresaModal e EmpresaActionModal
- Validar fluxos de CRUD

**Tarefas:**
1. Implementar ConfirmActionDialog
2. Migrar EmpresaModal.tsx
3. Migrar EmpresaActionModal.tsx
4. Integrar com hooks de domínio
5. Testar todos os fluxos modais

**Entregáveis:**
- ConfirmActionDialog funcional
- Modais refatorados
- Fluxos de CRUD validados

### Fase 6: Integração (Dia 5-6)

**Objetivos:**
- Integrar todos os componentes refatorados
- Remover componentes antigos
- Testar integração completa

**Tarefas:**
1. Atualizar página Companies.tsx
2. Remover componentes antigos
3. Testar fluxos completos
4. Validar performance
5. Corrigir bugs finais

**Entregáveis:**
- Página de Empresas completamente refatorada
- Componentes antigos removidos
- Testes de integração passando

---

## Detalhamento Técnico

### 1. DataTable Implementation

```typescript
// src/components/shared/DataTable/DataTable.tsx
import React, { useState, useMemo } from 'react';
import { DataTableProps } from '@/types/components';

export const DataTable = <T,>({
  data,
  columns,
  loading,
  error,
  selection,
  sort,
  pagination,
  actions,
  bulkActions,
  ...props
}: DataTableProps<T>) => {
  // Implementation logic
};

// Column configuration for Empresa
const empresaColumns: DataTableColumn<Empresa>[] = [
  {
    key: 'nome',
    label: 'Empresa',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center gap-3">
        <EmpresaAvatar empresa={row} />
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-slate-500">ID: #{row.id.substring(0, 4)}</p>
        </div>
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
      <div className="flex justify-center">
        <span className={`h-2.5 w-2.5 rounded-full ${
          value === 'Ativa' ? 'bg-emerald-500' : 'bg-red-500'
        }`} />
      </div>
    )
  },
  {
    key: 'actions',
    label: 'Ações',
    align: 'right',
    render: (_, row) => (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => editEmpresa(row)}>
          <Icon name="edit" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toggleStatus(row)}>
          <Icon name={row.status === 'Ativa' ? 'block' : 'check_circle'} />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => deleteEmpresa(row)}>
          <Icon name="delete" />
        </Button>
      </div>
    )
  }
];
```

### 2. FormLayout Implementation

```typescript
// src/components/shared/FormLayout/FormLayout.tsx
import React from 'react';
import { FormLayoutProps } from '@/types/components';

export const FormLayout = ({
  children,
  title,
  description,
  layout = 'vertical',
  columns = 1,
  spacing = 'normal',
  onSubmit,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  loading = false,
  ...props
}: FormLayoutProps) => {
  // Implementation logic
};

// Empresa form with new FormLayout
const EmpresaForm = ({ initialData, onSubmit, mode = 'create' }) => {
  const form = useForm<EmpresaFormData>({
    defaultValues: {
      nome: '',
      tipo: 'Fornecedor',
      contato_nome: '',
      contato_email: '',
      status: 'Ativa',
      ...initialData
    }
  });

  return (
    <FormLayout
      title={mode === 'edit' ? 'Editar Empresa' : 'Nova Empresa'}
      description={mode === 'edit' 
        ? 'Edite as informações da empresa abaixo.'
        : 'Preencha as informações para criar uma nova empresa.'
      }
      layout="grid"
      columns={2}
      onSubmit={form.handleSubmit(onSubmit)}
      loading={form.formState.isSubmitting}
      submitText={mode === 'edit' ? 'Salvar Alterações' : 'Criar Empresa'}
    >
      <FormSection title="Informações Básicas">
        <FormField name="nome" label="Nome da Empresa" required>
          <Input
            {...form.register('nome', { required: 'Nome é obrigatório' })}
            error={form.formState.errors.nome?.message}
            placeholder="Ex: LensTech Soluções"
          />
        </FormField>
        
        <FormField name="tipo" label="Tipo" required>
          <CustomSelect
            value={form.watch('tipo')}
            onChange={(value) => form.setValue('tipo', value)}
            options={['Fornecedor', 'Filial', 'Matriz']}
            error={form.formState.errors.tipo?.message}
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Informações de Contato">
        <FormField name="contato_nome" label="Nome do Contato">
          <Input
            {...form.register('contato_nome')}
            placeholder="Ex: João Silva"
          />
        </FormField>
        
        <FormField name="contato_email" label="Email do Contato">
          <Input
            type="email"
            {...form.register('contato_email', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido'
              }
            })}
            error={form.formState.errors.contato_email?.message}
            placeholder="Ex: joao@empresa.com"
          />
        </FormField>
      </FormSection>
    </FormLayout>
  );
};
```

### 3. PageHeader Implementation

```typescript
// src/components/shared/PageHeader/PageHeader.tsx
import React from 'react';
import { PageHeaderProps } from '@/types/components';

export const PageHeader = ({
  title,
  subtitle,
  description,
  breadcrumb,
  actions,
  search,
  filters,
  ...props
}: PageHeaderProps) => {
  // Implementation logic
};

// Empresa page header
const EmpresaPageHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<EmpresaFilters>({});
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  return (
    <PageHeader
      title="Empresas"
      description="Gerencie as empresas cadastradas no sistema"
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Empresas', active: true }
      ]}
      search={{
        placeholder: "Buscar por nome ou email...",
        value: searchQuery,
        onChange: setSearchQuery,
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
          onClick: () => setIsCreateModalOpen(true)
        }
      ]}
      filters={
        <div className="flex gap-2">
          <CustomSelect
            value={filters.tipo || ''}
            onChange={(value) => setFilters({ ...filters, tipo: value || undefined })}
            options={[
              { value: '', label: 'Todos os tipos' },
              { value: 'Fornecedor', label: 'Fornecedor' },
              { value: 'Filial', label: 'Filial' },
              { value: 'Matriz', label: 'Matriz' }
            ]}
            placeholder="Tipo"
          />
          <CustomSelect
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: value || undefined })}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'Ativa', label: 'Ativa' },
              { value: 'Inativa', label: 'Inativa' }
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

### 4. ConfirmActionDialog Implementation

```typescript
// src/components/shared/ConfirmActionDialog/ConfirmActionDialog.tsx
import React from 'react';
import { ConfirmActionDialogProps } from '@/types/components';

export const ConfirmActionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  item,
  severity = 'medium',
  variant = 'default',
  loading = false,
  ...props
}: ConfirmActionDialogProps) => {
  // Implementation logic
};

// Delete confirmation dialog
const DeleteEmpresaDialog = ({ 
  isOpen, 
  onClose, 
  empresa, 
  onConfirm 
}: {
  isOpen: boolean;
  onClose: () => void;
  empresa: Empresa | null;
  onConfirm: () => Promise<void>;
}) => {
  return (
    <ConfirmActionDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Excluir Empresa"
      description={`Tem certeza que deseja excluir "${empresa?.nome}"?`}
      warning="Esta ação não pode ser desfeita e todos os dados associados serão perdidos."
      item={empresa ? {
        name: empresa.nome,
        description: `${empresa.tipo} • ${empresa.status}`,
        avatar: (
          <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">
            {empresa.nome.substring(0, 2).toUpperCase()}
          </div>
        ),
        metadata: {
          'ID': empresa.id,
          'Criado em': new Date(empresa.created_at).toLocaleDateString('pt-BR'),
          'Contato': empresa.contato_email || 'N/A'
        }
      } : undefined}
      confirmText="Excluir Permanentemente"
      cancelText="Cancelar"
      severity="critical"
      variant="destructive"
      icon="delete_forever"
      size="md"
      closeOnEscape
      closeOnBackdrop
    />
  );
};
```

---

## Estrutura de Arquivos

### Nova Estrutura

```
src/components/shared/
├── DataTable/
│   ├── DataTable.tsx
│   ├── DataTableRow.tsx
│   ├── DataTableCell.tsx
│   ├── DataTableHeader.tsx
│   ├── DataTablePagination.tsx
│   ├── index.ts
│   └── DataTable.stories.tsx
├── FormLayout/
│   ├── FormLayout.tsx
│   ├── FormField.tsx
│   ├── FormSection.tsx
│   ├── FormActions.tsx
│   ├── index.ts
│   └── FormLayout.stories.tsx
├── PageHeader/
│   ├── PageHeader.tsx
│   ├── PageHeaderBreadcrumb.tsx
│   ├── PageHeaderActions.tsx
│   ├── PageHeaderSearch.tsx
│   ├── index.ts
│   └── PageHeader.stories.tsx
├── FeedbackState/
│   ├── FeedbackState.tsx
│   ├── FeedbackLoading.tsx
│   ├── FeedbackEmpty.tsx
│   ├── FeedbackError.tsx
│   ├── FeedbackSuccess.tsx
│   ├── index.ts
│   └── FeedbackState.stories.tsx
├── ConfirmActionDialog/
│   ├── ConfirmActionDialog.tsx
│   ├── index.ts
│   └── ConfirmActionDialog.stories.tsx
├── theme/
│   ├── tokens.ts
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── index.ts
└── index.ts
```

### Arquivos a Remover

```
src/components/
├── EmpresaTable.tsx (remover após migração)
├── EmpresaForm.tsx (remover após migração)
├── EmpresaModal.tsx (remover após migração)
├── EmpresaFilters.tsx (remover após migração)
├── EmpresaActionModal.tsx (remover após migração)
└── README.md (atualizar com novos componentes)
```

---

## Testes

### Testes Unitários

```typescript
// DataTable.test.tsx
describe('DataTable', () => {
  it('renders empresa data correctly', () => {
    const empresas = [
      { id: '1', nome: 'Test Empresa', tipo: 'Fornecedor', status: 'Ativa' }
    ];
    
    render(<DataTable data={empresas} columns={empresaColumns} />);
    
    expect(screen.getByText('Test Empresa')).toBeInTheDocument();
    expect(screen.getByText('Fornecedor')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    render(<DataTable data={[]} columns={empresaColumns} loading />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
  
  it('handles row selection', () => {
    const onSelectionChange = jest.fn();
    
    render(
      <DataTable
        data={empresas}
        columns={empresaColumns}
        selection={{
          selectedIds: [],
          onSelectionChange,
          getRowId: (e) => e.id
        }}
      />
    );
    
    fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }));
    
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });
});

// FormLayout.test.tsx
describe('FormLayout', () => {
  it('renders form with validation', async () => {
    const onSubmit = jest.fn();
    
    render(
      <FormLayout onSubmit={onSubmit}>
        <FormField name="nome" label="Nome" required>
          <Input />
        </FormField>
      </FormLayout>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    });
  });
});

// ConfirmActionDialog.test.tsx
describe('ConfirmActionDialog', () => {
  it('shows item information correctly', () => {
    const empresa = {
      id: '1',
      nome: 'Test Empresa',
      tipo: 'Fornecedor',
      status: 'Ativa'
    };
    
    render(
      <ConfirmActionDialog
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        item={empresa}
        title="Excluir Empresa"
      />
    );
    
    expect(screen.getByText('Test Empresa')).toBeInTheDocument();
    expect(screen.getByText('Fornecedor • Ativa')).toBeInTheDocument();
  });
});
```

### Testes de Integração

```typescript
// EmpresaPage.integration.test.tsx
describe('Empresa Management Flow', () => {
  it('should create new empresa successfully', async () => {
    render(<EmpresaPage />);
    
    // Open create modal
    fireEvent.click(screen.getByText('Nova Empresa'));
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Nome da Empresa'), {
      target: { value: 'Nova Test Empresa' }
    });
    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: 'Fornecedor' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Criar Empresa'));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Empresa criada com sucesso!')).toBeInTheDocument();
    });
    
    // Verify in table
    await waitFor(() => {
      expect(screen.getByText('Nova Test Empresa')).toBeInTheDocument();
    });
  });
  
  it('should delete empresa with confirmation', async () => {
    const empresas = [
      { id: '1', nome: 'Test Empresa', tipo: 'Fornecedor', status: 'Ativa' }
    ];
    
    render(<EmpresaPage />);
    
    // Click delete button
    fireEvent.click(screen.getByLabelText('Excluir'));
    
    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Excluir Empresa')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Excluir Permanentemente'));
    
    // Verify deletion
    await waitFor(() => {
      expect(screen.queryByText('Test Empresa')).not.toBeInTheDocument();
    });
  });
});
```

---

## Performance

### Métricas de Performance

1. **First Contentful Paint**: < 1.5s
2. **Largest Contentful Paint**: < 2.5s
3. **Time to Interactive**: < 3.5s
4. **Cumulative Layout Shift**: < 0.1
5. **Bundle Size**: Redução de 20% em comparação com atual

### Otimizações

1. **Code Splitting**: Lazy loading de componentes
2. **Virtualization**: Para tabelas com > 100 itens
3. **Memoization**: React.memo para componentes puros
4. **Debouncing**: Para busca e filtros
5. **Pagination**: Server-side pagination para datasets grandes

---

## Acessibilidade

### Requisitos WCAG 2.1 AA

1. **Navegação por Teclado**: Todos os componentes navegáveis por tab
2. **Contraste de Cores**: Mínimo 4.5:1 para texto normal
3. **Textos Alternativos**: Para ícones e imagens
4. **ARIA Labels**: Para elementos interativos
5. **Focus Management**: Em modais e formulários

### Validação

```typescript
// Accessibility tests
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    render(<DataTable data={empresas} columns={columns} />);
    
    expect(screen.getByRole('table')).toHaveAttribute('aria-label');
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });
  
  it('should be keyboard navigable', () => {
    render(<FormLayout><Input /></FormLayout>);
    
    const input = screen.getByRole('textbox');
    input.focus();
    
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    
    expect(document.activeElement).toBe(input);
  });
});
```

---

## Rollback Plan

### Critérios de Rollback

1. **Bugs Críticos**: Mais de 5 bugs críticos em produção
2. **Performance**: Degradação > 30% em métricas chave
3. **UX**: Feedback negativo de > 20% dos usuários
4. **Acessibilidade**: Falha em validações WCAG

### Procedimento de Rollback

1. **Hotfix**: Tentar corrigir bugs críticos (2 horas)
2. **Partial Rollback**: Reverter apenas componentes problemáticos (4 horas)
3. **Full Rollback**: Reverter para versão anterior (6 horas)
4. **Communication**: Notificar usuários sobre mudanças

---

## Success Metrics

### Métricas de Sucesso

1. **Adoção**: 100% dos componentes de Empresas migrados
2. **Performance**: Melhoria de 20% em métricas de performance
3. **Código**: Redução de 40% em linhas de código
4. **Bugs**: Redução de 60% em bugs reportados
5. **Manutenibilidade**: Tempo de desenvolvimento 50% menor

### KPIs

1. **Developer Velocity**: +30% em story points por sprint
2. **Code Review Time**: -40% em tempo de review
3. **Bug Fix Time**: -50% em tempo para corrigir bugs
4. **User Satisfaction**: +25% em satisfação do usuário
5. **Accessibility Score**: 95%+ em validações automatizadas

---

## Timeline

### Semana 1: Fundação
- **Dia 1**: Setup e componentes base
- **Dia 2-3**: DataTable implementation
- **Dia 3-4**: FormLayout implementation
- **Dia 4**: PageHeader implementation
- **Dia 5**: Modals implementation
- **Dia 5-6**: Integração e testes

### Semana 2: Refinamento
- **Dia 1**: Performance optimization
- **Dia 2**: Accessibility improvements
- **Dia 3**: Documentation updates
- **Dia 4**: User acceptance testing
- **Dia 5**: Production deployment

### Semana 3: Monitoramento
- **Dia 1-3**: Production monitoring
- **Dia 4**: Bug fixes and improvements
- **Dia 5**: Retrospective and lessons learned

---

## Riscos e Mitigações

### Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|--------|---------------|-----------|------------|
| Performance regression | Média | Alto | Métricas contínuas, otimização preventiva |
| Breaking changes | Baixa | Alto | Versionamento semântico, migração gradual |
| Browser compatibility | Baixa | Médio | Testes cross-browser, polyfills |
| Accessibility regressions | Média | Alto | Testes automatizados, validação manual |

### Riscos de Projeto

| Risco | Probabilidade | Impacto | Mitigação |
|--------|---------------|-----------|------------|
| Timeline delays | Média | Médio | Buffer de tempo, MVP approach |
| Team resistance | Baixa | Médio | Training, benefits communication |
| User adoption | Baixa | Alto | Beta testing, feedback loops |
| Maintenance overhead | Média | Médio | Documentation, automation |

---

## Conclusão

Este plano de refatoração estabelece uma abordagem estruturada para migrar a UI de Empresas para os novos componentes compartilhados, validando a arquitetura proposta e criando um blueprint para as demais entidades do sistema.

O sucesso desta refatoração demonstrará a viabilidade dos componentes compartilhados e estabelecerá as bases para a evolução escalável do VisuLab, mantendo alta qualidade de código, performance e experiência do usuário.