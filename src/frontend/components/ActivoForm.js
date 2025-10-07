import React, { useState, useEffect } from 'react';
import { createAsset, updateAsset } from '../services/api';
import './ActivoForm.css';

function ActivoForm({ activo, onBack }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    ubicacion: '',
    estado: 'Activo',
    numero_serie: '',
    valor: '',
    responsable: '',
  });
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    if (activo) {
      setFormData({
        nombre: activo.nombre || '',
        descripcion: activo.descripcion || '',
        categoria: activo.categoria || '',
        ubicacion: activo.ubicacion || '',
        estado: activo.estado || 'Activo',
        numero_serie: activo.numero_serie || '',
        valor: activo.valor || '',
        responsable: activo.responsable || '',
      });
    }
  }, [activo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      alert('El nombre del activo es obligatorio');
      return;
    }

    setLoading(true);

    try {
      if (activo) {
        // Actualizar
        const response = await updateAsset(activo.id, formData);
        alert(response.message || 'Activo actualizado exitosamente');
        onBack();
      } else {
        // Crear nuevo
        const response = await createAsset(formData);
        setQrImage(response.qrImage);
        alert(response.message || 'Activo creado exitosamente');
        
        // Resetear formulario
        setFormData({
          nombre: '',
          descripcion: '',
          categoria: '',
          ubicacion: '',
          estado: 'Activo',
          numero_serie: '',
          valor: '',
          responsable: '',
        });
      }
    } catch (error) {
      console.error('Error al guardar activo:', error);
      alert('Error al guardar activo. Verifica los datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const categorias = [
    'Equipos de Cómputo',
    'Mobiliario',
    'Electrónica',
    'Vehículos',
    'Herramientas',
    'Otros'
  ];

  const ubicaciones = [
    'Oficina Principal',
    'Almacén',
    'Bodega',
    'Sucursal 1',
    'En Tránsito'
  ];

  const estados = [
    'Activo',
    'Inactivo',
    'Mantenimiento',
    'Dado de Baja'
  ];

  return (
    <div className="activo-form">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>
          ← Volver
        </button>
        <h2>{activo ? '✏️ Editar Activo' : '➕ Nuevo Activo'}</h2>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombre">Nombre del Activo *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Laptop Dell Latitude"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ubicacion">Ubicación</label>
              <select
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
              >
                <option value="">Seleccionar ubicación</option>
                {ubicaciones.map(ub => (
                  <option key={ub} value={ub}>{ub}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                {estados.map(est => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="numero_serie">Número de Serie</label>
              <input
                type="text"
                id="numero_serie"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="Ej: DL5420-001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="valor">Valor ($)</label>
              <input
                type="number"
                id="valor"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="responsable">Responsable</label>
              <input
                type="text"
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                placeholder="Nombre del responsable"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción detallada del activo"
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onBack} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Guardando...' : (activo ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>

        {qrImage && (
          <div className="qr-result">
            <h3>✅ Activo creado exitosamente</h3>
            <p>Código QR generado:</p>
            <img src={qrImage} alt="QR Code" />
            <div className="qr-actions">
              <button onClick={() => setQrImage(null)} className="btn-new">
                Crear Otro Activo
              </button>
              <button onClick={onBack} className="btn-done">
                Ver Listado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivoForm;
