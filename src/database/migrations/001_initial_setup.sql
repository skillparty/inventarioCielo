-- =====================================================
-- MIGRACIÓN 001: Crear tabla assets
-- =====================================================
-- Descripción: Migración inicial para crear la tabla de activos del sistema
-- Autor: Sistema de Inventario Cielo
-- Fecha: 2025-10-06
-- Ejecutar: psql -U postgres -d inventario_db -f src/database/migrations/001_initial_setup.sql
-- =====================================================

-- Eliminar tabla si existe (solo para desarrollo/testing)
-- DROP TABLE IF EXISTS assets CASCADE;

-- =====================================================
-- TABLA PRINCIPAL: assets
-- =====================================================
-- Almacena toda la información de los activos del inventario
-- con identificadores únicos y códigos QR para seguimiento

CREATE TABLE IF NOT EXISTS assets (
    -- Clave primaria autoincremental
    id SERIAL PRIMARY KEY,
    
    -- ID del activo visible al usuario (formato: AST-YYYY-NNNN)
    -- Este es el identificador que aparecerá en reportes y etiquetas
    asset_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- Descripción detallada del activo
    -- Puede incluir marca, modelo, especificaciones técnicas, etc.
    description TEXT NOT NULL,
    
    -- Persona responsable del activo
    -- Nombre completo del empleado a cargo
    responsible VARCHAR(255) NOT NULL,
    
    -- Ubicación física del activo
    -- Puede ser: oficina, almacén, sucursal, departamento, etc.
    location VARCHAR(255) NOT NULL,
    
    -- Ruta del archivo PNG con el código QR
    -- Se almacena la ruta relativa: /qr_codes/AST-2025-0001.png
    qr_code_path VARCHAR(500),
    
    -- Timestamp de creación del registro
    -- Se establece automáticamente al insertar
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamp de última actualización
    -- Se actualiza automáticamente con trigger
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE BÚSQUEDAS
-- =====================================================

-- Índice principal en asset_id para búsquedas rápidas por ID de activo
-- Este será el campo más consultado en operaciones CRUD
CREATE INDEX IF NOT EXISTS idx_assets_asset_id ON assets(asset_id);

-- Índice en location para filtrar activos por ubicación
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);

-- Índice en responsible para consultas por responsable
CREATE INDEX IF NOT EXISTS idx_assets_responsible ON assets(responsible);

-- Índice en created_at para ordenamiento cronológico
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);

-- Índice compuesto para búsquedas por ubicación y responsable
CREATE INDEX IF NOT EXISTS idx_assets_location_responsible ON assets(location, responsible);

-- =====================================================
-- CONSTRAINTS ADICIONALES
-- =====================================================

-- Constraint para validar que asset_id no esté vacío
ALTER TABLE assets ADD CONSTRAINT check_asset_id_not_empty 
    CHECK (LENGTH(TRIM(asset_id)) > 0);

-- Constraint para validar que description no esté vacío
ALTER TABLE assets ADD CONSTRAINT check_description_not_empty 
    CHECK (LENGTH(TRIM(description)) > 0);

-- Constraint para validar que responsible no esté vacío
ALTER TABLE assets ADD CONSTRAINT check_responsible_not_empty 
    CHECK (LENGTH(TRIM(responsible)) > 0);

-- Constraint para validar que location no esté vacío
ALTER TABLE assets ADD CONSTRAINT check_location_not_empty 
    CHECK (LENGTH(TRIM(location)) > 0);

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================

-- Función que actualiza el campo updated_at al momento de UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Establecer updated_at con el timestamp actual
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER PARA AUTO-ACTUALIZAR updated_at
-- =====================================================

-- Trigger que se ejecuta antes de cada UPDATE en la tabla assets
DROP TRIGGER IF EXISTS trigger_update_assets_updated_at ON assets;

CREATE TRIGGER trigger_update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS DESCRIPTIVOS
-- =====================================================

COMMENT ON TABLE assets IS 
    'Tabla principal para almacenar información de activos del inventario. Incluye identificadores únicos, responsables y ubicaciones.';

COMMENT ON COLUMN assets.id IS 
    'Clave primaria autoincremental (uso interno del sistema)';

COMMENT ON COLUMN assets.asset_id IS 
    'Identificador único del activo visible al usuario. Formato: AST-YYYY-NNNN';

COMMENT ON COLUMN assets.description IS 
    'Descripción detallada del activo: marca, modelo, especificaciones, condición';

COMMENT ON COLUMN assets.responsible IS 
    'Nombre completo de la persona responsable del activo';

COMMENT ON COLUMN assets.location IS 
    'Ubicación física actual del activo (oficina, almacén, sucursal, etc.)';

COMMENT ON COLUMN assets.qr_code_path IS 
    'Ruta del archivo PNG con el código QR generado para este activo';

COMMENT ON COLUMN assets.created_at IS 
    'Fecha y hora de creación del registro';

COMMENT ON COLUMN assets.updated_at IS 
    'Fecha y hora de última actualización (se actualiza automáticamente)';

-- =====================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

-- Mostrar información de la tabla creada
\d assets

-- Listar índices creados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'assets';

-- Confirmar creación exitosa
SELECT 'Migración 001 ejecutada exitosamente ✓' AS status;
