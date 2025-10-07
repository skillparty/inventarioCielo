# 📘 API Reference - Sistema de Inventario Cielo

## Información General

**Base URL:** `http://localhost:5000/api`  
**Versión:** 1.0.0  
**Content-Type:** `application/json`  
**Autenticación:** No requerida (v1.0)

---

## 📦 Assets Endpoints

### 1. Listar Activos (con paginación)

```http
GET /api/assets
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | integer | No | 1 | Número de página |
| `limit` | integer | No | 10 | Registros por página (max: 100) |

**Ejemplo Request:**
```bash
curl http://localhost:5000/api/assets?page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "asset_id": "AST-2025-0001",
      "description": "Laptop Dell Latitude 7490",
      "responsible": "Juan Pérez",
      "location": "Oficina Principal",
      "qr_code_path": "/path/to/qr/AST-2025-0001.png",
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

### 2. Obtener Activo por ID

```http
GET /api/assets/:id
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID único del activo |

**Ejemplo Request:**
```bash
curl http://localhost:5000/api/assets/1
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "asset_id": "AST-2025-0001",
    "description": "Laptop Dell Latitude 7490",
    "responsible": "Juan Pérez",
    "location": "Oficina Principal",
    "qr_code_path": "/path/to/qr/AST-2025-0001.png",
    "created_at": "2025-01-01T12:00:00.000Z",
    "updated_at": "2025-01-01T12:00:00.000Z"
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "message": "No se encontró ningún activo con el ID: 1"
}
```

---

### 3. Buscar Activo por Asset ID

```http
GET /api/assets/qr/:assetId
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `assetId` | string | Asset ID único (formato: AST-YYYY-####) |

**Ejemplo Request:**
```bash
curl http://localhost:5000/api/assets/qr/AST-2025-0001
```

**Response 200:** (mismo formato que GET /:id)

**Response 400:**
```json
{
  "success": false,
  "message": "El asset_id debe tener el formato AST-YYYY-####"
}
```

---

### 4. Búsqueda Simple

```http
GET /api/assets/search
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `q` | string | Sí | Término de búsqueda |

Busca en: `asset_id`, `description`, `responsible`, `location`

**Ejemplo Request:**
```bash
curl "http://localhost:5000/api/assets/search?q=laptop"
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    { /* activo 1 */ },
    { /* activo 2 */ }
  ],
  "count": 2,
  "searchTerm": "laptop"
}
```

---

### 5. Búsqueda Avanzada

```http
POST /api/assets/search/advanced
```

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `location` | string | No | Filtrar por ubicación (LIKE) |
| `responsible` | string | No | Filtrar por responsable (LIKE) |
| `dateFrom` | string (ISO date) | No | Fecha desde (>=) |
| `dateTo` | string (ISO date) | No | Fecha hasta (<=) |
| `searchTerm` | string | No | Buscar en asset_id o description |

**Ejemplo Request:**
```bash
curl -X POST http://localhost:5000/api/assets/search/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Oficina",
    "responsible": "Juan",
    "dateFrom": "2025-01-01",
    "dateTo": "2025-12-31"
  }'
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    { /* activos filtrados */ }
  ],
  "count": 5,
  "filters": {
    "location": "Oficina",
    "responsible": "Juan",
    "dateFrom": "2025-01-01",
    "dateTo": "2025-12-31"
  }
}
```

---

### 6. Crear Activo

```http
POST /api/assets
```

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `description` | string | Sí | Descripción del activo (min: 1 char) |
| `responsible` | string | No | Responsable del activo |
| `location` | string | No | Ubicación del activo |

**Ejemplo Request:**
```bash
curl -X POST http://localhost:5000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Laptop Dell Latitude 7490",
    "responsible": "Juan Pérez",
    "location": "Oficina Principal"
  }'
