-- ============================================================================
-- Update RLS Policies to Use auth_user_id
-- ============================================================================
-- This script updates all RLS policies for the faltas table to use
-- auth_user_id instead of usuarios.id for matching with auth.uid().
--
-- PROBLEM: Previous policies compared usuarios.id with auth.uid(), which are
-- different UUIDs and never match, causing RLS to fail completely.
--
-- SOLUTION: Use auth_user_id column which stores the actual auth.uid() value,
-- allowing RLS policies to correctly identify users.
-- ============================================================================

-- ============================================================================
-- Drop Existing Policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all faltas" ON faltas;
DROP POLICY IF EXISTS "Users can view company faltas" ON faltas;
DROP POLICY IF EXISTS "Admins can create faltas for any company" ON faltas;
DROP POLICY IF EXISTS "Users can create faltas for their company" ON faltas;
DROP POLICY IF EXISTS "Admins can update any falta" ON faltas;
DROP POLICY IF EXISTS "Users can update company faltas" ON faltas;

-- ============================================================================
-- SELECT Policies (View Faltas)
-- ============================================================================

-- Policy: Admins can view all faltas
CREATE POLICY "Admins can view all faltas"
ON faltas FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.auth_user_id = auth.uid()
        AND usuarios.role = 'Administrador'
    )
);

-- Policy: Users can view faltas from their company
CREATE POLICY "Users can view company faltas"
ON faltas FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.auth_user_id = auth.uid()
        AND usuarios.empresa_id = faltas.empresa_id
    )
);

-- ============================================================================
-- INSERT Policies (Create Faltas)
-- ============================================================================

-- Policy: Admins can create faltas for any company
CREATE POLICY "Admins can create faltas for any company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.auth_user_id = auth.uid()
        AND usuarios.role = 'Administrador'
    )
);

-- Policy: Users can create faltas for their company
CREATE POLICY "Users can create faltas for their company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.auth_user_id = auth.uid()
        AND usuarios.empresa_id = faltas.empresa_id
    )
);

-- ============================================================================
-- UPDATE Policies (Modify Faltas)
-- ============================================================================

-- Policy: Admins can update any falta
CREATE POLICY "Admins can update any falta"
ON faltas FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.auth_user_id = auth.uid()
        AND usuarios.role = 'Administrador'
    )
);

-- Policy: Users can update faltas from their company
CREATE POLICY "Users can update company faltas"
ON faltas FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.auth_user_id = auth.uid()
        AND usuarios.empresa_id = faltas.empresa_id
    )
);

-- ============================================================================
-- DELETE Policies (Remove Faltas)
-- ============================================================================

-- IMPORTANT: NO DELETE POLICY - Faltas cannot be deleted by anyone
-- This is a business rule: faltas records are permanent
-- Do NOT create any DELETE policies for this table

-- ============================================================================
-- Verification
-- ============================================================================

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
WHERE tablename = 'faltas'
ORDER BY policyname;

-- ============================================================================
-- Testing Queries (Run these to verify RLS is working)
-- ============================================================================

-- Test 1: Check current user's auth_user_id
-- Run this as a logged-in user to verify auth_user_id is populated
SELECT
    u.id as usuarios_id,
    u.auth_user_id,
    u.email,
    u.nome,
    u.role,
    u.empresa_id
FROM usuarios u
WHERE u.auth_user_id = auth.uid();

-- Test 2: Check which faltas are visible to current user
-- This should return:
-- - All faltas (if user is admin)
-- - Only company faltas (if user is regular)
SELECT
    f.id,
    f.empresa_id,
    f.usuario_id,
    f.esf,
    f.cil,
    f.quantidade,
    f.created_at
FROM faltas f
ORDER BY f.created_at DESC
LIMIT 10;

-- Test 3: Verify user role is correctly identified
SELECT
    u.role,
    u.empresa_id,
    CASE
        WHEN u.role = 'Administrador' THEN 'Should see ALL faltas'
        ELSE 'Should see ONLY company faltas'
    END as expected_visibility
FROM usuarios u
WHERE u.auth_user_id = auth.uid();

-- ============================================================================
-- Notes
-- ============================================================================
--
-- 1. All policies now use auth_user_id instead of usuarios.id
-- 2. auth_user_id stores the actual auth.uid() value from Supabase Auth
-- 3. This ensures RLS policies correctly identify users
-- 4. Admins have full visibility (all companies)
-- 5. Regular users see only their company's data
-- 6. Delete operations remain blocked (business rule)
--
-- ============================================================================
