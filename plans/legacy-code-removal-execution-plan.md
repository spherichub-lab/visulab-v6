# Legacy Code Removal Execution Plan

**Based on:** Phase 6 Production Architecture Decision
**Date:** 2025-12-31
**Status:** Ready for Execution

---

## Executive Summary

This plan provides a step-by-step execution guide to remove legacy REST-based code (ApiClient, BaseService, ServiceFactory) while maintaining Supabase MCP as the single data layer. The plan ensures zero functional regressions through validation checkpoints at each stage.

---

## Architecture Decision Summary

### Key Decision Points
1. **ApiClient** - DELETE entirely (Supabase SDK handles HTTP, auth, token refresh)
2. **ServiceFactory** - DELETE entirely (Services are simple singletons)
3. **BaseService (API)** - DELETE entirely (No REST abstraction needed)
4. **BaseService (services/base/)** - KEEP (Provides validation, logging, error handling utilities)
5. **ServiceRegistry** - REFACTOR to remove ServiceFactory dependency
6. **SupabaseMcpClient** - KEEP as single data access layer

---

## File Impact Analysis

### Files to DELETE (14 files)

#### Core Legacy Files (4 files)
1. `src/lib/apiClient.ts` - HTTP client with interceptors
2. `src/lib/apiClientConfig.ts` - ApiClient configuration
3. `src/services/api/baseService.ts` - REST base class
4. `src/services/api/index.ts` - API base exports

#### ServiceFactory (1 file)
5. `src/services/core/ServiceFactory.ts` - Factory pattern implementation

#### REST Service Implementations (7 files)
6. `src/services/empresas/EmpresasService.ts` - REST empresas service
7. `src/services/usuarios/UsuariosService.ts` - REST usuarios service
8. `src/services/faltas/FaltasService.ts` - REST faltas service
9. `src/services/compras/ComprasService.ts` - REST compras service
10. `src/services/indices/IndicesService.ts` - REST indices service
11. `src/services/tipos/TiposService.ts` - REST tipos service
12. `src/services/tratamientos/TratamientosService.ts` - REST tratamientos service

#### Test Files (2 files)
13. `tests/unit/lib/apiClient.test.ts` - ApiClient unit tests
14. `tests/utils/authMocks.ts` - MockApiClient (partial removal)

### Files to REFACTOR (10 files)

#### Service Layer (3 files)
1. `src/services/core/ServiceRegistry.ts` - Remove ServiceFactory dependency
2. `src/services/index.ts` - Remove legacy service exports
3. `src/index.ts` - Remove ApiClient exports

#### Library Exports (1 file)
4. `src/lib/index.ts` - Remove ApiClient exports

#### Hooks Layer (2 files)
5. `src/hooks/queries/useGenericQuery.ts` - Remove BaseService dependency
6. `src/hooks/queries/useGenericMutation.ts` - Remove BaseService dependency

#### Utility Files (2 files)
7. `src/utils/errorHandler.ts` - Remove ApiClient usage
8. `tests/utils/authMocks.ts` - Update/remove MockApiClient

#### Test Files (2 files)
9. `tests/unit/utils/errorHandler.test.ts` - Update ApiClient tests
10. `tests/utils/authMocks.ts` - Remove MockApiClient

### Files to KEEP (unchanged)

- `services/base/baseService.ts` - Utility base class (validation, logging, error handling)
- `lib/integration/supabase/supabaseMcpClient.ts` - Data layer
- `lib/supabase.ts` - Supabase client
- All `Supabase*Service` implementations
- All domain hooks (`src/hooks/domain/*.ts`)
- `src/contexts/AuthContext.tsx` - Already uses SupabaseAuthService

---

## Execution Plan

### Phase 1: Preparation and Safety Checks

#### Step 1.1: Create Backup Branch
```bash
git checkout -b legacy-code-removal
```

**Validation:**
- [ ] Branch created successfully
- [ ] Current branch is `legacy-code-removal`

#### Step 1.2: Verify Current State
```bash
npm run build
npm run test
npm run dev
```

**Validation:**
- [ ] Build succeeds without errors
- [ ] All tests pass
- [ ] Dev server starts successfully
- [ ] App loads and functions correctly

**Checkpoint 1: Baseline Verification**
- Document any existing warnings or errors
- Record test results
- Verify app functionality (login, CRUD operations)

---

