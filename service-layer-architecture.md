# Service Layer Architecture Design

## Overview

This document outlines the design for a proper API service layer architecture to eliminate the anti-pattern of instantiating BaseService directly in domain hooks using placeholder `{} as any`.

## Current Problem

Domain hooks are currently instantiating BaseService with placeholders:

```typescript
// Current anti-pattern in domain hooks
class EmpresasService extends BaseService<Empresa, EmpresaFormData> {
    constructor() {
        super({} as any, 'empresas'); // ❌ Anti-pattern
    }
}
```

## Proposed Solution

Implement a centralized service factory and registry pattern with proper dependency injection.

## Architecture Components

### 1. ServiceFactory

**File:** `src/services/core/ServiceFactory.ts`

```typescript
/**
 * ServiceFactory - Centralized factory for creating and managing service instances
 * Implements dependency injection pattern to eliminate direct instantiation in hooks
 */

import { getApiClient } from '../../lib/apiClient';
import { ApiClient } from '../../lib/apiClient';
import { BaseService } from '../api/baseService';

export interface ServiceConfig {
    name: string;
    endpoint: string;
}

/**
 * ServiceFactory class responsible for creating and managing service instances
 * Uses singleton pattern for ApiClient and factory
 */
export class ServiceFactory {
    private static instance: ServiceFactory | null = null;
    private apiClient: ApiClient;
    private services: Map<string, BaseService<any>> = new Map();

    private constructor(apiClientConfig?: any) {
        // Initialize ApiClient singleton
        this.apiClient = getApiClient(apiClientConfig);
    }

    /**
     * Get or create ServiceFactory singleton instance
     */
    public static getInstance(apiClientConfig?: any): ServiceFactory {
        if (!ServiceFactory.instance) {
            ServiceFactory.instance = new ServiceFactory(apiClientConfig);
        }
        return ServiceFactory.instance;
    }

    /**
     * Get or create a service instance
     * @param ServiceClass - Service class constructor
     * @param config - Service configuration
     */
    public getService<T extends BaseService<any>>(
        ServiceClass: new (apiClient: ApiClient, endpoint: string) => T,
        config: ServiceConfig
    ): T {
        const serviceKey = `${config.name}_${config.endpoint}`;
        
        // Return existing service if already created
        if (this.services.has(serviceKey)) {
            return this.services.get(serviceKey) as T;
        }

        // Create new service instance
        const serviceInstance = new ServiceClass(this.apiClient, config.endpoint);
        this.services.set(serviceKey, serviceInstance);
        
        return serviceInstance;
    }

    /**
     * Get ApiClient instance
     */
    public getApiClient(): ApiClient {
        return this.apiClient;
    }

    /**
     * Clear all service instances (useful for testing)
     */
    public clearServices(): void {
        this.services.clear();
    }

    /**
     * Reset ServiceFactory singleton (useful for testing)
     */
    public static resetInstance(): void {
        ServiceFactory.instance = null;
    }
}

/**
 * Default service factory instance
 */
export const serviceFactory = ServiceFactory.getInstance();
```

### 2. ServiceRegistry

**File:** `src/services/core/ServiceRegistry.ts`

