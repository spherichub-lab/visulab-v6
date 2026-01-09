-- ============================================================================
-- Fix Faltas RLS Policies for Admin Users
-- ============================================================================
-- This script updates the RLS policies to allow admin users to create faltas
-- even when they have empresa_id = NULL (matriz admins)
-- ============================================================================

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Admins can create faltas for any company" ON faltas;
DROP POLICY IF EXISTS "Users can create faltas for their company" ON faltas;

-- Create new INSERT policy for admins that doesn't require empresa_id match
CREATE POLICY "Admins can create faltas for any company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.role = 'Administrador'
    )
);

-- Create new INSERT policy for regular users that requires empresa_id match
CREATE POLICY "Users can create faltas for their company"
ON faltas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.empresa_id = faltas.empresa_id
    )
);

-- ============================================================================
-- Verification
-- ============================================================================

-- Check if policies were created successfully
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

-- ============================================================================
-- Notes
-- ============================================================================
-- 
-- 1. Admin users can now create faltas regardless of their empresa_id
-- 2. Regular users still need to have empresa_id matching the falta's empresa_id
-- 3. This fixes the issue where matriz admins (empresa_id = NULL) couldn't create faltas
-- 4. To rollback, use the original policies from faltas-rls-policies.sql
--
-- ============================================================================
