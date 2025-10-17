@echo off
echo ============================================
echo  Instalador de Inventario Cielo
echo  Sistema de Gestion de Activos
echo ============================================
echo.

REM Verificar si se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    echo Haz clic derecho en el archivo y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor, descarga e instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js instalado

echo.
echo [2/6] Verificando PostgreSQL...
psql --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: PostgreSQL no esta instalado
    echo Por favor, descarga e instala PostgreSQL desde: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
echo OK - PostgreSQL instalado

echo.
echo [3/6] Instalando dependencias del proyecto...
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Fallo la instalacion de dependencias
    pause
    exit /b 1
)
echo OK - Dependencias instaladas

echo.
echo [4/6] Instalando PM2 para gestion de procesos...
call npm install -g pm2
call npm install -g pm2-windows-startup
if %errorLevel% neq 0 (
    echo ADVERTENCIA: No se pudo instalar PM2 globalmente
    echo Puedes ejecutar el servidor manualmente con: npm start
)
echo OK - PM2 instalado

echo.
echo [5/6] Verificando certificados SSL...
if not exist "cert.pem" (
    echo ADVERTENCIA: No se encontraron certificados SSL
    echo Se deben generar certificados SSL manualmente
    echo Consulta la guia de instalacion: INSTALACION_SERVIDOR_WINDOWS.md
)

echo.
echo [6/6] Configuracion de firewall...
echo Abriendo puertos 3000 y 5001 en el firewall...
netsh advfirewall firewall add rule name="Inventario Cielo - Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Inventario Cielo - Backend" dir=in action=allow protocol=TCP localport=5001
echo OK - Firewall configurado

echo.
echo ============================================
echo  Instalacion completada con exito!
echo ============================================
echo.
echo PROXIMOS PASOS:
echo 1. Configura la base de datos PostgreSQL (ver guia)
echo 2. Ejecuta las migraciones de base de datos
echo 3. Edita src/backend/database/db.js con tu password de PostgreSQL
echo 4. Genera certificados SSL si no los tienes
echo 5. Ejecuta: npm start (modo desarrollo)
echo    O ejecuta: pm2 start npm --name "inventario-cielo" -- start (modo produccion)
echo.
echo Para mas informacion, consulta: INSTALACION_SERVIDOR_WINDOWS.md
echo.
pause
