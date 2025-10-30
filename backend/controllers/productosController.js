// backend/controllers/productosController.js

import { query } from '../config/database.js';

/**
 * Obtener todos los productos con filtros opcionales
 */
export const obtenerProductos = async (req, res) => {
    try {
        const { categoria, destacado, limit = 20, offset = 0, orden = 'recientes' } = req.query;
        
        // Convertir a números enteros y validar
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        
        // SQL en una línea para evitar problemas
        let sql = 'SELECT p.id, p.nombre, p.slug, p.descripcion, p.descripcion_corta, p.precio, p.precio_anterior, p.stock, p.categoria_id, p.imagen_principal, p.activo, p.destacado, p.ventas, p.vistas, p.created_at, c.nombre as categoria_nombre, c.slug as categoria_slug FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.activo = 1';
        
        const params = [];
        
        if (categoria) {
            sql += ' AND (c.id = ? OR c.slug = ?)';
            params.push(categoria, categoria);
        }
        
        if (destacado === 'true') {
            sql += ' AND p.destacado = 1';
        }
        
        switch(orden) {
            case 'precio_asc':
                sql += ' ORDER BY p.precio ASC';
                break;
            case 'precio_desc':
                sql += ' ORDER BY p.precio DESC';
                break;
            case 'nombre':
                sql += ' ORDER BY p.nombre ASC';
                break;
            case 'ventas':
                sql += ' ORDER BY p.ventas DESC';
                break;
            default:
                sql += ' ORDER BY p.created_at DESC';
        }
        
        // SOLUCIÓN: Agregar LIMIT y OFFSET directamente al SQL
        sql += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;
        
        const productos = await query(sql, params);
        
        const productosConDescuento = productos.map(p => {
            if (p.precio_anterior && p.precio_anterior > 0) {
                p.descuento_porcentaje = Math.round(((p.precio_anterior - p.precio) / p.precio_anterior) * 100);
            } else {
                p.descuento_porcentaje = 0;
            }
            return p;
        });
        
        let countSql = 'SELECT COUNT(*) as total FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.activo = 1';
        const countParams = [];
        
        if (categoria) {
            countSql += ' AND (c.id = ? OR c.slug = ?)';
            countParams.push(categoria, categoria);
        }
        
        if (destacado === 'true') {
            countSql += ' AND p.destacado = 1';
        }
        
        const countResult = await query(countSql, countParams);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: productosConDescuento,
            pagination: {
                total,
                limit: limitNum,
                offset: offsetNum,
                pages: Math.ceil(total / limitNum)
            }
        });
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener productos'
        });
    }
};

/**
 * Obtener un producto específico por ID o slug
 */
