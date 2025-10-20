-- Migración: Crear tabla asset_names para gestionar nombres de activos predefinidos
-- Fecha: 2025-10-20
-- Descripción: Permite gestionar nombres de activos de forma centralizada con contador automático

-- =====================================================
-- TABLA: asset_names
-- =====================================================

CREATE TABLE IF NOT EXISTS asset_names (
    -- Clave primaria autoincremental
    id SERIAL PRIMARY KEY,
    
    -- Nombre base del activo (ej: "Cepillo para botas")
    name VARCHAR(255) NOT NULL UNIQUE,
    
    -- Descripción opcional del tipo de activo
    description TEXT,
    
    -- Contador actual (cuántos activos existen con este nombre)
    -- Se incrementa automáticamente al crear un activo
    counter INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamp de creación del registro
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamp de última actualización
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índice principal en name para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_asset_names_name ON asset_names(name);

-- Índice en created_at para ordenamiento cronológico
CREATE INDEX IF NOT EXISTS idx_asset_names_created_at ON asset_names(created_at DESC);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Validar que name no esté vacío
ALTER TABLE asset_names DROP CONSTRAINT IF EXISTS check_asset_name_not_empty;
ALTER TABLE asset_names ADD CONSTRAINT check_asset_name_not_empty 
    CHECK (LENGTH(TRIM(name)) > 0);

-- Validar que counter sea no negativo
ALTER TABLE asset_names DROP CONSTRAINT IF EXISTS check_asset_name_counter_positive;
ALTER TABLE asset_names ADD CONSTRAINT check_asset_name_counter_positive 
    CHECK (counter >= 0);

-- =====================================================
-- TRIGGER PARA updated_at
-- =====================================================

-- Trigger que se ejecuta antes de cada UPDATE
DROP TRIGGER IF EXISTS trigger_update_asset_names_updated_at ON asset_names;

CREATE TRIGGER trigger_update_asset_names_updated_at
    BEFORE UPDATE ON asset_names
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE asset_names IS 
    'Tabla para gestionar nombres de activos predefinidos con contador automático';

COMMENT ON COLUMN asset_names.id IS 
    'Clave primaria autoincremental';

COMMENT ON COLUMN asset_names.name IS 
    'Nombre base del activo (ej: Cepillo para botas)';

COMMENT ON COLUMN asset_names.description IS 
    'Descripción opcional del tipo de activo';

COMMENT ON COLUMN asset_names.counter IS 
    'Contador de activos creados con este nombre';

COMMENT ON COLUMN asset_names.created_at IS 
    'Fecha y hora de creación del registro';

COMMENT ON COLUMN asset_names.updated_at IS 
    'Fecha y hora de última actualización';

-- =====================================================
-- DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Insertar algunos nombres de ejemplo si no existen
INSERT INTO asset_names (name, description, counter) VALUES
    ('Cepillo para botas', 'Herramienta de limpieza para calzado', 0),
    ('Silla de oficina', 'Mobiliario para puestos de trabajo', 0),
    ('Monitor', 'Pantalla de computadora', 0),
    ('Teclado', 'Dispositivo de entrada de computadora', 0),
    ('Mouse', 'Dispositivo señalador', 0)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- MENSAJE DE ÉXITO
-- =====================================================

SELECT 'Tabla asset_names creada exitosamente ✓' AS status;
