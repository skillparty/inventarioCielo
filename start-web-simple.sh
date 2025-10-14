#!/bin/bash
# Script simple para iniciar la aplicación web

echo "🚀 Iniciando Inventario Cielo en modo Web..."
echo ""

# Iniciar backend en segundo plano
echo "📦 Iniciando backend..."
node src/backend/server.js &
BACKEND_PID=$!

# Esperar a que el backend inicie
sleep 3

# Iniciar frontend
echo "🌐 Iniciando frontend..."
PORT=7030 BROWSER=none react-scripts start

# Limpiar al salir
trap "kill $BACKEND_PID" EXIT
