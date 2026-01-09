# Domain Hooks Refactoring Plan

## Overview

This document provides a detailed refactoring plan for each domain hook to achieve proper separation of concerns and architectural consistency.

## Refactoring Strategy

### General Principles

1. **Remove Service Instantiation**: All hooks will use `serviceRegistry` instead of creating their own service instances
2. **Move Business Logic to Services**: All business operations will be delegated to services
3. **Hook Responsibilities**: Hooks will only handle cache orchestration, UI concerns, and query management
4. **Consistent Patterns**: All hooks will follow the same refactoring patterns

## Entity-Specific Refactoring Plans

### 1. Empresas Hook Refactoring

**Current Issues**:
- Service instantiation in hook ([`src/hooks/domain/empresas.ts:30-40`](src/hooks/domain/empresas.ts:30-40))
- Business logic in bulk operations ([`src/hooks/domain/empresas.ts:153-189`](src/hooks/domain/empresas.ts:153-189))
- Mock stats implementation in hook ([`src/hooks/domain/empresas.ts:137-148`](src/hooks/domain/empresas.ts:137-148))

**Refactoring Steps**:

1. **Replace Service Instantiation**:
   ```typescript
   // BEFORE
   class EmpresasService extends BaseService<Empresa, EmpresaFormData> {
       constructor() {
           super({} as any, 'empresas');
       }
   }
   const empresasService = new EmpresasService();
   
   // AFTER
   import { serviceRegistry } from '../../services';
   const empresasService = serviceRegistry.getEmpresasService();
   ```

2. **Move Bulk Operations to Service**:
   - Add `bulkActivate(ids: string[])` method to `EmpresasServiceImpl`
   - Add `bulkDeactivate(ids: string[])` method to `EmpresasServiceImpl`
   - Add `bulkDelete(ids: string[])` method to `EmpresasServiceImpl`

3. **Refactor Hook Methods**:
   - `useBulkEmpresasOperation()` → delegate to service methods
   - `useEmpresasWithStats()` → delegate to `getWithStats()` service method
   - `useEmpresaStats()` → delegate to service method

**Required Service Additions**:
```typescript
// Add to EmpresasServiceImpl
async bulkActivate(ids: string[]): Promise<ApiResponse<Empresa[]>> {
    return this.bulkUpdateStatus(ids, 'Ativa');
}

async bulkDeactivate(ids: string[]): Promise<ApiResponse<Empresa[]>> {
    return this.bulkUpdateStatus(ids, 'Inativa');
}

async getStats(empresaId?: string): Promise<ApiResponse<any>> {
    // Implement actual stats calculation
}
```

### 2. Usuarios Hook Refactoring

**Current Issues**:
- Service instantiation in hook ([`src/hooks/domain/usuarios.ts:30-39`](src/hooks/domain/usuarios.ts:30-39))
- Business logic in bulk operations ([`src/hooks/domain/usuarios.ts:169-205`](src/hooks/domain/usuarios.ts:169-205))
- Role change logic in hook ([`src/hooks/domain/usuarios.ts:250-267`](src/hooks/domain/usuarios.ts:250-267))
- Mock stats implementation ([`src/hooks/domain/usuarios.ts:137-146`](src/hooks/domain/usuarios.ts:137-146))

**Refactoring Steps**:

1. **Replace Service Instantiation**:
   ```typescript
   // BEFORE
   class UsuariosService extends BaseService<Usuario, UsuarioFormData> {
       constructor() {
           super({} as any, 'usuarios');
       }
   }
   const usuariosService = new UsuariosService();
   
   // AFTER
   import { serviceRegistry } from '../../services';
   const usuariosService = serviceRegistry.getUsuariosService();
   ```

2. **Move Business Logic to Service**:
   - Add `bulkActivate(ids: string[])` method
   - Add `bulkDeactivate(ids: string[])` method
   - Add `bulkChangeRole(ids: string[], role: string)` method
   - Add `getStats(usuarioId?: string)` method

3. **Refactor Hook Methods**:
   - `useBulkUsuariosOperation()` → delegate to service methods
   - `useUpdateUsuarioStatus()` → delegate to `updateStatus()` service method
   - `useChangeUsuarioRole()` → delegate to `changeRole()` service method
   - `useUsuariosWithStats()` → delegate to `getWithStats()` service method