```

**Response 201:**
```json
{
  "success": true,
  "message": "Activo creado exitosamente",
  "data": {
    "id": 1,
    "asset_id": "AST-2025-0001",
    "description": "Laptop Dell Latitude 7490",
    "responsible": "Juan Pérez",
    "location": "Oficina Principal",
    "qr_code_path": "/path/to/qr/AST-2025-0001.png",
    "created_at": "2025-01-01T12:00:00.000Z",
    "updated_at": "2025-01-01T12:00:00.000Z"
  },
  "qr": {
    "filePath": "/absolute/path/to/qr/AST-2025-0001.png",
    "fileName": "AST-2025-0001.png",
    "dataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "message": "La descripción es requerida y debe tener al menos 1 carácter"
}
```

---

### 7. Actualizar Activo

```http
PUT /api/assets/:id
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID del activo a actualizar |

**Request Body:** (al menos uno requerido)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `description` | string | Nueva descripción |
| `responsible` | string | Nuevo responsable |
| `location` | string | Nueva ubicación |

**Ejemplo Request:**
```bash
curl -X PUT http://localhost:5000/api/assets/1 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Laptop Dell Latitude 7490 - Actualizada",
    "location": "Nueva Oficina"
  }'
```

**Response 200:**
```json
{
  "success": true,
  "message": "Activo actualizado exitosamente",
  "data": {
    "id": 1,
    "asset_id": "AST-2025-0001",
    "description": "Laptop Dell Latitude 7490 - Actualizada",
    "responsible": "Juan Pérez",
    "location": "Nueva Oficina",
    "qr_code_path": "/path/to/qr/AST-2025-0001.png",
    "created_at": "2025-01-01T12:00:00.000Z",
    "updated_at": "2025-01-02T14:30:00.000Z"
  }
}
```

---

### 8. Eliminar Activo

```http
DELETE /api/assets/:id
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID del activo a eliminar |

**Ejemplo Request:**
```bash
curl -X DELETE http://localhost:5000/api/assets/1
```

**Response 200:**
```json
{
  "success": true,
  "message": "Activo eliminado exitosamente",
  "data": {
    "id": 1,
    "asset_id": "AST-2025-0001",
    "description": "Laptop Dell Latitude 7490",
    "responsible": "Juan Pérez",
    "location": "Oficina Principal"
  }
}
```

**Nota:** El código QR asociado también se elimina del sistema de archivos.

---

### 9. Generar/Regenerar QR Code

```http
POST /api/assets/:id/generate-qr
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID del activo |

**Ejemplo Request:**
```bash
curl -X POST http://localhost:5000/api/assets/1/generate-qr
```

**Response 200:**
```json
{
  "success": true,
  "message": "Código QR generado exitosamente",
  "asset_id": "AST-2025-0001",
  "qr": {
    "filePath": "/absolute/path/to/qr/AST-2025-0001.png",
    "fileName": "AST-2025-0001.png",
    "dataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
  }
}
```

---

## 📊 Statistics & Reports Endpoints

### 10. Estadísticas del Dashboard

```http
GET /api/assets/stats/dashboard
```

**Ejemplo Request:**
```bash
curl http://localhost:5000/api/assets/stats/dashboard
```

**Response 200:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "thisWeek": 12,
    "thisMonth": 45,
    "byLocation": [
      { "location": "Oficina Principal", "count": "75" },
      { "location": "Almacén", "count": "30" },
      { "location": "Data Center", "count": "25" }
    ],
    "byResponsible": [
      { "responsible": "Juan Pérez", "count": "25" },
      { "responsible": "María García", "count": "20" }
    ],
    "recent": [
      {
        "id": 150,
        "asset_id": "AST-2025-0150",
        "description": "Nuevo activo",
        "created_at": "2025-10-07T18:00:00.000Z"
      }
    ]
  }
}
```

---

### 11. Exportar a CSV

```http
GET /api/assets/export/csv
```

**Ejemplo Request:**
```bash
curl http://localhost:5000/api/assets/export/csv -o inventario.csv
```

**Response 200:**

Content-Type: `text/csv; charset=utf-8`  
Content-Disposition: `attachment; filename="inventario_2025-10-07T18-28-45.csv"`

```csv
ID,Asset ID,Descripcion,Responsable,Ubicacion,Fecha Creacion,Fecha Actualizacion
1,AST-2025-0001,"Laptop Dell",Juan Pérez,Oficina,1/1/2025 12:00:00,1/1/2025 12:00:00
```

**Nota:** El archivo incluye BOM UTF-8 para compatibilidad con Excel.

---

## 🔧 System Endpoints

### 12. Health Check

```http
GET /api/health
```

**Ejemplo Request:**
```bash
curl http://localhost:5000/api/health
```

**Response 200:**
```json
{
  "success": true,
  "status": "ok",
  "message": "Backend funcionando correctamente",
  "environment": "development",
  "timestamp": "2025-10-07T22:28:45.123Z"
}
```

---

### 13. Database Connection Test

```http
GET /api/db-test
```

**Ejemplo Request:**
```bash
curl http://localhost:5000/api/db-test
```

**Response 200:**
```json
{
  "success": true,
  "status": "ok",
  "message": "Conexión a la base de datos exitosa",
  "database": {
    "timestamp": "2025-10-07T22:28:45.123Z",
    "version": "PostgreSQL 15.4 on x86_64-apple-darwin..."
  }
}
```

**Response 500:**
```json
{
  "success": false,
  "message": "Error al conectar con la base de datos",
  "error": "Connection refused"
}
```

---

### 14. Create Database Backup

```http
POST /api/db-backup
```

**Ejemplo Request:**
```bash
curl -X POST http://localhost:5000/api/db-backup
```

**Response 200:**
```json
{
  "success": true,
  "message": "Backup creado exitosamente",
  "backup": {
    "filename": "backup_2025-10-07T18-28-45.sql",
    "filepath": "/absolute/path/to/backups/backup_2025-10-07T18-28-45.sql",
    "size": 153600,
    "sizeFormatted": "150.00 KB",
    "timestamp": "2025-10-07T22:28:45.123Z"
  }
}
```

**Response 500:**
```json
{
  "success": false,
  "message": "Error al crear backup de la base de datos",
  "error": "pg_dump: error: ..."
}
```

---

## ❌ Error Responses

### Formato de Error Estándar

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (solo en development)"
}
```