export const obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                p.*,
                c.nombre as categoria_nombre,
                c.slug as categoria_slug
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE (p.id = ? OR p.slug = ?) AND p.activo = 1
        `;
        
        const resultado = await query(sql, [id, id]);
        const producto = resultado[0];
        
        if (!producto) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }
        
        // Calcular descuento
        if (producto.precio_anterior && producto.precio_anterior > 0) {
            producto.descuento_porcentaje = Math.round(((producto.precio_anterior - producto.precio) / producto.precio_anterior) * 100);
        } else {
            producto.descuento_porcentaje = 0;
        }
        
        // Obtener imágenes adicionales
        const imagenes = await query(
            'SELECT imagen FROM producto_imagenes WHERE producto_id = ? ORDER BY orden',
            [producto.id]
        );
        
        producto.imagenes = imagenes.map(img => img.imagen);
        
        // Incrementar contador de vistas
        await query('UPDATE productos SET vistas = vistas + 1 WHERE id = ?', [producto.id]);
        
        // Obtener productos relacionados
        const relacionados = await query(`
            SELECT id, nombre, slug, precio, precio_anterior, imagen_principal
            FROM productos
            WHERE categoria_id = ? AND id != ? AND activo = 1
            LIMIT 4
        `, [producto.categoria_id, producto.id]);
        
        producto.relacionados = relacionados;
        
        res.json({
            success: true,
            data: producto
        });
        
    } catch (error) {
        console.error('❌ ERROR EN obtenerProductoPorId:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener producto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Buscar productos por nombre o descripción
 */
export const buscarProductos = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ 
                success: false, 
                error: 'El término de búsqueda debe tener al menos 2 caracteres' 
            });
        }
        
        const searchTerm = `%${q}%`;
        
        const sql = `
            SELECT 
                p.id, p.nombre, p.slug, p.descripcion_corta, 
                p.precio, p.precio_anterior, p.imagen_principal,
                c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1 
            AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.descripcion_corta LIKE ?)
            ORDER BY p.ventas DESC, p.nombre ASC
            LIMIT 20
        `;
        
        const productos = await query(sql, [searchTerm, searchTerm, searchTerm]);
        
        res.json({
            success: true,
            data: productos,
            total: productos.length
        });
        
    } catch (error) {
        console.error('❌ ERROR EN buscarProductos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al buscar productos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Crear nuevo producto (ADMIN)
 */
export const crearProducto = async (req, res) => {
    try {
        const {
            nombre,
            slug,
            descripcion,
            descripcion_corta,
            precio,
            precio_anterior,
            stock,
            stock_minimo,
            categoria_id,
            imagen_principal,
            destacado
        } = req.body;
        
        if (!nombre || !precio || !stock || !categoria_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan campos requeridos: nombre, precio, stock, categoria_id' 
            });
        }
        
        const slugFinal = slug || nombre.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        const sql = `
            INSERT INTO productos (
                nombre, slug, descripcion, descripcion_corta,
                precio, precio_anterior, stock, stock_minimo,
                categoria_id, imagen_principal, destacado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await query(sql, [
            nombre,
            slugFinal,
            descripcion || null,
            descripcion_corta || null,
            precio,
            precio_anterior || null,
            stock,
            stock_minimo || 5,
            categoria_id,
            imagen_principal || null,
            destacado ? 1 : 0
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: {
                id: result.insertId,
                nombre,
                slug: slugFinal
            }
        });
        
    } catch (error) {
        console.error('❌ ERROR EN crearProducto:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Ya existe un producto con ese nombre o slug' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Error al crear producto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Actualizar producto (ADMIN)
 */
export const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            slug,
            descripcion,
            descripcion_corta,
            precio,
            precio_anterior,
            stock,
            stock_minimo,
            categoria_id,
            imagen_principal,
            destacado,
            activo
        } = req.body;
        
        const existe = await query('SELECT id FROM productos WHERE id = ?', [id]);
        
        if (existe.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }
        
        const sql = `
            UPDATE productos SET
                nombre = COALESCE(?, nombre),
                slug = COALESCE(?, slug),
                descripcion = COALESCE(?, descripcion),
                descripcion_corta = COALESCE(?, descripcion_corta),
                precio = COALESCE(?, precio),
                precio_anterior = ?,
                stock = COALESCE(?, stock),
                stock_minimo = COALESCE(?, stock_minimo),
                categoria_id = COALESCE(?, categoria_id),
                imagen_principal = COALESCE(?, imagen_principal),
                destacado = COALESCE(?, destacado),
                activo = COALESCE(?, activo)
            WHERE id = ?
        `;
        
        await query(sql, [
            nombre,
            slug,
            descripcion,
            descripcion_corta,
            precio,
            precio_anterior,
            stock,
            stock_minimo,
            categoria_id,
            imagen_principal,
            destacado !== undefined ? (destacado ? 1 : 0) : null,
            activo !== undefined ? (activo ? 1 : 0) : null,
            id
        ]);
        
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ ERROR EN actualizarProducto:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Ya existe un producto con ese slug' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar producto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Eliminar producto (soft delete) (ADMIN)
 */
export const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        
        const resultado = await query('SELECT id, nombre FROM productos WHERE id = ?', [id]);
        
        if (resultado.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }
        
        const producto = resultado[0];
        
        await query('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: `Producto "${producto.nombre}" eliminado exitosamente`
        });
        
    } catch (error) {
        console.error('❌ ERROR EN eliminarProducto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar producto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};