```typescript
/**
 * ServiceRegistry - Centralized registry for all application services
 * Provides typed access to service instances
 */

import { BaseService } from '../api/baseService';
import { serviceFactory } from './ServiceFactory';
import { 
    Empresa, 
    Usuario, 
    Falta, 
    Compra, 
    Indice, 
    Tipo, 
    Tratamento 
} from '../../types/domain/domain.types';
import { 
    EmpresaFormData, 
    UsuarioFormData, 
    FaltaFormData, 
    CompraFormData 
} from '../../types/domain/domain.types';

// Import service implementations
import { EmpresasServiceImpl } from '../empresas/EmpresasService';
import { UsuariosServiceImpl } from '../usuarios/UsuariosService';
import { FaltasServiceImpl } from '../faltas/FaltasService';
import { ComprasServiceImpl } from '../compras/ComprasService';
import { IndicesServiceImpl } from '../indices/IndicesService';
import { TiposServiceImpl } from '../tipos/TiposService';
import { TratamientosServiceImpl } from '../tratamientos/TratamientosService';

/**
 * ServiceRegistry class provides centralized access to all services
 */
export class ServiceRegistry {
    private static instance: ServiceRegistry | null = null;
    
    // Service instances
    private empresasService: EmpresasServiceImpl;
    private usuariosService: UsuariosServiceImpl;
    private faltasService: FaltasServiceImpl;
    private comprasService: ComprasServiceImpl;
    private indicesService: IndicesServiceImpl;
    private tiposService: TiposServiceImpl;
    private tratamientosService: TratamientosServiceImpl;

    private constructor() {
        this.initializeServices();
    }

    /**
     * Get or create ServiceRegistry singleton instance
     */
    public static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    /**
     * Initialize all services using the service factory
     */
    private initializeServices(): void {
        this.empresasService = serviceFactory.getService(
            EmpresasServiceImpl,
            { name: 'empresas', endpoint: 'empresas' }
        );

        this.usuariosService = serviceFactory.getService(
            UsuariosServiceImpl,
            { name: 'usuarios', endpoint: 'usuarios' }
        );

        this.faltasService = serviceFactory.getService(
            FaltasServiceImpl,
            { name: 'faltas', endpoint: 'faltas' }
        );

        this.comprasService = serviceFactory.getService(
            ComprasServiceImpl,
            { name: 'compras', endpoint: 'compras' }
        );

        this.indicesService = serviceFactory.getService(
            IndicesServiceImpl,
            { name: 'indices', endpoint: 'indices' }
        );

        this.tiposService = serviceFactory.getService(
            TiposServiceImpl,
            { name: 'tipos', endpoint: 'tipos' }
        );

        this.tratamientosService = serviceFactory.getService(
            TratamientosServiceImpl,
            { name: 'tratamientos', endpoint: 'tratamientos' }
        );
    }

    // Service getters
    public getEmpresasService(): EmpresasServiceImpl {
        return this.empresasService;
    }

    public getUsuariosService(): UsuariosServiceImpl {
        return this.usuariosService;
    }

    public getFaltasService(): FaltasServiceImpl {
        return this.faltasService;
    }

    public getComprasService(): ComprasServiceImpl {
        return this.comprasService;
    }

    public getIndicesService(): IndicesServiceImpl {
        return this.indicesService;
    }

    public getTiposService(): TiposServiceImpl {
        return this.tiposService;
    }

    public getTratamientosService(): TratamientosServiceImpl {
        return this.tratamientosService;
    }

    /**
     * Reset ServiceRegistry singleton (useful for testing)
     */
    public static resetInstance(): void {
        ServiceRegistry.instance = null;
    }
}

/**
 * Default service registry instance
 */
export const serviceRegistry = ServiceRegistry.getInstance();
```

### 3. Concrete Service Implementation Example

**File:** `src/services/faltas/FaltasService.ts`

```typescript
/**
 * FaltasService - Concrete service implementation for faltas entity
 * Extends BaseService with faltas-specific operations
 */

import { BaseService } from '../api/baseService';
import { ApiClient } from '../../lib/apiClient';
import { 
    Falta, 
    FaltaFormData, 
    FaltaWithUI,
    FaltaFilters 
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';

export class FaltasServiceImpl extends BaseService<Falta, FaltaFormData> {
    constructor(apiClient: ApiClient, endpoint: string) {
        super(apiClient, endpoint);
    }

    /**
     * Get faltas with related data (UI extension)
     */
    async getWithUI(options?: QueryOptions): Promise<ApiResponse<FaltaWithUI[]>> {
        // This would call a specialized endpoint or transform the response
        const response = await this.getAll(options);
        
        // Transform data to include UI extensions
        const transformedData = response.data?.items.map(falta => ({
            ...falta,
            // Add UI-specific properties
            isSelected: false,
            isEditing: false,
            isValid: true,
            // Computed properties
            status: this.computeStatus(falta),
            prioridade: this.computePrioridade(falta)
        })) || [];

        return {
            ...response,
            data: {
                ...response.data,
                items: transformedData
            }
        };
    }

    /**
     * Get faltas by empresa
     */
    async getByEmpresa(empresaId: string, options?: QueryOptions): Promise<ApiResponse<Falta[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                empresa_id: empresaId
            }
        });
    }

    /**
     * Get faltas by usuario
     */
    async getByUsuario(usuarioId: string, options?: QueryOptions): Promise<ApiResponse<Falta[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                usuario_id: usuarioId
            }
        });
    }

    /**
     * Update falta status
     */
    async updateStatus(id: string, status: string): Promise<ApiResponse<Falta>> {
        return this.patch(id, { status });
    }

    /**
     * Bulk update faltas status
     */
    async bulkUpdateStatus(ids: string[], status: string): Promise<ApiResponse<Falta[]>> {
        const promises = ids.map(id => this.updateStatus(id, status));
        const responses = await Promise.all(promises);
        
        return {
            success: true,
            data: responses.map(response => response.data!).filter(Boolean)
        };
    }

    /**
     * Compute status based on falta properties
     */
    private computeStatus(falta: Falta): 'Pendente' | 'Em Andamento' | 'Resolvida' | 'Cancelada' {
        // Implementation based on business logic
        return 'Pendente'; // Placeholder
    }

    /**
     * Compute prioridade based on falta properties
     */
    private computePrioridade(falta: Falta): 'Baixa' | 'Média' | 'Alta' {
        // Implementation based on business logic
        return 'Média'; // Placeholder
    }
}
```

