# Guía de Instalación - Servidor Windows 10 Pro

Esta guía te ayudará a instalar el Sistema de Inventario Cielo en un servidor Windows 10 Pro que actuará como servidor permanente de la empresa.

---

## Requisitos Previos

### 1. Instalación de Node.js (v18 o superior)

1. Descarga Node.js desde: https://nodejs.org/
2. Descarga la versión LTS (recomendada para producción)
3. Ejecuta el instalador y sigue los pasos
4. Durante la instalación, asegúrate de marcar:
   - ✓ "Automatically install the necessary tools"
   - ✓ "Add to PATH"

**Verificar instalación:**
```cmd
node --version
npm --version
```

### 2. Instalación de PostgreSQL (v14 o superior)

1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador
3. Durante la instalación:
   - Anota la contraseña del usuario `postgres` (la necesitarás)
   - Puerto por defecto: `5432`
   - Asegúrate de instalar pgAdmin (herramienta de administración)

**Verificar instalación:**
```cmd
psql --version
```

### 3. Instalación de Git

1. Descarga Git desde: https://git-scm.com/download/win
2. Ejecuta el instalador con las opciones por defecto

**Verificar instalación:**
```cmd
git --version
```

---

## Paso 1: Clonar el Repositorio

Abre PowerShell o CMD como Administrador y navega a donde quieras instalar el proyecto (ej: `C:\inventarioCielo`):

```cmd
cd C:\
git clone https://github.com/skillparty/inventarioCielo.git
cd inventarioCielo
```

---

## Paso 2: Configurar la Base de Datos

### 2.1 Crear la Base de Datos

Abre pgAdmin o ejecuta desde CMD:

```cmd
psql -U postgres
```

Dentro de PostgreSQL, ejecuta:

```sql
CREATE DATABASE inventario_db;
\q
```

### 2.2 Ejecutar Migraciones

Desde la carpeta del proyecto:

```cmd
cd C:\inventarioCielo
psql -U postgres -d inventario_db -f src\backend\database\migrations\001_initial_schema.sql
psql -U postgres -d inventario_db -f src\backend\database\migrations\002_add_locations_responsibles.sql
psql -U postgres -d inventario_db -f src\backend\database\migrations\003_add_name_field.sql
```

**Nota:** Te pedirá la contraseña de PostgreSQL que configuraste en la instalación.

---

## Paso 3: Configurar Variables de Entorno

### 3.1 Configurar PostgreSQL

Edita el archivo `src/backend/database/db.js` y asegúrate de que tenga la configuración correcta:

```javascript
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inventario_db',
  user: 'postgres',
  password: 'TU_CONTRASEÑA_POSTGRESQL'
});
```

**IMPORTANTE:** Cambia `'TU_CONTRASEÑA_POSTGRESQL'` por la contraseña real que configuraste.

### 3.2 Configurar IP del Servidor

Necesitarás conocer la IP local del servidor. En CMD ejecuta:

```cmd
ipconfig
```

Busca la dirección IPv4 de tu red local (ej: `192.168.1.100`)

---

## Paso 4: Generar Certificados SSL

Abre PowerShell como Administrador en la carpeta del proyecto:

```powershell
cd C:\inventarioCielo

# Instalar OpenSSL (si no está instalado)
# Descarga desde: https://slproweb.com/products/Win32OpenSSL.html

# Generar certificados
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

Durante la generación, completa los datos solicitados. Para desarrollo local, puedes usar valores genéricos.

**Alternativa:** Si ya tienes los certificados en otra máquina, cópialos a la raíz del proyecto.

---

## Paso 5: Instalar Dependencias

```cmd
cd C:\inventarioCielo
npm install
```

Este proceso puede tardar varios minutos.

---

## Paso 6: Configurar el Firewall de Windows

Para que otros equipos de la red puedan acceder al servidor:

1. Abre "Panel de Control" > "Sistema y seguridad" > "Firewall de Windows Defender"
2. Click en "Configuración avanzada"
3. Click en "Reglas de entrada" > "Nueva regla"
4. Selecciona "Puerto" > "Siguiente"
5. Selecciona "TCP" e ingresa los puertos: `3000,5001`
6. Selecciona "Permitir la conexión" > "Siguiente"
7. Marca todas las opciones (Dominio, Privado, Público) > "Siguiente"
8. Nombre: "Inventario Cielo" > "Finalizar"

---

## Paso 7: Ejecutar el Sistema

### 7.1 Modo de Prueba (Manual)

Para probar que todo funciona, ejecuta:

```cmd
cd C:\inventarioCielo
npm start
```

Espera a ver los mensajes:
- "Servidor HTTPS escuchando en puerto 3000"
- "Backend API escuchando en puerto 5001"
- "Conectado a PostgreSQL"

### 7.2 Acceder desde el Navegador

En el servidor:
- https://localhost:3000

Desde otros equipos en la red:
- https://IP_DEL_SERVIDOR:3000
- Ejemplo: https://192.168.1.100:3000

**IMPORTANTE:** Como usamos certificados autofirmados, el navegador mostrará una advertencia de seguridad. Haz click en "Avanzado" > "Continuar al sitio" (esto es normal).

---

## Paso 8: Configurar Inicio Automático

Para que el servidor se inicie automáticamente cuando Windows arranque:

### Opción A: Usar PM2 (Recomendado)

1. Instalar PM2 globalmente:
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
```

