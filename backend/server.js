// backend/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import productosRoutes from './routes/productos.js';
import pedidosRoutes from './routes/pedidos.js';
import authRoutes from './routes/auth.js';
import categoriasRoutes from './routes/categorias.js';

// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors({
    origin:'*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger simple de peticiones
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toLocaleString()}`);
    next();
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({ 
        message: '🛒 E-commerce API',
        status: 'OK',
        version: '1.0.0',
        endpoints: {
            productos: '/api/productos',
            categorias: '/api/categorias',
            pedidos: '/api/pedidos',
            auth: '/api/auth'
        }
    });
});

// Rutas de la API
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.path 
    });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🚀 Servidor corriendo               ║
║   📡 Puerto: ${PORT}                    ║
║   🌍 URL: http://localhost:${PORT}     ║
║   📚 API: http://localhost:${PORT}/api ║
╚═══════════════════════════════════════╝
    `);
});