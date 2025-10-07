import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

export default api;
