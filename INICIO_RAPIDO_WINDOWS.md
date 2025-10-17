# Inicio Rápido - Windows 10 Pro

Guía de instalación rápida para poner en marcha el servidor en menos de 30 minutos.

---

## Pre-requisitos (Descargar e instalar primero)

1. **Node.js v18+**: https://nodejs.org/ (Descargar LTS)
2. **PostgreSQL v14+**: https://www.postgresql.org/download/windows/
3. **Git**: https://git-scm.com/download/win

**Durante la instalación de PostgreSQL:**
- Anota la contraseña del usuario `postgres`
- Puerto: 5432 (por defecto)
- Instala pgAdmin

---

## Instalación Rápida (5 pasos)

### 1. Clonar el proyecto

Abre PowerShell o CMD y ejecuta:

```cmd
cd C:\
git clone https://github.com/skillparty/inventarioCielo.git
cd inventarioCielo
```

### 2. Ejecutar el instalador automático

**Clic derecho en `install-windows.bat` > "Ejecutar como administrador"**

Este script:
- Verifica requisitos
- Instala dependencias
- Configura el firewall
- Instala PM2 para gestión de procesos

### 3. Configurar la base de datos

**Doble clic en `setup-database.bat`**

Ingresa la contraseña de PostgreSQL cuando se solicite.

### 4. Configurar la contraseña en el código

Abre el archivo: `src\backend\database\db.js`

Busca la línea:
```javascript
password: 'TU_CONTRASEÑA_POSTGRESQL'
```

Cámbiala por tu contraseña real de PostgreSQL.

### 5. Iniciar el servidor

**Opción A - Modo Manual (para pruebas):**
```cmd
npm start
```

**Opción B - Modo Producción (recomendado):**
```cmd
pm2 start npm --name "inventario-cielo" -- start
pm2 save
pm2-startup install
```

---

## Acceso al Sistema

### Desde el servidor:
```
https://localhost:3000
```

### Desde otros equipos en la red:

1. Obtén la IP del servidor:
```cmd
ipconfig
```
Busca "Dirección IPv4" (ej: 192.168.1.100)

2. En otros equipos, abre el navegador:
```
https://192.168.1.100:3000
```

**Nota:** Acepta el certificado de seguridad cuando el navegador lo solicite.

---

## Comandos Útiles

### Ver estado del servidor:
```cmd
pm2 list
```

### Ver logs en tiempo real:
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

### Actualizar el código:
```cmd
cd C:\inventarioCielo
git pull origin main
npm install
pm2 restart inventario-cielo
```

---

## Solución de Problemas Rápidos

### El servidor no inicia:
```cmd
# Ver qué está usando el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :5001

# Si hay un proceso, mátalo
taskkill /PID <numero> /F
```

### No puedo acceder desde otro equipo:
1. Verifica que el firewall permita los puertos (ejecuta `install-windows.bat` de nuevo)
2. Asegúrate de que ambos equipos estén en la misma red WiFi
3. Desactiva temporalmente el firewall para probar

### Error de PostgreSQL:
```cmd
# Verificar que PostgreSQL esté corriendo
sc query postgresql-x64-14

# Si no está corriendo, iniciarlo
net start postgresql-x64-14
```

---

## Configuración IP Estática (Recomendado)

Para que la IP del servidor no cambie:

1. Panel de Control > Redes > Cambiar configuración del adaptador
2. Clic derecho en tu red > Propiedades
3. Doble clic en "Protocolo de Internet versión 4"
4. Selecciona "Usar la siguiente dirección IP"
5. Configura:
   - IP: 192.168.1.100 (o la que prefieras)
   - Máscara: 255.255.255.0
   - Puerta de enlace: 192.168.1.1 (IP de tu router)
   - DNS: 8.8.8.8

---

## Backup de la Base de Datos

### Crear backup:
```cmd
pg_dump -U postgres -d inventario_db > backup_%date%.sql
```

### Restaurar backup:
```cmd
psql -U postgres -d inventario_db < backup_FECHA.sql
```

---

## Documentación Completa

Para más detalles, consulta:
- `INSTALACION_SERVIDOR_WINDOWS.md` - Guía detallada completa
- `INSTALLATION.md` - Documentación técnica

---

## Soporte

**Repositorio:** https://github.com/skillparty/inventarioCielo

Si encuentras problemas, verifica primero:
1. Que todos los requisitos estén instalados
2. Que PostgreSQL esté corriendo
3. Que la contraseña en `db.js` sea correcta
4. Que el firewall permita los puertos 3000 y 5001
