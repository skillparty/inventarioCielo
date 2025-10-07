# 📊 Documentación de Base de Datos

## Estructura de la Base de Datos PostgreSQL

### Tabla Principal: `assets`

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Clave primaria autoincremental |
| `asset_id` | VARCHAR(50) | NOT NULL, UNIQUE | ID único del activo (AST-YYYY-NNNN) |
| `description` | TEXT | NOT NULL | Descripción detallada del activo |
| `responsible` | VARCHAR(255) | NOT NULL | Persona responsable del activo |
| `location` | VARCHAR(255) | NOT NULL | Ubicación física actual |
| `qr_code_path` | VARCHAR(500) | NULLABLE | Ruta del archivo PNG del código QR |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | Fecha de creación |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | Fecha de última actualización |

### Índices Creados

1. **`idx_assets_asset_id`** - Índice en `asset_id` para búsquedas rápidas
2. **`idx_assets_location`** - Índice en `location` para filtros por ubicación
3. **`idx_assets_responsible`** - Índice en `responsible` para filtros por responsable
4. **`idx_assets_created_at`** - Índice en `created_at` para ordenamiento cronológico
5. **`idx_assets_location_responsible`** - Índice compuesto para consultas combinadas
6. **`idx_assets_description_trgm`** - Índice GIN para búsqueda de texto completo

### Triggers Automáticos

- **`trigger_update_assets_updated_at`**: Actualiza automáticamente el campo `updated_at` antes de cada UPDATE

### Vistas Disponibles

#### `v_assets_by_location`
Resumen de activos agrupados por ubicación.

```sql
SELECT * FROM v_assets_by_location;
```

Columnas:
- `location` - Ubicación
- `total_assets` - Total de activos en esa ubicación
- `unique_responsibles` - Número de responsables diferentes
- `first_asset_date` - Fecha del primer activo registrado
- `last_asset_date` - Fecha del último activo registrado

#### `v_assets_by_responsible`
Resumen de activos agrupados por responsable.

```sql
SELECT * FROM v_assets_by_responsible;
```

Columnas:
- `responsible` - Nombre del responsable
- `total_assets` - Total de activos asignados
- `different_locations` - Número de ubicaciones diferentes
- `first_asset_date` - Fecha del primer activo asignado
- `last_asset_date` - Fecha del último activo asignado

#### `v_recent_assets`
Activos registrados en los últimos 30 días.

```sql
SELECT * FROM v_recent_assets;
```

### Tabla Complementaria: `asset_history`

Tabla para rastrear cambios en los activos (futuras implementaciones).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | Clave primaria |
| `asset_id` | VARCHAR(50) | Referencia al activo |
| `field_changed` | VARCHAR(100) | Campo que cambió |
| `old_value` | TEXT | Valor anterior |
| `new_value` | TEXT | Valor nuevo |
| `changed_by` | VARCHAR(255) | Usuario que hizo el cambio |
| `changed_at` | TIMESTAMP | Fecha del cambio |

## 🚀 Scripts SQL Disponibles

### 1. `schema.sql`
**Propósito:** Schema completo con todas las tablas, índices, vistas y funciones.

**Uso:**
```bash
psql -U postgres -d inventario_db -f src/database/schema.sql
```

### 2. `migrations/001_initial_setup.sql`
**Propósito:** Migración inicial para crear la tabla assets.

**Uso:**
```bash
psql -U postgres -d inventario_db -f src/database/migrations/001_initial_setup.sql
```

### 3. `init.sql`
**Propósito:** Script de inicialización completa paso a paso con verificación.

**Uso:**
```bash
psql -U postgres -d inventario_db -f src/database/init.sql
```

### 4. `seed.sql`
**Propósito:** Insertar 20 activos de prueba para desarrollo y testing.

**Uso:**
```bash
psql -U postgres -d inventario_db -f src/database/seed.sql
```

⚠️ **Advertencia:** Este script limpia todos los datos existentes.

## 📝 Funciones SQL Útiles

### `generate_next_asset_id()`
Genera automáticamente el próximo ID de activo disponible.

