// backend/controllers/authController.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

/**
 * Registro de nuevo usuario
 */
export const registro = async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion, ciudad } = req.body;
        
        // Validaciones
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, email y contraseña son requeridos'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }
        
        // Verificar si el email ya existe
        const [usuarioExistente] = await query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }
        
        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Insertar usuario
        const result = await query(`
            INSERT INTO usuarios (nombre, email, password, telefono, direccion, ciudad)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [nombre, email, passwordHash, telefono || null, direccion || null, ciudad || 'Tucumán']);
        
        // Generar token
        const token = jwt.sign(
            { id: result.insertId, email, tipo: 'cliente' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                token,
                usuario: {
                    id: result.insertId,
                    nombre,
                    email,
                    tipo: 'cliente'
                }
            }
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar usuario'
        });
    }
};

/**
 * Login de usuario
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }
        
        // Buscar usuario
        const [usuario] = await query(
            'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
            [email]
        );
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        
        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, usuario.password);
        
        if (!passwordValido) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        
        // Generar token
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Actualizar último acceso
        await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [usuario.id]);
        
        // No enviar password en la respuesta
        delete usuario.password;
        
        res.json({
            success: true,
            data: {
                token,
                usuario
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión'
        });
    }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const obtenerPerfil = async (req, res) => {
    try {
        const [usuario] = await query(
            'SELECT id, nombre, email, telefono, direccion, ciudad, codigo_postal, tipo, created_at FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: usuario
        });
        
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil'
        });
    }
};

/**
 * Actualizar perfil del usuario
 */
export const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, telefono, direccion, ciudad, codigo_postal } = req.body;
        
        await query(`
            UPDATE usuarios 
            SET nombre = COALESCE(?, nombre),
                telefono = COALESCE(?, telefono),
                direccion = COALESCE(?, direccion),
                ciudad = COALESCE(?, ciudad),
                codigo_postal = COALESCE(?, codigo_postal)
            WHERE id = ?
        `, [nombre, telefono, direccion, ciudad, codigo_postal, req.usuario.id]);
        
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar perfil'
        });
    }
};