### Phase 2: Update ServiceRegistry (Remove ServiceFactory Dependency)

#### Step 2.1: Refactor ServiceRegistry Constructor
**File:** `src/services/core/ServiceRegistry.ts`

**Changes:**
1. Remove `serviceFactory` parameter from constructor
2. Remove `initializeServices()` method
3. Remove private service instance fields (empresasService, etc.)
4. Remove import of `ServiceFactory`
5. Remove import of `BaseService`
6. Remove import of REST service implementations (EmpresasServiceImpl, etc.)

**New Implementation:**
```typescript
import { supabaseEmpresasService } from '../empresas/SupabaseEmpresasService';
import { supabaseUsuariosService } from '../usuarios/SupabaseUsuariosService';
import { supabaseFaltasService } from '../faltas/SupabaseFaltasService';
import { supabaseComprasService } from '../compras/SupabaseComprasService';
import { supabaseIndicesService } from '../indices/SupabaseIndicesService';
import { supabaseTiposService } from '../tipos/SupabaseTiposService';
import { supabaseTratamientosService } from '../tratamientos/SupabaseTratamientosService';

export class ServiceRegistry {
    private static instance: ServiceRegistry | null = null;

    private constructor() {
        // No initialization needed - services are imported as singletons
    }

    public static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    // Service getters return direct singleton imports
    public getEmpresasService() {
        return supabaseEmpresasService;
    }

    public getUsuariosService() {
        return supabaseUsuariosService;
    }

    // ... other getters unchanged

    public static resetInstance(): void {
        ServiceRegistry.instance = null;
    }
}
```

**Validation:**
- [ ] File compiles without TypeScript errors
- [ ] No import errors for Supabase services

#### Step 2.2: Update ServiceRegistry Call Sites
**Files to check:**
- `src/hooks/domain/*.ts` (all domain hooks)

**Action:** Verify that ServiceRegistry is called without ServiceFactory parameter

**Validation:**
- [ ] All ServiceRegistry.getInstance() calls have no parameters
- [ ] No TypeScript errors in domain hooks

**Checkpoint 2: ServiceRegistry Refactored**
- [ ] ServiceRegistry compiles
- [ ] No ServiceFactory imports remain in ServiceRegistry
- [ ] All domain hooks compile

---

### Phase 3: Remove Legacy Service Exports

#### Step 3.1: Update src/services/index.ts
**File:** `src/services/index.ts`

**Changes:**
```typescript
// BEFORE:
export { ServiceFactory } from './core/ServiceFactory';
export { ServiceRegistry } from './core/ServiceRegistry';
export { BaseService } from './api/baseService';

// AFTER:
export { ServiceRegistry } from './core/ServiceRegistry';
// Remove ServiceFactory and BaseService exports
```

**Validation:**
- [ ] File compiles
- [ ] No references to removed exports

#### Step 3.2: Update src/index.ts
**File:** `src/index.ts`

**Changes:**
```typescript
// BEFORE:
export { ApiClient, getApiClient, resetApiClient } from './lib/apiClient';
export { BaseService } from './services/api/baseService';

// AFTER:
// Remove ApiClient and BaseService exports
```

**Validation:**
- [ ] File compiles
- [ ] No import errors in consuming files

#### Step 3.3: Update src/lib/index.ts
**File:** `src/lib/index.ts`

**Changes:**
```typescript
// BEFORE:
export { ApiClient, getApiClient, resetApiClient } from './apiClient';

// AFTER:
// Remove ApiClient exports
```

**Validation:**
- [ ] File compiles
- [ ] No external references to ApiClient

**Checkpoint 3: Exports Updated**
- [ ] All index files compile
- [ ] No references to deleted exports
- [ ] Build succeeds

---

### Phase 4: Update Hooks Layer (Remove BaseService Dependency)

#### Step 4.1: Refactor useGenericQuery.ts
**File:** `src/hooks/queries/useGenericQuery.ts`

**Changes:**
1. Remove import of `BaseService` from `../../services/api/baseService`
2. Remove import of `Entity` from `../../services/api/baseService`
3. Update function signatures to accept `any` service type

