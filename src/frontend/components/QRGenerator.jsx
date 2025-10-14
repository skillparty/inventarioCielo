import React, { useState, useEffect } from 'react';
import { generateQRCode } from '../services/api';
import { X, Download, Printer, Copy, AlertTriangle } from 'lucide-react';
import styles from './QRGenerator.module.css';

const QRGenerator = ({ asset, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar o generar QR al montar
  useEffect(() => {
    if (asset) {
      loadQR();
    }
  }, [asset]);

  const loadQR = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generar/obtener QR del activo
      const response = await generateQRCode(asset.id);

      if (response.success) {
        setQrData({
          asset_id: response.asset_id,
          dataURL: response.qr.dataURL,
          filePath: response.qr.filePath,
          fileName: response.qr.fileName,
        });
      } else {
        setError('Error al obtener el codigo QR');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar el codigo QR');
      console.error('Error cargando QR:', err);
    } finally {
      setLoading(false);
    }
  };

  // Descargar QR como PNG
  const handleDownload = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData.dataURL;
    link.download = qrData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir QR
  const handlePrint = () => {
    if (!qrData) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir QR - ${qrData.asset_id}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #2c3e50;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .asset-id {
              background: #3498db;
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 18px;
              font-weight: bold;
              display: inline-block;
              margin-bottom: 20px;
              font-family: 'Courier New', monospace;
            }
            .qr-container {
              border: 3px solid #2c3e50;
              padding: 20px;
              border-radius: 8px;
              background: white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            img {
              display: block;
              max-width: 400px;
              height: auto;
            }
            .info {
              margin-top: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 6px;
              text-align: left;
              max-width: 500px;
            }
            .info-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #34495e;
              display: inline-block;
              width: 140px;
            }
            .info-value {
              color: #2c3e50;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sistema de Inventario Cielo</h1>
            <div class="asset-id">${qrData.asset_id}</div>
          </div>
          <div class="qr-container">
            <img src="${qrData.dataURL}" alt="Codigo QR ${qrData.asset_id}" />
          </div>
          <div class="info">
            <div class="info-row">
              <span class="info-label">ID del Activo:</span>
              <span class="info-value">${qrData.asset_id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Descripcion:</span>
              <span class="info-value">${asset.description.substring(0, 100)}${asset.description.length > 100 ? '...' : ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Responsable:</span>
              <span class="info-value">${asset.responsible}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ubicacion:</span>
              <span class="info-value">${asset.location}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Creacion:</span>
              <span class="info-value">${new Date(asset.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copiar URL del QR al portapapeles
  const handleCopyURL = () => {
    if (!qrData) return;

    const fullURL = `${window.location.origin}${qrData.filePath}`;
    navigator.clipboard.writeText(fullURL).then(() => {
      alert('URL del QR copiada al portapapeles');
    }).catch((err) => {
      console.error('Error al copiar:', err);
      alert('No se pudo copiar la URL');
    });
  };

  if (!asset) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.header}>
          <h2>Codigo QR del Activo</h2>
          <span className={styles.assetId}>{asset.asset_id}</span>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Generando codigo QR...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p><AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{error}</p>
            <button onClick={loadQR} className={styles.retryBtn}>
              Reintentar
            </button>
          </div>
        ) : qrData ? (
          <>
            <div className={styles.qrContainer}>
              <div className={styles.qrImageWrapper}>
                <img 
                  src={qrData.dataURL} 
                  alt={`QR ${qrData.asset_id}`}
                  className={styles.qrImage}
                />
              </div>

              <div className={styles.assetInfo}>
                <h3>Informacion del Activo</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID:</span>
                  <span className={styles.infoValue}>{asset.asset_id}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Descripcion:</span>
                  <span className={styles.infoValue}>{asset.description}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Responsable:</span>
                  <span className={styles.infoValue}>{asset.responsible}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Ubicacion:</span>
                  <span className={styles.infoValue}>{asset.location}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Creado:</span>
                  <span className={styles.infoValue}>
                    {new Date(asset.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button onClick={handleDownload} className={styles.btnDownload}>
                <Download size={18} />
                Descargar PNG
              </button>
              <button onClick={handlePrint} className={styles.btnPrint}>
                <Printer size={18} />
                Imprimir
              </button>
              <button onClick={handleCopyURL} className={styles.btnCopy}>
                <Copy size={18} />
                Copiar URL
              </button>
            </div>

            <div className={styles.qrPath}>
              <strong>Archivo:</strong> {qrData.filePath}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default QRGenerator;