**Required Service Additions**:
```typescript
// Add to UsuariosServiceImpl
async bulkActivate(ids: string[]): Promise<ApiResponse<Usuario[]>> {
    return this.bulkUpdateStatus(ids, 'Active');
}

async bulkDeactivate(ids: string[]): Promise<ApiResponse<Usuario[]>> {
    return this.bulkUpdateStatus(ids, 'Inactive');
}

async getStats(usuarioId?: string): Promise<ApiResponse<any>> {
    // Implement actual stats calculation
}
```

### 3. Compras Hook Refactoring

**Current Issues**:
- Service instantiation in hook ([`src/hooks/domain/compras.ts:30-39`](src/hooks/domain/compras.ts:30-39))
- Business logic in bulk operations ([`src/hooks/domain/compras.ts:190-225`](src/hooks/domain/compras.ts:190-225))
- Status update logic in hook ([`src/hooks/domain/compras.ts:230-248`](src/hooks/domain/compras.ts:230-248))
- Mock implementations in hooks ([`src/hooks/domain/compras.ts:134-144`](src/hooks/domain/compras.ts:134-144))

**Refactoring Steps**:

1. **Replace Service Instantiation**:
   ```typescript
   // BEFORE
   class ComprasService extends BaseService<Compra, CompraFormData> {
       constructor() {
           super({} as any, 'compras');
       }
   }
   const comprasService = new ComprasService();
   
   // AFTER
   import { serviceRegistry } from '../../services';
   const comprasService = serviceRegistry.getComprasService();
   ```

2. **Move Business Logic to Service**:
   - Add `bulkApprove(ids: string[])` method
   - Add `bulkCancel(ids: string[])` method
   - Add `getStats(filters?: CompraFilters)` method
   - Add `getMonthlySummary(year: number, month: number)` method

3. **Refactor Hook Methods**:
   - `useBulkComprasOperation()` → delegate to service methods
   - `useUpdateCompraStatus()` → delegate to `updateStatus()` service method
   - `useComprasWithUI()` → delegate to `getWithUI()` service method

**Required Service Additions**:
```typescript
// Add to ComprasServiceImpl
async bulkApprove(ids: string[]): Promise<ApiResponse<Compra[]>> {
    return this.bulkUpdateStatus(ids, 'Pago');
}

async bulkCancel(ids: string[]): Promise<ApiResponse<Compra[]>> {
    return this.bulkUpdateStatus(ids, 'Cancelado');
}

async getStats(filters?: CompraFilters): Promise<ApiResponse<any>> {
    // Implement actual stats calculation
}
```

### 4. Faltas Hook Refactoring

**Current State**: Hook is empty ([`src/hooks/domain/faltas.ts`](src/hooks/domain/faltas.ts))

**Implementation Steps**:

1. **Create Hook Using ServiceRegistry**:
   ```typescript
   import { serviceRegistry } from '../../services';
   const faltasService = serviceRegistry.getFaltasService();
   ```

2. **Implement Standard Hook Methods**:
   - `useFaltasList(options?)` → delegate to `getAll()`
   - `useFaltaDetail(id)` → delegate to `getById()`
   - `useFaltasSearch(query)` → delegate to `search()`
   - `useCreateFalta()` → delegate to `create()`
   - `useUpdateFalta()` → delegate to `update()`
   - `useDeleteFalta()` → delegate to `delete()`

3. **Implement Business Logic Hooks**:
   - `useFaltasWithUI()` → delegate to `getWithUI()`
   - `useBulkFaltasOperation()` → delegate to bulk service methods
   - `useUpdateFaltaStatus()` → delegate to `updateStatus()`

### 5. Reference Data Hooks (Indices, Tipos, Tratamientos)

**Current Issues**:
- Service instantiation in all reference data hooks
- Missing integration with actual service implementations

**Refactoring Steps**:

1. **Replace Service Instantiation**:
   ```typescript
   // BEFORE (in all three hooks)
   class EntityService extends BaseService<Entity, { nome: string }> {
       constructor() {
           super({} as any, 'endpoint');
       }
   }
   const entityService = new EntityService();
   
   // AFTER
   import { serviceRegistry } from '../../services';
   const entityService = serviceRegistry.getEntityService();
   ```

2. **Use Actual Service Methods**:
   - `useAllIndices()` → delegate to `getAllForReference()`
   - `useAllTipos()` → delegate to `getAllForReference()`
   - `useAllTratamientos()` → delegate to `getAllForReference()`

3. **Add Search Functionality**:
   - `useIndicesSearch()` → delegate to `searchByName()`
   - `useTiposSearch()` → delegate to `searchByName()`
   - `useTratamientosSearch()` → delegate to `searchByName()`

