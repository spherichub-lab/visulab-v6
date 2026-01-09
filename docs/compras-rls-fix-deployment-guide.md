# Fix "Última Compra" Card Visibility - Deployment Guide

## Problem Summary

The "Última Compra" (Last Purchase) card on the dashboard was not showing data for all users. Only administrators could see purchase data, while regular users saw a dash (-) instead of the last purchase date.

## Root Cause Analysis

The issue was caused by **missing RLS (Row Level Security) policies** on the `compras` table:

1. **RLS Enabled**: The `compras` table had RLS enabled
2. **No Policies**: There were no RLS policies allowing users to read from the table
3. **Result**: When regular users tried to fetch purchase data via `comprasService.getAll()`, the database returned an empty result set due to RLS restrictions

### Evidence

- [`services/comprasService.ts`](../services/comprasService.ts:6) - The `getAll()` method fetches all purchases without any visibility logic
- [`pages/Dashboard.tsx`](../pages/Dashboard.tsx:186) - Calls `comprasService.getAll()` to populate the "Última Compra" card
- No RLS policies existed for the `compras` table (verified by searching all SQL scripts)

## Solution

Create RLS policies for the `compras` table that allow **all authenticated users** to view, create, update, and delete purchase records. This follows the same pattern used for the `faltas` table in [`scripts/fix-rls-policies-all-users.sql`](../scripts/fix-rls-policies-all-users.sql).

### Files Modified/Created

1. **Created**: [`scripts/fix-compras-rls-policies.sql`](../scripts/fix-compras-rls-policies.sql) - SQL script to create RLS policies
2. **Modified**: [`services/comprasService.ts`](../services/comprasService.ts) - Added diagnostic logging
3. **Modified**: [`pages/Dashboard.tsx`](../pages/Dashboard.tsx) - Added diagnostic logging

## Deployment Steps

### Step 1: Apply the SQL Script

Execute the SQL script to create the RLS policies:

```bash
# Option 1: Using Supabase CLI
supabase db execute --file scripts/fix-compras-rls-policies.sql

# Option 2: Using psql (direct database connection)
psql -h your-db-host -U postgres -d your-database -f scripts/fix-compras-rls-policies.sql

# Option 3: Using Supabase Dashboard
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Copy the contents of scripts/fix-compras-rls-policies.sql
# 3. Paste and execute
```

### Step 2: Verify the Fix

After applying the script, run these verification queries in the SQL Editor:

```sql
-- Check if policies are created correctly
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
WHERE tablename = 'compras'
ORDER BY policyname;
```

Expected output: 4 policies (SELECT, INSERT, UPDATE, DELETE) with name "All authenticated users can [action] compras"

```sql
-- Test that all purchases are visible
SELECT COUNT(*) as total_compras
FROM compras;
```

Expected output: Should return the total count of all purchases in the database

### Step 3: Test in the Application

1. **Clear browser cache** or open an incognito window
2. **Login as a regular user** (not an administrator)
3. **Navigate to the Dashboard**
4. **Verify the "Última Compra" card** shows the most recent purchase date instead of "-"

### Step 4: Test with Different Users

Test with multiple user accounts to ensure all users can see purchase data:

| User Type | Expected Behavior |
|-----------|-------------------|
| Administrator | ✅ Can see all purchases |
| Regular User | ✅ Can see all purchases |
| Viewer | ✅ Can see all purchases |

## Verification Checklist

- [ ] SQL script executed successfully
- [ ] RLS policies created for `compras` table
- [ ] Regular users can see purchase data in dashboard
- [ ] "Última Compra" card shows actual date instead of "-"
- [ ] No console errors in browser DevTools
- [ ] Purchase data loads correctly for all user types

## Rollback Procedure

If you need to rollback this change:

```sql
-- Disable RLS on compras table
ALTER TABLE compras DISABLE ROW LEVEL SECURITY;

-- Or, drop specific policies
DROP POLICY IF EXISTS "All authenticated users can view all compras" ON compras;
DROP POLICY IF EXISTS "All authenticated users can create compras" ON compras;
DROP POLICY IF EXISTS "All authenticated users can update compras" ON compras;
DROP POLICY IF EXISTS "All authenticated users can delete compras" ON compras;
```

## Diagnostic Logging

The following diagnostic logs have been added to help troubleshoot issues:

### comprasService.ts
```typescript
console.log('🔍 [COMPRAS SERVICE] getAll() called - fetching all purchases');
console.log('✅ [COMPRAS SERVICE] Fetched compras:', { count, data });
console.error('❌ [COMPRAS ERROR] Failed to fetch compras:', error);
```

### Dashboard.tsx
```typescript
console.log('📊 [DASHBOARD] Current user for compras fetch:', { id, email, role, empresa_id });
console.log('📊 [DASHBOARD] Data fetched:', { faltasCount, comprasCount, comprasData, faltasSample });
```

To view these logs:
1. Open browser DevTools (F12)
2. Go to the Console tab
3. Navigate to the Dashboard
4. Look for log messages prefixed with `[COMPRAS SERVICE]` and `[DASHBOARD]`

## Technical Details

### RLS Policy Structure

```sql
-- All authenticated users can view all compras
CREATE POLICY "All authenticated users can view all compras"
ON compras FOR SELECT
USING (auth.uid() IS NOT NULL);
```

This policy:
- Applies to SELECT operations (reading data)
- Allows any authenticated user (auth.uid() IS NOT NULL)
- Does not filter by company or role
- Ensures all users see all purchase data

### Why This Approach?

1. **Consistency**: Matches the existing pattern for `faltas` table
2. **Business Logic**: The dashboard cards show aggregated statistics for all users
3. **Simplicity**: No complex filtering logic needed
4. **Performance**: No JOINs or subqueries required in RLS policies

## Related Files

- [`scripts/fix-compras-rls-policies.sql`](../scripts/fix-compras-rls-policies.sql) - SQL fix script
- [`services/comprasService.ts`](../services/comprasService.ts) - Compras service
- [`pages/Dashboard.tsx`](../pages/Dashboard.tsx) - Dashboard component
- [`scripts/fix-rls-policies-all-users.sql`](../scripts/fix-rls-policies-all-users.sql) - Similar fix for faltas table

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify RLS policies are created correctly in the database
3. Test the SQL queries in the Supabase SQL Editor
4. Review the diagnostic logs in the browser console

## Summary

This fix ensures that all authenticated users can see purchase data in the "Última Compra" dashboard card by creating appropriate RLS policies for the `compras` table. The solution follows the same pattern used for the `faltas` table and maintains consistency with the existing codebase.
