import React from 'react';
import ReactDOM from 'react-dom/client';
import { QrCode, Download, X } from 'lucide-react';

// Función para mostrar el QR en un overlay global
export function showQROverlay(qrData) {
  console.log('🟢 showQROverlay llamado con:', qrData);
  
  // Verificar si ya existe un overlay y eliminarlo
  const existingOverlay = document.getElementById('qr-overlay-root');
  if (existingOverlay) {
    console.log('⚠️ Overlay existente encontrado, eliminándolo');
    hideQROverlay();
  }
  
  // Crear el contenedor del overlay
  const overlayDiv = document.createElement('div');
  overlayDiv.id = 'qr-overlay-root';
  overlayDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;
  
  document.body.appendChild(overlayDiv);
  console.log('✅ Overlay agregado al DOM');
  
  // Prevenir scroll del body
  document.body.style.overflow = 'hidden';
  
  // Crear el componente de overlay
  const QROverlayContent = () => {
    const [isReady, setIsReady] = React.useState(false);
    
    React.useEffect(() => {
      // Evitar que clicks inmediatos cierren el modal
      const timer = setTimeout(() => setIsReady(true), 300);
      return () => clearTimeout(timer);
    }, []);
    
    const handleDownload = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const link = document.createElement('a');
      link.href = qrData.qr.dataURL;
      link.download = `QR_${qrData.asset_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    const handleClose = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      console.log('🔴 handleClose llamado');
      hideQROverlay();
    };

    const handleBackdropClick = (e) => {
      // NO cerrar al hacer click en el fondo - solo con el botón X
      e.stopPropagation();
    };
    
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={handleBackdropClick}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#999',
            padding: '5px',
            lineHeight: 1
          }}
        >
          <X size={28} />
        </button>
        
        <h2 style={{ marginBottom: '25px', color: '#1f2937', fontSize: '24px', fontWeight: 'bold' }}>
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
              maxWidth: '300px',
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
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
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
              boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
            }}
          >
            <Download size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Descargar QR
          </button>
          <button
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
              boxShadow: '0 2px 4px rgba(107,114,128,0.3)'
            }}
          >
            Cerrar
          </button>
        </div>
        </div>
      </div>
    );
  };
  
  // Renderizar el componente usando createRoot
  const root = ReactDOM.createRoot(overlayDiv);
  root.render(<QROverlayContent />);
  
  // Guardar el root para poder limpiarlo después
  overlayDiv._root = root;
}

export function hideQROverlay() {
  console.log('🔴 hideQROverlay llamado');
  const overlayDiv = document.getElementById('qr-overlay-root');
  if (overlayDiv) {
    console.log('🔴 Eliminando overlay del DOM');
    if (overlayDiv._root) {
      overlayDiv._root.unmount();
    }
    overlayDiv.remove();
    document.body.style.overflow = 'unset';
  } else {
    console.log('⚠️ No se encontró overlay para eliminar');
  }
}
