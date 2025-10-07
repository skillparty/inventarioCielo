-- =====================================================
-- SCRIPT DE INICIALIZACIÓN COMPLETA
-- =====================================================
-- Descripción: Script maestro para inicializar la base de datos completa
-- Autor: Sistema de Inventario Cielo
-- Fecha: 2025-10-06
-- =====================================================

-- INSTRUCCIONES DE USO:
-- 
-- 1. Crear la base de datos (ejecutar como superusuario postgres):
--    CREATE DATABASE inventario_db;
--
-- 2. Conectar a la base de datos:
--    \c inventario_db
--
-- 3. Ejecutar este script:
--    \i src/database/init.sql
--
-- O desde la terminal:
--    psql -U postgres -d inventario_db -f src/database/init.sql
--
-- =====================================================

\echo '================================================'
\echo '🚀 INICIANDO CONFIGURACIÓN DE BASE DE DATOS'
\echo '================================================'
\echo ''

-- =====================================================
-- PASO 1: Crear extensiones necesarias
-- =====================================================

\echo '📦 Paso 1: Instalando extensiones...'

-- Extensión para generar UUIDs (opcional, por si se necesita en el futuro)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para funciones de texto avanzadas
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\echo '✅ Extensiones instaladas correctamente'
\echo ''

-- =====================================================
-- PASO 2: Crear tabla assets
-- =====================================================

\echo '📋 Paso 2: Creando tabla assets...'

CREATE TABLE IF NOT EXISTS assets (
    -- Clave primaria autoincremental
    id SERIAL PRIMARY KEY,
    
    -- ID del activo visible al usuario (formato: AST-YYYY-NNNN)
    asset_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- Descripción detallada del activo
    description TEXT NOT NULL,
    
    -- Persona responsable del activo
    responsible VARCHAR(255) NOT NULL,
    
    -- Ubicación física del activo
    location VARCHAR(255) NOT NULL,
    
    -- Ruta del archivo PNG con el código QR
    qr_code_path VARCHAR(500),
    
    -- Timestamp de creación del registro
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamp de última actualización
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

\echo '✅ Tabla assets creada correctamente'
\echo ''

-- =====================================================
-- PASO 3: Crear índices
-- =====================================================

\echo '🔍 Paso 3: Creando índices para optimización...'

-- Índice principal en asset_id para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_assets_asset_id ON assets(asset_id);

-- Índice en location para filtrar activos por ubicación
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);

-- Índice en responsible para consultas por responsable
CREATE INDEX IF NOT EXISTS idx_assets_responsible ON assets(responsible);

-- Índice en created_at para ordenamiento cronológico
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);

-- Índice compuesto para búsquedas por ubicación y responsable
CREATE INDEX IF NOT EXISTS idx_assets_location_responsible ON assets(location, responsible);

-- Índice de búsqueda de texto completo en descripción (usando pg_trgm)
CREATE INDEX IF NOT EXISTS idx_assets_description_trgm ON assets USING gin(description gin_trgm_ops);

\echo '✅ Índices creados correctamente'
\echo ''

-- =====================================================
-- PASO 4: Crear constraints
-- =====================================================

\echo '🔒 Paso 4: Aplicando constraints de validación...'

-- Constraints para validar campos no vacíos
DO $$ 
BEGIN
    -- Validar asset_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_asset_id_not_empty'
    ) THEN
        ALTER TABLE assets ADD CONSTRAINT check_asset_id_not_empty 
            CHECK (LENGTH(TRIM(asset_id)) > 0);
    END IF;

    -- Validar description
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_description_not_empty'
    ) THEN
        ALTER TABLE assets ADD CONSTRAINT check_description_not_empty 
            CHECK (LENGTH(TRIM(description)) > 0);
    END IF;

    -- Validar responsible
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_responsible_not_empty'
    ) THEN
        ALTER TABLE assets ADD CONSTRAINT check_responsible_not_empty 
            CHECK (LENGTH(TRIM(responsible)) > 0);
    END IF;

    -- Validar location
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_location_not_empty'
    ) THEN
        ALTER TABLE assets ADD CONSTRAINT check_location_not_empty 
            CHECK (LENGTH(TRIM(location)) > 0);
    END IF;
END $$;

\echo '✅ Constraints aplicados correctamente'
\echo ''

-- =====================================================
-- PASO 5: Crear función y trigger para updated_at
-- =====================================================

\echo '⚙️  Paso 5: Configurando triggers automáticos...'

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

\echo '✅ Triggers configurados correctamente'
\echo ''

-- =====================================================
-- PASO 6: Agregar comentarios
-- =====================================================

\echo '📝 Paso 6: Agregando documentación a la base de datos...'

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

\echo '✅ Documentación agregada correctamente'
\echo ''

-- =====================================================
-- PASO 7: Crear vistas útiles (opcional)
-- =====================================================

\echo '👁️  Paso 7: Creando vistas de consulta...'

-- Vista para resumen por ubicación
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

-- Vista para resumen por responsable
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

-- Vista para activos recientes (últimos 30 días)
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

\echo '✅ Vistas creadas correctamente'
\echo ''

-- =====================================================
-- RESUMEN FINAL
-- =====================================================

\echo '================================================'
\echo '✅ INICIALIZACIÓN COMPLETADA EXITOSAMENTE'
\echo '================================================'
\echo ''
\echo '📊 RESUMEN DE LA ESTRUCTURA:'
\echo ''

-- Mostrar estructura de la tabla
\d assets

\echo ''
\echo '🔍 ÍNDICES CREADOS:'
\echo ''

SELECT 
    indexname AS "Nombre del Índice",
    tablename AS "Tabla"
FROM pg_indexes 
WHERE tablename = 'assets'
ORDER BY indexname;

\echo ''
\echo '👁️  VISTAS DISPONIBLES:'
\echo ''

SELECT 
    table_name AS "Nombre de Vista"
FROM information_schema.views 
WHERE table_schema = 'public' 
    AND table_name LIKE 'v_assets%'
ORDER BY table_name;

\echo ''
\echo '================================================'
\echo '📚 PRÓXIMOS PASOS:'
\echo '================================================'
\echo '1. Ejecutar seed.sql para insertar datos de prueba'
\echo '   psql -U postgres -d inventario_db -f src/database/seed.sql'
\echo ''
\echo '2. Iniciar el servidor backend:'
\echo '   npm run start:backend'
\echo ''
\echo '3. Iniciar la aplicación completa:'
\echo '   npm start'
\echo '================================================'
\echo ''
