# Data Fetching Production Readiness Fix Plan

**Date:** 2026-01-04
**Status:** Ready for Implementation
**Mode:** Code

---

## Executive Summary

This document outlines the fixes needed to make the app production-ready for data fetching. **5 CRITICAL ISSUES** have been identified that prevent the app from working correctly with real Supabase data.

**Impact:**
- Data will not display correctly (missing JOINs)
- Cannot create faltas records (hardcoded IDs)
- Inconsistent data fetching patterns
- Soft delete broken for faltas

**Estimated Scope:** 8-12 focused fixes across 5 files

---

## Issue #1: Missing JOINs in New Supabase Services

### Severity: CRITICAL
### Impact: Data will not load correctly

### Problem Description

The new Supabase MCP services (`SupabaseUsuariosService`, `SupabaseFaltasService`) do NOT include JOINs, but pages expect nested data.

### Root Cause

**Old services** had JOINs:
```typescript
// services/usuariosService.ts:7-16
await supabase
  .from('usuarios')
  .select('*, empresas(nome)')  // ✅ JOINs with empresas
```

**New services** have NO JOINs:
```typescript
// src/services/usuarios/SupabaseUsuariosService.ts:21-33
await supabaseMcpClient.query<Usuario>(this.tableName, {
    filters: { deleted_at: { is: null } },
    // ❌ NO JOIN - just queries usuarios table
});
```

### Affected Files

1. `src/services/usuarios/SupabaseUsuariosService.ts`
2. `src/services/faltas/SupabaseFaltasService.ts`

### Fix Strategy

**Option A: Add JOINs to Supabase MCP Client** (RECOMMENDED)
- Extend `supabaseMcpClient.query()` to support JOINs
- Update service methods to include JOINs
- **Pros:** Consistent with Supabase patterns, flexible
- **Cons:** Requires MCP client changes

**Option B: Use Direct Supabase Client for JOINs**
- Keep MCP client for simple queries
- Use direct `supabase.from()` for JOIN queries
- **Pros:** Works immediately, no MCP changes needed
- **Cons:** Inconsistent patterns

### Implementation Plan (Option A)

#### Step 1: Extend Supabase MCP Client to Support JOINs

**File:** `lib/integration/supabase/supabaseMcpClient.ts`

Add `joins` parameter to `QueryOptions`:

```typescript
export interface QueryOptions {
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending: boolean };
    limit?: number;
    offset?: number;
    joins?: JoinConfig[];  // NEW
}

export interface JoinConfig {
    table: string;
    columns?: string;  // e.g., 'id, nome' or '*' for all
}
```

Update `query()` method to handle JOINs:

```typescript
async query<T>(tableName: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
    try {
        let select = '*';

        // Build SELECT with JOINs
        if (options.joins && options.joins.length > 0) {
            const joinClauses = options.joins.map(join => {
                const columns = join.columns || '*';
                return `${join.table}(${columns})`;
            }).join(', ');
            select = `*, ${joinClauses}`;
        }

        // ... rest of query logic
    }
}
```

#### Step 2: Update SupabaseUsuariosService to Include JOINs

**File:** `src/services/usuarios/SupabaseUsuariosService.ts`

Update `getAll()` method:

```typescript
async getAll(options?: QueryOptions): Promise<ApiResponse<Usuario[]>> {
    try {
        const result = await supabaseMcpClient.query<Usuario>(this.tableName, {
            filters: {
                deleted_at: { is: null }
            },
            orderBy: {
                column: 'nome',
                ascending: true
            },
            limit: options?.limit,
            offset: options?.offset,
            joins: [  // NEW: Add JOIN with empresas
                {
                    table: 'empresas',
                    columns: 'id, nome'
                }
            ]
        });

        // ... rest of method
    }
}
```

#### Step 3: Update SupabaseFaltasService to Include JOINs

**File:** `src/services/faltas/SupabaseFaltasService.ts`

Update `getAll()` method:

