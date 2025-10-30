// frontend/js/producto-detalle.js

/**
 * Objeto para manejar la API de productos
 */
const ProductoAPI = {
    /**
     * Obtener un producto por ID o slug
     */
    async obtenerPorId(id) {
        try {
            const response = await API.get(`/productos/${id}`);
            // El backend devuelve { success: true, data: {...} }
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Error al obtener producto:', error);
            return null;
        }
    }
};

/**
 * Obtener parámetros de la URL
 */
function obtenerParametroURL(parametro) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(parametro);
}

/**
 * Cargar y mostrar el producto
 */
async function cargarProducto() {
    const productoId = obtenerParametroURL('id');
    
    if (!productoId) {
        mostrarError();
        return;
    }

    try {
        // Mostrar loading
        document.getElementById('loading').style.display = 'block';
        
        // Obtener el producto desde la API
        const producto = await ProductoAPI.obtenerPorId(productoId);
        
        if (!producto) {
            mostrarError();
            return;
        }

        // Renderizar el producto
        renderizarProducto(producto);
        
        // Ocultar loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('producto-detalle').style.display = 'flex';
        
    } catch (error) {
        console.error('Error al cargar producto:', error);
        mostrarError();
    }
}

/**
 * Renderizar producto en la página
 */
function renderizarProducto(producto) {
    // Breadcrumb
    document.getElementById('breadcrumb-producto').textContent = producto.nombre;
    
    // Título de la página
    document.title = `${producto.nombre} - E-commerce Tucumán`;
    
    // Nombre
    document.getElementById('producto-nombre').textContent = producto.nombre;
    
    // Precio
    const precioFormateado = parseFloat(producto.precio).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    document.getElementById('producto-precio').textContent = `$${precioFormateado}`;
    
    // Descripción
    document.getElementById('producto-descripcion').textContent = 
        producto.descripcion || 'Este producto no tiene descripción disponible.';
    
    // Imagen principal
    const imagenPrincipal = producto.imagen_principal || 'img/placeholder.jpg';
    document.getElementById('imagen-principal').src = imagenPrincipal;
    document.getElementById('imagen-principal').alt = producto.nombre;
    
    // Imágenes thumbnail
    renderizarThumbnails(producto);
    
    // Stock
    renderizarStock(producto);
    
    // Especificaciones
    renderizarEspecificaciones(producto);
    
    // Configurar botón de agregar al carrito
    configurarBotonAgregar(producto);
    
    // Configurar controles de cantidad
    configurarControlesCantidad();
}

/**
 * Renderizar thumbnails de imágenes
 */
function renderizarThumbnails(producto) {
    const thumbnailsContainer = document.getElementById('imagenes-thumbnail');
    const imagenes = [];
    
    // Agregar imagen principal
    if (producto.imagen_principal) {
        imagenes.push(producto.imagen_principal);
    }
    
    // Agregar imágenes adicionales si existen
    if (producto.imagenes && Array.isArray(producto.imagenes)) {
        imagenes.push(...producto.imagenes);
    }
    
    // Si no hay imágenes, usar placeholder
    if (imagenes.length === 0) {
        imagenes.push('img/placeholder.jpg');
    }
    
    thumbnailsContainer.innerHTML = imagenes.map((img, index) => `
        <img src="${img}" 
             alt="${producto.nombre} - imagen ${index + 1}"
             class="thumbnail ${index === 0 ? 'active' : ''}"
             onclick="cambiarImagenPrincipal('${img}', this)"
             onerror="this.src='img/placeholder.jpg'">
    `).join('');
}

/**
 * Cambiar imagen principal
 */
function cambiarImagenPrincipal(src, thumbnail) {
    document.getElementById('imagen-principal').src = src;
    
    // Actualizar thumbnail activo
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}

/**
 * Renderizar información de stock
 */