### 4. Updated Domain Hook

**File:** `src/hooks/domain/faltas.ts`

```typescript
/**
 * Domain-specific hooks for faltas (shortages) entity
 * Wraps generic query/mutation hooks with falta-specific logic
 */

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
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
import {
    Falta,
    FaltaFormData,
    FaltaFilters,
    FaltaWithUI
} from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';
import { serviceRegistry } from '../../services/core/ServiceRegistry';

// Get service instance from registry (✅ Proper pattern)
const faltasService = serviceRegistry.getFaltasService();

/**
 * Hook for fetching a list of faltas with optional filtering
 */
export function useFaltasList(
    options?: QueryOptions
) {
    return useGenericListQuery<Falta>(
        'faltas',
        faltasService,
        options
    );
}

/**
 * Hook for fetching a single falta by ID
 */
export function useFaltaDetail(id: string) {
    return useGenericDetailQuery<Falta>(
        'faltas',
        id,
        faltasService
    );
}

/**
 * Hook for searching faltas by various fields
 */
export function useFaltasSearch(searchQuery: string) {
    return useGenericSearchQuery<Falta>(
        'faltas',
        searchQuery,
        faltasService
    );
}

/**
 * Hook for fetching faltas with UI extensions
 */
export function useFaltasWithUI(options?: QueryOptions) {
    return useQuery({
        queryKey: queryKeys.faltas.list({ ...options?.filters, includeUI: true }),
        queryFn: async () => {
            const response = await faltasService.getWithUI(options);
            return response.data;
        },
        ...cachePolicyUtils.createQueryOptions('faltas'),
    });
}

/**
 * Hook for creating a new falta
 */
export function useCreateFalta() {
    const queryClient = useQueryClient();

    return useGenericCreateMutation<Falta, FaltaFormData>(
        'faltas',
        faltasService,
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'faltas');
            },
        }
    );
}

/**
 * Hook for updating an existing falta
 */
export function useUpdateFalta() {
    const queryClient = useQueryClient();

    return useGenericUpdateMutation<Falta, Partial<FaltaFormData>>(
        'faltas',
        faltasService,
        {
            onSuccess: (data, variables) => {
                queryInvalidation.invalidateEntity(queryClient, 'faltas');
                queryInvalidation.invalidateEntityDetail(queryClient, 'faltas', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting a falta
 */
export function useDeleteFalta() {
    const queryClient = useQueryClient();

    return useGenericDeleteMutation<Falta>(
        'faltas',
        faltasService,
        {
            onSuccess: (data, variables) => {
                queryInvalidation.invalidateEntity(queryClient, 'faltas');
            },
        }
    );
}

/**
 * Hook for updating falta status
 */
export function useUpdateFaltaStatus() {
    const queryClient = useQueryClient();

    return useGenericCustomMutation<Falta, { id: string; status: string }>(
        'faltas',
        async ({ id, status }) => {
            const response = await faltasService.updateStatus(id, status);
            return response.data!;
        },
        {
            onSuccess: (data, variables) => {
                queryInvalidation.invalidateEntity(queryClient, 'faltas');
                queryInvalidation.invalidateEntityDetail(queryClient, 'faltas', variables.id);
            },
        }
    );
}

/**
 * Hook for bulk operations on faltas
 */
export function useBulkFaltasOperation() {
    const queryClient = useQueryClient();

    return useGenericCustomMutation<Falta[], { ids: string[]; operation: 'resolve' | 'cancel' | 'delete' }>(
        'faltas',
        async ({ ids, operation }) => {
            switch (operation) {
                case 'resolve':
                    return (await faltasService.bulkUpdateStatus(ids, 'Resolvida')).data!;
                case 'cancel':
                    return (await faltasService.bulkUpdateStatus(ids, 'Cancelada')).data!;
                case 'delete':
                    const promises = ids.map(id => faltasService.delete(id));
                    await Promise.all(promises);
                    return [];
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        },
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'faltas');
            },
        }
    );
}

/**
 * Prefetch faltas list for better UX
 */
export function prefetchFaltasList(queryClient: QueryClient, options?: QueryOptions) {
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'faltas',
        () => faltasService.getAll(options)
    );
}

/**
 * Prefetch falta detail for better UX
 */
export function prefetchFaltaDetail(queryClient: QueryClient, id: string) {
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'faltas',
        id,
        () => faltasService.getById(id)
    );
}
```

