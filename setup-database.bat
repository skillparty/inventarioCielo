@echo off
echo ============================================
echo  Configuracion de Base de Datos
echo  Inventario Cielo
echo ============================================
echo.

set /p DB_PASSWORD="Ingresa la password de PostgreSQL (usuario postgres): "

echo.
echo [1/4] Creando base de datos 'inventario_db'...
psql -U postgres -c "CREATE DATABASE inventario_db;" 2>nul
if %errorLevel% equ 0 (
    echo OK - Base de datos creada
) else (
    echo ADVERTENCIA - La base de datos puede ya existir, continuando...
)

echo.
echo [2/4] Ejecutando migracion inicial...
psql -U postgres -d inventario_db -f src\backend\database\migrations\001_initial_schema.sql
if %errorLevel% neq 0 (
    echo ERROR: Fallo la migracion inicial
    pause
    exit /b 1
)
echo OK - Migracion inicial completada

echo.
echo [3/4] Ejecutando migracion de ubicaciones y responsables...
psql -U postgres -d inventario_db -f src\backend\database\migrations\002_add_locations_responsibles.sql
if %errorLevel% neq 0 (
    echo ERROR: Fallo la migracion de ubicaciones y responsables
    pause
    exit /b 1
)
echo OK - Migracion de ubicaciones y responsables completada

echo.
echo [4/4] Ejecutando migracion de campo nombre...
psql -U postgres -d inventario_db -f src\backend\database\migrations\003_add_name_field.sql
if %errorLevel% neq 0 (
    echo ERROR: Fallo la migracion de campo nombre
    pause
    exit /b 1
)
echo OK - Migracion de campo nombre completada

echo.
echo ============================================
echo  Base de datos configurada correctamente!
echo ============================================
echo.
echo Tablas creadas:
psql -U postgres -d inventario_db -c "\dt"

echo.
echo IMPORTANTE: Ahora debes editar el archivo:
echo src/backend/database/db.js
echo.
echo Y cambiar la linea:
echo   password: 'TU_CONTRASEÑA_POSTGRESQL'
echo Por:
echo   password: '%DB_PASSWORD%'
echo.
pause
