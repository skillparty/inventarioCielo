# Guia de Funcionalidades del Sistema

## Funcionalidades Implementadas

### 1. ✅ Gestión Completa de Activos (CRUD)

**Componentes:**
- `AssetList.jsx` - Tabla con paginación y búsqueda
- `AssetForm.jsx` - Formulario crear/editar
- `AssetManager.jsx` - Contenedor principal

**Características:**
- Crear activos con generación automática de ID (AST-YYYY-####)
- Editar activos existentes
- Eliminar activos con confirmación
- Búsqueda en tiempo real (debounce 500ms)
- Paginación (10 items por página)
- Validación de campos

**API Endpoints:**
```
GET    /api/assets              - Listar con paginación
GET    /api/assets/:id          - Obtener por ID
GET    /api/assets/qr/:assetId  - Buscar por asset_id
GET    /api/assets/search?q=    - Buscar por término
POST   /api/assets              - Crear activo
PUT    /api/assets/:id          - Actualizar activo
DELETE /api/assets/:id          - Eliminar activo
```

---

### 2. 📊 Dashboard con Estadísticas

**Componente:** `DashboardNew.jsx`

**Estadísticas mostradas:**
- ✅ Total de activos en el sistema
- ✅ Activos creados esta semana
- ✅ Activos creados este mes
- ✅ Número de ubicaciones diferentes
- ✅ Gráfico de barras: Activos por ubicación (top 10)
- ✅ Ranking: Top 5 responsables
- ✅ Lista de últimos 5 activos creados

**Acciones rápidas desde Dashboard:**
- Crear nuevo activo
- Escanear código QR
- Exportar a CSV
- Crear backup de DB

**API Endpoint:**
```
GET /api/assets/stats/dashboard
```

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "thisWeek": 12,
    "thisMonth": 45,
    "byLocation": [
      { "location": "Oficina Principal", "count": "75" },
      { "location": "Almacén", "count": "30" }
    ],
    "byResponsible": [
      { "responsible": "Juan Pérez", "count": "25" }
    ],
    "recent": [...]
  }
}
```

---

### 3. 📥 Exportación de Datos a CSV

**Función:** `exportToCSV()` en `api.js`

**Características:**
- Exporta todos los activos del sistema
- Formato CSV compatible con Excel
- Incluye BOM UTF-8 para caracteres especiales
- Nombre de archivo con timestamp
- Descarga automática en el navegador

**Campos exportados:**
- ID interno
- Asset ID (código único)
- Descripción
- Responsable
- Ubicación
- Fecha de creación
- Fecha de actualización

**API Endpoint:**
```
GET /api/assets/export/csv
```

**Uso en React:**
```javascript
import { exportToCSV } from '../services/api';

const handleExport = async () => {
  try {
    await exportToCSV();
    alert('✅ Inventario exportado exitosamente');
  } catch (error) {
    alert('❌ Error al exportar');
  }
};
```

**Nombre de archivo generado:**
```
inventario_2025-10-07T12-30-45.csv
```

---

### 4. 📷 Escaneo de Códigos QR

**Componente:** `QRScannerNew.jsx`

**Modos de escaneo:**
1. **Cámara en tiempo real** (10 FPS)
   - Detección automática
   - Soporte para múltiples cámaras
   - Preferencia de cámara trasera en móviles
   
2. **Subir imagen desde archivo**
   - Formatos: JPG, PNG, WebP
   - Drag & drop
   - Desde galería en móviles

**Características:**
- Búsqueda automática del activo escaneado
- Muestra información completa del activo
- Indicador visual de éxito
- Manejo de errores completo (permisos, cámara en uso, QR no legible)

**Librerías utilizadas:**
- `html5-qrcode` v2.3.8

---

### 5. 🖨️ Generación de Códigos QR

**Componente:** `QRGenerator.jsx`

**Características:**
- Vista previa del QR (280x280px)
- Descargar como PNG
- Imprimir con formato profesional
- Copiar URL al portapapeles
- Información del activo integrada

**API Endpoint:**
```
POST /api/assets/:id/generate-qr
```

**QR generados:**
- Formato: PNG
- Tamaño: 300x300px
- Ubicación: `/public/qr_codes/`
- Nombre: `AST-YYYY-####.png`

