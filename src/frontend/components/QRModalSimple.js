// Modal QR Simple - Manejo directo del DOM
export function showQRModal(qrData) {
  // Remover modal existente si hay uno
  hideQRModal();
  
  // Crear elementos del modal
  const overlay = document.createElement('div');
  overlay.id = 'qr-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    padding: 20px;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background-color: white;
    padding: 40px;
    border-radius: 16px;
    max-width: 550px;
    width: 100%;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    position: relative;
  `;
  
  modal.innerHTML = `
    <button id="close-x" style="
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #999;
      padding: 5px;
      line-height: 1;
    ">×</button>
    
    <h2 style="
      margin-bottom: 25px;
      color: #1f2937;
      font-size: 24px;
      font-weight: bold;
    ">Código QR del Activo</h2>
    
    <div style="
      background-color: #f9fafb;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 25px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
    ">
      <img 
        id="qr-image"
        alt="QR Code"
        style="
          max-width: 320px;
          width: 100%;
          border: 3px solid #e5e7eb;
          border-radius: 12px;
          background-color: white;
          padding: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        "
      />
    </div>
    
    <div style="
      background-color: #eff6ff;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    ">
      <p id="asset-id" style="
        font-size: 20px;
        font-weight: bold;
        margin: 0;
        color: #1e40af;
        letter-spacing: 0.5px;
      "></p>
    </div>
    
    <p style="
      font-size: 15px;
      color: #6b7280;
      margin-bottom: 30px;
      line-height: 1.6;
    ">
      Descarga este código QR para imprimirlo y pegarlo en el activo físico.<br/>
      Puedes escanearlo con tu celular para ver la información del activo.
    </p>
    
    <div style="
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    ">
      <button id="download-btn" style="
        padding: 12px 28px;
        background-color: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(37,99,235,0.3);
      ">Descargar QR</button>
      
      <button id="close-btn" style="
        padding: 12px 28px;
        background-color: #6b7280;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(107,114,128,0.3);
      ">Cerrar</button>
    </div>
  `;
  
  // Establecer datos
  const qrImage = modal.querySelector('#qr-image');
  const assetIdEl = modal.querySelector('#asset-id');
  qrImage.src = qrData.qr.dataURL;
  assetIdEl.textContent = qrData.asset_id;
  
  // Event handlers con protección extra
  let isClosing = false;
  const closeModal = (e) => {
    if (isClosing) return;
    isClosing = true;
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    hideQRModal();
  };
  
  const downloadQR = (e) => {
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
  
  // Agregar event listeners
  modal.querySelector('#close-x').addEventListener('click', closeModal);
  modal.querySelector('#close-btn').addEventListener('click', closeModal);
  modal.querySelector('#download-btn').addEventListener('click', downloadQR);
  
  // Prevenir cierre al hacer click en el modal
  modal.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Prevenir TODOS los eventos en el overlay que puedan cerrar el modal
  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  overlay.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  overlay.addEventListener('mouseup', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Agregar al DOM
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Prevenir scroll
  document.body.style.overflow = 'hidden';
  
  // ESC para cerrar
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', handleEsc);
  overlay._escHandler = handleEsc;
}

export function hideQRModal() {
  const overlay = document.getElementById('qr-modal-overlay');
  if (overlay) {
    if (overlay._escHandler) {
      document.removeEventListener('keydown', overlay._escHandler);
    }
    overlay.remove();
    document.body.style.overflow = 'unset';
  }
}
