# Service Layer Implementation Guide

## Step-by-Step Implementation

This guide provides detailed implementation steps and code examples for each component of the new service layer architecture.

## Step 1: Create ServiceFactory

### File: `src/services/core/ServiceFactory.ts`

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

## Step 2: Create Concrete Service Implementations

### 2.1 EmpresasService

### File: `src/services/empresas/EmpresasService.ts`

```typescript
/**
 * EmpresasService - Concrete service implementation for empresas entity
 * Extends BaseService with empresas-specific operations
 */

import { BaseService } from '../api/baseService';
import { ApiClient } from '../../lib/apiClient';
import { 
    Empresa, 
    EmpresaFormData, 
    EmpresaWithStats,
    EmpresaFilters 
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';

export class EmpresasServiceImpl extends BaseService<Empresa, EmpresaFormData> {
    constructor(apiClient: ApiClient, endpoint: string) {
        super(apiClient, endpoint);
    }

    /**
     * Get empresas with statistics
     */
    async getWithStats(options?: QueryOptions): Promise<ApiResponse<EmpresaWithStats[]>> {
        // This would call a specialized endpoint or transform the response
        const response = await this.getAll(options);
        
        // Transform data to include statistics
        const transformedData = response.data?.items.map(empresa => ({
            ...empresa,
            // Add statistics (placeholder implementation)
            totalUsuarios: 0,
            totalFaltas: 0,
            ultimaAtividade: new Date().toISOString(),
            // UI state
            isSelected: false,
            isExpanded: false
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
     * Get empresas by status
     */
    async getByStatus(status: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                status
            }
        });
    }

    /**
     * Update empresa status
     */
    async updateStatus(id: string, status: 'Ativa' | 'Inativa'): Promise<ApiResponse<Empresa>> {
        return this.patch(id, { status });
    }

    /**
     * Bulk update empresas status
     */
    async bulkUpdateStatus(ids: string[], status: 'Ativa' | 'Inativa'): Promise<ApiResponse<Empresa[]>> {
        const promises = ids.map(id => this.updateStatus(id, status));
        const responses = await Promise.all(promises);
        
        return {
            success: true,
            data: responses.map(response => response.data!).filter(Boolean)
        };
    }
}
```

### 2.2 UsuariosService

### File: `src/services/usuarios/UsuariosService.ts`

```typescript
/**
 * UsuariosService - Concrete service implementation for usuarios entity
 * Extends BaseService with usuarios-specific operations
 */

import { BaseService } from '../api/baseService';
import { ApiClient } from '../../lib/apiClient';
import { 
    Usuario, 
    UsuarioFormData, 
    UsuarioWithStats,
    UsuarioFilters 
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';

export class UsuariosServiceImpl extends BaseService<Usuario, UsuarioFormData> {
    constructor(apiClient: ApiClient, endpoint: string) {
        super(apiClient, endpoint);
    }

    /**
     * Get usuarios with statistics
     */
    async getWithStats(options?: QueryOptions): Promise<ApiResponse<UsuarioWithStats[]>> {
        const response = await this.getAll(options);
        
        const transformedData = response.data?.items.map(usuario => ({
            ...usuario,
            // Add statistics (placeholder implementation)
            totalFaltas: 0,
            ultimaAtividade: new Date().toISOString(),
            // UI state
            isSelected: false,
            isOnline: false,
            // Permissions (computed from role)
            permissions: this.computePermissions(usuario.role)
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
     * Get usuarios by empresa
     */
    async getByEmpresa(empresaId: string, options?: QueryOptions): Promise<ApiResponse<Usuario[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                empresa_id: empresaId
            }
        });
    }

    /**
     * Get usuarios by role
     */
    async getByRole(role: string, options?: QueryOptions): Promise<ApiResponse<Usuario[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                role
            }
        });
    }

    /**
     * Update usuario status
     */
    async updateStatus(id: string, status: string): Promise<ApiResponse<Usuario>> {
        return this.patch(id, { status });
    }

    /**
     * Change usuario role
     */
    async changeRole(id: string, role: string): Promise<ApiResponse<Usuario>> {
        return this.patch(id, { role });
    }

    /**
     * Compute permissions based on role
     */
    private computePermissions(role: string): string[] {
        const rolePermissions: Record<string, string[]> = {
            'Administrador': [
                'empresas.read', 'empresas.write',
                'usuarios.read', 'usuarios.write',
                'faltas.read', 'faltas.write',
                'compras.read', 'compras.write',
                'dashboard.read', 'admin.system'
            ],
            'Usuário': [
                'empresas.read',
                'usuarios.read',
                'faltas.read', 'faltas.write',
                'compras.read', 'compras.write',
                'dashboard.read'
            ]
        };

        return rolePermissions[role] || [];
    }
}
```

