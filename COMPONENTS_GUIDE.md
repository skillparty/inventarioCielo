# Guia de Componentes React

## Componentes Creados

### 1. AssetList.jsx
**Descripcion:** Tabla completa de activos con busqueda y paginacion.

**Caracteristicas:**
- Tabla responsive con todos los activos
- Busqueda en tiempo real (con debounce de 500ms)
- Paginacion (10 items por pagina)
- Acciones: Editar, Eliminar, Ver QR
- Estados de carga y error

**Props:**
```javascript
<AssetList 
  onEdit={(asset) => {}}      // Callback al editar un activo
  onViewQR={(asset) => {}}    // Callback al ver QR de un activo
/>
```

**Columnas de la tabla:**
- ID Activo (asset_id)
- Descripcion (truncada a 80 caracteres)
- Responsable
- Ubicacion
- Fecha de Creacion
- Acciones

---

### 2. AssetForm.jsx
**Descripcion:** Formulario para crear o editar activos.

**Caracteristicas:**
- Validacion completa de campos
- Mensajes de exito/error
- Contador de caracteres
- Generacion automatica de ID
- Muestra QR generado al crear
- Boton para descargar QR

**Props:**
```javascript
<AssetForm 
  assetToEdit={asset}         // (Opcional) Activo a editar
  onSuccess={(asset) => {}}   // Callback al guardar exitosamente
  onCancel={() => {}}         // Callback al cancelar
/>
```

**Validaciones:**
- `description`: 10-5000 caracteres
- `responsible`: 3-255 caracteres
- `location`: 3-255 caracteres
- Todos los campos son obligatorios

**Comportamiento:**
- Si `assetToEdit` es null: modo crear
- Si `assetToEdit` tiene valor: modo editar
- Al crear, muestra el QR generado
- Al editar, no muestra QR (usar QRGenerator)

---

### 3. QRGenerator.jsx
**Descripcion:** Modal para visualizar, descargar e imprimir codigos QR.

**Caracteristicas:**
- Vista previa del QR en alta calidad
- Informacion completa del activo
- Descargar QR como PNG
- Imprimir QR con formato profesional
- Copiar URL del QR al portapapeles
- Regeneracion automatica del QR

**Props:**
```javascript
<QRGenerator 
  asset={asset}               // Activo del cual mostrar el QR
  onClose={() => {}}          // Callback al cerrar el modal
/>
```

**Funcionalidades:**
- Genera/obtiene QR del backend
- Imagen QR de 280x280px (en modal)
- Impresion con hoja formateada
- URL completa del archivo QR

---

### 4. AssetManager.jsx
**Descripcion:** Componente contenedor que integra todos los componentes.

**Caracteristicas:**
- Manejo de vistas (list, create, edit)
- Navegacion con breadcrumb
- Control de estado global
- Boton flotante para crear
- Modal de QR integrado

**Sin props (componente independiente)**

**Vistas:**
- `list`: Muestra AssetList
- `create`: Muestra AssetForm en modo crear
- `edit`: Muestra AssetForm en modo editar

---

## Como Usar

### Uso Simple (AssetManager)
El uso mas simple es importar solo `AssetManager`:

```javascript
import React from 'react';
import { AssetManager } from './components';

function App() {
  return (
    <div className="App">
      <AssetManager />
    </div>
  );
}

export default App;
```

---

### Uso Avanzado (Componentes Individuales)

#### Ejemplo: Listado de Activos

```javascript
import React, { useState } from 'react';
import { AssetList, AssetForm, QRGenerator } from './components';

function MyInventoryPage() {
  const [view, setView] = useState('list');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setView('edit');
  };

  const handleViewQR = (asset) => {
    setSelectedAsset(asset);
    setShowQR(true);
  };

  const handleSuccess = () => {
    setView('list');
    setSelectedAsset(null);
  };

  return (
    <div>
      {view === 'list' && (
        <AssetList 
          onEdit={handleEdit}
          onViewQR={handleViewQR}
        />
      )}

      {view === 'edit' && (
        <AssetForm 
          assetToEdit={selectedAsset}
          onSuccess={handleSuccess}
          onCancel={() => setView('list')}
        />
      )}

      {showQR && (
        <QRGenerator 
          asset={selectedAsset}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
```

