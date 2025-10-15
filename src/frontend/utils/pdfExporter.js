import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF profesional con todos los activos del inventario
 * @param {Array} assets - Array de activos a exportar
 * @param {Object} stats - Estadisticas del dashboard (opcional)
 */
export const exportAssetsToPDF = (assets, stats = null) => {
  // Crear documento PDF en orientación horizontal para más espacio
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Configurar colores corporativos
  const primaryColor = [41, 128, 185]; // Azul profesional
  const secondaryColor = [52, 73, 94]; // Gris oscuro
  const accentColor = [39, 174, 96]; // Verde
  
  // ============================================
  // ENCABEZADO
  // ============================================
  
  // Fondo del encabezado
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTARIO CIELO', pageWidth / 2, 15, { align: 'center' });
  
  // Subtítulo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Activos', pageWidth / 2, 23, { align: 'center' });
  
  // Fecha y hora de generación
  const now = new Date();
  const formattedDate = now.toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.setFontSize(9);
  doc.text(`Generado: ${formattedDate} a las ${formattedTime}`, pageWidth / 2, 30, { align: 'center' });
  
  // ============================================
  // RESUMEN ESTADÍSTICO
  // ============================================
  
  if (stats) {
    let yPosition = 45;
    
    // Título de sección
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN EJECUTIVO', 14, yPosition);
    
    yPosition += 8;
    
    // Crear tabla de estadísticas
    const statsData = [
      ['Total de Activos', stats.total.toString()],
      ['Activos en Operación', stats.activos.toString()],
      ['Activos Inactivos', stats.inactivos.toString()],
      ['En Mantenimiento', stats.mantenimiento.toString()],
      ['Valor Total del Inventario', formatCurrency(stats.valorTotal)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: statsData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: {
        fontSize: 10,
        textColor: secondaryColor
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });
    
    yPosition = doc.lastAutoTable.finalY + 12;
    
    // Línea separadora
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    
    yPosition += 10;
    
    // ============================================
    // DETALLE DE ACTIVOS
    // ============================================
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE ACTIVOS', 14, yPosition);
    
    yPosition += 5;
  }
  
  // Preparar datos para la tabla principal
  const tableData = assets.map((asset, index) => [
    (index + 1).toString(),
    asset.serial_number || asset.asset_id || 'N/A',
    asset.description || 'Sin descripción',
    asset.category || 'Sin categoría',
    asset.status || 'Activo',
    asset.responsible || 'Sin asignar',
    asset.location || 'Sin ubicación',
    formatCurrency(parseFloat(asset.value) || 0)
  ]);
  
  // Crear tabla principal de activos
  autoTable(doc, {
    startY: stats ? doc.lastAutoTable.finalY + 20 : 45,
    head: [['#', 'No. Serie', 'Descripción', 'Categoría', 'Estado', 'Responsable', 'Ubicación', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: secondaryColor
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 35 },
      6: { cellWidth: 35 },
      7: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      // Colorear el estado según su valor
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.raw;
        let color;
        
        if (status === 'Activo') {
          color = [39, 174, 96]; // Verde
        } else if (status === 'Inactivo') {
          color = [231, 76, 60]; // Rojo
        } else if (status === 'Mantenimiento') {
          color = [243, 156, 18]; // Naranja
        }
        
        if (color) {
          doc.setFillColor(...color);
          doc.setTextColor(255, 255, 255);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, {
            align: 'center',
            baseline: 'middle'
          });
        }
      }
    },
    didDrawPage: (data) => {
      // Pie de página en cada página
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.setFont('helvetica', 'normal');
      
      // Número de página
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      // Información adicional
      doc.text(
        'Sistema de Gestión de Inventario - Inventario Cielo',
        14,
        pageHeight - 10
      );
      
      doc.text(
        'Documento confidencial',
        pageWidth - 14,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  });
  
  // ============================================
  // GUARDAR PDF
  // ============================================
  
  const filename = `Inventario_Cielo_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`;
  doc.save(filename);
  
  return filename;
};

/**
 * Formatea un número como moneda
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(value);
};

export default exportAssetsToPDF;