### 2.3 ComprasService

### File: `src/services/compras/ComprasService.ts`

```typescript
/**
 * ComprasService - Concrete service implementation for compras entity
 * Extends BaseService with compras-specific operations
 */

import { BaseService } from '../api/baseService';
import { ApiClient } from '../../lib/apiClient';
import { 
    Compra, 
    CompraFormData, 
    CompraWithUI,
    CompraFilters 
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';

export class ComprasServiceImpl extends BaseService<Compra, CompraFormData> {
    constructor(apiClient: ApiClient, endpoint: string) {
        super(apiClient, endpoint);
    }

    /**
     * Get compras with UI extensions
     */
    async getWithUI(options?: QueryOptions): Promise<ApiResponse<CompraWithUI[]>> {
        const response = await this.getAll(options);
        
        const transformedData = response.data?.items.map(compra => ({
            ...compra,
            // UI state
            isSelected: false,
            isEditing: false,
            // Computed properties
            statusFormatted: this.formatStatus(compra.status),
            valorFormatted: this.formatCurrency(compra.valor_total),
            dataFormatted: this.formatDate(compra.data_compra)
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
     * Get compras by status
     */
    async getByStatus(status: string, options?: QueryOptions): Promise<ApiResponse<Compra[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                status
            }
        });
    }

    /**
     * Get compras by date range
     */
    async getByDateRange(startDate: string, endDate: string, options?: QueryOptions): Promise<ApiResponse<Compra[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                data_compra: {
                    from: startDate,
                    to: endDate
                }
            }
        });
    }

    /**
     * Update compra status
     */
    async updateStatus(id: string, status: string): Promise<ApiResponse<Compra>> {
        return this.patch(id, { status });
    }

    /**
     * Bulk update compras status
     */
    async bulkUpdateStatus(ids: string[], status: string): Promise<ApiResponse<Compra[]>> {
        const promises = ids.map(id => this.updateStatus(id, status));
        const responses = await Promise.all(promises);
        
        return {
            success: true,
            data: responses.map(response => response.data!).filter(Boolean)
        };
    }

    /**
     * Format status for display
     */
    private formatStatus(status: string): string {
        const statusMap: Record<string, string> = {
            'Pendente': 'Pendente de Pagamento',
            'Pago': 'Pago',
            'Cancelado': 'Cancelado'
        };

        return statusMap[status] || status;
    }

    /**
     * Format currency value
     */
    private formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Format date for display
     */
    private formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }
}
```

### 2.4 IndicesService

### File: `src/services/indices/IndicesService.ts`

```typescript
/**
 * IndicesService - Concrete service implementation for indices entity
 * Extends BaseService with indices-specific operations
 */

import { BaseService } from '../api/baseService';
import { ApiClient } from '../../lib/apiClient';
import { Indice } from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';

export class IndicesServiceImpl extends BaseService<Indice, { nome: string }> {
    constructor(apiClient: ApiClient, endpoint: string) {
        super(apiClient, endpoint);
    }

    /**
     * Get all indices (reference data)
     */
    async getAllForReference(): Promise<ApiResponse<Indice[]>> {
        const response = await this.getAll({
            // Cache reference data for longer periods
            cache: {
                ttl: 60 * 60 * 1000 // 1 hour
            }
        });

        return {
            ...response,
            data: response.data?.items || []
        };
    }

    /**
     * Search indices by name
     */
    async searchByName(name: string, options?: QueryOptions): Promise<ApiResponse<Indice[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                nome: {
                    contains: name
                }
            }
        });
    }
}
```

