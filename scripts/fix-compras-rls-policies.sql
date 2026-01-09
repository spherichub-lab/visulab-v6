-- ============================================================================
-- Fix RLS Policies for Compras Table
-- ============================================================================
-- This script creates RLS policies for the compras table to allow
-- ALL authenticated users to view ALL purchases, regardless of company.
--
-- BUSINESS RULE: All users (admins and regular) should see purchase data
-- in the dashboard "Última Compra" card.
-- ============================================================================

-- ============================================================================
-- Enable RLS on compras table
-- ============================================================================

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Drop Existing Policies (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all compras" ON compras;
DROP POLICY IF EXISTS "Users can view company compras" ON compras;
DROP POLICY IF EXISTS "Admins can create compras" ON compras;
DROP POLICY IF EXISTS "Users can create compras" ON compras;
DROP POLICY IF EXISTS "Admins can update compras" ON compras;
DROP POLICY IF EXISTS "Users can update compras" ON compras;
DROP POLICY IF EXISTS "Admins can delete compras" ON compras;
DROP POLICY IF EXISTS "Users can delete compras" ON compras;

-- ============================================================================
-- SELECT Policies (View Compras)
-- ============================================================================

-- Policy: All authenticated users can view all compras
CREATE POLICY "All authenticated users can view all compras"
ON compras FOR SELECT
USING (
    auth.uid() IS NOT NULL
);

-- ============================================================================
-- INSERT Policies (Create Compras)
-- ============================================================================

-- Policy: All authenticated users can create compras
CREATE POLICY "All authenticated users can create compras"
ON compras FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- ============================================================================
-- UPDATE Policies (Modify Compras)
-- ============================================================================

-- Policy: All authenticated users can update compras
CREATE POLICY "All authenticated users can update compras"
ON compras FOR UPDATE
USING (
    auth.uid() IS NOT NULL
);

-- ============================================================================
-- DELETE Policies (Remove Compras)
-- ============================================================================

-- Policy: All authenticated users can delete compras
CREATE POLICY "All authenticated users can delete compras"
ON compras FOR DELETE
USING (
    auth.uid() IS NOT NULL
);

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
WHERE tablename = 'compras'
ORDER BY policyname;

-- ============================================================================
-- Testing Queries (Run these to verify RLS is working)
-- ============================================================================

-- Test 1: Check which compras are visible to current user
-- This should return ALL compras for all users
SELECT
    c.id,
    c.fornecedor,
    c.data_compra,
    c.valor_total,
    c.status,
    c.descricao,
    c.created_at
FROM compras c
ORDER BY c.data_compra DESC
LIMIT 10;

-- Test 2: Count total compras visible to current user
-- This should show the total count of ALL compras in the database
SELECT
    COUNT(*) as total_compras_visible,
    'All authenticated users should see ALL compras' as expected_behavior
FROM compras;

-- Test 3: Check the most recent purchase (for dashboard card)
SELECT
    id,
    fornecedor,
    data_compra,
    valor_total,
    status
FROM compras
ORDER BY data_compra DESC
LIMIT 1;

-- ============================================================================
-- Notes
-- ============================================================================
--
-- 1. All policies now allow ANY authenticated user (auth.uid() IS NOT NULL)
-- 2. No company-based filtering in RLS policies
-- 3. All users (admins and regular) have full visibility of all compras
-- 4. This ensures the "Última Compra" dashboard card shows data for all users
--
-- ============================================================================
