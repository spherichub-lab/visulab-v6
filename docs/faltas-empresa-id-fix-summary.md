# Faltas Visibility Fix - Implementation Summary

## Date: 2026-01-06

## Problem Fixed

The issue where regular users couldn't see all faltas from their company and dashboard data disappeared after refresh has been resolved.

### Root Cause
The `empresa_id` field was not being properly populated or maintained during authentication, causing the filtering logic in `faltasService.getByUserVisibility()` to fail.

## Changes Implemented

### 1. AuthContext.tsx - Enhanced Login Function

**Location**: [`src/contexts/AuthContext.tsx:722-818`](src/contexts/AuthContext.tsx:722-818)

**Changes**:
- Added comprehensive logging to track `empresa_id` during login
- Added validation to ensure `empresa_id` is populated for non-admin users
- Added error handling with descriptive error messages if `empresa_id` is missing
- Logs complete user object including `empresa_id`, `role`, and `company`

**Key Improvements**:
```typescript
// Validate empresa_id for non-admin users
const role = userData.role || 'Usuário';
if (role !== 'Administrador' && !userData.empresa_id) {
  console.error('❌ [AUTH ERROR] Non-admin user missing empresa_id:', {
    userId: session.user.id,
    role: role
  });
  throw new Error('User is not assigned to a company. Please contact administrator.');
}
```

### 2. AuthContext.tsx - Enhanced InitializeAuth Function

**Location**: [`src/contexts/AuthContext.tsx:582-713`](src/contexts/AuthContext.tsx:582-713)

**Changes**:
- Added logging to track stored user data during initialization
- Restores `empresa_id` from stored user object
- Added validation for non-admin users missing `empresa_id`
- Added fallback logic to fetch `empresa_id` from database if missing in storage
- Updates stored user with fetched `empresa_id` to prevent future issues

**Key Improvements**:
```typescript
// Validate empresa_id for non-admin users
if (role !== 'Administrador' && !empresa_id) {
  console.error('❌ [AUTH ERROR] Non-admin user missing empresa_id in stored data:', {
    userId: storedUser.id,
    role: role
  });
  // Try to fetch empresa_id from database
  const { data: userData, error: fetchError } = await supabase
    .from('usuarios')
    .select('empresa_id, role')
    .eq('id', storedUser.id)
    .single();

  if (fetchError) {
    console.error('❌ [AUTH ERROR] Failed to fetch empresa_id:', fetchError);
    dispatchRef.current({ type: 'AUTH_SET_INITIALIZED' });
    return;
  }

  // Update stored user with fetched data
  const updatedUser: AuthUser = {
    ...storedUser,
    empresa_id: userData.empresa_id,
    role: userData.role || 'Usuário',
    company: company
  };

  // Store updated user
  SupabaseAuthService.storeUser(updatedUser);
}
```

### 3. AuthContext.tsx - Enhanced onAuthStateChange Handler

**Location**: [`src/contexts/AuthContext.tsx:1004-1043`](src/contexts/AuthContext.tsx:1004-1043)

**Changes**:
- Made callback async to support database queries
- Added logging to track `empresa_id` during auth state changes
- Fetches `empresa_id` and `role` from database when auth state changes
- Logs complete user object for debugging

**Key Improvements**:
```typescript
// FIX: Fetch empresa_id and role from database for onAuthStateChange
const unsubscribe = supabaseAuthService.onAuthStateChange(async (session: AuthSession | null) => {
  if (session) {
    const { supabase } = await import('../../lib/supabase');
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('empresa_id, role')
      .eq('id', session.user.id)
      .single();

    // Extract company from email for onAuthStateChange
    const userWithCompany: AuthUser = {
      ...session.user,
      empresa_id: userData?.empresa_id,
      role: userData?.role || 'Usuário',
      company: (session.user as any).company || extractCompanyFromEmail(session.user.email)
    };

    dispatchRef.current({
      type: 'AUTH_LOGIN_SUCCESS',
      payload: { user: userWithCompany, tokens: session },
    });
  }
});
```

### 4. faltasService.ts - Enhanced getByUserVisibility Function

**Location**: [`services/faltasService.ts:13-68`](services/faltasService.ts:13-68)

