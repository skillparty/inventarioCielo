# Instrucciones de Instalacion - Inventario Cielo

## Requisitos del Sistema

### Software Necesario

**PostgreSQL 12 o superior**
- Windows: [Descargar PostgreSQL](https://www.postgresql.org/download/windows/)
- macOS: `brew install postgresql@15`
- Linux: `sudo apt-get install postgresql postgresql-contrib`

**Node.js 16 o superior**
- [Descargar Node.js](https://nodejs.org/)

## Instalacion para Desarrollo

### 1. Clonar Repositorio
```bash
git clone https://github.com/skillparty/inventarioCielo.git
cd inventarioCielo
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar PostgreSQL

**Crear base de datos:**
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE inventario_db;

# Salir
\q
```

**Ejecutar migraciones:**
```bash
# Opcion 1: Script completo de inicializacion
psql -U postgres -d inventario_db -f src/database/init.sql

# Opcion 2: Solo schema
psql -U postgres -d inventario_db -f src/database/schema.sql

# Opcion 3: Migracion inicial
psql -U postgres -d inventario_db -f src/database/migrations/001_initial_setup.sql

# Opcional: Datos de prueba
psql -U postgres -d inventario_db -f src/database/seed.sql
```

### 4. Configurar Variables de Entorno

Crear archivo `.env` en la raiz del proyecto:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventario_db
DB_USER=postgres
DB_PASSWORD=tu_password

# Backend
BACKEND_PORT=5000

# Frontend (React)
REACT_APP_API_URL=http://localhost:5000
```

### 5. Iniciar Aplicacion en Modo Desarrollo
```bash
npm start
```

Esto iniciara:
- Servidor Express (puerto 5000)
- React Dev Server (puerto 3000)
- Electron App

## Instalacion para Produccion

### 1. Build de la Aplicacion
```bash
npm run build
```

### 2. Generar Instalador

**Windows:**
```bash
npm run build:win
```
Resultado: `dist/Inventario Cielo Setup 1.0.0.exe`

**macOS:**
```bash
npm run build:mac
```
Resultado: `dist/Inventario Cielo-1.0.0.dmg`

**Linux:**
```bash
npm run build:linux
```
Resultado: 
- `dist/Inventario Cielo-1.0.0.AppImage`
- `dist/inventario-cielo_1.0.0_amd64.deb`
- `dist/inventario-cielo-1.0.0.x86_64.rpm`

### 3. Instalar en Usuario Final

**Windows:**
1. Ejecutar `Inventario Cielo Setup 1.0.0.exe`
2. Seguir el asistente de instalacion
3. Asegurar que PostgreSQL este instalado y corriendo
4. Iniciar la aplicacion desde el menu de inicio

**macOS:**
1. Abrir `Inventario Cielo-1.0.0.dmg`
2. Arrastrar a la carpeta Applications
3. Asegurar que PostgreSQL este corriendo
4. Abrir desde Applications

**Linux (Ubuntu/Debian):**
```bash
# AppImage (no requiere instalacion)
chmod +x Inventario\ Cielo-1.0.0.AppImage
./Inventario\ Cielo-1.0.0.AppImage

# O instalar .deb
sudo dpkg -i inventario-cielo_1.0.0_amd64.deb
```

## PostgreSQL Portable (Opcional para Windows)

Para usuarios sin permisos de administrador:

1. Descargar [PostgreSQL Portable](https://sourceforge.net/projects/pgsqlportable/)
2. Extraer en una carpeta
3. Iniciar PostgreSQL Portable
4. Configurar `.env` con la ruta correcta

## Verificacion de Instalacion

### Verificar PostgreSQL
```bash
psql --version
# Debe mostrar: psql (PostgreSQL) 15.x
```

### Verificar Conexion a Base de Datos
```bash
psql -U postgres -d inventario_db -c "SELECT COUNT(*) FROM assets;"
```

### Verificar Servidor Backend
```bash
curl http://localhost:5000/api/health
# Debe responder: {"success":true,"status":"ok",...}
```

## Troubleshooting

### Error: "No se puede conectar a PostgreSQL"

**Solucion:**
1. Verificar que PostgreSQL este corriendo:
   - Windows: Servicios > PostgreSQL
   - macOS/Linux: `sudo systemctl status postgresql`

2. Verificar credenciales en `.env`

3. Verificar puerto (por defecto 5432):
   ```bash
   netstat -an | grep 5432
   ```

### Error: "Puerto 5000 ya en uso"

**Solucion:**
1. Cambiar `BACKEND_PORT` en `.env` a otro puerto (ej: 5001)
2. Reiniciar aplicacion

### Error: "Tabla assets no existe"

**Solucion:**
```bash
psql -U postgres -d inventario_db -f src/database/schema.sql
```

### Error en Windows: "electron no reconocido"

**Solucion:**
```bash
npm install --save-dev electron
```

## Migraciones de Base de Datos

Para futuras actualizaciones del schema:

```bash
# Crear nueva migracion
# Archivo: src/database/migrations/002_nombre_migracion.sql

# Ejecutar migracion
psql -U postgres -d inventario_db -f src/database/migrations/002_nombre_migracion.sql
```

## Backup de Base de Datos

**Crear backup:**
```bash
pg_dump -U postgres inventario_db > backup_inventario_$(date +%Y%m%d).sql
```

**Restaurar backup:**
```bash
psql -U postgres -d inventario_db < backup_inventario_20250107.sql
```

## Logs y Depuracion

**Logs de Electron:**
- Windows: `%APPDATA%\inventario-cielo\logs`
- macOS: `~/Library/Logs/inventario-cielo`
- Linux: `~/.config/inventario-cielo/logs`

**Ver logs en desarrollo:**
```bash
# DevTools en Electron (Ctrl+Shift+I)
# Console del navegador muestra errores del frontend
# Terminal muestra errores del backend
```

## Actualizaciones

Para actualizar a una nueva version:

1. Cerrar aplicacion
2. Descargar nuevo instalador
3. Ejecutar instalador (sobrescribira version anterior)
4. La base de datos se mantiene intacta

## Desinstalacion

**Windows:**
1. Panel de Control > Programas > Desinstalar
2. Buscar "Inventario Cielo"
3. Desinstalar

**macOS:**
1. Arrastrar app a la Papelera desde Applications
2. Vaciar Papelera

**Linux:**
```bash
sudo dpkg -r inventario-cielo
```

**Datos de usuario:**
Los datos de PostgreSQL NO se eliminan automaticamente.
Para eliminar todo:
```bash
psql -U postgres -c "DROP DATABASE inventario_db;"
```

## Soporte

- Documentacion: Ver archivos README.md y guias en el repositorio
- Issues: https://github.com/skillparty/inventarioCielo/issues
- Email: zeuz_pochoclo@hotmail.com

---

**Version:** 1.0.0  
**Fecha:** 2025-10-07
