#!/usr/bin/env node

/**
 * Script para resetear la base de datos
 * ADVERTENCIA: Esto eliminará TODOS los datos
 * 
 * Uso: node scripts/reset-database.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventario_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

async function resetDatabase() {
  try {
    console.log('\n🗑️  RESET DE BASE DE DATOS');
    console.log('================================\n');
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`🖥️  Host: ${process.env.DB_HOST}:${process.env.DB_PORT}\n`);
    console.log('⚠️  ADVERTENCIA: Esta operación eliminará TODOS los datos de la base de datos.');
    console.log('⚠️  Esta acción NO se puede deshacer.\n');

    // Pedir confirmación
    const answer = await new Promise((resolve) => {
      rl.question('¿Estás seguro de que deseas continuar? (escribe "SI" para confirmar): ', resolve);
    });

    if (answer.toUpperCase() !== 'SI') {
      console.log('\n❌ Operación cancelada.');
      rl.close();
      await pool.end();
      process.exit(0);
    }

    console.log('\n🔄 Eliminando tablas existentes...');

    // Drop tables
    await pool.query('DROP TABLE IF EXISTS assets CASCADE');
    console.log('  ✅ Tabla "assets" eliminada');

    console.log('\n🔄 Creando esquema nuevo...');

    // Leer y ejecutar schema
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('  ✅ Esquema creado exitosamente');

    // Verificar tablas creadas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verificar funciones
    const functionsResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);

    if (functionsResult.rows.length > 0) {
      console.log('\n🔧 Funciones creadas:');
      functionsResult.rows.forEach(row => {
        console.log(`  - ${row.routine_name}`);
      });
    }

    console.log('\n✅ ¡Base de datos reseteada exitosamente!');
    console.log('\n💡 Tip: Ejecuta "npm run db:seed" para insertar datos de prueba.\n');

  } catch (error) {
    console.error('\n❌ Error al resetear la base de datos:');
    console.error(error.message);
    if (error.hint) {
      console.error('💡 Sugerencia:', error.hint);
    }
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Ejecutar script
resetDatabase();
