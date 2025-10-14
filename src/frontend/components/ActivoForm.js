import React, { useState, useEffect } from 'react';
import { Edit, Plus, AlertTriangle, CheckCircle, Download, List } from 'lucide-react';
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
  const [assetId, setAssetId] = useState(null);

  useEffect(() => {
    if (activo) {
      // Mapear campos del backend (description, location, responsible) al formulario
      setFormData({
        nombre: activo.asset_id || '',
        descripcion: activo.description || '',
        categoria: '',
        ubicacion: activo.location || '',
        estado: 'Activo',
        numero_serie: '',
        valor: '',
        responsable: activo.responsible || '',
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

  const handleDownloadQR = () => {
    if (qrImage && assetId) {
      const link = document.createElement('a');
      link.href = qrImage;
      link.download = `QR_${assetId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones del frontend
    if (!formData.numero_serie.trim() || formData.numero_serie.trim().length < 3) {
      alert('El número de serie es OBLIGATORIO y debe tener al menos 3 caracteres');
      return;
    }

    if (!formData.descripcion.trim() || formData.descripcion.trim().length < 10) {
      alert('La descripción es obligatoria y debe tener al menos 10 caracteres');
      return;
    }

    if (!formData.responsable.trim() || formData.responsable.trim().length < 3) {
      alert('El responsable es obligatorio y debe tener al menos 3 caracteres');
      return;
    }

    if (!formData.ubicacion.trim() || formData.ubicacion.trim().length < 3) {
      alert('La ubicación es obligatoria y debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);

    try {
      if (activo) {
        // Actualizar - Mapear campos al formato del backend
        const dataToSend = {
          description: formData.descripcion,
          responsible: formData.responsable,
          location: formData.ubicacion,
          category: formData.categoria || null,
          serial_number: formData.numero_serie || null,
          value: formData.valor ? parseFloat(formData.valor) : 0
        };
        
        const fetchResponse = await fetch(`/api/assets/${activo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });
        
        const response = await fetchResponse.json();
        alert(response.message || 'Activo actualizado exitosamente');
        onBack();
      } else {
        // Crear nuevo - Mapear campos al formato del backend
        const dataToSend = {
          serial_number: formData.numero_serie, // OBLIGATORIO - PRIMARY KEY
          description: formData.descripcion,
          responsible: formData.responsable,
          location: formData.ubicacion,
          category: formData.categoria || null,
          value: formData.valor ? parseFloat(formData.valor) : 0
        };
        
        const fetchResponse = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });
        
        const response = await fetchResponse.json();
        
        // El QR viene en response.qr.dataURL
        if (response.qr && response.qr.dataURL) {
          setQrImage(response.qr.dataURL);
          setAssetId(response.data.serial_number); // Usar serial_number como identificador
        }
        
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
        <h2>{activo ? <><Edit size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Editar Activo</> : <><Plus size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Nuevo Activo</>}</h2>
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
          <div className="qr-result" style={{
            marginTop: '30px',
            padding: '30px',
            backgroundColor: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#16a34a', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><CheckCircle size={24} />Activo creado exitosamente</h3>
            <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#2563eb' }}>
              {assetId}
            </p>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Código QR generado - Descárgalo para imprimir y pegar en el activo físico
            </p>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'inline-block'
            }}>
              <img 
                src={qrImage} 
                alt="QR Code" 
                style={{ 
                  maxWidth: '300px',
                  border: '2px solid #ddd',
                  borderRadius: '8px'
                }} 
              />
            </div>
            <div className="qr-actions" style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={handleDownloadQR} 
                className="btn-submit"
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                <Download size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Descargar QR
              </button>
              <button 
                onClick={() => {
                  setQrImage(null);
                  setAssetId(null);
                }} 
                className="btn-new"
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Crear Otro Activo
              </button>
              <button 
                onClick={onBack} 
                className="btn-done"
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                <List size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Ver Listado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivoForm;
