const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para /api - manteniendo la ruta completa
  // Usar HTTPS porque el backend ahora está en HTTPS (requerido para acceso a cámara)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:5001',
      changeOrigin: true,
      secure: false, // Permitir certificados autofirmados
      ws: true,
      logLevel: 'debug'
    })
  );
};
