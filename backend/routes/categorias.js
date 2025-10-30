// backend/routes/categorias.js

import express from 'express';
import {
    obtenerCategorias,
    obtenerCategoriaPorSlug,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} from '../controllers/categoriasController.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', obtenerCategorias);
router.get('/:slug', obtenerCategoriaPorSlug);

// Rutas admin
router.post('/', verificarToken, verificarAdmin, crearCategoria);
router.put('/:id', verificarToken, verificarAdmin, actualizarCategoria);
router.delete('/:id', verificarToken, verificarAdmin, eliminarCategoria);

export default router;