import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { QrCode, Download, X } from 'lucide-react';

function QRModal({ qrData, onClose }) {
  useEffect(() => {
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    
    // Prevenir que cualquier click cierre el modal accidentalmente
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = qrData.qr.dataURL;
      link.download = `QR_${qrData.asset_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el código QR');
    }
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e) => {
    // NO cerrar el modal al hacer click en el fondo - solo con el botón
    e.preventDefault();
    e.stopPropagation();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const modalContent = (
    <div 
      onMouseDown={handleBackdropClick}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px'
      }}
    >
      <div 
        onMouseDown={handleContentClick}
        onClick={handleContentClick}
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '15px'
        }}>
          <button
            onMouseDown={handleClose}
            onClick={handleClose}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '5px',
              lineHeight: 1
            }}
          >
            <X size={24} />
          </button>
        </div>

        <h2 style={{ 
          marginBottom: '25px', 
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><QrCode size={24} />Código QR del Activo</div>
        </h2>
        
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '25px', 
          borderRadius: '12px',
          marginBottom: '25px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
        }}>
          <img 
            src={qrData.qr.dataURL} 
            alt="QR Code" 
            style={{ 
              maxWidth: '320px', 
              width: '100%',
              border: '3px solid #e5e7eb',
              borderRadius: '12px',
              backgroundColor: 'white',
              padding: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }} 
          />
        </div>
        
        <div style={{
          backgroundColor: '#eff6ff',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '25px'
        }}>
          <p style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            margin: 0,
            color: '#1e40af',
            letterSpacing: '0.5px'
          }}>
            {qrData.asset_id}
          </p>
        </div>
        
        <p style={{ 
          fontSize: '15px', 
          color: '#6b7280', 
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          Descarga este código QR para imprimirlo y pegarlo en el activo físico.
          <br/>
          Puedes escanearlo con tu celular para ver la información del activo.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            type="button"
            onMouseDown={handleDownload}
            onClick={handleDownload}
            style={{
              padding: '12px 28px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            <Download size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Descargar QR
          </button>
          <button 
            type="button"
            onMouseDown={handleClose}
            onClick={handleClose}
            style={{
              padding: '12px 28px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(107,114,128,0.3)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default QRModal;
