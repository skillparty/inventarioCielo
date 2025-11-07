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
      timeout: 30000, // 30 segundos timeout
      proxyTimeout: 30000,
      pathRewrite: {
        '^/api': '' // Quitar /api del path porque ya está en el target
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        console.error('   Request:', req.method, req.path);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Proxy Error', 
          message: err.message,
          hint: 'Verifica que el backend esté corriendo en https://localhost:5001'
        }));
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔵 Proxy request:', req.method, req.path, '→', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', req.method, req.path, '→', proxyRes.statusCode);
      }
    })
  );
};
