-- Migración: Agregar tablas de ubicaciones y responsables
-- Fecha: 2025-10-17

-- Crear tabla de ubicaciones
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Crear tabla de responsables
CREATE TABLE IF NOT EXISTS responsibles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insertar ubicaciones por defecto
INSERT INTO locations (name, description) VALUES
('Almacén Principal', 'Ubicación principal de almacenamiento'),
('Oficina', 'Área de oficinas administrativas'),
('Taller', 'Área de mantenimiento y reparaciones'),
('Bodega', 'Bodega de resguardo')
ON CONFLICT (name) DO NOTHING;

-- Insertar responsables por defecto  
INSERT INTO responsibles (name, email) VALUES
('Sin asignar', 'sin.asignar@example.com'),
('Administración', 'admin@example.com'),
('Mantenimiento', 'mantenimiento@example.com')
ON CONFLICT (name) DO NOTHING;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_responsibles_name ON responsibles(name);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responsibles_updated_at BEFORE UPDATE ON responsibles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
