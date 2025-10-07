# 📡 Documentación de la API REST

## Base URL
```
http://localhost:5000/api
```

## Autenticación
Actualmente no se requiere autenticación. En producción se recomienda implementar JWT o similar.

---

## Endpoints

### 📊 Endpoints de Sistema

#### 1. Health Check
```http
GET /api/health
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "status": "ok",
  "message": "Backend funcionando correctamente",
  "environment": "development",
  "timestamp": "2025-10-07T11:43:00.000Z"
}
```

---

#### 2. Test de Base de Datos
```http
GET /api/db-test
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "status": "ok",
  "message": "Conexión a la base de datos exitosa",
  "database": {
    "timestamp": "2025-10-07T11:43:00.000Z",
    "version": "PostgreSQL 15.4..."
  }
}
```

---

### 📦 Endpoints de Assets

#### 1. Listar Activos (con paginación)
```http
GET /api/assets?page=1&limit=10
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | integer | No | 1 | Número de página |
| `limit` | integer | No | 10 | Registros por página (máx: 100) |

**Respuesta exitosa (200):**
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
      "created_at": "2025-10-07T10:00:00.000Z",
      "updated_at": "2025-10-07T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasMore": true
  }
}
```

**Ejemplo con curl:**
```bash
curl http://localhost:5000/api/assets?page=1&limit=20
```

---

#### 2. Buscar Activos
```http
GET /api/assets/search?q=laptop
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `q` | string | Sí | Término de búsqueda (mín: 2 caracteres) |

Busca en: `asset_id`, `description`, `responsible`, `location`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 5,
  "searchTerm": "laptop"
}
```

**Errores de validación (400):**
```json
{
  "success": false,
  "message": "El término de búsqueda debe tener al menos 2 caracteres"
}
```

**Ejemplo con curl:**
```bash
curl "http://localhost:5000/api/assets/search?q=laptop"
```

---

#### 3. Buscar Activo por QR (asset_id)
```http
GET /api/assets/qr/:assetId
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `assetId` | string | ID del activo (formato: AST-YYYY-NNNN) |

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "asset_id": "AST-2025-0001",
    "description": "...",
    "responsible": "...",
    "location": "...",
    "qr_code_path": "/qr_codes/AST-2025-0001.png",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Error 404:**
```json
{
  "success": false,
  "message": "No se encontró ningún activo con el ID: AST-2025-9999",
  "statusCode": 404,
  "timestamp": "2025-10-07T11:43:00.000Z"
}
```

**Error de validación (400):**
```json
{
  "success": false,
  "message": "asset_id inválido. Formato esperado: AST-YYYY-NNNN"
}
```

**Ejemplo con curl:**
```bash
curl http://localhost:5000/api/assets/qr/AST-2025-0001
```

---

#### 4. Obtener Activo por ID
```http
GET /api/assets/:id
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID interno del activo |

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "asset_id": "AST-2025-0001",
    ...
  }
}
```

**Error 404:**
```json
{
  "success": false,
  "message": "No se encontró ningún activo con el ID: 999"
}
```

**Ejemplo con curl:**
```bash
curl http://localhost:5000/api/assets/1
```

---

#### 5. Crear Nuevo Activo
```http
POST /api/assets
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "description": "Laptop HP ProBook 450 G9 - Intel Core i5, 8GB RAM, 256GB SSD",
  "responsible": "María García López",
  "location": "Oficina Principal - Piso 2 - Desarrollo"
}
```

**Campos:**
| Campo | Tipo | Requerido | Min/Max | Descripción |
|-------|------|-----------|---------|-------------|
| `description` | string | Sí | 10-5000 chars | Descripción del activo |
| `responsible` | string | Sí | 3-255 chars | Responsable del activo |
| `location` | string | Sí | 3-255 chars | Ubicación física |

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Activo creado exitosamente",
  "data": {
    "id": 21,
    "asset_id": "AST-2025-0021",
    "description": "...",
    "responsible": "...",
    "location": "...",
    "qr_code_path": "/qr_codes/AST-2025-0021.png",
    "created_at": "2025-10-07T11:43:00.000Z",
    "updated_at": "2025-10-07T11:43:00.000Z"
  },
  "qr": {
    "filePath": "/qr_codes/AST-2025-0021.png",
    "fileName": "AST-2025-0021.png",
    "dataURL": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

**Errores de validación (400):**
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": [
    "El campo \"description\" es obligatorio y debe ser texto",
    "La descripción debe tener al menos 10 caracteres"
  ]
}
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:5000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Monitor Samsung 27 pulgadas 4K UHD",
    "responsible": "Carlos Pérez",
    "location": "Oficina - Diseño"
  }'
```

---

#### 6. Actualizar Activo
```http
PUT /api/assets/:id
Content-Type: application/json
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID interno del activo |

**Body (JSON):**
```json
{
  "description": "Laptop HP ProBook 450 G9 - Actualizado a 16GB RAM",
  "responsible": "Pedro González",
  "location": "Almacén - En revisión"
}
```

**Nota:** Al menos UN campo debe estar presente. Los campos no incluidos no se modifican.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Activo actualizado exitosamente",
  "data": {
    "id": 1,
    "asset_id": "AST-2025-0001",
    "description": "Laptop HP ProBook 450 G9 - Actualizado a 16GB RAM",
    "responsible": "Pedro González",
    "location": "Almacén - En revisión",
    "qr_code_path": "/qr_codes/AST-2025-0001.png",
    "created_at": "2025-10-07T10:00:00.000Z",
    "updated_at": "2025-10-07T11:45:00.000Z"
  }
}
```