## Folder Structure

```
src/
├── services/
│   ├── core/
│   │   ├── ServiceFactory.ts      # Service factory with dependency injection
│   │   └── ServiceRegistry.ts     # Centralized service registry
│   ├── api/
│   │   ├── BaseService.ts         # Base service class (existing)
│   │   └── index.ts              # API service exports
│   ├── empresas/
│   │   └── EmpresasService.ts    # Empresa service implementation
│   ├── usuarios/
│   │   └── UsuariosService.ts    # Usuario service implementation
│   ├── faltas/
│   │   └── FaltasService.ts     # Falta service implementation
│   ├── compras/
│   │   └── ComprasService.ts    # Compra service implementation
│   ├── indices/
│   │   └── IndicesService.ts     # Indice service implementation
│   ├── tipos/
│   │   └── TiposService.ts      # Tipo service implementation
│   ├── tratamientos/
│   │   └── TratamientosService.ts # Tratamiento service implementation
│   └── index.ts                  # Service exports
├── hooks/
│   └── domain/
│       ├── faltas.ts             # Refactored domain hook
│       ├── empresas.ts           # Refactored domain hook
│       ├── usuarios.ts           # Refactored domain hook
│       └── ...                  # Other domain hooks
└── lib/
    └── apiClient.ts             # ApiClient singleton (existing)
```

## Migration Guidelines

### Step 1: Create Service Factory and Registry

1. Create `src/services/core/ServiceFactory.ts`
2. Create `src/services/core/ServiceRegistry.ts`
3. Update `src/services/index.ts` to export new core services

### Step 2: Create Concrete Service Implementations

1. Create service implementation files for each entity
2. Extend BaseService with entity-specific methods
3. Remove placeholder constructors from domain hooks

### Step 3: Refactor Domain Hooks

For each domain hook file:

**Before (❌ Anti-pattern):**
```typescript
class EmpresasService extends BaseService<Empresa, EmpresaFormData> {
    constructor() {
        super({} as any, 'empresas'); // ❌ Anti-pattern
    }
}
const empresasService = new EmpresasService();
```

**After (✅ Proper pattern):**
```typescript
import { serviceRegistry } from '../../services/core/ServiceRegistry';

const empresasService = serviceRegistry.getEmpresasService();
```

### Step 4: Update Service Exports

Update `src/services/index.ts`:
```typescript
// Core services
export { ServiceFactory, serviceFactory } from './core/ServiceFactory';
export { ServiceRegistry, serviceRegistry } from './core/ServiceRegistry';

// API services
export { BaseService } from './api/baseService';

// Entity services
export { EmpresasServiceImpl } from './empresas/EmpresasService';
export { UsuariosServiceImpl } from './usuarios/UsuariosService';
export { FaltasServiceImpl } from './faltas/FaltasService';
export { ComprasServiceImpl } from './compras/ComprasService';
export { IndicesServiceImpl } from './indices/IndicesService';
export { TiposServiceImpl } from './tipos/TiposService';
export { TratamientosServiceImpl } from './tratamientos/TratamientosService';
```

## Benefits of This Architecture

1. **Eliminates Anti-Patterns**: No more `{} as any` placeholders
2. **Centralized Configuration**: Single point for API client configuration
3. **Dependency Injection**: Proper DI pattern with service factory
4. **Singleton Management**: Ensures single instances of services
5. **Type Safety**: Proper TypeScript typing throughout
6. **Testability**: Easy to mock and test services
7. **Maintainability**: Clear separation of concerns
8. **Scalability**: Easy to add new services and features

## Implementation Order

1. ✅ Design service factory/registry architecture
2. ⏳ Create centralized ApiClient singleton initialization
3. ⏳ Implement service factory with proper dependency injection
4. ⏳ Create concrete service implementations for each entity
5. ⏳ Implement faltasService as example implementation
6. ⏳ Create service registry to manage all services
7. ⏳ Refactor domain hooks to use service registry
8. ⏳ Create migration guidelines for existing domain hooks
9. ⏳ Update exports and index files
10. ⏳ Document the new architecture

## Testing Strategy

1. **Unit Tests**: Test each service implementation independently
2. **Integration Tests**: Test service factory and registry
3. **Mock Services**: Create mock implementations for testing
4. **Hook Testing**: Test refactored domain hooks with mocked services

## Conclusion

This architecture eliminates the anti-pattern of direct service instantiation in domain hooks while maintaining compatibility with existing generic query/mutation hooks. It provides a clean, scalable, and maintainable service layer that follows best practices for dependency injection and singleton management.