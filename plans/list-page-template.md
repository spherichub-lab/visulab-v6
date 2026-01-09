# List Page Template - Reference Implementation

This document provides a canonical template for creating new list-based pages. Copy and adapt this code for your specific entity.

## Complete Template Code

```tsx
/**
 * List Page Template - Reference Implementation
 * 
 * This is a canonical template for creating new list-based pages.
 * Copy this file and adapt it for your specific entity.
 * 
 * REQUIRED: Follow all patterns and structure defined here.
 */

import React, { useState, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import {
  DataTable,
  DataTableColumn,
  DataTableAction,
  FormLayout,
  PageHeader,
  PageHeaderAction,
  ConfirmActionDialog,
  FeedbackState
} from '../src/components/shared';
import { Button, Input } from '../src/components/ui';
import {
  useEntityList,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  useUpdateEntityStatus,
  useBulkEntitiesOperation
} from '../src/hooks/domain/entities';
import { EntityFilters, EntityFormData } from '../src/types/domain/domain.types';
import { showSuccess, showWarning, showInfo } from '../src/utils/errorHandler';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * UI-specific type for entity display
 * Transform database entity to this type for UI rendering
 */
type Entity = {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  // Add other UI-specific fields as needed
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

const EntityListPage: React.FC = () => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [actionMode, setActionMode] = useState<'delete' | 'deactivate' | 'activate'>('delete');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter and search states
  const [filters, setFilters] = useState<EntityFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  // ==========================================================================
  // QUERY HOOKS
  // ==========================================================================

  // List query with filters and search
  const {
    data: entitiesData,
    isLoading,
    error,
    refetch
  } = useEntityList({
    filters: {
      ...filters,
      ...(searchQuery && { name: { contains: searchQuery } })
    }
  });

  // Mutation hooks
  const createMutation = useCreateEntity();
  const updateMutation = useUpdateEntity();
  const deleteMutation = useDeleteEntity();
  const updateStatusMutation = useUpdateEntityStatus();
  const bulkOperationMutation = useBulkEntitiesOperation();

  // ==========================================================================
  // DATA EXTRACTION
  // ==========================================================================

  // Extract entities array from paginated response
  const entities = entitiesData?.data || [];

  // Calculate statistics for page header
  const totalEntities = entities.length;
  const activeEntities = entities.filter(e => e.status === 'Active').length;

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  // Toast handlers
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Modal handlers
  const openCreateModal = useCallback(() => {
    setSelectedEntity(null);
    setIsCreateModalOpen(true);
  }, []);

  const openEditModal = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
    setIsEditModalOpen(true);
  }, []);

  const openActionModal = useCallback((entity: Entity, mode: 'delete' | 'deactivate' | 'activate') => {
    setSelectedEntity(entity);
    setActionMode(mode);
  }, []);

  const closeAllModals = useCallback(() => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedEntity(null);
  }, []);

  // CRUD operation handlers
  const handleCreate = useCallback(async (data: EntityFormData) => {
    try {
      await createMutation.mutateAsync(data);
      showSuccess('Entidade criada com sucesso!');
      closeAllModals();
    } catch (error) {
      console.error('Error creating entity:', error);
      showWarning('Erro ao criar entidade. Tente novamente.');
    }
  }, [createMutation, closeAllModals]);

  const handleUpdate = useCallback(async (data: EntityFormData) => {
    if (!selectedEntity?.id) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedEntity.id,
        data
      });
      showSuccess('Entidade atualizada com sucesso!');
      closeAllModals();
    } catch (error) {
      console.error('Error updating entity:', error);
      showWarning('Erro ao atualizar entidade. Tente novamente.');
    }
  }, [updateMutation, selectedEntity, closeAllModals]);

  const handleDelete = useCallback(async () => {
    if (!selectedEntity?.id) return;

    try {
      await deleteMutation.mutateAsync(selectedEntity.id);
      showSuccess('Entidade excluída com sucesso!');
      closeAllModals();
    } catch (error) {
      console.error('Error deleting entity:', error);
      showWarning('Erro ao excluir entidade. Tente novamente.');
    }
  }, [deleteMutation, selectedEntity, closeAllModals]);

  const handleToggleStatus = useCallback(async (entity: Entity) => {
    const newStatus = entity.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await updateStatusMutation.mutateAsync({
        id: entity.id,
        status: newStatus
      });
      showSuccess(`Entidade ${newStatus === 'Active' ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error('Error updating status:', error);
      showWarning('Erro ao alterar status. Tente novamente.');
    }
  }, [updateStatusMutation]);

  // Filter and search handlers
  const handleFiltersChange = useCallback((newFilters: EntityFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Selection handlers
  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedIds(selectedIds);
  }, []);

  const getRowId = useCallback((row: Entity) => row.id, []);

  // Bulk operation handlers
  const handleBulkActivate = useCallback(async () => {
    if (selectedIds.length === 0) {
      showInfo('Selecione pelo menos uma entidade para ativar.');
      return;
    }

    try {
      bulkOperationMutation.mutate({
        ids: selectedIds,
        operation: 'activate'
      } as any);
      showSuccess(`${selectedIds.length} entidade(s) ativada(s) com sucesso!`);
      setSelectedIds([]);
    } catch (error) {
      console.error('Error in bulk activate:', error);
      showWarning('Erro ao ativar entidades. Tente novamente.');
    }
  }, [selectedIds, bulkOperationMutation]);

  const handleBulkDeactivate = useCallback(async () => {
    if (selectedIds.length === 0) {
      showInfo('Selecione pelo menos uma entidade para desativar.');
      return;
    }

    try {
      bulkOperationMutation.mutate({
        ids: selectedIds,
        operation: 'deactivate'
      } as any);
      showSuccess(`${selectedIds.length} entidade(s) desativada(s) com sucesso!`);
      setSelectedIds([]);
    } catch (error) {
      console.error('Error in bulk deactivate:', error);
      showWarning('Erro ao desativar entidades. Tente novamente.');
    }
  }, [selectedIds, bulkOperationMutation]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) {
      showInfo('Selecione pelo menos uma entidade para excluir.');
      return;
    }

    try {
      bulkOperationMutation.mutate({
        ids: selectedIds,
        operation: 'delete'
      } as any);
      showSuccess(`${selectedIds.length} entidade(s) excluída(s) com sucesso!`);
      setSelectedIds([]);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      showWarning('Erro ao excluir entidades. Tente novamente.');
    }
  }, [selectedIds, bulkOperationMutation]);

  // ==========================================================================
  // DATA TABLE CONFIGURATION
  // ==========================================================================

  // Column definitions
  const columns: DataTableColumn<Entity>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border border-slate-100 dark:border-slate-600 shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200">
            {value.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-slate-900 dark:text-white font-bold">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">ID: #{row.id.substring(0, 4).toUpperCase()}</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => (
        <div className="flex justify-center">
          <span
            className={`h-2.5 w-2.5 rounded-full ${value === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}
            title={value}
          />
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value) => (
        <span className="text-slate-600 dark:text-slate-300">
          {value ? new Date(value).toLocaleDateString('pt-BR') : '-'}
        </span>
      )
    }
  ];

  // Row action definitions
  const actions: DataTableAction<Entity>[] = [
    {
      key: 'edit',
      label: 'Editar',
      icon: 'edit',
      onClick: (row) => openEditModal(row)
    },
    {
      key: 'toggle-status',
      label: 'Alterar Status',
      icon: 'toggle_on',
      onClick: (row) => handleToggleStatus(row)
    },
    {
      key: 'delete',
      label: 'Excluir',
      icon: 'delete',
      variant: 'destructive',
      onClick: (row) => openActionModal(row, 'delete')
    }
  ];

  // Bulk actions render function
  const renderBulkActions = useCallback((selectedRows: Entity[]) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBulkActivate}
        disabled={bulkOperationMutation.isPending}
      >
        <Icon name="check_circle" className="!text-sm mr-1" />
        Ativar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleBulkDeactivate}
        disabled={bulkOperationMutation.isPending}
      >
        <Icon name="block" className="!text-sm mr-1" />
        Desativar
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={handleBulkDelete}
        disabled={bulkOperationMutation.isPending}
      >
        <Icon name="delete" className="!text-sm mr-1" />
        Excluir
      </Button>
    </div>
  ), [handleBulkActivate, handleBulkDeactivate, handleBulkDelete, bulkOperationMutation.isPending]);

  // ==========================================================================
  // PAGE HEADER CONFIGURATION
  // ==========================================================================

  const headerActions: PageHeaderAction[] = [
    {
      key: 'create',
      label: 'Nova Entidade',
      icon: 'add',
      variant: 'primary',
      onClick: openCreateModal
    }
  ];

  const metrics = [
    {
      label: 'Total',
      value: totalEntities.toString(),
      icon: 'inventory_2',
      color: 'text-white',
      bg: 'bg-slate-900 dark:bg-primary'
    },
    {
      label: 'Ativos',
      value: activeEntities.toString(),
      icon: 'check_circle',
      color: 'text-white',
      bg: 'bg-slate-900 dark:bg-primary'
    }
  ];

  const isAnyModalOpen = isCreateModalOpen || isEditModalOpen;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="h-full flex flex-col px-4 md:px-6 py-4 overflow-hidden relative">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      {/* Page Header */}
      <PageHeader
        title="Gerenciar Entidades"
        description="Administre suas entidades e suas configurações."
        actions={headerActions}
        search={{
          placeholder: "Buscar por nome...",
          value: searchQuery,
          onChange: handleSearch,
          debounce: 300
        }}
        size="md"
        bordered
      >
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
          {metrics.map(metric => (
            <div
              key={metric.label}
              className="bg-white dark:bg-surface-dark rounded-2xl p-3 px-4 shadow-soft flex flex-col md:flex-row items-center md:gap-3 border border-slate-100 dark:border-slate-700 justify-center md:justify-start text-center md:text-left hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full ${metric.bg} ${metric.color} flex items-center justify-center mb-1 md:mb-0 shadow-md`}>
                <Icon name={metric.icon} className="!text-lg md:!text-xl" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{metric.label}</p>
                <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHeader>

      {/* Main Content */}
      <div className="flex-1 bg-white dark:bg-surface-dark rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Data Table with State Handling */}
        <div className="flex-1 px-6">
          {isLoading ? (
            <FeedbackState
              type="loading"
              variant="full"
              size="lg"
            />
          ) : error ? (
            <FeedbackState
              type="error"
              title="Erro ao carregar entidades"
              description={error.message || 'Ocorreu um erro ao buscar as entidades. Tente novamente.'}
              onRetry={refetch}
              variant="full"
              size="lg"
            />
          ) : entities.length === 0 ? (
            <FeedbackState
              type="empty"
              title="Nenhuma entidade encontrada"
              description="Não há entidades cadastradas no momento. Clique em 'Nova Entidade' para adicionar a primeira."
              icon="inventory_2"
              variant="full"
              size="lg"
              action={{
                label: 'Nova Entidade',
                onClick: openCreateModal,
                icon: 'add'
              }}
            />
          ) : (
            <DataTable
              data={entities as any[]}
              columns={columns}
              actions={actions}
              selection={{
                selectedIds,
                onSelectionChange: handleSelectionChange,
                getRowId,
                multiple: true,
                showSelectAll: true
              }}
              bulkActions={renderBulkActions}
              ariaLabel="Entidades"
              testId="entities-table"
            />
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isAnyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FormLayout
              title={isEditModalOpen ? 'Editar Entidade' : 'Nova Entidade'}
              description={isEditModalOpen
                ? 'Edite as informações da entidade abaixo.'
                : 'Preencha as informações para criar uma nova entidade.'
              }
              onSubmit={() => {
                const form = document.querySelector('form') as HTMLFormElement;
                if (form) {
                  const formData = new FormData(form);
                  const data: EntityFormData = {
                    name: formData.get('name') as string,
                    status: formData.get('status') as 'Active' | 'Inactive'
                  };
                  if (isEditModalOpen) {
                    handleUpdate(data);
                  } else {
                    handleCreate(data);
                  }
                }
              }}
              onCancel={closeAllModals}
              submitText={isEditModalOpen ? 'Salvar Alterações' : 'Criar Entidade'}
              submitLoading={createMutation.isPending || updateMutation.isPending}
              className="p-6"
            >
              <div className="space-y-4">
                {/* Name Field */}
                <FormLayout.Field
                  name="name"
                  label="Nome *"
                  required
                >
                  <Input
                    name="name"
                    defaultValue={selectedEntity?.name || ''}
                    placeholder="Ex: Minha Entidade"
                    required
                  />
                </FormLayout.Field>

                {/* Status Field */}
                <FormLayout.Field
                  name="status"
                  label="Status *"
                  required
                >
                  <select
                    name="status"
                    defaultValue={selectedEntity?.status || 'Active'}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    required
                  >
                    <option value="Active">Ativo</option>
                    <option value="Inactive">Inativo</option>
                  </select>
                </FormLayout.Field>
              </div>
            </FormLayout>
          </div>
        </div>
      )}

      {/* Confirm Action Dialog */}
      <ConfirmActionDialog
        isOpen={!!selectedEntity && actionMode !== 'delete'}
        onClose={() => setSelectedEntity(null)}
        onConfirm={async () => {
          if (actionMode === 'delete') {
            await handleDelete();
          } else if (actionMode === 'deactivate' || actionMode === 'activate') {
            await handleToggleStatus(selectedEntity!);
          }
        }}
        title={
          actionMode === 'delete' ? 'Excluir Entidade' :
            actionMode === 'deactivate' ? 'Desativar Entidade' :
              'Ativar Entidade'
        }
        description={
          actionMode === 'delete'
            ? `Tem certeza que deseja excluir permanentemente "${selectedEntity?.name}"?`
            : `Tem certeza que deseja ${actionMode === 'deactivate' ? 'desativar' : 'ativar'} "${selectedEntity?.name}"?`
        }
        warning={
          actionMode === 'delete'
            ? 'Esta ação não pode ser desfeita.'
            : `A entidade ${actionMode === 'deactivate' ? 'permanecerá no sistema mas não poderá ser utilizada' : 'estará disponível para uso novamente'}.`
        }
        severity={
          actionMode === 'delete' ? 'critical' :
            actionMode === 'deactivate' ? 'medium' : 'low'
        }
        confirmText={
          actionMode === 'delete' ? 'Excluir Permanentemente' :
            actionMode === 'deactivate' ? 'Apenas Desativar' :
              'Ativar Entidade'
        }
        loading={deleteMutation.isPending || updateStatusMutation.isPending}
        item={selectedEntity ? {
          name: selectedEntity.name,
          description: `${selectedEntity.status}`,
          avatar: (
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border border-slate-100 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200">
              {selectedEntity.name.substring(0, 2).toUpperCase()}
            </div>
          )
        } : undefined}
      />
    </div>
  );
};

