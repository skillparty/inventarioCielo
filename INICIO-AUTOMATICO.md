# Configurar Inicio Automático del Servidor

## Opción 1: Ejecutar Manualmente (Reinicio Automático)

1. Haz doble clic en: `start-server.bat`
   - Se abrirá una ventana de comandos
   - El servidor se ejecutará
   - Si se detiene, se reiniciará automáticamente cada 5 segundos

## Opción 2: Ejecutar en Segundo Plano (Sin ventana)

1. Haz doble clic en: `start-server-silent.vbs`
   - No se mostrará ninguna ventana
   - El servidor correrá en segundo plano
   - Se reiniciará automáticamente si se detiene

Para detenerlo:
- Abre el Administrador de Tareas (Ctrl + Shift + Esc)
- Busca el proceso "node.exe"
- Clic derecho > Finalizar tarea

## Opción 3: Iniciar Automáticamente con Windows

### Pasos:

1. Presiona `Win + R` (abrir ejecutar)

2. Escribe: `shell:startup` y presiona Enter
   - Se abrirá la carpeta de Inicio

3. Crea un acceso directo:
   - Clic derecho en la carpeta > Nuevo > Acceso directo
   - Ubicación: `C:\Users\CFC - SERVIDOR\inventarioCielo\start-server-silent.vbs`
   - Nombre: "Inventario Cielo Server"

4. Reinicia la computadora
   - El servidor se iniciará automáticamente

## Verificar que está funcionando

- Abre el navegador
- Ve a: `https://localhost:5001`
- Debes ver el sistema funcionando

## Notas Importantes

- El servidor se ejecuta en el puerto 5001
- Solo puede haber una instancia ejecutándose
- Si cambias el código, debes reiniciar el servidor
- Los logs no se mostrarán si usas el modo silencioso

## Para Desarrollo (con terminal visible)

Si necesitas ver los logs mientras desarrollas:
- Usa: `start-server.bat` en lugar del .vbs
- Verás todos los mensajes del servidor en tiempo real
