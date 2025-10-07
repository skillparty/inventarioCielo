import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Activos
export const getActivos = async () => {
  const response = await api.get('/api/activos');
  return response.data;
};

export const getActivoById = async (id) => {
  const response = await api.get(`/api/activos/${id}`);
  return response.data;
};

export const getActivoByQR = async (codigoQR) => {
  const response = await api.get(`/api/activos/qr/${codigoQR}`);
  return response.data;
};

export const createActivo = async (activo) => {
  const response = await api.post('/api/activos', activo);
  return response.data;
};

export const updateActivo = async (id, activo) => {
  const response = await api.put(`/api/activos/${id}`, activo);
  return response.data;
};

export const deleteActivo = async (id) => {
  const response = await api.delete(`/api/activos/${id}`);
  return response.data;
};

export const getActivoQR = async (id) => {
  const response = await api.get(`/api/activos/${id}/qr`);
  return response.data;
};

// Health check
export const checkHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export const checkDatabase = async () => {
  const response = await api.get('/api/db-test');
  return response.data;
};

export default api;
