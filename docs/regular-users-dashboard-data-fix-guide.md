# Fix Regular Users Dashboard Data Visibility

## Problem Description

Regular users (non-administrators) are not seeing any data in the dashboard. The dashboard shows empty states for all charts, cards, and recent activity sections.

## Root Cause Analysis

After analyzing the codebase, I identified three critical issues preventing regular users from seeing dashboard data:

### 1. Missing `empresa_id` in `usuarios` Table

Regular users must be assigned to a company via the `empresa_id` field in the `usuarios` table. When this field is `NULL`:

- The [`faltasService.getByUserVisibility()`](../services/faltasService.ts:13) method throws an error
- The [`Dashboard.tsx`](../pages/Dashboard.tsx:169) component catches this error and shows an empty state
- RLS policies block access because they can't determine which company's data to show

### 2. Missing `auth_user_id` in `usuarios` Table

The `auth_user_id` field stores the actual UUID from Supabase Auth (`auth.uid()`). When this field is `NULL`:

- RLS policies cannot identify the current user
- The policy check `usuarios.auth_user_id = auth.uid()` always fails
- All data access is blocked by RLS

### 3. RLS Policy Configuration

The RLS policies in [`fix-rls-policies-auth-user-id.sql`](../scripts/fix-rls-policies-auth-user-id.sql) are correctly configured to use `auth_user_id`, but they require:

- `auth_user_id` to be populated (for user identification)
- `empresa_id` to be populated (for company-based filtering)

## Solution

### Step 1: Diagnose the Issue

Run the diagnostic query in Supabase SQL Editor:

```sql
-- Check all users and their status
SELECT
    u.id,
    u.email,
    u.nome,
    u.role,
    u.empresa_id,
    u.auth_user_id,
    CASE
        WHEN u.empresa_id IS NULL THEN 'MISSING empresa_id'
        WHEN u.auth_user_id IS NULL THEN 'MISSING auth_user_id'
        ELSE 'OK'
    END as status,
    CASE
        WHEN u.role = 'Administrador' THEN 'Should see ALL data'
        WHEN u.empresa_id IS NOT NULL THEN 'Should see company data'
        ELSE 'WILL SEE NO DATA'
    END as expected_visibility
FROM usuarios u
ORDER BY u.role, u.email;
```

### Step 2: Update `empresa_id` for Regular Users

Run the SQL script [`fix-regular-users-dashboard-data.sql`](../scripts/fix-regular-users-dashboard-data.sql) in Supabase SQL Editor:

```bash
# Option 1: Run the complete automated script
# Open Supabase Dashboard > SQL Editor
# Paste the contents of: scripts/fix-regular-users-dashboard-data.sql
# Click "Run"
```

This script will:
1. Map email domains to company IDs (e.g., `@master.com` → Master company)
2. Update `empresa_id` for regular users based on their email domain
3. Verify the updates

