# Guia del Componente QRScannerNew

## Descripcion

Componente completo para escanear codigos QR utilizando la camara del dispositivo o cargando imagenes desde archivos. Al detectar un codigo QR, busca automaticamente el activo en el sistema y muestra su informacion completa.

## Caracteristicas

### Modo Camara
- Acceso a camara web/movil
- Deteccion automatica en tiempo real
- Selector de camaras (si hay multiples)
- Indicador visual cuando detecta un codigo
- Control para iniciar/detener camara

### Modo Subir Imagen
- Cargar imagen desde archivo
- Soporta: JPG, PNG, WebP
- Area de drag & drop
- Escaneo desde galeria movil

### Busqueda Automatica
- Busca activo por asset_id escaneado
- Muestra informacion completa del activo
- Manejo de errores si no encuentra el activo
- Opcion de escanear otro codigo

### Manejo de Errores
- Permisos de camara denegados
- Camara no disponible
- Camara en uso por otra app
- QR no legible en imagen
- Activo no encontrado
- Timeout de camara

## Props

```javascript
<QRScannerNew
  onAssetFound={(asset) => {}}  // Callback cuando encuentra un activo
  onClose={() => {}}            // Callback para cerrar el scanner
/>
```

### onAssetFound
**Tipo:** `(asset: Object) => void`  
**Opcional:** Si  
**Descripcion:** Callback que se ejecuta cuando se encuentra exitosamente un activo.

**Parametro `asset`:**
```javascript
{
  id: 1,
  asset_id: "AST-2025-0001",
  description: "Laptop Dell...",
  responsible: "Juan Perez",
  location: "Oficina Principal",
  qr_code_path: "/qr_codes/AST-2025-0001.png",
  created_at: "2025-10-07T10:00:00.000Z",
  updated_at: "2025-10-07T10:00:00.000Z"
}
```

### onClose
**Tipo:** `() => void`  
**Opcional:** Si  
**Descripcion:** Callback para cerrar el componente.

---

## Uso Basico

### Ejemplo Simple

```javascript
import React, { useState } from 'react';
import { QRScannerNew } from './components';

function App() {
  const [showScanner, setShowScanner] = useState(false);

  const handleAssetFound = (asset) => {
    console.log('Activo encontrado:', asset);
    alert(`Activo encontrado: ${asset.asset_id}`);
  };

  return (
    <div>
      <button onClick={() => setShowScanner(true)}>
        Escanear QR
      </button>

      {showScanner && (
        <QRScannerNew
          onAssetFound={handleAssetFound}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
```

### Ejemplo Avanzado con Estado

```javascript
import React, { useState } from 'react';
import { QRScannerNew, AssetForm } from './components';

function InventoryScanner() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleAssetFound = (asset) => {
    setScannedAsset(asset);
    setShowScanner(false);
    // Puedes mostrar un modal, redirigir, editar, etc.
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  return (
    <div>
      <button onClick={() => setShowScanner(true)}>
        Escanear Codigo QR
      </button>

      {showScanner && (
        <QRScannerNew
          onAssetFound={handleAssetFound}
          onClose={() => setShowScanner(false)}
        />
      )}

      {scannedAsset && !editMode && (
        <div>
          <h2>Activo: {scannedAsset.asset_id}</h2>
          <p>{scannedAsset.description}</p>
          <button onClick={handleEdit}>Editar</button>
        </div>
      )}

      {editMode && scannedAsset && (
        <AssetForm
          assetToEdit={scannedAsset}
          onSuccess={() => {
            setEditMode(false);
            setScannedAsset(null);
          }}
          onCancel={() => setEditMode(false)}
        />
      )}
    </div>
  );
}
```

---

## Estados Internos

El componente maneja los siguientes estados:

