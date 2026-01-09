# Faltas Matriz Admin Fix - Summary

## Problem Description

Users could register faltas (shortages) when:
- ✅ Admin + Filial user = WORKS
- ❌ Admin + Matriz user = FAILS

## Root Cause Analysis

The issue was caused by **Row-Level Security (RLS) policies** blocking inserts for matriz admin users:

1. **Matriz admin users have `empresa_id = NULL`** in the database
2. The RLS policy required: `usuarios.empresa_id = faltas.empresa_id`
3. When `usuarios.empresa_id` is NULL, the comparison fails → INSERT blocked
4. Filial users have valid `empresa_id` → RLS check passes → ✅ Works

### RLS Policy (Before Fix)
```sql
CREATE POLICY "Users can create faltas for their company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.empresa_id = faltas.empresa_id  -- ❌ Fails when usuarios.empresa_id is NULL
    )
);
```

## Solution Implemented

### 1. Updated RLS Policies

Created separate policies for admins and regular users:

**For Admins:**
```sql
CREATE POLICY "Admins can create faltas for any company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.role = 'Administrador'  -- ✅ No empresa_id check
    )
);
```

**For Regular Users:**
```sql
CREATE POLICY "Users can create faltas for their company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.empresa_id = faltas.empresa_id  -- ✅ Still enforced for regular users
    )
);
```

### 2. Updated Frontend (pages/Shortages.tsx)

Added empresa selector for admin users:
- Admins can now select which empresa to register the falta for
- Regular users continue to use their assigned empresa_id
- Added validation to ensure empresa_id is provided

### 3. Enhanced Service Validation

Updated [`services/faltasService.ts`](services/faltasService.ts) to:
- Validate that `empresa_id` is provided before insert
- Provide clear error messages when empresa_id is missing
- Add comprehensive logging for debugging

### 4. Added Diagnostic Logging

Added logging to:
- [`services/faltasService.ts`](services/faltasService.ts:130-158) - Create attempts and errors
- [`pages/Shortages.tsx`](pages/Shortages.tsx:203-230) - User data before create
- [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx:764-795) - User data during login

## Files Modified

1. **`scripts/fix-faltas-rls-for-admins.sql`** - SQL script to update RLS policies
2. **`scripts/fix-faltas-rls.ts`** - TypeScript script to execute the fix
3. **`services/faltasService.ts`** - Added validation and logging
4. **`pages/Shortages.tsx`** - Added empresa selector for admins
5. **`src/contexts/AuthContext.tsx`** - Added diagnostic logging

## Deployment Instructions

### Step 1: Execute SQL Fix

Run the SQL script in your Supabase SQL Editor:

```bash
# Option 1: Run via Supabase Dashboard
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy and paste the content of scripts/fix-faltas-rls-for-admins.sql
# 3. Click "Run"

# Option 2: Run via TypeScript script
npm run tsx scripts/fix-faltas-rls.ts
```

### Step 2: Verify the Fix

After executing the SQL, verify the policies are updated:

```sql
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
WHERE tablename = 'faltas' AND cmd = 'INSERT'
ORDER BY policyname;
```

You should see two INSERT policies:
1. "Admins can create faltas for any company"
2. "Users can create faltas for their company"

### Step 3: Test the Application

1. **Test as Matriz Admin:**
   - Login as a matriz admin user
   - Go to the Shortages page
   - Select an empresa from the dropdown
   - Try to register a falta
   - ✅ Should work now

2. **Test as Filial User:**
   - Login as a filial user
   - Go to the Shortages page
   - Try to register a falta
   - ✅ Should still work

3. **Test as Regular User (Non-admin):**
   - Login as a regular user
   - Go to the Shortages page
   - Try to register a falta
   - ✅ Should work (uses their assigned empresa_id)

## Security Considerations

### What Changed:
- ✅ Admins can now create faltas for any empresa
- ✅ Admins no longer need an assigned empresa_id
- ✅ Regular users still need empresa_id matching

### What Stayed the Same:
- ✅ Regular users can only create faltas for their assigned empresa
- ✅ RLS still enforces empresa_id validation for non-admins
- ✅ Delete operations remain blocked for all users (business rule)

### Audit Trail:
All create operations are logged with:
- User ID and email
- User role
- Selected empresa_id
- Timestamp

## Rollback Procedure

If needed, rollback to original policies:

```sql
-- Drop new policies
DROP POLICY IF EXISTS "Admins can create faltas for any company" ON faltas;
DROP POLICY IF EXISTS "Users can create faltas for their company" ON faltas;

-- Restore original policies from scripts/faltas-rls-policies.sql
```

## Testing Checklist

- [ ] Matriz admin can register faltas
- [ ] Filial user can register faltas
- [ ] Regular user can register faltas
- [ ] Admins can select empresa from dropdown
- [ ] Regular users don't see empresa selector
- [ ] Error messages are clear when empresa_id is missing
- [ ] Console logs show proper debugging information

## Next Steps

1. **Monitor logs** after deployment to ensure no errors
2. **Test with real users** to confirm the fix works in production
3. **Update documentation** if needed to reflect admin capabilities
4. **Consider adding** empresa_id assignment for admins in the future (optional)

## Summary

This fix enables **all users** to register faltas by:
- Allowing admins to create faltas regardless of their empresa_id
- Providing a UI for admins to select the target empresa
- Maintaining security for regular users
- Adding comprehensive logging for debugging

The root cause was identified as a **RLS policy blocking NULL empresa_id**, which has been resolved with role-based policies.
