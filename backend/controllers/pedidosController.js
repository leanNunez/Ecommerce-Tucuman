// backend/controllers/pedidosController.js

import { query, transaction } from '../config/database.js';

/**
 * Generar número de pedido único
 */
const generarNumeroPedido = () => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `PED-${año}${mes}${dia}-${random}`;
};

/**
 * Crear nuevo pedido
 */
 // backend/controllers/pedidosController.js

export const crearPedido = async (req, res) => {
    try {
                console.log('=====================================');
        console.log('📦 BODY RECIBIDO:', JSON.stringify(req.body, null, 2));
        console.log('=====================================');
        const {
            nombre_cliente,
            email,
            telefono,
            direccion,
            ciudad,
            codigo_postal,
            items,
            metodo_pago,
            notas,
            total
        } = req.body;
        
        // Helper para convertir undefined a null
        const sanitize = (value) => value === undefined || value === '' ? null : value;
        
        // Validaciones básicas
        if (!nombre_cliente || !email || !telefono || !direccion || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos o el carrito está vacío'
            });
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }
        
        // Usar transacción para asegurar consistencia
        const resultado = await transaction(async (connection) => {
            
            // 1. Verificar stock y calcular total
            let subtotal = 0;
            const itemsValidados = [];

            
            for (const item of items) {
                const [productos] = await connection.execute(
                    'SELECT id, nombre, precio, stock, imagen_principal FROM productos WHERE id = ? AND activo = 1',
                    [item.producto_id]
                );
                const producto = productos[0];
                if (!producto) {
                    throw new Error(`Producto con ID ${item.producto_id} no encontrado`);
                }
                
                if (producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${producto.nombre}. Disponibles: ${producto.stock}`);
                }
                
                const subtotalItem = producto.precio * item.cantidad;
                subtotal += subtotalItem;
                
                itemsValidados.push({
                    producto_id: producto.id,
                    nombre_producto: producto.nombre,
                    imagen_producto: producto.imagen_principal || null,
                    precio_unitario: producto.precio,
                    cantidad: item.cantidad,
                    subtotal: subtotalItem
                });
            }
            
            // 2. Calcular envío
            const envio = subtotal > 50000 ? 0 : 5000;
            const totalCalculado = subtotal + envio;
            
            // 3. Insertar pedido - SANITIZAR TODOS LOS VALORES
            const numeroPedido = generarNumeroPedido();
            
            const [resultPedido] = await connection.execute(`
                INSERT INTO pedidos (
                    numero_pedido, nombre_cliente, email, telefono,
                    direccion, ciudad, codigo_postal,
                    subtotal, envio, total, metodo_pago, notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                numeroPedido,
                sanitize(nombre_cliente),
                sanitize(email),
                sanitize(telefono),
                sanitize(direccion),
                sanitize(ciudad) || 'Tucumán',
                sanitize(codigo_postal),
                subtotal,
                envio,
                totalCalculado,
                sanitize(metodo_pago) || 'efectivo',
                sanitize(notas)
            ]);
            
            const pedidoId = resultPedido.insertId;
            
            // 4. Insertar detalles del pedido y actualizar stock
            for (const item of itemsValidados) {
                // Insertar detalle
                await connection.execute(`
                    INSERT INTO pedido_detalles (
                        pedido_id, producto_id, nombre_producto, imagen_producto,
                        precio_unitario, cantidad, subtotal
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    pedidoId,
                    item.producto_id,
                    sanitize(item.nombre_producto),
                    sanitize(item.imagen_producto) || null,
                    item.precio_unitario,
                    item.cantidad,
                    item.subtotal
                ]);
                
                // Actualizar stock y ventas
                await connection.execute(`
                    UPDATE productos 
                    SET stock = stock - ?, ventas = ventas + ?
                    WHERE id = ?
                `, [item.cantidad, item.cantidad, item.producto_id]);
            }
            
            return { pedidoId, numeroPedido };
        });
        
        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: {
                pedido_id: resultado.pedidoId,
                numero_pedido: resultado.numeroPedido
            }
        });
        
    } catch (error) {
        console.error('Error al crear pedido:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al crear pedido'
        });
    }
};

/**
 * Obtener todos los pedidos (ADMIN)
 */
export const obtenerPedidos = async (req, res) => {
    try {
        const { estado, fecha_desde, fecha_hasta, limit = 50, offset = 0 } = req.query;
        
        let sql = `
            SELECT 
                p.id, p.numero_pedido, p.nombre_cliente, p.email, 
                p.telefono, p.total, p.estado, p.estado_pago, p.metodo_pago,
                p.created_at,
                COUNT(pd.id) as cantidad_items
            FROM pedidos p
            LEFT JOIN pedido_detalles pd ON p.id = pd.pedido_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (estado) {
            sql += ' AND p.estado = ?';
            params.push(estado);
        }
        
        if (fecha_desde) {
            sql += ' AND DATE(p.created_at) >= ?';
            params.push(fecha_desde);
        }
        
        if (fecha_hasta) {
            sql += ' AND DATE(p.created_at) <= ?';
            params.push(fecha_hasta);
        }
        
        sql += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const pedidos = await query(sql, params);
        
        // Contar total
        let countSql = 'SELECT COUNT(*) as total FROM pedidos WHERE 1=1';
        const countParams = [];
        
        if (estado) {
            countSql += ' AND estado = ?';
            countParams.push(estado);
        }
        
        if (fecha_desde) {
            countSql += ' AND DATE(created_at) >= ?';
            countParams.push(fecha_desde);
        }
        
        if (fecha_hasta) {
            countSql += ' AND DATE(created_at) <= ?';
            countParams.push(fecha_hasta);
        }
        
        const [{ total }] = await query(countSql, countParams);
        
        res.json({
            success: true,
            data: pedidos,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener pedidos'
        });
    }
};

/**
 * Obtener pedido específico con detalles (ADMIN)
 */
export const obtenerPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener pedido
        const [pedido] = await query(`
            SELECT * FROM pedidos WHERE id = ? OR numero_pedido = ?
        `, [id, id]);
        
        if (!pedido) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado'
            });
        }
        
        // Obtener items del pedido
        const items = await query(`
            SELECT * FROM pedido_detalles WHERE pedido_id = ?
        `, [pedido.id]);
        
        pedido.items = items;
        
        res.json({
            success: true,
            data: pedido
        });
        
    } catch (error) {
        console.error('Error al obtener pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener pedido'
        });
    }
};