**Manual Alternative** (if automated script doesn't work):

```sql
-- First, get company IDs
SELECT id, nome FROM empresas WHERE tipo IN ('Matriz', 'Filial');

-- Then update each user manually
UPDATE usuarios
SET empresa_id = 'COMPANY_UUID_HERE'
WHERE email = 'user@company.com'
AND role != 'Administrador';
```

### Step 3: Update `auth_user_id` for Regular Users

**Option 1: Automated Script (Recommended)**

```bash
# Install dependencies (if not already installed)
npm install dotenv @supabase/supabase-js

# Add service role key to .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> .env.local

# Run the script
npx tsx scripts/fix-regular-users-auth-user-id.ts
```

**Option 2: Manual Update**

1. Go to Supabase Dashboard → Authentication → Users
2. For each user, copy their UUID (the `id` field)
3. Run SQL for each user:

```sql
UPDATE usuarios
SET auth_user_id = 'AUTH_UUID_HERE'
WHERE email = 'user@example.com';
```

### Step 4: Verify the Fix

After applying the fixes, verify with these queries:

```sql
-- Check updated users
SELECT
    u.id,
    u.email,
    u.nome,
    u.role,
    u.empresa_id,
    e.nome as company_name,
    u.auth_user_id,
    CASE
        WHEN u.empresa_id IS NULL THEN 'STILL MISSING empresa_id'
        WHEN u.auth_user_id IS NULL THEN 'STILL MISSING auth_user_id'
        ELSE 'FIXED'
    END as status
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.role != 'Administrador'
ORDER BY u.email;

-- Test RLS by logging in as a regular user
-- This should return data for their company
SELECT
    f.id,
    f.empresa_id,
    e.nome as company_name,
    f.esf,
    f.cil,
    f.quantidade,
    f.created_at
FROM faltas f
LEFT JOIN empresas e ON f.empresa_id = e.id
ORDER BY f.created_at DESC
LIMIT 10;
```

### Step 5: Test in Application

1. Log out of the application
2. Log in as a regular user
3. Navigate to the Dashboard
4. Verify that:
   - KPI cards show data (Total de Faltas, Faltas Hoje, etc.)
   - Charts display data (Por Índice, Por Tratamento)
   - Recent Activity section shows entries
   - No error messages appear

## Technical Details

### How the Dashboard Fetches Data

The [`Dashboard.tsx`](../pages/Dashboard.tsx:159) component uses [`fetchDashboardData()`](../pages/Dashboard.tsx:159) which:

1. Validates that non-admin users have `empresa_id` (line 169-178)
2. Calls [`faltasService.getByUserVisibility(currentUser)`](../pages/Dashboard.tsx:198)
3. Filters data based on user role and company

### How the Service Filters Data

The [`faltasService.getByUserVisibility()`](../services/faltasService.ts:13) method:

1. Validates `empresa_id` for non-admin users (line 22-29)
2. Fetches all faltas with relationships (line 31-41)
3. Filters by company for regular users (line 63)
4. Returns all faltas for admins (line 59)

### How RLS Policies Work

The RLS policies in [`fix-rls-policies-auth-user-id.sql`](../scripts/fix-rls-policies-auth-user-id.sql):

1. **Admin Policy**: Checks if user's role is 'Administrador'
   ```sql
   EXISTS (
       SELECT 1 FROM usuarios
       WHERE usuarios.auth_user_id = auth.uid()
       AND usuarios.role = 'Administrador'
   )
   ```

2. **Regular User Policy**: Checks if user's `empresa_id` matches
   ```sql
   EXISTS (
       SELECT 1 FROM usuarios
       WHERE usuarios.auth_user_id = auth.uid()
       AND usuarios.empresa_id = faltas.empresa_id
   )
   ```

## Common Issues and Solutions

### Issue: "User is not assigned to a company" Error

**Cause**: Regular user has `NULL` `empresa_id`

**Solution**: Update `empresa_id` in the `usuarios` table

### Issue: RLS Blocks All Data

**Cause**: `auth_user_id` is `NULL` or doesn't match `auth.uid()`

**Solution**: Update `auth_user_id` with the correct UUID from Supabase Auth

### Issue: User Sees No Data But No Error

**Cause**: Company has no faltas records, or RLS is blocking access

**Solution**: 
1. Verify `empresa_id` and `auth_user_id` are set correctly
2. Check if company has faltas records
3. Test RLS with the verification queries above

### Issue: Automated Script Fails

**Cause**: Missing dependencies or incorrect environment variables

**Solution**:
1. Install dependencies: `npm install dotenv @supabase/supabase-js`
2. Check `.env.local` has required variables
3. For auth_user_id updates, you may need service role key

## Prevention

To prevent this issue in the future:

1. **User Creation**: When creating users via Supabase Auth, immediately create the corresponding `usuarios` record with:
   - `auth_user_id` = `auth.uid()`
   - `empresa_id` = appropriate company ID
   - `role` = appropriate role

2. **User Registration**: If implementing self-registration, ensure:
   - `auth_user_id` is populated from the auth event
   - `empresa_id` is set based on email domain or user selection
   - Default role is set appropriately

3. **Data Validation**: Add database constraints:
   ```sql
   ALTER TABLE usuarios
   ADD CONSTRAINT check_empresa_id_for_regular_users
   CHECK (
     role = 'Administrador' OR empresa_id IS NOT NULL
   );
   ```

## Related Files

- [`pages/Dashboard.tsx`](../pages/Dashboard.tsx) - Dashboard component
- [`services/faltasService.ts`](../services/faltasService.ts) - Faltas data service
- [`src/contexts/AuthContext.tsx`](../src/contexts/AuthContext.tsx) - Authentication context
- [`lib/utils/visibility/visibilityHelpers.ts`](../lib/utils/visibility/visibilityHelpers.ts) - Visibility utilities
- [`scripts/fix-rls-policies-auth-user-id.sql`](../scripts/fix-rls-policies-auth-user-id.sql) - RLS policies
- [`scripts/fix-regular-users-dashboard-data.sql`](../scripts/fix-regular-users-dashboard-data.sql) - Fix script
- [`scripts/fix-regular-users-auth-user-id.ts`](../scripts/fix-regular-users-auth-user-id.ts) - Auth user ID fix script

## Summary

The dashboard data visibility issue for regular users is caused by missing `empresa_id` and `auth_user_id` fields in the `usuarios` table. The fix involves:

1. ✅ Diagnosing which users are missing these fields
2. ✅ Populating `empresa_id` based on email domain
3. ✅ Populating `auth_user_id` from Supabase Auth
4. ✅ Verifying the fixes work correctly

After applying these fixes, regular users should be able to see their company's data in the dashboard, while admin users continue to see all data across all companies.