export default EntityListPage;
```

## Key Sections Explained

### 1. Imports (Order Matters)
```typescript
// 1. React and hooks
import React, { useState, useCallback } from 'react';

// 2. Shared components
import { DataTable, PageHeader, FormLayout, ConfirmActionDialog, FeedbackState } from '../src/components/shared';

// 3. Domain hooks
import { useEntityList, useCreateEntity, useUpdateEntity, useDeleteEntity } from '../src/hooks/domain/entities';

// 4. Types
import { EntityFilters, EntityFormData } from '../src/types/domain/domain.types';

// 5. Utilities
import { showSuccess, showWarning, showInfo } from '../src/utils/errorHandler';
```

### 2. State Management
Organize state by responsibility:
- Modal states (create, edit, action)
- Selection state (selected IDs)
- Filter and search states
- Toast state

### 3. Query Hooks
Use domain hooks for all data operations:
- `useEntityList()` for fetching data
- `useCreateEntity()` for creating
- `useUpdateEntity()` for updating
- `useDeleteEntity()` for deleting

### 4. Data Extraction
Always extract data with optional chaining:
```typescript
const entities = entitiesData?.data || [];
```

### 5. Event Handlers
All handlers MUST use `useCallback`:
- CRUD operations
- Modal open/close
- Filter and search
- Selection changes

### 6. State Handling (MANDATORY)
Every page MUST handle all three states:

```typescript
{isLoading ? (
  <FeedbackState type="loading" variant="full" size="lg" />
) : error ? (
  <FeedbackState 
    type="error" 
    onRetry={refetch} 
    variant="full" 
    size="lg" 
  />
) : entities.length === 0 ? (
  <FeedbackState 
    type="empty" 
    action={{...}} 
    variant="full" 
    size="lg" 
  />
) : (
  <DataTable data={entities} ... />
)}
```

## Adaptation Checklist

When adapting this template:

- [ ] Replace "Entity" with your entity name
- [ ] Update imports to use correct domain hooks
- [ ] Define appropriate Entity type
- [ ] Configure DataTable columns for your data
- [ ] Configure DataTable actions for your use case
- [ ] Update FormLayout fields for your form
- [ ] Customize metrics in PageHeader
- [ ] Update all user-facing text
- [ ] Test all three states (loading, error, empty)
- [ ] Verify no blank screens or null returns