**New Implementation:**
```typescript
// Remove these imports:
// import { BaseService, Entity } from '../../services/api/baseService';

// Update function signatures:
export function useGenericListQuery<T>(
    entityType: string,
    service: any,  // Changed from BaseService<T>
    options?: QueryOptions,
    queryOptions?: UseGenericQueryOptions<PaginatedResponse<T>, Error>
): UseQueryResult<PaginatedResponse<T>, Error> {
    // ... rest unchanged
}

export function useGenericDetailQuery<T>(
    entityType: string,
    id: string,
    service: any,  // Changed from BaseService<T>
    queryOptions?: UseGenericQueryOptions<T, Error>
): UseQueryResult<T, Error> {
    // ... rest unchanged
}

// ... similar changes for all other functions
```

**Validation:**
- [ ] File compiles
- [ ] No TypeScript errors

#### Step 4.2: Refactor useGenericMutation.ts
**File:** `src/hooks/queries/useGenericMutation.ts`

**Changes:**
1. Remove import of `BaseService` from `../../services/api/baseService`
2. Remove import of `Entity` from `../../services/api/baseService`
3. Update function signatures to accept `any` service type

**New Implementation:**
```typescript
// Remove these imports:
// import { BaseService, Entity } from '../../services/api/baseService';

// Update function signatures:
export function useGenericCreateMutation<T, C = any>(
    entityType: string,
    service: any,  // Changed from BaseService<T, C>
    options?: UseGenericMutationOptions<T, Error, C>
): UseMutationResult<T, Error, C> {
    // ... rest unchanged
}

// ... similar changes for all other functions
```

**Validation:**
- [ ] File compiles
- [ ] No TypeScript errors

**Checkpoint 4: Hooks Layer Refactored**
- [ ] All hook files compile
- [ ] No BaseService imports remain in hooks
- [ ] Build succeeds

---

### Phase 5: Update Utility Files

#### Step 5.1: Update errorHandler.ts
**File:** `src/utils/errorHandler.ts`

**Current Code (around line 321-324):**
```typescript
// Update api client with new token
const { getApiClient } = await import('../lib/apiClient');
const apiClient = getApiClient();
apiClient.setAuthToken(session.accessToken);
```

**Changes:**
```typescript
// Remove ApiClient usage - Supabase handles token management automatically
// Token refresh is handled by Supabase SDK via SupabaseAuthService
```

**Validation:**
- [ ] File compiles
- [ ] No ApiClient imports

#### Step 5.2: Update errorHandler.test.ts
**File:** `tests/unit/utils/errorHandler.test.ts`

**Current Code (around line 217-228):**
```typescript
const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
const { getApiClient } = await import('@/lib/apiClient');

// ... test code

const mockApiClient = getApiClient();
const setAuthTokenSpy = vi.spyOn(mockApiClient, 'setAuthToken');
```

**Changes:**
```typescript
// Remove ApiClient mocking - Supabase handles token management
const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');

// Remove getApiClient import and setAuthTokenSpy
// Test should verify SupabaseAuthService.refreshSession() is called
```

**Validation:**
- [ ] Test file compiles
- [ ] Tests pass (after removing ApiClient assertions)

**Checkpoint 5: Utility Files Updated**
- [ ] All utility files compile
- [ ] No ApiClient references remain
- [ ] Tests pass

---

### Phase 6: Update Test Mocks

#### Step 6.1: Update authMocks.ts
**File:** `tests/utils/authMocks.ts`

**Current Code (around line 319-655):**
```typescript
/**
 * Mock ApiClient for testing
 */
export class MockApiClient {
    private authToken: string | null = null;
    // ... implementation
}

export const mockApiClient = new MockApiClient();

export {
    mockSupabaseAuthService,
    mockApiClient,
    // ...
}
```

**Changes:**
```typescript
// Remove MockApiClient class entirely
// Remove mockApiClient export

export {
    mockSupabaseAuthService,
    // ... keep other mocks
}
```

**Validation:**
- [ ] File compiles
- [ ] No references to MockApiClient in other test files

#### Step 6.2: Delete ApiClient Test File
**File:** `tests/unit/lib/apiClient.test.ts`

**Action:** Delete entire file

**Validation:**
- [ ] File deleted
- [ ] No broken imports

**Checkpoint 6: Test Files Updated**
- [ ] All test files compile
- [ ] No MockApiClient references
- [ ] Tests pass

---

### Phase 7: Delete Legacy Service Implementation Files