```typescript
async getAll(options?: QueryOptions): Promise<ApiResponse<Falta[]>> {
    try {
        const result = await supabaseMcpClient.query<Falta>(this.tableName, {
            filters: {
                deleted_at: { is: null }
            },
            orderBy: {
                column: 'created_at',
                ascending: false
            },
            limit: options?.limit,
            offset: options?.offset,
            joins: [  // NEW: Add JOINs with related tables
                {
                    table: 'usuarios',
                    columns: 'id, nome, email'
                },
                {
                    table: 'empresas',
                    columns: 'id, nome'
                },
                {
                    table: 'tipos',
                    columns: 'id, nome'
                },
                {
                    table: 'indices',
                    columns: 'id, nome'
                },
                {
                    table: 'tratamentos',
                    columns: 'id, nome'
                }
            ]
        });

        // ... rest of method
    }
}
```

### Validation

- [ ] Users page displays company names correctly
- [ ] Shortages history modal shows user names
- [ ] No `undefined` values in nested data

---

## Issue #2: Pages Still Use OLD Services

### Severity: CRITICAL
### Impact: New services not being used

### Problem Description

Pages are importing and using OLD direct Supabase services instead of new Supabase MCP services.

### Root Cause

Old services still exist and are being imported:
```typescript
// pages/Users.tsx:7-8
import { usuariosService } from '../services/usuariosService';
import { empresasService } from '../services/empresasService';
```

### Affected Files

1. `pages/Users.tsx`
2. `pages/Shortages.tsx`
3. `pages/Purchases.tsx`

### Fix Strategy

**Replace old service imports with domain hooks** (RECOMMENDED)

This aligns with the pattern already used in `pages/Companies.tsx` and provides:
- Consistent data fetching across all pages
- Automatic caching via TanStack Query
- Better error handling
- Loading states managed automatically

### Implementation Plan

#### Step 1: Create Missing Domain Hooks

**File:** `src/hooks/domain/usuarios.ts` (CREATE NEW)

```typescript
/**
 * Domain-specific hooks for usuarios (users) entity
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';
import {
    useGenericListQuery,
    useGenericCreateMutation,
    useGenericUpdateMutation,
    useGenericDeleteMutation
} from '../queries/useGenericQuery';
import { queryInvalidation } from '../queries/queryInvalidation';
import { Usuario, UsuarioFormData } from '../../types/domain/domain.types';

export function useUsuariosList(options?: any) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();
    return useGenericListQuery<Usuario>('usuarios', usuariosService, options);
}

export function useCreateUsuario() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useGenericCreateMutation<Usuario, UsuarioFormData>(
        'usuarios',
        usuariosService,
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'usuarios');
            },
        }
    );
}

export function useUpdateUsuario() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useGenericUpdateMutation<Usuario, Partial<UsuarioFormData>>(
        'usuarios',
        usuariosService,
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'usuarios');
            },
        }
    );
}

export function useDeleteUsuario() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useGenericDeleteMutation<Usuario>(
        'usuarios',
        usuariosService,
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'usuarios');
            },
        }
    );
}
```

**File:** `src/hooks/domain/faltas.ts` (UPDATE EXISTING)

Add missing hooks if not present:
```typescript
export function useCreateFalta() {
    const queryClient = useQueryClient();
    const faltasService = ServiceRegistry.getInstance().getFaltasService();

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
```

**File:** `src/hooks/domain/compras.ts` (CREATE NEW)

```typescript
/**
 * Domain-specific hooks for compras (purchases) entity
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';
import {
    useGenericListQuery,
    useGenericCreateMutation,
    useGenericUpdateMutation,
    useGenericDeleteMutation
} from '../queries/useGenericQuery';
import { queryInvalidation } from '../queries/queryInvalidation';
import { Compra, CompraFormData } from '../../types/domain/domain.types';

export function useComprasList(options?: any) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();
    return useGenericListQuery<Compra>('compras', comprasService, options);
}

export function useCreateCompra() {
    const queryClient = useQueryClient();
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useGenericCreateMutation<Compra, CompraFormData>(
        'compras',
        comprasService,
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'compras');
            },
        }
    );
}

export function useUpdateCompra() {
    const queryClient = useQueryClient();
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useGenericUpdateMutation<Compra, Partial<CompraFormData>>(
        'compras',
        comprasService,
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'compras');
            },
        }
    );
}

export function useDeleteCompra() {
    const queryClient = useQueryClient();
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useGenericDeleteMutation<Compra>(
        'compras',
        comprasService,
        {
            onSuccess: () => {
                queryInvalidation.invalidateEntity(queryClient, 'compras');
            },
        }
    );
}
```

**File:** `src/hooks/domain/indices.ts` (CREATE NEW)

