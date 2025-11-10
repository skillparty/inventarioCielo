import React, { useState, useEffect, useRef } from 'react';
import { User, Plus, Edit2, Trash2, X, Save, Mail, Phone, Upload, Download } from 'lucide-react';
import { getResponsibles, createResponsible, updateResponsible, deleteResponsible, downloadResponsiblesTemplate, uploadBulkResponsibles } from '../services/api';
import './ConfigManager.css';

function ResponsiblesManager({ onBack }) {
  const [responsibles, setResponsibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleDownloadTemplate = () => {
    try {
      downloadResponsiblesTemplate();
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

    if (!window.confirm(`¿Procesar el archivo "${file.name}" para cargar responsables?`)) {
      return;
    }

    try {
      setUploading(true);
      const result = await uploadBulkResponsibles(file);
      
      let message = `✅ Proceso completado\n\n`;
      message += `📊 Total de filas: ${result.results.total}\n`;
      message += `✓ Responsables creados: ${result.results.created}\n`;
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
      loadResponsibles();
      
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

      {/* Sección de carga masiva */}
      <div className="bulk-upload-section" style={{ 
        backgroundColor: '#e0f2fe', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0369a1' }}>
          📦 Carga Masiva de Responsables
        </h3>
        <p style={{ marginBottom: '15px', fontSize: '14px' }}>
          Importa múltiples responsables desde un archivo Excel
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
