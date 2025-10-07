#!/usr/bin/env node

/**
 * Script para insertar datos de prueba en la base de datos
 * 
 * Uso: node scripts/seed-database.js [cantidad]
 * Ejemplo: node scripts/seed-database.js 50
 */

require('dotenv').config();
const { Pool } = require('pg');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventario_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

// Datos de ejemplo
const descriptions = [
  'Laptop Dell Latitude 7490',
  'Monitor Samsung 27"',
  'Mouse Logitech MX Master 3',
  'Teclado Mecánico Corsair K95',
  'Impresora HP LaserJet Pro',
  'Silla Ergonómica Herman Miller',
  'Escritorio Ajustable en Altura',
  'Tablet iPad Pro 12.9"',
  'Proyector Epson PowerLite',
  'Router Cisco Enterprise',
  'Switch TP-Link 24 Puertos',
  'Disco Duro Externo 2TB',
  'Webcam Logitech C920',
  'Audífonos Sony WH-1000XM4',
  'Celular iPhone 13 Pro',
  'MacBook Pro 16"',
  'Servidor Dell PowerEdge',
  'UPS APC 1500VA',
  'Scanner Canon ImageFormula',
  'Teléfono IP Cisco'
];

const responsibles = [
  'Juan Pérez',
  'María García',
  'Carlos Rodríguez',
  'Ana Martínez',
  'Luis Hernández',
  'Laura López',
  'Diego González',
  'Sofia Torres',
  'Miguel Sánchez',
  'Carmen Ramírez'
];

const locations = [
  'Oficina Principal',
  'Sala de Reuniones A',
  'Sala de Reuniones B',
  'Área de Desarrollo',
  'Área de Soporte',
  'Recepción',
  'Almacén',
  'Data Center',
  'Área de Ventas',
  'Recursos Humanos'
];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function generateQRCode(assetId) {
  try {
    const qrDir = path.join(__dirname, '../public/qr_codes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const fileName = `${assetId}.png`;
    const filePath = path.join(qrDir, fileName);

    await QRCode.toFile(filePath, assetId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return filePath;
  } catch (error) {
    console.error(`Error generando QR para ${assetId}:`, error.message);
    return null;
  }
}

async function seedDatabase() {
  try {
    // Obtener cantidad de registros a crear desde argumentos
    const count = parseInt(process.argv[2]) || 20;

    console.log('\n🌱 SEED DE BASE DE DATOS');
    console.log('================================\n');
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`🖥️  Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`📝 Registros a crear: ${count}\n`);

    // Verificar que la tabla existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assets'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ Error: La tabla "assets" no existe.');
      console.log('💡 Ejecuta primero: npm run db:reset\n');
      process.exit(1);
    }

    // Crear directorio para QR codes
    const qrDir = path.join(__dirname, '../public/qr_codes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
      console.log('📁 Directorio de QR codes creado');
    }

    console.log('🔄 Insertando datos de prueba...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < count; i++) {
      try {
        // Generar asset_id
        const assetIdResult = await pool.query('SELECT generate_next_asset_id() as asset_id');
        const assetId = assetIdResult.rows[0].asset_id;

        // Generar QR code
        const qrPath = await generateQRCode(assetId);

        // Datos aleatorios
        const description = randomElement(descriptions);
        const responsible = randomElement(responsibles);
        const location = randomElement(locations);

        // Insertar activo
        await pool.query(
          `INSERT INTO assets (asset_id, description, responsible, location, qr_code_path)
           VALUES ($1, $2, $3, $4, $5)`,
          [assetId, description, responsible, location, qrPath]
        );

        successCount++;
        process.stdout.write(`  ✅ ${assetId} - ${description.substring(0, 30)}...\r`);

      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error en registro ${i + 1}:`, error.message);
      }
    }

    console.log('\n');

    // Estadísticas
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT location) as locations,
        COUNT(DISTINCT responsible) as responsibles
      FROM assets
    `);

    const stats = statsResult.rows[0];

    console.log('📊 Estadísticas:');
    console.log(`  Total de activos: ${stats.total}`);
    console.log(`  Ubicaciones únicas: ${stats.locations}`);
    console.log(`  Responsables únicos: ${stats.responsibles}`);
    console.log(`  Exitosos: ${successCount}`);
    if (errorCount > 0) {
      console.log(`  Errores: ${errorCount}`);
    }

    // Mostrar algunos ejemplos
    const samplesResult = await pool.query(`
      SELECT asset_id, description, responsible, location 
      FROM assets 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('\n📋 Últimos activos creados:');
    samplesResult.rows.forEach(asset => {
      console.log(`  ${asset.asset_id} - ${asset.description}`);
      console.log(`    👤 ${asset.responsible} | 📍 ${asset.location}`);
    });

    console.log('\n✅ ¡Seed completado exitosamente!');
    console.log('\n💡 Tip: Ejecuta "npm start" para ver los datos en la aplicación.\n');

  } catch (error) {
    console.error('\n❌ Error al ejecutar seed:');
    console.error(error.message);
    if (error.hint) {
      console.error('💡 Sugerencia:', error.hint);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar script
seedDatabase();
