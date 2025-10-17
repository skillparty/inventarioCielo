@echo off
echo ============================================
echo  Generador de Certificados SSL
echo  Inventario Cielo
echo ============================================
echo.

REM Verificar si OpenSSL esta instalado
where openssl >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: OpenSSL no esta instalado
    echo.
    echo Por favor, descarga e instala OpenSSL desde:
    echo https://slproweb.com/products/Win32OpenSSL.html
    echo.
    echo Despues de instalar, ejecuta este script de nuevo.
    pause
    exit /b 1
)

echo OpenSSL encontrado. Generando certificados...
echo.

REM Generar certificados SSL autofirmados
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/C=MX/ST=Estado/L=Ciudad/O=Inventario Cielo/OU=IT/CN=localhost"

if %errorLevel% neq 0 (
    echo ERROR: Fallo la generacion de certificados
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Certificados generados exitosamente!
echo ============================================
echo.
echo Archivos creados:
echo - key.pem (clave privada)
echo - cert.pem (certificado publico)
echo.
echo Estos certificados son validos por 365 dias
echo.
echo Ahora puedes ejecutar: npm start
echo.
pause
