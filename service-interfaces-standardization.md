# Service Interfaces Standardization Proposal

## Overview

This document proposes standardized interfaces for all entity services to ensure consistency, type safety, and maintainability across the application.

## Base Service Interface

### Core Entity Service Interface

```typescript
import { ApiResponse, QueryOptions, PaginatedResponse } from '../../types/api/api.types';
import { Entity } from '../api/baseService';

/**
 * Base interface for all entity services
 * Defines standard CRUD operations and common business methods
 */
export interface IEntityService<T extends Entity, C = Partial<T>, U = Partial<T>> {
  // === CRUD Operations ===
  
  /**
   * Get all entities with optional filtering and pagination
   */
  getAll(options?: QueryOptions): Promise<ApiResponse<PaginatedResponse<T>>>;
  
  /**
   * Get entity by ID
   */
  getById(id: string): Promise<ApiResponse<T>>;
  
  /**
   * Create a new entity
   */
  create(data: C): Promise<ApiResponse<T>>;
  
  /**
   * Update an existing entity
   */
  update(id: string, data: U): Promise<ApiResponse<T>>;
  
  /**
   * Partial update of an entity
   */
  patch(id: string, data: Partial<U>): Promise<ApiResponse<T>>;
  
  /**
   * Delete an entity
   */
  delete(id: string): Promise<ApiResponse<void>>;
  
  // === Business Operations ===
  
  /**
   * Update entity status
   */
  updateStatus(id: string, status: string): Promise<ApiResponse<T>>;
  
  /**
   * Bulk update status for multiple entities
   */
  bulkUpdateStatus(ids: string[], status: string): Promise<ApiResponse<T[]>>;
  
  /**
   * Bulk delete multiple entities
   */
  bulkDelete(ids: string[]): Promise<ApiResponse<void>>;
  
  // === Query Operations ===
  
  /**
   * Search entities by multiple criteria
   */
  search(criteria: any, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  /**
   * Get entities by status
   */
  getByStatus(status: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  /**
   * Get entities by date range
   */
  getByDateRange(startDate: string, endDate: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  /**
   * Get entities by multiple IDs
   */
  getByIds(ids: string[], options?: QueryOptions): Promise<ApiResponse<T[]>>;
}
```

### Extended Entity Service Interface

```typescript
/**
 * Extended interface for entities with relationships
 * Adds relationship-based query methods
 */
export interface IExtendedEntityService<T extends Entity, C, U> extends IEntityService<T, C, U> {
  // === Relationship Operations ===
  
  /**
   * Get entities by empresa (company)
   */
  getByEmpresa(empresaId: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  /**
   * Get entities by usuario (user)
   */
  getByUsuario(usuarioId: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  /**
   * Get entities by tipo (type)
   */
  getByTipo(tipoId: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
}
```

### Reference Data Service Interface

```typescript
/**
 * Interface for reference data services (Indices, Tipos, Tratamientos)
 * Focuses on read operations and search functionality
 */
export interface IReferenceDataService<T extends Entity, C = { nome: string }> extends IEntityService<T, C> {
  // === Reference Data Operations ===
  
  /**
   * Get all reference data (optimized for dropdowns/selects)
   */
  getAllForReference(): Promise<ApiResponse<T[]>>;
  
  /**
   * Search by name (contains)
   */
  searchByName(nome: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  /**
   * Get by exact name match
   */
  getByName(nome: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
}
```

### Business Entity Service Interface

```typescript
/**
 * Interface for business entities with complex operations
 * Adds business-specific methods and computed properties
 */
export interface IBusinessEntityService<T extends Entity, C, U> extends IExtendedEntityService<T, C, U> {
  // === Business-Specific Operations ===
  
  /**
   * Get entities with UI extensions (computed properties, UI state)
   */
  getWithUI(options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  /**
   * Get entities with statistics
   */
  getWithStats(options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  /**
   * Get entity statistics
   */
  getStats(entityId?: string): Promise<ApiResponse<any>>;
  
  /**
   * Get summary data (monthly, yearly, etc.)
   */
  getSummary(params: any): Promise<ApiResponse<any>>;
}
```

## Entity-Specific Interface Definitions

### Empresas Service Interface

