# 🚀 Guía de Inicio Rápido

## Configuración en 5 pasos

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Crear base de datos PostgreSQL
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE inventario_db;
\q
```

### 3️⃣ Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` y configura tu contraseña de PostgreSQL:
```env
DB_PASSWORD=tu_password_aqui
```

### 4️⃣ Crear tablas
```bash
psql -U postgres -d inventario_db -f src/database/schema.sql
```

### 5️⃣ Iniciar aplicación
```bash
npm start
```

## ✅ Verificación

Si todo está correcto, verás:
- ✅ Backend corriendo en http://localhost:5000
- ✅ Frontend corriendo en http://localhost:3000
- ✅ Ventana de Electron se abrirá automáticamente

## 🆘 Ayuda Rápida

**Backend no conecta a la base de datos:**
- Verifica que PostgreSQL esté corriendo: `pg_isready`
- Revisa las credenciales en `.env`

**Error de puerto en uso:**
```bash
# Mata el proceso en el puerto 3000
lsof -ti:3000 | xargs kill -9
```

**Reinstalar dependencias:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

Para más detalles, consulta el [README.md](./README.md) completo.
