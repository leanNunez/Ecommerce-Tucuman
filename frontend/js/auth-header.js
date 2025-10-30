// frontend/js/auth-header.js

/**
 * Actualizar header según estado de autenticación
 */
function actualizarHeaderAuth() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const token = localStorage.getItem('token');
    const authLink = document.getElementById('auth-link');
    
    if (!authLink) return;
    
    const nav = authLink.parentElement;
    
    if (token && usuario.nombre) {
        // Usuario logueado - crear menú dropdown
        crearMenuUsuario(usuario, authLink, nav);
    } else {
        // Usuario no logueado - mostrar login y registro
        authLink.href = 'login.html';
        authLink.innerHTML = '👤 Iniciar Sesión';
        authLink.className = '';
        
        // Mostrar botón de registro
        const btnRegistro = document.querySelector('.btn-registro-nav');
        if (btnRegistro) {
            btnRegistro.style.display = 'inline-block';
        }
        
        // Limpiar menú de usuario si existe
        const userMenuContainer = document.querySelector('.user-menu-container');
        if (userMenuContainer) {
            userMenuContainer.remove();
        }
    }
}

/**
 * Crear menú dropdown de usuario
 */
function crearMenuUsuario(usuario, authLink, nav) {
    // Ocultar botón de registro
    const btnRegistro = document.querySelector('.btn-registro-nav');
    if (btnRegistro) {
        btnRegistro.style.display = 'none';
    }
    
    // Verificar si ya existe el menú
    let userMenuContainer = document.querySelector('.user-menu-container');
    if (userMenuContainer) {
        return; // Ya está creado
    }
    
    // Crear container del menú
    userMenuContainer = document.createElement('div');
    userMenuContainer.className = 'user-menu-container';
    
    // Obtener iniciales del usuario
    const iniciales = obtenerIniciales(usuario.nombre);
    
    // HTML del menú dropdown
    userMenuContainer.innerHTML = `
        <a href="#" class="user-menu-trigger" id="user-menu-trigger">
            <div class="user-avatar">${iniciales}</div>
            <div class="user-info">
                <span class="user-greeting">Hola</span>
                <span class="user-name">${usuario.nombre.split(' ')[0]}</span>
            </div>
            <span class="dropdown-arrow">▼</span>
        </a>
        
        <div class="user-dropdown" id="user-dropdown">
            <div class="dropdown-header">
                <div class="dropdown-user-info">
                    <div class="dropdown-avatar">${iniciales}</div>
                    <div class="dropdown-user-details">
                        <h4>${usuario.nombre}</h4>
                        <p>${usuario.email}</p>
                    </div>
                </div>
            </div>
            
            <div class="dropdown-menu">
                ${usuario.tipo === 'admin' ? `
                    <a href="admin/index.html" class="dropdown-item">
                        <span class="dropdown-item-icon">⚙️</span>
                        <div class="dropdown-item-content">
                            <div class="dropdown-item-title">Panel Admin</div>
                            <div class="dropdown-item-desc">Gestionar tienda</div>
                        </div>
                    </a>
                    <div class="dropdown-divider"></div>
                ` : ''}
                
                <a href="perfil.html" class="dropdown-item">
                    <span class="dropdown-item-icon">👤</span>
                    <div class="dropdown-item-content">
                        <div class="dropdown-item-title">Mi Perfil</div>
                        <div class="dropdown-item-desc">Información personal</div>
                    </div>
                </a>
                
                <a href="mis-pedidos.html" class="dropdown-item">
                    <span class="dropdown-item-icon">📦</span>
                    <div class="dropdown-item-content">
                        <div class="dropdown-item-title">Mis Pedidos</div>
                        <div class="dropdown-item-desc">Ver historial</div>
                    </div>
                </a>
                
                <a href="mis-direcciones.html" class="dropdown-item">
                    <span class="dropdown-item-icon">📍</span>
                    <div class="dropdown-item-content">
                        <div class="dropdown-item-title">Direcciones</div>
                        <div class="dropdown-item-desc">Gestionar envíos</div>
                    </div>
                </a>
                
                <a href="favoritos.html" class="dropdown-item">
                    <span class="dropdown-item-icon">❤️</span>
                    <div class="dropdown-item-content">
                        <div class="dropdown-item-title">Favoritos</div>
                        <div class="dropdown-item-desc">Productos guardados</div>
                    </div>
                </a>
                
                <div class="dropdown-divider"></div>
                
                <a href="#" class="dropdown-item logout" id="logout-dropdown">
                    <span class="dropdown-item-icon">🚪</span>
                    <div class="dropdown-item-content">
                        <div class="dropdown-item-title">Cerrar Sesión</div>
                    </div>
                </a>
            </div>
        </div>
        
        <div class="dropdown-overlay" id="dropdown-overlay"></div>
    `;
    
    // Reemplazar el authLink con el nuevo menú
    authLink.replaceWith(userMenuContainer);
    
    // Inicializar eventos del dropdown
    inicializarDropdown();
}

/**
 * Inicializar eventos del dropdown
 */
function inicializarDropdown() {
    const trigger = document.getElementById('user-menu-trigger');
    const dropdown = document.getElementById('user-dropdown');
    const overlay = document.getElementById('dropdown-overlay');
    const logoutBtn = document.getElementById('logout-dropdown');
    
    if (!trigger || !dropdown || !overlay) return;
    
    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = dropdown.classList.contains('show');
        
        if (isOpen) {
            cerrarDropdown();
        } else {
            abrirDropdown();
        }
    });
    
    // Cerrar al hacer click en overlay
    overlay.addEventListener('click', cerrarDropdown);
    
    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }
    
    // Cerrar al presionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarDropdown();
        }
    });
}

/**
 * Abrir dropdown
 */
function abrirDropdown() {
    const trigger = document.getElementById('user-menu-trigger');
    const dropdown = document.getElementById('user-dropdown');
    const overlay = document.getElementById('dropdown-overlay');
    
    if (trigger && dropdown && overlay) {
        trigger.classList.add('active');
        dropdown.classList.add('show');
        overlay.classList.add('show');
    }
}

/**
 * Cerrar dropdown
 */
function cerrarDropdown() {
    const trigger = document.getElementById('user-menu-trigger');
    const dropdown = document.getElementById('user-dropdown');
    const overlay = document.getElementById('dropdown-overlay');
    
    if (trigger && dropdown && overlay) {
        trigger.classList.remove('active');
        dropdown.classList.remove('show');
        overlay.classList.remove('show');
    }
}

/**
 * Obtener iniciales del nombre
 */
function obtenerIniciales(nombre) {
    if (!nombre) return '?';
    
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
        return palabras[0].charAt(0).toUpperCase();
    }
    
    return (palabras[0].charAt(0) + palabras[palabras.length - 1].charAt(0)).toUpperCase();
}

/**
 * Cerrar sesión
 */
function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', actualizarHeaderAuth);

// Actualizar cuando cambie el localStorage
window.addEventListener('storage', actualizarHeaderAuth);