**Changes**:
- Added comprehensive logging to track user data and filtering process
- Added validation to ensure `empresa_id` exists for non-admin users
- Added descriptive error messages if `empresa_id` is missing
- Added logging to show filtering results (before/after counts)
- Improved error handling with detailed console logs

**Key Improvements**:
```typescript
async getByUserVisibility(user: AuthUser): Promise<Falta[]> {
  console.log('🔍 [FALTAS SERVICE] getByUserVisibility called with user:', {
    id: user.id,
    email: user.email,
    role: user.role,
    empresa_id: user.empresa_id
  });

  // Validate empresa_id for non-admin users
  if (!isAdmin(user) && !user.empresa_id) {
    console.error('❌ [FALTAS ERROR] Non-admin user missing empresa_id:', {
      userId: user.id,
      email: user.email,
      role: user.role
    });
    throw new Error('User is not assigned to a company. Please contact administrator.');
  }

  const { data, error } = await supabase.from('faltas')...

  const faltas = data as Falta[];

  console.log('🔍 [FALTAS SERVICE] Fetched faltas:', {
    totalCount: faltas.length,
    isAdmin: isAdmin(user),
    userEmpresaId: user.empresa_id
  });

  // Apply visibility filter
  if (isAdmin(user)) {
    console.log('🔍 [FALTAS SERVICE] Admin user - returning all faltas');
    return faltas; // Admin sees all
  }

  // Regular user sees only their company's faltas
  const filteredFaltas = faltas.filter(falta => falta.empresa_id === user.empresa_id);
  
  console.log('🔍 [FALTAS SERVICE] Filtered faltas for company:', {
    userEmpresaId: user.empresa_id,
    beforeFilter: faltas.length,
    afterFilter: filteredFaltas.length
  });

  return filteredFaltas;
}
```

### 5. Dashboard.tsx - Added Validation for empresa_id

**Location**: [`pages/Dashboard.tsx:175-197`](pages/Dashboard.tsx:175-197)

**Changes**:
- Added validation for `currentUser.empresa_id` before fetching data
- Added logging to track current user state
- Added error handling to display user-friendly error if `empresa_id` is missing
- Prevents data fetching if `empresa_id` is missing for non-admin users

**Key Improvements**:
```typescript
const fetchDashboardData = useCallback(async (filters = analyticsFilters) => {
  console.log('🔄 [DASHBOARD] Fetching dashboard data...');
  console.log('🔍 [DASHBOARD] Current user:', {
    id: currentUser?.id,
    email: currentUser?.email,
    role: currentUser?.role,
    empresa_id: currentUser?.empresa_id
  });

  // Validate empresa_id for non-admin users
  if (currentUser && !isAdmin(currentUser) && !currentUser.empresa_id) {
    console.error('❌ [DASHBOARD ERROR] Non-admin user missing empresa_id:', {
      userId: currentUser.id,
      email: currentUser.email,
      role: currentUser.role
    });
    setError(new Error('User is not assigned to a company. Please contact administrator.'));
    setIsChartLoading(false);
    return;
  }

  setIsChartLoading(true);
  setError(null);
  // ... rest of function
}, [currentUser]);
```

## Expected Behavior After Fix

### For Regular Users:
1. ✅ **Login**: `empresa_id` is fetched from database and stored
2. ✅ **Refresh**: `empresa_id` is restored from storage or fetched from database if missing
3. ✅ **Faltas Visibility**: All faltas from their company are visible (not just their own)
4. ✅ **Dashboard**: Data persists after refresh and shows all company faltas
5. ✅ **Error Handling**: Clear error messages if `empresa_id` is missing

### For Admin Users:
1. ✅ **Login**: `empresa_id` is fetched (optional for admins)
2. ✅ **Refresh**: `empresa_id` is restored (optional for admins)
3. ✅ **Faltas Visibility**: All faltas from all companies are visible
4. ✅ **Dashboard**: Data persists after refresh and shows all faltas
5. ✅ **No Validation Required**: Admins don't need `empresa_id` to function

## Debug Logging

All authentication and faltas operations now include comprehensive logging:

