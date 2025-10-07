import React, { useState, useEffect } from 'react';
import { getActivos, deleteActivo, getActivoQR } from '../services/api';
import './ActivosList.css';

function ActivosList({ onEdit, onBack }) {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    loadActivos();
  }, []);

  const loadActivos = async () => {
    try {
      const response = await getActivos();
      setActivos(response.data);
    } catch (error) {
      console.error('Error al cargar activos:', error);
      alert('Error al cargar activos. Verifica que el backend esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el activo "${nombre}"?`)) {
      try {
        await deleteActivo(id);
        alert('Activo eliminado exitosamente');
        loadActivos();
      } catch (error) {
        console.error('Error al eliminar activo:', error);
        alert('Error al eliminar activo');
      }
    }
  };

  const handleShowQR = async (id) => {
    try {
      const response = await getActivoQR(id);
      setSelectedQR(response);
    } catch (error) {
      console.error('Error al obtener QR:', error);
      alert('Error al generar código QR');
    }
  };

  const filteredActivos = activos.filter(activo => {
    const matchesSearch = activo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activo.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activo.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activo.responsable?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'todos' || activo.estado === filterEstado;

    return matchesSearch && matchesEstado;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="activos-list loading">
        <div className="spinner"></div>
        <p>Cargando activos...</p>
      </div>
    );
  }

  return (
    <div className="activos-list">
      <div className="list-header">
        <button className="back-btn" onClick={onBack}>
          ← Volver
        </button>
        <h2>📋 Listado de Activos</h2>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, categoría, ubicación o responsable..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filterEstado} 
          onChange={(e) => setFilterEstado(e.target.value)}
          className="filter-select"
        >
          <option value="todos">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
          <option value="Mantenimiento">Mantenimiento</option>
        </select>

        <button className="refresh-btn" onClick={loadActivos}>
          🔄 Actualizar
        </button>
      </div>

      <div className="results-count">
        Mostrando {filteredActivos.length} de {activos.length} activos
      </div>

      {filteredActivos.length === 0 ? (
        <div className="no-results">
          <p>No se encontraron activos</p>
        </div>
      ) : (
        <div className="activos-grid">
          {filteredActivos.map((activo) => (
            <div key={activo.id} className="activo-card">
              <div className="activo-header">
                <h3>{activo.nombre}</h3>
                <span className={`estado-badge ${activo.estado?.toLowerCase()}`}>
                  {activo.estado}
                </span>
              </div>
              
              <div className="activo-body">
                <p><strong>Categoría:</strong> {activo.categoria || 'N/A'}</p>
                <p><strong>Ubicación:</strong> {activo.ubicacion || 'N/A'}</p>
                <p><strong>Responsable:</strong> {activo.responsable || 'N/A'}</p>
                <p><strong>Valor:</strong> {formatCurrency(activo.valor)}</p>
                <p><strong>Serie:</strong> {activo.numero_serie || 'N/A'}</p>
                <p className="fecha"><strong>Registro:</strong> {formatDate(activo.fecha_registro)}</p>
                {activo.descripcion && (
                  <p className="descripcion"><strong>Descripción:</strong> {activo.descripcion}</p>
                )}
              </div>

              <div className="activo-actions">
                <button 
                  className="btn-qr" 
                  onClick={() => handleShowQR(activo.id)}
                  title="Ver código QR"
                >
                  📱
                </button>
                <button 
                  className="btn-edit" 
                  onClick={() => onEdit(activo)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDelete(activo.id, activo.nombre)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQR && (
        <div className="modal-overlay" onClick={() => setSelectedQR(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Código QR</h3>
            <img src={selectedQR.qrImage} alt="QR Code" />
            <p className="qr-code">{selectedQR.codigo_qr}</p>
            <button className="btn-close" onClick={() => setSelectedQR(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivosList;
