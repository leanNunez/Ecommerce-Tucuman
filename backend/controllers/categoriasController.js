// backend/controllers/categoriasController.js

import { query } from '../config/database.js';

/**
 * Obtener todas las categorías activas
 */
export const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await query(`
            SELECT 
                c.*,
                COUNT(p.id) as total_productos
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1
            WHERE c.activo = 1
            GROUP BY c.id
            ORDER BY c.nombre ASC
        `);
        
        res.json({
            success: true,
            data: categorias
        });
        
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener categorías'
        });
    }
};

/**
 * Obtener categoría por slug
 */
export const obtenerCategoriaPorSlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const [categoria] = await query(
            'SELECT * FROM categorias WHERE slug = ? AND activo = 1',
            [slug]
        );
        
        if (!categoria) {
            return res.status(404).json({
                success: false,
                error: 'Categoría no encontrada'
            });
        }
        
        // Obtener productos de la categoría
        const productos = await query(`
            SELECT id, nombre, slug, descripcion_corta, precio, precio_anterior, 
            imagen_principal, stock, ventas
            FROM productos
            WHERE categoria_id = ? AND activo = 1
            ORDER BY destacado DESC, ventas DESC
            LIMIT 20
        `, [categoria.id]);
        
        categoria.productos = productos;
        
        res.json({
            success: true,
            data: categoria
        });
        
    } catch (error) {
        console.error('Error al obtener categoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener categoría'
        });
    }
};

/**
 * Crear nueva categoría (ADMIN)
 */
export const crearCategoria = async (req, res) => {
    try {
        const { nombre, slug, descripcion, imagen } = req.body;
        
        if (!nombre) {
            return res.status(400).json({
                success: false,
                error: 'El nombre es requerido'
            });
        }
        
        const slugFinal = slug || nombre.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        const result = await query(`
            INSERT INTO categorias (nombre, slug, descripcion, imagen)
            VALUES (?, ?, ?, ?)
        `, [nombre, slugFinal, descripcion || null, imagen || null]);
        
        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: {
                id: result.insertId,
                nombre,
                slug: slugFinal
            }
        });
        
    } catch (error) {
        console.error('Error al crear categoría:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una categoría con ese slug'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al crear categoría'
        });
    }
};

/**
 * Actualizar categoría (ADMIN)
 */
export const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, slug, descripcion, imagen, activo } = req.body;
        
        await query(`
            UPDATE categorias
            SET nombre = COALESCE(?, nombre),
                slug = COALESCE(?, slug),
                descripcion = COALESCE(?, descripcion),
                imagen = COALESCE(?, imagen),
                activo = COALESCE(?, activo)
            WHERE id = ?
        `, [nombre, slug, descripcion, imagen, activo, id]);
        
        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar categoría'
        });
    }
};

/**
 * Eliminar categoría (ADMIN)
 */
export const eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que no tenga productos
        const [{ total }] = await query(
            'SELECT COUNT(*) as total FROM productos WHERE categoria_id = ?',
            [id]
        );
        
        if (total > 0) {
            return res.status(400).json({
                success: false,
                error: `No se puede eliminar. Hay ${total} productos asociados a esta categoría`
            });
        }
        
        await query('DELETE FROM categorias WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar categoría'
        });
    }
};