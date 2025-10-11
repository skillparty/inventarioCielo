import React from 'react';
import ReactDOM from 'react-dom/client';

// Función para mostrar el QR en un overlay global
export function showQROverlay(qrData) {
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
  
  // Prevenir scroll del body
  document.body.style.overflow = 'hidden';
  
  // Crear el componente de overlay
  const QROverlayContent = () => {
    const handleDownload = () => {
      const link = document.createElement('a');
      link.href = qrData.qr.dataURL;
      link.download = `QR_${qrData.asset_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    const handleClose = () => {
      hideQROverlay();
    };
    
    return (
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
          ✕
        </button>
        
        <h2 style={{ marginBottom: '25px', color: '#1f2937', fontSize: '24px', fontWeight: 'bold' }}>
          📱 Código QR del Activo
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
            📥 Descargar QR
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
    );
  };
  
  // Renderizar el componente usando createRoot
  const root = ReactDOM.createRoot(overlayDiv);
  root.render(<QROverlayContent />);
  
  // Guardar el root para poder limpiarlo después
  overlayDiv._root = root;
}

export function hideQROverlay() {
  const overlayDiv = document.getElementById('qr-overlay-root');
  if (overlayDiv) {
    if (overlayDiv._root) {
      overlayDiv._root.unmount();
    }
    overlayDiv.remove();
    document.body.style.overflow = 'unset';
  }
}
