# Guía de Generación de Etiquetas BarTender

## Descripción

El sistema ahora puede generar automáticamente archivos `.wdfx` (BarTender) para cada activo del inventario. Estas etiquetas incluyen:

- **Logo de la empresa** (Cielo SRL) - dos veces en la etiqueta
- **Título**: "DOTACION CIELO"
- **Fecha** actual en formato DD/MM/AA
- **Código QR** del activo (centrado)
- **Encargado** (responsible)
- **Ubicación** (location)
- **Número de serie** (serial_number) en la parte inferior

## Diseño de la Etiqueta

```
┌────────────────────────────────────────┐
│ INVENTARIO_CIELO        40 x 40(Mi)    │
│                                        │
│        DOTACION CIELO                  │
│                                        │
│  [Logo]  Fecha: DD/MM/AA    [Logo]    │
│                                        │
│  ENCARGADO:  [   QR   ]   UBICACIÓN   │
│    Sally     [ CODE  ]      Granja    │
│              [       ]                 │
│                                        │
│            CEL-002                     │
└────────────────────────────────────────┘
```

## Configuración del Logo

1. **Guardar el logo**: Coloca el logo de la empresa en:
   ```
   /public/assets/logo-cielo.png
   ```

2. El logo se mostrará dos veces en la etiqueta (superior izquierda y derecha)

## API Endpoints

### 1. Generar Etiqueta

**POST** `/api/assets/:serial_number/generate-label`

Genera un archivo `.wdfx` para el activo especificado.

**Ejemplo:**
```bash
curl -X POST http://localhost:5001/api/assets/CEL-002/generate-label
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Etiqueta BarTender generada exitosamente",
  "serial_number": "CEL-002",
  "label": {
    "filePath": "/labels/CEL-002.wdfx",
    "fileName": "CEL-002.wdfx",
    "downloadUrl": "/api/assets/CEL-002/download-label"
  }
}
```

### 2. Descargar Etiqueta

**GET** `/api/assets/:serial_number/download-label`

Descarga el archivo `.wdfx` generado.

**Ejemplo:**
```bash
curl -O http://localhost:5001/api/assets/CEL-002/download-label
```

## Uso en el Frontend

### Agregar botón de descarga

```javascript
import { generateBarTenderLabel } from './services/api';

// En el componente de detalle del activo
const handleGenerateLabel = async (serialNumber) => {
  try {
    const response = await generateBarTenderLabel(serialNumber);
    
    // Descargar automáticamente
    window.open(response.label.downloadUrl, '_blank');
    
    console.log('Etiqueta generada:', response);
  } catch (error) {
    console.error('Error al generar etiqueta:', error);
  }
};

// JSX
<button onClick={() => handleGenerateLabel(asset.serial_number)}>
  Descargar Etiqueta BarTender (.wdfx)
</button>
```

## Funciones del API Service

Agregar a `/src/frontend/services/api.js`:

```javascript
/**
 * Generar etiqueta BarTender para un activo
 */
export const generateBarTenderLabel = async (serialNumber) => {
  const response = await api.post(`/api/assets/${serialNumber}/generate-label`);
  return response.data;
};

/**
 * Descargar etiqueta BarTender
 */
export const downloadBarTenderLabel = (serialNumber) => {
  return `${API_URL}/api/assets/${serialNumber}/download-label`;
};
```

## Archivos Generados

Los archivos `.wdfx` se guardan en:
```
/public/labels/[SERIAL_NUMBER].wdfx
```

Ejemplo:
- `/public/labels/CEL-002.wdfx`
- `/public/labels/ODN2949.wdfx`

## Formato del Archivo .wdfx

El archivo `.wdfx` es un XML que BarTender puede abrir directamente. Contiene:

- **Plantilla BTW**: Diseño de la etiqueta (40mm x 40mm)
- **Datos del activo**: Serial, descripción, responsable, ubicación
- **Código QR**: Referencia al archivo PNG del QR code
- **Logo**: Referencia al logo de la empresa
- **Fecha**: Fecha actual de generación

## Imprimir con BarTender

1. Genera la etiqueta desde el sistema
2. Descarga el archivo `.wdfx`
3. Abre el archivo con BarTender
4. Conecta tu impresora de etiquetas
5. Imprime directamente

## Tamaño de la Etiqueta

- **Formato**: 40mm x 40mm (cuadrado)
- **Resolución**: 300 DPI
- **Orientación**: Vertical

## Notas Técnicas

- El sistema genera automáticamente el código QR si no existe
- Cada activo tiene su propio archivo `.wdfx` único
- Los archivos se regeneran cada vez que se solicitan (siempre actualizados)
- El logo debe estar en formato PNG para mejor calidad

## Troubleshooting

### El logo no aparece
- Verifica que el archivo exista en `/public/assets/logo-cielo.png`
- Asegúrate de que el formato sea PNG
- Verifica los permisos del archivo

### Error al generar etiqueta
- Verifica que el directorio `/public/labels` exista
- Verifica permisos de escritura
- Revisa los logs del servidor

### BarTender no puede abrir el archivo
- Verifica que BarTender esté instalado
- Asegúrate de tener una versión compatible (2016 o superior)
- Verifica que el archivo no esté corrupto

## Ejemplo Completo

```javascript
// Generar y descargar etiqueta
const serialNumber = 'CEL-002';

// 1. Generar
const response = await fetch(
  `http://localhost:5001/api/assets/${serialNumber}/generate-label`,
  { method: 'POST' }
);
const data = await response.json();

// 2. Descargar
window.location.href = data.label.downloadUrl;

// O usar axios
import axios from 'axios';

const generateAndDownload = async (serialNumber) => {
  // Generar
  await axios.post(`/api/assets/${serialNumber}/generate-label`);
  
  // Descargar
  const downloadUrl = `/api/assets/${serialNumber}/download-label`;
  window.open(downloadUrl, '_blank');
};
```

## Integración Futura

Posibles mejoras:
- Impresión directa desde el navegador
- Preview de la etiqueta antes de imprimir
- Batch printing (imprimir múltiples etiquetas)
- Personalización del diseño
- Diferentes tamaños de etiquetas
- Exportar a otros formatos (PDF, PNG)

---

**Versión:** 1.0.0  
**Fecha:** Octubre 2025  
**Contacto:** zeuz_pochoclo@hotmail.com