/**
 * Actualizar estado del pedido (ADMIN)
 */
export const actualizarEstadoPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, estado_pago } = req.body;
        
        const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];
        const estadosPagoValidos = ['pendiente', 'pagado', 'rechazado'];
        
        if (estado && !estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                error: 'Estado inválido. Valores permitidos: ' + estadosValidos.join(', ')
            });
        }
        
        if (estado_pago && !estadosPagoValidos.includes(estado_pago)) {
            return res.status(400).json({
                success: false,
                error: 'Estado de pago inválido. Valores permitidos: ' + estadosPagoValidos.join(', ')
            });
        }
        
        const updates = [];
        const params = [];
        
        if (estado) {
            updates.push('estado = ?');
            params.push(estado);
        }
        
        if (estado_pago) {
            updates.push('estado_pago = ?');
            params.push(estado_pago);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar'
            });
        }
        
        params.push(id);
        
        await query(`UPDATE pedidos SET ${updates.join(', ')} WHERE id = ?`, params);
        
        res.json({
            success: true,
            message: 'Pedido actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al actualizar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar pedido'
        });
    }
};

/**
 * Obtener pedidos del usuario autenticado
 */
export const obtenerMisPedidos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        
        const pedidos = await query(`
            SELECT 
                p.id, p.numero_pedido, p.total, p.estado, 
                p.estado_pago, p.created_at,
                COUNT(pd.id) as cantidad_items
            FROM pedidos p
            LEFT JOIN pedido_detalles pd ON p.id = pd.pedido_id
            WHERE p.usuario_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [usuarioId]);
        
        res.json({
            success: true,
            data: pedidos
        });
        
    } catch (error) {
        console.error('Error al obtener mis pedidos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener pedidos'
        });
    }
};