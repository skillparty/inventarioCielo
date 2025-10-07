import React, { useState, useEffect } from 'react';
import { getDashboardStats, exportToCSV, createBackup } from '../services/api';
import styles from './DashboardNew.module.css';

const DashboardNew = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [backing, setBacking] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardStats();
      setStats(response.stats);
    } catch (err) {
      setError('Error al cargar estadísticas');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await exportToCSV();
      alert('✅ Inventario exportado exitosamente');
    } catch (err) {
      alert('❌ Error al exportar inventario');
      console.error('Error exporting:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBacking(true);
      const response = await createBackup();
      alert(`✅ Backup creado exitosamente\n\n📁 ${response.backup.filename}\n📊 ${response.backup.sizeFormatted}`);
    } catch (err) {
      alert('❌ Error al crear backup de la base de datos');
      console.error('Error creating backup:', err);
    } finally {
      setBacking(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>⚠ {error}</p>
          <button onClick={loadStats} className={styles.retryBtn}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>📊 Dashboard de Inventario</h1>
          <p className={styles.subtitle}>Resumen general del sistema</p>
        </div>
        <button onClick={loadStats} className={styles.refreshBtn}>
          🔄 Actualizar
        </button>
      </div>

      {/* Estadísticas principales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statInfo}>
            <h3>Total de Activos</h3>
            <p className={styles.statValue}>{stats?.total || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statInfo}>
            <h3>Esta Semana</h3>
            <p className={styles.statValue}>{stats?.thisWeek || 0}</p>
            <span className={styles.statLabel}>nuevos activos</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statInfo}>
            <h3>Este Mes</h3>
            <p className={styles.statValue}>{stats?.thisMonth || 0}</p>
            <span className={styles.statLabel}>nuevos activos</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📍</div>
          <div className={styles.statInfo}>
            <h3>Ubicaciones</h3>
            <p className={styles.statValue}>{stats?.byLocation?.length || 0}</p>
            <span className={styles.statLabel}>diferentes</span>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className={styles.quickActions}>
        <h2>Acciones Rápidas</h2>
        <div className={styles.actionsGrid}>
          <button onClick={() => onNavigate?.('create')} className={styles.actionBtn}>
            <span className={styles.actionIcon}>➕</span>
            <span>Nuevo Activo</span>
          </button>
          <button onClick={() => onNavigate?.('scan')} className={styles.actionBtn}>
            <span className={styles.actionIcon}>📷</span>
            <span>Escanear QR</span>
          </button>
          <button onClick={handleExportCSV} className={styles.actionBtn} disabled={exporting}>
            <span className={styles.actionIcon}>📥</span>
            <span>{exporting ? 'Exportando...' : 'Exportar CSV'}</span>
          </button>
          <button onClick={handleBackup} className={styles.actionBtn} disabled={backing}>
            <span className={styles.actionIcon}>💾</span>
            <span>{backing ? 'Creando...' : 'Backup DB'}</span>
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className={styles.chartsContainer}>
        {/* Activos por ubicación */}
        <div className={styles.chartCard}>
          <h2>📍 Activos por Ubicación</h2>
          {stats?.byLocation && stats.byLocation.length > 0 ? (
            <div className={styles.barChart}>
              {stats.byLocation.map((item, index) => {
                const maxCount = Math.max(...stats.byLocation.map(i => parseInt(i.count)));
                const percentage = (parseInt(item.count) / maxCount) * 100;
                return (
                  <div key={index} className={styles.barRow}>
                    <div className={styles.barLabel}>{item.location || 'Sin ubicación'}</div>
                    <div className={styles.barContainer}>
                      <div 
                        className={styles.bar} 
                        style={{ width: `${percentage}%` }}
                      >
                        <span className={styles.barValue}>{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.noData}>No hay datos disponibles</p>
          )}
        </div>

        {/* Top responsables */}
        <div className={styles.chartCard}>
          <h2>👤 Top Responsables</h2>
          {stats?.byResponsible && stats.byResponsible.length > 0 ? (
            <div className={styles.list}>
              {stats.byResponsible.map((item, index) => (
                <div key={index} className={styles.listItem}>
                  <div className={styles.rank}>{index + 1}</div>
                  <div className={styles.listInfo}>
                    <span className={styles.listName}>{item.responsible || 'Sin responsable'}</span>
                    <span className={styles.listCount}>{item.count} activos</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No hay datos disponibles</p>
          )}
        </div>
      </div>

      {/* Activos recientes */}
      <div className={styles.recentSection}>
        <h2>🕒 Activos Recientes</h2>
        {stats?.recent && stats.recent.length > 0 ? (
          <div className={styles.recentGrid}>
            {stats.recent.map((asset) => (
              <div key={asset.id} className={styles.recentCard}>
                <div className={styles.recentHeader}>
                  <span className={styles.recentId}>{asset.asset_id}</span>
                  <span className={styles.recentDate}>
                    {new Date(asset.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
                <p className={styles.recentDesc}>
                  {asset.description.length > 60
                    ? `${asset.description.substring(0, 60)}...`
                    : asset.description}
                </p>
                <div className={styles.recentFooter}>
                  <span>📍 {asset.location || 'N/A'}</span>
                  <span>👤 {asset.responsible || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noData}>No hay activos recientes</p>
        )}
      </div>
    </div>
  );
};

export default DashboardNew;
