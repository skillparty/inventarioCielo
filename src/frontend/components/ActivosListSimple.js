import React, { useState, useEffect } from 'react';
import { showQROverlay } from './QROverlay';
import { QrCode, Edit, Trash2, List, Search, RefreshCw } from 'lucide-react';
import './ActivosList.css';

// Componente de tarjeta de activo aislado para manejar sus propios eventos
function ActivoCard({ activo, onEdit }) {

  const handleShowQR = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔵 handleShowQR llamado para:', activo.serial_number);
    
    try {
      console.log('🔵 Generando QR para:', activo.serial_number);
      // Usar fetch directamente con serial_number
      const response = await fetch(`/api/assets/${activo.serial_number}/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔵 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 Error del servidor:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔵 Respuesta del servidor:', data);
      
      if (data && data.success && data.qr && data.qr.dataURL) {
        console.log('🟢 Mostrando QR overlay');
        // Pequeño delay para asegurar que el evento de click termine
        setTimeout(() => {
          showQROverlay({
            ...data,
            asset_id: activo.serial_number
          });
        }, 100);
      } else {
        console.error('🔴 Error: respuesta inválida del servidor', data);
        alert('Error al generar QR');
      }
    } catch (error) {
      console.error('🔴 Error al obtener QR:', error);
      console.error('🔴 Error nombre:', error.name);
      console.error('🔴 Error mensaje:', error.message);
      console.error('🔴 Error stack:', error.stack);
      alert('Error al generar QR: ' + (error.message || error.toString()));
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
          <QrCode size={18} />
        </button>
        <button 
          className="btn-edit" 
          onClick={(e) => { e.stopPropagation(); onEdit(activo); }} 
          title="Editar"
        >
          <Edit size={18} />
        </button>
        <button 
          className="btn-delete" 
          onClick={(e) => handleDelete(e, activo.serial_number)} 
          title="Eliminar"
        >
          <Trash2 size={18} />
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
        <h2><List size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Listado de Activos</h2>
      </div>
      <div className="filters-bar">
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
        <button className="refresh-btn" onClick={loadActivos}><RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Actualizar</button>
      </div>
      <div className="results-count">Mostrando {filteredActivos.length} de {activos.length} activos</div>
      {filteredActivos.length === 0 ? (
        <div className="no-results"><p>No se encontraron activos</p></div>
      ) : (
        <div className="activos-grid">
          {filteredActivos.map((activo) => (
            <ActivoCard key={activo.serial_number || activo.id} activo={activo} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivosListSimple;
