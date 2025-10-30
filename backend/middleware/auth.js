// backend/middleware/auth.js

import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar que el usuario está autenticado
 */
export const verificarToken = (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado. Acceso denegado.'
            });
        }
        
        // El formato es: "Bearer TOKEN"
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Formato de token inválido'
            });
        }
        
        // Verificar y decodificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Agregar información del usuario al request
        req.usuario = decoded;
        
        // Continuar al siguiente middleware o ruta
        next();
        
    } catch (error) {
        console.error('Error al verificar token:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado. Por favor, inicia sesión nuevamente.'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }
        
        res.status(401).json({
            success: false,
            error: 'Error de autenticación'
        });
    }
};

/**
 * Middleware para verificar que el usuario es administrador
 */
export const verificarAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            success: false,
            error: 'Usuario no autenticado'
        });
    }
    
    if (req.usuario.tipo !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
    
    next();
};