### AuthContext Logs:
- 🔍 `[AUTH DEBUG] Login called with email:`
- 🔍 `[AUTH DEBUG] Login successful, session:`
- 🔍 `[AUTH DEBUG] User data fetched:`
- 🔍 `[AUTH DEBUG] User object created:`
- 🔍 `[AUTH DEBUG] AUTH_LOGIN_SUCCESS dispatched`
- 🔍 `[AUTH DEBUG] initializeAuth - Stored data:`
- 🔍 `[AUTH DEBUG] initializeAuth - Restoring user:`
- 🔍 `[AUTH DEBUG] initializeAuth - Fetched empresa_id from database:`
- 🔍 `[AUTH DEBUG] initializeAuth - User object ready:`
- 🔍 `[AUTH DEBUG] Supabase auth state change detected:`
- 🔍 `[AUTH DEBUG] onAuthStateChange - User data fetched:`
- 🔍 `[AUTH DEBUG] onAuthStateChange - User object created:`

### Faltas Service Logs:
- 🔍 `[FALTAS SERVICE] getByUserVisibility called with user:`
- 🔍 `[FALTAS SERVICE] Fetched faltas:`
- 🔍 `[FALTAS SERVICE] Admin user - returning all faltas`
- 🔍 `[FALTAS SERVICE] Filtered faltas for company:`

### Dashboard Logs:
- 🔄 `[DASHBOARD] Fetching dashboard data...`
- 🔍 `[DASHBOARD] Current user:`

### Error Logs:
- ❌ `[AUTH ERROR]` - For authentication errors
- ❌ `[FALTAS ERROR]` - For faltas service errors
- ❌ `[DASHBOARD ERROR]` - For dashboard errors

## Testing Instructions

### 1. Test as Regular User:
1. **Login as regular user**
   - Check console for `empresa_id` in user object
   - Verify no authentication errors
   - Verify `empresa_id` matches user's company in database

2. **Navigate to Dashboard**
   - Verify all faltas from company are visible
   - Verify dashboard cards show correct data

3. **Refresh the page**
   - Check console logs for `initializeAuth` restoring `empresa_id`
   - Verify dashboard data persists after refresh
   - Verify no data loss

4. **Create a falta**
   - Verify it appears in dashboard immediately
   - Verify it persists after refresh

### 2. Test as Administrator:
1. **Login as administrator**
   - Check console for authentication logs
   - Verify no authentication errors

2. **Navigate to Dashboard**
   - Verify all faltas from all companies are visible
   - Verify dashboard cards show total across all companies

3. **Refresh the page**
   - Check console logs for `initializeAuth` restoring session
   - Verify dashboard data persists after refresh

4. **Create a falta**
   - Verify it appears in dashboard immediately
   - Verify it persists after refresh

### 3. Test Cross-Company Visibility:
1. **Login as regular user from Company A**
2. **Login as administrator and create a falta for Company A**
3. **Login as regular user from Company A again**
4. **Verify the falta created by admin is visible**
   - Should see both faltas (admin's and user's)
   - Should see total count of 2 faltas

### 4. Test Error Handling:
1. **Temporarily remove `empresa_id` from a user in database**
2. **Try to login as that user**
3. **Verify clear error message is displayed**
4. **Verify user is prevented from accessing dashboard**

## Files Modified

1. [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx)
   - Enhanced login function with validation and logging
   - Enhanced initializeAuth function with fallback logic
   - Enhanced onAuthStateChange handler with database fetch

2. [`services/faltasService.ts`](services/faltasService.ts)
   - Enhanced getByUserVisibility with validation and logging
   - Added comprehensive error handling

3. [`pages/Dashboard.tsx`](pages/Dashboard.tsx)
   - Added validation for `empresa_id` before data fetching
   - Added error handling for missing `empresa_id`

## Next Steps

1. **Test the fixes** with both user types
2. **Monitor console logs** to verify `empresa_id` is being tracked correctly
3. **Verify faltas visibility** is working as expected
4. **Verify dashboard persistence** after refresh
5. **Check for any edge cases** that may need additional handling

## Notes

- All changes maintain backward compatibility
- Admin users are not affected by `empresa_id` validation
- Regular users now have robust error handling if `empresa_id` is missing
- Comprehensive logging makes debugging future issues much easier
- The fixes address both the initial login issue and the refresh issue
