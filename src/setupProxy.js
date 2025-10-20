const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para /api - manteniendo la ruta completa
  // Usar HTTPS porque el backend ahora está en HTTPS (requerido para acceso a cámara)
  // IMPORTANTE: incluir /api en el target porque http-proxy-middleware quita el prefijo por defecto
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:5001/api',  // Incluir /api en el target
      changeOrigin: true,
      secure: false, // Permitir certificados autofirmados
      ws: true,
      logLevel: 'debug',
      pathRewrite: {
        '^/api': '' // Quitar /api del path porque ya está en el target
      }
    })
  );
};
