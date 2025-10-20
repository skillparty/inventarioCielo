import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Save, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { getLocations, getResponsibles, getAssetNames, createAsset } from '../services/api';
import './ActivoForm.css';

function ActivoFormBatch({ onBack }) {
  const [carrito, setCarrito] = useState([]);
  const [formData, setFormData] = useState({
    responsable: '',
    ubicacion: '',
    categoria: '',
    estado: 'Activo',
    valor: '',
  });
  const [itemActual, setItemActual] = useState({
    nombre: '',
    descripcion: '',
    cantidad: 1,
    asset_name_id: '',
  });
  const [locations, setLocations] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [assetNames, setAssetNames] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [previewName, setPreviewName] = useState('');

  useEffect(() => {
    loadDropdownData();
  }, []);

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemActual(prev => ({ ...prev, [name]: value }));

    // Si está escribiendo en el campo nombre, verificar si coincide con un nombre predefinido
    if (name === 'nombre' && value && assetNames.length > 0) {
      const matchingAssetName = assetNames.find(an => an.name === value);
      if (matchingAssetName) {
        setItemActual(prev => ({
          ...prev,
          nombre: value,
          asset_name_id: matchingAssetName.id
        }));
        setPreviewName(`${matchingAssetName.name} (${matchingAssetName.counter}+)`);
      } else {
        setItemActual(prev => ({
          ...prev,
          nombre: value,
          asset_name_id: ''
        }));
        setPreviewName('');
      }
    }
  };

  const agregarAlCarrito = () => {
    // Validaciones
    if (!itemActual.nombre.trim()) {
      alert('Debe ingresar un nombre para el activo');
      return;
    }
    if (!itemActual.descripcion.trim() || itemActual.descripcion.trim().length < 10) {
      alert('La descripción es obligatoria y debe tener al menos 10 caracteres');
      return;
    }
    if (!itemActual.cantidad || itemActual.cantidad < 1) {
      alert('La cantidad debe ser al menos 1');
      return;
    }

    // Agregar al carrito
    const nuevoItem = {
      id: Date.now(), // ID temporal para poder eliminar del carrito
      ...itemActual,
      cantidad: parseInt(itemActual.cantidad)
    };

    setCarrito(prev => [...prev, nuevoItem]);

    // Limpiar formulario de item
    setItemActual({
      nombre: '',
      descripcion: '',
      cantidad: 1,
      asset_name_id: '',
    });
    setPreviewName('');
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const calcularTotalActivos = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones generales
    if (carrito.length === 0) {
      alert('Debe agregar al menos un activo al carrito');
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
      let activosCreados = 0;
      let errores = 0;

      // Crear cada item del carrito
      for (const item of carrito) {
        try {
          const dataToSend = {
            description: item.descripcion,
            responsible: formData.responsable,
            location: formData.ubicacion,
            category: formData.categoria || null,
            value: formData.valor ? parseFloat(formData.valor) : 0,
            status: formData.estado,
            quantity: item.cantidad
          };

          // Si seleccionó un nombre de la lista
          if (item.asset_name_id) {
            dataToSend.asset_name_id = parseInt(item.asset_name_id);
          } else if (item.nombre) {
            dataToSend.name = item.nombre;
          }

          await createAsset(dataToSend);
          activosCreados += item.cantidad;
        } catch (error) {
          console.error('Error al crear item:', error);
          errores++;
        }
      }

      if (errores === 0) {
        alert(`¡Éxito! Se crearon ${activosCreados} activos correctamente`);
        // Limpiar todo
        setCarrito([]);
        setFormData({
          responsable: '',
          ubicacion: '',
          categoria: '',
          estado: 'Activo',
          valor: '',
        });
        onBack();
      } else {
        alert(`Se crearon ${activosCreados} activos. ${errores} items tuvieron errores.`);
      }
    } catch (error) {
      console.error('Error al guardar activos:', error);
      alert('Error al guardar activos. Verifica los datos e intenta nuevamente.');
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

  if (loadingData) {
    return (
      <div className="activo-form">
        <div className="form-header">
          <button className="back-btn" onClick={onBack}>← Volver</button>
          <h2>Cargando formulario...</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activo-form">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <h2>
          <ShoppingCart size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Crear Múltiples Activos
        </h2>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Información General (compartida por todos los activos) */}
          <div style={{ 
            backgroundColor: '#e8f4f8', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            border: '2px solid #3498db'
          }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', fontSize: '18px' }}>
              Información General (para todos los activos)
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="responsable">Responsable *</label>
                <select
                  id="responsable"
                  name="responsable"
                  value={formData.responsable}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Seleccionar responsable</option>
                  {responsibles.map(resp => (
                    <option key={resp.id} value={resp.name}>{resp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ubicacion">Ubicación *</label>
                <select
                  id="ubicacion"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Seleccionar ubicación</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="categoria">Categoría</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleFormChange}
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleFormChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Dado de Baja">Dado de Baja</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="valor">Valor (Opcional)</label>
                <input
                  type="number"
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Agregar Items al Carrito */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            border: '2px solid #95a5a6'
          }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', fontSize: '18px' }}>
              <Plus size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Agregar Activo al Carrito
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nombre">Nombre del Activo *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={itemActual.nombre}
                  onChange={handleItemChange}
                  list="asset-names-list"
                  placeholder="Ej: Laptop Dell Latitude"
                  autoComplete="off"
                />
                <datalist id="asset-names-list">
                  {assetNames.map(assetName => (
                    <option key={assetName.id} value={assetName.name}>
                      Contador actual: {assetName.counter}
                    </option>
                  ))}
                </datalist>
                {previewName && (
                  <small style={{ color: '#27ae60', fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: '500' }}>
                    ✓ Se creará como: "{previewName}"
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="cantidad">Cantidad *</label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  value={itemActual.cantidad}
                  onChange={handleItemChange}
                  min="1"
                  max="50"
                  placeholder="1"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="descripcion">Descripción *</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={itemActual.descripcion}
                  onChange={handleItemChange}
                  placeholder="Descripción detallada del activo (mínimo 10 caracteres)"
                  rows="3"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd' }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={agregarAlCarrito}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px'
              }}
            >
              <Plus size={18} />
              Agregar al Carrito
            </button>
          </div>

          {/* Carrito */}
          {carrito.length > 0 && (
            <div style={{ 
              backgroundColor: '#fff', 
              padding: '20px', 
              borderRadius: '12px', 
              marginBottom: '24px',
              border: '2px solid #3498db'
            }}>
              <h3 style={{ marginTop: 0, color: '#2c3e50', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  <ShoppingCart size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Carrito ({carrito.length} tipos de activos, {calcularTotalActivos()} unidades totales)
                </span>
              </h3>
              
              <div style={{ marginTop: '16px' }}>
                {carrito.map((item) => (
                  <div 
                    key={item.id}
                    style={{
                      backgroundColor: '#f8f9fa',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: '#2c3e50', marginBottom: '4px' }}>
                        {item.nombre} 
                        <span style={{ 
                          backgroundColor: '#3498db', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          marginLeft: '8px',
                          fontWeight: '500'
                        }}>
                          x{item.cantidad}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {item.descripcion}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarDelCarrito(item.id)}
                      style={{
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onBack}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || carrito.length === 0}
            >
              {loading ? (
                'Creando activos...'
              ) : (
                <>
                  <Save size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Crear Todos los Activos ({calcularTotalActivos()})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActivoFormBatch;
