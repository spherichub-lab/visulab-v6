-- ============================================================================
-- Check Faltas Table Schema
-- ============================================================================
-- This script verifies the actual schema of the faltas table in the database
-- ============================================================================

-- Check if faltas table exists and its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'faltas'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if tratamiento_id column exists specifically
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'faltas' 
        AND table_schema = 'public'
        AND column_name = 'tratamiento_id'
    ) AS tratamiento_id_exists,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'faltas' 
        AND table_schema = 'public'
        AND column_name = 'tratamento_id'
    ) AS tratamento_id_exists;
