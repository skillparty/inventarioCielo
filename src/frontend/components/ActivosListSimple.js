import React, { useState, useEffect } from 'react';
import { showQROverlay } from './QROverlay';
import './ActivosList.css';

// Componente de tarjeta de activo aislado para manejar sus propios eventos
function ActivoCard({ activo, onEdit }) {

  const handleShowQR = async () => {
    try {
      // Usar fetch directamente con serial_number
      const response = await fetch(`/api/assets/${activo.serial_number}/generate-qr`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data && data.success && data.qr && data.qr.dataURL) {
        // Mostrar el serial_number en el overlay
        showQROverlay({
          ...data,
          asset_id: activo.serial_number
        });
      } else {
        alert('Error al generar QR');
      }
    } catch (error) {
      console.error('Error al obtener QR:', error);
      alert('Error al generar QR');
    }
  };

  const handleDelete = async (e, serialNumber) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar activo ${serialNumber}?`)) {
      try {
        // Usar fetch directamente con serial_number
        const response = await fetch(`/api/assets/${serialNumber}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
          alert('Activo eliminado');
          window.location.reload(); // Recargar la página para actualizar la lista
        } else {
          alert('Error al eliminar activo');
        }
      } catch (error) {
        alert('Error al eliminar activo');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="activo-card">
      <div className="activo-header">
        <h3>{activo.serial_number}</h3>
        <span className="estado-badge activo">Activo</span>
      </div>
      
      <div className="activo-body">
        <p><strong>Ubicación:</strong> {activo.location || 'N/A'}</p>
        <p><strong>Responsable:</strong> {activo.responsible || 'N/A'}</p>
        <p className="fecha"><strong>Creado:</strong> {formatDate(activo.created_at)}</p>
        {activo.description && <p className="descripcion"><strong>Descripción:</strong> {activo.description}</p>}
      </div>

      <div className="activo-actions">
        <button 
          type="button" 
          className="btn-qr" 
          onClick={handleShowQR}
          title="Ver código QR"
        >
          📱
        </button>
        <button 
          className="btn-edit" 
          onClick={(e) => { e.stopPropagation(); onEdit(activo); }} 
          title="Editar"
        >
          ✏️
        </button>
        <button 
          className="btn-delete" 
          onClick={(e) => handleDelete(e, activo.serial_number)} 
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function ActivosListSimple({ onEdit, onBack }) {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadActivos = async () => {
    setLoading(true);
    try {
      // Usar fetch directamente en lugar de axios
      const response = await fetch('/api/assets?page=1&limit=100');
      const data = await response.json();
      setActivos(data.data);
    } catch (error) {
      console.error('Error al cargar activos:', error);
      alert('Error al cargar activos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivos();
  }, []);

  const filteredActivos = activos.filter(activo =>
    (activo.asset_id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activo.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activo.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activo.responsible?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="activos-list loading"><div className="spinner"></div><p>Cargando activos...</p></div>;
  }

  return (
    <div className="activos-list">
      <div className="list-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <h2>📋 Listado de Activos</h2>
      </div>
      <div className="filters-bar">
        <input type="text" placeholder="🔍 Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
        <button className="refresh-btn" onClick={loadActivos}>🔄 Actualizar</button>
      </div>
      <div className="results-count">Mostrando {filteredActivos.length} de {activos.length} activos</div>
      {filteredActivos.length === 0 ? (
        <div className="no-results"><p>No se encontraron activos</p></div>
      ) : (
        <div className="activos-grid">
          {filteredActivos.map((activo) => (
            <ActivoCard key={activo.id} activo={activo} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivosListSimple;
