# 📐 Diagrama del Esquema de Base de Datos

## Tabla Principal: `assets`

```
┌─────────────────────────────────────────────────────────────────────┐
│                            TABLE: assets                             │
├──────────────────┬─────────────────┬─────────────────────────────────┤
│ Campo            │ Tipo            │ Descripción                     │
├──────────────────┼─────────────────┼─────────────────────────────────┤
│ 🔑 id            │ SERIAL          │ PK autoincremental             │
│ 🏷️  asset_id     │ VARCHAR(50)     │ ID visible: AST-YYYY-NNNN      │
│                  │ NOT NULL UNIQUE │                                 │
│ 📝 description   │ TEXT            │ Descripción detallada          │
│                  │ NOT NULL        │                                 │
│ 👤 responsible   │ VARCHAR(255)    │ Persona responsable            │
│                  │ NOT NULL        │                                 │
│ 📍 location      │ VARCHAR(255)    │ Ubicación física               │
│                  │ NOT NULL        │                                 │
│ 📱 qr_code_path  │ VARCHAR(500)    │ Ruta del PNG del QR            │
│                  │ NULLABLE        │                                 │
│ 📅 created_at    │ TIMESTAMP       │ Fecha de creación              │
│                  │ NOT NULL        │ DEFAULT: CURRENT_TIMESTAMP     │
│ 🔄 updated_at    │ TIMESTAMP       │ Última actualización           │
│                  │ NOT NULL        │ Auto-actualizable con trigger  │
└──────────────────┴─────────────────┴─────────────────────────────────┘
```

## Índices

```
📇 INDICES EN assets:

1. idx_assets_asset_id (UNIQUE)
   └─→ asset_id
   Propósito: Búsquedas rápidas por ID del activo

2. idx_assets_location
   └─→ location
   Propósito: Filtrar activos por ubicación

3. idx_assets_responsible
   └─→ responsible
   Propósito: Filtrar activos por responsable

4. idx_assets_created_at (DESC)
   └─→ created_at
   Propósito: Ordenamiento cronológico

5. idx_assets_location_responsible (COMPOSITE)
   └─→ (location, responsible)
   Propósito: Consultas combinadas eficientes

6. idx_assets_description_trgm (GIN)
   └─→ description
   Propósito: Búsqueda de texto completo
```

## Constraints

```
🔒 CONSTRAINTS:

✓ PRIMARY KEY: id
✓ UNIQUE: asset_id
✓ CHECK: LENGTH(TRIM(asset_id)) > 0
✓ CHECK: LENGTH(TRIM(description)) > 0
✓ CHECK: LENGTH(TRIM(responsible)) > 0
✓ CHECK: LENGTH(TRIM(location)) > 0
```

## Triggers

```
⚡ TRIGGERS:

trigger_update_assets_updated_at
├─ Tipo: BEFORE UPDATE
├─ Para cada: ROW
├─ Ejecuta: update_updated_at_column()
└─ Acción: Actualiza updated_at = CURRENT_TIMESTAMP
```

## Funciones

```
🔧 FUNCIONES:

generate_next_asset_id() → VARCHAR
├─ Descripción: Genera el próximo asset_id secuencial
├─ Formato: AST-YYYY-NNNN
├─ Ejemplo: AST-2025-0001
└─ Uso: SELECT generate_next_asset_id();

update_updated_at_column() → TRIGGER
├─ Descripción: Actualiza updated_at automáticamente
└─ Uso: Trigger automático en UPDATE
```

## Vistas

```
👁️ VISTAS:

v_assets_by_location
├─ Columnas:
│  ├─ location
│  ├─ total_assets
│  ├─ unique_responsibles
│  ├─ first_asset_date
│  └─ last_asset_date
└─ Uso: SELECT * FROM v_assets_by_location;

v_assets_by_responsible
├─ Columnas:
│  ├─ responsible
│  ├─ total_assets
│  ├─ different_locations
│  ├─ first_asset_date
│  └─ last_asset_date
└─ Uso: SELECT * FROM v_assets_by_responsible;

v_recent_assets
├─ Columnas:
│  ├─ asset_id
│  ├─ short_description (100 chars)
│  ├─ responsible
│  ├─ location
│  └─ created_at
├─ Filtro: Últimos 30 días
└─ Uso: SELECT * FROM v_recent_assets;
```

## Tabla Complementaria

