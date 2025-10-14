#!/bin/bash

echo "🚀 Iniciando Inventario Cielo en modo desarrollo..."
echo ""

# Detener procesos anteriores
pkill -9 -f "node src/backend/server.js" 2>/dev/null
pkill -9 -f "react-scripts" 2>/dev/null
sleep 2

# Iniciar backend
echo "📦 Iniciando backend en puerto 5001..."
node src/backend/server.js &
BACKEND_PID=$!
sleep 3

# Iniciar frontend
echo "⚛️  Iniciando frontend en puerto 7030..."
echo "   (Esto puede tardar 30-60 segundos...)"
PORT=7030 BROWSER=none HTTPS=false npm run start:frontend &
FRONTEND_PID=$!

echo ""
echo "✅ Servicios iniciados:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "⏳ Esperando a que el frontend compile..."
echo "   Cuando veas 'webpack compiled', abre: http://localhost:7030"
echo ""
echo "Para detener: Ctrl+C o ejecuta:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Esperar
wait
