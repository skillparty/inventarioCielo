import React, { useState, useEffect } from 'react';
import { getAssets, checkHealth } from '../services/api';
import { BarChart3, Package, CheckCircle, AlertTriangle, Wrench, DollarSign, Zap, List, Plus, Camera, RefreshCw, Search, FileDown, MapPin, User, Tag } from 'lucide-react';
import { exportAssetsToPDF } from '../utils/pdfExporter';
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
  const [debugInfo, setDebugInfo] = useState([]);
  const [allAssets, setAllAssets] = useState([]);

  useEffect(() => {
    loadDashboardData();
    checkBackendStatus();
  }, []);

  const addDebug = (msg) => {
    setDebugInfo(prev => [...prev, msg]);
  };

  const checkBackendStatus = async () => {
    try {
      addDebug('1. Conectando al backend...');
      
      // Usar la función checkHealth del api.js que ya tiene la configuración correcta
      const data = await checkHealth();
      
      if (data.success) {
        setBackendStatus('online');
        addDebug('2. [OK] Health check OK');
      } else {
        setBackendStatus('offline');
        addDebug('2. [ERROR] Health check inválido: ' + JSON.stringify(data));
      }
    } catch (error) {
      setBackendStatus('offline');
      addDebug('2. [ERROR] Error health check: ' + error.message);
    }
  };

  const loadDashboardData = async () => {
    try {
      addDebug('3. Cargando activos desde el backend...');
      
      // Usar la función getAssets del api.js que ya tiene la configuración correcta
      const response = await getAssets(1, 100);
      
      addDebug('4. Respuesta: ' + JSON.stringify(response).substring(0, 80) + '...');
      
      const activos = response.data;

      const activosActivos = activos.filter(a => a.status === 'Activo').length;
      const activosInactivos = activos.filter(a => a.status === 'Inactivo').length;
      const activosMantenimiento = activos.filter(a => a.status === 'Mantenimiento').length;
      const valorTotal = activos.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);

      setStats({
        total: activos.length,
        activos: activosActivos,
        inactivos: activosInactivos,
        mantenimiento: activosMantenimiento,
        valorTotal: valorTotal,
      });
      setAllAssets(activos); // Guardar todos los activos para exportación
      addDebug(`5. [OK] ${activos.length} activos cargados correctamente`);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      addDebug('5. [ERROR] Error al cargar activos: ' + error.message);
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

  const handleExportPDF = () => {
    if (allAssets.length === 0) {
      alert('No hay activos para exportar');
      return;
    }
    
    try {
      const filename = exportAssetsToPDF(allAssets, stats);
      console.log('PDF generado:', filename);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    }
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
        <h2><BarChart3 size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Dashboard de Inventario</h2>
        <div className={`status-badge ${backendStatus}`}>
          <span className="status-dot"></span>
          Backend: {backendStatus === 'online' ? 'Conectado' : 'Desconectado'}
        </div>
      </div>
      
      {debugInfo.length > 0 && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '11px',
          wordBreak: 'break-all'
        }}>
          <strong><Search size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Debug Log:</strong>
          {debugInfo.map((msg, i) => (
            <div key={i} style={{ marginTop: '4px' }}>{msg}</div>
          ))}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon"><Package size={32} /></div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total de Activos</p>
          </div>
        </div>

        <div className="stat-card activos">
          <div className="stat-icon"><CheckCircle size={32} /></div>
          <div className="stat-content">
            <h3>{stats.activos}</h3>
            <p>Activos</p>
          </div>
        </div>

        <div className="stat-card inactivos">
          <div className="stat-icon"><AlertTriangle size={32} /></div>
          <div className="stat-content">
            <h3>{stats.inactivos}</h3>
            <p>Inactivos</p>
          </div>
        </div>

        <div className="stat-card mantenimiento">
          <div className="stat-icon"><Wrench size={32} /></div>
          <div className="stat-content">
            <h3>{stats.mantenimiento}</h3>
            <p>En Mantenimiento</p>
          </div>
        </div>

        <div className="stat-card valor">
          <div className="stat-icon"><DollarSign size={32} /></div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.valorTotal)}</h3>
            <p>Valor Total</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3><Zap size={20} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Acciones Rápidas</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => onViewChange('list')}>
            <span className="action-icon"><List size={20} /></span>
            <span>Ver Todos los Activos</span>
          </button>
          <button className="action-btn" onClick={() => onViewChange('new')}>
            <span className="action-icon"><Plus size={20} /></span>
            <span>Registrar Nuevo Activo</span>
          </button>
          <button className="action-btn" onClick={() => onViewChange('batch')} style={{ backgroundColor: '#9b59b6', color: 'white' }}>
            <span className="action-icon"><Package size={20} /></span>
            <span>Crear Múltiples Activos</span>
          </button>
          <button className="action-btn" onClick={() => onViewChange('scanner')}>
            <span className="action-icon"><Camera size={20} /></span>
            <span>Escanear Código QR</span>
          </button>
          <button className="action-btn export-btn" onClick={handleExportPDF}>
            <span className="action-icon"><FileDown size={20} /></span>
            <span>Exportar PDF</span>
          </button>
          <button className="action-btn" onClick={loadDashboardData}>
            <span className="action-icon"><RefreshCw size={20} /></span>
            <span>Actualizar Datos</span>
          </button>
          <button className="action-btn" onClick={() => onViewChange('locations')}>
            <span className="action-icon"><MapPin size={20} /></span>
            <span>Gestionar Ubicaciones</span>
          </button>
          <button className="action-btn" onClick={() => onViewChange('responsibles')}>
            <span className="action-icon"><User size={20} /></span>
            <span>Gestionar Responsables</span>
          </button>
          <button className="action-btn" onClick={() => onViewChange('assetNames')}>
            <span className="action-icon"><Tag size={20} /></span>
            <span>Gestionar Nombres de Activos</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
