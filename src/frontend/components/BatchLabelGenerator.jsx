/**
 * Componente para generar PDFs con múltiples etiquetas de activos
 * Permite seleccionar activos y generar un PDF batch para impresión
 */

import React, { useState, useEffect } from 'react';
import { Printer, Download, CheckSquare, Square, FileText, AlertCircle, Loader } from 'lucide-react';
import styles from './BatchLabelGenerator.module.css';
import { getAllAssets, generateBatchLabels } from '../services/api';

const BatchLabelGenerator = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cargar activos al montar el componente
  useEffect(() => {
    loadAssets();
  }, []);

  // Filtrar activos cuando cambian los filtros
  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, locationFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllAssets();
      const assetsData = response.data || [];
      setAssets(assetsData);
      setFilteredAssets(assetsData);
    } catch (err) {
      console.error('Error al cargar activos:', err);
      setError('Error al cargar los activos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.serial_number?.toLowerCase().includes(term) ||
        asset.description?.toLowerCase().includes(term) ||
        asset.location?.toLowerCase().includes(term) ||
        asset.responsible?.toLowerCase().includes(term)
      );
    }

    // Filtrar por ubicación
    if (locationFilter !== 'all') {
      filtered = filtered.filter(asset => asset.location === locationFilter);
    }

    setFilteredAssets(filtered);
  };

  const toggleSelectAsset = (serialNumber) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(serialNumber)) {
      newSelected.delete(serialNumber);
    } else {
      newSelected.add(serialNumber);
    }
    setSelectedAssets(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      const allSerialNumbers = filteredAssets.map(asset => asset.serial_number);
      setSelectedAssets(new Set(allSerialNumbers));
    }
  };

  const clearSelection = () => {
    setSelectedAssets(new Set());
  };

  const handleGenerateBatch = async () => {
    if (selectedAssets.size === 0) {
      alert('Por favor, selecciona al menos un activo');
      return;
    }

    if (selectedAssets.size > 100) {
      alert('El límite máximo es 100 etiquetas por lote');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmGeneration = async () => {
    setShowConfirmModal(false);
    setGenerating(true);

    try {
      const serialNumbers = Array.from(selectedAssets);
      const response = await generateBatchLabels(serialNumbers);

      if (response.success) {
        // Descargar el archivo PDF
        const downloadUrl = response.batch.downloadUrl;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = response.batch.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const rollLength = response.batch.rollLength || (response.batch.labelCount * 40);
        alert(`✅ PDF generado exitosamente\n\n📄 Etiquetas: ${response.batch.labelCount}\n📏 Rollo: 40mm × ${rollLength}mm\n🖨️ Listo para impresión continua`);
        
        // Limpiar selección después de generar
        clearSelection();
      }
    } catch (err) {
      console.error('Error al generar PDF batch:', err);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setGenerating(false);
    }
  };

  // Obtener ubicaciones únicas para el filtro
  const uniqueLocations = [...new Set(assets.map(asset => asset.location).filter(Boolean))];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Loader className={styles.spinner} size={48} />
          <div>Cargando activos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle size={24} />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <FileText size={32} />
            Generador de Etiquetas por Lotes
          </h1>
          <p className={styles.subtitle}>
            Selecciona múltiples activos y genera un PDF en formato rollo continuo (40mm ancho) para impresión térmica
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.searchBox}
          placeholder="Buscar por serial, descripción, ubicación o responsable..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className={styles.filterSelect}
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="all">Todas las ubicaciones</option>
          {uniqueLocations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>

        {selectedAssets.size > 0 && (
          <div className={styles.selectionCounter}>
            <CheckSquare size={16} />
            {selectedAssets.size} seleccionado{selectedAssets.size !== 1 ? 's' : ''}
          </div>
        )}

        <div className={styles.actionButtons}>
          {selectedAssets.size > 0 && (
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={clearSelection}
            >
              Limpiar selección
            </button>
          )}
          
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleGenerateBatch}
            disabled={selectedAssets.size === 0 || generating}
          >
            {generating ? (
              <>
                <Loader className={styles.spinner} size={16} />
                Generando...
              </>
            ) : (
              <>
                <Printer size={16} />
                Generar PDF ({selectedAssets.size})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabla de activos */}
      {filteredAssets.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📦</div>
          <div>No se encontraron activos</div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Serial</th>
                <th>Descripción</th>
                <th>Ubicación</th>
                <th>Responsable</th>
                <th>QR</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => (
                <tr
                  key={asset.serial_number}
                  className={selectedAssets.has(asset.serial_number) ? styles.selected : ''}
                  onClick={() => toggleSelectAsset(asset.serial_number)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedAssets.has(asset.serial_number)}
                      onChange={() => toggleSelectAsset(asset.serial_number)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className={styles.serialNumber}>{asset.serial_number}</td>
                  <td className={styles.description}>{asset.description || 'N/A'}</td>
                  <td>{asset.location || 'N/A'}</td>
                  <td>{asset.responsible || 'N/A'}</td>
                  <td>
                    <span className={`${styles.badge} ${asset.qr_code_path ? styles.badgeSuccess : styles.badgeWarning}`}>
                      {asset.qr_code_path ? 'Sí' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className={styles.modal} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <FileText size={24} color="#3b82f6" />
              <h2 className={styles.modalTitle}>Confirmar generación de PDF</h2>
            </div>
            <div className={styles.modalBody}>
              <p>Estás a punto de generar un PDF con <strong>{selectedAssets.size}</strong> etiqueta{selectedAssets.size !== 1 ? 's' : ''}.</p>
              <p>El PDF se descargará automáticamente y podrás cargarlo en tu aplicación móvil para impresión en rollo continuo.</p>
              <p><strong>Formato:</strong> Rollo de 40mm de ancho × {selectedAssets.size * 40}mm de largo</p>
              <p><strong>Etiquetas:</strong> {selectedAssets.size} × 40mm (apiladas verticalmente)</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={confirmGeneration}
              >
                <Download size={16} />
                Generar y Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchLabelGenerator;
