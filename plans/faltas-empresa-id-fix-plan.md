# Faltas Visibility Fix Plan

## Problem Description

### Symptoms
1. When logged in as a regular user, only faltas registered by that user appear (missing faltas registered by admin from the same company)
2. After refreshing the dashboard as a regular user, all card data disappears
3. When logged in as administrator, both faltas appear correctly

### Root Cause Analysis

The issue is in how `empresa_id` is being populated and maintained during authentication. The filtering logic in `faltasService.getByUserVisibility()` depends on `user.empresa_id` being correctly set.

#### Current Flow:

1. **Login** ([`AuthContext.tsx:649-667`](src/contexts/AuthContext.tsx:649-667)):
   ```typescript
   const { data: userData, error: userError } = await supabase
     .from('usuarios')
     .select('empresa_id, role')
     .eq('id', session.user.id)
     .single();

   const userWithEmpresa = {
     ...session.user,
     empresa_id: userData?.empresa_id,  // ⚠️ Can be undefined if query fails
     role: userData?.role || 'Usuário',
     company: extractCompanyFromEmail(session.user.email)
   };
   ```

2. **Initialize Auth** ([`AuthContext.tsx:582-623`](src/contexts/AuthContext.tsx:582-623)):
   ```typescript
   const storedSession = SupabaseAuthService.getStoredSession();
   const storedUser = SupabaseAuthService.getStoredUser();

   if (storedSession && storedUser) {
     const userWithCompany: AuthUser = {
       ...storedUser,
       company: (storedUser as any).company || extractCompanyFromEmail(storedUser.email)
       // ⚠️ empresa_id is NOT being restored from stored user
     };
   ```

3. **Filtering** ([`faltasService.ts:13-37`](services/faltasService.ts:13-37)):
   ```typescript
   async getByUserVisibility(user: AuthUser): Promise<Falta[]> {
     const { data, error } = await supabase
       .from('faltas')
       .select(`...`)
       .order('created_at', { ascending: false });

     const faltas = data as Falta[];

     if (isAdmin(user)) {
       return faltas; // Admin sees all
     }

     // ⚠️ If user.empresa_id is undefined, this returns empty array
     return faltas.filter(falta => falta.empresa_id === user.empresa_id);
   }
   ```

4. **Dashboard** ([`Dashboard.tsx:195`](pages/Dashboard.tsx:195)):
   ```typescript
   const dbData = await faltasService.getByUserVisibility(currentUser);
   // If dbData is empty, all cards show 0 data
   ```

#### The Problem:

- When a regular user logs in, if the query to fetch `empresa_id` fails or returns `null`, it won't be set
- When the page is refreshed, `empresa_id` is not being restored from stored user data
- If `user.empresa_id` is `undefined`, the filter `falta.empresa_id === user.empresa_id` will always return `false`
- This results in an empty array being returned, causing all dashboard cards to show no data

## Solution

### Fix 1: Add Comprehensive Logging to AuthContext

Add detailed logging to track `empresa_id` during authentication flow to identify where it's being lost.

**File**: [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx)

**Changes**:
1. Add logging in `login()` function after fetching user data
2. Add logging in `initializeAuth()` function after restoring from storage
3. Add logging in `onAuthStateChange()` handler
4. Log the complete user object including `empresa_id` at each step

### Fix 2: Ensure empresa_id is Always Populated in Login

**File**: [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx)

**Changes**:
1. Add error handling for the user data query
2. If `empresa_id` is missing, throw a clear error message
3. Validate that `empresa_id` exists for non-admin users before proceeding
4. Add retry logic if the query fails

### Fix 3: Ensure empresa_id is Restored from Storage

**File**: [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx)

**Changes**:
1. In `initializeAuth()`, ensure `empresa_id` is restored from stored user
2. If `empresa_id` is missing in stored user, re-fetch it from database
3. Add validation to ensure user has valid `empresa_id` before marking as authenticated

### Fix 4: Add Error Handling in faltasService

