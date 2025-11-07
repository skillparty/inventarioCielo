import React, { useState, useEffect } from 'react';
import { showQROverlay } from './QROverlay';
import { QrCode, Edit, Trash2, List, Search, RefreshCw, Tag, Filter, ArrowUpDown, Printer, Upload, Download } from 'lucide-react';
import { getAssets, generateQRCode, deleteAsset, downloadBarTenderLabel, downloadExcelTemplate, uploadBulkAssets } from '../services/api';
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

  const handlePrint = async (e) => {
    e.stopPropagation();
    try {
      console.log('🖨️ Imprimiendo etiqueta PDF para:', activo.serial_number);
      
      // Construir URL del PDF
      const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:5001';
      const pdfUrl = `${API_URL}/api/assets/${activo.serial_number}/download-label`;
      
      // Abrir PDF en nueva ventana
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        // Esperar a que el PDF cargue y luego imprimir
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        alert('Por favor, permite las ventanas emergentes para imprimir.');
      }
      
      console.log('✅ Ventana de impresión abierta');
    } catch (error) {
      console.error('🔴 Error al imprimir:', error);
      alert('Error al imprimir: ' + (error.message || error.toString()));
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
          className="btn-print" 
          onClick={handlePrint}
          title="Imprimir Etiqueta"
          style={{
            backgroundColor: '#3b82f6',
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
          <Printer size={18} />
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
  const [locationFilter, setLocationFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, serial, name
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const loadActivos = async () => {
    setLoading(true);
    try {
      // Usar la función del api.js que tiene la configuración correcta
      const response = await getAssets(1, 5000);
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

  const handleDownloadTemplate = () => {
    console.log('📥 Descargando plantilla Excel...');
    downloadExcelTemplate();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar extensión
    const validExtensions = ['.xlsx', '.xls'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(extension)) {
      alert('Por favor, selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    // Confirmar acción
    const confirmed = window.confirm(
      `¿Deseas cargar el archivo "${file.name}"?\n\n` +
      'Este proceso creará múltiples activos automáticamente.\n' +
      'El número de serie se generará automáticamente para cada activo.'
    );

    if (!confirmed) {
      event.target.value = ''; // Limpiar input
      return;
    }

    setUploading(true);

    try {
      console.log('📤 Subiendo archivo Excel:', file.name);
      const result = await uploadBulkAssets(file);
      
      console.log('✅ Resultado:', result);
      
      // Mostrar resumen
      let message = `✅ Carga masiva completada\n\n`;
      message += `Total de filas: ${result.results.total}\n`;
      message += `Activos creados: ${result.results.created}\n`;
      
      if (result.results.errors.length > 0) {
        message += `Errores: ${result.results.errors.length}\n\n`;
        message += `Detalles de errores:\n`;
        result.results.errors.forEach(err => {
          message += `- Fila ${err.row}: ${err.error}\n`;
        });
      }

      alert(message);

      // Recargar lista de activos
      if (result.results.created > 0) {
        await loadActivos();
      }

    } catch (error) {
      console.error('🔴 Error al cargar archivo:', error);
      alert('Error al procesar el archivo Excel:\n' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      event.target.value = ''; // Limpiar input
    }
  };

  // Obtener listas únicas para los filtros
  const uniqueLocations = [...new Set(activos.map(a => a.location).filter(Boolean))].sort();
  const uniqueResponsibles = [...new Set(activos.map(a => a.responsible).filter(Boolean))].sort();

  // Aplicar filtros
  let filteredActivos = activos.filter(activo => {
    const matchesSearch = 
      (activo.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activo.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activo.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activo.responsible?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activo.category?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = locationFilter === 'all' || activo.location === locationFilter;
    const matchesResponsible = responsibleFilter === 'all' || activo.responsible === responsibleFilter;
    
    return matchesSearch && matchesLocation && matchesResponsible;
  });

  // Aplicar ordenamiento
  filteredActivos = [...filteredActivos].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'serial':
        return (a.serial_number || '').localeCompare(b.serial_number || '');
      case 'name':
        return (a.name || a.description || '').localeCompare(b.name || b.description || '');
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="activos-list loading"><div className="spinner"></div><p>Cargando activos...</p></div>;
  }

  return (
    <div className="activos-list">
      <div className="list-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <h2><List size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Listado de Activos</h2>
      </div>
      
      {/* Barra de búsqueda */}
      <div className="filters-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Search size={18} style={{ color: '#6b7280' }} />
          <input 
            type="text" 
            placeholder="Buscar por serial, descripción, ubicación..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="search-input"
            style={{ flex: 1 }}
          />
        </div>
        <button className="refresh-btn" onClick={loadActivos}>
          <RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Actualizar
        </button>
      </div>

      {/* Carga Masiva */}
      <div className="filters-bar" style={{ marginTop: '12px', backgroundColor: '#f0f9ff', border: '1px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>Carga Masiva:</span>
        </div>
        
        <button 
          onClick={handleDownloadTemplate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <Download size={16} />
          Descargar Plantilla
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <Upload size={16} />
          {uploading ? 'Procesando...' : 'Subir Excel'}
        </button>
      </div>

      {/* Filtros adicionales */}
      <div className="filters-bar" style={{ marginTop: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Filtros:</span>
        </div>
        
        <select 
          value={locationFilter} 
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: 'white'
          }}
        >
          <option value="all">📍 Todas las ubicaciones</option>
          {uniqueLocations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        <select 
          value={responsibleFilter} 
          onChange={(e) => setResponsibleFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: 'white'
          }}
        >
          <option value="all">👤 Todos los responsables</option>
          {uniqueResponsibles.map(resp => (
            <option key={resp} value={resp}>{resp}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <ArrowUpDown size={16} style={{ color: '#6b7280' }} />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: 'white',
              fontWeight: '500'
            }}
          >
            <option value="newest">🕐 Más recientes</option>
            <option value="oldest">🕑 Más antiguos</option>
            <option value="serial">🔤 Por serial (A-Z)</option>
            <option value="name">📝 Por nombre (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="results-count" style={{ marginTop: '16px' }}>
        Mostrando <strong>{filteredActivos.length}</strong> de <strong>{activos.length}</strong> activos
        {(locationFilter !== 'all' || responsibleFilter !== 'all' || searchTerm) && (
          <button 
            onClick={() => { setSearchTerm(''); setLocationFilter('all'); setResponsibleFilter('all'); }}
            style={{
              marginLeft: '12px',
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#6b7280'
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filteredActivos.length === 0 ? (
        <div className="no-results">
          <p>No se encontraron activos con los filtros aplicados</p>
          <button 
            onClick={() => { setSearchTerm(''); setLocationFilter('all'); setResponsibleFilter('all'); }}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#374151'
            }}
          >
            Limpiar filtros
          </button>
        </div>
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
