# Domain Hooks and Services Architecture Audit Report

## Executive Summary

This report documents the current state of the domain hooks and services architecture, identifies architectural violations, and provides recommendations for refactoring to achieve proper separation of concerns.

## Current Architecture Overview

### Service Layer Structure
- **BaseService**: Abstract base class providing generic CRUD operations
- **Service Implementations**: Concrete implementations for each entity (Empresas, Usuarios, Faltas, Compras, Indices, Tipos, Tratamientos)
- **ServiceRegistry**: Singleton pattern for centralized service access
- **ServiceFactory**: Dependency injection factory for service instantiation

### Domain Hooks Structure
- **Generic Query/Mutation Hooks**: Reusable hooks for common operations
- **Domain-Specific Hooks**: Entity-specific hooks wrapping generic hooks
- **Query Management**: Cache invalidation and prefetching utilities

## Architectural Violations Found

### 1. Service Instantiation Violations

**Critical Violation**: All domain hooks are creating their own service instances instead of using the ServiceRegistry.

**Affected Files**:
- [`src/hooks/domain/empresas.ts`](src/hooks/domain/empresas.ts:30-40)
- [`src/hooks/domain/usuarios.ts`](src/hooks/domain/usuarios.ts:30-39)
- [`src/hooks/domain/compras.ts`](src/hooks/domain/compras.ts:30-39)
- [`src/hooks/domain/indices.ts`](src/hooks/domain/indices.ts:24-33)
- [`src/hooks/domain/tipos.ts`](src/hooks/domain/tipos.ts:24-33)
- [`src/hooks/domain/tratamientos.ts`](src/hooks/domain/tratamientos.ts:24-33)

**Violation Pattern**:
```typescript
// VIOLATION: Direct service instantiation in hooks
class EntityService extends BaseService<Entity, FormData> {
    constructor() {
        super({} as any, 'endpoint'); // Placeholder ApiClient
    }
}
const entityService = new EntityService();
```

**Correct Pattern Should Be**:
```typescript
// CORRECT: Use ServiceRegistry
import { serviceRegistry } from '../../services';
const entityService = serviceRegistry.getEntityService();
```

### 2. Business Logic Distribution Issues

**Hooks Containing Business Logic**:

1. **Bulk Operations in Hooks**:
   - [`useBulkEmpresasOperation`](src/hooks/domain/empresas.ts:153-189)
   - [`useBulkUsuariosOperation`](src/hooks/domain/usuarios.ts:169-205)
   - [`useBulkComprasOperation`](src/hooks/domain/compras.ts:190-225)

2. **Status Update Logic in Hooks**:
   - [`useUpdateCompraStatus`](src/hooks/domain/compras.ts:230-248)
   - [`useUpdateUsuarioStatus`](src/hooks/domain/usuarios.ts:228-245)
   - [`useChangeUsuarioRole`](src/hooks/domain/usuarios.ts:250-267)

3. **Computed Properties in Hooks**:
   - [`useComprasWithUI`](src/hooks/domain/compras.ts:134-144)
   - [`useEmpresasWithStats`](src/hooks/domain/empresas.ts:137-148)
   - [`useUsuariosWithStats`](src/hooks/domain/usuarios.ts:137-146)

**Services Missing Business Logic**:
- Services are mostly CRUD wrappers
- Missing bulk operation implementations
- Missing computed property calculations
- Missing business rule implementations

### 3. API Client Instantiation Issues

**Placeholder ApiClient Usage**:
All hook-instantiated services use `{} as any` as ApiClient, which will cause runtime errors.

### 4. Inconsistent Service Patterns

**Service Implementation Inconsistencies**:
- Some services have UI-specific methods (getWithUI, getWithStats)
- Some services have business logic methods (computeStatus, computePrioridade)
- Inconsistent method naming and signatures

## Business Logic Analysis

### Current Distribution

| Business Logic | Location | Should Be |
|----------------|----------|-----------|
| CRUD Operations | Services | Services ✓ |
| Bulk Operations | Hooks | Services |
| Status Updates | Hooks | Services |
| Computed Properties | Services | Services ✓ |
| UI State Management | Hooks | Hooks ✓ |
| Cache Management | Hooks | Hooks ✓ |
| Query Orchestration | Hooks | Hooks ✓ |

### Missing Business Logic in Services

1. **Bulk Operations**:
   - `bulkUpdateStatus`
   - `bulkDelete`
   - `bulkChangeRole`

2. **Business Rules**:
   - Status computation based on business rules
   - Priority calculation algorithms
   - Permission computation based on roles

3. **Data Transformation**:
   - UI-specific data transformations
   - Statistics calculations
   - Formatting utilities

## Service Public API Analysis

### Current API Patterns

