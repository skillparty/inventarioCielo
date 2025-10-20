-- Migración: Agregar serial_number y otros campos necesarios a assets
-- Fecha: 2025-10-20
-- Descripción: Agrega serial_number, category, value, status a la tabla assets

-- =====================================================
-- Agregar columna serial_number (único)
-- =====================================================
ALTER TABLE assets ADD COLUMN IF NOT EXISTS serial_number VARCHAR(50) UNIQUE;

-- Crear índice para serial_number
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);

-- =====================================================
-- Agregar columna category (categoría del activo)
-- =====================================================
ALTER TABLE assets ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- =====================================================
-- Agregar columna value (valor monetario)
-- =====================================================
ALTER TABLE assets ADD COLUMN IF NOT EXISTS value DECIMAL(12, 2) DEFAULT 0;

-- =====================================================
-- Agregar columna status (estado del activo)
-- =====================================================
ALTER TABLE assets ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Activo';

-- Crear índice para status
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- =====================================================
-- Generar serial_number para registros existentes
-- =====================================================
-- Si hay registros sin serial_number, generarlos basados en asset_id
UPDATE assets 
SET serial_number = CONCAT('SN', LPAD(id::TEXT, 7, '0'))
WHERE serial_number IS NULL;

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Validar que serial_number no esté vacío
ALTER TABLE assets DROP CONSTRAINT IF EXISTS check_serial_number_not_empty;
ALTER TABLE assets ADD CONSTRAINT check_serial_number_not_empty 
    CHECK (LENGTH(TRIM(serial_number)) > 0);

-- Validar valores de status permitidos
ALTER TABLE assets DROP CONSTRAINT IF EXISTS check_status_values;
ALTER TABLE assets ADD CONSTRAINT check_status_values 
    CHECK (status IN ('Activo', 'Inactivo', 'Mantenimiento', 'Baja'));

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN assets.serial_number IS 
    'Número de serie único del activo (formato: ABC1234)';

COMMENT ON COLUMN assets.category IS 
    'Categoría del activo';

COMMENT ON COLUMN assets.value IS 
    'Valor monetario del activo';

COMMENT ON COLUMN assets.status IS 
    'Estado actual del activo (Activo, Inactivo, Mantenimiento, Baja)';

-- =====================================================
-- MENSAJE DE ÉXITO
-- =====================================================

SELECT 'Columnas serial_number, category, value y status agregadas exitosamente ✓' AS status;
