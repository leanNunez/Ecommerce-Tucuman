// backend/routes/pedidos.js

import express from 'express';
import {
    crearPedido,
    obtenerPedidos,
    obtenerPedidoPorId,
    actualizarEstadoPedido,
    obtenerMisPedidos
} from '../controllers/pedidosController.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/', crearPedido);

// Rutas de usuario autenticado
router.get('/mis-pedidos', verificarToken, obtenerMisPedidos);

// Rutas de admin
router.get('/', verificarToken, verificarAdmin, obtenerPedidos);
router.get('/:id', verificarToken, verificarAdmin, obtenerPedidoPorId);
router.patch('/:id/estado', verificarToken, verificarAdmin, actualizarEstadoPedido);

export default router;