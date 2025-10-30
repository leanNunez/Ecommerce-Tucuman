// frontend/js/main.js

/**
 * Inicialización al cargar el DOM
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔵 DOM cargado');
    
    await cargarCategorias();
    await cargarProductosDestacados();
    inicializarBuscador();
    verificarAutenticacion();
});

/**
 * Cargar categorías en la página principal
 */
async function cargarCategorias() {
    const container = document.getElementById('categories-grid');
    if (!container) return;
    
    try {
        console.log('🔵 Cargando categorías...');
        
        const response = await API.get('/categorias');
        
        console.log('🔵 Categorías recibidas:', response);
        
        if (response.success && response.data.length > 0) {
            // Iconos por categoría
            const iconos = {
                'electronica': '📱',
                'ropa-moda': '👕',
                'hogar-deco': '🏠',
                'deportes': '⚽',
                'alimentos': '🍎',
                'belleza': '💄'
            };
            
            container.innerHTML = response.data.map(categoria => `
                <div class="category-card" onclick="window.location.href='productos.html?categoria=${categoria.slug}'">
                    <div class="category-icon">${iconos[categoria.slug] || '📦'}</div>
                    <h3>${categoria.nombre}</h3>
                    <p>${categoria.total_productos} productos</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No hay categorías disponibles</p>';
        }
    } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
        container.innerHTML = '<p>Error al cargar categorías</p>';
    }
}

/**
 * Cargar productos destacados
 */
async function cargarProductosDestacados() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    try {
        console.log('🔵 Cargando productos destacados...');
        
        const response = await API.get('/productos', {
            destacado: 'true',
            limit: 8
        });
        
        console.log('🔵 Productos destacados recibidos:', response);
        
        if (response.success && response.data.length > 0) {
            container.innerHTML = response.data.map(producto => 
                crearTarjetaProducto(producto)
            ).join('');
        } else {
            container.innerHTML = '<p>No hay productos destacados disponibles</p>';
        }
    } catch (error) {
        console.error('❌ Error al cargar productos destacados:', error);
        container.innerHTML = '<p>Error al cargar productos</p>';
    }
}

/**
 * Crear HTML de tarjeta de producto
 */
function crearTarjetaProducto(producto) {
    const descuento = producto.descuento_porcentaje;
    const tieneDescuento = descuento && descuento > 0;
    
    return `
        <div class="product-card" onclick="window.location.href='producto-detalle.html?id=${producto.slug || producto.id}'">
            <div class="product-image">
                <img src="${producto.imagen_principal || 'img/placeholder.jpg'}" 
                     alt="${producto.nombre}"
                     onerror="this.src='img/placeholder.jpg'">
                ${tieneDescuento ? `<div class="product-badge">-${descuento}%</div>` : ''}
                ${producto.destacado ? '<div class="product-badge destacado">⭐ Destacado</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${producto.categoria_nombre || 'Sin categoría'}</div>
                <h3 class="product-name">${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion_corta || ''}</p>
                <div class="product-footer">
                    <div class="product-price">
                        <div class="price-current">$${parseFloat(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                        ${producto.precio_anterior ? `
                            <div class="price-old">$${parseFloat(producto.precio_anterior).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                        ` : ''}
                    </div>
                    <button class="btn-add-cart" onclick="event.stopPropagation(); agregarAlCarrito(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, '${producto.imagen_principal || ''}', '${producto.slug || ''}')">
                        🛒 Agregar
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Agregar producto al carrito
 */
function agregarAlCarrito(id, nombre, precio, imagen, slug) {
    carrito.agregar({
        id,
        nombre,
        precio,
        imagen_principal: imagen,
        slug
    });
}

/**
 * Inicializar buscador
 */
function inicializarBuscador() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (!searchInput || !searchBtn) return;
    
    // Buscar al hacer clic
    searchBtn.addEventListener('click', realizarBusqueda);
    
    // Buscar al presionar Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            realizarBusqueda();
        }
    });
}

/**
 * Realizar búsqueda
 */
function realizarBusqueda() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (query.length > 0) {
        window.location.href = `productos.html?buscar=${encodeURIComponent(query)}`;
    }
}

/**
 * Verificar si el usuario está autenticado
 */
function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    const authLink = document.getElementById('auth-link');
    
    if (!authLink) return;
    
    if (token && usuario) {
        authLink.textContent = `👤 ${usuario.nombre}`;
        authLink.href = usuario.tipo === 'admin' ? 'admin/index.html' : '#perfil';
        
        // Agregar menú desplegable
        authLink.addEventListener('click', (e) => {
            if (usuario.tipo !== 'admin') {
                e.preventDefault();
                mostrarMenuUsuario(authLink);
            }
        });
    } else {
        authLink.textContent = '👤 Iniciar Sesión';
        authLink.href = 'admin/login.html';
    }
}

/**
 * Mostrar menú de usuario
 */
function mostrarMenuUsuario(elemento) {
    const menuExistente = document.getElementById('user-menu');
    if (menuExistente) {
        menuExistente.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.id = 'user-menu';
    menu.style.cssText = `
        position: absolute;
        top: 60px;
        right: 20px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 0.5rem;
        z-index: 1000;
        min-width: 200px;
    `;
    
    menu.innerHTML = `
        <a href="#perfil" style="display: block; padding: 0.75rem; color: #374151; border-radius: 0.25rem;">
            👤 Mi Perfil
        </a>
        <a href="#pedidos" style="display: block; padding: 0.75rem; color: #374151; border-radius: 0.25rem;">
            📦 Mis Pedidos
        </a>
        <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid #e5e7eb;">
        <a href="#" onclick="cerrarSesion(); return false;" style="display: block; padding: 0.75rem; color: #ef4444; border-radius: 0.25rem;">
            🚪 Cerrar Sesión
        </a>
    `;
    
    document.body.appendChild(menu);
    
    // Cerrar al hacer clic fuera
    setTimeout(() => {
        document.addEventListener('click', function cerrarMenu(e) {
            if (!menu.contains(e.target) && e.target !== elemento) {
                menu.remove();
                document.removeEventListener('click', cerrarMenu);
            }
        });
    }, 100);
}

/**
 * Cerrar sesión
 */
function cerrarSesion() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    }
}

// Hacer funciones disponibles globalmente
window.agregarAlCarrito = agregarAlCarrito;
window.cerrarSesion = cerrarSesion;