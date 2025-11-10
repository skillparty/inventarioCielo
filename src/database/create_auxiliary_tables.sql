-- =====================================================
-- CREAR TABLAS AUXILIARES FALTANTES
-- =====================================================

-- Tabla de ubicaciones
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de responsables
CREATE TABLE IF NOT EXISTS responsibles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de nombres de activos (para sistema de contador)
CREATE TABLE IF NOT EXISTS asset_names (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    prefix VARCHAR(10) NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_responsibles_name ON responsibles(name);
CREATE INDEX IF NOT EXISTS idx_asset_names_name ON asset_names(name);

-- Comentarios
COMMENT ON TABLE locations IS 'Catálogo de ubicaciones disponibles para los activos';
COMMENT ON TABLE responsibles IS 'Catálogo de personas responsables de activos';
COMMENT ON TABLE asset_names IS 'Catálogo de nombres de activos con sistema de contador automático';

SELECT 'Tablas auxiliares creadas exitosamente ✓' AS status;
