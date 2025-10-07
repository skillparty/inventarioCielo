# 📦 Inventario Cielo

Sistema de gestión de inventario de activos desarrollado con Electron, React, Express y PostgreSQL.

## 🚀 Características

- ✅ Gestión completa de activos (CRUD)
- 📱 Generación automática de códigos QR
- 📷 Escaneo de códigos QR con cámara
- 💾 Base de datos PostgreSQL local
- 🖥️ Aplicación desktop multiplataforma (Windows, macOS, Linux)
- 🎨 Interfaz moderna y responsiva
- 📊 Dashboard con estadísticas en tiempo real

## 🛠️ Stack Tecnológico

### Frontend
- React 18.2
- HTML5 + CSS3
- Axios (peticiones HTTP)
- html5-qrcode (escaneo QR)

### Backend
- Node.js
- Express 4.18
- PostgreSQL (pg client)
- QRCode (generación QR)

### Desktop
- Electron 27
- Electron Builder (empaquetado)

## 📋 Requisitos Previos

1. **Node.js** (versión 16 o superior)
   ```bash
   node --version
   ```

2. **PostgreSQL** (versión 12 o superior)
   ```bash
   psql --version
   ```

3. **Git** (opcional, para clonar el repositorio)

## 🔧 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar PostgreSQL

#### Opción A: Instalación nueva de PostgreSQL

