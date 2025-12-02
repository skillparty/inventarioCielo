import axios from 'axios';

// Configuración dinámica de API_URL para acceso multi-dispositivo
// Si estamos en localhost, usar proxy relativo (vacío)
// Si estamos en otro dispositivo (IP de red), usar la URL completa del backend
const getApiUrl = () => {
  // Si hay una variable de entorno configurada y no está vacía, usarla
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== '') {
    return process.env.REACT_APP_API_URL;
  }
  
  // En localhost, usar el proxy (no especificar baseURL)
  // El proxy en setupProxy.js redirigirá /api a https://localhost:5001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return ''; // Vacío para usar proxy relativo
  }
  
  // Si accedemos desde la red (celular u otro dispositivo), 
  // usar la IP del servidor con el puerto del backend
  return `https://${window.location.hostname}:5001`;
};

const API_URL = getApiUrl();

// Log para debugging - muestra la URL configurada
console.log('🔧 API Configuration:', {
  hostname: window.location.hostname,
  apiUrl: API_URL || '(proxy relativo)',
  fullUrl: API_URL || window.location.origin
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================================
// ASSETS API SERVICES
// =====================================================

/**
 * Obtener todos los activos con paginacion
 */
export const getAssets = async (page = 1, limit = 10) => {
  const response = await api.get(`/api/assets?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Buscar activos por termino de busqueda
 */
export const searchAssets = async (query) => {
  const response = await api.get(`/api/assets/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

/**
 * Obtener activo por ID interno
 */
export const getAssetById = async (id) => {
  const response = await api.get(`/api/assets/${id}`);
  return response.data;
};

/**
 * Buscar activo por asset_id (escaneo QR)
 */
export const getAssetByAssetId = async (assetId) => {
  const response = await api.get(`/api/assets/qr/${assetId}`);
  return response.data;
};

/**
 * Crear nuevo activo
 */
export const createAsset = async (asset) => {
  const response = await api.post('/api/assets', asset);
  return response.data;
};

/**
 * Actualizar activo existente
 */
export const updateAsset = async (id, asset) => {
  const response = await api.put(`/api/assets/${id}`, asset);
  return response.data;
};

/**
 * Eliminar activo
 */
export const deleteAsset = async (id) => {
  const response = await api.delete(`/api/assets/${id}`);
  return response.data;
};

/**
 * Generar codigo QR para un activo
 * NOTA: Usa GET en lugar de POST para evitar problemas con base64 grande
 */
export const generateQRCode = async (id) => {
  console.log('🔵 generateQRCode: Obteniendo QR para', id);
  
  // Obtener el activo directamente con GET
  const assetResponse = await api.get(`/api/assets/${id}`);
  const asset = assetResponse.data.data;
  
  console.log('🔵 Activo obtenido:', asset);
  
  // Construir URL del QR desde el servidor
  const baseUrl = API_URL || window.location.origin;
  const qrUrl = asset.qr_code_path ? `${baseUrl}${asset.qr_code_path.replace('public', '')}` : null;
  
  console.log('🔵 URL del QR:', qrUrl);
  
  // Si existe el QR en el servidor, devolver la URL
  if (qrUrl) {
    return {
      success: true,
      message: 'QR obtenido del activo',
      serial_number: id,
      qr: {
        filePath: asset.qr_code_path,
        fileName: `${id}.png`,
        dataURL: qrUrl // Usar la URL del servidor directamente
      }
    };
  }
  
  // Si no existe el QR, intentar generarlo con POST (pero sin esperar el response completo)
  try {
    console.log('⚠️ No hay QR guardado, intentando generar uno nuevo...');
    await api.post(`/api/assets/${id}/generate-qr`, {}, { 
      timeout: 2000, // Timeout corto
      validateStatus: () => true // Aceptar cualquier status
    });
    
    // Después de generar, obtener el activo de nuevo
    const newAssetResponse = await api.get(`/api/assets/${id}`);
    const newAsset = newAssetResponse.data.data;
    const baseUrl = API_URL || window.location.origin;
    const newQrUrl = newAsset.qr_code_path ? `${baseUrl}${newAsset.qr_code_path.replace('public', '')}` : null;
    
    if (newQrUrl) {
      return {
        success: true,
        message: 'QR generado exitosamente',
        serial_number: id,
        qr: {
          filePath: newAsset.qr_code_path,
          fileName: `${id}.png`,
          dataURL: newQrUrl
        }
      };
    }
  } catch (postError) {
    console.log('⚠️ Error al generar QR con POST, pero continuando...');
  }
  
  throw new Error('No se pudo obtener el código QR');
};

// =====================================================
// SYSTEM API SERVICES
// =====================================================

/**
 * Health check del servidor
 */
export const checkHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

/**
 * Test de conexion a base de datos
 */
export const checkDatabase = async () => {
  const response = await api.get('/api/db-test');
  return response.data;
};

// =====================================================
// ESTADISTICAS Y REPORTES
// =====================================================

/**
 * Obtener estadisticas para dashboard
 */
export const getDashboardStats = async () => {
  const response = await api.get('/api/assets/stats/dashboard');
  return response.data;
};

/**
 * Exportar inventario a CSV
 */
export const exportToCSV = async () => {
  const response = await api.get('/api/assets/export/csv', {
    responseType: 'blob'
  });
  
  // Crear URL del blob y descargar
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Obtener nombre de archivo del header Content-Disposition
  const contentDisposition = response.headers['content-disposition'];
  const filename = contentDisposition
    ? contentDisposition.split('filename=')[1].replace(/"/g, '')
    : `inventario_${new Date().toISOString().slice(0, 10)}.csv`;
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { success: true, filename };
};

/**
 * Busqueda avanzada con filtros multiples
 */
export const advancedSearch = async (filters) => {
  const response = await api.post('/api/assets/search/advanced', filters);
  return response.data;
};

// =====================================================
// BACKUP DE BASE DE DATOS
// =====================================================

/**
 * Crear backup de base de datos
 */
export const createBackup = async () => {
  const response = await api.post('/api/db-backup');
  return response.data;
};

// =====================================================
// LOCATIONS API SERVICES
// =====================================================

/**
 * Obtener todas las ubicaciones
 */
export const getLocations = async () => {
  const response = await api.get('/api/locations');
  return response.data;
};

/**
 * Crear nueva ubicación
 */
export const createLocation = async (location) => {
  const response = await api.post('/api/locations', location);
  return response.data;
};

/**
 * Actualizar ubicación
 */
export const updateLocation = async (id, location) => {
  const response = await api.put(`/api/locations/${id}`, location);
  return response.data;
};

/**
 * Eliminar ubicación
 */
export const deleteLocation = async (id) => {
  const response = await api.delete(`/api/locations/${id}`);
  return response.data;
};

// =====================================================
// RESPONSIBLES API SERVICES
// =====================================================

/**
 * Obtener todos los responsables
 */
export const getResponsibles = async () => {
  const response = await api.get('/api/responsibles');
  return response.data;
};

/**
 * Crear nuevo responsable
 */
export const createResponsible = async (responsible) => {
  const response = await api.post('/api/responsibles', responsible);
  return response.data;
};

/**
 * Actualizar responsable
 */
export const updateResponsible = async (id, responsible) => {
  const response = await api.put(`/api/responsibles/${id}`, responsible);
  return response.data;
};

/**
 * Eliminar responsable
 */
export const deleteResponsible = async (id) => {
  const response = await api.delete(`/api/responsibles/${id}`);
  return response.data;
};

// =====================================================
// ASSET NAMES API SERVICES
// =====================================================

/**
 * Obtener todos los nombres de activos
 */
export const getAssetNames = async () => {
  const response = await api.get('/api/asset-names');
  return response.data;
};

/**
 * Obtener un nombre de activo por ID
 */
export const getAssetNameById = async (id) => {
  const response = await api.get(`/api/asset-names/${id}`);
  return response.data;
};

/**
 * Crear nuevo nombre de activo
 */
export const createAssetName = async (assetName) => {
  const response = await api.post('/api/asset-names', assetName);
  return response.data;
};

/**
 * Actualizar nombre de activo
 */
export const updateAssetName = async (id, assetName) => {
  const response = await api.put(`/api/asset-names/${id}`, assetName);
  return response.data;
};

/**
 * Eliminar nombre de activo
 */
export const deleteAssetName = async (id) => {
  const response = await api.delete(`/api/asset-names/${id}`);
  return response.data;
};

/**
 * Obtener siguiente número disponible para un nombre de activo
 */
export const getNextAssetNumber = async (id) => {
  const response = await api.get(`/api/asset-names/${id}/next-number`);
  return response.data;
};

// =====================================================
// BARTENDER LABELS API SERVICES
// =====================================================

/**
 * Generar etiqueta BarTender (.wdfx) para un activo
 */
export const generateBarTenderLabel = async (serialNumber) => {
  const response = await api.post(`/api/assets/${serialNumber}/generate-label`);
  return response.data;
};

/**
 * Obtener URL de descarga de etiqueta BarTender
 */
export const getBarTenderLabelDownloadUrl = (serialNumber) => {
  const baseUrl = API_URL || window.location.origin;
  return `${baseUrl}/api/assets/${serialNumber}/download-label`;
};

/**
 * Descargar etiqueta BarTender directamente
 */
export const downloadBarTenderLabel = async (serialNumber) => {
  const url = getBarTenderLabelDownloadUrl(serialNumber);
  window.open(url, '_blank');
};

// =====================================================
// BATCH LABELS API SERVICES
// =====================================================

/**
 * Obtener todos los activos sin paginación (para batch generator)
 */
export const getAllAssets = async () => {
  const response = await api.get('/api/assets?limit=5000');
  return response.data;
};

/**
 * Generar PDF con múltiples etiquetas
 * @param {Array<string>} serialNumbers - Array de números de serie
 * @returns {Promise} - Información del PDF generado
 */
export const generateBatchLabels = async (serialNumbers) => {
  const response = await api.post('/api/assets/batch/generate-labels', {
    serialNumbers
  });
  
  // Construir URL de descarga completa
  const baseUrl = API_URL || window.location.origin;
  const downloadUrl = `${baseUrl}${response.data.batch.downloadUrl}`;
  
  return {
    ...response.data,
    batch: {
      ...response.data.batch,
      downloadUrl
    }
  };
};

/**
 * Obtener URL de descarga de PDF batch
 */
export const getBatchLabelDownloadUrl = (filename) => {
  const baseUrl = API_URL || window.location.origin;
  return `${baseUrl}/api/assets/batch/download-labels/${filename}`;
};

/**
 * Descargar PDF batch directamente
 */
export const downloadBatchLabels = (filename) => {
  const url = getBatchLabelDownloadUrl(filename);
  window.open(url, '_blank');
};

// =====================================================
// BULK UPLOAD API SERVICES
// =====================================================

/**
 * Descargar plantilla Excel para carga masiva
 */
export const downloadExcelTemplate = () => {
  const baseUrl = API_URL || window.location.origin;
  const url = `${baseUrl}/api/assets/bulk/download-template`;
  
  // Crear enlace temporal y forzar descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla_activos.xlsx';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Subir archivo Excel para carga masiva de activos
 * @param {File} file - Archivo Excel
 * @returns {Promise} - Resultados de la carga masiva
 */
export const uploadBulkAssets = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/assets/bulk/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// =====================================================
// LOCATIONS BULK UPLOAD API SERVICES
// =====================================================

/**
 * Descargar plantilla Excel para carga masiva de ubicaciones
 */
export const downloadLocationsTemplate = () => {
  const baseUrl = API_URL || window.location.origin;
  const url = `${baseUrl}/api/locations/bulk/download-template`;
  
  // Crear enlace temporal y forzar descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla_ubicaciones.xlsx';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Subir archivo Excel para carga masiva de ubicaciones
 * @param {File} file - Archivo Excel
 * @returns {Promise} - Resultados de la carga masiva
 */
export const uploadBulkLocations = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/locations/bulk/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// =====================================================
// RESPONSIBLES BULK UPLOAD API SERVICES
// =====================================================

/**
 * Descargar plantilla Excel para carga masiva de responsables
 */
export const downloadResponsiblesTemplate = () => {
  const baseUrl = API_URL || window.location.origin;
  const url = `${baseUrl}/api/responsibles/bulk/download-template`;
  
  // Crear enlace temporal y forzar descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla_responsables.xlsx';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Subir archivo Excel para carga masiva de responsables
 * @param {File} file - Archivo Excel
 * @returns {Promise} - Resultados de la carga masiva
 */
export const uploadBulkResponsibles = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/responsibles/bulk/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

export default api;