| Estado | Tipo | Descripcion |
|--------|------|-------------|
| `scanning` | boolean | Indica si la camara esta activa |
| `cameraError` | string/null | Error al acceder a la camara |
| `cameras` | Array | Lista de camaras disponibles |
| `selectedCamera` | string/null | ID de la camara seleccionada |
| `scannedAsset` | Object/null | Activo encontrado |
| `loading` | boolean | Buscando activo en el servidor |
| `error` | string/null | Error al buscar activo |
| `scanSuccess` | boolean | Indicador visual de escaneo exitoso |
| `uploadMode` | boolean | Modo camara vs subir imagen |

---

## Flujo de Funcionamiento

### Modo Camara

1. **Inicializacion**
   - Detecta camaras disponibles
   - Selecciona camara trasera si es movil
   - Solicita permisos

2. **Inicio de Escaneo**
   - Usuario hace clic en "Iniciar Camara"
   - Solicita permisos si no los tiene
   - Inicia stream de video

3. **Deteccion**
   - Escanea frames a 10 FPS
   - Detecta codigo QR automaticamente
   - Muestra indicador visual

4. **Busqueda**
   - Extrae asset_id del QR
   - Detiene camara temporalmente
   - Hace request a `/api/assets/qr/:assetId`

5. **Resultado**
   - Muestra informacion del activo encontrado
   - O muestra mensaje de error

### Modo Subir Imagen

1. **Seleccion**
   - Usuario selecciona imagen desde archivo
   - O hace drag & drop

2. **Procesamiento**
   - Escanea imagen en busca de QR
   - Extrae texto del codigo

3. **Busqueda**
   - Hace request con el asset_id
   - Muestra resultado

---

## Manejo de Errores

### Errores de Camara

#### NotAllowedError
**Causa:** Usuario denego permisos de camara  
**Mensaje:** "Permiso de camara denegado. Por favor habilita el acceso..."  
**Solucion:** Guiar al usuario a configuracion del navegador

#### NotFoundError
**Causa:** No hay camaras disponibles  
**Mensaje:** "No se encontro ninguna camara disponible"  
**Solucion:** Usar modo subir imagen

#### NotReadableError
**Causa:** Camara en uso por otra aplicacion  
**Mensaje:** "La camara esta siendo usada por otra aplicacion"  
**Solucion:** Cerrar otras apps que usen camara

### Errores de Busqueda

#### 404 - Activo No Encontrado
**Mensaje:** "No se encontro ningun activo con ese codigo QR"  
**Accion:** Boton para reintentar escaneo

#### 500 - Error del Servidor
**Mensaje:** Error especifico del servidor  
**Accion:** Boton para reintentar

### Errores de Imagen

#### QR No Legible
**Mensaje:** "No se pudo leer el codigo QR de la imagen..."  
**Causa:** Imagen borrosa, QR danado, formato incorrecto  
**Solucion:** Subir imagen mas clara

---

## Permisos Requeridos

### Navegadores Web

El componente requiere permisos de camara. El navegador mostrara un dialogo la primera vez.

**Chrome/Edge:**
- Click en icono de candado en barra de direccion
- Permitir acceso a camara

**Firefox:**
- Click en icono de camara en barra de direccion
- Permitir acceso

**Safari:**
- Ir a Preferencias > Sitios web > Camara
- Permitir para el sitio

### Aplicaciones Moviles

Si se ejecuta dentro de una app (React Native, WebView):
- iOS: Agregar `NSCameraUsageDescription` en Info.plist
- Android: Agregar `CAMERA` permission en AndroidManifest.xml

---

## Configuracion Avanzada

### Personalizar Area de Escaneo

Modifica la configuracion en el codigo:

```javascript
const config = {
  fps: 10,                        // Frames por segundo
  qrbox: { width: 250, height: 250 }, // Tamano del area
  aspectRatio: 1.0,              // Relacion de aspecto
};
```

### Preferencia de Camara

El componente prefiere la camara trasera en dispositivos moviles:

```javascript
const backCamera = devices.find((device) =>
  device.label.toLowerCase().includes('back')
);
```

### Multiples Formatos

La libreria `html5-qrcode` soporta:
- QR Codes
- EAN
- CODE 128
- CODE 39
- UPC-A/E

---

## Optimizaciones