function renderizarStock(producto) {
    const stockContainer = document.getElementById('producto-stock');
    const stock = parseInt(producto.stock) || 0;
    
    if (stock > 10) {
        stockContainer.innerHTML = '<span class="stock-disponible">✅ Stock disponible</span>';
    } else if (stock > 0) {
        stockContainer.innerHTML = `<span class="stock-bajo">⚠️ Últimas ${stock} unidades</span>`;
    } else {
        stockContainer.innerHTML = '<span class="stock-agotado">❌ Sin stock</span>';
        document.getElementById('btn-agregar-carrito').disabled = true;
        document.getElementById('btn-agregar-carrito').textContent = 'Sin stock';
    }
}

/**
 * Renderizar especificaciones
 */
function renderizarEspecificaciones(producto) {
    const especificacionesContainer = document.getElementById('producto-especificaciones');
    const especificaciones = [];
    
    // Agregar categoría si existe
    if (producto.categoria) {
        especificaciones.push(`<li><strong>Categoría:</strong> ${producto.categoria}</li>`);
    }
    
    // Agregar marca si existe
    if (producto.marca) {
        especificaciones.push(`<li><strong>Marca:</strong> ${producto.marca}</li>`);
    }
    
    // Agregar SKU o ID
    especificaciones.push(`<li><strong>SKU:</strong> ${producto.id}</li>`);
    
    // Si hay especificaciones adicionales
    if (producto.especificaciones && typeof producto.especificaciones === 'object') {
        Object.entries(producto.especificaciones).forEach(([key, value]) => {
            especificaciones.push(`<li><strong>${key}:</strong> ${value}</li>`);
        });
    }
    
    especificacionesContainer.innerHTML = especificaciones.join('');
}

/**
 * Configurar botón de agregar al carrito
 */
function configurarBotonAgregar(producto) {
    const btnAgregar = document.getElementById('btn-agregar-carrito');
    
    btnAgregar.addEventListener('click', () => {
        const cantidad = parseInt(document.getElementById('cantidad').value) || 1;
        
        // Agregar al carrito tantas veces como cantidad se haya seleccionado
        for (let i = 0; i < cantidad; i++) {
            carrito.agregar(producto);
        }
        
        // Resetear cantidad a 1
        document.getElementById('cantidad').value = 1;
        
        // Opcional: Redirigir al carrito después de un delay
        setTimeout(() => {
            const irAlCarrito = confirm('Producto agregado. ¿Deseas ir al carrito?');
            if (irAlCarrito) {
                window.location.href = 'carrito.html';
            }
        }, 500);
    });
}

/**
 * Configurar controles de cantidad
 */
function configurarControlesCantidad() {
    const inputCantidad = document.getElementById('cantidad');
    const btnDecrementar = document.getElementById('btn-decrementar');
    const btnIncrementar = document.getElementById('btn-incrementar');
    
    btnDecrementar.addEventListener('click', () => {
        const valorActual = parseInt(inputCantidad.value) || 1;
        if (valorActual > 1) {
            inputCantidad.value = valorActual - 1;
        }
    });
    
    btnIncrementar.addEventListener('click', () => {
        const valorActual = parseInt(inputCantidad.value) || 1;
        const max = parseInt(inputCantidad.max) || 99;
        if (valorActual < max) {
            inputCantidad.value = valorActual + 1;
        }
    });
    
    // Validar input manual
    inputCantidad.addEventListener('change', () => {
        let valor = parseInt(inputCantidad.value) || 1;
        const min = parseInt(inputCantidad.min) || 1;
        const max = parseInt(inputCantidad.max) || 99;
        
        if (valor < min) valor = min;
        if (valor > max) valor = max;
        
        inputCantidad.value = valor;
    });
}

/**
 * Mostrar mensaje de error
 */
function mostrarError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('producto-detalle').style.display = 'none';
}

/**
 * Inicializar página al cargar
 */
document.addEventListener('DOMContentLoaded', () => {
    cargarProducto();
});

// Hacer funciones disponibles globalmente
window.cambiarImagenPrincipal = cambiarImagenPrincipal;