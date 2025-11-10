-- =====================================================
-- MIGRATION 003: Add name field to assets table
-- =====================================================
-- Description: Add name field to support asset naming system
-- Date: 2025-11-09
-- =====================================================

-- Add name field (nombre del activo)
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update existing records to have a name based on description
UPDATE assets 
SET name = LEFT(description, 100) 
WHERE name IS NULL;

-- Make name NOT NULL after populating existing records
ALTER TABLE assets 
ALTER COLUMN name SET NOT NULL;

-- Create index on name for searching
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);

-- Add comment
COMMENT ON COLUMN assets.name IS 'Nombre del activo (título corto)';

SELECT 'Migration 003 completed successfully - name field added' AS status;
