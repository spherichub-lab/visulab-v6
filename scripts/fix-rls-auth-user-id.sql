-- ============================================================================
-- Fix RLS Visibility Issue - Add auth_user_id Column
-- ============================================================================
-- This script adds an auth_user_id column to the usuarios table to properly
-- link Supabase Auth users with the public.usuarios table.
--
-- PROBLEM: Current RLS policies compare usuarios.id with auth.uid(), which are
-- different UUIDs and never match, causing RLS to fail completely.
--
-- SOLUTION: Add auth_user_id column that stores the actual auth.uid() value,
-- allowing RLS policies to correctly identify users.
-- ============================================================================

-- 1. Add auth_user_id column to usuarios table
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create index for performance (RLS queries will use this)
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);

-- 3. Populate auth_user_id for existing users
-- We match by email since we can't use the broken ID matching
UPDATE usuarios u
SET auth_user_id = au.id
FROM auth.users au
WHERE u.email = au.email
AND u.auth_user_id IS NULL;

-- 4. Make auth_user_id NOT NULL after populating
-- This ensures all future users must have an auth_user_id
ALTER TABLE usuarios
ALTER COLUMN auth_user_id SET NOT NULL;

-- 5. Add unique constraint to prevent duplicates
-- One auth user can only be linked to one application user
ALTER TABLE usuarios
ADD CONSTRAINT usuarios_auth_user_id_unique UNIQUE (auth_user_id);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check that auth_user_id is populated for all users
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

-- ============================================================================
-- Notes
-- ============================================================================
--
-- 1. This script preserves all existing data - no data loss
-- 2. The REFERENCES clause ensures referential integrity with auth.users
-- 3. ON DELETE CASCADE ensures cleanup when auth user is deleted
-- 4. The index ensures fast RLS query performance
-- 5. The unique constraint prevents duplicate auth user assignments
--
-- ============================================================================