#### Step 7.1: Delete REST Service Files (7 files)
```bash
# Delete in this order:
rm src/services/empresas/EmpresasService.ts
rm src/services/usuarios/UsuariosService.ts
rm src/services/faltas/FaltasService.ts
rm src/services/compras/ComprasService.ts
rm src/services/indices/IndicesService.ts
rm src/services/tipos/TiposService.ts
rm src/services/tratamientos/TratamientosService.ts
```

**Validation:**
- [ ] All files deleted
- [ ] No import errors in ServiceRegistry (already refactored)
- [ ] No import errors in other files

#### Step 7.2: Delete ServiceFactory
```bash
rm src/services/core/ServiceFactory.ts
```

**Validation:**
- [ ] File deleted
- [ ] No import errors in ServiceRegistry (already refactored)
- [ ] No import errors in other files

**Checkpoint 7: Legacy Services Deleted**
- [ ] All 8 service files deleted
- [ ] No compilation errors
- [ ] Build succeeds

---

### Phase 8: Delete Core Legacy Files

#### Step 8.1: Delete ApiClient and Configuration
```bash
rm src/lib/apiClient.ts
rm src/lib/apiClientConfig.ts
```

**Validation:**
- [ ] Files deleted
- [ ] No import errors in errorHandler.ts (already refactored)
- [ ] No import errors in other files

#### Step 8.2: Delete API BaseService
```bash
rm src/services/api/baseService.ts
rm src/services/api/index.ts
```

**Validation:**
- [ ] Files deleted
- [ ] No import errors in hooks (already refactored)
- [ ] No import errors in other files

**Checkpoint 8: Core Legacy Files Deleted**
- [ ] All 4 core files deleted
- [ ] No compilation errors
- [ ] Build succeeds

---

### Phase 9: Final Validation and Testing

#### Step 9.1: Full Build Verification
```bash
npm run build
```

**Validation:**
- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] No warnings about missing exports

#### Step 9.2: Run All Tests
```bash
npm run test
```

**Validation:**
- [ ] All tests pass
- [ ] No failing tests due to missing ApiClient
- [ ] No failing tests due to missing BaseService

#### Step 9.3: Start Dev Server
```bash
npm run dev
```

**Validation:**
- [ ] Dev server starts successfully
- [ ] No console errors on startup
- [ ] App loads correctly

#### Step 9.4: Functional Testing
**Test Scenarios:**
1. **Authentication Flow**
   - [ ] Login works
   - [ ] Logout works
   - [ ] Session persistence works
   - [ ] Token refresh works (automatic via Supabase)

2. **CRUD Operations**
   - [ ] Create empresa works
   - [ ] Read empresas list works
   - [ ] Update empresa works
   - [ ] Delete empresa works
   - [ ] Repeat for usuarios, faltas, compras, indices, tipos, tratamientos

3. **Query Caching**
   - [ ] React Query caching works
   - [ ] Query invalidation works
   - [ ] Optimistic updates work (where implemented)

4. **Error Handling**
   - [ ] Network errors are handled
   - [ ] Validation errors are displayed
   - [ ] Business logic errors are displayed

5. **RLS Enforcement**
   - [ ] Users can only access their own data
   - [ ] Unauthorized access is blocked

**Checkpoint 9: Final Validation Complete**
- [ ] All functional tests pass
- [ ] No regressions detected
- [ ] App is production-ready

---

### Phase 10: Cleanup and Documentation

#### Step 10.1: Remove Empty Directories
```bash
# Check if src/services/api/ is empty
ls src/services/api/

# If empty, remove it
rmdir src/services/api/
```

**Validation:**
- [ ] Empty directories removed
- [ ] No broken imports

#### Step 10.2: Update Documentation
**Files to Update:**
1. `README.md` - Remove ApiClient references
2. `service-layer-architecture.md` - Update to reflect new architecture
3. `service-implementation-guide.md` - Remove REST service examples
4. `data-fetching-contract.md` - Update to use SupabaseMcpClient

**Validation:**
- [ ] Documentation updated
- [ ] No references to deleted components

#### Step 10.3: Create Migration Summary
**File:** `plans/legacy-code-removal-summary.md`

**Content:**
- List of deleted files
- List of refactored files
- Breaking changes (none expected)
- Migration notes for developers

**Checkpoint 10: Cleanup Complete**
- [ ] Documentation updated
- [ ] Migration summary created
- [ ] Code is clean and ready for production

---

## Validation Checkpoints Summary

