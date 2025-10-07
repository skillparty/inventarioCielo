import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getActivoByQR } from '../services/api';
import './QRScanner.css';

function QRScanner({ onBack }) {
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const iniciarEscaneo = () => {
    setScanning(true);
    setResultado(null);
    setError(null);

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    setScanner(html5QrcodeScanner);
  };

  const onScanSuccess = async (decodedText) => {
    console.log('QR Code detectado:', decodedText);
    
    if (scanner) {
      scanner.clear();
    }
    
    setScanning(false);
    await buscarActivo(decodedText);
  };

  const onScanError = (error) => {
    // Ignorar errores de escaneo continuos (son normales)
    // console.warn('Error de escaneo:', error);
  };

  const buscarActivo = async (codigoQR) => {
    try {
      const response = await getActivoByQR(codigoQR);
      setResultado(response.data);
      setError(null);
    } catch (error) {
      console.error('Error al buscar activo:', error);
      setError('No se encontró ningún activo con ese código QR');
      setResultado(null);
    }
  };

  const detenerEscaneo = () => {
    if (scanner) {
      scanner.clear();
    }
    setScanning(false);
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      buscarActivo(manualCode.trim());
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="qr-scanner">
      <div className="scanner-header">
        <button className="back-btn" onClick={onBack}>
          ← Volver
        </button>
        <h2>📷 Escanear Código QR</h2>
      </div>

      <div className="scanner-container">
        <div className="scanner-section">
          <div className="scanner-instructions">
            <h3>Opciones de búsqueda:</h3>
            <p>1. Usa la cámara para escanear un código QR</p>
            <p>2. Ingresa manualmente el código del activo</p>
          </div>

          {!scanning && !resultado && (
            <div className="scanner-actions">
              <button className="btn-start-scan" onClick={iniciarEscaneo}>
                📷 Iniciar Escaneo con Cámara
              </button>
              
              <div className="manual-search">
                <h4>O buscar manualmente:</h4>
                <form onSubmit={handleManualSearch}>
                  <input
                    type="text"
                    placeholder="Ingresa el código QR (Ej: ACT-1701234567890-abc123def)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <button type="submit" className="btn-search">
                    🔍 Buscar
                  </button>
                </form>
              </div>
            </div>
          )}

          {scanning && (
            <div className="scanner-active">
              <div id="qr-reader"></div>
              <button className="btn-stop-scan" onClick={detenerEscaneo}>
                ⏹️ Detener Escaneo
              </button>
            </div>
          )}

          {error && (
            <div className="scanner-error">
              <p>❌ {error}</p>
              <button className="btn-retry" onClick={() => {
                setError(null);
                setManualCode('');
              }}>
                🔄 Intentar de nuevo
              </button>
            </div>
          )}

          {resultado && (
            <div className="scanner-result">
              <div className="result-header">
                <h3>✅ Activo Encontrado</h3>
                <span className={`estado-badge ${resultado.estado?.toLowerCase()}`}>
                  {resultado.estado}
                </span>
              </div>

              <div className="result-body">
                <div className="result-row">
                  <strong>Nombre:</strong>
                  <span>{resultado.nombre}</span>
                </div>
                <div className="result-row">
                  <strong>Categoría:</strong>
                  <span>{resultado.categoria || 'N/A'}</span>
                </div>
                <div className="result-row">
                  <strong>Ubicación:</strong>
                  <span>{resultado.ubicacion || 'N/A'}</span>
                </div>
                <div className="result-row">
                  <strong>Responsable:</strong>
                  <span>{resultado.responsable || 'N/A'}</span>
                </div>
                <div className="result-row">
                  <strong>Número de Serie:</strong>
                  <span>{resultado.numero_serie || 'N/A'}</span>
                </div>
                <div className="result-row">
                  <strong>Valor:</strong>
                  <span>{formatCurrency(resultado.valor)}</span>
                </div>
                <div className="result-row">
                  <strong>Código QR:</strong>
                  <span className="qr-code">{resultado.codigo_qr}</span>
                </div>
                <div className="result-row">
                  <strong>Fecha de Registro:</strong>
                  <span>{formatDate(resultado.fecha_registro)}</span>
                </div>
                {resultado.descripcion && (
                  <div className="result-description">
                    <strong>Descripción:</strong>
                    <p>{resultado.descripcion}</p>
                  </div>
                )}
              </div>

              <div className="result-actions">
                <button className="btn-new-scan" onClick={() => {
                  setResultado(null);
                  setManualCode('');
                }}>
                  🔄 Escanear Otro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRScanner;
