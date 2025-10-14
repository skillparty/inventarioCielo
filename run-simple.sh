#!/bin/bash

echo "🧹 Limpiando procesos..."
pkill -9 -f "node src/backend/server.js" 2>/dev/null
pkill -9 -f "react-scripts" 2>/dev/null
sleep 2

echo "🚀 Iniciando backend en puerto 5001..."
BACKEND_PORT=5001 node src/backend/server.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

echo "⚛️  Iniciando frontend en puerto 7030..."
echo "Esto puede tardar 30-60 segundos..."
PORT=7030 BROWSER=none HTTPS=false npm run start:frontend
