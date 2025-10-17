-- Migración: Agregar campo name a la tabla assets
-- Fecha: 2025-10-17

-- Agregar columna name
ALTER TABLE assets ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Actualizar registros existentes para que tengan un nombre basado en su descripción
UPDATE assets SET name = LEFT(description, 50) WHERE name IS NULL OR name = '';

-- Crear índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
