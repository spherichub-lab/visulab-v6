-- ============================================================================
-- Fix RLS Policies to Allow JOIN with usuarios Table
-- ============================================================================
-- This script fixes RLS policies to allow JOINs between faltas and
-- related tables (usuarios, empresas, tipos, indices, tratamentos).
--
-- PROBLEM: When querying faltas with JOINs, the RLS on related tables
-- blocks the JOIN, returning null for usuarios, empresas, etc.
--
-- SOLUTION: Disable RLS for SELECT on related tables OR create policies
-- that allow JOINs from faltas table.
-- ============================================================================

-- ============================================================================
-- Option 1: Disable RLS for SELECT on related tables (RECOMMENDED)
-- ============================================================================

-- Disable RLS for SELECT on usuarios table (allows JOINs)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON usuarios;

-- Create policy that allows all authenticated users to read usuarios
CREATE POLICY "Allow authenticated users to read usuarios for JOINs"
ON usuarios FOR SELECT
USING (
    auth.uid() IS NOT NULL
);

-- Disable RLS for SELECT on empresas table (allows JOINs)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own company" ON empresas;

-- Create policy that allows all authenticated users to read empresas for JOINs
CREATE POLICY "Allow authenticated users to read empresas for JOINs"
ON empresas FOR SELECT
USING (
    auth.uid() IS NOT NULL
);

-- Disable RLS for SELECT on tipos table (allows JOINs)
ALTER TABLE tipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view tipos" ON tipos;

-- Create policy that allows all authenticated users to read tipos for JOINs
CREATE POLICY "Allow authenticated users to read tipos for JOINs"
ON tipos FOR SELECT
USING (
    auth.uid() IS NOT NULL
);

-- Disable RLS for SELECT on indices table (allows JOINs)
ALTER TABLE indices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view indices" ON indices;

-- Create policy that allows all authenticated users to read indices for JOINs
CREATE POLICY "Allow authenticated users to read indices for JOINs"
ON indices FOR SELECT
USING (
    auth.uid() IS NOT NULL
);

-- Disable RLS for SELECT on tratamentos table (allows JOINs)
ALTER TABLE tratamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view tratamentos" ON tratamentos;

-- Create policy that allows all authenticated users to read tratamentos for JOINs
CREATE POLICY "Allow authenticated users to read tratamentos for JOINs"
ON tratamentos FOR SELECT
USING (
    auth.uid() IS NOT NULL
);

-- ============================================================================
-- Keep faltas table policy (already created in previous script)
-- ============================================================================

-- Note: faltas table should already have the policy from fix-rls-policies-all-users.sql
-- If not, uncomment the following:

-- DROP POLICY IF EXISTS "All authenticated users can view all faltas" ON faltas;
-- CREATE POLICY "All authenticated users can view all faltas"
-- ON faltas FOR SELECT
-- USING (
--     auth.uid() IS NOT NULL
-- );

-- ============================================================================
-- Verification
-- ============================================================================

-- Check RLS status on all tables
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('faltas', 'usuarios', 'empresas', 'tipos', 'indices', 'tratamentos')
ORDER BY tablename;

-- Check policies on all tables
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('faltas', 'usuarios', 'empresas', 'tipos', 'indices', 'tratamentos')
ORDER BY tablename, policyname;

-- ============================================================================
-- Testing Queries (Run these to verify JOINs work)
-- ============================================================================

-- Test 1: Check if JOIN with usuarios works
-- This should return faltas with usuarios data (not null)
SELECT
    f.id,
    f.usuario_id,
    f.esf,
    f.cil,
    f.created_at,
    u.id as usuarios_id,
    u.nome as usuarios_nome,
    u.email as usuarios_email,
    e.nome as empresa_nome
FROM faltas f
LEFT JOIN usuarios u ON f.usuario_id = u.id
LEFT JOIN empresas e ON f.empresa_id = e.id
ORDER BY f.created_at DESC
LIMIT 5;

-- Test 2: Check full JOIN with all related tables
-- This should return all related data (not null)
SELECT
    f.id,
    f.esf,
    f.cil,
    f.quantidade,
    u.nome as usuario_nome,
    u.email as usuario_email,
    e.nome as empresa_nome,
    t.nome as tipo_nome,
    i.nome as indice_nome,
    tr.nome as tratamento_nome
FROM faltas f
LEFT JOIN usuarios u ON f.usuario_id = u.id
LEFT JOIN empresas e ON f.empresa_id = e.id
LEFT JOIN tipos t ON f.tipo_id = t.id
LEFT JOIN indices i ON f.indice_id = i.id
LEFT JOIN tratamentos tr ON f.tratamiento_id = tr.id
ORDER BY f.created_at DESC
LIMIT 3;

-- ============================================================================
-- Notes
-- ============================================================================
--
-- 1. RLS is enabled on all related tables
-- 2. Policies allow all authenticated users to read from these tables
-- 3. This allows JOINs from faltas table to work correctly
-- 4. All users can now see faltas with full related data
--
-- ============================================================================
