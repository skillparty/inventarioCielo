import React, { useState, useEffect } from 'react';
import { showQROverlay } from './QROverlay';
import { QrCode, Edit, Trash2, List, Search, RefreshCw, Tag } from 'lucide-react';
import { getAssets, generateQRCode, deleteAsset, downloadBarTenderLabel } from '../services/api';
import './ActivosList.css';

// Componente de tarjeta de activo aislado para manejar sus propios eventos
function ActivoCard({ activo, onEdit }) {
  const qrButtonRef = React.useRef(null);

  const handleShowQR = React.useCallback(async () => {
    console.log('🔵 handleShowQR llamado para:', activo.serial_number);
    
    // Prevenir cualquier navegación durante los próximos 3 segundos
    const preventNavigation = (e) => {
      console.log('⚠️ Navegación bloqueada temporalmente');
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    window.addEventListener('beforeunload', preventNavigation);
    window.addEventListener('popstate', preventNavigation);
    
    const clearNavigationBlock = () => {
      window.removeEventListener('beforeunload', preventNavigation);
      window.removeEventListener('popstate', preventNavigation);
    };
    
    setTimeout(clearNavigationBlock, 3000); // Limpiar después de 3 segundos
    
    try {
      console.log('🔵 Generando QR para:', activo.serial_number);
      // Usar la función del api.js que tiene la configuración correcta
      const data = await generateQRCode(activo.serial_number);
      
      console.log('🔵 Respuesta del servidor:', data);
      
      if (data && data.success && data.qr && data.qr.dataURL) {
        console.log('🟢 QR recibido, mostrando overlay inmediatamente...');
        try {
          showQROverlay({
            ...data,
            asset_id: activo.serial_number
          });
          console.log('✅ showQROverlay ejecutado exitosamente');
        } catch (overlayError) {
          console.error('🔴 Error al mostrar overlay:', overlayError);
        }
      } else {
        console.error('🔴 Error: respuesta inválida del servidor', data);
        alert('Error al generar QR');
      }
    } catch (error) {
      console.error('🔴 Error al obtener QR:', error);
      console.error('🔴 Error nombre:', error.name);
      console.error('🔴 Error mensaje:', error.message);
      console.error('🔴 Error stack:', error.stack);
      
      // Si es error de CORS/Network, intentar usar el fallback
      if (error.name === 'AxiosError' || error.message.includes('Network')) {
        console.log('⚠️ Error de red detectado, esto es esperado debido al tamaño del base64');
        alert('El código QR existe pero hay un problema al cargarlo. Por favor, intenta de nuevo.');
      } else {
        alert('Error al generar QR: ' + (error.message || error.toString()));
      }
    } finally {
      clearNavigationBlock();
    }
  }, [activo.serial_number]);

  // Usar evento nativo del DOM en lugar de React event
  React.useEffect(() => {
    const button = qrButtonRef.current;
    if (!button) {
      console.log('⚠️ No se encontró referencia al botón QR');
      return;
    }

    console.log('✅ Botón QR encontrado, agregando listeners');

    const stopAllPropagation = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    const handleClick = (e) => {
      console.log('🔵 Click nativo capturado en botón QR');
      console.log('🔵 Tipo de evento:', e.type);
      console.log('🔵 Target:', e.target);
      console.log('🔵 CurrentTarget:', e.currentTarget);
      
      stopAllPropagation(e);
      
      console.log('🟡 Llamando a handleShowQR en 100ms...');
      
      // Llamar a la función después de un pequeño delay para asegurar que el evento termine
      setTimeout(() => {
        console.log('🟡 Ejecutando handleShowQR AHORA');
        try {
          handleShowQR();
        } catch (err) {
          console.error('🔴 Error en handleShowQR:', err);
        }
      }, 100);
      
      return false;
    };

    // Agregar listener nativo con capture: true para interceptar ANTES que React
    button.addEventListener('click', handleClick, { capture: true, passive: false });
    button.addEventListener('mousedown', stopAllPropagation, { capture: true, passive: false });
    button.addEventListener('mouseup', stopAllPropagation, { capture: true, passive: false });
    button.addEventListener('touchstart', stopAllPropagation, { capture: true, passive: false });
    button.addEventListener('touchend', stopAllPropagation, { capture: true, passive: false });
    
    // Prevenir que el botón actúe como link
    button.style.cursor = 'pointer';
    button.setAttribute('type', 'button');

    return () => {
      button.removeEventListener('click', handleClick, { capture: true });
      button.removeEventListener('mousedown', stopAllPropagation, { capture: true });
      button.removeEventListener('mouseup', stopAllPropagation, { capture: true });
      button.removeEventListener('touchstart', stopAllPropagation, { capture: true });
      button.removeEventListener('touchend', stopAllPropagation, { capture: true });
    };
  }, [handleShowQR]);

  const handleGenerateLabel = async (e) => {
    e.stopPropagation();
    try {
      console.log('🏷️ Generando etiqueta BarTender para:', activo.serial_number);
      await downloadBarTenderLabel(activo.serial_number);
      console.log('✅ Etiqueta descargada');
    } catch (error) {
      console.error('🔴 Error al generar etiqueta:', error);
      alert('Error al generar etiqueta: ' + (error.message || error.toString()));
    }
  };

  const handleDelete = async (e, serialNumber) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar activo ${serialNumber}?`)) {
      try {
        // Usar la función del api.js que tiene la configuración correcta
        const data = await deleteAsset(serialNumber);
        
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
        <div>
          <h3>{activo.name || activo.serial_number}</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0 0' }}>
            <strong>S/N:</strong> {activo.serial_number}
          </p>
        </div>
        <span className="estado-badge activo">{activo.status || 'Activo'}</span>
      </div>
      
      <div className="activo-body">
        <p><strong>Ubicación:</strong> {activo.location || 'N/A'}</p>
        <p><strong>Responsable:</strong> {activo.responsible || 'N/A'}</p>
        <p className="fecha"><strong>Creado:</strong> {formatDate(activo.created_at)}</p>
        {activo.description && <p className="descripcion"><strong>Descripción:</strong> {activo.description}</p>}
      </div>

      <div className="activo-actions">
        <button 
          ref={qrButtonRef}
          type="button" 
          className="btn-qr" 
          title="Ver código QR"
        >
          <QrCode size={18} />
        </button>
        <button 
          type="button"
          className="btn-label" 
          onClick={handleGenerateLabel}
          title="Descargar Etiqueta BarTender"
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px'
          }}
        >
          <Tag size={18} />
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
      // Usar la función del api.js que tiene la configuración correcta
      const response = await getAssets(1, 100);
      setActivos(response.data);
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
    (activo.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activo.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activo.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activo.responsible?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activo.category?.toLowerCase().includes(searchTerm.toLowerCase()))
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
