#!/usr/bin/env node

/**
 * Script para ejecutar migraciones de base de datos
 * Ejecuta todas las migraciones pendientes en orden
 * 
 * Uso: node scripts/migrate-database.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventario_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

const migrationsDir = path.join(__dirname, '../src/database/migrations');

/**
 * Crea la tabla de migraciones si no existe
 */
async function createMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Obtiene las migraciones ya ejecutadas
 */
async function getExecutedMigrations() {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

/**
 * Obtiene todas las migraciones disponibles
 */
function getAvailableMigrations() {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ordenar por nombre (001_, 002_, etc.)
}

/**
 * Ejecuta una migración
 */
async function executeMigration(migrationName) {
  const migrationPath = path.join(migrationsDir, migrationName);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Iniciar transacción
    await pool.query('BEGIN');

    // Ejecutar migración
    await pool.query(sql);

    // Registrar migración
    await pool.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [migrationName]
    );

    // Confirmar transacción
    await pool.query('COMMIT');

    return { success: true };
  } catch (error) {
    // Revertir transacción en caso de error
    await pool.query('ROLLBACK');
    return { success: false, error };
  }
}

/**
 * Script principal
 */
async function runMigrations() {
  try {
    console.log('\n🔄 MIGRACIONES DE BASE DE DATOS');
    console.log('================================\n');
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`🖥️  Host: ${process.env.DB_HOST}:${process.env.DB_PORT}\n`);

    // Crear tabla de migraciones
    await createMigrationsTable();
    console.log('✅ Tabla de migraciones verificada\n');

    // Obtener migraciones
    const executed = await getExecutedMigrations();
    const available = getAvailableMigrations();

    // Filtrar migraciones pendientes
    const pending = available.filter(name => !executed.includes(name));

    if (pending.length === 0) {
      console.log('✅ No hay migraciones pendientes.\n');
      
      if (executed.length > 0) {
        console.log('📋 Migraciones ejecutadas:');
        executed.forEach((name, index) => {
          console.log(`  ${index + 1}. ${name}`);
        });
        console.log();
      }
      
      return;
    }

    console.log(`📝 Se encontraron ${pending.length} migración(es) pendiente(s):\n`);
    pending.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    console.log();

    // Ejecutar migraciones pendientes
    let successCount = 0;
    let errorCount = 0;

    for (const migrationName of pending) {
      process.stdout.write(`🔄 Ejecutando: ${migrationName}... `);

      const result = await executeMigration(migrationName);

      if (result.success) {
        console.log('✅');
        successCount++;
      } else {
        console.log('❌');
        console.error(`   Error: ${result.error.message}`);
        if (result.error.hint) {
          console.error(`   Sugerencia: ${result.error.hint}`);
        }
        errorCount++;
        
        // Detener en el primer error
        console.log('\n⚠️  Se detuvo la ejecución debido a un error.\n');
        break;
      }
    }

    console.log();
    console.log('📊 Resumen:');
    console.log(`  Exitosas: ${successCount}`);
    if (errorCount > 0) {
      console.log(`  Fallidas: ${errorCount}`);
    }
    console.log(`  Total ejecutadas: ${executed.length + successCount}`);

    if (errorCount === 0 && successCount > 0) {
      console.log('\n✅ ¡Todas las migraciones se ejecutaron exitosamente!\n');
    }

    // Mostrar estado actual de la base de datos
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('📋 Tablas en la base de datos:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      console.log();
    }

  } catch (error) {
    console.error('\n❌ Error al ejecutar migraciones:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar script
runMigrations();
