# 🔧 FIX REGULAR USERS DASHBOARD - DO THIS NOW

## 📋 Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

## 📋 Step 2: Run the Fix Script

1. Open file: `scripts/QUICK_FIX_regular_users_dashboard.sql`
2. Copy the entire content
3. Paste it into the SQL Editor
4. Click the **RUN** button (▶️)

## 📋 Step 3: Check Results

After running the script, you'll see 4 sections:

### Section 1: DIAGNOSTIC
Shows current state of all users before the fix

### Section 2: FIXING
Shows that empresa_id is being updated

### Section 3: RESULT
Shows updated state - empresa_id should now be fixed (✅ FIXED)

### Section 4: NEXT STEP
Shows users still missing auth_user_id with SQL commands to fix them

## 📋 Step 4: Fix auth_user_id (if needed)

If Section 4 shows users still missing auth_user_id:

1. Go to **Supabase Dashboard → Authentication → Users**
2. For each user listed in Section 4:
   - Click on the user
   - Copy the **UUID** (the `id` field)
3. Go back to **SQL Editor**
4. Run the UPDATE command shown for that user:
   ```sql
   UPDATE usuarios SET auth_user_id = 'PASTE_UUID_HERE' WHERE email = 'user@example.com';
   ```
5. Replace `PASTE_UUID_HERE` with the actual UUID you copied

## 📋 Step 5: Test the Fix

1. Open your application in a browser
2. Log out
3. Log in as a **regular user** (not admin)
4. Navigate to **Dashboard**
5. Verify you see:
   - ✅ KPI cards with data (Total de Faltas, Faltas Hoje, etc.)
   - ✅ Charts with data (Por Índice, Por Tratamento)
   - ✅ Recent Activity with entries
   - ✅ No error messages

## ❓ What if it doesn't work?

### Problem: "empresa_id is still NULL after running script"

**Solution**: Check if company names match your email domains. The script looks for:
- `@master.com` → company with "master" in name
- `@amx.com` → company with "amx" in name
- `@ultraoptics.com` → company with "ultra" in name
- `@gbo.com` → company with "gbo" in name

If your company names are different, manually update:

```sql
-- First, find your company ID
SELECT id, nome FROM empresas WHERE tipo IN ('Matriz', 'Filial');

-- Then update users
UPDATE usuarios
SET empresa_id = 'COMPANY_UUID_HERE'
WHERE email = 'user@yourcompany.com';
```

### Problem: "Still can't see data after fixing both fields"

**Solution**: Check if RLS policies are enabled and correct:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'faltas';

-- Should show: faltas | true

-- Check if policies exist
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'faltas';
```

If RLS is disabled or policies are missing, run:

```sql
-- Enable RLS
ALTER TABLE faltas ENABLE ROW LEVEL SECURITY;

-- Re-create policies (run the entire fix-rls-policies-auth-user-id.sql script)
```

## 🎯 Summary

The fix consists of:

1. ✅ Run [`QUICK_FIX_regular_users_dashboard.sql`](scripts/QUICK_FIX_regular_users_dashboard.sql) in Supabase SQL Editor
2. ✅ Manually update `auth_user_id` if needed (instructions provided in script output)
3. ✅ Test by logging in as a regular user

After completing these steps, regular users will see their company's data in the dashboard.

---

**Need more help?** See:
- [`README_FIX_REGULAR_USERS_DASHBOARD.md`](README_FIX_REGULAR_USERS_DASHBOARD.md) - Quick start guide
- [`docs/regular-users-dashboard-data-fix-guide.md`](docs/regular-users-dashboard-data-fix-guide.md) - Detailed technical guide