### 2.5 TiposService

### File: `src/services/tipos/TiposService.ts`

```typescript
/**
 * TiposService - Concrete service implementation for tipos entity
 * Extends BaseService with tipos-specific operations
 */

import { BaseService } from '../api/baseService';
import { ApiClient } from '../../lib/apiClient';
import { Tipo } from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';

export class TiposServiceImpl extends BaseService<Tipo, { nome: string; cor?: string }> {
    constructor(apiClient: ApiClient, endpoint: string) {
        super(apiClient, endpoint);
    }

    /**
     * Get all tipos (reference data)
     */
    async getAllForReference(): Promise<ApiResponse<Tipo[]>> {
        const response = await this.getAll({
            // Cache reference data for longer periods
            cache: {
                ttl: 60 * 60 * 1000 // 1 hour
            }
        });

        return {
            ...response,
            data: response.data?.items || []
        };
    }

    /**
     * Search tipos by name
     */
    async searchByName(name: string, options?: QueryOptions): Promise<ApiResponse<Tipo[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                nome: {
                    contains: name
                }
            }
        });
    }

    /**
     * Get tipos by color
     */
    async getByColor(cor: string, options?: QueryOptions): Promise<ApiResponse<Tipo[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                cor
            }
        });
    }
}
```

### 2.6 TratamientosService

### File: `src/services/tratamientos/TratamientosService.ts`

```typescript
/**
 * TratamientosService - Concrete service implementation for tratamientos entity
 * Extends BaseService with tratamientos-specific operations
 */

import { BaseService } from '../api/baseService';
import { ApiClient } from '../../lib/apiClient';
import { Tratamento } from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';

export class TratamientosServiceImpl extends BaseService<Tratamento, { nome: string }> {
    constructor(apiClient: ApiClient, endpoint: string) {
        super(apiClient, endpoint);
    }

    /**
     * Get all tratamientos (reference data)
     */
    async getAllForReference(): Promise<ApiResponse<Tratamento[]>> {
        const response = await this.getAll({
            // Cache reference data for longer periods
            cache: {
                ttl: 60 * 60 * 1000 // 1 hour
            }
        });

        return {
            ...response,
            data: response.data?.items || []
        };
    }

    /**
     * Search tratamientos by name
     */
    async searchByName(name: string, options?: QueryOptions): Promise<ApiResponse<Tratamento[]>> {
        return this.getAll({
            ...options,
            filters: {
                ...options?.filters,
                nome: {
                    contains: name
                }
            }
        });
    }
}
```

## Step 3: Create ServiceRegistry

### File: `src/services/core/ServiceRegistry.ts`

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

## Step 4: Update Service Exports

### File: `src/services/index.ts`

```typescript
/**
 * Services exports
 */

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

## Step 5: Refactor Domain Hooks

### 5.1 Refactored faltas.ts

### File: `src/hooks/domain/faltas.ts`

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

### 5.2 Migration Template for Other Domain Hooks

For each remaining domain hook file, follow this pattern:

**Before (❌ Anti-pattern):**
```typescript
import { BaseService } from '../../services/api/baseService';

class EntityService extends BaseService<Entity, EntityFormData> {
    constructor() {
        super({} as any, 'entity'); // ❌ Anti-pattern
    }
}
const entityService = new EntityService();
```

**After (✅ Proper pattern):**
```typescript
import { serviceRegistry } from '../../services/core/ServiceRegistry';

const entityService = serviceRegistry.getEntityService();
```

## Step 6: Initialize ApiClient

### File: `src/lib/apiClientConfig.ts`

```typescript
/**
 * ApiClient configuration
 * Centralized configuration for the ApiClient singleton
 */

