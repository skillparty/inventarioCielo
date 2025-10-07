import React, { useState, useEffect } from 'react';
import { getAssets, checkHealth } from '../services/api';
import './Dashboard.css';

function Dashboard({ onViewChange }) {
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    mantenimiento: 0,
    valorTotal: 0,
  });
  const [backendStatus, setBackendStatus] = useState('checking');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      await checkHealth();
      setBackendStatus('online');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await getAssets();
      const activos = response.data;

      const activosActivos = activos.filter(a => a.estado === 'Activo').length;
      const activosInactivos = activos.filter(a => a.estado === 'Inactivo').length;
      const activosMantenimiento = activos.filter(a => a.estado === 'Mantenimiento').length;
      const valorTotal = activos.reduce((sum, a) => sum + (parseFloat(a.valor) || 0), 0);

      setStats({
        total: activos.length,
        activos: activosActivos,
        inactivos: activosInactivos,
        mantenimiento: activosMantenimiento,
        valorTotal: valorTotal,
      });
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Dashboard de Inventario</h2>
        <div className={`status-badge ${backendStatus}`}>
          <span className="status-dot"></span>
          Backend: {backendStatus === 'online' ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total de Activos</p>
          </div>
        </div>

        <div className="stat-card activos">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.activos}</h3>
            <p>Activos</p>
          </div>
        </div>

        <div className="stat-card inactivos">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{stats.inactivos}</h3>
            <p>Inactivos</p>
          </div>
        </div>

        <div className="stat-card mantenimiento">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>{stats.mantenimiento}</h3>
            <p>En Mantenimiento</p>
          </div>
        </div>

        <div className="stat-card valor">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.valorTotal)}</h3>
            <p>Valor Total</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>⚡ Acciones Rápidas</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => onViewChange('list')}>
            <span className="action-icon">📋</span>
            <span>Ver Todos los Activos</span>
          </button>
          <button className="action-btn" onClick={() => onViewChange('new')}>
            <span className="action-icon">➕</span>
            <span>Registrar Nuevo Activo</span>
          </button>
          <button className="action-btn" onClick={() => onViewChange('scanner')}>
            <span className="action-icon">📷</span>
            <span>Escanear Código QR</span>
          </button>
          <button className="action-btn" onClick={loadDashboardData}>
            <span className="action-icon">🔄</span>
            <span>Actualizar Datos</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
