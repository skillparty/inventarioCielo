import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, X, Save, Mail, Phone } from 'lucide-react';
import { getResponsibles, createResponsible, updateResponsible, deleteResponsible } from '../services/api';
import './ConfigManager.css';

function ResponsiblesManager({ onBack }) {
  const [responsibles, setResponsibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    loadResponsibles();
  }, []);

  const loadResponsibles = async () => {
    try {
      setLoading(true);
      const response = await getResponsibles();
      setResponsibles(response.data);
    } catch (error) {
      console.error('Error al cargar responsables:', error);
      alert('Error al cargar responsables');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre del responsable es requerido');
      return;
    }

    try {
      if (editing) {
        await updateResponsible(editing.id, formData);
        alert('Responsable actualizado exitosamente');
      } else {
        await createResponsible(formData);
        alert('Responsable creado exitosamente');
      }
      
      setFormData({ name: '', email: '', phone: '' });
      setEditing(null);
      setShowForm(false);
      loadResponsibles();
    } catch (error) {
      console.error('Error al guardar responsable:', error);
      alert(error.response?.data?.message || 'Error al guardar responsable');
    }
  };

  const handleEdit = (responsible) => {
    setEditing(responsible);
    setFormData({
      name: responsible.name,
      email: responsible.email || '',
      phone: responsible.phone || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar al responsable "${name}"?`)) {
      return;
    }

    try {
      await deleteResponsible(id);
      alert('Responsable eliminado exitosamente');
      loadResponsibles();
    } catch (error) {
      console.error('Error al eliminar responsable:', error);
      alert(error.response?.data?.message || 'Error al eliminar responsable');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', email: '', phone: '' });
    setEditing(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="config-manager">
        <div className="loading">Cargando responsables...</div>
      </div>
    );
  }

  return (
    <div className="config-manager">
      <div className="config-header">
        <h2>
          <User size={24} />
          Gestión de Responsables
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
          Nuevo Responsable
        </button>
      </div>

      {showForm && (
        <div className="config-form">
          <h3>{editing ? 'Editar Responsable' : 'Nuevo Responsable'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Juan Pérez García"
                required
              />
            </div>

            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: +52 555 1234 5678"
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
        <h3>Responsables Registrados ({responsibles.length})</h3>
        {responsibles.length === 0 ? (
          <p className="empty-message">No hay responsables registrados</p>
        ) : (
          <div className="config-items">
            {responsibles.map((responsible) => (
              <div key={responsible.id} className="config-item">
                <div className="config-item-info">
                  <h4>{responsible.name}</h4>
                  {responsible.email && (
                    <p><Mail size={14} /> {responsible.email}</p>
                  )}
                  {responsible.phone && (
                    <p><Phone size={14} /> {responsible.phone}</p>
                  )}
                </div>
                <div className="config-item-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(responsible)}
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(responsible.id, responsible.name)}
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

export default ResponsiblesManager;