```typescript
/**
 * Domain-specific hooks for indices entity
 */

import { useQuery } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';
import { useGenericListQuery } from '../queries/useGenericQuery';
import { Indice } from '../../types/domain/domain.types';

export function useIndicesList() {
    const indicesService = ServiceRegistry.getInstance().getIndicesService();
    return useGenericListQuery<Indice>('indices', indicesService);
}
```

**File:** `src/hooks/domain/tipos.ts` (CREATE NEW)

```typescript
/**
 * Domain-specific hooks for tipos entity
 */

import { useQuery } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';
import { useGenericListQuery } from '../queries/useGenericQuery';
import { Tipo } from '../../types/domain/domain.types';

export function useTiposList() {
    const tiposService = ServiceRegistry.getInstance().getTiposService();
    return useGenericListQuery<Tipo>('tipos', tiposService);
}
```

**File:** `src/hooks/domain/tratamientos.ts` (CREATE NEW)

```typescript
/**
 * Domain-specific hooks for tratamientos entity
 */

import { useQuery } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';
import { useGenericListQuery } from '../queries/useGenericQuery';
import { Tratamiento } from '../../types/domain/domain.types';

export function useTratamientosList() {
    const tratamientosService = ServiceRegistry.getInstance().getTratamientosService();
    return useGenericListQuery<Tratamiento>('tratamientos', tratamientosService);
}
```

#### Step 2: Update Users Page to Use Domain Hooks

**File:** `pages/Users.tsx`

Replace old imports and data fetching:

```typescript
// OLD:
// import { usuariosService } from '../services/usuariosService';
// import { empresasService } from '../services/empresasService';

// NEW:
import { useAuth } from '../src/contexts/AuthContext';
import { useUsuariosList, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from '../src/hooks/domain/usuarios';
import { useEmpresasList } from '../src/hooks/domain/empresas';

const Users: React.FC = () => {
    const { user: currentUser } = useAuth();

    // NEW: Use domain hooks
    const { data: usuariosData, isLoading, error, refetch } = useUsuariosList();
    const { data: empresasData } = useEmpresasList();

    const createMutation = useCreateUsuario();
    const updateMutation = useUpdateUsuario();
    const deleteMutation = useDeleteUsuario();

    const usuarios = usuariosData?.data || [];
    const empresas = empresasData?.data || [];

    // Map data for UI
    const mappedUsers = usuarios.map(u => ({
        id: u.id,
        name: u.nome,
        email: u.email,
        company: u.empresas?.nome || 'Sem Empresa',
        role: u.role,
        status: u.status,
        lastActive: u.last_active || '-',
        initials: u.initials || u.nome.substring(0, 2).toUpperCase(),
        avatarUrl: u.avatar_url
    }));

    const companyOptions = empresas.map(c => ({ value: c.id, label: c.nome }));

    // ... rest of component
}
```

#### Step 3: Update Shortages Page to Use Domain Hooks

**File:** `pages/Shortages.tsx`

Replace old imports and data fetching:

```typescript
// OLD:
// import { indicesService } from '../services/indicesService';
// import { tiposService } from '../services/tiposService';
// import { tratamientosService } from '../services/tratamientosService';
// import { faltasService } from '../services/faltasService';

// NEW:
import { useAuth } from '../src/contexts/AuthContext';
import { useIndicesList } from '../src/hooks/domain/indices';
import { useTiposList } from '../src/hooks/domain/tipos';
import { useTratamientosList } from '../src/hooks/domain/tratamientos';
import { useCreateFalta, useFaltasList } from '../src/hooks/domain/faltas';

const Shortages: React.FC = () => {
    const { user: currentUser } = useAuth();

    // NEW: Use domain hooks
    const { data: indicesData } = useIndicesList();
    const { data: tiposData } = useTiposList();
    const { data: tratamientosData } = useTratamientosList();
    const { data: faltasData } = useFaltasList();

    const createMutation = useCreateFalta();

    const dbIndices = indicesData?.data || [];
    const dbTipos = tiposData?.data || [];
    const dbTratamientos = tratamientosData?.data || [];
    const recentHistory = faltasData?.data || [];

    // ... rest of component
}
```

#### Step 4: Update Purchases Page to Use Domain Hooks

**File:** `pages/Purchases.tsx`

Replace old imports and data fetching:

