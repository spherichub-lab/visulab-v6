-- ============================================================================ 
-- Fix Regular Users Dashboard Data Visibility
-- ============================================================================
-- This script diagnoses and fixes issues preventing regular users from seeing
-- dashboard data by ensuring empresa_id and auth_user_id are properly set.
--
-- PROBLEM: Regular users see no data in dashboard because:
-- 1. empresa_id is NULL in usuarios table
-- 2. auth_user_id is NULL in usuarios table
-- 3. RLS policies block access when these fields are missing
--
-- SOLUTION: Populate missing fields based on user email domain
-- ============================================================================

-- ============================================================================
-- Step 1: Diagnose Current State
-- ============================================================================

-- Check all users and their empresa_id, auth_user_id, and role
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

-- Check which companies exist
SELECT
    id,
    nome,
    tipo
FROM empresas
ORDER BY tipo, nome;

-- ============================================================================
-- Step 2: Map Email Domains to Company IDs
-- ============================================================================

-- Create a mapping of email domains to company IDs
-- Adjust these IDs based on your actual company data
WITH company_mapping AS (
    SELECT
        id,
        nome,
        tipo,
        CASE
            WHEN LOWER(nome) LIKE '%master%' THEN 'master'
            WHEN LOWER(nome) LIKE '%amx%' THEN 'amx'
            WHEN LOWER(nome) LIKE '%ultra%' THEN 'ultra'
            WHEN LOWER(nome) LIKE '%gbo%' THEN 'gbo'
            ELSE NULL
        END as domain_key
    FROM empresas
    WHERE tipo IN ('Matriz', 'Filial')
)
SELECT * FROM company_mapping;

-- ============================================================================
-- Step 3: Update empresa_id for Regular Users Based on Email Domain
-- ============================================================================

-- Update users with master.com domain
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

-- Update users with amx.com domain
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

-- Update users with ultraoptics.com domain
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

-- Update users with gbo.com domain
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

-- ============================================================================
-- Step 4: Update auth_user_id for Users Based on Email
-- ============================================================================

-- NOTE: This requires access to Supabase Auth metadata
-- The auth_user_id should be populated when users are created
-- If it's missing, you need to match it with auth.users table

-- Check if we can access auth.users (this may fail depending on permissions)
-- If this fails, you'll need to manually update auth_user_id for each user

-- Example manual update (replace with actual UUIDs):
-- UPDATE usuarios
-- SET auth_user_id = 'your-auth-uuid-here'
-- WHERE email = 'user@example.com';

-- ============================================================================
-- Step 5: Verify Updates
-- ============================================================================

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

-- ============================================================================
-- Step 6: Test RLS Policies
-- ============================================================================

-- This query should return data for regular users now
-- Run this as a logged-in regular user to test
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

-- ============================================================================
-- Step 7: Manual Fix Instructions (if automated updates didn't work)
-- ============================================================================

-- If the automated updates above didn't work, you'll need to:
--
-- 1. Get the auth_user_id from Supabase Auth for each user:
--    - Go to Supabase Dashboard > Authentication > Users
--    - Copy the UUID for each user
--
-- 2. Get the empresa_id from the empresas table:
--    SELECT id, nome FROM empresas WHERE tipo IN ('Matriz', 'Filial');
--
-- 3. Update each user manually:
--    UPDATE usuarios
--    SET empresa_id = 'company-uuid-here',
--        auth_user_id = 'auth-uuid-here'
--    WHERE email = 'user@example.com';
--
-- 4. Verify the update:
--    SELECT email, empresa_id, auth_user_id, role FROM usuarios;
--
-- 5. Test by logging in as a regular user and checking the dashboard

-- ============================================================================
-- Notes
-- ============================================================================
--
-- 1. Regular users MUST have both empresa_id and auth_user_id set
-- 2. empresa_id determines which company's data they can see
-- 3. auth_user_id is required for RLS policies to identify the user
-- 4. Admin users don't need empresa_id (they see all data)
-- 5. After running this script, regular users should see their company's data
--
-- ============================================================================
