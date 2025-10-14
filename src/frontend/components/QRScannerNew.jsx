import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getAssetByAssetId } from '../services/api';
import { X, Check, Camera, AlertTriangle } from 'lucide-react';
import styles from './QRScannerNew.module.css';

const QRScannerNew = ({ onAssetFound, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannerIdRef = useRef('qr-reader');

  // Obtener lista de camaras disponibles
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Preferir camara trasera en moviles
          const backCamera = devices.find((device) =>
            device.label.toLowerCase().includes('back')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        } else {
          setCameraError('No se encontraron camaras disponibles');
        }
      })
      .catch((err) => {
        console.error('Error obteniendo camaras:', err);
        setCameraError('Error al acceder a las camaras del dispositivo');
      });

    return () => {
      stopScanning();
    };
  }, []);

  // Iniciar escaneo
  const startScanning = async () => {
    if (!selectedCamera) {
      setCameraError('Por favor seleccione una camara');
      return;
    }

    try {
      setCameraError(null);
      setError(null);
      setScanSuccess(false);

      html5QrCodeRef.current = new Html5Qrcode(scannerIdRef.current);

      const config = {
        fps: 10, // Frames por segundo
        qrbox: { width: 250, height: 250 }, // Area de escaneo
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        selectedCamera,
        config,
        onScanSuccess,
        onScanFailure
      );

      setScanning(true);
    } catch (err) {
      console.error('Error iniciando escaner:', err);
      
      if (err.name === 'NotAllowedError') {
        setCameraError('Permiso de camara denegado. Por favor habilita el acceso a la camara en la configuracion del navegador.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No se encontro ninguna camara disponible.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('La camara esta siendo usada por otra aplicacion.');
      } else {
        setCameraError(`Error al iniciar la camara: ${err.message || 'Error desconocido'}`);
      }
    }
  };

  // Detener escaneo
  const stopScanning = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('Error deteniendo escaner:', err);
      }
    }
  };

  // Callback cuando se escanea exitosamente
  const onScanSuccess = async (decodedText, decodedResult) => {
    // Evitar multiples escaneos del mismo codigo
    if (loading || scannedAsset) return;

    console.log('QR escaneado:', decodedText);
    setScanSuccess(true);

    // Detener escaneo temporalmente
    await stopScanning();

    // Buscar activo por asset_id
    await searchAsset(decodedText);
  };

  // Callback cuando falla el escaneo (no hace nada, es normal)
  const onScanFailure = (error) => {
    // No mostrar errores continuos de escaneo
    // Solo registrar en consola si es necesario
  };

  // Buscar activo por asset_id
  const searchAsset = async (assetId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAssetByAssetId(assetId);

      if (response.success) {
        setScannedAsset(response.data);
        
        // Notificar al componente padre si existe
        if (onAssetFound) {
          onAssetFound(response.data);
        }
      } else {
        setError('Activo no encontrado en el sistema');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'No se encontro ningun activo con ese codigo QR';
      setError(errorMsg);
      console.error('Error buscando activo:', err);
    } finally {
      setLoading(false);
      setScanSuccess(false);
    }
  };

  // Cambiar camara
  const handleCameraChange = async (e) => {
    const newCameraId = e.target.value;
    setSelectedCamera(newCameraId);

    if (scanning) {
      await stopScanning();
      // Reiniciar con nueva camara
      setTimeout(() => {
        startScanning();
      }, 500);
    }
  };

  // Escanear desde archivo
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setScanSuccess(false);

      const html5QrCode = new Html5Qrcode(scannerIdRef.current);
      const decodedText = await html5QrCode.scanFile(file, true);

      console.log('QR desde archivo:', decodedText);
      setScanSuccess(true);

      await searchAsset(decodedText);
    } catch (err) {
      console.error('Error escaneando archivo:', err);
      setError('No se pudo leer el codigo QR de la imagen. Asegurate de que sea una imagen clara del codigo QR.');
    } finally {
      setLoading(false);
      setScanSuccess(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Reiniciar escaneo
  const handleRestart = () => {
    setScannedAsset(null);
    setError(null);
    setScanSuccess(false);
    startScanning();
  };

  // Cerrar modal de resultado
  const handleCloseResult = () => {
    setScannedAsset(null);
    setError(null);
    handleRestart();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Escanear Codigo QR</h2>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={24} />
        </button>
      </div>

      {/* Tabs para cambiar modo */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${!uploadMode ? styles.tabActive : ''}`}
          onClick={() => setUploadMode(false)}
        >
          Camara
        </button>
        <button
          className={`${styles.tab} ${uploadMode ? styles.tabActive : ''}`}
          onClick={() => {
            setUploadMode(true);
            if (scanning) stopScanning();
          }}
        >
          Subir Imagen
        </button>
      </div>

      <div className={styles.content}>
        {!uploadMode ? (
          // Modo Camara
          <>
            {/* Selector de camara */}
            {cameras.length > 1 && !scanning && (
              <div className={styles.cameraSelector}>
                <label>Seleccionar Camara:</label>
                <select value={selectedCamera || ''} onChange={handleCameraChange}>
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camara ${camera.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error de camara */}
            {cameraError && (
              <div className={styles.error}>
                <p>{cameraError}</p>
                <button onClick={startScanning} className={styles.retryBtn}>
                  Reintentar
                </button>
              </div>
            )}

            {/* Area de escaneo */}
            <div className={styles.scannerWrapper}>
              <div id={scannerIdRef.current} className={styles.scanner}></div>
              
              {scanSuccess && (
                <div className={styles.scanIndicator}>
                  <div className={styles.checkmark}><Check size={24} /></div>
                  <span>Codigo detectado</span>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className={styles.controls}>
              {!scanning ? (
                <button onClick={startScanning} className={styles.btnStart}>
                  Iniciar Camara
                </button>
              ) : (
                <button onClick={stopScanning} className={styles.btnStop}>
                  Detener Camara
                </button>
              )}
            </div>
          </>
        ) : (
          // Modo Subir Imagen
          <div className={styles.uploadSection}>
            <div className={styles.uploadBox}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className={styles.fileInput}
                id="qr-file-input"
              />
              <label htmlFor="qr-file-input" className={styles.uploadLabel}>
                <div className={styles.uploadIcon}><Camera size={48} /></div>
                <p>Haz clic para seleccionar una imagen</p>
                <span>o arrastra y suelta aqui</span>
              </label>
            </div>
            <div className={styles.uploadNote}>
              <strong>Nota:</strong> La imagen debe contener un codigo QR claro y legible.
            </div>
          </div>
        )}

        {/* Indicador de carga */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Buscando activo...</p>
          </div>
        )}

        {/* Error de busqueda */}
        {error && !loading && (
          <div className={styles.errorResult}>
            <div className={styles.errorIcon}><AlertTriangle size={32} /></div>
            <p>{error}</p>
            <button onClick={handleRestart} className={styles.btnRetry}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Resultado: Activo encontrado */}
        {scannedAsset && !loading && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <h3>Activo Encontrado</h3>
              <span className={styles.assetId}>{scannedAsset.asset_id}</span>
            </div>

            <div className={styles.assetDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Descripcion:</span>
                <span className={styles.detailValue}>{scannedAsset.description}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Responsable:</span>
                <span className={styles.detailValue}>{scannedAsset.responsible}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Ubicacion:</span>
                <span className={styles.detailValue}>{scannedAsset.location}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Creado:</span>
                <span className={styles.detailValue}>
                  {new Date(scannedAsset.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Actualizado:</span>
                <span className={styles.detailValue}>
                  {new Date(scannedAsset.updated_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className={styles.resultActions}>
              <button onClick={handleCloseResult} className={styles.btnScanAgain}>
                Escanear Otro
              </button>
              <button onClick={onClose} className={styles.btnClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      {!scannedAsset && !error && !loading && (
        <div className={styles.instructions}>
          <h4>Instrucciones:</h4>
          <ul>
            <li>Coloca el codigo QR frente a la camara</li>
            <li>Mantén el codigo dentro del area de escaneo</li>
            <li>Asegurate de tener buena iluminacion</li>
            <li>El escaneo es automatico al detectar el codigo</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default QRScannerNew;