### Códigos HTTP Comunes

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos de entrada inválidos |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

## 🔐 Rate Limiting

**Actualmente no implementado** (v1.0)

Futuras versiones incluirán:
- Límite de 100 requests/minuto por IP
- Límite de 1000 requests/hora por IP

---

## 📝 Notas de Desarrollo

### Validaciones

1. **Asset ID:** Formato `AST-YYYY-####` (generado automáticamente)
2. **Description:** Mínimo 1 carácter, máximo 1000
3. **Responsible:** Máximo 255 caracteres
4. **Location:** Máximo 255 caracteres
5. **Pagination:** page >= 1, limit 1-100

### CORS

Orígenes permitidos (development):
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

### Base de Datos

- **Motor:** PostgreSQL 12+
- **Transacciones:** Soportadas en operaciones críticas
- **Timestamps:** Automáticos (created_at, updated_at)

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Solo tests de backend
npm run test:backend

# Solo tests de integración
npm run test:integration

# Con coverage
npm test -- --coverage
```

---

## 📚 Recursos Adicionales

- [README.md](README.md) - Instalación y configuración
- [FEATURES_GUIDE.md](FEATURES_GUIDE.md) - Guía de funcionalidades
- [BUILD_GUIDE.md](BUILD_GUIDE.md) - Guía de build y deployment

---

**Sistema de Inventario Cielo v1.0.0**  
Documentación generada: 7 de Octubre, 2025