**Standard CRUD Methods** (All Services):
- `getAll(options?)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `patch(id, data)`
- `delete(id)`

**Entity-Specific Methods**:

**EmpresasService**:
- `getWithStats()` - UI-specific data
- `getByStatus(status)`
- `getByTipo(tipo)`
- `searchByNome(nome)`
- `updateStatus(id, status)`
- `bulkUpdateStatus(ids, status)`
- `getByContatoEmail(email)`
- `getByDateRange(start, end)`

**UsuariosService**:
- `getWithStats()` - UI-specific data
- `getByEmpresa(empresaId)`
- `getByRole(role)`
- `getByStatus(status)`
- `searchByNome(nome)`
- `searchByEmail(email)`
- `updateStatus(id, status)`
- `changeRole(id, role)`
- `updateLastActive(id)`
- `bulkUpdateStatus(ids, status)`
- `bulkChangeRole(ids, role)`
- `getByDateRange(start, end)`
- `computePermissions(role)` - Business logic

**FaltasService**:
- `getWithUI()` - UI-specific data
- `getByEmpresa(empresaId)`
- `getByUsuario(usuarioId)`
- `getByTipo(tipoId)`
- `getByStatus(status)`
- `updateStatus(id, status)`
- `bulkUpdateStatus(ids, status)`
- `bulkDelete(ids)`
- `search(criteria)`
- `computeStatus(falta)` - Business logic
- `computePrioridade(falta)` - Business logic

**ComprasService**:
- `getWithUI()` - UI-specific data
- `getByStatus(status)`
- `getByFornecedor(fornecedor)`
- `getByDateRange(start, end)`
- `getByValorRange(min, max)`
- `updateStatus(id, status)`
- `bulkUpdateStatus(ids, status)`
- `search(criteria)`
- `getMonthlySummary(year, month)`
- `formatStatus(status)` - UI formatting
- `formatCurrency(value)` - UI formatting
- `formatDate(date)` - UI formatting

**Reference Data Services** (Indices, Tipos, Tratamientos):
- `getAllForReference()`
- `searchByName(nome)`
- `getByName(nome)`
- `getByIds(ids)`

## Recommended Refactoring Plan

### Phase 1: Fix Service Instantiation
1. Remove all service instantiations from domain hooks
2. Import and use `serviceRegistry` in all hooks
3. Ensure proper ApiClient initialization through ServiceFactory

### Phase 2: Move Business Logic to Services
1. Move bulk operations from hooks to services
2. Move status update logic from hooks to services
3. Ensure all business rules are in services
4. Keep UI-specific concerns in hooks

### Phase 3: Standardize Service APIs
1. Define consistent interfaces for all services
2. Separate business methods from UI methods
3. Create clear naming conventions
4. Document public APIs

### Phase 4: Refine Hook Responsibilities
1. Hooks should only orchestrate cache and UI concerns
2. Remove business logic from hooks
3. Ensure hooks only delegate to services
4. Maintain proper query invalidation patterns

## Proposed Service Interface Standardization

### Base Service Interface
```typescript
interface IEntityService<T, C = Partial<T>, U = Partial<T>> {
  // CRUD Operations
  getAll(options?: QueryOptions): Promise<ApiResponse<PaginatedResponse<T>>>;
  getById(id: string): Promise<ApiResponse<T>>;
  create(data: C): Promise<ApiResponse<T>>;
  update(id: string, data: U): Promise<ApiResponse<T>>;
  patch(id: string, data: Partial<U>): Promise<ApiResponse<T>>;
  delete(id: string): Promise<ApiResponse<void>>;
  
  // Business Operations
  updateStatus(id: string, status: string): Promise<ApiResponse<T>>;
  bulkUpdateStatus(ids: string[], status: string): Promise<ApiResponse<T[]>>;
  bulkDelete(ids: string[]): Promise<ApiResponse<void>>;
  
  // Query Operations
  search(criteria: any, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  getByStatus(status: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
}
```

### Extended Service Interface (for entities with relationships)
```typescript
interface IExtendedEntityService<T, C, U> extends IEntityService<T, C, U> {
  // Relationship-based queries
  getByEmpresa(empresaId: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  getByUsuario(usuarioId: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  // Date-based queries
  getByDateRange(startDate: string, endDate: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  
  // Business-specific methods (entity-dependent)
}
```

## Implementation Priority

1. **High Priority**: Fix service instantiation violations
2. **High Priority**: Move bulk operations to services
3. **Medium Priority**: Standardize service interfaces
4. **Medium Priority**: Move status update logic to services
5. **Low Priority**: Refine UI-specific methods and formatting

## Conclusion

The current architecture has significant violations of the separation of concerns principle. The main issues are:

1. **Service instantiation in hooks** - breaks dependency injection
2. **Business logic in hooks** - violates single responsibility
3. **Inconsistent service APIs** - makes maintenance difficult

The refactoring plan outlined above will address these issues and create a more maintainable, testable, and scalable architecture.