---

### 6. 🏷️ Impresión de Etiquetas

**Archivo:** `src/frontend/utils/printLabel.js`

**3 formatos de etiquetas:**

#### a) Etiqueta Estándar (4" x 2")
```javascript
import { printAssetLabel } from '../utils/printLabel';

printAssetLabel(asset, qrDataURL);
```

**Incluye:**
- Código QR (1.4" x 1.4")
- Asset ID destacado
- Descripción (truncada a 50 caracteres)
- Ubicación
- Responsable
- Footer con nombre del sistema

#### b) Etiqueta Pequeña (2" x 2")
```javascript
import { printSmallLabel } from '../utils/printLabel';

printSmallLabel(asset, qrDataURL);
```

**Incluye:**
- Código QR grande
- Asset ID

#### c) Etiquetas Múltiples
```javascript
import { printMultipleLabels } from '../utils/printLabel';

const assetsWithQR = [
  { asset: {...}, qrDataURL: '...' },
  { asset: {...}, qrDataURL: '...' }
];

printMultipleLabels(assetsWithQR);
```

**Características:**
- Optimizado para impresoras de etiquetas
- CSS print-friendly
- Page break automático
- Preview antes de imprimir

---

### 7. 🔍 Búsqueda Avanzada

**Función:** `advancedSearch()` en `api.js`

**Filtros disponibles:**
- 📍 Ubicación (LIKE)
- 👤 Responsable (LIKE)
- 📅 Fecha desde (>=)
- 📅 Fecha hasta (<=)
- 🔎 Término de búsqueda (en asset_id o description)

**API Endpoint:**
```
POST /api/assets/search/advanced
```

**Body ejemplo:**
```json
{
  "location": "Oficina",
  "responsible": "Juan",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-12-31",
  "searchTerm": "laptop"
}
```

**Uso en React:**
```javascript
import { advancedSearch } from '../services/api';

const filters = {
  location: 'Oficina Principal',
  responsible: 'Juan Pérez',
  dateFrom: '2025-01-01',
  dateTo: '2025-12-31'
};

const results = await advancedSearch(filters);
console.log(`Encontrados: ${results.count} activos`);
```

**Características:**
- Filtros opcionales (puedes usar solo algunos)
- Búsqueda con ILIKE (case-insensitive)
- Combina todos los filtros con AND
- Retorna count de resultados

---

### 8. 💾 Backup de Base de Datos

**Función:** `createBackup()` en `api.js`

**Características:**
- Usa `pg_dump` de PostgreSQL
- Formato: SQL plano
- Guardado en carpeta `/backups/`
- Nombre con timestamp
- Retorna tamaño del backup

**API Endpoint:**
```
POST /api/db-backup
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Backup creado exitosamente",
  "backup": {
    "filename": "backup_2025-10-07T12-30-45.sql",
    "filepath": "/path/to/backups/backup_2025-10-07T12-30-45.sql",
    "size": 153600,
    "sizeFormatted": "150.00 KB",
    "timestamp": "2025-10-07T12:30:45.123Z"
  }
}
```

**Uso desde Dashboard:**
```javascript
const handleBackup = async () => {
  try {
    const response = await createBackup();
    alert(`✅ Backup creado: ${response.backup.filename}`);
  } catch (error) {
    alert('❌ Error al crear backup');
  }
};
```

**Restaurar backup:**
```bash
psql -U postgres -d inventario_db < backups/backup_2025-10-07T12-30-45.sql
```

---

## Menú de Electron

### Archivo
- **Nuevo Activo** (`Ctrl+N`) - Abre formulario de creación
- **Exportar Inventario** (`Ctrl+E`) - Exporta a CSV
- **Configuración** (`Ctrl+,`)
- **Salir** (`Ctrl+Q`)

