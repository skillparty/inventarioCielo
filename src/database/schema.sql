-- =====================================================
-- SCHEMA COMPLETO DE BASE DE DATOS
-- =====================================================
-- Sistema: Inventario Cielo
-- Descripción: Esquema completo de base de datos PostgreSQL
-- Fecha: 2025-10-06
-- =====================================================

-- INSTRUCCIONES:
-- 1. Crear base de datos (como superusuario):
--    CREATE DATABASE inventario_db;
--
-- 2. Conectar a la base de datos:
--    \c inventario_db;
--
-- 3. Ejecutar este script completo:
--    \i src/database/schema.sql
--
-- O desde terminal:
--    psql -U postgres -d inventario_db -f src/database/schema.sql
--
-- =====================================================

-- =====================================================
-- EXTENSIONES
-- =====================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para búsqueda de texto con trigrams
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TABLA PRINCIPAL: assets
-- =====================================================

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
-- ÍNDICES
-- =====================================================

-- Índice principal en asset_id para búsquedas rápidas por ID de activo
CREATE INDEX IF NOT EXISTS idx_assets_asset_id ON assets(asset_id);

-- Índice en location para filtrar activos por ubicación
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);

-- Índice en responsible para consultas por responsable
CREATE INDEX IF NOT EXISTS idx_assets_responsible ON assets(responsible);

-- Índice en created_at para ordenamiento cronológico
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);

-- Índice compuesto para búsquedas por ubicación y responsable
CREATE INDEX IF NOT EXISTS idx_assets_location_responsible ON assets(location, responsible);

-- Índice de búsqueda de texto completo en descripción
CREATE INDEX IF NOT EXISTS idx_assets_description_trgm ON assets USING gin(description gin_trgm_ops);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Validar que asset_id no esté vacío
ALTER TABLE assets DROP CONSTRAINT IF EXISTS check_asset_id_not_empty;
ALTER TABLE assets ADD CONSTRAINT check_asset_id_not_empty 
    CHECK (LENGTH(TRIM(asset_id)) > 0);

-- Validar que description no esté vacío
ALTER TABLE assets DROP CONSTRAINT IF EXISTS check_description_not_empty;
ALTER TABLE assets ADD CONSTRAINT check_description_not_empty 
    CHECK (LENGTH(TRIM(description)) > 0);

-- Validar que responsible no esté vacío
ALTER TABLE assets DROP CONSTRAINT IF EXISTS check_responsible_not_empty;
ALTER TABLE assets ADD CONSTRAINT check_responsible_not_empty 
    CHECK (LENGTH(TRIM(responsible)) > 0);

-- Validar que location no esté vacío
ALTER TABLE assets DROP CONSTRAINT IF EXISTS check_location_not_empty;
ALTER TABLE assets ADD CONSTRAINT check_location_not_empty 
    CHECK (LENGTH(TRIM(location)) > 0);

-- =====================================================
-- FUNCIÓN Y TRIGGER PARA updated_at
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta antes de cada UPDATE
DROP TRIGGER IF EXISTS trigger_update_assets_updated_at ON assets;

CREATE TRIGGER trigger_update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE assets IS 
    'Tabla principal para almacenar información de activos del inventario';

COMMENT ON COLUMN assets.id IS 
    'Clave primaria autoincremental (uso interno del sistema)';

COMMENT ON COLUMN assets.asset_id IS 
    'Identificador único del activo visible al usuario. Formato: AST-YYYY-NNNN';

COMMENT ON COLUMN assets.description IS 
    'Descripción detallada del activo: marca, modelo, especificaciones';

COMMENT ON COLUMN assets.responsible IS 
    'Nombre completo de la persona responsable del activo';

COMMENT ON COLUMN assets.location IS 
    'Ubicación física actual del activo';

COMMENT ON COLUMN assets.qr_code_path IS 
    'Ruta del archivo PNG con el código QR generado';

COMMENT ON COLUMN assets.created_at IS 
    'Fecha y hora de creación del registro';

COMMENT ON COLUMN assets.updated_at IS 
    'Fecha y hora de última actualización (auto-actualizable)';

-- =====================================================
-- VISTAS DE CONSULTA
-- =====================================================

-- Vista: Resumen por ubicación
CREATE OR REPLACE VIEW v_assets_by_location AS
SELECT 
    location,
    COUNT(*) AS total_assets,
    COUNT(DISTINCT responsible) AS unique_responsibles,
    MIN(created_at) AS first_asset_date,
    MAX(created_at) AS last_asset_date
FROM assets
GROUP BY location
ORDER BY total_assets DESC;

COMMENT ON VIEW v_assets_by_location IS 
    'Resumen de activos agrupados por ubicación';

-- Vista: Resumen por responsable
CREATE OR REPLACE VIEW v_assets_by_responsible AS
SELECT 
    responsible,
    COUNT(*) AS total_assets,
    COUNT(DISTINCT location) AS different_locations,
    MIN(created_at) AS first_asset_date,
    MAX(created_at) AS last_asset_date
FROM assets
GROUP BY responsible
ORDER BY total_assets DESC;

COMMENT ON VIEW v_assets_by_responsible IS 
    'Resumen de activos agrupados por responsable';

-- Vista: Activos recientes (últimos 30 días)
CREATE OR REPLACE VIEW v_recent_assets AS
SELECT 
    asset_id,
    LEFT(description, 100) AS short_description,
    responsible,
    location,
    created_at
FROM assets
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY created_at DESC;

COMMENT ON VIEW v_recent_assets IS 
    'Activos registrados en los últimos 30 días';

-- =====================================================
-- TABLAS COMPLEMENTARIAS (FUTURAS EXPANSIONES)
-- =====================================================

-- Tabla de historial de movimientos (para futuras implementaciones)
-- Permite rastrear cambios de ubicación y responsable

CREATE TABLE IF NOT EXISTS asset_history (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    field_changed VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_changed_at ON asset_history(changed_at DESC);

COMMENT ON TABLE asset_history IS 
    'Historial de cambios de activos (ubicación, responsable, etc.)';

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para generar el próximo asset_id
CREATE OR REPLACE FUNCTION generate_next_asset_id()
RETURNS VARCHAR AS $$
DECLARE
    current_year INT;
    last_number INT;
    new_number INT;
    new_asset_id VARCHAR;
BEGIN
    -- Obtener el año actual
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Obtener el último número usado en este año
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(asset_id FROM 10) AS INTEGER)), 
        0
    ) INTO last_number
    FROM assets
    WHERE asset_id LIKE 'AST-' || current_year || '-%';
    
    -- Incrementar el número
    new_number := last_number + 1;
    
    -- Generar el nuevo asset_id
    new_asset_id := 'AST-' || current_year || '-' || LPAD(new_number::TEXT, 4, '0');
    
    RETURN new_asset_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_next_asset_id() IS 
    'Genera el próximo asset_id disponible en formato AST-YYYY-NNNN';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar estructura de la tabla
SELECT 'Schema creado exitosamente ✓' AS status;