2. Configurar inicio automático:
```cmd
cd C:\inventarioCielo
pm2 start npm --name "inventario-cielo" -- start
pm2 save
pm2-startup install
```

3. Verificar que está corriendo:
```cmd
pm2 list
pm2 logs inventario-cielo
```

### Opción B: Crear un Servicio de Windows (Alternativa)

1. Instalar `node-windows`:
```cmd
npm install -g node-windows
```

2. Crear archivo `install-service.js` en la raíz del proyecto:

```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'Inventario Cielo',
  description: 'Sistema de Gestión de Inventario',
  script: 'C:\\inventarioCielo\\src\\backend\\server.js',
  env: {
    name: "NODE_ENV",
    value: "production"
  }
});

svc.on('install', function(){
  svc.start();
  console.log('Servicio instalado y iniciado!');
});

svc.install();
```

3. Ejecutar:
```cmd
node install-service.js
```

---

## Paso 9: Configuración de Red

### 9.1 IP Estática (Recomendado)

Para que la IP del servidor no cambie:

1. Panel de Control > Red e Internet > Centro de redes y recursos compartidos
2. Click en tu conexión de red
3. Propiedades > Protocolo de Internet versión 4 (TCP/IPv4)
4. Selecciona "Usar la siguiente dirección IP"
5. Ingresa:
   - Dirección IP: La IP que quieres (ej: 192.168.1.100)
   - Máscara de subred: 255.255.255.0 (generalmente)
   - Puerta de enlace predeterminada: IP de tu router (ej: 192.168.1.1)
   - DNS preferido: 8.8.8.8 (Google DNS)

### 9.2 Configurar Nombre de Host (Opcional)

Para acceder mediante nombre en lugar de IP:

1. Abre CMD como Administrador
2. Edita el archivo hosts en cada cliente:
```cmd
notepad C:\Windows\System32\drivers\etc\hosts
```

3. Agrega la línea:
```
192.168.1.100   inventario-cielo.local
```

Ahora podrás acceder desde: https://inventario-cielo.local:3000

---

## Paso 10: Verificación Final

1. **Verifica que el servidor esté corriendo:**
```cmd
pm2 list
```

2. **Verifica que la base de datos tenga las tablas:**
```cmd
psql -U postgres -d inventario_db -c "\dt"
```

Deberías ver: `assets`, `locations`, `responsibles`

3. **Prueba desde un navegador:**
   - Servidor: https://localhost:3000
   - Cliente en la red: https://IP_DEL_SERVIDOR:3000

---

## Mantenimiento y Comandos Útiles

### Ver logs del servidor:
```cmd
pm2 logs inventario-cielo
```

### Reiniciar el servidor:
```cmd
pm2 restart inventario-cielo
```

### Detener el servidor:
```cmd
pm2 stop inventario-cielo
```

### Actualizar el código desde Git:
```cmd
cd C:\inventarioCielo
git pull origin main
npm install
pm2 restart inventario-cielo
```

### Backup de la base de datos:
```cmd
pg_dump -U postgres -d inventario_db > backup_inventario_%date%.sql
```

### Restaurar backup:
```cmd
psql -U postgres -d inventario_db < backup_inventario_FECHA.sql
```

---

## Solución de Problemas Comunes

### Error: "Puerto 3000 o 5001 ya en uso"

```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :5001
taskkill /PID <numero_proceso> /F
```

### Error: "No se puede conectar a PostgreSQL"

1. Verifica que PostgreSQL esté corriendo:
```cmd
sc query postgresql-x64-14
```

2. Si no está corriendo:
```cmd
net start postgresql-x64-14
```

### Error: "CORS / No se puede cargar desde otro dispositivo"

Verifica que el firewall permita los puertos 3000 y 5001.

### Certificado SSL no es confiable

Es normal con certificados autofirmados. En cada navegador:
- Chrome/Edge: "Avanzado" > "Continuar al sitio"
- Firefox: "Avanzado" > "Aceptar el riesgo"

---

## Acceso desde Celulares

1. Asegúrate de que el celular esté en la misma red WiFi
2. Abre el navegador y ve a: https://IP_DEL_SERVIDOR:3000
3. Acepta el certificado de seguridad
4. La cámara funcionará para escanear códigos QR

---

## Contacto y Soporte

Para dudas o problemas, consulta el archivo README.md del proyecto o contacta al equipo de desarrollo.

**Repositorio:** https://github.com/skillparty/inventarioCielo

---

Última actualización: Octubre 2025
