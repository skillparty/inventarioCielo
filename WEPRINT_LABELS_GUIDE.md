# Guía de Generación de Etiquetas para WePrint (PDF)

## 📋 Descripción

El sistema ahora genera automáticamente archivos **PDF** compatibles con **WePrint** y otras aplicaciones de impresión de etiquetas. Estas etiquetas incluyen:

- **Logo de la empresa** (Cielo SRL) - dos veces en la etiqueta
- **Título**: "DOTACION CIELO"
- **Fecha** actual en formato DD/MM/AA
- **Código QR** del activo (centrado)
- **Encargado** (responsible)
- **Ubicación** (location)
- **Número de serie** (serial_number) en la parte inferior

## 🎨 Diseño de la Etiqueta (40mm x 40mm)

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

## ✅ Cambio Importante: .wdfx → PDF

**ANTES**: Generaba archivos `.wdfx` (BarTender)  
**AHORA**: Genera archivos `.pdf` (Compatible con WePrint y más aplicaciones)

### ¿Por qué PDF?
- ✅ Compatible con WePrint (Avery)
- ✅ Compatible con cualquier visor/impresora de PDF
- ✅ No requiere software específico para visualizar
- ✅ Formato estándar universal
- ✅ Mejor calidad de impresión

## 🚀 Cómo Usar

### 1. Desde la Interfaz Web

1. Abre la aplicación en tu navegador
2. Ve a la lista de activos
3. Haz click en el **botón verde** con icono de etiqueta 🏷️
4. El archivo PDF se descargará automáticamente

### 2. Desde la API (Terminal)

```bash
# Generar etiqueta
curl -X POST http://localhost:3000/api/assets/CEL-002/generate-label

# Descargar etiqueta
curl -O http://localhost:3000/api/assets/CEL-002/download-label
```

### 3. Abrir con WePrint

1. Abre WePrint
2. Importa el archivo PDF descargado
3. Ajusta la configuración de impresión si es necesario
4. Imprime

## 📦 API Endpoints

### POST `/api/assets/:serial_number/generate-label`
Genera un archivo PDF para el activo especificado.

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/assets/ODN2949/generate-label
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Etiqueta PDF generada exitosamente",
  "serial_number": "ODN2949",
  "label": {
    "filePath": "/labels/ODN2949.pdf",
    "fileName": "ODN2949.pdf",
    "downloadUrl": "/api/assets/ODN2949/download-label"
  }
}
```

### GET `/api/assets/:serial_number/download-label`
Descarga el archivo PDF generado.

**Ejemplo:**
```bash
# Descargar directamente
curl -O http://localhost:3000/api/assets/ODN2949/download-label