```typescript
import { Empresa, EmpresaFormData, EmpresaWithStats } from '../../types/domain/domain.types';

export interface IEmpresasService extends IBusinessEntityService<Empresa, EmpresaFormData, Partial<EmpresaFormData>> {
  // === Empresa-Specific Methods ===
  
  /**
   * Get empresas with statistics
   */
  getWithStats(options?: QueryOptions): Promise<ApiResponse<EmpresaWithStats[]>>;
  
  /**
   * Get empresas by tipo
   */
  getByTipo(tipo: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>>;
  
  /**
   * Search empresas by nome
   */
  searchByNome(nome: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>>;
  
  /**
   * Get empresas by contato email
   */
  getByContatoEmail(email: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>>;
  
  // === Bulk Operations ===
  
  /**
   * Bulk activate empresas
   */
  bulkActivate(ids: string[]): Promise<ApiResponse<Empresa[]>>;
  
  /**
   * Bulk deactivate empresas
   */
  bulkDeactivate(ids: string[]): Promise<ApiResponse<Empresa[]>>;
}
```

### Usuarios Service Interface

```typescript
import { Usuario, UsuarioFormData, UsuarioWithStats } from '../../types/domain/domain.types';

export interface IUsuariosService extends IBusinessEntityService<Usuario, UsuarioFormData, Partial<UsuarioFormData>> {
  // === Usuario-Specific Methods ===
  
  /**
   * Get usuarios with statistics
   */
  getWithStats(options?: QueryOptions): Promise<ApiResponse<UsuarioWithStats[]>>;
  
  /**
   * Get usuarios by role
   */
  getByRole(role: string, options?: QueryOptions): Promise<ApiResponse<Usuario[]>>;
  
  /**
   * Search usuarios by nome
   */
  searchByNome(nome: string, options?: QueryOptions): Promise<ApiResponse<Usuario[]>>;
  
  /**
   * Search usuarios by email
   */
  searchByEmail(email: string, options?: QueryOptions): Promise<ApiResponse<Usuario[]>>;
  
  // === Usuario Management ===
  
  /**
   * Change usuario role
   */
  changeRole(id: string, role: string): Promise<ApiResponse<Usuario>>;
  
  /**
   * Update last active timestamp
   */
  updateLastActive(id: string): Promise<ApiResponse<Usuario>>;
  
  /**
   * Compute permissions based on role
   */
  computePermissions(role: string): string[];
  
  // === Bulk Operations ===
  
  /**
   * Bulk activate usuarios
   */
  bulkActivate(ids: string[]): Promise<ApiResponse<Usuario[]>>;
  
  /**
   * Bulk deactivate usuarios
   */
  bulkDeactivate(ids: string[]): Promise<ApiResponse<Usuario[]>>;
  
  /**
   * Bulk change usuario roles
   */
  bulkChangeRole(ids: string[], role: string): Promise<ApiResponse<Usuario[]>>;
}
```

### Faltas Service Interface

```typescript
import { Falta, FaltaFormData, FaltaWithUI, FaltaFilters } from '../../types/domain/domain.types';

export interface IFaltasService extends IBusinessEntityService<Falta, FaltaFormData, Partial<FaltaFormData>> {
  // === Falta-Specific Methods ===
  
  /**
   * Get faltas with UI extensions
   */
  getWithUI(options?: QueryOptions): Promise<ApiResponse<FaltaWithUI[]>>;
  
  /**
   * Get faltas by multiple criteria
   */
  search(criteria: FaltaFilters, options?: QueryOptions): Promise<ApiResponse<Falta[]>>;
  
  // === Business Logic Methods ===
  
  /**
   * Compute status based on falta properties
   */
  computeStatus(falta: Falta): 'Pendente' | 'Em Andamento' | 'Resolvida' | 'Cancelada';
  
  /**
   * Compute prioridade based on falta properties
   */
  computePrioridade(falta: Falta): 'Baixa' | 'Média' | 'Alta';
}
```

### Compras Service Interface

