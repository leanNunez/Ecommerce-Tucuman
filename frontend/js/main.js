/**
 * frontend/js/main.js - versión corregida y robusta
 */

/** Utilitario para normalizar hrefs/paths */
function normHref(...parts) {
if (parts.length === 1 && (parts[0] === '#' || String(parts[0]).startsWith('#'))) return parts[0];
if (parts.length === 1 && /^https?:\/\//i.test(parts[0])) return parts[0];

const joined = parts
    .map(p => (p == null ? '' : String(p)))
    .filter(p => p !== '')
    .join('/');

let cleaned = joined.replace(/\/+/g, '/');
if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;
return cleaned;
}

/**
 * Inicialización al cargar el DOM
 */
document.addEventListener('DOMContentLoaded', async () => {
console.log('🔵 DOM cargado');

  // Delegación para botones de agregar al carrito (evita problemas de quotes en HTML)
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-cart');
    if (btn) {
    e.stopPropagation();
    const id = btn.dataset.id;
    const nombre = btn.dataset.nombre ? decodeURIComponent(btn.dataset.nombre) : '';
    const precio = parseFloat(btn.dataset.precio || '0');
    const imagen = btn.dataset.imagen || '';
    const slug = btn.dataset.slug || '';
    agregarAlCarrito(id, nombre, precio, imagen, slug);
    }
});

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
    const iconos = {
        'electronica': '📱',
        'ropa-moda': '👕',
        'hogar-deco': '🏠',
        'deportes': '⚽',
        'alimentos': '🍎',
        'belleza': '💄'
    };

    container.innerHTML = response.data.map(categoria => {
        const url = normHref('/', 'productos.html') + '?categoria=' + encodeURIComponent(categoria.slug);
        return `
        <div class="category-card" onclick="window.location.href='${url}'">
            <div class="category-icon">${iconos[categoria.slug] || '📦'}</div>
            <h3>${categoria.nombre}</h3>
            <p>${categoria.total_productos} productos</p>
        </div>
        `;
    }).join('');
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

    const response = await API.get('/productos', { destacado: 'true', limit: 8 });

    console.log('🔵 Productos destacados recibidos:', response);

    if (response.success && response.data.length > 0) {
    container.innerHTML = response.data.map(producto => crearTarjetaProducto(producto)).join('');
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
 * Usa data-attributes en el botón para evitar problemas con comillas en strings.
 */
function crearTarjetaProducto(producto) {
const descuento = producto.descuento_porcentaje;
const tieneDescuento = descuento && descuento > 0;
const productoUrl = normHref('/', 'producto-detalle.html') + '?id=' + encodeURIComponent(producto.slug || producto.id);
const imagenSrc = producto.imagen_principal || 'img/placeholder.jpg';
const nombreEscaped = encodeURIComponent(producto.nombre || '');

return `
    <div class="product-card" onclick="window.location.href='${productoUrl}'">
    <div class="product-image">
        <img src="${imagenSrc}" alt="${(producto.nombre || '').replace(/"/g, '&quot;')}" onerror="this.src='img/placeholder.jpg'">
        ${tieneDescuento ? `<div class="product-badge">-${descuento}%</div>` : ''}
        ${producto.destacado ? '<div class="product-badge destacado">⭐ Destacado</div>' : ''}
    </div>
    <div class="product-info">
        <div class="product-category">${producto.categoria_nombre || 'Sin categoría'}</div>
        <h3 class="product-name">${producto.nombre}</h3>
        <p class="product-description">${producto.descripcion_corta || ''}</p>
        <div class="product-footer">
        <div class="product-price">
            <div class="price-current">$${(parseFloat(producto.precio) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
            ${producto.precio_anterior ? `<div class="price-old">$${(parseFloat(producto.precio_anterior) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>` : ''}
        </div>
        <button
            class="btn-add-cart"
            data-id="${producto.id}"
            data-nombre="${nombreEscaped}"
            data-precio="${producto.precio}"
            data-imagen="${imagenSrc}"
            data-slug="${producto.slug || ''}"
            type="button"
            aria-label="Agregar ${producto.nombre} al carrito"
        >
            🛒 Agregar
        </button>
        </div>
    </div>
    </div>
`;
}

/**
 * Agregar producto al carrito
 * (Se mantiene función pública; carrito debe existir globalmente)
 */
function agregarAlCarrito(id, nombre, precio, imagen, slug) {
  // nombre puede venir codificado por dataset; ya lo decodificamos en el listener
if (!window.carrito || typeof window.carrito.agregar !== 'function') {
    console.warn('Carrito no disponible. Intentando almacenar localmente (temporal).');
    // implementación temporal: guardar en localStorage o mostrar alerta
    const tmp = JSON.parse(localStorage.getItem('tmpCarrito') || '[]');
    tmp.push({ id, nombre, precio, imagen, slug });
    localStorage.setItem('tmpCarrito', JSON.stringify(tmp));
    alert('Producto agregado (modo temporal).');
    return;
}

window.carrito.agregar({ id, nombre, precio, imagen_principal: imagen, slug });
}

/**
 * Inicializar buscador
 */
function inicializarBuscador() {
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

if (!searchInput || !searchBtn) return;

searchBtn.addEventListener('click', realizarBusqueda);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') realizarBusqueda();
});
}

/**
 * Realizar búsqueda
 */
function realizarBusqueda() {
const searchInput = document.getElementById('search-input');
const query = (searchInput && searchInput.value || '').trim();

if (query.length > 0) {
    const url = normHref('/', 'productos.html') + '?buscar=' + encodeURIComponent(query);
    window.location.href = url;
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
    authLink.href = usuario.tipo === 'admin' ? normHref('/admin', 'index.html') : normHref('/', 'perfil.html');

    authLink.addEventListener('click', (e) => {
    if (usuario.tipo !== 'admin') {
        e.preventDefault();
        mostrarMenuUsuario(authLink);
    }
    });
} else {
    authLink.textContent = '👤 Iniciar Sesión';
    authLink.href = normHref('/admin', 'login.html');
}
}

/**
 * Mostrar menú de usuario (cliente)
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
    <a href="${normHref('/', 'perfil.html')}" style="display: block; padding: 0.75rem; color: #374151; border-radius: 0.25rem;">
    👤 Mi Perfil
    </a>
    <a href="${normHref('/', 'mis-pedidos.html')}" style="display: block; padding: 0.75rem; color: #374151; border-radius: 0.25rem;">
    📦 Mis Pedidos
    </a>
    <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid #e5e7eb;">
    <a href="#" onclick="cerrarSesion(); return false;" style="display: block; padding: 0.75rem; color: #ef4444; border-radius: 0.25rem;">
    🚪 Cerrar Sesión
    </a>
`;

document.body.appendChild(menu);

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
    window.location.href = normHref('/', 'index.html');
}
}

// Exportar funciones globales que la app podría necesitar
window.agregarAlCarrito = agregarAlCarrito;
window.cerrarSesion = cerrarSesion;
