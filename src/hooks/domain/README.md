# Domain-Specific Hooks Documentation

This directory contains domain-specific hooks that wrap the generic query/mutation hooks with entity-specific logic. Each hook provides a clean, intuitive API for UI consumption while maintaining proper cache invalidation and query management.

## Architecture Overview

All domain hooks follow a consistent pattern:

1. **Service Layer**: Each entity has a dedicated service class extending `BaseService`
2. **Query Hooks**: Wrap generic query hooks with entity-specific logic
3. **Mutation Hooks**: Wrap generic mutation hooks with proper cache invalidation
4. **Prefetch Functions**: Enable proactive data loading for better UX
5. **Type Safety**: Strict TypeScript typing throughout

## Entity Hooks

### Empresas (Companies)

**File**: [`empresas.ts`](./empresas.ts)

**Responsibilities**:
- Manage company data operations (CRUD)
- Handle company-specific filtering and search
- Provide company statistics and analytics
- Manage bulk operations (activate/deactivate/delete)
- Invalidate related `usuarios` queries on changes

**Key Hooks**:
- `useEmpresasList()` - Fetch companies with optional filtering
- `useEmpresaDetail(id)` - Fetch single company by ID
- `useEmpresasSearch(query)` - Search companies
- `useCreateEmpresa()` - Create new company
- `useUpdateEmpresa()` - Update existing company
- `useDeleteEmpresa()` - Delete company
- `useBulkEmpresasOperation()` - Bulk operations
- `useEmpresaStats(id)` - Company statistics
- `useEmpresasWithStats()` - Companies with extended statistics

### Usuarios (Users)

**File**: [`usuarios.ts`](./usuarios.ts)

**Responsibilities**:
- Manage user data operations (CRUD)
- Handle user authentication and authorization
- Provide user-specific filtering and search
- Manage user status and role changes
- Invalidate related `faltas` and `compras` queries on changes

**Key Hooks**:
- `useUsuariosList()` - Fetch users with optional filtering
- `useUsuarioDetail(id)` - Fetch single user by ID
- `useUsuariosSearch(query)` - Search users
- `useCreateUsuario()` - Create new user
- `useUpdateUsuario()` - Update existing user
- `useDeleteUsuario()` - Delete user
- `useBulkUsuariosOperation()` - Bulk operations
- `useUpdateUsuarioStatus()` - Update user status
- `useChangeUsuarioRole()` - Change user role
- `useUsuariosByEmpresa(empresaId)` - Users by company
- `useUsuarioStats(id)` - User statistics

### Faltas (Shortages)

**File**: [`faltas.ts`](./faltas.ts)

**Responsibilities**:
- Manage shortage data operations (CRUD)
- Handle shortage lifecycle (pending → resolved/cancelled)
- Provide shortage-specific filtering and search
- Manage treatment assignments
- Invalidate related `usuarios` and `empresas` queries on changes

**Key Hooks**:
- `useFaltasList()` - Fetch shortages with optional filtering
- `useFaltaDetail(id)` - Fetch single shortage by ID
- `useFaltasSearch(query)` - Search shortages
- `useCreateFalta()` - Create new shortage
- `useUpdateFalta()` - Update existing shortage
- `useDeleteFalta()` - Delete shortage
- `useBulkFaltasOperation()` - Bulk operations (resolve/cancel/delete)
- `useUpdateFaltaStatus()` - Update shortage status
- `useAssignTratamento()` - Assign treatment to shortage
- `useFaltasByUsuario(usuarioId)` - Shortages by user
- `useFaltasByEmpresa(empresaId)` - Shortages by company
- `useFaltaStats()` - Shortage statistics

### Compras (Purchases)

**File**: [`compras.ts`](./compras.ts)

**Responsibilities**:
- Manage purchase data operations (CRUD)
- Handle purchase lifecycle (pending → paid/cancelled)
- Provide purchase-specific filtering and search
- Manage purchase status updates
- Handle date-range queries and monthly summaries

**Key Hooks**:
- `useComprasList()` - Fetch purchases with optional filtering
- `useCompraDetail(id)` - Fetch single purchase by ID
- `useComprasSearch(query)` - Search purchases
- `useCreateCompra()` - Create new purchase
- `useUpdateCompra()` - Update existing purchase
- `useDeleteCompra()` - Delete purchase
- `useBulkComprasOperation()` - Bulk operations (approve/cancel/delete)
- `useUpdateCompraStatus()` - Update purchase status
- `useComprasByStatus(status)` - Purchases by status
- `useComprasByDateRange(startDate, endDate)` - Purchases by date range
- `useCompraStats()` - Purchase statistics
- `useMonthlyCompraSummary(year, month)` - Monthly summary

### Indices (Reference Data)

