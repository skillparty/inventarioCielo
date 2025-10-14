#!/bin/bash

echo "🧹 Limpiando configuración previa..."
unset HOST
unset PORT
export BROWSER=none

echo "🚀 Iniciando backend..."
node src/backend/server.js &
BACKEND_PID=$!

sleep 3

echo "🌐 Iniciando frontend en puerto 3000..."
PORT=3000 npx react-scripts start

# Limpiar al terminar
trap "echo '🛑 Deteniendo servicios...'; kill $BACKEND_PID 2>/dev/null" EXIT