# O abre en el navegador
open http://localhost:3000/api/assets/ODN2949/download-label
```

## 📁 Archivos Generados

Los archivos PDF se guardan en:
```
/public/labels/[SERIAL_NUMBER].pdf
```

Ejemplo:
- `/public/labels/CEL-002.pdf`
- `/public/labels/ODN2949.pdf`

## 🎯 Especificaciones Técnicas

### Tamaño de Etiqueta
- **Ancho**: 40mm (113.39 puntos)
- **Alto**: 40mm (113.39 puntos)
- **Formato**: Cuadrado
- **Orientación**: Vertical
- **Resolución**: PDF vectorial (escala infinita)

### Elementos de la Etiqueta

| Elemento | Posición | Fuente | Descripción |
|----------|----------|--------|-------------|
| INVENTARIO_CIELO | Superior izq | Helvetica-Bold 6pt | Título del sistema |
| 40 x 40(Mi) | Superior der | Helvetica 5pt | Tamaño de etiqueta |
| DOTACION CIELO | Centro superior | Helvetica-Bold 10pt | Título principal |
| Logo (x2) | Izq y Der | 8x8mm | Logo de la empresa |
| Fecha | Centro | Helvetica 6pt | Fecha de generación |
| ENCARGADO | Izquierda | Helvetica-Bold 6pt | Responsable |
| QR Code | Centro | 18x18mm | Código QR del activo |
| UBICACIÓN | Derecha | Helvetica-Bold 6pt | Ubicación |
| Serial Number | Inferior | Helvetica-Bold 9pt | Número de serie |

### Colores
- **Fondo**: #F5F5F5 (gris muy claro)
- **Borde**: #666666 (gris)
- **Texto**: #000000 (negro)

## 🔧 Configuración

### Logo de la Empresa
El logo debe estar ubicado en:
```
/public/assets/logo-cielo.png
```

**Requisitos del logo:**
- Formato: PNG (con transparencia preferiblemente)
- Tamaño recomendado: 500x500px o mayor
- Peso: Menor a 1MB

## 📱 Compatibilidad

El PDF generado es compatible con:
- ✅ **WePrint** (Avery)
- ✅ Adobe Acrobat Reader
- ✅ Preview (macOS)
- ✅ Chrome/Firefox/Edge (navegadores)
- ✅ Microsoft Edge PDF
- ✅ Foxit Reader
- ✅ Cualquier impresora PDF
- ✅ Impresoras térmicas de etiquetas

## 🖨️ Imprimir con WePrint

### Método 1: Importar PDF
1. Abre WePrint
2. Crea un nuevo proyecto o abre uno existente
3. Importa el PDF descargado
4. Ajusta la posición si es necesario
5. Imprime

### Método 2: Uso Directo
1. Descarga la etiqueta PDF
2. Abre con el visor PDF predeterminado
3. Imprime directamente en tu impresora de etiquetas
4. Configura el tamaño de papel a 40mm x 40mm

## 💡 Consejos

### Para Mejor Calidad
- Usa impresoras térmicas dedicadas para etiquetas
- Configura la resolución a 300 DPI o superior
- Usa papel de etiquetas de calidad (40mm x 40mm)

### Para Producción en Masa
- Genera todas las etiquetas de una vez
- Usa el endpoint de batch (próximamente)
- Imprime en lotes de 10-20 etiquetas

## 🐛 Solución de Problemas

### El logo no aparece en el PDF
**Solución**: 
- Verifica que `/public/assets/logo-cielo.png` existe
- Verifica que el archivo no esté vacío (más de 0 bytes)
- Verifica permisos de lectura del archivo

### El QR Code no aparece
**Solución**:
- El código QR se genera automáticamente
- Si no aparece, verifica que el activo tenga un QR generado
- Regenera el QR desde la interfaz

### WePrint no puede abrir el PDF
**Solución**:
- Verifica que el PDF no esté corrupto (ábrelo primero en otro visor)
- Asegúrate de usar la versión más reciente de WePrint
- Intenta importar el PDF en lugar de abrirlo directamente

### El PDF se descarga pero está vacío
**Solución**:
- Verifica los logs del servidor
- Asegúrate de que el activo existe en la base de datos
- Regenera la etiqueta

## 📊 Ejemplo de Código

### JavaScript (Frontend)
```javascript
import { downloadBarTenderLabel } from './services/api';

const handleDownloadLabel = async (serialNumber) => {
  try {
    await downloadBarTenderLabel(serialNumber);
    console.log('PDF descargado exitosamente');
  } catch (error) {
    console.error('Error:', error);
    alert('Error al descargar etiqueta');
  }
};

// Uso
handleDownloadLabel('CEL-002');
```

### cURL
```bash
# Generar y descargar
curl -X POST http://localhost:3000/api/assets/CEL-002/generate-label && \
curl -O http://localhost:3000/api/assets/CEL-002/download-label
```

### Python
```python
import requests

serial_number = 'CEL-002'
base_url = 'http://localhost:3000/api/assets'

# Generar etiqueta
response = requests.post(f'{base_url}/{serial_number}/generate-label')
print(response.json())

# Descargar etiqueta
pdf_response = requests.get(f'{base_url}/{serial_number}/download-label')
with open(f'{serial_number}.pdf', 'wb') as f:
    f.write(pdf_response.content)
print(f'PDF guardado: {serial_number}.pdf')
```

## 🔄 Migración desde .wdfx

Si tenías el sistema anterior con archivos `.wdfx`:

1. Los archivos `.wdfx` antiguos permanecen en `/public/labels/`
2. Los nuevos archivos PDF se generan en el mismo directorio
3. La API ahora genera PDF por defecto
4. No necesitas cambiar nada en el frontend
5. El botón verde ahora descarga PDF automáticamente

## 📝 Changelog

### Versión 2.0.0 - Oct 20, 2025
- ✅ Cambio de formato de .wdfx a PDF
- ✅ Compatibilidad con WePrint
- ✅ Mejor calidad de renderizado
- ✅ Soporte universal para visores PDF
- ✅ Instalación de PDFKit y Sharp

### Versión 1.0.0 - Oct 19, 2025
- ✅ Implementación inicial con .wdfx
- ✅ Generación de códigos QR
- ✅ Logo de empresa
- ✅ Integración con BarTender

---

**Formato Actual**: PDF (WePrint compatible)  
**Versión**: 2.0.0  
**Fecha**: Octubre 20, 2025  
**Contacto**: zeuz_pochoclo@hotmail.com
