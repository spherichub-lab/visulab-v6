-- ============================================================================
-- Update RLS Policies to Allow All Users to See All Faltas
-- ============================================================================
-- This script updates RLS policies for the faltas table to allow
-- ALL authenticated users to view ALL faltas, regardless of company.
--
-- NEW BUSINESS RULE: All users (admins and regular) see all faltas
-- in dashboard cards for aggregated statistics.
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

-- Policy: All authenticated users can view all faltas
CREATE POLICY "All authenticated users can view all faltas"
ON faltas FOR SELECT
USING (
    auth.uid() IS NOT NULL
);

-- ============================================================================
-- INSERT Policies (Create Faltas)
-- ============================================================================

-- Policy: All authenticated users can create faltas
CREATE POLICY "All authenticated users can create faltas"
ON faltas FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- ============================================================================
-- UPDATE Policies (Modify Faltas)
-- ============================================================================

-- Policy: All authenticated users can update faltas
CREATE POLICY "All authenticated users can update faltas"
ON faltas FOR UPDATE
USING (
    auth.uid() IS NOT NULL
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
    auth.uid() as current_auth_uid,
    u.email,
    u.nome,
    u.role,
    u.empresa_id
FROM usuarios u
WHERE u.auth_user_id = auth.uid();

-- Test 2: Check which faltas are visible to current user
-- This should return ALL faltas for all users (not filtered by company)
SELECT
    f.id,
    f.empresa_id,
    f.usuario_id,
    f.esf,
    f.cil,
    f.quantidade,
    f.created_at,
    e.nome as empresa_nome
FROM faltas f
LEFT JOIN empresas e ON f.empresa_id = e.id
ORDER BY f.created_at DESC
LIMIT 10;

-- Test 3: Count total faltas visible to current user
-- This should show the total count of ALL faltas in the database
SELECT
    COUNT(*) as total_faltas_visible,
    'All authenticated users should see ALL faltas' as expected_behavior
FROM faltas;

-- ============================================================================
-- Notes
-- ============================================================================
--
-- 1. All policies now allow ANY authenticated user (auth.uid() IS NOT NULL)
-- 2. No company-based filtering in RLS policies
-- 3. All users (admins and regular) have full visibility of all faltas
-- 4. Delete operations remain blocked (business rule)
--
-- ============================================================================
