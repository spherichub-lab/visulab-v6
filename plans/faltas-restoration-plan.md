# Faltas Page Restoration Plan
## Restore "Faltas" to LENS SHORTAGES (Remove HR/Employee Absence Logic)

---

## CRITICAL CONTEXT

The "Faltas" page has been **unauthorizedly altered** to function as an HR/employee absence management system. This is **INCORRECT**.

**"Faltas" represents LENS SHORTAGES in an optical management system.**

---

## DOMAIN RULES (MANDATORY)

A shortage record MUST contain:
- **indice** (index) - Lens refraction index
- **tipo** (lens type) - Type of lens (Incolor, Photo, etc.)
- **tratamento** (treatment/coating) - Lens coating/treatment
- **ESF** (sphere) - Sphere power
- **CIL** (cylinder) - Cylinder power
- **quantidade** (quantity) - Quantity of lenses missing

This page MUST NOT:
- Reference users absences
- Reference health, disease, HR, or job-related absences
- Contain fields like name, disease, or absence reason
- Contain "Nova falta" modal for user absences

---

## CURRENT STATE (INCORRECT - HR SYSTEM)

### HR Fields Present (MUST REMOVE):
- `usuario_nome`, `usuario_email`, `usuario_initials` - Employee information
- `tipo` with values: 'Doença' (Disease), 'Pessoal' (Personal), 'Outros' (Others)
- `data_inicio`, `data_fim` - Absence date range
- `motivo` - Reason for absence
- `status` with values: 'Pendente', 'Aprovada', 'Rejeitada' - Approval workflow

### HR Workflows Present (MUST REMOVE):
- Approve absence requests
- Reject absence requests
- Bulk approve/reject operations
- Status management (Pendente → Aprovada/Rejeitada)

### HR UI Elements (MUST REMOVE):
- Page title: "Gerenciar Faltas" (Manage Absences)
- Description: "Administre solicitações de ausência e licenças dos funcionários" (Manage employee absence and leave requests)
- "Nova Falta" modal (New Absence)
- Metrics: Total, Pendentes, Aprovadas
- User selection dropdown
- Absence type dropdown (Doença/Pessoal/Outros)
- Date range fields
- Reason field
- Status field
- Approve/Reject actions

---

## DATABASE SCHEMA (CORRECT)

From [`specs/database_scheema.yaml`](specs/database_scheema.yaml:57-70):

```yaml
- name: "faltas"
  description: "Tabela principal para registrar as faltas de lentes."
  columns:
    - id (UUID, PRIMARY KEY)
    - indice_id (UUID, REFERENCES indices(id))      # Lens refraction index
    - tratamiento_id (UUID, REFERENCES tratamientos(id)) # Lens treatment/coating
    - tipo_id (UUID, REFERENCES tipos(id))         # Lens type
    - empresa_id (UUID, REFERENCES empresas(id))   # Company
    - usuario_id (UUID, REFERENCES usuarios(id))   # User who registered shortage
    - esf (DECIMAL(4,2), NOT NULL)             # Sphere power
    - cil (DECIMAL(4,2), NOT NULL)              # Cylinder power
    - quantidade (INTEGER, DEFAULT 1)            # Quantity missing
    - created_at (TIMESTAMP)
    - updated_at (TIMESTAMP)
```

---

## CHANGES REQUIRED

### SCOPE CONTROL
**Only files related to Faltas/Shortages feature may be changed.**
- No changes to Dashboard
- No changes to other pages
- No changes to authentication
- No changes to database schema unless strictly required

---

### 1. pages/Shortages.tsx (COMPLETE REWRITE)

