// frontend/js/productos.js

/**
 * Estado de la página de productos
 */
let estadoProductos = {
    categoriaActual: null,
    busqueda: null,
    ordenActual: 'recientes',
    paginaActual: 0,
    limite: 12,
    filtros: {
        precio: null
    }
};

/**
 * Inicialización
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔵 Página de productos cargada');
    
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    estadoProductos.categoriaActual = urlParams.get('categoria');
    estadoProductos.busqueda = urlParams.get('buscar');
    
    console.log('🔵 Parámetros URL:', { 
        categoria: estadoProductos.categoriaActual, 
        busqueda: estadoProductos.busqueda 
    });
    
    await cargarCategoriasParaFiltro();
    await cargarProductos();
    inicializarFiltros();
    inicializarOrdenamiento();
    inicializarBuscador();
});

/**
 * Cargar categorías para el filtro
 */
async function cargarCategoriasParaFiltro() {
    const container = document.getElementById('filtro-categorias');
    if (!container) return;
    
    try {
        const response = await API.get('/categorias');
        
        if (response.success) {
            container.innerHTML = `
                <label>
                    <input type="radio" name="categoria" value="" ${!estadoProductos.categoriaActual ? 'checked' : ''}>
                    Todas las categorías
                </label>
                ${response.data.map(categoria => `
                    <label>
                        <input type="radio" name="categoria" value="${categoria.slug}" 
                               ${estadoProductos.categoriaActual === categoria.slug ? 'checked' : ''}>
                        ${categoria.nombre} (${categoria.total_productos})
                    </label>
                `).join('')}
            `;
            
            // Agregar evento a los radio buttons
            container.querySelectorAll('input[name="categoria"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    estadoProductos.categoriaActual = e.target.value || null;
                    estadoProductos.paginaActual = 0;
                    cargarProductos();
                });
            });
        }
    } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
    }
}

/**
 * Cargar productos con filtros
 */
async function cargarProductos() {
    const container = document.getElementById('productos-grid');
    const loading = document.getElementById('loading');
    const sinResultados = document.getElementById('sin-resultados');
    const productosCount = document.getElementById('productos-count');
    const productosTitulo = document.getElementById('productos-titulo');
    
    if (!container) return;
    
    // Mostrar loading
    loading.style.display = 'block';
    container.innerHTML = '';
    sinResultados.style.display = 'none';
    
    try {
        console.log('🔵 Cargando productos...');
        
        // Si hay búsqueda, usar endpoint de búsqueda
        if (estadoProductos.busqueda) {
            const response = await API.get('/productos/buscar', {
                q: estadoProductos.busqueda
            });
            
            loading.style.display = 'none';
            
            console.log('🔵 Resultados de búsqueda:', response);
            
            if (response.success && response.data.length > 0) {
                container.innerHTML = response.data.map(producto => 
                    crearTarjetaProducto(producto)
                ).join('');
                
                productosCount.textContent = `${response.total} resultados`;
                productosTitulo.textContent = `Resultados para "${estadoProductos.busqueda}"`;
            } else {
                sinResultados.style.display = 'block';
                productosCount.textContent = '0 resultados';
            }
            
            return;
        }
        
        // Construir parámetros para productos normales
        const params = {
            limit: estadoProductos.limite,
            offset: estadoProductos.paginaActual * estadoProductos.limite,
            orden: estadoProductos.ordenActual
        };
        
        if (estadoProductos.categoriaActual) {
            params.categoria = estadoProductos.categoriaActual;
        }
        
        console.log('🔵 Parámetros de consulta:', params);
        
        const response = await API.get('/productos', params);
        
        loading.style.display = 'none';
        
        console.log('🔵 Productos recibidos:', response);
        
        if (response.success && response.data.length > 0) {
            container.innerHTML = response.data.map(producto => 
                crearTarjetaProducto(producto)
            ).join('');
            
            // Actualizar título
            if (estadoProductos.categoriaActual) {
                const categoriaNombre = response.data[0]?.categoria_nombre || 'Productos';
                productosTitulo.textContent = categoriaNombre;
            } else {
                productosTitulo.textContent = 'Todos los Productos';
            }
            
            // Actualizar contador
            productosCount.textContent = `${response.pagination.total} productos`;
            
            // Renderizar paginación
            renderizarPaginacion(response.pagination);
            
            // Aplicar filtro de precio si existe
            if (estadoProductos.filtros.precio) {
                aplicarFiltrosCliente();
            }
        } else {
            sinResultados.style.display = 'block';
            productosCount.textContent = '0 productos';
        }
        
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        loading.style.display = 'none';
        container.innerHTML = '<p style="text-align: center; padding: 2rem; grid-column: 1/-1;">Error al cargar productos. Por favor, intenta de nuevo.</p>';
    }
}