```typescript
// OLD:
// import { comprasService } from '../services/comprasService';

// NEW:
import { useComprasList, useCreateCompra } from '../src/hooks/domain/compras';

const Purchases: React.FC = () => {
    // NEW: Use domain hooks
    const { data: comprasData, isLoading, error, refetch } = useComprasList();
    const createMutation = useCreateCompra();

    const purchases = comprasData?.data || [];

    // ... rest of component
}
```

### Validation

- [ ] All pages use domain hooks consistently
- [ ] No direct service imports in pages
- [ ] Loading states work correctly
- [ ] Error handling is consistent

---

## Issue #3: Inconsistent Data Fetching Patterns

### Severity: HIGH
### Impact: Mixed patterns cause confusion

### Problem Description

Different pages use completely different data fetching approaches.

### Root Cause

- Companies page: Uses NEW domain hooks
- Users page: Uses OLD direct service calls
- Shortages page: Uses OLD direct service calls
- Purchases page: Uses OLD direct service calls

### Affected Files

1. `pages/Users.tsx`
2. `pages/Shortages.tsx`
3. `pages/Purchases.tsx`

### Fix Strategy

**Unify all pages to use domain hooks** (ALREADY COVERED IN ISSUE #2)

This is the same fix as Issue #2. By migrating all pages to domain hooks, we achieve:
- Consistent data fetching patterns
- Consistent error handling
- Consistent loading states
- Consistent caching behavior

### Validation

- [ ] All pages follow same pattern
- [ ] All pages use TanStack Query
- [ ] All pages have loading states
- [ ] All pages have error handling

---

## Issue #4: Hardcoded Placeholder IDs in Shortages Page

### Severity: CRITICAL
### Impact: Will cause database errors

### Problem Description

The Shortages page creates faltas with hardcoded placeholder IDs.

### Root Cause

**File:** `pages/Shortages.tsx:169-180`

```typescript
await faltasService.create({
    indice_id: formData.material,
    tipo_id: formData.lensType,
    tratamiento_id: formData.coating,
    esf: parseFloat(formData.sphere),
    cil: parseFloat(formData.cylinder),
    quantidade: formData.quantity,
    // ❌ HARDCODED PLACEHOLDERS - will cause FK violations
    usuario_id: 'current-user-id',
    empresa_id: 'current-company-id'
});
```

### Affected Files

1. `pages/Shortages.tsx`

### Fix Strategy

**Get current user ID from AuthContext and empresa_id from user record**

### Implementation Plan

#### Step 1: Update Shortages Page to Use AuthContext

**File:** `pages/Shortages.tsx`

Add AuthContext import and hook:

```typescript
import { useAuth } from '../src/contexts/AuthContext';

const Shortages: React.FC = () => {
    const { user: currentUser } = useAuth();

    // ... rest of component
}
```

#### Step 2: Update handleSubmit to Use Real User Data

**File:** `pages/Shortages.tsx`

Update the `handleSubmit` function:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
        showToast("Usuário não autenticado.", "error");
        return;
    }

    if (cylinderError) {
        showToast("Corrija o valor do Cilíndrico.", "error");
        return;
    }

    setIsSubmitting(true);

    try {
        await createMutation.mutateAsync({
            indice_id: formData.material,
            tipo_id: formData.lensType,
            tratamiento_id: formData.coating,
            esf: parseFloat(formData.sphere),
            cil: parseFloat(formData.cylinder),
            quantidade: formData.quantity,
            // ✅ Use real user data from AuthContext
            usuario_id: currentUser.id,
            empresa_id: currentUser.empresa_id
        });

        showToast(`Falta registrada com sucesso!`, "success");

        setFormData(prev => ({
            ...prev,
            sphere: '',
            cylinder: '',
            quantity: 1
        }));

        // Refocus for next entry
        setTimeout(() => {
            sphereRef.current?.focus();
        }, 0);

    } catch (error: any) {
        console.error(error);
        showToast("Erro ao processar.", "error");
    } finally {
        setIsSubmitting(false);
    }
};
```

#### Step 3: Ensure AuthContext User Has empresa_id

**File:** `src/contexts/AuthContext.tsx`

Verify that the `AuthUser` type includes `empresa_id`:

```typescript
export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role?: string;
    empresa_id?: string;  // ✅ Must be present
    avatarUrl?: string;
}
```

If not present, update the `login` function to include `empresa_id`:

```typescript
const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    // ... existing code

    const session = await supabaseAuthService.signIn(credentials);

    // Fetch user's empresa_id from usuarios table
    const { supabase } = await import('../../lib/supabase');
    const { data: userData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', session.user.id)
        .single();

    const userWithEmpresa = {
        ...session.user,
        empresa_id: userData?.empresa_id
    };

    dispatchRef.current({
        type: 'AUTH_LOGIN_SUCCESS',
        payload: { user: userWithEmpresa, tokens: session },
    });

    // ... rest of code
}, []);
```

### Validation

- [ ] Faltas can be created successfully
- [ ] No foreign key constraint violations
- [ ] Faltas are associated with correct user and empresa
- [ ] AuthContext user object includes empresa_id

---

## Issue #5: Faltas Table Missing deleted_at Column

### Severity: MEDIUM
### Impact: Soft delete won't work

### Problem Description

The `faltas` table schema does NOT include a `deleted_at` column, but the service tries to use soft delete.

### Root Cause

**Database schema** (`specs/database_scheema.yaml:57-70`):
```yaml
- name: "faltas"
  columns:
    - { name: "id", type: "UUID", ... }
    - { name: "indice_id", type: "UUID", ... }
    - { name: "tratamento_id", type: "UUID", ... }
    - { name: "tipo_id", type: "UUID", ... }
    - { name: "empresa_id", type: "UUID", ... }
    - { name: "usuario_id", type: "UUID", ... }
    - { name: "esf", type: "DECIMAL(4,2)", ... }
    - { name: "cil", type: "DECIMAL(4,2)", ... }
    - { name: "quantidade", type: "INTEGER", ... }
    - { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", ... }
    - { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", ... }
    # ❌ NO deleted_at column
```

**Service query** (`src/services/faltas/SupabaseFaltasService.ts:23-26`):
```typescript
filters: {
    deleted_at: { is: null }  // ❌ This column doesn't exist
}
```

### Affected Files

1. `specs/database_scheema.yaml` (database schema)
2. `src/services/faltas/SupabaseFaltasService.ts` (service queries)
3. Database (needs migration)

### Fix Strategy

**Option A: Add deleted_at column to faltas table** (RECOMMENDED)
- Consistent with other tables (empresas, usuarios)
- Enables soft delete for faltas
- **Pros:** Consistent pattern, data preservation
- **Cons:** Requires database migration

**Option B: Remove deleted_at filter from faltas queries**
- Use hard delete for faltas
- **Pros:** No database changes needed
- **Cons:** Inconsistent with other tables, data loss

### Implementation Plan (Option A)

#### Step 1: Update Database Schema

**File:** `specs/database_scheema.yaml`

Add `deleted_at` column to faltas table:

```yaml
- name: "faltas"
  description: "Tabela principal para registrar as faltas de lentes."
  columns:
    - { name: "id", type: "UUID", constraints: ["PRIMARY KEY", "DEFAULT gen_random_uuid()"] }
    - { name: "indice_id", type: "UUID", constraints: ["REFERENCES indices(id)"] }
    - { name: "tratamento_id", type: "UUID", constraints: ["REFERENCES tratamientos(id)"] }
    - { name: "tipo_id", type: "UUID", constraints: ["REFERENCES tipos(id)"] }
    - { name: "empresa_id", type: "UUID", constraints: ["REFERENCES empresas(id)"] }
    - { name: "usuario_id", type: "UUID", constraints: ["REFERENCES usuarios(id)"] }
    - { name: "esf", type: "DECIMAL(4,2)", constraints: ["NOT NULL"] }
    - { name: "cil", type: "DECIMAL(4,2)", constraints: ["NOT NULL"] }
    - { name: "quantidade", type: "INTEGER", constraints: ["DEFAULT 1"] }
    - { name: "deleted_at", type: "TIMESTAMP WITH TIME ZONE", description: "Soft delete" }  # NEW
    - { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", constraints: ["DEFAULT NOW()"] }
    - { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", constraints: ["DEFAULT NOW()"] }
```

#### Step 2: Create Database Migration

**File:** `migrations/add_deleted_at_to_faltas.sql` (CREATE NEW)

```sql
-- Add deleted_at column to faltas table
ALTER TABLE faltas
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX idx_faltas_deleted_at ON faltas(deleted_at);

-- Update existing records (optional)
UPDATE faltas SET deleted_at = NULL WHERE deleted_at IS NULL;
```

#### Step 3: Apply Migration

**Instructions for user:**

Run the migration in Supabase SQL Editor:

```sql
-- Copy and paste the SQL from migrations/add_deleted_at_to_faltas.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

### Validation

- [ ] Database schema updated
- [ ] Migration applied successfully
- [ ] Faltas queries work without errors
- [ ] Soft delete works for faltas

---

## Implementation Order

### Phase 1: Critical Fixes (Blockers)

1. **Issue #4: Hardcoded IDs** (CRITICAL - blocks faltas creation)
   - Update Shortages page to use AuthContext
   - Ensure AuthContext user has empresa_id
   - **Estimated time:** 30 minutes

2. **Issue #5: Missing deleted_at** (MEDIUM - blocks faltas queries)
   - Update database schema
   - Create and apply migration
   - **Estimated time:** 20 minutes

### Phase 2: Data Display Fixes

3. **Issue #1: Missing JOINs** (CRITICAL - breaks data display)
   - Extend Supabase MCP client to support JOINs
   - Update services to include JOINs
   - **Estimated time:** 45 minutes

### Phase 3: Consistency Fixes

4. **Issue #2: Old Services** (CRITICAL - unify data fetching)
   - Create missing domain hooks
   - Update pages to use domain hooks
   - **Estimated time:** 60 minutes

5. **Issue #3: Inconsistent Patterns** (HIGH - already covered in #2)
   - No additional work needed
   - **Estimated time:** 0 minutes

**Total Estimated Time:** 2 hours 35 minutes

---

## Testing Checklist

After implementing all fixes, verify:

### Functional Testing

- [ ] Login works
- [ ] Refresh logged-in page works
- [ ] Navigate all routes without errors
- [ ] Each list page renders data if present
- [ ] Empty state shows correctly when no data exists
- [ ] Can create new empresa
- [ ] Can create new usuario
- [ ] Can create new falta (Shortages page)
- [ ] Can create new compra (Purchases page)
- [ ] Can update records
- [ ] Can delete records (soft delete)
- [ ] Filters work on all pages
- [ ] Search works on all pages

### Error Handling Testing

- [ ] API unavailable state can be simulated safely
- [ ] Network errors show appropriate messages
- [ ] Validation errors show appropriate messages
- [ ] No 400 errors during normal navigation
- [ ] No 401 errors during normal navigation
- [ ] No 500 errors during normal navigation

### Data Validation

- [ ] Users page shows company names (not "Sem Empresa")
- [ ] Shortages history shows user names
- [ ] Shortages history shows treatment names
- [ ] Shortages history shows index names
- [ ] Shortages history shows type names
- [ ] All foreign key relationships are correct
- [ ] No undefined values in nested data

### Performance Testing

- [ ] No infinite requests
- [ ] No console errors
- [ ] Queries complete in reasonable time (< 2 seconds)
- [ ] Caching works correctly
- [ ] Data refreshes after mutations

---

## Rollback Plan

If any fix causes issues:

1. **Revert code changes** using git:
   ```bash
   git checkout <file>
   ```

2. **Rollback database migration** if needed:
   ```sql
   ALTER TABLE faltas DROP COLUMN deleted_at;
   DROP INDEX IF EXISTS idx_faltas_deleted_at;
   ```

3. **Test rollback** to ensure app still works

---

## Production Readiness Confirmation

After all fixes are implemented and tested, confirm:

- [ ] All critical issues resolved
- [ ] All validation checks pass
- [ ] No console errors
- [ ] No 400/401/500 errors during normal navigation
- [ ] All pages load data correctly
- [ ] All CRUD operations work
- [ ] Error handling works
- [ ] Empty states work
- [ ] Loading states work
- [ ] App is safe to deploy

---

## Next Steps

1. **Review this plan** and confirm approach
2. **Approve implementation** and switch to Code mode
3. **Implement fixes** in the order specified
4. **Test thoroughly** using the testing checklist
5. **Confirm production readiness** before deploying

---

## Questions for User

1. **For Issue #5 (deleted_at column):** Should I add the column to the database, or remove the filter from queries?

2. **For Issue #1 (JOINs):** Should I extend the MCP client to support JOINs, or use direct Supabase client for JOIN queries?

3. **For Issue #2 (Old services):** Should I create all missing domain hooks and migrate all pages, or focus on specific pages first?

Please confirm your preferences before implementation begins.