```
┌──────────────────────────────────────────────────────────────┐
│                    TABLE: asset_history                       │
├──────────────────┬─────────────────┬─────────────────────────┤
│ Campo            │ Tipo            │ Descripción             │
├──────────────────┼─────────────────┼─────────────────────────┤
│ 🔑 id            │ SERIAL          │ PK autoincremental     │
│ 🏷️  asset_id     │ VARCHAR(50)     │ FK → assets(asset_id)  │
│ 📝 field_changed │ VARCHAR(100)    │ Campo modificado       │
│ ⬅️  old_value    │ TEXT            │ Valor anterior         │
│ ➡️  new_value    │ TEXT            │ Valor nuevo            │
│ 👤 changed_by    │ VARCHAR(255)    │ Usuario que cambió     │
│ 📅 changed_at    │ TIMESTAMP       │ Fecha del cambio       │
└──────────────────┴─────────────────┴─────────────────────────┘

Propósito: Auditoría y trazabilidad de cambios (futuro)
```

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE CREACIÓN DE ACTIVO                   │
└─────────────────────────────────────────────────────────────────┘

1. POST /api/assets
   ├─ Body: { description, responsible, location }
   └─ Validación de campos requeridos
         │
         ↓
2. generate_next_asset_id()
   ├─ Consulta último número del año
   ├─ Incrementa contador
   └─ Retorna: AST-2025-NNNN
         │
         ↓
3. QRCode.toDataURL(asset_id)
   ├─ Genera código QR
   └─ Retorna: data:image/png;base64,...
         │
         ↓
4. INSERT INTO assets
   ├─ Campos: asset_id, description, responsible, location
   ├─ Auto: created_at = NOW()
   └─ Auto: updated_at = NOW()
         │
         ↓
5. Response
   └─ { success, message, data, qrImage }
```

## Flujo de Actualización

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUJO DE ACTUALIZACIÓN DE ACTIVO                │
└─────────────────────────────────────────────────────────────────┘

1. PUT /api/assets/:id
   ├─ Body: { description?, responsible?, location? }
   └─ Validación: Al menos 1 campo
         │
         ↓
2. UPDATE assets SET ...
   ├─ Actualiza solo campos proporcionados
   └─ WHERE id = $1
         │
         ↓
3. TRIGGER: trigger_update_assets_updated_at
   ├─ BEFORE UPDATE
   └─ SET updated_at = CURRENT_TIMESTAMP
         │
         ↓
4. Response
   └─ { success, message, data }
```

## Formato del asset_id

```
┌───────────────────────────────────────┐
│       FORMATO: AST-YYYY-NNNN          │
├───────────────────────────────────────┤
│                                       │
│  AST  -  2025  -  0001               │
│  │       │        │                   │
│  │       │        └─ Número secuencial│
│  │       │           (4 dígitos)      │
│  │       │                            │
│  │       └─────────── Año actual      │
│  │                    (4 dígitos)     │
│  │                                    │
│  └───────────────────── Prefijo fijo  │
│                                       │
└───────────────────────────────────────┘

Ejemplos:
  AST-2025-0001  ← Primer activo de 2025
  AST-2025-0042  ← Activo #42 de 2025
  AST-2025-1250  ← Activo #1250 de 2025
  AST-2026-0001  ← Primer activo de 2026 (reinicia contador)
```

## Relaciones Futuras (Expansión)

```
┌──────────────┐         ┌──────────────────┐
│   assets     │────────→│  asset_history   │
│              │  1:N    │                  │
│ asset_id (PK)│←────────│ asset_id (FK)    │
└──────────────┘         └──────────────────┘

Permite rastrear:
  • Cambios de ubicación
  • Cambios de responsable
  • Modificaciones en descripción
  • Quién hizo el cambio
  • Cuándo se hizo
```

## Extensiones PostgreSQL Utilizadas

```
🔌 EXTENSIONES:

uuid-ossp
└─ Propósito: Generar UUIDs (futuro uso)

pg_trgm
└─ Propósito: Búsqueda de texto con trigrams
   Uso: SELECT * FROM assets WHERE description % 'búsqueda';
```

## Ejemplo de Registro Completo

```json
{
  "id": 1,
  "asset_id": "AST-2025-0001",
  "description": "Laptop Dell Latitude 5420 - Intel Core i7 11va Gen, 16GB RAM, 512GB SSD, Windows 11 Pro. Estado: Excelente. Incluye cargador y maletín.",
  "responsible": "Juan Pérez Martínez",
  "location": "Oficina Principal - Piso 3 - Escritorio 301",
  "qr_code_path": "/qr_codes/AST-2025-0001.png",
  "created_at": "2025-10-06T20:00:00.000Z",
  "updated_at": "2025-10-06T20:00:00.000Z"
}
```

---

## Leyenda de Iconos

- 🔑 = Clave primaria (Primary Key)
- 🏷️ = Identificador único
- 📝 = Texto/Descripción
- 👤 = Usuario/Persona
- 📍 = Ubicación
- 📱 = Código QR
- 📅 = Fecha/Timestamp
- 🔄 = Campo auto-actualizable
- 📇 = Índice
- 🔒 = Constraint/Restricción
- ⚡ = Trigger
- 🔧 = Función
- 👁️ = Vista
- ⬅️ = Valor anterior
- ➡️ = Valor nuevo

---

**Versión del esquema:** 1.0.0  
**Fecha:** 2025-10-06
