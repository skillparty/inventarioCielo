import React, { useState, useEffect } from 'react';
import { getAssets, deleteAsset, generateQRCode } from '../services/api';
import './ActivosList.css';

function ActivosList({ onEdit, onBack }) {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [expandedQR, setExpandedQR] = useState({}); // {activoId: qrData}

  useEffect(() => {
    loadActivos();
  }, []);

  const loadActivos = async () => {
    try {
      const response = await getAssets();
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
        await deleteAsset(id);
        alert('Activo eliminado exitosamente');
        loadActivos();
      } catch (error) {
        console.error('Error al eliminar activo:', error);
        alert('Error al eliminar activo');
      }
    }
  };

  const handleToggleQR = (id) => {
    console.log('handleToggleQR llamado con ID:', id);
    
    // Si ya está expandido, colapsarlo
    if (expandedQR[id]) {
      console.log('Colapsando QR para ID:', id);
      setExpandedQR(prev => {
        const newState = {...prev};
        delete newState[id];
        return newState;
      });
      return;
    }
    
    console.log('Generando QR para ID:', id);
    
    // Si no está expandido, generar y expandir
    generateQRCode(id)
      .then(response => {
        console.log('Respuesta recibida:', response);
        if (response && response.success && response.qr && response.qr.dataURL) {
          console.log('QR válido, expandiendo...');
          setExpandedQR(prev => ({
            ...prev,
            [id]: response
          }));
          console.log('Estado actualizado');
        } else {
          console.error('Respuesta inválida:', response);
          alert('Error: No se recibió el código QR del servidor');
        }
      })
      .catch(error => {
        console.error('Error al obtener QR:', error);
        alert('Error al generar código QR: ' + error.message);
      });
  };

  const handleDownloadQR = (assetId, dataURL) => {
    try {
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `QR_${assetId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el código QR');
    }
  };


  const filteredActivos = activos.filter(activo => {
    const matchesSearch = 
      (activo.asset_id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activo.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activo.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activo.responsible?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // El backend no tiene campo 'estado', así que mostramos todos
    const matchesEstado = filterEstado === 'todos';

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
          placeholder="🔍 Buscar por ID, descripción, ubicación o responsable..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filterEstado} 
          onChange={(e) => setFilterEstado(e.target.value)}
          className="filter-select"
        >
          <option value="todos">Todos los activos</option>
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
                <h3>{activo.asset_id}</h3>
                <span className="estado-badge activo">
                  Activo
                </span>
              </div>
              
              <div className="activo-body">
                <p><strong>Ubicación:</strong> {activo.location || 'N/A'}</p>
                <p><strong>Responsable:</strong> {activo.responsible || 'N/A'}</p>
                <p className="fecha"><strong>Creado:</strong> {formatDate(activo.created_at)}</p>
                <p className="fecha"><strong>Actualizado:</strong> {formatDate(activo.updated_at)}</p>
                {activo.description && (
                  <p className="descripcion"><strong>Descripción:</strong> {activo.description}</p>
                )}
              </div>

              {/* Sección QR expandible */}
              {expandedQR[activo.id] && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '20px',
                  borderRadius: '8px',
                  margin: '15px 0',
                  textAlign: 'center',
                  border: '2px solid #3b82f6'
                }}>
                  <h4 style={{ marginBottom: '15px', color: '#1e40af' }}>
                    Código QR - {expandedQR[activo.id].asset_id}
                  </h4>
                  <img 
                    src={expandedQR[activo.id].qr.dataURL} 
                    alt="QR Code"
                    style={{
                      width: '250px',
                      height: '250px',
                      border: '3px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      padding: '15px',
                      marginBottom: '15px'
                    }}
                  />
                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDownloadQR(expandedQR[activo.id].asset_id, expandedQR[activo.id].qr.dataURL);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginRight: '10px'
                      }}
                    >
                      📥 Descargar QR
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleQR(activo.id);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      Ocultar QR
                    </button>
                  </div>
                </div>
              )}

              <div className="activo-actions">
                <button 
                  type="button"
                  className="btn-qr" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleQR(activo.id);
                    return false;
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  title={expandedQR[activo.id] ? "Ocultar código QR" : "Ver código QR"}
                >
                  {expandedQR[activo.id] ? '❌' : '📱'}
                </button>
                <button 
                  className="btn-edit" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(activo);
                  }}
                  title="Editar"
                >
                  ✏️
                </button>
                <button 
                  className="btn-delete" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(activo.id, activo.asset_id);
                  }}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivosList;
