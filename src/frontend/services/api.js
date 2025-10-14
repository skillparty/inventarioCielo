import axios from 'axios';

// Usar URL relativa para que funcione tanto en localhost como desde otros dispositivos
// El backend y frontend están en el mismo puerto (7030)
const API_URL = process.env.REACT_APP_API_URL || '';

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
 */
export const generateQRCode = async (id) => {
  const response = await api.post(`/api/assets/${id}/generate-qr`);
  return response.data;
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

export default api;
