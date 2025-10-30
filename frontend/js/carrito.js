// frontend/js/carrito.js

/**
 * Clase para manejar el carrito de compras
 */
class CarritoCompras {
    constructor() {
        this.items = this.cargarCarrito();
        this.actualizarContador();
    }
    
    /**
     * Cargar carrito desde localStorage
     */
    cargarCarrito() {
        const carrito = localStorage.getItem('carrito');
        return carrito ? JSON.parse(carrito) : [];
    }
    
    /**
     * Guardar carrito en localStorage
     */
    guardarCarrito() {
        localStorage.setItem('carrito', JSON.stringify(this.items));
        this.actualizarContador();
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('carritoActualizado', {
            detail: { items: this.items }
        }));
    }
    
    /**
     * Agregar producto al carrito
     */
    agregar(producto) {
        const existe = this.items.find(item => item.id === producto.id);
        
        if (existe) {
            existe.cantidad++;
        } else {
            this.items.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: parseFloat(producto.precio),
                imagen: producto.imagen_principal || 'img/placeholder.jpg',
                cantidad: 1,
                slug: producto.slug
            });
        }
        
        this.guardarCarrito();
        this.mostrarNotificacion(`${producto.nombre} agregado al carrito`);
        
        return true;
    }
    
    /**
     * Quitar producto del carrito
     */
    quitar(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.guardarCarrito();
        this.renderizarPagina();
    }
    
    /**
     * Actualizar cantidad de un producto
     */
    actualizarCantidad(id, cantidad) {
        const item = this.items.find(item => item.id === id);
        
        if (item) {
            cantidad = parseInt(cantidad);
            
            if (cantidad <= 0) {
                this.quitar(id);
            } else {
                item.cantidad = cantidad;
                this.guardarCarrito();
                this.renderizarPagina();
            }
        }
    }
    
    /**
     * Obtener items del carrito
     */
    obtenerItems() {
        return this.items;
    }
    
    /**
     * Obtener cantidad total de items
     */
    obtenerCantidadTotal() {
        return this.items.reduce((total, item) => total + item.cantidad, 0);
    }
    
    /**
     * Calcular total del carrito
     */
    calcularTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.precio * item.cantidad);
        }, 0);
    }
    
    /**
     * Calcular envío
     */
    calcularEnvio() {
        const subtotal = this.calcularTotal();
        return subtotal > 50000 ? 0 : 5000;
    }
    
    /**
     * Vaciar carrito
     */
    vaciar() {
        this.items = [];
        this.guardarCarrito();
        
        // Si estamos en la página del carrito, renderizar
        if (document.getElementById('carrito-contenido')) {
            this.renderizarPagina();
        }
    }
    
    /**
     * Actualizar contador en el header
     */
    actualizarContador() {
        const contadores = document.querySelectorAll('#cart-count');
        const total = this.obtenerCantidadTotal();
        
        contadores.forEach(contador => {
            contador.textContent = total;
            contador.style.display = total > 0 ? 'block' : 'none';
        });
    }
    
    /**
     * Renderizar carrito en la página carrito.html
     */
    renderizarPagina() {
        const carritoVacio = document.getElementById('carrito-vacio');
        const carritoContenido = document.getElementById('carrito-contenido');
        const carritoResumen = document.getElementById('carrito-resumen');
        
        if (!carritoContenido) return;
        
        if (this.items.length === 0) {
            carritoVacio.style.display = 'block';
            carritoContenido.style.display = 'none';
            carritoResumen.style.display = 'none';
            return;
        }
        
        carritoVacio.style.display = 'none';
        carritoContenido.style.display = 'block';
        carritoResumen.style.display = 'block';
        
        // Renderizar items
        carritoContenido.innerHTML = this.items.map(item => `
            <div class="carrito-item" data-id="${item.id}">
                <img src="${item.imagen}" alt="${item.nombre}" 
                     onerror="this.src='img/placeholder.jpg'">
                <div class="item-info">
                    <h3>${item.nombre}</h3>
                    <p class="precio">$${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="item-cantidad">
                    <button onclick="carrito.actualizarCantidad(${item.id}, ${item.cantidad - 1})">-</button>
                    <input type="number" value="${item.cantidad}" 
                           onchange="carrito.actualizarCantidad(${item.id}, this.value)"
                           min="1">
                    <button onclick="carrito.actualizarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                </div>
                <div class="item-subtotal">
                    $${(item.precio * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
                <button class="btn-eliminar" onclick="carrito.quitar(${item.id})" title="Eliminar">
                    🗑️
                </button>
            </div>
        `).join('');
        
        // Actualizar resumen
        const subtotal = this.calcularTotal();
        const envio = this.calcularEnvio();
        const total = subtotal + envio;
        
        document.getElementById('resumen-subtotal').textContent = 
            `$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        
        document.getElementById('resumen-envio').textContent = 
            envio === 0 ? 'GRATIS ✨' : `$${envio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        
        document.getElementById('resumen-total').textContent = 
            `$${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        
        // Mensaje de envío gratis
        const mensajeEnvio = document.getElementById('envio-gratis-mensaje');
        if (envio === 0) {
            mensajeEnvio.innerHTML = '✅ <strong>¡Envío gratis!</strong> Tu pedido califica para envío sin cargo';
            mensajeEnvio.style.color = '#10b981';
        } else {
            const falta = 50000 - subtotal;
            mensajeEnvio.innerHTML = `🚚 Envío gratis en compras superiores a $50.000<br>
                <strong>Te faltan $${falta.toLocaleString('es-AR', { minimumFractionDigits: 2 })} para envío gratis</strong>`;
            mensajeEnvio.style.color = '#6b7280';
        }
    }
    
    /**
     * Mostrar notificación
     */
    mostrarNotificacion(mensaje) {
        // Eliminar notificaciones anteriores
        const notificacionesAnteriores = document.querySelectorAll('.notificacion');
        notificacionesAnteriores.forEach(n => n.remove());
        
        const notif = document.createElement('div');
        notif.className = 'notificacion';
        notif.textContent = mensaje;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.classList.add('show'), 100);
        
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }
}

// Inicializar carrito global
const carrito = new CarritoCompras();

// Escuchar evento de vaciar carrito
document.addEventListener('DOMContentLoaded', () => {
    const btnVaciar = document.getElementById('vaciar-carrito');
    if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
            if (confirm('¿Estás seguro de vaciar el carrito?')) {
                carrito.vaciar();
            }
        });
    }
});

// Hacer carrito disponible globalmente
window.carrito = carrito;