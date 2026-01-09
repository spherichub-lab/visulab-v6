-- ============================================================================
-- Rename tratamento_id to tratamiento_id in faltas table
-- ============================================================================
-- This script renames the column to match TypeScript types
-- ============================================================================

-- Rename column from tratamento_id to tratamiento_id
ALTER TABLE faltas 
RENAME COLUMN tratamento_id TO tratamiento_id;

-- Verify: change
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'faltas'
    AND table_schema = 'public'
    AND column_name = 'tratamiento_id';