### Ver
- **Recargar** (`Ctrl+R`)
- **Forzar Recarga** (`Ctrl+Shift+R`)
- **Pantalla Completa** (`F11`)
- **Zoom In** (`Ctrl++`)
- **Zoom Out** (`Ctrl+-`)
- **Zoom Reset** (`Ctrl+0`)
- **DevTools** (`Ctrl+Shift+I`)

### Herramientas
- **Escanear QR** (`Ctrl+S`) - Abre escáner
- **Generar Reporte** (`Ctrl+G`)
- **Verificar Base de Datos** - Test de conexión
- **Reiniciar Servidor** - Reinicia Express

### Ayuda
- **Documentación** - Abre GitHub
- **Reportar Problema** - Issues en GitHub
- **Acerca de** - Información del sistema

---

## Integración de Componentes

### App Principal con Dashboard

```javascript
import React, { useState } from 'react';
import {
  DashboardNew,
  AssetManager,
  QRScannerNew
} from './components';

function App() {
  const [view, setView] = useState('dashboard');

  const handleNavigate = (destination) => {
    setView(destination);
  };

  return (
    <div className="App">
      {view === 'dashboard' && (
        <DashboardNew onNavigate={handleNavigate} />
      )}
      
      {view === 'assets' && (
        <AssetManager />
      )}
      
      {view === 'scan' && (
        <QRScannerNew 
          onAssetFound={(asset) => {
            console.log('Asset found:', asset);
          }}
          onClose={() => setView('dashboard')}
        />
      )}
    </div>
  );
}
```

---

## Estructura de Archivos Actualizada

```
src/
├── frontend/
│   ├── components/
│   │   ├── AssetList.jsx
│   │   ├── AssetList.module.css
│   │   ├── AssetForm.jsx
│   │   ├── AssetForm.module.css
│   │   ├── QRGenerator.jsx
│   │   ├── QRGenerator.module.css
│   │   ├── QRScannerNew.jsx
│   │   ├── QRScannerNew.module.css
│   │   ├── AssetManager.jsx
│   │   ├── AssetManager.module.css
│   │   ├── DashboardNew.jsx        ← NUEVO
│   │   ├── DashboardNew.module.css ← NUEVO
│   │   └── index.js
│   ├── services/
│   │   └── api.js (actualizado con nuevas funciones)
│   └── utils/
│       └── printLabel.js             ← NUEVO
├── backend/
│   ├── routes/
│   │   └── assets.js (3 endpoints nuevos)
│   └── server.js (endpoint de backup)
└── backups/                           ← NUEVO
    └── (archivos .sql)
```

---

## Próximas Mejoras Sugeridas

- [ ] Búsqueda avanzada con UI de filtros en componente
- [ ] Historial de cambios en activos
- [ ] Reportes personalizables (PDF, Excel)
- [ ] Gráficos más avanzados (Chart.js, Recharts)
- [ ] Notificaciones de mantenimiento programadas
- [ ] Importación masiva desde CSV
- [ ] Autenticación y roles de usuario
- [ ] API REST documentada con Swagger
- [ ] Tests unitarios y de integración

---

## Comandos Útiles

```bash
# Desarrollo
npm start                    # Inicia todo
npm run dev                  # Alias

# Exportar datos
curl http://localhost:5000/api/assets/export/csv -o inventario.csv

# Estadísticas
curl http://localhost:5000/api/assets/stats/dashboard

# Crear backup
curl -X POST http://localhost:5000/api/db-backup

# Búsqueda avanzada
curl -X POST http://localhost:5000/api/assets/search/advanced \
  -H "Content-Type: application/json" \
  -d '{"location":"Oficina","responsible":"Juan"}'
```

---

**Sistema de Inventario Cielo v1.0.0**  
Todas las funcionalidades complementarias implementadas ✅
