import React, { useState, useEffect } from 'react';
import { createAsset, updateAsset } from '../services/api';
import styles from './AssetForm.module.css';

const AssetForm = ({ assetToEdit, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    responsible: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [qrData, setQrData] = useState(null);

  // Si hay un activo para editar, cargar sus datos
  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        description: assetToEdit.description || '',
        responsible: assetToEdit.responsible || '',
        location: assetToEdit.location || '',
      });
    }
  }, [assetToEdit]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'La descripcion es obligatoria';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'La descripcion debe tener al menos 10 caracteres';
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = 'La descripcion no puede exceder 5000 caracteres';
    }

    if (!formData.responsible.trim()) {
      newErrors.responsible = 'El responsable es obligatorio';
    } else if (formData.responsible.trim().length < 3) {
      newErrors.responsible = 'El nombre del responsable debe tener al menos 3 caracteres';
    } else if (formData.responsible.trim().length > 255) {
      newErrors.responsible = 'El nombre del responsable no puede exceder 255 caracteres';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicacion es obligatoria';
    } else if (formData.location.trim().length < 3) {
      newErrors.location = 'La ubicacion debe tener al menos 3 caracteres';
    } else if (formData.location.trim().length > 255) {
      newErrors.location = 'La ubicacion no puede exceder 255 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Manejar submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    setQrData(null);

    try {
      let response;
      
      if (assetToEdit) {
        // Actualizar activo existente
        response = await updateAsset(assetToEdit.id, formData);
        setSuccessMessage(`Activo ${response.data.asset_id} actualizado exitosamente`);
      } else {
        // Crear nuevo activo
        response = await createAsset(formData);
        setSuccessMessage(`Activo ${response.data.asset_id} creado exitosamente`);
        
        // Guardar datos del QR si se genero
        if (response.qr) {
          setQrData({
            asset_id: response.data.asset_id,
            dataURL: response.qr.dataURL,
            filePath: response.qr.filePath,
          });
        }

        // Limpiar formulario
        setFormData({
          description: '',
          responsible: '',
          location: '',
        });
      }

      // Notificar exito
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(response.data);
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al guardar el activo';
      const errorDetails = err.response?.data?.errors;
      
      setErrorMessage(errorMsg);
      
      if (errorDetails && Array.isArray(errorDetails)) {
        const fieldErrors = {};
        errorDetails.forEach((error) => {
          if (error.includes('description')) fieldErrors.description = error;
          if (error.includes('responsible')) fieldErrors.responsible = error;
          if (error.includes('location')) fieldErrors.location = error;
        });
        setErrors(fieldErrors);
      }
      
      console.error('Error guardando activo:', err);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar formulario
  const handleReset = () => {
    setFormData({
      description: '',
      responsible: '',
      location: '',
    });
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
    setQrData(null);
  };

  // Descargar QR
  const handleDownloadQR = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData.dataURL;
    link.download = `${qrData.asset_id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{assetToEdit ? 'Editar Activo' : 'Crear Nuevo Activo'}</h2>
        {assetToEdit && (
          <span className={styles.assetId}>
            ID: {assetToEdit.asset_id}
          </span>
        )}
      </div>

      {successMessage && (
        <div className={styles.success}>
          <span>✓ {successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className={styles.error}>
          <span>⚠ {errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Campo Descripcion */}
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Descripcion *
            <span className={styles.charCount}>
              {formData.description.length}/5000
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ingrese una descripcion detallada del activo (marca, modelo, especificaciones, etc.)"
            className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
            rows="4"
            disabled={loading}
          />
          {errors.description && (
            <span className={styles.errorText}>{errors.description}</span>
          )}
        </div>

        {/* Campo Responsable */}
        <div className={styles.formGroup}>
          <label htmlFor="responsible" className={styles.label}>
            Responsable *
          </label>
          <input
            type="text"
            id="responsible"
            name="responsible"
            value={formData.responsible}
            onChange={handleChange}
            placeholder="Nombre completo del responsable"
            className={`${styles.input} ${errors.responsible ? styles.inputError : ''}`}
            disabled={loading}
          />
          {errors.responsible && (
            <span className={styles.errorText}>{errors.responsible}</span>
          )}
        </div>

        {/* Campo Ubicacion */}
        <div className={styles.formGroup}>
          <label htmlFor="location" className={styles.label}>
            Ubicacion *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Ubicacion fisica del activo (ej: Oficina Principal - Piso 2)"
            className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
            disabled={loading}
          />
          {errors.location && (
            <span className={styles.errorText}>{errors.location}</span>
          )}
        </div>

        {/* Nota sobre ID */}
        {!assetToEdit && (
          <div className={styles.note}>
            <strong>Nota:</strong> El ID del activo se generara automaticamente con el formato AST-YYYY-####
          </div>
        )}

        {/* Botones */}
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                {assetToEdit ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>{assetToEdit ? 'Actualizar Activo' : 'Crear Activo'}</>
            )}
          </button>

          {!assetToEdit && (
            <button
              type="button"
              onClick={handleReset}
              className={styles.btnReset}
              disabled={loading}
            >
              Limpiar
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.btnCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Mostrar QR generado */}
      {qrData && (
        <div className={styles.qrSection}>
          <h3>Codigo QR Generado</h3>
          <div className={styles.qrContainer}>
            <img src={qrData.dataURL} alt={`QR ${qrData.asset_id}`} className={styles.qrImage} />
            <div className={styles.qrInfo}>
              <p><strong>ID del Activo:</strong> {qrData.asset_id}</p>
              <p><strong>Archivo:</strong> {qrData.filePath}</p>
              <button
                type="button"
                onClick={handleDownloadQR}
                className={styles.btnDownload}
              >
                Descargar QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetForm;
