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
    'Categoría': 'Equipo de Cómputo',
    'Estado': 'Activo',
    'Responsable': 'Juan Pérez',
    'Ubicación': 'Oficina Principal',
    'Observación o nota': 'Intel i7 16GB RAM, pantalla 14 pulgadas',
    'Valor': '25000'
  },
  {
    'Nombre': 'Monitor LG 27"',
    'Categoría': 'Monitores',
    'Estado': 'Activo',
    'Responsable': 'María García',
    'Ubicación': 'Sala de Juntas',
    'Observación o nota': 'Monitor LED Full HD 1920x1080',
    'Valor': '5500'
  },
  {
    'Nombre': 'Teclado Logitech MX Keys',
    'Categoría': 'Periféricos',
    'Estado': 'Activo',
    'Responsable': 'Carlos López',
    'Ubicación': 'Área de Desarrollo',
    'Observación o nota': 'Teclado inalámbrico mecánico retroiluminado',
    'Valor': '2500'
  }
];

// Crear libro de trabajo
const workbook = XLSX.utils.book_new();

// Crear hoja con datos de ejemplo
const worksheet = XLSX.utils.json_to_sheet(templateData);

// Configurar ancho de columnas
worksheet['!cols'] = [
  { wch: 35 }, // Nombre
  { wch: 20 }, // Categoría
  { wch: 12 }, // Estado
  { wch: 25 }, // Responsable
  { wch: 25 }, // Ubicación
  { wch: 50 }, // Observación o nota
  { wch: 12 }  // Valor
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
console.log('3. Campos requeridos: Nombre, Responsable, Ubicación');
console.log('4. Campos opcionales: Categoría, Estado, Observación o nota, Valor');
console.log('5. El número de serie se generará automáticamente');
console.log('6. Sube el archivo completado en el sistema');