**Uso:**
```sql
SELECT generate_next_asset_id();
-- Resultado: 'AST-2025-0001'
```

**Formato:** AST-YYYY-NNNN
- AST: Prefijo fijo
- YYYY: Año actual (4 dígitos)
- NNNN: Número secuencial (4 dígitos con padding de ceros)

## 🔍 Consultas SQL Comunes

### Obtener todos los activos
```sql
SELECT * FROM assets ORDER BY created_at DESC;
```

### Buscar activo por asset_id
```sql
SELECT * FROM assets WHERE asset_id = 'AST-2025-0001';
```

### Buscar activos por responsable
```sql
SELECT * FROM assets WHERE responsible ILIKE '%Juan%';
```

### Buscar activos por ubicación
```sql
SELECT * FROM assets WHERE location ILIKE '%Oficina Principal%';
```

### Búsqueda de texto completo en descripción
```sql
SELECT * FROM assets 
WHERE description % 'laptop dell'
ORDER BY similarity(description, 'laptop dell') DESC;
```

### Contar activos por ubicación
```sql
SELECT location, COUNT(*) as total 
FROM assets 
GROUP BY location 
ORDER BY total DESC;
```

### Activos registrados hoy
```sql
SELECT * FROM assets 
WHERE DATE(created_at) = CURRENT_DATE;
```

### Activos actualizados en las últimas 24 horas
```sql
SELECT * FROM assets 
WHERE updated_at >= NOW() - INTERVAL '24 hours';
```

## 🔐 Constraints de Validación

Todos los campos de texto obligatorios tienen constraints que validan que no estén vacíos:

```sql
-- Ejemplo de constraint
CHECK (LENGTH(TRIM(asset_id)) > 0)
```

Esto previene la inserción de strings vacíos o con solo espacios en blanco.

## 🎯 Mejores Prácticas

1. **Siempre usar transacciones** para operaciones críticas:
```sql
BEGIN;
-- Tus operaciones aquí
COMMIT;
-- O ROLLBACK; en caso de error
```

2. **Usar índices apropiados** en consultas frecuentes:
- Las búsquedas por `asset_id` son muy rápidas (índice único)
- Las búsquedas por `location` y `responsible` usan índices

3. **Mantener datos consistentes**:
- El campo `updated_at` se actualiza automáticamente
- Usar la función `generate_next_asset_id()` para IDs secuenciales

4. **Backup regular**:
```bash
# Crear backup
pg_dump -U postgres inventario_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres -d inventario_db < backup_20251006.sql
```

## 📊 Estadísticas de la Base de Datos

### Ver tamaño de la tabla
```sql
SELECT pg_size_pretty(pg_total_relation_size('assets')) AS table_size;
```

### Ver número de filas
```sql
SELECT COUNT(*) FROM assets;
```

### Ver índices y su tamaño
```sql
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'assets';
```

## 🔄 Migraciones Futuras

Para agregar nuevas columnas o modificar el esquema:

1. Crear un nuevo archivo en `migrations/` con numeración secuencial
2. Documentar los cambios
3. Probar en ambiente de desarrollo
4. Aplicar en producción con backup previo

**Ejemplo:** `migrations/002_add_status_column.sql`

```sql
-- Agregar columna de estado
ALTER TABLE assets ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- Comentario
COMMENT ON COLUMN assets.status IS 'Estado del activo: active, inactive, maintenance';
```

## 🆘 Solución de Problemas

### Error: "relation does not exist"
La tabla no ha sido creada. Ejecutar:
```bash
psql -U postgres -d inventario_db -f src/database/schema.sql
```

### Error: "duplicate key value violates unique constraint"
Intentando insertar un `asset_id` que ya existe. Usar la función `generate_next_asset_id()`.

### Lentitud en consultas
Verificar que los índices estén creados:
```sql
SELECT * FROM pg_indexes WHERE tablename = 'assets';
```

Analizar plan de ejecución:
```sql
EXPLAIN ANALYZE SELECT * FROM assets WHERE location = 'Oficina Principal';
```

---

**Última actualización:** 2025-10-06  
**Versión del esquema:** 1.0.0
