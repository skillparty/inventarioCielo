import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Save, Hash } from 'lucide-react';
import { getAssetNames, createAssetName, updateAssetName, deleteAssetName } from '../services/api';
import './ConfigManager.css';

function AssetNamesManager({ onBack }) {
  const [assetNames, setAssetNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadAssetNames();
  }, []);

  const loadAssetNames = async () => {
    try {
      setLoading(true);
      const response = await getAssetNames();
      setAssetNames(response.data);
    } catch (error) {
      console.error('Error al cargar nombres de activos:', error);
      alert('Error al cargar nombres de activos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre del activo es requerido');
      return;
    }

    try {
      if (editing) {
        await updateAssetName(editing.id, formData);
        alert('Nombre de activo actualizado exitosamente');
      } else {
        await createAssetName(formData);
        alert('Nombre de activo creado exitosamente');
      }
      
      setFormData({ name: '', description: '' });
      setEditing(null);
      setShowForm(false);
      loadAssetNames();
    } catch (error) {
      console.error('Error al guardar nombre de activo:', error);
      alert(error.response?.data?.message || 'Error al guardar nombre de activo');
    }
  };

  const handleEdit = (assetName) => {
    setEditing(assetName);
    setFormData({ name: assetName.name, description: assetName.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar el nombre de activo "${name}"?\n\nNOTA: No se puede eliminar si tiene activos asignados.`)) {
      return;
    }

    try {
      await deleteAssetName(id);
      alert('Nombre de activo eliminado exitosamente');
      loadAssetNames();
    } catch (error) {
      console.error('Error al eliminar nombre de activo:', error);
      alert(error.response?.data?.message || 'Error al eliminar nombre de activo');
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
        <div className="loading">Cargando nombres de activos...</div>
      </div>
    );
  }

  return (
    <div className="config-manager">
      <div className="config-header">
        <h2>
          <Tag size={24} />
          Gestión de Nombres de Activos
        </h2>
        <button className="btn-back" onClick={onBack}>
          <X size={20} /> Cerrar
        </button>
      </div>

      <div className="config-info-box">
        <p>
          <strong>ℹ️ ¿Cómo funciona?</strong><br />
          Los nombres de activos se utilizan para generar automáticamente nombres incrementales.
          Por ejemplo, si creas un activo con el nombre "Cepillo para botas", se generará automáticamente:
          <br />• Cepillo para botas (0)
          <br />• Cepillo para botas (1)
          <br />• Cepillo para botas (2)
          <br />...y así sucesivamente.
        </p>
      </div>

      <div className="config-actions">
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} />
          Nuevo Nombre de Activo
        </button>
      </div>

      {showForm && (
        <div className="config-form">
          <h3>{editing ? 'Editar Nombre de Activo' : 'Nuevo Nombre de Activo'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del activo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Cepillo para botas"
                required
              />
              <small className="form-help">
                Este será el nombre base. Los números se agregarán automáticamente al crear activos.
              </small>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional del tipo de activo"
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
        <h3>Nombres de Activos Registrados ({assetNames.length})</h3>
        {assetNames.length === 0 ? (
          <p className="empty-message">No hay nombres de activos registrados</p>
        ) : (
          <div className="config-items">
            {assetNames.map((assetName) => (
              <div key={assetName.id} className="config-item">
                <div className="config-item-info">
                  <h4>
                    {assetName.name}
                    <span className="counter-badge">
                      <Hash size={14} /> {assetName.counter} creados
                    </span>
                  </h4>
                  {assetName.description && <p>{assetName.description}</p>}
                </div>
                <div className="config-item-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(assetName)}
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(assetName.id, assetName.name)}
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

export default AssetNamesManager;