**File**: [`indices.ts`](./indices.ts)

**Responsibilities**:
- Manage indices reference data (CRUD)
- Provide indices for dropdowns/selects
- Handle longer caching periods (reference data)
- Invalidate related `faltas` queries on changes

**Key Hooks**:
- `useIndicesList()` - Fetch indices with optional filtering
- `useIndiceDetail(id)` - Fetch single indice by ID
- `useIndicesSearch(query)` - Search indices
- `useCreateIndice()` - Create new indice
- `useUpdateIndice()` - Update existing indice
- `useDeleteIndice()` - Delete indice
- `useAllIndices()` - All indices (cached for 1 hour)

### Tipos (Reference Data)

**File**: [`tipos.ts`](./tipos.ts)

**Responsibilities**:
- Manage tipos reference data (CRUD)
- Provide tipos for dropdowns/selects
- Handle longer caching periods (reference data)
- Invalidate related `faltas` queries on changes

**Key Hooks**:
- `useTiposList()` - Fetch tipos with optional filtering
- `useTipoDetail(id)` - Fetch single tipo by ID
- `useTiposSearch(query)` - Search tipos
- `useCreateTipo()` - Create new tipo
- `useUpdateTipo()` - Update existing tipo
- `useDeleteTipo()` - Delete tipo
- `useAllTipos()` - All tipos (cached for 1 hour)

### Tratamientos (Reference Data)

**File**: [`tratamientos.ts`](./tratamientos.ts)

**Responsibilities**:
- Manage tratamientos reference data (CRUD)
- Provide tratamientos for dropdowns/selects
- Handle longer caching periods (reference data)
- Invalidate related `faltas` queries on changes

**Key Hooks**:
- `useTratamientosList()` - Fetch tratamientos with optional filtering
- `useTratamientoDetail(id)` - Fetch single tratamiento by ID
- `useTratamientosSearch(query)` - Search tratamientos
- `useCreateTratamiento()` - Create new tratamiento
- `useUpdateTratamiento()` - Update existing tratamiento
- `useDeleteTratamiento()` - Delete tratamiento
- `useAllTratamientos()` - All tratamientos (cached for 1 hour)

## Common Patterns

### Cache Invalidation

All hooks follow a consistent cache invalidation strategy:

1. **Entity Invalidation**: Always invalidate the entity's own queries
2. **Related Entity Invalidation**: Invalidate related entities when relationships exist
3. **Detail Invalidation**: Invalidate specific detail queries when individual items change
4. **List Invalidation**: Invalidate list queries on bulk operations

### Prefetching

Each entity provides prefetch functions for proactive data loading:

- `prefetch[Entity]List(queryClient, options)` - Prefetch list data
- `prefetch[Entity]Detail(queryClient, id)` - Prefetch detail data

### Type Safety

All hooks maintain strict TypeScript typing:

- Entity types from `domain.types.ts`
- Form data types for create/update operations
- Filter types for query options
- Proper return types for all operations

## Usage Examples

### Basic CRUD Operations

```typescript
// Fetch list
const { data: empresas, isLoading, error } = useEmpresasList({
  filters: { status: 'Ativa' }
});

// Create new
const createMutation = useCreateEmpresa();
const handleCreate = (formData: EmpresaFormData) => {
  createMutation.mutate(formData);
};

// Update existing
const updateMutation = useUpdateEmpresa();
const handleUpdate = (id: string, data: Partial<EmpresaFormData>) => {
  updateMutation.mutate({ id, data });
};

// Delete
const deleteMutation = useDeleteEmpresa();
const handleDelete = (id: string) => {
  deleteMutation.mutate(id);
};
```

### Advanced Operations

```typescript
// Bulk operations
const bulkMutation = useBulkEmpresasOperation();
const handleBulk = (ids: string[]) => {
  bulkMutation.mutate({ ids, operation: 'activate' });
};

// Prefetching
const queryClient = useQueryClient();
const prefetchData = () => {
  prefetchEmpresasList(queryClient, { filters: { status: 'Ativa' } });
};

// Statistics
const { data: stats } = useEmpresaStats(empresaId);
```

## Best Practices

1. **Use Specific Hooks**: Always use domain-specific hooks over generic ones
2. **Leverage Filtering**: Use built-in filter support for efficient queries
3. **Handle Loading States**: Properly handle isLoading and error states
4. **Optimistic Updates**: Use mutation callbacks for better UX
5. **Prefetch Data**: Use prefetch functions for anticipated data needs
6. **Type Safety**: Leverage TypeScript types for compile-time safety

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data
2. **Offline Support**: Service Worker integration for offline operations
3. **Advanced Caching**: Multi-level caching strategies
4. **Analytics**: Built-in analytics and reporting hooks
5. **Permissions**: Role-based access control integration