```typescript
import { Compra, CompraFormData, CompraWithUI, CompraFilters } from '../../types/domain/domain.types';

export interface IComprasService extends IBusinessEntityService<Compra, CompraFormData, Partial<CompraFormData>> {
  // === Compra-Specific Methods ===
  
  /**
   * Get compras with UI extensions
   */
  getWithUI(options?: QueryOptions): Promise<ApiResponse<CompraWithUI[]>>;
  
  /**
   * Get compras by fornecedor
   */
  getByFornecedor(fornecedor: string, options?: QueryOptions): Promise<ApiResponse<Compra[]>>;
  
  /**
   * Get compras by valor range
   */
  getByValorRange(min: number, max: number, options?: QueryOptions): Promise<ApiResponse<Compra[]>>;
  
  /**
   * Search compras by multiple criteria
   */
  search(criteria: CompraFilters, options?: QueryOptions): Promise<ApiResponse<Compra[]>>;
  
  // === Business Operations ===
  
  /**
   * Get monthly summary
   */
  getMonthlySummary(year: number, month: number): Promise<ApiResponse<any>>;
  
  /**
   * Get compra statistics
   */
  getStats(filters?: CompraFilters): Promise<ApiResponse<any>>;
  
  // === Bulk Operations ===
  
  /**
   * Bulk approve compras
   */
  bulkApprove(ids: string[]): Promise<ApiResponse<Compra[]>>;
  
  /**
   * Bulk cancel compras
   */
  bulkCancel(ids: string[]): Promise<ApiResponse<Compra[]>>;
  
  // === Formatting Methods (could be moved to utils) ===
  
  /**
   * Format status for display
   */
  formatStatus(status: string): string;
  
  /**
   * Format currency value
   */
  formatCurrency(value: number): string;
  
  /**
   * Format date for display
   */
  formatDate(dateString: string): string;
}
```

### Reference Data Service Interfaces

```typescript
import { Indice } from '../../types/domain/domain.types';

export interface IIndicesService extends IReferenceDataService<Indice> {
  // No additional methods needed beyond base interface
}

import { Tipo } from '../../types/domain/domain.types';

export interface ITiposService extends IReferenceDataService<Tipo, { nome: string; cor?: string }> {
  /**
   * Get tipos by color
   */
  getByColor(cor: string, options?: QueryOptions): Promise<ApiResponse<Tipo[]>>;
}

import { Tratamento } from '../../types/domain/domain.types';

export interface ITratamientosService extends IReferenceDataService<Tratamento> {
  // No additional methods needed beyond base interface
}
```

## Implementation Guidelines

### 1. Service Implementation Structure

```typescript
export class EntityServiceImpl extends BaseService<Entity, FormData> implements IEntityService<Entity, FormData> {
  constructor(apiClient: ApiClient, endpoint: string) {
    super(apiClient, endpoint);
  }
  
  // Implement all interface methods
  // Use consistent error handling
  // Follow naming conventions
  // Add proper TypeScript types
}
```

### 2. Error Handling Standardization

```typescript
// All service methods should follow this pattern
async methodName(params: any): Promise<ApiResponse<T>> {
  try {
    const response = await this.apiClient.method(params);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }
}
```

### 3. Method Naming Conventions

- **CRUD**: `getAll`, `getById`, `create`, `update`, `patch`, `delete`
- **Queries**: `getByXxx`, `searchByXxx`, `getAllForXxx`
- **Business**: `updateStatus`, `bulkXxx`, `computeXxx`
- **UI**: `getWithUI`, `getWithStats`, `formatXxx`

### 4. Parameter Patterns

- **Options**: Always accept optional `QueryOptions` as last parameter
- **Filters**: Use specific filter types or `any` for complex criteria
- **IDs**: Use `string[]` for bulk operations, `string` for single operations
- **Status**: Use `string` for flexibility, document expected values

### 5. Return Value Patterns

- **Single Entity**: `Promise<ApiResponse<T>>`
- **Multiple Entities**: `Promise<ApiResponse<T[]>>`
- **Paginated**: `Promise<ApiResponse<PaginatedResponse<T>>>`
- **Void Operations**: `Promise<ApiResponse<void>>`

## Migration Strategy

### Phase 1: Define Interfaces
1. Create interface files for each entity
2. Update existing service implementations to implement interfaces
3. Add missing methods to services

### Phase 2: Update Service Registry
1. Update ServiceRegistry to use interface types
2. Ensure all services implement their interfaces
3. Add type safety checks

### Phase 3: Update Hooks
1. Update hooks to use interface types
2. Ensure all hook methods delegate to interface methods
3. Add proper error handling

### Phase 4: Testing and Validation
1. Unit test all interface implementations
2. Integration test hook-service communication
3. Validate type safety across the application

## Benefits of Standardization

1. **Type Safety**: Compile-time checking of service implementations
2. **Consistency**: Uniform patterns across all services
3. **Maintainability**: Easier to understand and modify code
4. **Testing**: Clear contracts for unit testing
5. **Documentation**: Self-documenting code through interfaces
6. **Refactoring**: Safer refactoring with type constraints
7. **Team Collaboration**: Clear expectations for developers

## Conclusion

Standardizing service interfaces will significantly improve the architecture's consistency, type safety, and maintainability. The proposed interfaces provide a solid foundation for future development while maintaining flexibility for entity-specific requirements.