#### REMOVE HR Logic:
- [ ] Remove `Shortage` type with HR fields (usuario_nome, usuario_email, usuario_initials, tipo as Doença/Pessoal/Outros, data_inicio, data_fim, motivo, status)
- [ ] Remove approve/reject workflow handlers
- [ ] Remove bulk approve/reject operations
- [ ] Remove HR-specific metrics (Pendentes, Aprovadas)
- [ ] Remove "Nova Falta" modal title (change to "Nova Falta de Lente")
- [ ] Remove user selection dropdown (usuario_id should be auto-populated from current user)
- [ ] Remove absence type dropdown (Doença/Pessoal/Outros)
- [ ] Remove date range fields (data_inicio, data_fim)
- [ ] Remove reason field (motivo)
- [ ] Remove status field (Pendente/Aprovada/Rejeitada)
- [ ] Remove approve/reject actions from table
- [ ] Remove bulk approve/reject buttons
- [ ] Remove any references to "employee", "absence", "disease", "reason"

#### ADD Lens Shortage Logic:
- [ ] Create new `LensShortage` type with correct fields:
  - id
  - indice (with nome from indices table)
  - tipo (with nome from tipos table)
  - tratamento (with nome from tratamientos table)
  - esf (sphere power)
  - cil (cylinder power)
  - quantidade (quantity)
  - empresa (with nome from empresas table)
  - created_at
- [ ] Update page title to "Gerenciar Faltas de Lentes" (Manage Lens Shortages)
- [ ] Update description to "Registre e gerencie faltas de lentes no estoque" (Register and manage lens shortages in stock)
- [ ] Update table columns to show:
  - Índice (Index)
  - Tipo (Lens Type)
  - Tratamento (Treatment)
  - ESF (Sphere)
  - CIL (Cylinder)
  - Quantidade (Quantity)
  - Empresa (Company)
  - Data de Registro (Registration Date)
- [ ] Update metrics to show:
  - Total de Faltas (Total Shortages)
  - Total de Lentes Faltando (Total Missing Lenses)