## Standard Hook Template

After refactoring, all domain hooks should follow this template:

```typescript
/**
 * Domain-specific hooks for {entity} entity
 * Wraps generic query/mutation hooks with {entity}-specific logic
 */

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { serviceRegistry } from '../../services';
import {
    useGenericListQuery,
    useGenericDetailQuery,
    useGenericSearchQuery
} from '../queries/useGenericQuery';
import {
    useGenericCreateMutation,
    useGenericUpdateMutation,
    useGenericDeleteMutation,
    useGenericCustomMutation
} from '../queries/useGenericMutation';
import { queryKeys } from '../queries/queryKeysFactory';
import { queryInvalidation } from '../queries/queryInvalidation';
import { cachePolicyUtils } from '../queries/cachePolicies';
import { Entity, EntityFormData } from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';

// Get service from registry
const entityService = serviceRegistry.getEntityService();

/**
 * Hook for fetching a list of entities with optional filtering
 */
export function useEntityList(options?: QueryOptions) {
    return useGenericListQuery<Entity>(
        'entity',
        entityService,
        options
    );
}

/**
 * Hook for fetching a single entity by ID
 */
export function useEntityDetail(id: string) {
    return useGenericDetailQuery<Entity>(
        'entity',
        id,
        entityService
    );
}

/**
 * Hook for searching entities by various fields
 */
export function useEntitySearch(searchQuery: string) {
    return useGenericSearchQuery<Entity>(
        'entity',
        searchQuery,
        entityService
    );
}

/**
 * Hook for creating a new entity
 */
export function useCreateEntity() {
    const queryClient = useQueryClient();

    return useGenericCreateMutation<Entity, EntityFormData>(
        'entity',
        entityService,
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'entity');
            },
        }
    );
}

/**
 * Hook for updating an existing entity
 */
export function useUpdateEntity() {
    const queryClient = useQueryClient();

    return useGenericUpdateMutation<Entity, Partial<EntityFormData>>(
        'entity',
        entityService,
        {
            onSuccess: (data, variables) => {
                queryInvalidation.invalidateEntity(queryClient, 'entity');
                queryInvalidation.invalidateEntityDetail(queryClient, 'entity', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting an entity
 */
export function useDeleteEntity() {
    const queryClient = useQueryClient();

    return useGenericDeleteMutation<Entity>(
        'entity',
        entityService,
        {
            onSuccess: (data, variables) => {
                queryInvalidation.invalidateEntity(queryClient, 'entity');
                queryInvalidation.invalidateRelatedEntities(queryClient, 'entity', ['relatedEntities']);
            },
        }
    );
}

/**
 * Hook for bulk operations on entities
 */
export function useBulkEntityOperation() {
    const queryClient = useQueryClient();

    return useGenericCustomMutation<Entity[], { ids: string[]; operation: string }>(
        'entity',
        async ({ ids, operation }) => {
            // Delegate to service bulk operations
            switch (operation) {
                case 'activate':
                    return entityService.bulkActivate(ids);
                case 'deactivate':
                    return entityService.bulkDeactivate(ids);
                case 'delete':
                    return entityService.bulkDelete(ids);
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        },
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'entity');
            },
        }
    );
}

/**
 * Prefetch functions for better UX
 */
export function prefetchEntityList(queryClient: QueryClient, options?: QueryOptions) {
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'entity',
        () => entityService.getAll(options)
    );
}

export function prefetchEntityDetail(queryClient: QueryClient, id: string) {
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'entity',
        id,
        () => entityService.getById(id)
    );
}
```

## Implementation Order

1. **Phase 1**: Fix service instantiation in all hooks
2. **Phase 2**: Move bulk operations to services
3. **Phase 3**: Implement missing Faltas hook
4. **Phase 4**: Refactor reference data hooks
5. **Phase 5**: Add missing service methods
6. **Phase 6**: Validate and test all changes

## Testing Strategy

1. **Unit Tests**: Test each hook in isolation
2. **Integration Tests**: Test hook-service integration
3. **E2E Tests**: Test complete user flows
4. **Regression Tests**: Ensure existing functionality works

## Success Criteria

1. ✅ No service instantiation in hooks
2. ✅ All business logic in services
3. ✅ Hooks only handle cache/UI concerns
4. ✅ Consistent patterns across all hooks
5. ✅ Proper error handling and loading states
6. ✅ TypeScript type safety maintained