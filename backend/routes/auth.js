// backend/routes/auth.js

import express from 'express';
import {
    registro,
    login,
    obtenerPerfil,
    actualizarPerfil
} from '../controllers/authController.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/registro', registro);
router.post('/login', login);

// Rutas protegidas
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);

export default router;