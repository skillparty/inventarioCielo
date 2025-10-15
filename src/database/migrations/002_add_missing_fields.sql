-- =====================================================
-- MIGRATION 002: Add missing fields to assets table
-- =====================================================
-- Description: Add status, category, and value fields
-- Date: 2025-10-14
-- =====================================================

-- Add status field (estado)
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Activo';

-- Add category field
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Add value field (valor)
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS value DECIMAL(12, 2) DEFAULT 0.00;

-- Add serial_number as alias for asset_id (for backward compatibility)
-- Note: serial_number will be same as asset_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='assets' AND column_name='serial_number') THEN
        ALTER TABLE assets ADD COLUMN serial_number VARCHAR(50);
        UPDATE assets SET serial_number = asset_id WHERE serial_number IS NULL;
        ALTER TABLE assets ALTER COLUMN serial_number SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);
    END IF;
END $$;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- Create index on category
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);

-- Add check constraint for status values
ALTER TABLE assets DROP CONSTRAINT IF EXISTS check_valid_status;
ALTER TABLE assets ADD CONSTRAINT check_valid_status 
    CHECK (status IN ('Activo', 'Inactivo', 'Mantenimiento'));

-- Add comments
COMMENT ON COLUMN assets.status IS 'Estado del activo: Activo, Inactivo, Mantenimiento';
COMMENT ON COLUMN assets.category IS 'Categoria del activo';
COMMENT ON COLUMN assets.value IS 'Valor monetario del activo';
COMMENT ON COLUMN assets.serial_number IS 'Numero de serie del activo (alias de asset_id)';

SELECT 'Migration 002 completed successfully' AS status;
