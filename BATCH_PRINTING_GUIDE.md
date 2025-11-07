# Guía de Impresión por Lotes - Inventario Cielo

## 📋 Descripción

El módulo de **Impresión por Lotes** permite generar un único PDF con múltiples etiquetas de activos en formato de rollo continuo, optimizado para impresoras térmicas de 40mm de ancho.

## 🎯 Características

### Formato del PDF
- **Ancho fijo**: 40mm (compatible con rollos térmicos estándar)
- **Alto variable**: 40mm × cantidad de etiquetas seleccionadas
- **Disposición**: Etiquetas apiladas verticalmente en rollo continuo
- **Calidad**: Cada etiqueta mantiene el formato profesional de 40mm × 40mm

### Contenido de cada etiqueta
- Logo de la empresa (duplicado en esquinas)
- Código QR del activo
- Número de serie
- Descripción del activo
- Ubicación
- Responsable
- Fecha de generación

## 🚀 Cómo Usar

### 1. Acceder al Módulo
Desde el menú principal, haz clic en **"Impresión por Lotes"** (icono de impresora 🖨️)

### 2. Seleccionar Activos

#### Búsqueda y Filtrado
- **Búsqueda**: Escribe en la caja de búsqueda para filtrar por:
  - Número de serie
  - Descripción
  - Ubicación
  - Responsable
  
- **Filtro de ubicación**: Usa el selector desplegable para filtrar por ubicación específica

#### Selección
- **Individual**: Haz clic en el checkbox de cada activo o en la fila completa
- **Todos**: Marca el checkbox en el encabezado para seleccionar/deseleccionar todos
- **Límite**: Máximo 100 etiquetas por lote (configurable)

### 3. Generar PDF

1. Haz clic en el botón **"Generar PDF (X)"** donde X es el número de activos seleccionados
2. Revisa la información en el modal de confirmación:
   - Cantidad de etiquetas
   - Dimensiones del rollo (40mm × Ymm)
   - Longitud total en milímetros
3. Haz clic en **"Generar y Descargar"**
4. El PDF se descargará automáticamente

### 4. Imprimir

1. Carga el PDF en tu aplicación móvil de impresión
2. Conecta a tu impresora térmica (Bluetooth/WiFi)
3. Configura la impresora para:
   - **Ancho de papel**: 40mm
   - **Modo**: Rollo continuo
   - **Corte**: Automático cada 40mm (si está disponible)
4. Imprime todas las etiquetas de una vez

## 💡 Ejemplos de Uso

### Ejemplo 1: 10 activos
- **PDF generado**: 40mm × 400mm
- **Tiempo estimado**: ~5 segundos
- **Etiquetas**: 10 unidades apiladas

### Ejemplo 2: 50 activos  
- **PDF generado**: 40mm × 2000mm (2 metros)
- **Tiempo estimado**: ~15 segundos
- **Etiquetas**: 50 unidades apiladas

### Ejemplo 3: 100 activos
- **PDF generado**: 40mm × 4000mm (4 metros)
- **Tiempo estimado**: ~30 segundos
- **Etiquetas**: 100 unidades apiladas

## ⚙️ Funcionalidades Avanzadas

### Generación Automática de QR
Si un activo seleccionado no tiene código QR:
- El sistema lo genera automáticamente
- Se guarda en la base de datos
- Se incluye en el PDF sin intervención manual

### Limpieza Automática
Los PDFs generados se eliminan automáticamente después de 24 horas para ahorrar espacio en disco.

### Descarga Directa
El archivo se descarga inmediatamente sin necesidad de navegar a otra página.

## 🔧 Configuración Técnica

### Limitaciones
- **Máximo de etiquetas por lote**: 100 (ajustable en `/src/backend/routes/assets.js`)
- **Tamaño máximo de archivo**: ~5MB por 100 etiquetas
- **Timeout de generación**: 60 segundos

### Ubicación de Archivos
- **PDFs generados**: `/public/batch_labels/`
- **Formato de nombre**: `batch_Xlabels_timestamp.pdf`
- **Retención**: 24 horas

### Endpoints API
```
POST /api/assets/batch/generate-labels
Body: { serialNumbers: ["ABC1234", "DEF5678", ...] }

GET /api/assets/batch/download-labels/:filename
```

## 📱 Compatibilidad con Impresoras

### Impresoras Térmicas Compatibles
- Cualquier impresora térmica de rollo de 40mm
- Conexión: Bluetooth, WiFi, USB
- Marcas probadas:
  - Brother QL series
  - Zebra ZD series
  - Dymo LabelWriter
  - TSC series
  - Godex series

### Aplicaciones Móviles Recomendadas
- **Android**: 
  - Brother iPrint&Label
  - Zebra Printer Setup Utility
  - PrintHand Mobile Print
  
- **iOS**:
  - Brother iPrint&Label
  - Zebra Printer Setup
  - Printopia

## 🐛 Resolución de Problemas

### El PDF no se descarga
- Verifica que las ventanas emergentes estén habilitadas
- Revisa la consola del navegador para errores
- Asegúrate de tener espacio en disco

### Las etiquetas se ven cortadas
- Configura la impresora para ancho de 40mm exacto
- Verifica que el modo sea "rollo continuo"
- Ajusta los márgenes a 0 en la configuración de impresión

### No aparecen los códigos QR
- Los QR se generan automáticamente, espera unos segundos
- Si persiste, revisa que el directorio `/public/qr_codes/` tenga permisos de escritura

### Error "Límite máximo excedido"
- Reduce la cantidad de activos seleccionados a 100 o menos
- Genera múltiples lotes si necesitas más etiquetas

## 📊 Ventajas vs Impresión Individual

| Característica | Individual | Por Lotes |
|----------------|-----------|-----------|
| Tiempo de preparación | 30 seg/etiqueta | 30 seg total |
| Interacción requerida | Alta | Baja |
| Archivos generados | 1 por activo | 1 por lote |
| Eficiencia | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Ideal para | 1-5 activos | 10+ activos |

## 🔐 Seguridad

- Los PDFs se almacenan temporalmente (24h)
- Validación de nombres de archivo para prevenir path traversal
- Límite de etiquetas para prevenir sobrecarga del servidor
- Solo usuarios autenticados pueden generar PDFs

## 📞 Soporte

Si tienes problemas con la impresión por lotes:
1. Consulta esta guía
2. Revisa los logs del servidor en `server.log`
3. Contacta al administrador del sistema

---

**Versión**: 1.0.0  
**Fecha**: Noviembre 2025  
**Autor**: Sistema Inventario Cielo
