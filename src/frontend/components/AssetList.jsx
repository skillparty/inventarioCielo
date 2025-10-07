import React, { useState, useEffect } from 'react';
import { getAssets, searchAssets, deleteAsset } from '../services/api';
import styles from './AssetList.module.css';

const AssetList = ({ onEdit, onViewQR }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;

  // Cargar activos
  const loadAssets = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAssets(page, itemsPerPage);
      
      if (response.success) {
        setAssets(response.data);
        setPagination(response.pagination);
      } else {
        setError('Error al cargar los activos');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
      console.error('Error cargando activos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar activos
  const handleSearch = async (query) => {
    if (query.trim().length < 2) {
      setIsSearching(false);
      loadAssets(1);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);
      const response = await searchAssets(query);
      
      if (response.success) {
        setAssets(response.data);
        setPagination(null); // No hay paginacion en busqueda
      } else {
        setError('Error al buscar activos');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error en la busqueda');
      console.error('Error buscando activos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar activo
  const handleDelete = async (id, assetId) => {
    if (!window.confirm(`¿Esta seguro de eliminar el activo ${assetId}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await deleteAsset(id);
      
      if (response.success) {
        alert('Activo eliminado exitosamente');
        // Recargar lista
        if (isSearching && searchTerm) {
          handleSearch(searchTerm);
        } else {
          loadAssets(currentPage);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar activo');
      console.error('Error eliminando activo:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar pagina
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    loadAssets(newPage);
  };

  // Efecto inicial
  useEffect(() => {
    loadAssets(1);
  }, []);

  // Efecto de busqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setIsSearching(false);
        loadAssets(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Listado de Activos</h2>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar por ID, descripcion, responsable o ubicacion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={styles.clearButton}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button onClick={() => loadAssets(currentPage)}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando activos...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className={styles.empty}>
          <p>No se encontraron activos</p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}>Limpiar busqueda</button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID Activo</th>
                  <th>Descripcion</th>
                  <th>Responsable</th>
                  <th>Ubicacion</th>
                  <th>Fecha Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <span className={styles.assetId}>{asset.asset_id}</span>
                    </td>
                    <td>
                      <div className={styles.description}>
                        {asset.description.length > 80
                          ? `${asset.description.substring(0, 80)}...`
                          : asset.description}
                      </div>
                    </td>
                    <td>{asset.responsible}</td>
                    <td>{asset.location}</td>
                    <td>
                      {new Date(asset.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => onViewQR(asset)}
                          className={styles.btnQr}
                          title="Ver codigo QR"
                        >
                          QR
                        </button>
                        <button
                          onClick={() => onEdit(asset)}
                          className={styles.btnEdit}
                          title="Editar activo"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id, asset.asset_id)}
                          className={styles.btnDelete}
                          title="Eliminar activo"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isSearching && pagination && pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.paginationBtn}
              >
                ← Anterior
              </button>
              
              <div className={styles.pageInfo}>
                <span>
                  Pagina {pagination.page} de {pagination.totalPages}
                </span>
                <span className={styles.totalItems}>
                  ({pagination.total} activos en total)
                </span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasMore}
                className={styles.paginationBtn}
              >
                Siguiente →
              </button>
            </div>
          )}

          {isSearching && (
            <div className={styles.searchInfo}>
              Mostrando {assets.length} resultado(s) para "{searchTerm}"
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssetList;
