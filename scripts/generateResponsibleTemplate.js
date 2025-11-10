/**
 * Script para generar plantilla Excel de responsables
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Crear directorio de plantillas si no existe
const templatesDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Datos de ejemplo para la plantilla
const ejemplos = [
  {
    'Nombre': 'Juan Pérez',
    'Email': 'juan.perez@empresa.com',
    'Teléfono': '+51 987654321'
  },
  {
    'Nombre': 'María García',
    'Email': 'maria.garcia@empresa.com',
    'Teléfono': '+51 912345678'
  },
  {
    'Nombre': 'Carlos López',
    'Email': 'carlos.lopez@empresa.com',
    'Teléfono': '+51 998765432'
  }
];

// Crear workbook
const workbook = XLSX.utils.book_new();

// Crear worksheet con los ejemplos
const worksheet = XLSX.utils.json_to_sheet(ejemplos);

// Ajustar ancho de columnas
worksheet['!cols'] = [
  { wch: 25 },  // Nombre
  { wch: 35 },  // Email
  { wch: 20 }   // Teléfono
];

// Agregar worksheet al workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Responsables');

// Guardar archivo
const outputPath = path.join(templatesDir, 'plantilla_responsables.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ Plantilla de responsables generada exitosamente');
console.log(`📁 Ubicación: ${outputPath}`);
console.log('');
console.log('📋 Columnas:');
console.log('  - Nombre (Requerido)');
console.log('  - Email (Opcional)');
console.log('  - Teléfono (Opcional)');
console.log('');
console.log('💡 La plantilla incluye 3 ejemplos que puedes eliminar o modificar');
