-- ============================================================================
-- Faltas Table Row-Level Security (RLS) Policies
-- ============================================================================
-- This file contains RLS policies for the faltas table to enforce
-- role-based visibility and access control at the database level.
--
-- IMPORTANT: Delete operations are NOT ALLOWED for any role
-- This is a business rule: faltas records are permanent
-- ============================================================================

-- Enable RLS on faltas table
ALTER TABLE faltas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies (View Faltas)
-- ============================================================================

-- Policy: Admins can view all faltas
CREATE POLICY "Admins can view all faltas"
ON faltas FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.role = 'Administrador'
    )
);

-- Policy: Users can view faltas from their company
CREATE POLICY "Users can view company faltas"
ON faltas FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
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
        WHERE usuarios.id = auth.uid()
        AND usuarios.role = 'Administrador'
    )
);

-- Policy: Users can create faltas for their company
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
-- UPDATE Policies (Modify Faltas)
-- ============================================================================

-- Policy: Admins can update any falta
CREATE POLICY "Admins can update any falta"
ON faltas FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.role = 'Administrador'
    )
);

-- Policy: Users can update faltas from their company
CREATE POLICY "Users can update company faltas"
ON faltas FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
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
-- Verification Queries
-- ============================================================================

-- Check if RLS is enabled
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
-- Notes
-- ============================================================================
-- 
-- 1. These policies work in conjunction with application-layer filtering
-- 2. Application layer is the primary enforcement mechanism
-- 3. RLS provides server-side enforcement as a security layer
-- 4. Delete operations are intentionally blocked at both layers
-- 5. To remove these policies, use:
--    DROP POLICY IF EXISTS "policy_name" ON faltas;
-- 6. To disable RLS entirely, use:
--    ALTER TABLE faltas DISABLE ROW LEVEL SECURITY;
--
-- ============================================================================
