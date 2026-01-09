-- ============================================================================
-- QUICK FIX: Regular Users Dashboard Data Visibility
-- ============================================================================
-- RUN THIS IN: Supabase Dashboard → SQL Editor
-- Click "Run" button to execute
-- ============================================================================

-- STEP 1: Show current state (diagnostic)
SELECT '=== DIAGNOSTIC: Current User Status ===' as step;
SELECT
    u.email,
    u.nome,
    u.role,
    u.empresa_id,
    u.auth_user_id,
    CASE
        WHEN u.empresa_id IS NULL THEN '❌ MISSING empresa_id'
        WHEN u.auth_user_id IS NULL THEN '❌ MISSING auth_user_id'
        ELSE '✅ OK'
    END as status,
    CASE
        WHEN u.role = 'Administrador' THEN '👑 Should see ALL data'
        WHEN u.empresa_id IS NOT NULL THEN '🏢 Should see company data'
        ELSE '❌ WILL SEE NO DATA'
    END as expected_visibility
FROM usuarios u
ORDER BY u.role, u.email;

-- STEP 2: Update empresa_id for users based on email domain
SELECT '=== FIXING: Updating empresa_id ===' as step;

-- Update users with @master.com domain
UPDATE usuarios
SET empresa_id = (
    SELECT id FROM empresas
    WHERE LOWER(nome) LIKE '%master%'
    AND tipo IN ('Matriz', 'Filial')
    LIMIT 1
)
WHERE email LIKE '%@master.com'
AND empresa_id IS NULL
AND role != 'Administrador';

-- Update users with @amx.com domain
UPDATE usuarios
SET empresa_id = (
    SELECT id FROM empresas
    WHERE LOWER(nome) LIKE '%amx%'
    AND tipo IN ('Matriz', 'Filial')
    LIMIT 1
)
WHERE email LIKE '%@amx.com'
AND empresa_id IS NULL
AND role != 'Administrador';

-- Update users with @ultraoptics.com domain
UPDATE usuarios
SET empresa_id = (
    SELECT id FROM empresas
    WHERE LOWER(nome) LIKE '%ultra%'
    AND tipo IN ('Matriz', 'Filial')
    LIMIT 1
)
WHERE email LIKE '%@ultraoptics.com'
AND empresa_id IS NULL
AND role != 'Administrador';

-- Update users with @gbo.com domain
UPDATE usuarios
SET empresa_id = (
    SELECT id FROM empresas
    WHERE LOWER(nome) LIKE '%gbo%'
    AND tipo IN ('Matriz', 'Filial')
    LIMIT 1
)
WHERE email LIKE '%@gbo.com'
AND empresa_id IS NULL
AND role != 'Administrador';

-- STEP 3: Show updated state
SELECT '=== RESULT: Updated User Status ===' as step;
SELECT
    u.email,
    u.nome,
    u.role,
    u.empresa_id,
    e.nome as company_name,
    u.auth_user_id,
    CASE
        WHEN u.empresa_id IS NULL THEN '❌ STILL MISSING empresa_id'
        WHEN u.auth_user_id IS NULL THEN '⚠️  MISSING auth_user_id (manual fix needed)'
        ELSE '✅ FIXED'
    END as status
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.role != 'Administrador'
ORDER BY u.email;

-- STEP 4: Instructions for auth_user_id (if still missing)
SELECT '=== NEXT STEP: Fix auth_user_id ===' as step;
SELECT
    'Users still missing auth_user_id need manual update:' as instruction;

-- Show users missing auth_user_id
SELECT
    u.email,
    u.nome,
    'Run this SQL to fix:' as action,
    'UPDATE usuarios SET auth_user_id = ''PASTE_UUID_HERE'' || ' WHERE email = ''' || u.email || ''';' as sql_command
FROM usuarios u
WHERE u.auth_user_id IS NULL
AND u.role != 'Administrador';

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Check the "RESULT" section - empresa_id should be fixed
-- 3. For users still missing auth_user_id:
--    a. Go to Supabase Dashboard → Authentication → Users
--    b. Copy the UUID for each user
--    c. Run the UPDATE command shown in "NEXT STEP" section
-- 4. Test by logging in as a regular user and checking dashboard
-- ============================================================================
