import React, { useState } from 'react';
import AssetList from './AssetList';
import AssetForm from './AssetForm';
import QRGenerator from './QRGenerator';
import styles from './AssetManager.module.css';

const AssetManager = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);

  // Cambiar a vista de crear
  const handleCreate = () => {
    setSelectedAsset(null);
    setCurrentView('create');
  };

  // Cambiar a vista de editar
  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setCurrentView('edit');
  };

  // Volver a lista
  const handleBackToList = () => {
    setSelectedAsset(null);
    setCurrentView('list');
  };

  // Mostrar QR
  const handleViewQR = (asset) => {
    setQrAsset(asset);
    setShowQR(true);
  };

  // Cerrar modal QR
  const handleCloseQR = () => {
    setShowQR(false);
    setQrAsset(null);
  };

  // Exito en formulario
  const handleFormSuccess = () => {
    setTimeout(() => {
      handleBackToList();
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Sistema de Inventario Cielo</h1>
          <p>Gestion de Activos y Codigos QR</p>
        </div>
        
        {currentView === 'list' && (
          <button onClick={handleCreate} className={styles.btnCreate}>
            + Crear Activo
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* Navegacion de migas de pan */}
        <div className={styles.breadcrumb}>
          <button onClick={handleBackToList} className={styles.breadcrumbItem}>
            Inicio
          </button>
          {currentView !== 'list' && (
            <>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbActive}>
                {currentView === 'create' ? 'Crear Activo' : 'Editar Activo'}
              </span>
            </>
          )}
        </div>

        {/* Vistas */}
        {currentView === 'list' && (
          <AssetList onEdit={handleEdit} onViewQR={handleViewQR} />
        )}

        {currentView === 'create' && (
          <AssetForm onSuccess={handleFormSuccess} onCancel={handleBackToList} />
        )}

        {currentView === 'edit' && selectedAsset && (
          <AssetForm
            assetToEdit={selectedAsset}
            onSuccess={handleFormSuccess}
            onCancel={handleBackToList}
          />
        )}
      </div>

      {/* Modal QR */}
      {showQR && qrAsset && (
        <QRGenerator asset={qrAsset} onClose={handleCloseQR} />
      )}
    </div>
  );
};

export default AssetManager;