**Errores:**
- **400:** Validación fallida o ningún campo para actualizar
- **404:** Activo no encontrado

**Ejemplo con curl:**
```bash
curl -X PUT http://localhost:5000/api/assets/1 \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Bodega - Almacenamiento"
  }'
```

---

#### 7. Eliminar Activo
```http
DELETE /api/assets/:id
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID interno del activo |

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Activo eliminado exitosamente",
  "data": {
    "id": 1,
    "asset_id": "AST-2025-0001",
    ...
  }
}
```

**Nota:** El archivo PNG del código QR también se elimina automáticamente.

**Error 404:**
```json
{
  "success": false,
  "message": "No se encontró ningún activo con el ID: 999"
}
```

**Ejemplo con curl:**
```bash
curl -X DELETE http://localhost:5000/api/assets/1
```

---

#### 8. Generar Código QR
```http
POST /api/assets/:id/generate-qr
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID interno del activo |

**Descripción:**
Genera (o regenera) el código QR para un activo existente. Si ya existe un archivo QR, lo reemplaza.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Código QR generado exitosamente",
  "asset_id": "AST-2025-0001",
  "qr": {
    "filePath": "/qr_codes/AST-2025-0001.png",
    "fileName": "AST-2025-0001.png",
    "dataURL": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

**Error 404:**
```json
{
  "success": false,
  "message": "No se encontró ningún activo con el ID: 999"
}
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:5000/api/assets/1/generate-qr
```

---

## 🗂️ Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| **200** | OK - Petición exitosa |
| **201** | Created - Recurso creado exitosamente |
| **400** | Bad Request - Error de validación |
| **404** | Not Found - Recurso no encontrado |
| **409** | Conflict - Violación de constraint unique |
| **500** | Internal Server Error - Error del servidor |
| **503** | Service Unavailable - Base de datos no disponible |

---

## 🔧 Estructura de Errores

Todos los errores siguen esta estructura:

```json
{
  "success": false,
  "message": "Descripción del error",
  "statusCode": 400,
  "timestamp": "2025-10-07T11:43:00.000Z",
  "errors": ["Array de errores específicos (opcional)"]
}
```

En modo desarrollo, también incluye:
```json
{
  ...
  "stack": "Error stack trace...",
  "rawError": "Error: ..."
}
```

---

## 📁 Acceso a Códigos QR

Los archivos PNG de códigos QR se sirven estáticamente desde:

```
http://localhost:5000/qr_codes/AST-2025-0001.png
```

**Características del QR:**
- **Formato:** PNG
- **Tamaño:** 300x300 px
- **Corrección de errores:** Alta (H)
- **Contenido:** `asset_id` (AST-YYYY-NNNN)
- **Ubicación física:** `/public/qr_codes/`

---

## 🔄 Ejemplos de Uso Completo

### Ejemplo 1: Crear y escanear activo

```bash
# 1. Crear activo
curl -X POST http://localhost:5000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Laptop Lenovo ThinkPad X1",
    "responsible": "Ana Torres",
    "location": "Oficina Central"
  }'

# Respuesta incluye asset_id: AST-2025-0042

# 2. Buscar activo escaneando QR
curl http://localhost:5000/api/assets/qr/AST-2025-0042
```

### Ejemplo 2: Búsqueda y actualización

```bash
# 1. Buscar activos con "laptop"
curl "http://localhost:5000/api/assets/search?q=laptop"

# 2. Actualizar el primero encontrado (ID 5)
curl -X PUT http://localhost:5000/api/assets/5 \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Almacén - En reparación"
  }'
```

### Ejemplo 3: Regenerar QR

```bash
# Regenerar QR para activo con ID 10
curl -X POST http://localhost:5000/api/assets/10/generate-qr
```

---

## 🔗 CORS

El servidor acepta peticiones desde:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

Métodos permitidos: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

---

## 📊 Logging

El servidor registra automáticamente:
- ✅ Todas las peticiones HTTP con timestamp y duración
- ✅ Operaciones de base de datos (SELECT, INSERT, UPDATE, DELETE)
- ✅ Operaciones de archivos (crear, eliminar QR)
- ✅ Errores con stack trace (en desarrollo)

Ejemplo de log:
```
[2025-10-07T11:43:00.000Z] POST /api/assets - IP: ::1
[DB 2025-10-07T11:43:00.100Z] INSERT en assets asset_id=AST-2025-0042
[FILE 2025-10-07T11:43:00.200Z] Escribiendo archivo: /public/qr_codes/AST-2025-0042.png
[2025-10-07T11:43:00.300Z] POST /api/assets - Status: 201 - 300ms
```

---

**Versión de API:** 1.0.0  
**Última actualización:** 2025-10-07
