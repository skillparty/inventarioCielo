# Inicio Rápido - Modo Web (para escaneo QR desde celular)

## 🚀 Iniciar la Aplicación Web

```bash
npm run start:web
```

Este comando inicia:
- ✅ **Backend Express** en puerto 5001
- ✅ **Frontend React** en puerto 7030
- ❌ **NO inicia Electron** (solo navegador web)

## 📱 Acceder desde el Celular

### 1. Conecta tu celular a la misma red WiFi que tu computadora

### 2. Cuando inicies `npm run start:web`, verás en la consola algo como:

```
================================================
🚀 Servidor HTTP Express iniciado exitosamente
================================================
🔓 URL Local: http://localhost:5001
📱 URL Red Local: http://192.168.1.X:5001
🌍 Entorno: development
================================================

On Your Network:  http://192.168.1.X:7030
```

### 3. Desde tu celular, abre el navegador y ve a:

```
http://192.168.1.X:7030
```

*(Reemplaza 192.168.1.X con la IP que aparece en la consola)*

## 🔍 Escanear Códigos QR

Una vez en la aplicación web desde tu celular:

1. Ve a la sección de **Escanear QR**
2. Permite el acceso a la cámara
3. Apunta la cámara al código QR del activo
4. El sistema automáticamente detectará y buscará el activo

## ⚠️ Troubleshooting

### El celular no puede conectarse:

1. **Verifica que ambos dispositivos estén en la misma red WiFi**
2. **Verifica el firewall de tu computadora:**
   - macOS: `Preferencias del Sistema > Seguridad > Cortafuegos`
   - Permite conexiones a Node.js/Terminal

3. **Verifica la IP de tu computadora:**
   ```bash
   ifconfig | grep "inet "
   # o
   ipconfig getifaddr en0
   ```

### El servidor no inicia:

1. **Verifica PostgreSQL:**
   ```bash
   psql -U postgres -d inventario_db -c "SELECT 1"
   ```

2. **Verifica las variables de entorno:**
   - Asegúrate de tener el archivo `.env` configurado
   - Copia desde `.env.example` si es necesario

## 🛑 Detener la Aplicación

Presiona `Ctrl+C` en la terminal donde se está ejecutando

---

## 🆚 Diferencias entre Modos

| Característica | `npm start` | `npm run start:web` |
|----------------|-------------|---------------------|
| Backend        | ✅          | ✅                  |
| Frontend       | ✅          | ✅                  |
| Electron       | ✅          | ❌                  |
| Acceso celular | ❌          | ✅                  |
| Mejor para     | Desktop     | Escaneo QR móvil    |
