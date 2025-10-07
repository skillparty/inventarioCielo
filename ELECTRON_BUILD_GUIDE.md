# Guia de Empaquetado Electron

## Configuracion Completada

### Archivos Creados
- `electron.js` - Proceso principal con menu completo
- `preload.js` - Script de seguridad
- `package.json` - Configuracion de electron-builder

## Scripts Disponibles

```bash
# Desarrollo
npm start              # Inicia app completa (backend + frontend + electron)
npm run dev           # Alias de start

# Build
npm run build         # Build de React
npm run build:win     # Instalador Windows (.exe)
npm run build:mac     # Instalador macOS (.dmg)
npm run build:linux   # Instalador Linux (.AppImage, .deb, .rpm)
npm run pack          # Build sin comprimir (testing)
npm run dist          # Build para todas las plataformas
```

## Instaladores Generados

**Windows:**
- `Inventario Cielo Setup 1.0.0.exe` (instalador NSIS)
- `Inventario Cielo-1.0.0-portable.exe` (version portable)

**macOS:**
- `Inventario Cielo-1.0.0.dmg`
- `Inventario Cielo-1.0.0-arm64.dmg` (Apple Silicon)

**Linux:**
- `Inventario Cielo-1.0.0.AppImage`
- `inventario-cielo_1.0.0_amd64.deb`
- `inventario-cielo-1.0.0.x86_64.rpm`

## Requisitos Previos

1. **PostgreSQL** debe estar instalado y configurado
2. Crear archivo `.env` basado en `.env.example`
3. Ejecutar migraciones de base de datos

## Pasos para Empaquetar

### 1. Preparar Proyecto
```bash
npm install
npm run build
```

### 2. Generar Instaladores
```bash
# Windows
npm run build:win

# macOS  
npm run build:mac

# Linux
npm run build:linux
```

### 3. Resultados
Los instaladores se guardan en: `dist/`

## Caracteristicas Implementadas

- Inicio automatico del servidor Express
- Menu personalizado con atajos de teclado
- Verificacion de base de datos desde menu
- Reinicio de servidor desde menu
- Deep linking (protocolo inventario://)
- Preparado para auto-updater
- Manejo de errores robusto

## Iconos Requeridos

Coloca los iconos en `public/`:
- `icon.png` (512x512)
- `icon.ico` (Windows)
- `icon.icns` (macOS)

## Notas Importantes

- El servidor backend se inicia automaticamente con la app
- PostgreSQL debe estar corriendo antes de abrir la app
- Los logs del servidor aparecen en la consola de Electron
