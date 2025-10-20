@echo off
echo ================================================
echo    INVENTARIO CIELO - Iniciando Servidor
echo ================================================
echo.

cd /d "%~dp0"

:INICIO
echo [%date% %time%] Iniciando servidor...
node src\backend\server.js

echo.
echo [%date% %time%] El servidor se detuvo. Reiniciando en 5 segundos...
timeout /t 5 /nobreak > nul
goto INICIO