### Performance

- **FPS:** 10 frames/segundo (balance entre precision y rendimiento)
- **Debouncing:** Evita multiples escaneos del mismo codigo
- **Stop temporal:** Detiene camara durante busqueda

### Mobile

- **Camara trasera:** Seleccionada por defecto
- **Responsive:** Adaptado a pantallas pequenas
- **Touch:** Soporte completo de gestos

---

## Troubleshooting

### Problema: Camara No Inicia

**Posibles causas:**
1. Permisos no otorgados
2. HTTPS requerido (camara solo funciona en HTTPS o localhost)
3. Camara en uso

**Solucion:**
```javascript
// Verificar que estas en HTTPS
console.log(window.location.protocol); // debe ser 'https:'

// O usar localhost para desarrollo
```

### Problema: QR No Se Detecta

**Causas:**
1. QR muy pequeno o muy grande
2. Mala iluminacion
3. QR danado o borroso

**Solucion:**
- Acercar/alejar el codigo
- Mejorar iluminacion
- Limpiar camara
- Usar modo subir imagen

### Problema: Error CORS

Si el backend esta en otro dominio:

```javascript
// Configurar CORS en el servidor
app.use(cors({
  origin: 'https://tu-frontend.com',
  credentials: true
}));
```

### Problema: Multiples Escaneos

El componente incluye proteccion contra multiples escaneos:

```javascript
if (loading || scannedAsset) return; // No procesar si ya hay resultado
```

---

## Dependencias

### NPM Packages

```json
{
  "html5-qrcode": "^2.3.8",
  "axios": "^1.x"
}
```

### Instalar

```bash
npm install html5-qrcode
```

---

## Compatibilidad

### Navegadores

| Navegador | Version Minima | Soporte |
|-----------|----------------|---------|
| Chrome | 53+ | ✅ Completo |
| Firefox | 63+ | ✅ Completo |
| Safari | 11+ | ✅ Completo |
| Edge | 79+ | ✅ Completo |
| Opera | 40+ | ✅ Completo |

### Dispositivos

- ✅ Desktop (Windows, Mac, Linux)
- ✅ Android (Chrome, Firefox)
- ✅ iOS (Safari 11+)
- ✅ Tablets

---

## Mejoras Futuras

Posibles mejoras al componente:

1. **Historial de Escaneos**
   - Guardar ultimos codigos escaneados
   - Acceso rapido a activos recientes

2. **Escaneo Multiple**
   - Detectar varios QRs en una imagen
   - Modo batch para inventario rapido

3. **Modo Continuo**
   - No detener camara entre escaneos
   - Lista de activos escaneados

4. **Efectos de Sonido**
   - Beep al detectar codigo
   - Feedback audio para errores

5. **Vibracion**
   - Feedback haptico en moviles
   - Al detectar codigo

6. **Analytics**
   - Tracking de escaneos
   - Estadisticas de uso

---

## Ejemplos de Integracion

### Con AssetManager

```javascript
import { AssetManager, QRScannerNew } from './components';

function App() {
  const [view, setView] = useState('list');
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div>
      <button onClick={() => setShowScanner(true)}>
        Escanear QR
      </button>

      {showScanner && (
        <QRScannerNew
          onAssetFound={(asset) => {
            setShowScanner(false);
            // Navegar a vista de detalle o edicion
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <AssetManager />
    </div>
  );
}
```

### Con Redux

```javascript
import { useDispatch } from 'react-redux';
import { QRScannerNew } from './components';
import { setCurrentAsset } from './store/assetSlice';

function ScannerPage() {
  const dispatch = useDispatch();

  const handleAssetFound = (asset) => {
    dispatch(setCurrentAsset(asset));
    // Navegar a pagina de detalle
  };

  return (
    <QRScannerNew
      onAssetFound={handleAssetFound}
      onClose={() => history.back()}
    />
  );
}
```

---

**Version:** 1.0.0  
**Dependencia:** html5-qrcode ^2.3.8  
**Fecha:** 2025-10-07
