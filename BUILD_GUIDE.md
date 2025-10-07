# Guía de Build y Deployment

## ✅ Build Exitoso

El sistema se ha compilado correctamente y está listo para producción.

## 📦 Contenido del Build

### Frontend Build
```
build/
├── static/
│   ├── js/
│   │   └── main.1298ca17.js (173.02 KB gzipped)
│   └── css/
│       └── main.8c8cab85.css (3.39 KB gzipped)
├── index.html
└── asset-manifest.json
```

### Tamaño Total
- **JavaScript:** 173.02 KB (gzipped)
- **CSS:** 3.39 KB (gzipped)
- **Total:** ~176 KB (muy optimizado)

## 🚀 Comandos de Build

### Build Web (Producción)
```bash
npm run build
```

Genera carpeta `build/` lista para deploy en cualquier servidor web.

### Build Electron (Aplicación de Escritorio)
```bash
npm run build:win    # Windows installer (64-bit)
npm run build:mac    # macOS DMG (si está en Mac)
npm run build:linux  # Linux AppImage/deb
```

### Desarrollo
```bash
npm start            # Inicia todo: React + Express + Electron
npm run dev          # Alias de start
```

## 📱 Instaladores Generados

### Windows
```
dist/
└── Inventario Cielo Setup 1.0.0.exe
```

**Características:**
- Instalador NSIS
- Arquitectura: x64
- Auto-actualización preparada
- Accesos directos automáticos (Escritorio y Menú Inicio)

### Tamaño aproximado
- **Instalador Windows:** ~100-150 MB (incluye Electron + Node)

## 🌐 Deployment Web

### Opción 1: Servidor Estático
```bash
npm install -g serve
serve -s build -p 3000
```

### Opción 2: Nginx
```nginx
server {
    listen 80;
    server_name inventario.tudominio.com;
    root /path/to/inventarioCielo/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opción 3: Apache
```apache
<VirtualHost *:80>
    ServerName inventario.tudominio.com
    DocumentRoot /path/to/inventarioCielo/build

    <Directory /path/to/inventarioCielo/build>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api
</VirtualHost>
```

## 🐳 Deployment con Docker

### Dockerfile
```dockerfile
# Stage 1: Build React
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/frontend ./src/frontend
COPY public ./public
RUN npm run build

# Stage 2: Producción
FROM node:18-alpine
WORKDIR /app

# Backend dependencies
COPY package*.json ./
RUN npm ci --only=production

# Backend code
COPY src/backend ./src/backend
COPY electron.js ./
COPY .env.example ./.env

# Frontend build
COPY --from=frontend-build /app/build ./build

# PostgreSQL client (para backups)
RUN apk add --no-cache postgresql-client

EXPOSE 5000

CMD ["node", "src/backend/server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: inventario_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: tu_password_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build: .
    depends_on:
      - db
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: inventario_db
      DB_USER: postgres
      DB_PASSWORD: tu_password_segura
      BACKEND_PORT: 5000
      NODE_ENV: production
    ports:
      - "5000:5000"
    volumes:
      - ./backups:/app/backups
      - ./public/qr_codes:/app/public/qr_codes
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    depends_on:
      - backend
    ports:
      - "80:80"
    volumes:
      - ./build:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🔧 Variables de Entorno (Producción)

Crear `.env.production`:

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventario_db
DB_USER=postgres
DB_PASSWORD=tu_password_segura_aqui

# Backend
BACKEND_PORT=5000
NODE_ENV=production

# Frontend (opcional, si usas variables de entorno)
REACT_APP_API_URL=https://api.tudominio.com
```

## 📋 Checklist Pre-Deploy

### Backend
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos creada con schema
- [ ] Variables de entorno configuradas
- [ ] Puerto 5000 disponible
- [ ] `pg_dump` disponible (para backups)

### Frontend
- [ ] Build generado (`npm run build`)
- [ ] Configurar API URL si es diferente
- [ ] CORS configurado correctamente en backend

### Electron (Aplicación de Escritorio)
- [ ] Build exitoso
- [ ] Probado en sistema objetivo (Windows/Mac/Linux)
- [ ] Iconos correctos
- [ ] Auto-actualización configurada (opcional)

## 🔍 Verificación Post-Deploy

### 1. Verificar Backend
```bash
curl http://localhost:5000/api/health
```

Respuesta esperada:
```json
{
  "success": true,
  "status": "ok",
  "message": "Backend funcionando correctamente",
  "environment": "production",
  "timestamp": "2025-10-07T20:34:00.000Z"
}
```

### 2. Verificar Base de Datos
```bash
curl http://localhost:5000/api/db-test
```

### 3. Verificar Frontend
```bash
curl http://localhost:3000
# Debería retornar el HTML de la app
```

### 4. Test Completo
```bash
# Crear activo
curl -X POST http://localhost:5000/api/assets \
  -H "Content-Type: application/json" \
  -d '{"description":"Test","responsible":"Admin","location":"Oficina"}'

# Listar activos
curl http://localhost:5000/api/assets

# Exportar CSV
curl http://localhost:5000/api/assets/export/csv -o test.csv

# Crear backup
curl -X POST http://localhost:5000/api/db-backup
```

## 📊 Monitoreo

### Logs Backend
```bash
# Si usa PM2
pm2 logs backend

# Si usa systemd
journalctl -u inventario-backend -f

# Docker
docker-compose logs -f backend
```

### Métricas
- Tiempo de respuesta de API
- Uso de CPU/memoria
- Conexiones a base de datos
- Tamaño de backups
- Espacio en disco para QR codes

## 🔐 Seguridad en Producción

### Recomendaciones
1. **Base de Datos:**
   - Usar contraseñas fuertes
   - Restringir acceso a localhost
   - Backups automáticos diarios
   - Encriptar backups

2. **Backend:**
   - HTTPS obligatorio (SSL/TLS)
   - Rate limiting
   - Validación de inputs
   - CORS configurado correctamente

3. **Frontend:**
   - Served con HTTPS
   - Content Security Policy
   - Sanitizar inputs del usuario

4. **Electron:**
   - Firmar instaladores
   - Code signing certificate
   - Auto-actualización segura (HTTPS)

## 🚨 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar PostgreSQL
pg_isready -h localhost -p 5432

# Verificar credenciales
psql -U postgres -d inventario_db
```

### Error: "Port 5000 already in use"
```bash
# Encontrar proceso
lsof -i :5000

# Matar proceso
kill -9 <PID>
```

### Error: "Build failed"
```bash
# Limpiar cache
rm -rf node_modules
rm package-lock.json
npm install

# Limpiar build
rm -rf build
npm run build
```

### Electron no inicia
```bash
# Reconstruir electron
npm run postinstall

# Verificar electron
npm list electron
```

## 📦 Actualizar Versión

1. **Actualizar package.json:**
```json
{
  "version": "1.1.0"
}
```

2. **Commit cambios:**
```bash
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

3. **Build nueva versión:**
```bash
npm run build
npm run build:win
```

## 🎯 Próximos Pasos

- [ ] Configurar auto-actualización (electron-updater)
- [ ] Implementar analytics
- [ ] Agregar pruebas automatizadas
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo con Sentry/Datadog
- [ ] CDN para assets estáticos

---

**Sistema de Inventario Cielo v1.0.0**  
Build y deployment completado ✅
