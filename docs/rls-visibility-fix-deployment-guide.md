# RLS Visibility Fix - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the RLS visibility fix that addresses three critical issues:

1. **Issue 1**: "N/A" in "Atividade Recente" card for matriz users
2. **Issue 2**: Filial users see no data at all
3. **Issue 3**: Admin dropdown for company selection (verified as working correctly - feature, not bug)

## Prerequisites

- Access to Supabase Dashboard (https://supabase.com/dashboard)
- Database access with SQL editor privileges
- Backup of current database (recommended)
- No active users in the system (recommended, or schedule maintenance window)

## Pre-Deployment Checklist

- [ ] Read and understand the `plans/rls-visibility-fix-plan.md`
- [ ] Verify that all code changes are deployed (see "Code Changes Verification" section below)
- [ ] Create a backup of the current database
- [ ] Notify users of scheduled maintenance window
- [ ] Have rollback plan ready (see "Rollback Procedure" section)

## Code Changes Verification

Before executing SQL scripts, verify that the following code changes are deployed:

### 1. AuthUser Interface
**File**: `src/types/api/api.types.ts` (line 64)
```typescript
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    company?: string;
    role: 'Administrador' | 'Usuário';
    avatarUrl?: string;
    empresa_id?: string;
    auth_user_id?: string;  // ✅ This should be present
}
```

### 2. AuthContext
**File**: `src/contexts/AuthContext.tsx`

The following lines should fetch `auth_user_id`:
- Line 606: `auth_user_id: (storedUser as any).auth_user_id`
- Line 622: `auth_user_id: (storedUser as any).auth_user_id`
- Line 636: `.select('empresa_id, role, auth_user_id')`
- Line 654: `auth_user_id: userData.auth_user_id`
- Line 664: `auth_user_id: userData.auth_user_id`
- Line 687: `auth_user_id: (storedUser as any).auth_user_id`
- Line 749: `.select('empresa_id, role, auth_user_id')`
- Line 758: `auth_user_id: userData?.auth_user_id`
- Line 779: `auth_user_id: userData.auth_user_id`
- Line 797: `auth_user_id: userData.auth_user_id`
- Line 814: `auth_user_id: userWithEmpresa.auth_user_id`
- Line 1046: `.select('empresa_id, role, auth_user_id')`
- Line 1055: `auth_user_id: userData?.auth_user_id`
- Line 1068: `auth_user_id: userData?.auth_user_id`

### 3. usuariosService
**File**: `services/usuariosService.ts` (lines 72-76)
```typescript
// Step 2: Create user in public.usuarios with same ID and auth_user_id
const usuarioComId = {
    ...usuario,
    id: userId,
    auth_user_id: userId, // ✅ Store auth.uid() for RLS policies
};
```

### 4. faltasService
**File**: `services/faltasService.ts`

The service should rely on RLS policies at the database level. The `getByUserVisibility` method should:
- Query faltas with all related data (usuarios, empresas, etc.)
- Let RLS policies handle filtering at the database level
- Return filtered results without application-layer filtering (or keep as safety net)

## Deployment Steps

### Step 1: Execute Schema Migration Script

1. Open Supabase Dashboard
2. Navigate to your project
3. Go to **SQL Editor** (in the left sidebar)
4. Open the file `scripts/fix-rls-auth-user-id.sql`
5. Copy the entire content of the file
6. Paste it into the SQL Editor
7. Click **Run** to execute the script

**What this script does:**
- Adds `auth_user_id` column to `usuarios` table
- Creates an index for performance
- Populates `auth_user_id` for existing users by matching email
- Makes `auth_user_id` NOT NULL
- Adds unique constraint to prevent duplicates

**Expected Output:**
```
Success. No rows returned
```

**Verification Queries:**
The script includes verification queries at the end. Run them to confirm:
- All users have `auth_user_id` populated
- No users have `auth_user_id` as NULL

### Step 2: Execute RLS Policy Update Script

1. In the same SQL Editor (or open a new query)
2. Open the file `scripts/fix-rls-policies-auth-user-id.sql`
3. Copy the entire content of the file
4. Paste it into the SQL Editor
5. Click **Run** to execute the script

**What this script does:**
- Drops all existing RLS policies for `faltas` table
- Creates new RLS policies using `auth_user_id` instead of `usuarios.id`
- Policies for SELECT, INSERT, and UPDATE operations
- Admins can view all faltas from all companies
- Regular users can only view faltas from their company

**Expected Output:**
```
Success. No rows returned
```

**Verification Queries:**
The script includes verification queries at the end. Run them to confirm:
- Policies are created correctly
- Test queries return expected results

### Step 3: Test the Application

After executing both SQL scripts, test the application:

#### Test 1: Matriz User
1. Login as a matriz user
2. Navigate to Dashboard
3. Verify all dashboard cards show data:
   - [ ] "Total de Faltas" shows count
   - [ ] "Faltas Hoje" shows count
   - [ ] "Maior Falta" shows data
   - [ ] "Última Compra" shows date
   - [ ] **"Atividade Recente" shows user names (not "N/A")**

#### Test 2: Filial User
1. Login as a filial user
2. Navigate to Dashboard
3. Verify all dashboard cards show data:
   - [ ] "Total de Faltas" shows count for filial's company
   - [ ] "Faltas Hoje" shows count for filial's company
   - [ ] "Maior Falta" shows data for filial's company
   - [ ] "Última Compra" shows date
   - [ ] "Atividade Recente" shows user names

#### Test 3: Admin User
1. Login as an admin user
2. Navigate to Dashboard
3. Verify company filter works:
   - [ ] Can select "Todas" (all companies)
   - [ ] Can select specific filial
   - [ ] Can select matriz
   - [ ] Dashboard cards update based on selection
4. Navigate to "Faltas" page
5. Verify company dropdown appears:
   - [ ] Can select different companies
   - [ ] Faltas are created for selected company

#### Test 4: Cross-Company Visibility
1. Login as a filial user from Company A
2. Create a falta
3. Login as another filial user from Company A
4. Verify they can see the falta created by the first user
5. Login as a filial user from Company B
6. Verify they CANNOT see the falta from Company A

#### Test 5: Admin Full Visibility
1. Login as admin
2. Verify they can see faltas from all companies
3. Verify they can create faltas for any company

## Post-Deployment Verification

### Database Level Verification

Run these queries in Supabase SQL Editor:

```sql
-- Verify auth_user_id is populated for all users
SELECT
    u.id as usuarios_id,
    u.auth_user_id,
    u.email,
    u.nome,
    u.empresa_id,
    u.role,
    CASE
        WHEN u.auth_user_id IS NULL THEN 'MISSING'
        ELSE 'OK'
    END as auth_user_id_status
FROM usuarios u
ORDER BY u.email;

-- Count users with and without auth_user_id
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as users_with_auth_id,
    COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as users_without_auth_id
FROM usuarios;
```

**Expected Results:**
- All users should have `auth_user_id_status` = 'OK'
- `users_without_auth_id` should be 0

```sql
-- Verify RLS policies are created correctly
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'faltas'
ORDER BY policyname;
```

**Expected Results:**
- 6 policies should be listed:
  - "Admins can view all faltas" (SELECT)
  - "Users can view company faltas" (SELECT)
  - "Admins can create faltas for any company" (INSERT)
  - "Users can create faltas for their company" (INSERT)
  - "Admins can update any falta" (UPDATE)
  - "Users can update company faltas" (UPDATE)
- All policies should use `auth_user_id` in their conditions

### Application Level Verification

Check browser console for any errors:
- [ ] No authentication errors
- [ ] No RLS errors
- [ ] No "User is not assigned to a company" errors for valid users
- [ ] Dashboard loads without errors
- [ ] All cards display data correctly

## Rollback Procedure

If issues arise after deployment, follow these steps to rollback:

### Step 1: Drop New RLS Policies

```sql
DROP POLICY IF EXISTS "Admins can view all faltas" ON faltas;
DROP POLICY IF EXISTS "Users can view company faltas" ON faltas;
DROP POLICY IF EXISTS "Admins can create faltas for any company" ON faltas;
DROP POLICY IF EXISTS "Users can create faltas for their company" ON faltas;
DROP POLICY IF EXISTS "Admins can update any falta" ON faltas;
DROP POLICY IF EXISTS "Users can update company faltas" ON faltas;
```

### Step 2: Restore Original RLS Policies

Run the original RLS policies script:
```sql
-- Run scripts/faltas-rls-policies.sql
```

### Step 3: Drop auth_user_id Column (Optional)

You can keep the `auth_user_id` column for future use, or drop it:

```sql
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_auth_user_id_unique;
ALTER TABLE usuarios DROP COLUMN IF EXISTS auth_user_id;
DROP INDEX IF EXISTS idx_usuarios_auth_user_id;
```

### Step 4: Restore Code Changes

If needed, revert code changes:
- Remove `auth_user_id` from `AuthUser` interface
- Remove `auth_user_id` fetching from `AuthContext`
- Remove `auth_user_id` from `usuariosService.create` method
- Revert `faltasService` to use application-layer filtering

## Troubleshooting

### Issue: auth_user_id is NULL for some users

**Symptom**: Verification query shows users with `auth_user_id_status` = 'MISSING'

**Solution**:
```sql
-- Manually populate auth_user_id for missing users
UPDATE usuarios u
SET auth_user_id = au.id
FROM auth.users au
WHERE u.email = au.email
AND u.auth_user_id IS NULL;
```

### Issue: RLS policies not working

**Symptom**: Users see no data or see data from other companies

**Solution**:
1. Verify policies are created correctly (run verification query)
2. Check that `auth_user_id` is populated for all users
3. Check browser console for RLS errors
4. Verify user's `role` and `empresa_id` are correct

### Issue: "Atividade Recente" still shows "N/A"

**Symptom**: User names are not displayed in "Atividade Recente" card

**Solution**:
1. Verify RLS policies are using `auth_user_id`
2. Check that `usuarios` table JOIN is working in the query
3. Verify `item.usuarios?.nome` is being used in Dashboard component
4. Check browser console for any errors

### Issue: Filial users still see no data

**Symptom**: Filial users see empty dashboard cards

**Solution**:
1. Verify `auth_user_id` is populated for filial users
2. Verify filial users have `empresa_id` set
3. Verify RLS policy "Users can view company faltas" is created
4. Test RLS policy with SQL query:
```sql
-- Test as filial user
SELECT
    f.id,
    f.empresa_id,
    f.usuario_id,
    f.esf,
    f.cil,
    f.quantidade
FROM faltas f
ORDER BY f.created_at DESC
LIMIT 10;
```

## Monitoring

After deployment, monitor the following:

### Application Metrics
- Dashboard load times
- Number of authentication errors
- Number of RLS errors in console
- User reports of visibility issues

### Database Metrics
- Query performance (should be fast with `auth_user_id` index)
- Number of failed RLS policy checks
- Data consistency across companies

## Success Criteria

The deployment is successful when:

1. ✅ All users (matriz and filial) see data in all dashboard cards
2. ✅ "Atividade Recente" shows user names instead of "N/A"
3. ✅ Filial users see data from their company
4. ✅ Regular users see all faltas from their company (not just their own)
5. ✅ Admin users can see all faltas from all companies
6. ✅ Admin users can filter by company on Dashboard
7. ✅ Admin users can select company on "Faltas" page
8. ✅ No RLS errors in browser console
9. ✅ No authentication errors
10. ✅ Cross-company visibility is properly restricted

## Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review the `plans/rls-visibility-fix-plan.md` for detailed implementation details
3. Check browser console for error messages
4. Review Supabase logs for database errors
5. Contact the development team if issues persist

## Notes

- This fix preserves all existing data - no data loss
- The `auth_user_id` column is indexed for optimal RLS query performance
- Application-layer filtering can be kept as a safety net or removed
- The fix is backward compatible with existing users
- The unique constraint on `auth_user_id` prevents duplicate assignments

---

**Last Updated**: 2025-01-07
**Version**: 1.0
**Status**: Ready for Deployment