**File**: [`services/faltasService.ts`](services/faltasService.ts)

**Changes**:
1. Add validation for `user.empresa_id` before filtering
2. If `empresa_id` is missing for non-admin user, throw a descriptive error
3. Add logging to track the filtering process
4. Return all faltas for admin users (already implemented)

### Fix 5: Add Validation in Dashboard

**File**: [`pages/Dashboard.tsx`](pages/Dashboard.tsx)

**Changes**:
1. Add validation for `currentUser.empresa_id` before calling service
2. Add error handling to display user-friendly message if `empresa_id` is missing
3. Add logging to track data fetching process

### Fix 6: Improve SupabaseAuthService Storage

**File**: Check `SupabaseAuthService` implementation

**Changes**:
1. Ensure `empresa_id` is included in stored user data
2. Ensure `empresa_id` is persisted correctly in localStorage
3. Verify that `empresa_id` is included when storing user data

## Implementation Steps

### Step 1: Add Logging to AuthContext
- Add console.log statements in `login()` function
- Add console.log statements in `initializeAuth()` function
- Add console.log statements in `onAuthStateChange()` handler
- Log complete user object at each step

### Step 2: Fix Login Function
- Wrap user data query in try-catch
- Add validation for `empresa_id` existence
- Throw clear error if `empresa_id` is missing for non-admin users
- Add retry logic for failed queries

### Step 3: Fix InitializeAuth Function
- Restore `empresa_id` from stored user
- If missing, re-fetch from database
- Validate user has valid `empresa_id` before dispatching AUTH_LOGIN_SUCCESS

### Step 4: Fix faltasService
- Add validation for `user.empresa_id`
- Throw descriptive error if missing
- Add logging for filtering process

### Step 5: Fix Dashboard
- Add validation before calling service
- Add error handling for missing `empresa_id`
- Display user-friendly error message

### Step 6: Test with Both User Types
- Test login as administrator
- Test login as regular user
- Verify `empresa_id` is correctly set for both
- Test refresh for both user types

### Step 7: Verify Faltas Visibility
- Test that admin sees all faltas
- Test that regular user sees all faltas from their company
- Verify dashboard data persists after refresh

## Expected Outcome

After implementing these fixes:

1. ✅ Regular users will see ALL faltas from their company (not just their own)
2. ✅ Dashboard data will persist after page refresh
3. ✅ Admin users will continue to see all faltas from all companies
4. ✅ Clear error messages if `empresa_id` is missing
5. ✅ Comprehensive logging to debug any future issues

## Testing Checklist

- [ ] Login as administrator and verify `empresa_id` is set
- [ ] Login as regular user and verify `empresa_id` is set
- [ ] Create falta as administrator and verify it appears in dashboard
- [ ] Create falta as regular user and verify it appears in dashboard
- [ ] Login as regular user and verify both faltas appear (admin's and user's)
- [ ] Refresh dashboard as regular user and verify data persists
- [ ] Refresh dashboard as administrator and verify data persists
- [ ] Check console logs to verify `empresa_id` is being tracked correctly
- [ ] Test error handling by temporarily removing `empresa_id` from database

## Files to Modify

1. [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx)
   - Add logging to `login()` function
   - Add logging to `initializeAuth()` function
   - Add logging to `onAuthStateChange()` handler
   - Fix `empresa_id` population in `login()`
   - Fix `empresa_id` restoration in `initializeAuth()`

2. [`services/faltasService.ts`](services/faltasService.ts)
   - Add validation for `user.empresa_id`
   - Add error handling
   - Add logging

3. [`pages/Dashboard.tsx`](pages/Dashboard.tsx)
   - Add validation for `currentUser.empresa_id`
   - Add error handling
   - Add logging

## Notes

- The `empresa_id` field is critical for proper faltas visibility
- It must be populated during login and maintained across page refreshes
- The filtering logic depends on it being correctly set
- Admin users don't need `empresa_id` as they see all faltas
- Regular users MUST have `empresa_id` set to see their company's faltas