**macOS (con Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
- Descargar desde: https://www.postgresql.org/download/windows/
- Ejecutar el instalador
- Configurar contraseña para usuario `postgres`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Opción B: Crear la base de datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Dentro de psql:
CREATE DATABASE inventario_db;
\q
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de PostgreSQL:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventario_db
DB_USER=postgres
DB_PASSWORD=tu_password_aqui

BACKEND_PORT=5000

REACT_APP_API_URL=http://localhost:5000
```

### 4. Crear esquema de base de datos

```bash
# Ejecutar el schema completo
psql -U postgres -d inventario_db -f src/database/schema.sql

# O solo la migración inicial
psql -U postgres -d inventario_db -f src/database/migrations/001_initial_setup.sql
```

### 5. (Opcional) Insertar datos de prueba

```bash
psql -U postgres -d inventario_db -f src/database/seed.sql
```

## 🚀 Uso

### Modo Desarrollo

Inicia todos los servicios (Backend + Frontend + Electron) simultáneamente:

```bash
npm start
```

Este comando ejecutará:
1. **Backend** (Express) en http://localhost:5000
2. **Frontend** (React) en http://localhost:3000
3. **Electron** (Desktop app)

### Iniciar servicios individualmente

Si prefieres iniciar cada servicio por separado:

```bash
# Terminal 1: Backend
npm run start:backend

# Terminal 2: Frontend
npm run start:frontend

# Terminal 3: Electron (espera a que frontend esté listo)
npm run start:electron
```

### Compilar para Producción

```bash
# Build del frontend React
npm run build

# Build de la aplicación Electron
npm run build:electron
```

Los archivos compilados estarán en la carpeta `dist/`.

## 📁 Estructura del Proyecto

```
inventarioCielo/
├── src/
│   ├── frontend/              # Código React
│   │   ├── components/        # Componentes React
│   │   │   ├── Dashboard.js
│   │   │   ├── ActivosList.js
│   │   │   ├── ActivoForm.js
│   │   │   └── QRScanner.js
│   │   ├── services/          # Servicios API
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── backend/               # Código Express
│   │   ├── database/          # Conexión DB
│   │   │   └── db.js
│   │   ├── routes/            # Rutas API
│   │   │   └── activos.js
│   │   └── server.js
│   └── database/              # Scripts SQL
│       ├── schema.sql         # Schema completo
│       ├── seed.sql           # Datos de prueba
│       └── migrations/        # Migraciones
│           └── 001_initial_setup.sql
├── public/                    # Assets estáticos
│   ├── index.html
│   └── manifest.json
├── electron.js                # Proceso principal Electron
├── package.json
├── .env                       # Variables de entorno (no incluir en git)
├── .env.example               # Ejemplo de variables
├── .gitignore
└── README.md
```

## 🌐 API Endpoints

### Activos

- `GET /api/activos` - Obtener todos los activos
- `GET /api/activos/:id` - Obtener activo por ID
- `GET /api/activos/qr/:codigo_qr` - Buscar activo por código QR
- `POST /api/activos` - Crear nuevo activo
- `PUT /api/activos/:id` - Actualizar activo
- `DELETE /api/activos/:id` - Eliminar activo
- `GET /api/activos/:id/qr` - Generar código QR de un activo

### Sistema

- `GET /api/health` - Estado del backend
- `GET /api/db-test` - Probar conexión a base de datos

### Ejemplo de uso con curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Obtener todos los activos
curl http://localhost:5000/api/activos

# Crear nuevo activo
curl -X POST http://localhost:5000/api/activos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Laptop HP",
    "descripcion": "Laptop empresarial",
    "categoria": "Equipos de Cómputo",
    "ubicacion": "Oficina Principal",
    "estado": "Activo",
    "numero_serie": "HP-001",
    "valor": 15000,
    "responsable": "Juan Pérez"
  }'
```

## 🗃️ Base de Datos

### Tabla: activos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | ID único (autoincremental) |
| nombre | VARCHAR(255) | Nombre del activo |
| descripcion | TEXT | Descripción detallada |
| categoria | VARCHAR(100) | Categoría del activo |
| ubicacion | VARCHAR(255) | Ubicación física |
| estado | VARCHAR(50) | Estado: Activo, Inactivo, Mantenimiento |
| numero_serie | VARCHAR(100) | Número de serie único |
| valor | DECIMAL(10,2) | Valor monetario |
| responsable | VARCHAR(255) | Persona responsable |
| codigo_qr | VARCHAR(255) | Código QR único |
| fecha_registro | TIMESTAMP | Fecha de creación |
| fecha_actualizacion | TIMESTAMP | Última actualización |

### Categorías predefinidas:
- Equipos de Cómputo
- Mobiliario
- Electrónica
- Vehículos
- Herramientas
- Otros

### Estados de activos:
- Activo
- Inactivo
- Mantenimiento
- Dado de Baja

## 🔐 Seguridad

- Las credenciales de base de datos deben estar en `.env` (nunca en el código)
- El archivo `.env` está incluido en `.gitignore`
- Para producción, considera usar variables de entorno del sistema

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

1. Verifica que PostgreSQL esté ejecutándose:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Windows
   pg_ctl status
   ```

2. Verifica las credenciales en `.env`

3. Intenta conectar manualmente:
   ```bash
   psql -U postgres -d inventario_db
   ```

### Error: "Port 3000 already in use"

Mata el proceso usando el puerto:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: "Module not found"

Reinstala las dependencias:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error con Electron en macOS

Si aparece "App can't be opened because it is from an unidentified developer":
```bash
xattr -cr dist/mac/Inventario\ Cielo.app
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia todo (backend + frontend + electron) |
| `npm run start:backend` | Solo backend Express |
| `npm run start:frontend` | Solo frontend React |
| `npm run start:electron` | Solo Electron |
| `npm run build` | Build React para producción |
| `npm run build:electron` | Build app Electron |

## 🎯 Próximas Mejoras

- [ ] Autenticación de usuarios
- [ ] Exportar reportes a PDF/Excel
- [ ] Historial de movimientos de activos
- [ ] Notificaciones de mantenimiento
- [ ] Integración con impresora de etiquetas
- [ ] Modo offline con sincronización
- [ ] Dashboard con gráficas avanzadas
- [ ] Importación masiva desde CSV

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

ISC License

## 💡 Soporte

Si encuentras algún problema o tienes preguntas:
1. Revisa la sección de **Solución de Problemas**
2. Verifica que todos los servicios estén ejecutándose
3. Revisa los logs de consola para errores específicos

## 🙏 Agradecimientos

Desarrollado con ❤️ usando tecnologías open source.

---

**¡Feliz gestión de inventario! 📦✨**
