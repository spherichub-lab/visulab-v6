# Fix Regular Users Dashboard Data - Quick Start

## 🚨 Problem

Regular users (non-administrators) see **NO DATA** in the dashboard. All charts, cards, and recent activity sections appear empty.

## ✅ Solution

The issue is caused by missing `empresa_id` and `auth_user_id` fields in the `usuarios` table. Follow these steps to fix it:

## 📋 Step-by-Step Instructions

### Step 1: Diagnose the Issue

1. Go to Supabase Dashboard → SQL Editor
2. Run this diagnostic query:

```sql
SELECT
    u.email,
    u.nome,
    u.role,
    u.empresa_id,
    u.auth_user_id,
    CASE
        WHEN u.empresa_id IS NULL THEN 'MISSING empresa_id'
        WHEN u.auth_user_id IS NULL THEN 'MISSING auth_user_id'
        ELSE 'OK'
    END as status
FROM usuarios u
ORDER BY u.role, u.email;
```

3. Look for users with status "MISSING empresa_id" or "MISSING auth_user_id"

### Step 2: Fix `empresa_id` (Company Assignment)

**Option A: Automated Script (Recommended)**

1. Open file: [`scripts/fix-regular-users-dashboard-data.sql`](scripts/fix-regular-users-dashboard-data.sql)
2. Copy the entire SQL content
3. Paste into Supabase SQL Editor
4. Click "Run"

This will automatically assign users to companies based on their email domain:
- `@master.com` → Master company
- `@amx.com` → AMX company
- `@ultraoptics.com` → Ultra Optics company
- `@gbo.com` → GBO company

**Option B: Manual Update**

```sql
-- First, get company IDs
SELECT id, nome FROM empresas WHERE tipo IN ('Matriz', 'Filial');

-- Then update each user
UPDATE usuarios
SET empresa_id = 'COMPANY_UUID_HERE'
WHERE email = 'user@company.com';
```

### Step 3: Fix `auth_user_id` (Auth User Mapping)

**Option A: Automated Script (Recommended)**

```bash
# Install dependencies (if needed)
npm install dotenv @supabase/supabase-js

# Add service role key to .env.local
# Get it from: Supabase Dashboard → Project Settings → API
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> .env.local

# Run the script
npx tsx scripts/fix-regular-users-auth-user-id.ts
```

**Option B: Manual Update**

1. Go to Supabase Dashboard → Authentication → Users
2. For each user, copy their UUID (the `id` field)
3. Run SQL for each user:

```sql
UPDATE usuarios
SET auth_user_id = 'AUTH_UUID_HERE'
WHERE email = 'user@example.com';
```

### Step 4: Verify the Fix

Run this verification query:

```sql
SELECT
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
```

All regular users should show status "FIXED".

### Step 5: Test in Application

1. Log out of the application
2. Log in as a regular user
3. Navigate to Dashboard
4. Verify that:
   - ✅ KPI cards show data (Total de Faltas, Faltas Hoje, etc.)
   - ✅ Charts display data (Por Índice, Por Tratamento)
   - ✅ Recent Activity section shows entries
   - ✅ No error messages appear

## 🔍 What's the Root Cause?

Regular users need two fields in the `usuarios` table:

1. **`empresa_id`** - Which company they belong to
   - Determines which company's data they can see
   - Required for non-admin users

2. **`auth_user_id`** - Link to Supabase Auth
   - Stores the actual UUID from Supabase Auth (`auth.uid()`)
   - Required for RLS policies to identify the user

When these fields are missing:
- The dashboard validation fails ([`Dashboard.tsx:169`](pages/Dashboard.tsx:169))
- The service throws an error ([`faltasService.ts:22`](services/faltasService.ts:22))
- RLS policies block all data access

## 📚 Detailed Documentation

For complete technical details, see:
- [`docs/regular-users-dashboard-data-fix-guide.md`](docs/regular-users-dashboard-data-fix-guide.md)

## 🛠️ Related Files

- [`scripts/fix-regular-users-dashboard-data.sql`](scripts/fix-regular-users-dashboard-data.sql) - Automated empresa_id fix
- [`scripts/fix-regular-users-auth-user-id.ts`](scripts/fix-regular-users-auth-user-id.ts) - Automated auth_user_id fix
- [`scripts/fix-rls-policies-auth-user-id.sql`](scripts/fix-rls-policies-auth-user-id.sql) - RLS policies
- [`pages/Dashboard.tsx`](pages/Dashboard.tsx) - Dashboard component
- [`services/faltasService.ts`](services/faltasService.ts) - Faltas data service

## ❓ Common Issues

### "User is not assigned to a company" error

**Cause**: Regular user has `NULL` `empresa_id`

**Fix**: Update `empresa_id` in `usuarios` table (Step 2)

### RLS blocks all data

**Cause**: `auth_user_id` is `NULL` or doesn't match `auth.uid()`

**Fix**: Update `auth_user_id` with correct UUID from Supabase Auth (Step 3)

### Automated script fails

**Cause**: Missing dependencies or incorrect environment variables

**Fix**:
1. Install: `npm install dotenv @supabase/supabase-js`
2. Check `.env.local` has required variables
3. For auth_user_id updates, you may need service role key

## ✅ Prevention

To prevent this issue in the future:

1. **When creating users**: Always set both `empresa_id` and `auth_user_id`
2. **User registration**: Ensure these fields are populated during signup
3. **Add validation**: Consider adding database constraints

```sql
-- Add constraint to ensure empresa_id is set for regular users
ALTER TABLE usuarios
ADD CONSTRAINT check_empresa_id_for_regular_users
CHECK (
  role = 'Administrador' OR empresa_id IS NOT NULL
);
```

## 🎯 Summary

The dashboard data visibility issue is fixed by:

1. ✅ Diagnosing which users are missing `empresa_id` and `auth_user_id`
2. ✅ Populating `empresa_id` based on email domain
3. ✅ Populating `auth_user_id` from Supabase Auth
4. ✅ Verifying fixes work correctly

After applying these fixes, regular users will see their company's data in the dashboard, while admin users continue to see all data across all companies.

---

**Need help?** Check the detailed guide at [`docs/regular-users-dashboard-data-fix-guide.md`](docs/regular-users-dashboard-data-fix-guide.md)