| Checkpoint | Description | Validation Criteria |
|-----------|-------------|---------------------|
| 1 | Baseline Verification | Build passes, tests pass, app works |
| 2 | ServiceRegistry Refactored | No ServiceFactory dependency, compiles |
| 3 | Exports Updated | No deleted exports, build passes |
| 4 | Hooks Layer Refactored | No BaseService dependency, compiles |
| 5 | Utility Files Updated | No ApiClient references, tests pass |
| 6 | Test Files Updated | No MockApiClient, tests pass |
| 7 | Legacy Services Deleted | 8 files deleted, no errors |
| 8 | Core Legacy Files Deleted | 4 files deleted, no errors |
| 9 | Final Validation Complete | All functional tests pass |
| 10 | Cleanup Complete | Documentation updated, clean code |

---

## Minimal Production Acceptance Criteria

### Must Pass (Non-negotiable)
- [ ] Application compiles without errors
- [ ] Application starts without errors
- [ ] User can login successfully
- [ ] User can logout successfully
- [ ] CRUD operations work for all entities (empresas, usuarios, faltas, compras, indices, tipos, tratamientos)
- [ ] React Query caching works
- [ ] Query invalidation works
- [ ] Error handling works (network errors, validation errors)
- [ ] RLS policies are enforced
- [ ] Session persistence works
- [ ] Token refresh works (automatic via Supabase)

### Should Pass (High Priority)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No console warnings or errors
- [ ] Performance is not degraded
- [ ] Bundle size is reduced (removed ApiClient)

### Nice to Have (Lower Priority)
- [ ] E2E tests pass
- [ ] Documentation is updated
- [ ] Code is clean (no TODOs, no commented code)

---

## Risk Mitigation

### High-Risk Areas
1. **ServiceRegistry Refactoring** - Critical for all service access
   - **Mitigation:** Test immediately after refactoring
   - **Rollback:** Keep backup branch

2. **Hooks Layer Refactoring** - Used throughout the app
   - **Mitigation:** Test all domain hooks after changes
   - **Rollback:** Revert if any hook fails

3. **ErrorHandler Updates** - Critical for error handling
   - **Mitigation:** Verify error handling still works
   - **Rollback:** Revert if errors are not handled

### Rollback Plan
If any checkpoint fails:
1. Stop execution
2. Identify the failing step
3. Revert changes from that step
4. Verify baseline functionality
5. Analyze the failure
6. Fix the issue
7. Resume execution

---

## Estimated File Changes

### Files Deleted: 14
- 4 core legacy files
- 1 ServiceFactory file
- 7 REST service implementation files
- 2 test files

### Files Refactored: 10
- 3 service layer files
- 1 library export file
- 2 hooks layer files
- 2 utility files
- 2 test files

### Lines of Code Removed: ~1500+
- ApiClient: ~500 lines
- BaseService (API): ~80 lines
- ServiceFactory: ~80 lines
- REST services: ~700 lines
- Test files: ~150 lines

---

## Success Metrics

### Quantitative
- [ ] Zero TypeScript errors
- [ ] Zero build errors
- [ ] Zero test failures
- [ ] Zero console errors
- [ ] Bundle size reduced by ~50KB (estimated)

### Qualitative
- [ ] No functional regressions
- [ ] Cleaner architecture
- [ ] Easier to maintain
- [ ] Better aligned with Supabase MCP architecture

---

## Next Steps After Completion

1. **Merge to Main Branch**
   - Create pull request
   - Get code review approval
   - Merge to main

2. **Deploy to Staging**
   - Deploy to staging environment
   - Run smoke tests
   - Monitor for errors

3. **Deploy to Production**
   - Schedule deployment window
   - Deploy to production
   - Monitor for errors
   - Verify all functionality

4. **Post-Deployment**
   - Monitor error logs
   - Check performance metrics
   - Gather user feedback
   - Address any issues

---

## Conclusion

This execution plan provides a safe, step-by-step approach to removing legacy REST-based code while maintaining Supabase MCP as the single data layer. Each phase includes validation checkpoints to ensure zero functional regressions. The plan is designed to be executed in a single work session with checkpoints at each critical step.

**Key Success Factors:**
1. Follow the order exactly
2. Validate at each checkpoint
3. Don't proceed if validation fails
4. Keep backup branch ready
5. Test thoroughly before merging

**Expected Outcome:**
- Cleaner architecture
- Reduced bundle size
- Easier maintenance
- Better alignment with Supabase MCP
- Zero functional regressions