- [ ] Update create/edit form to include ONLY these fields:
  - Índice (dropdown from indices table)
  - Tipo (dropdown from tipos table)
  - Tratamento (dropdown from tratamientos table)
  - ESF (number input, decimal)
  - CIL (number input, decimal)
  - Quantidade (number input, integer)
  - Empresa (dropdown from empresas table - optional, auto-populate from user's company)
  - Usuario (hidden, auto-populated from current user)
- [ ] Remove approve/reject actions, keep only Edit and Delete
- [ ] Update search/filter to search by: índice, tipo, tratamento, ESF, CIL

#### Keep Existing:
- [ ] DataTable component usage
- [ ] FormLayout component usage
- [ ] PageHeader component usage
- [ ] ConfirmActionDialog component usage
- [ ] Toast notifications
- [ ] Basic CRUD operations (Create, Read, Update, Delete)
- [ ] Role-based access control (admin: full access, user: read/write shortages only)

---

### 2. src/hooks/domain/faltas-hooks.ts (REMOVE HR HOOKS)

#### Remove HR-Specific Hooks:
- [ ] Remove `useApproveFalta()` hook
- [ ] Remove `useRejectFalta()` hook
- [ ] Remove `useUpdateFaltaStatus()` hook
- [ ] Remove `useBulkFaltasOperation()` hook
- [ ] Remove `useBatchApproveFaltas()` hook
- [ ] Remove `useBatchRejectFaltas()` hook
- [ ] Remove `useBatchDeleteFaltas()` hook
- [ ] Remove `FaltaStatus` type (Pendente/Aprovada/Rejeitada/Em Andamento/Resolvida/Cancelada)
- [ ] Remove `ApproveFaltaParams` type
- [ ] Remove `RejectFaltaParams` type
- [ ] Remove `UpdateFaltaStatusParams` type
- [ ] Remove `BulkFaltasOperationParams` type

#### Keep Existing:
- [ ] `useFaltasList()` - Fetch list of lens shortages
- [ ] `useFalta()` - Fetch single lens shortage by ID
- [ ] `useCreateFalta()` - Create new lens shortage
- [ ] `useUpdateFalta()` - Update existing lens shortage
- [ ] `useDeleteFalta()` - Delete lens shortage
- [ ] Query keys and basic structure

---

### 3. src/hooks/domain/tratamientos.ts → tratamentos.ts (RENAME FILE)

**NOTE: This file is OUTSIDE the Faltas scope but must be renamed for consistency.**

- [ ] Rename file from `tratamientos.ts` to `tratamentos.ts`
- [ ] Update all imports/exports to use "tratamentos" instead of "tratamientos"
- [ ] Update all references in the file to use "tratamento" (singular) and "tratamentos" (plural)

---

### 4. src/services/tratamientos/ → tratamentos/ (RENAME FOLDER)

**NOTE: This folder is OUTSIDE the Faltas scope but must be renamed for consistency.**

- [ ] Rename folder from `tratamientos/` to `tratamentos/`
- [ ] Rename service file from `SupabaseTratamientosService.ts` to `SupabaseTratamentosService.ts`
- [ ] Update all imports/exports to use "tratamentos" instead of "tratamientos"
- [ ] Update all references in the service to use "tratamento" (singular) and "tratamentos" (plural)

---

### 5. Update References to "tratamientos" → "tratamentos"

**NOTE: These changes are OUTSIDE the Faltas scope but must be made for consistency.**

#### In src/hooks/queries/queryKeysFactory.ts:
- [ ] Change `tratamientos: createQueryKeys<any>('tratamientos')` to `tratamentos: createQueryKeys<any>('tratamentos')`

#### In src/hooks/queries/cachePolicies.ts:
- [ ] Change `tratamientos: 'reference'` to `tratamentos: 'reference'`

#### In src/hooks/queries/queryInvalidation.ts:
- [ ] Change `tratamientos: []` to `tratamentos: []`

#### In src/services/core/ServiceRegistry.ts:
- [ ] Change import from `../tratamientos/SupabaseTratamientosService` to `../tratamentos/SupabaseTratamentosService`
- [ ] Change variable name from `supabaseTratamientosService` to `supabaseTratamentosService`

#### In src/hooks/domain/index.ts:
- [ ] Change `export * from './tratamientos'` to `export * from './tratamentos'`

#### In lib/types/database/entities.types.ts:
- [ ] Change `TRATAMENTOS: 'tratamientos'` to `TRATAMENTOS: 'tratamentos'`
- [ ] Change `tratamientos?: Tratamiento` to `tratamentos?: Tratamento`

#### In lib/types/database/generated.ts:
- [ ] Change table name from `tratamientos:` to `tratamentos:`

---

### 6. services/faltasService.ts (NO CHANGES NEEDED)

The service layer is already correct and aligned with the database schema. It provides basic CRUD operations without HR-specific logic.

#### Keep Existing:
- [ ] `getAll()` - Fetch all faltas with relations
- [ ] `getByEmpresa()` - Fetch by company
- [ ] `getById()` - Fetch by ID
- [ ] `create()` - Create new falta
- [ ] `update()` - Update existing falta
- [ ] `updateStatus()` - Update status (can be kept for future use, but not used in UI)
- [ ] `delete()` - Delete falta

---

### 7. lib/dal/repositories/faltasRepository.ts (NO CHANGES NEEDED)

The repository layer is already correct and aligned with the database schema.

#### Keep Existing:
- [ ] All existing methods are appropriate for lens shortages
- [ ] Methods like `findByTipo`, `findByIndice`, `findByTratamento` are perfect for lens shortage filtering
- [ ] Summary statistics methods are appropriate

---

### 8. src/types/domain/domain.types.ts (MINOR CHANGES)

#### Update Types:
- [ ] Update `FaltaFormData` interface to match lens shortage fields (already correct)
- [ ] Update `FaltaFilters` interface to remove HR-specific filters (already correct)
- [ ] Remove HR-specific status types if present

---

### 9. lib/types/database/generated.ts (MINOR CHANGES)

- [ ] Change table name from `tratamientos:` to `tratamentos:` (see section 5)

---

## VALIDATION CHECKLIST

After implementation, verify:

### Database Alignment:
- [ ] All fields in UI match database schema
- [ ] Foreign key relationships are correct (indice_id, tratamiento_id, tipo_id, empresa_id, usuario_id)
- [ ] No HR-specific fields remain in the code

### UI Validation:
- [ ] Page title and description reflect lens shortages
- [ ] Table shows lens specifications (índice, tipo, tratamento, ESF, CIL, quantidade)
- [ ] Form allows selecting lens attributes ONLY (Index, Type, Treatment, ESF, CIL, Lens quantity)
- [ ] No approve/reject workflow present
- [ ] No absence-related fields (data_inicio, data_fim, motivo, status)
- [ ] Metrics show lens shortage statistics
- [ ] No references to "employee", "absence", "disease", "reason"

### Naming Consistency:
- [ ] All references to "tratamientos" changed to "tratamentos"
- [ ] All references to "tratamiento" changed to "tratamento"
- [ ] Folder renamed from `tratamientos/` to `tratamentos/`
- [ ] File renamed from `tratamientos.ts` to `tratamentos.ts`
- [ ] Service file renamed from `SupabaseTratamientosService.ts` to `SupabaseTratamentosService.ts`

### Role-Based Access:
- [ ] Admin users can create, read, update, delete lens shortages
- [ ] Regular users can create, read, update, delete lens shortages (no user management)
- [ ] RLS policies are respected

### Code Quality:
- [ ] No HR/employee absence logic remains
- [ ] No references to "Doença", "Pessoal", "Outros" absence types
- [ ] No references to approval/rejection workflow
- [ ] All hooks, services, and repositories are aligned with lens shortage domain
- [ ] TypeScript types are correct

### Scope Control:
- [ ] Only Faltas/Shortages related files were modified
- [ ] No changes to Dashboard
- [ ] No changes to other pages (Companies, Users, Purchases, Login)
- [ ] No changes to authentication
- [ ] No changes to database schema

---

## IMPLEMENTATION PRIORITY

### High Priority (Must Fix - Faltas Scope):
1. **pages/Shortages.tsx** - Complete rewrite to remove all HR logic
2. **src/hooks/domain/faltas-hooks.ts** - Remove HR-specific hooks

### Medium Priority (Must Fix - Naming Consistency):
3. **src/hooks/domain/tratamientos.ts → tratamentos.ts** - Rename file
4. **src/services/tratamientos/ → tratamentos/** - Rename folder and service
5. **Update all references to "tratamientos" → "tratamentos"** - Global search/replace

### Low Priority (Verify - No Changes Expected):
6. **src/types/domain/domain.types.ts** - Ensure types are correct
7. **services/faltasService.ts** - Verify no HR logic exists
8. **lib/dal/repositories/faltasRepository.ts** - Verify no HR logic exists
9. **lib/types/database/generated.ts** - Update table name

---

## DELIVERABLES

1. **Restored pages/Shortages.tsx** - Lens shortage management page
2. **Cleaned src/hooks/domain/faltas-hooks.ts** - Only basic CRUD hooks
3. **Renamed tratamientos → tratamentos** - Consistent naming throughout codebase
4. **Verification report** - Confirming no HR/employee absence logic exists
5. **Explanation of changes** - What was changed and why

---

## CONSTRAINTS

- Keep changes minimal and scoped to the problem
- Reuse existing hooks, services, and patterns
- No mock data
- No assumptions about missing data
- No speculative improvements
- Respect existing role-based access control
- **Only files related to Faltas/Shortages feature may be changed** (except tratamientos naming which affects consistency)
- Do not modify unrelated pages, routes, or components
- Do not invent new features, entities, or business rules
- Do not change Dashboard, other pages, authentication, or database schema

---

## RISK MITIGATION

If any required data or relation is missing:
- **STOP** and report it immediately
- Do not guess or invent missing entities
- Verify database schema is complete
- Confirm all foreign key relationships exist
