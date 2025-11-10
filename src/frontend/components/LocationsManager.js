import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Edit2, Trash2, X, Save, Upload, Download } from 'lucide-react';
import { getLocations, createLocation, updateLocation, deleteLocation, downloadLocationsTemplate, uploadBulkLocations } from '../services/api';
import './ConfigManager.css';

function LocationsManager({ onBack }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await getLocations();
      setLocations(response.data);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      alert('Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre de la ubicación es requerido');
      return;
    }

    try {
      if (editing) {
        await updateLocation(editing.id, formData);
        alert('Ubicación actualizada exitosamente');
      } else {
        await createLocation(formData);
        alert('Ubicación creada exitosamente');
      }
      
      setFormData({ name: '', description: '' });
      setEditing(null);
      setShowForm(false);
      loadLocations();
    } catch (error) {
      console.error('Error al guardar ubicación:', error);
      alert(error.response?.data?.message || 'Error al guardar ubicación');
    }
  };

  const handleEdit = (location) => {
    setEditing(location);
    setFormData({ name: location.name, description: location.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar la ubicación "${name}"?`)) {
      return;
    }

    try {
      await deleteLocation(id);
      alert('Ubicación eliminada exitosamente');
      loadLocations();
    } catch (error) {
      console.error('Error al eliminar ubicación:', error);
      alert(error.response?.data?.message || 'Error al eliminar ubicación');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleDownloadTemplate = () => {
    try {
      downloadLocationsTemplate();
      alert('✅ Descargando plantilla Excel...');
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      alert('Error al descargar la plantilla');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleBulkUpload(file);
    }
  };

  const handleBulkUpload = async (file) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    if (!window.confirm(`¿Procesar el archivo "${file.name}" para cargar ubicaciones?`)) {
      return;
    }

    try {
      setUploading(true);
      const result = await uploadBulkLocations(file);
      
      let message = `✅ Proceso completado\n\n`;
      message += `📊 Total de filas: ${result.results.total}\n`;
      message += `✓ Ubicaciones creadas: ${result.results.created}\n`;
      message += `⊘ Ya existían: ${result.results.skipped}\n`;
      
      if (result.results.errors.length > 0) {
        message += `\n❌ Errores encontrados: ${result.results.errors.length}\n`;
        result.results.errors.slice(0, 5).forEach(err => {
          message += `  - Fila ${err.row}: ${err.error}\n`;
        });
        if (result.results.errors.length > 5) {
          message += `  ... y ${result.results.errors.length - 5} errores más`;
        }
      }
      
      alert(message);
      loadLocations();
      
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      alert(error.response?.data?.message || 'Error al procesar el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="config-manager">
        <div className="loading">Cargando ubicaciones...</div>
      </div>
    );
  }

  return (
    <div className="config-manager">
      <div className="config-header">
        <h2>
          <MapPin size={24} />
          Gestión de Ubicaciones
        </h2>
        <button className="btn-back" onClick={onBack}>
          <X size={20} /> Cerrar
        </button>
      </div>

      <div className="config-actions">
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} />
          Nueva Ubicación
        </button>
      </div>

      {/* Sección de carga masiva */}
      <div className="bulk-upload-section" style={{ 
        backgroundColor: '#e0f2fe', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0369a1' }}>
          📦 Carga Masiva de Ubicaciones
        </h3>
        <p style={{ marginBottom: '15px', fontSize: '14px' }}>
          Importa múltiples ubicaciones desde un archivo Excel
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-success"
            onClick={handleDownloadTemplate}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={18} />
            Descargar Plantilla
          </button>
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Upload size={18} />
            {uploading ? 'Procesando...' : 'Subir Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {showForm && (
        <div className="config-form">
          <h3>{editing ? 'Editar Ubicación' : 'Nueva Ubicación'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la ubicación *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Almacén Principal"
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional de la ubicación"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-success">
                <Save size={18} />
                {editing ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                <X size={18} />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="config-list">
        <h3>Ubicaciones Registradas ({locations.length})</h3>
        {locations.length === 0 ? (
          <p className="empty-message">No hay ubicaciones registradas</p>
        ) : (
          <div className="config-items">
            {locations.map((location) => (
              <div key={location.id} className="config-item">
                <div className="config-item-info">
                  <h4>{location.name}</h4>
                  {location.description && <p>{location.description}</p>}
                </div>
                <div className="config-item-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(location)}
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(location.id, location.name)}
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationsManager;
