# 🗄️ Configuración de Base de Datos - Guía Completa

## Tabla de Contenidos
1. [Esquema de Base de Datos](#esquema-de-base-de-datos)
2. [Instrucciones de Instalación](#instrucciones-de-instalación)
3. [Scripts SQL Disponibles](#scripts-sql-disponibles)
4. [Endpoints de la API](#endpoints-de-la-api)
5. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Esquema de Base de Datos

### Tabla: `assets`

```sql
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,                    -- ID interno autoincremental
    asset_id VARCHAR(50) NOT NULL UNIQUE,     -- ID visible: AST-YYYY-NNNN
    description TEXT NOT NULL,                 -- Descripción del activo
    responsible VARCHAR(255) NOT NULL,         -- Responsable del activo
    location VARCHAR(255) NOT NULL,            -- Ubicación física
    qr_code_path VARCHAR(500),                 -- Ruta del PNG del QR
    created_at TIMESTAMP NOT NULL DEFAULT NOW, -- Fecha de creación
    updated_at TIMESTAMP NOT NULL DEFAULT NOW  -- Auto-actualizable
);
```

### Índices Creados

| Índice | Campo(s) | Propósito |
|--------|----------|-----------|
| `idx_assets_asset_id` | asset_id | Búsquedas rápidas por ID |
| `idx_assets_location` | location | Filtrar por ubicación |
| `idx_assets_responsible` | responsible | Filtrar por responsable |
| `idx_assets_created_at` | created_at | Ordenamiento cronológico |
| `idx_assets_location_responsible` | location, responsible | Consultas combinadas |
| `idx_assets_description_trgm` | description | Búsqueda de texto completo |

### Formato del `asset_id`

**Patrón:** `AST-YYYY-NNNN`

- **AST**: Prefijo fijo para "Asset"
- **YYYY**: Año actual (4 dígitos)
- **NNNN**: Número secuencial (4 dígitos con ceros a la izquierda)

**Ejemplos:**
- `AST-2025-0001`
- `AST-2025-0042`
- `AST-2025-1250`

---

## Instrucciones de Instalación

### Opción 1: Instalación Completa (Recomendada)

```bash
# 1. Conectar a PostgreSQL
psql -U postgres

# 2. Crear base de datos
CREATE DATABASE inventario_db;
\q

# 3. Ejecutar script de inicialización completo
psql -U postgres -d inventario_db -f src/database/init.sql

# 4. (Opcional) Insertar datos de prueba
psql -U postgres -d inventario_db -f src/database/seed.sql
```

### Opción 2: Solo Esquema Principal

```bash
# Ejecutar schema completo
psql -U postgres -d inventario_db -f src/database/schema.sql
```

### Opción 3: Solo Migración Básica

```bash
# Ejecutar solo la migración inicial
psql -U postgres -d inventario_db -f src/database/migrations/001_initial_setup.sql
```

### Verificar Instalación

```bash
# Conectar a la base de datos
psql -U postgres -d inventario_db

# Verificar tabla creada
\d assets

# Verificar índices
\di

# Salir
\q
```

---

## Scripts SQL Disponibles

### 📄 `schema.sql`
**Descripción:** Schema completo con tablas, índices, vistas, funciones y triggers.

**Contenido:**
- Tabla `assets` (principal)
- Tabla `asset_history` (historial de cambios)
- 6 índices optimizados
- Función `generate_next_asset_id()`
- Trigger para `updated_at`
- 3 vistas de consulta

**Ejecutar:**
```bash
psql -U postgres -d inventario_db -f src/database/schema.sql
```

---

### 📄 `init.sql`
**Descripción:** Script de inicialización interactivo con mensajes de progreso.

**Características:**
- Instalación paso a paso
- Mensajes de confirmación
- Verificación automática
- Resumen final

**Ejecutar:**
```bash
psql -U postgres -d inventario_db -f src/database/init.sql
```

---

### 📄 `migrations/001_initial_setup.sql`
**Descripción:** Migración inicial minimalista.

**Contenido:**
- Solo tabla `assets`
- Índices esenciales
- Constraints
- Trigger básico

**Ejecutar:**
```bash
psql -U postgres -d inventario_db -f src/database/migrations/001_initial_setup.sql
```

---

### 📄 `seed.sql`
**Descripción:** 20 activos de prueba para desarrollo.

⚠️ **ADVERTENCIA:** Este script elimina todos los datos existentes.

**Datos incluidos:**
- 4 equipos de cómputo
- 4 electrónicos
- 4 mobiliarios
- 2 vehículos
- 2 herramientas
- 2 equipos de red
- 2 otros activos

**Ejecutar:**
```bash
psql -U postgres -d inventario_db -f src/database/seed.sql
```

---

## Endpoints de la API

### Base URL
```
http://localhost:5000/api/assets
```

### Endpoints Disponibles

#### 📋 Obtener todos los activos
```http
GET /api/assets
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "asset_id": "AST-2025-0001",
      "description": "Laptop Dell Latitude 5420...",
      "responsible": "Juan Pérez Martínez",
      "location": "Oficina Principal - Piso 3",
      "qr_code_path": "/qr_codes/AST-2025-0001.png",
      "created_at": "2025-10-06T20:00:00Z",
      "updated_at": "2025-10-06T20:00:00Z"
    }
  ]
}
```

---

#### 🔍 Buscar por asset_id
```http
GET /api/assets/asset-id/:asset_id
```

**Ejemplo:**
```bash
curl http://localhost:5000/api/assets/asset-id/AST-2025-0001
```

---

#### 🔎 Búsqueda avanzada
```http
GET /api/assets/search?location=Oficina&responsible=Juan&search=laptop
```

**Parámetros:**
- `location`: Filtrar por ubicación (búsqueda parcial)
- `responsible`: Filtrar por responsable (búsqueda parcial)
- `search`: Búsqueda en descripción y asset_id

---

#### ➕ Crear nuevo activo
```http
POST /api/assets
Content-Type: application/json

{
  "description": "Laptop HP ProBook 450 G9",
  "responsible": "María García",
  "location": "Oficina Principal - Piso 2"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Activo creado exitosamente",
  "data": {
    "id": 21,
    "asset_id": "AST-2025-0021",
    "description": "Laptop HP ProBook 450 G9",
    "responsible": "María García",
    "location": "Oficina Principal - Piso 2",
    "qr_code_path": "/qr_codes/AST-2025-0021.png",
    "created_at": "2025-10-06T21:00:00Z",
    "updated_at": "2025-10-06T21:00:00Z"
  },
  "qrImage": "data:image/png;base64,iVBORw0KG..."
}
```

---

#### ✏️ Actualizar activo
```http
PUT /api/assets/:id
Content-Type: application/json

{
  "location": "Almacén Principal",
  "responsible": "Carlos Pérez"
}
```

**Nota:** Solo se actualizan los campos proporcionados. `updated_at` se actualiza automáticamente.

---

#### 🗑️ Eliminar activo
```http
DELETE /api/assets/:id
```

---

#### 📱 Obtener código QR
```http
GET /api/assets/:id/qr
```

**Respuesta:**
```json
{
  "success": true,
  "qrImage": "data:image/png;base64,iVBORw0KG...",
  "asset_id": "AST-2025-0001"
}
```

---

#### 📊 Estadísticas
```http
GET /api/assets/stats/summary
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 20,
    "byLocation": [
      { "location": "Oficina Principal", "count": "12" },
      { "location": "Almacén Principal", "count": "5" }
    ],
    "byResponsible": [
      { "responsible": "Juan Pérez", "count": "3" }
    ],
    "recentCount": 5
  }
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Crear un activo

```bash
curl -X POST http://localhost:5000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Monitor Samsung 27 pulgadas 4K",
    "responsible": "Ana López Hernández",
    "location": "Oficina Principal - Diseño"
  }'
```

### Ejemplo 2: Buscar activos de un responsable

```bash
curl "http://localhost:5000/api/assets/search?responsible=Juan"
```

### Ejemplo 3: Actualizar ubicación de un activo

```bash
curl -X PUT http://localhost:5000/api/assets/1 \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Almacén - En Reparación"
  }'
```

### Ejemplo 4: Consultas SQL directas

```sql
-- Obtener próximo asset_id
SELECT generate_next_asset_id();

-- Buscar activos por ubicación
SELECT * FROM assets WHERE location ILIKE '%oficina%';

-- Ver resumen por ubicación (vista)
SELECT * FROM v_assets_by_location;

-- Activos recientes (vista)
SELECT * FROM v_recent_assets;

-- Búsqueda de texto completo
SELECT * FROM assets 
WHERE description % 'laptop dell'
ORDER BY similarity(description, 'laptop dell') DESC;
```

---

## Funciones PostgreSQL Útiles

### `generate_next_asset_id()`

Genera automáticamente el próximo ID secuencial del año actual.

**Uso:**
```sql
SELECT generate_next_asset_id();
-- Resultado: 'AST-2025-0021'
```

**Lógica:**
1. Obtiene el año actual
2. Busca el último número usado en ese año
3. Incrementa y formatea con padding de ceros

---

## Vistas de Consulta

### `v_assets_by_location`
Resumen de activos agrupados por ubicación.

```sql
SELECT * FROM v_assets_by_location;
```

### `v_assets_by_responsible`
Resumen de activos agrupados por responsable.

```sql
SELECT * FROM v_assets_by_responsible;
```

### `v_recent_assets`
Activos registrados en los últimos 30 días.

```sql
SELECT * FROM v_recent_assets;
```

---

## Validaciones Implementadas

### Constraints de Validación

1. ✅ `asset_id` no puede estar vacío
2. ✅ `description` no puede estar vacío
3. ✅ `responsible` no puede estar vacío
4. ✅ `location` no puede estar vacío
5. ✅ `asset_id` debe ser único
6. ✅ `updated_at` se actualiza automáticamente

---

## Mantenimiento

### Backup de la Base de Datos

```bash
# Crear backup
pg_dump -U postgres inventario_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup solo de datos
pg_dump -U postgres -a inventario_db > data_backup.sql

# Backup solo del esquema
pg_dump -U postgres -s inventario_db > schema_backup.sql
```

### Restaurar Backup

```bash
# Restaurar backup completo
psql -U postgres -d inventario_db < backup_20251006_210000.sql
```

### Reiniciar Secuencia de IDs

```sql
-- Reiniciar sequence de la tabla
ALTER SEQUENCE assets_id_seq RESTART WITH 1;

-- Truncar tabla y reiniciar
TRUNCATE TABLE assets RESTART IDENTITY CASCADE;
```

---

## Troubleshooting

### Error: "relation assets does not exist"
**Solución:** La tabla no ha sido creada.
```bash
psql -U postgres -d inventario_db -f src/database/schema.sql
```

### Error: "duplicate key value"
**Solución:** Intentando insertar un `asset_id` duplicado. Usar `generate_next_asset_id()`.

### Error: "could not connect to database"
**Solución:** 
```bash
# Verificar que PostgreSQL esté corriendo
pg_isready

# Iniciar PostgreSQL (macOS con Homebrew)
brew services start postgresql@15
```

---

## 📚 Documentación Adicional

- **Documentación completa:** `src/database/README.md`
- **Guía rápida:** `QUICK_START.md`
- **README principal:** `README.md`

---

**Última actualización:** 2025-10-06  
**Versión del esquema:** 1.0.0
