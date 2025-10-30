// backend/routes/productos.js

import express from 'express';
import { 
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    buscarProductos
} from '../controllers/productosController.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', obtenerProductos);
router.get('/buscar', buscarProductos);
router.get('/:id', obtenerProductoPorId);

// Rutas protegidas (solo admin)
router.post('/', verificarToken, verificarAdmin, crearProducto);
router.put('/:id', verificarToken, verificarAdmin, actualizarProducto);
router.delete('/:id', verificarToken, verificarAdmin, eliminarProducto);

export default router;