import { ApiClientConfig } from '../types/api/api.types';

// Development configuration
const developmentConfig: ApiClientConfig = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};

// Production configuration
const productionConfig: ApiClientConfig = {
    baseURL: process.env.REACT_APP_API_URL || 'https://api.visulab.com',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
};

// Test configuration
const testConfig: ApiClientConfig = {
    baseURL: 'http://localhost:3001/api/test',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
};

/**
 * Get ApiClient configuration based on environment
 */
export function getApiClientConfig(): ApiClientConfig {
    switch (process.env.NODE_ENV) {
        case 'production':
            return productionConfig;
        case 'test':
            return testConfig;
        case 'development':
        default:
            return developmentConfig;
    }
}

/**
 * Initialize ApiClient with proper configuration
 * This should be called once during application startup
 */
export function initializeApiClient() {
    const config = getApiClientConfig();
    
    // Import and initialize the service factory with config
    const { serviceFactory } = require('../services/core/ServiceFactory');
    serviceFactory.getInstance(config);
    
    return config;
}
```

## Step 7: Application Initialization

### Update `src/index.ts` or `App.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeApiClient } from './lib/apiClientConfig';

// Initialize ApiClient before rendering the app
initializeApiClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Testing Strategy

### Unit Test Example for ServiceFactory

### File: `src/services/core/__tests__/ServiceFactory.test.ts`

```typescript
import { ServiceFactory } from '../ServiceFactory';
import { BaseService } from '../../api/baseService';
import { ApiClient } from '../../../lib/apiClient';

// Mock service for testing
class MockService extends BaseService<any> {
    constructor(apiClient: ApiClient, endpoint: string) {
        super(apiClient, endpoint);
    }
}

describe('ServiceFactory', () => {
    let factory: ServiceFactory;

    beforeEach(() => {
        ServiceFactory.resetInstance();
        factory = ServiceFactory.getInstance({
            baseURL: 'http://test.com',
            timeout: 1000
        });
    });

    afterEach(() => {
        ServiceFactory.resetInstance();
    });

    it('should create singleton instance', () => {
        const factory1 = ServiceFactory.getInstance();
        const factory2 = ServiceFactory.getInstance();
        expect(factory1).toBe(factory2);
    });

    it('should create and cache service instances', () => {
        const service1 = factory.getService(MockService, { name: 'test', endpoint: 'test' });
        const service2 = factory.getService(MockService, { name: 'test', endpoint: 'test' });
        
        expect(service1).toBe(service2);
    });

    it('should clear service instances', () => {
        const service1 = factory.getService(MockService, { name: 'test', endpoint: 'test' });
        factory.clearServices();
        const service2 = factory.getService(MockService, { name: 'test', endpoint: 'test' });
        
        expect(service1).not.toBe(service2);
    });
});
```

## Benefits Summary

1. **Eliminates Anti-Patterns**: No more `{} as any` placeholders
2. **Centralized Configuration**: Single point for API client configuration
3. **Dependency Injection**: Proper DI pattern with service factory
4. **Singleton Management**: Ensures single instances of services
5. **Type Safety**: Proper TypeScript typing throughout
6. **Testability**: Easy to mock and test services
7. **Maintainability**: Clear separation of concerns
8. **Scalability**: Easy to add new services and features

## Implementation Checklist

- [ ] Create ServiceFactory class
- [ ] Create ServiceRegistry class
- [ ] Implement concrete service classes for each entity
- [ ] Update service exports
- [ ] Refactor domain hooks to use service registry
- [ ] Create ApiClient configuration
- [ ] Initialize ApiClient in application startup
- [ ] Add unit tests for service factory and registry
- [ ] Add integration tests for service implementations
- [ ] Update documentation

This implementation provides a robust, scalable, and maintainable service layer architecture that eliminates the anti-patterns while maintaining compatibility with existing code.