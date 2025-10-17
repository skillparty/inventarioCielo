import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../services/api';
import './ConfigManager.css';

function LocationsManager({ onBack }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

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