---

## Estilos

Todos los componentes usan **CSS Modules** para estilos encapsulados:

- `AssetList.module.css`
- `AssetForm.module.css`
- `QRGenerator.module.css`
- `AssetManager.module.css`

### Tema de Colores

**Colores principales:**
- Primary: `#3498db` (Azul)
- Success: `#27ae60` (Verde)
- Warning: `#f39c12` (Naranja)
- Danger: `#e74c3c` (Rojo)
- Purple: `#9b59b6` (Morado para QR)

**Colores de texto:**
- Heading: `#2c3e50`
- Body: `#34495e`
- Muted: `#7f8c8d`

---

## Estructura de Archivos

```
src/frontend/
├── components/
│   ├── AssetList.jsx
│   ├── AssetList.module.css
│   ├── AssetForm.jsx
│   ├── AssetForm.module.css
│   ├── QRGenerator.jsx
│   ├── QRGenerator.module.css
│   ├── AssetManager.jsx
│   ├── AssetManager.module.css
│   └── index.js
├── services/
│   └── api.js
└── App.js
```

---

## Servicios API Utilizados

Los componentes utilizan estos servicios de `api.js`:

```javascript
import {
  getAssets,           // Obtener activos paginados
  searchAssets,        // Buscar activos
  getAssetById,        // Obtener activo por ID
  createAsset,         // Crear activo
  updateAsset,         // Actualizar activo
  deleteAsset,         // Eliminar activo
  generateQRCode,      // Generar codigo QR
} from '../services/api';
```

---

## Estados de los Componentes

### AssetList
- `assets`: Array de activos
- `loading`: Boolean (cargando)
- `error`: String (mensaje de error)
- `searchTerm`: String (termino de busqueda)
- `currentPage`: Number (pagina actual)
- `pagination`: Object (info de paginacion)
- `isSearching`: Boolean (en busqueda)

### AssetForm
- `formData`: Object { description, responsible, location }
- `errors`: Object (errores de validacion)
- `loading`: Boolean (guardando)
- `successMessage`: String
- `errorMessage`: String
- `qrData`: Object (datos del QR generado)

### QRGenerator
- `qrData`: Object (datos del QR)
- `loading`: Boolean (generando)
- `error`: String (mensaje de error)

---

## Responsive Design

Todos los componentes son completamente responsive:

**Breakpoints:**
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px
- Small Mobile: < 480px

**Adaptaciones mobile:**
- Tablas con scroll horizontal
- Botones en columna
- Formularios apilados
- Modal QR ocupa pantalla completa
- Breadcrumb simplificado

---

## Accesibilidad

Los componentes incluyen:
- Labels semanticos
- Atributos ARIA cuando necesario
- Mensajes de error descriptivos
- Estados de carga visibles
- Contraste de colores adecuado
- Navegacion por teclado

---

## Dependencias

**NPM packages requeridos:**
```json
{
  "react": "^18.x",
  "axios": "^1.x"
}
```

**No se requieren librerias adicionales de UI.**

---

## Proximos Pasos

Para integrar los componentes en tu aplicacion:

1. Asegurate de tener el backend corriendo en `http://localhost:5000`
2. Configura la variable de entorno `REACT_APP_API_URL` si necesitas otro URL
3. Importa `AssetManager` en tu `App.js`
4. Los estilos globales deben estar en `index.css`

```javascript
// App.js
import React from 'react';
import { AssetManager } from './frontend/components';

function App() {
  return <AssetManager />;
}

export default App;
```

---

## Troubleshooting

**Problema:** Los estilos no se aplican
- **Solucion:** Verifica que los archivos `.module.css` esten en la misma carpeta que los componentes

**Problema:** Error de API
- **Solucion:** Verifica que el backend este corriendo en el puerto 5000

**Problema:** QR no se muestra
- **Solucion:** Verifica que la carpeta `/public/qr_codes/` tenga permisos de escritura

**Problema:** Busqueda muy lenta
- **Solucion:** El debounce es de 500ms, espera medio segundo despues de escribir

---

**Version:** 1.0.0  
**Fecha:** 2025-10-07
