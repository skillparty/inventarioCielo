import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Search, RefreshCw, Square, X, CheckCircle } from 'lucide-react';
import { getAssetByAssetId } from '../services/api';
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

  const iniciarEscaneo = async () => {
    setScanning(true);
    setResultado(null);
    setError(null);

    try {
      // Verificar si la API de medios está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara requiere HTTPS. Accede desde https://' + window.location.hostname + ':3000');
      }
      
      // Primero pedir permisos explícitamente
      console.log('Solicitando permisos de cámara...');
      
      await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      }).then(stream => {
        // Cerrar el stream inmediatamente, solo queríamos pedir permisos
        stream.getTracks().forEach(track => track.stop());
        console.log('Permisos de cámara concedidos');
      });

      // Ahora iniciar el scanner
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          // Configuración simplificada para mejor compatibilidad
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true
        },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, (errorMessage) => {
        // Solo mostrar errores importantes
        if (errorMessage && !errorMessage.includes('NotFoundException')) {
          console.warn('Error de escaneo:', errorMessage);
        }
      });
      
      setScanner(html5QrcodeScanner);
    } catch (error) {
      console.error('Error al iniciar scanner:', error);
      
      let errorMsg = 'Error al iniciar la cámara. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg += 'Permisos de cámara denegados. Ve a Configuración de Chrome → Permisos del sitio → Cámara y permite el acceso.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg += 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg += 'La cámara está siendo usada por otra aplicación.';
      } else {
        errorMsg += 'Error: ' + error.message;
      }
      
      setError(errorMsg);
      setScanning(false);
    }
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
      // Usar la función del api.js que tiene la configuración correcta
      const response = await getAssetByAssetId(codigoQR);
      
      if (response.success && response.data) {
        // Mapear campos del backend al formato esperado por el componente
        const activoMapeado = {
          nombre: response.data.serial_number, // Mostrar serial_number como nombre principal
          descripcion: response.data.description,
          ubicacion: response.data.location,
          responsable: response.data.responsible,
          codigo_qr: response.data.serial_number, // El QR contiene el serial_number
          fecha_registro: response.data.created_at,
          // Campos completos desde el backend
          categoria: response.data.category || 'N/A',
          numero_serie: response.data.serial_number,
          valor: response.data.value || 0,
          estado: 'Activo'
        };
        
        setResultado(activoMapeado);
        setError(null);
      } else {
        setError('No se encontró ningún activo con ese código QR');
        setResultado(null);
      }
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
        <h2><Camera size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Escanear Código QR</h2>
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
                <Camera size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Iniciar Escaneo con Cámara
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
                    <Search size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Buscar
                  </button>
                </form>
              </div>
            </div>
          )}

          {scanning && (
            <div className="scanner-active">
              <div id="qr-reader"></div>
              <button className="btn-stop-scan" onClick={detenerEscaneo}>
                <Square size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Detener Escaneo
              </button>
            </div>
          )}

          {error && (
            <div className="scanner-error">
              <p><X size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{error}</p>
              <button className="btn-retry" onClick={() => {
                setError(null);
                setManualCode('');
              }}>
                <RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Intentar de nuevo
              </button>
            </div>
          )}

          {resultado && (
            <div className="scanner-result">
              <div className="result-header">
                <h3><CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Activo Encontrado</h3>
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
                  <RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Escanear Otro
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
