/**
 * Utilidades para imprimir etiquetas de activos
 * Formato optimizado para etiquetas adhesivas
 */

/**
 * Imprimir etiqueta individual con QR
 * @param {Object} asset - Objeto del activo con { asset_id, description, location, responsible, qr_code_path }
 */
export const printAssetLabel = (asset, qrDataURL) => {
  // Crear ventana de impresión
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Por favor habilita las ventanas emergentes para imprimir etiquetas');
    return;
  }

  // Truncar descripción para etiqueta
  const shortDescription = asset.description.length > 50 
    ? `${asset.description.substring(0, 50)}...` 
    : asset.description;

  // Generar HTML para impresión
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiqueta - ${asset.asset_id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f0f0f0;
            padding: 20px;
          }

          .label {
            width: 4in; /* 10.16 cm - Tamaño estándar de etiqueta */
            height: 2in; /* 5.08 cm */
            background: white;
            border: 2px solid #333;
            border-radius: 4px;
            padding: 8px;
            display: flex;
            gap: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }

          .qr-section {
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4px;
            background: white;
          }

          .qr-code {
            width: 1.4in;
            height: 1.4in;
            border: 1px solid #ddd;
            padding: 4px;
            background: white;
          }

          .qr-code img {
            width: 100%;
            height: 100%;
            display: block;
          }

          .info-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }

          .asset-id {
            background: #2c3e50;
            color: white;
            padding: 6px 10px;
            border-radius: 3px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
          }

          .description {
            font-size: 11px;
            color: #2c3e50;
            line-height: 1.3;
            font-weight: 600;
            margin: 4px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .details {
            font-size: 9px;
            color: #555;
            line-height: 1.4;
          }

          .details div {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 2px 0;
          }

          .details strong {
            color: #2c3e50;
          }

          .footer {
            font-size: 8px;
            color: #888;
            text-align: center;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px dashed #ddd;
          }

          @media print {
            body {
              background: white;
              padding: 0;
              margin: 0;
            }

            .label {
              box-shadow: none;
              border: 2px solid #000;
              page-break-after: always;
            }

            @page {
              size: 4in 2in;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrDataURL}" alt="QR ${asset.asset_id}" />
            </div>
          </div>
          <div class="info-section">
            <div class="asset-id">${asset.asset_id}</div>
            <div class="description">${shortDescription}</div>
            <div class="details">
              <div><strong>Ubicación:</strong> ${asset.location || 'N/A'}</div>
              <div><strong>Responsable:</strong> ${asset.responsible || 'N/A'}</div>
            </div>
            <div class="footer">
              Sistema de Inventario Cielo
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            // Esperar a que la imagen cargue
            setTimeout(() => {
              window.print();
              // Cerrar ventana después de imprimir (opcional)
              setTimeout(() => window.close(), 1000);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

/**
 * Imprimir múltiples etiquetas en una hoja
 * @param {Array} assets - Array de activos con sus QR data URLs
 */
export const printMultipleLabels = (assetsWithQR) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Por favor habilita las ventanas emergentes para imprimir etiquetas');
    return;
  }

  const labelsHTML = assetsWithQR.map(item => {
    const shortDescription = item.asset.description.length > 50 
      ? `${item.asset.description.substring(0, 50)}...` 
      : item.asset.description;

    return `
      <div class="label">
        <div class="qr-section">
          <div class="qr-code">
            <img src="${item.qrDataURL}" alt="QR ${item.asset.asset_id}" />
          </div>
        </div>
        <div class="info-section">
          <div class="asset-id">${item.asset.asset_id}</div>
          <div class="description">${shortDescription}</div>
          <div class="details">
            <div><strong>Ubicación:</strong> ${item.asset.location || 'N/A'}</div>
            <div><strong>Responsable:</strong> ${item.asset.responsible || 'N/A'}</div>
          </div>
          <div class="footer">
            Sistema de Inventario Cielo
          </div>
        </div>
      </div>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiquetas de Inventario</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', sans-serif;
            background: #f0f0f0;
            padding: 20px;
          }

          .labels-container {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            justify-content: center;
          }

          .label {
            width: 4in;
            height: 2in;
            background: white;
            border: 2px solid #333;
            border-radius: 4px;
            padding: 8px;
            display: flex;
            gap: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }

          .qr-section {
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4px;
            background: white;
          }

          .qr-code {
            width: 1.4in;
            height: 1.4in;
            border: 1px solid #ddd;
            padding: 4px;
            background: white;
          }

          .qr-code img {
            width: 100%;
            height: 100%;
            display: block;
          }

          .info-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }

          .asset-id {
            background: #2c3e50;
            color: white;
            padding: 6px 10px;
            border-radius: 3px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
          }

          .description {
            font-size: 11px;
            color: #2c3e50;
            line-height: 1.3;
            font-weight: 600;
            margin: 4px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .details {
            font-size: 9px;
            color: #555;
            line-height: 1.4;
          }

          .details div {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 2px 0;
          }

          .details strong {
            color: #2c3e50;
          }

          .footer {
            font-size: 8px;
            color: #888;
            text-align: center;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px dashed #ddd;
          }

          @media print {
            body {
              background: white;
              padding: 10mm;
            }

            .labels-container {
              display: block;
            }

            .label {
              box-shadow: none;
              border: 2px solid #000;
              page-break-after: always;
              page-break-inside: avoid;
              margin-bottom: 0;
            }

            @page {
              size: A4;
              margin: 10mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="labels-container">
          ${labelsHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

/**
 * Formato alternativo: Etiqueta pequeña (solo QR y ID)
 */
export const printSmallLabel = (asset, qrDataURL) => {
  const printWindow = window.open('', '_blank', 'width=400,height=400');
  
  if (!printWindow) {
    alert('Por favor habilita las ventanas emergentes para imprimir etiquetas');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiqueta QR - ${asset.asset_id}</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f0f0f0;
            font-family: Arial, sans-serif;
          }

          .label {
            width: 2in;
            height: 2in;
            background: white;
            border: 2px solid #000;
            padding: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }

          .qr-code {
            width: 1.5in;
            height: 1.5in;
          }

          .qr-code img {
            width: 100%;
            height: 100%;
            display: block;
          }

          .asset-id {
            background: #2c3e50;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
          }

          @media print {
            body {
              background: white;
            }

            @page {
              size: 2in 2in;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="qr-code">
            <img src="${qrDataURL}" alt="QR ${asset.asset_id}" />
          </div>
          <div class="asset-id">${asset.asset_id}</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};