/**
 * Inicializar filtros
 */
function inicializarFiltros() {
    // Filtro de precio
    const precioRadios = document.querySelectorAll('input[name="precio"]');
    precioRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            estadoProductos.filtros.precio = e.target.value || null;
            aplicarFiltrosCliente();
        });
    });
    
    // Botón limpiar filtros
    const btnLimpiar = document.getElementById('limpiar-filtros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            // Resetear filtros
            estadoProductos.categoriaActual = null;
            estadoProductos.busqueda = null;
            estadoProductos.filtros.precio = null;
            estadoProductos.paginaActual = 0;
            estadoProductos.ordenActual = 'recientes';
            
            // Resetear controles
            document.querySelectorAll('input[name="categoria"]')[0].checked = true;
            document.querySelectorAll('input[name="precio"]')[0].checked = true;
            document.getElementById('orden-select').value = 'recientes';
            
            // Limpiar URL
            window.history.pushState({}, '', 'productos.html');
            
            cargarProductos();
        });
    }
}

/**
 * Aplicar filtros del lado del cliente (precio)
 */
function aplicarFiltrosCliente() {
    const productos = document.querySelectorAll('.product-card');
    let visibles = 0;
    
    productos.forEach(card => {
        const precioElement = card.querySelector('.price-current');
        if (!precioElement) return;
        
        const precioTexto = precioElement.textContent.replace(/[^0-9.,]/g, '').replace(',', '.');
        const precio = parseFloat(precioTexto);
        let mostrar = true;
        
        // Filtro de precio
        if (estadoProductos.filtros.precio) {
            const [min, max] = estadoProductos.filtros.precio.split('-').map(Number);
            mostrar = precio >= min && precio <= max;
        }
        
        card.style.display = mostrar ? 'block' : 'none';
        if (mostrar) visibles++;
    });
    
    // Actualizar contador
    document.getElementById('productos-count').textContent = `${visibles} productos`;
    
    // Mostrar mensaje si no hay resultados
    const sinResultados = document.getElementById('sin-resultados');
    const container = document.getElementById('productos-grid');
    
    if (visibles === 0) {
        sinResultados.style.display = 'block';
        container.style.display = 'none';
    } else {
        sinResultados.style.display = 'none';
        container.style.display = 'grid';
    }
}

/**
 * Inicializar ordenamiento
 */
function inicializarOrdenamiento() {
    const ordenSelect = document.getElementById('orden-select');
    if (!ordenSelect) return;
    
    ordenSelect.addEventListener('change', (e) => {
        estadoProductos.ordenActual = e.target.value;
        estadoProductos.paginaActual = 0;
        cargarProductos();
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
 * Renderizar paginación
 */
function renderizarPaginacion(pagination) {
    const container = document.getElementById('paginacion');
    if (!container) return;
    
    const { total, limit, offset, pages } = pagination;
    const paginaActual = Math.floor(offset / limit) + 1;
    
    if (pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button ${paginaActual === 1 ? 'disabled' : ''} 
                onclick="cambiarPagina(${paginaActual - 1})">
            ← Anterior
        </button>
    `;
    
    // Botones de páginas
    const maxBotones = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(pages, inicio + maxBotones - 1);
    
    if (fin - inicio < maxBotones - 1) {
        inicio = Math.max(1, fin - maxBotones + 1);
    }
    
    if (inicio > 1) {
        html += `<button onclick="cambiarPagina(1)">1</button>`;
        if (inicio > 2) {
            html += `<span style="padding: 0.75rem;">...</span>`;
        }
    }
    
    for (let i = inicio; i <= fin; i++) {
        html += `
            <button class="${i === paginaActual ? 'active' : ''}" 
                    onclick="cambiarPagina(${i})">
                ${i}
            </button>
        `;
    }
    
    if (fin < pages) {
        if (fin < pages - 1) {
            html += `<span style="padding: 0.75rem;">...</span>`;
        }
        html += `<button onclick="cambiarPagina(${pages})">${pages}</button>`;
    }
    
    html += `
        <button ${paginaActual === pages ? 'disabled' : ''} 
                onclick="cambiarPagina(${paginaActual + 1})">
            Siguiente →
        </button>
    `;
    
    container.innerHTML = html;
}

/**
 * Cambiar de página
 */
function cambiarPagina(pagina) {
    estadoProductos.paginaActual = pagina - 1;
    cargarProductos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Crear HTML de tarjeta de producto (igual que en main.js)
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

// Hacer funciones disponibles globalmente
window.cambiarPagina = cambiarPagina;
window.agregarAlCarrito = agregarAlCarrito;