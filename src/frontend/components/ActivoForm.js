import React, { useState, useEffect } from 'react';
import { Edit, Plus, AlertTriangle, CheckCircle, Download, List } from 'lucide-react';
import { getLocations, getResponsibles, getAssetNames, createAsset, updateAsset } from '../services/api';
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
    fecha: new Date().toISOString().split('T')[0], // Fecha actual
    asset_name_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [assetId, setAssetId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [assetNames, setAssetNames] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [previewName, setPreviewName] = useState('');

  useEffect(() => {
    loadDropdownData();
    if (activo) {
      console.log('📝 Cargando activo para editar:', activo);
      // Mapear campos del backend (description, location, responsible) al formulario
      const fechaActivo = activo.created_at ? new Date(activo.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setFormData({
        nombre: activo.name || '',
        descripcion: activo.description || '',
        categoria: activo.category || '',
        ubicacion: activo.location || '',
        estado: activo.status || 'Activo',
        numero_serie: activo.serial_number || '',
        valor: activo.value || '',
        responsable: activo.responsible || '',
        fecha: fechaActivo,
      });
      console.log('✅ FormData cargado para edición');
    }
  }, [activo]);

  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      const [locationsRes, responsiblesRes, assetNamesRes] = await Promise.all([
        getLocations(),
        getResponsibles(),
        getAssetNames()
      ]);
      setLocations(locationsRes.data || []);
      setResponsibles(responsiblesRes.data || []);
      setAssetNames(assetNamesRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos del formulario');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Si se está escribiendo en el campo nombre, verificar si coincide con un nombre predefinido
    if (name === 'nombre' && value && assetNames.length > 0) {
      const matchingAssetName = assetNames.find(an => an.name === value);
      if (matchingAssetName) {
        // Si coincide exactamente con un nombre de la lista, guardar el ID
        setFormData(prev => ({
          ...prev,
          nombre: value,
          asset_name_id: matchingAssetName.id
        }));
        setPreviewName(`${matchingAssetName.name} (${matchingAssetName.counter})`);
      } else {
        // Si no coincide, limpiar el asset_name_id
        setFormData(prev => ({
          ...prev,
          nombre: value,
          asset_name_id: ''
        }));
        setPreviewName('');
      }
    }
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
    if (!formData.descripcion.trim() || formData.descripcion.trim().length < 10) {
      alert('La descripción es obligatoria y debe tener al menos 10 caracteres');
      return;
    }

    if (!formData.responsable.trim()) {
      alert('Debe seleccionar un responsable');
      return;
    }

    if (!formData.ubicacion.trim()) {
      alert('Debe seleccionar una ubicación');
      return;
    }

    setLoading(true);

    try {
      if (activo) {
        // Actualizar - Mapear campos al formato del backend
        const dataToSend = {
          name: formData.nombre || null,
          description: formData.descripcion,
          responsible: formData.responsable,
          location: formData.ubicacion,
          category: formData.categoria || null,
          serial_number: formData.numero_serie,
          value: formData.valor ? parseFloat(formData.valor) : 0,
          status: formData.estado
        };
        
        const response = await updateAsset(activo.serial_number, dataToSend);
        alert(response.message || 'Activo actualizado exitosamente');
        onBack();
      } else {
        // Crear nuevo - El serial_number se genera automáticamente en el backend
        const dataToSend = {
          description: formData.descripcion,
          responsible: formData.responsable,
          location: formData.ubicacion,
          category: formData.categoria || null,
          value: formData.valor ? parseFloat(formData.valor) : 0,
          status: formData.estado
        };
        
        // Si seleccionó un nombre de la lista (tiene asset_name_id), usar el sistema incremental
        if (formData.asset_name_id) {
          dataToSend.asset_name_id = parseInt(formData.asset_name_id);
        } else if (formData.nombre) {
          // Si escribió un nombre personalizado
          dataToSend.name = formData.nombre;
        }
        
        const response = await createAsset(dataToSend);
        
        // El QR viene en response.qr.dataURL
        if (response.qr && response.qr.dataURL) {
          setQrImage(response.qr.dataURL);
          setAssetId(response.data.serial_number);
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
          asset_name_id: '',
        });
        setPreviewName('');
      }
    } catch (error) {
      console.error('Error al guardar activo:', error);
      alert(error.response?.data?.message || 'Error al guardar activo. Verifica los datos e intenta nuevamente.');
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

  if (loadingData) {
    return (
      <div className="activo-form">
        <div className="form-header">
          <button className="back-btn" onClick={onBack}>
            ← Volver
          </button>
          <h2>Cargando formulario...</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando ubicaciones y responsables...</p>
        </div>
      </div>
    );
  }

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
              <label htmlFor="nombre">
                Nombre del Activo
                {!activo && assetNames.length > 0 && (
                  <small style={{ color: '#666', fontSize: '12px', marginLeft: '8px', fontWeight: 'normal' }}>
                    (Escribe o selecciona de la lista)
                  </small>
                )}
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                list="asset-names-list"
                placeholder="Ej: Laptop Dell Latitude"
                autoComplete="off"
              />
              {!activo && assetNames.length > 0 && (
                <datalist id="asset-names-list">
                  {assetNames.map(assetName => (
                    <option key={assetName.id} value={assetName.name}>
                      Contador actual: {assetName.counter}
                    </option>
                  ))}
                </datalist>
              )}
              {previewName ? (
                <small style={{ color: '#27ae60', fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: '500' }}>
                  ✓ Se creará como: "{previewName}"
                </small>
              ) : (
                !activo && (
                  <small style={{ color: '#3498db', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                    💡 Tip: Si seleccionas un nombre de la lista, se generará automáticamente con numeración incremental
                  </small>
                )
              )}
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
              <label htmlFor="ubicacion">Ubicación *</label>
              <select
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar ubicación</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
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

            {activo && (
              <div className="form-group">
                <label htmlFor="numero_serie">Número de Serie</label>
                <input
                  type="text"
                  id="numero_serie"
                  name="numero_serie"
                  value={formData.numero_serie}
                  onChange={handleChange}
                  placeholder="Número de serie"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>El número de serie no se puede modificar</small>
              </div>
            )}
            {!activo && (
              <div className="form-group">
                <label htmlFor="numero_serie_info">Número de Serie</label>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '8px',
                  border: '2px solid #90caf9',
                  color: '#1976d2'
                }}>
                  <strong>ℹ️ Se generará automáticamente</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                    El número de serie se asignará automáticamente al guardar el activo (formato: ABC1234)
                  </p>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fecha">Fecha de Registro</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                readOnly={!activo}
                style={{ backgroundColor: activo ? 'white' : '#f5f5f5' }}
              />
              {!activo && <small style={{ color: '#666', fontSize: '12px' }}>La fecha se registra automáticamente</small>}
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
              <label htmlFor="responsable">Responsable *</label>
              <select
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar responsable</option>
                {responsibles.map(resp => (
                  <option key={resp.id} value={resp.name}>{resp.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="descripcion">Descripción *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción detallada del activo"
                rows="4"
                required
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
