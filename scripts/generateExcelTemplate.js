/**
 * Generador de plantilla Excel para carga masiva de activos
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Estructura de la plantilla
const templateData = [
  {
    'Nombre': 'Laptop Dell Latitude 5420',
    'Descripción': 'Laptop corporativa Intel i7 16GB RAM',
    'Responsable': 'Juan Pérez',
    'Ubicación': 'Oficina Principal',
    'Categoría': 'Equipo de Cómputo',
    'Valor': '25000',
    'Estado': 'Activo'
  },
  {
    'Nombre': 'Monitor LG 27"',
    'Descripción': 'Monitor LED Full HD',
    'Responsable': 'María García',
    'Ubicación': 'Sala de Juntas',
    'Categoría': 'Monitores',
    'Valor': '5500',
    'Estado': 'Activo'
  },
  {
    'Nombre': 'Teclado Logitech MX Keys',
    'Descripción': 'Teclado inalámbrico mecánico',
    'Responsable': 'Carlos López',
    'Ubicación': 'Área de Desarrollo',
    'Categoría': 'Periféricos',
    'Valor': '2500',
    'Estado': 'Activo'
  }
];

// Crear libro de trabajo
const workbook = XLSX.utils.book_new();

// Crear hoja con datos de ejemplo
const worksheet = XLSX.utils.json_to_sheet(templateData);

// Configurar ancho de columnas
worksheet['!cols'] = [
  { wch: 30 }, // Nombre
  { wch: 40 }, // Descripción
  { wch: 25 }, // Responsable
  { wch: 25 }, // Ubicación
  { wch: 20 }, // Categoría
  { wch: 12 }, // Valor
  { wch: 10 }  // Estado
];

// Agregar hoja al libro
XLSX.utils.book_append_sheet(workbook, worksheet, 'Activos');

// Crear directorio public/templates si no existe
const templatesDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Guardar archivo
const outputPath = path.join(templatesDir, 'plantilla_activos.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Plantilla generada: ${outputPath}`);
console.log('');
console.log('📋 Instrucciones de uso:');
console.log('1. Descarga la plantilla desde el sistema');
console.log('2. Llena los datos de tus activos (puedes eliminar las filas de ejemplo)');
console.log('3. Campos requeridos: Nombre, Ubicación, Responsable');
console.log('4. El número de serie se generará automáticamente');
console.log('5. Sube el archivo completado en el sistema');
