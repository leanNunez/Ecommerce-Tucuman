/* auth-header.js - parcheado: normaliza rutas y evita "admin//admin" duplicadas */

/**
 * Normalizador de hrefs robusto
 * - Une las partes, elimina slashes duplicados
 * - Conserva URLs absolutas (http://..., https://...)
 * - Permite '#' y hashes
 */
function normHref(...parts) {
  // caso hash o anchor
  if (parts.length === 1 && (parts[0] === '#' || String(parts[0]).startsWith('#'))) return parts[0];

  // si nos pasan una URL absoluta completa
  if (parts.length === 1 && /^https?:\/\//i.test(parts[0])) {
    // limpiar posibles // extras pero preservar ://
    return String(parts[0]).replace(/([^:]?)\/\/+/, (m, p1) => p1 + '/').replace(/([^:]?)\/\/+/, (m, p1) => p1 + '/');
  }

  // unir partes y limpiar // repetidos
  const joined = parts
    .map(p => (p == null ? '' : String(p)))
    .filter(p => p !== '')
    .join('/');

  let cleaned = joined.replace(/\/+/g, '/');

  // evitar convertir "http:/" en algo incorrecto (no es común aquí pero por precaución)
  cleaned = cleaned.replace(':/', '://');

  // asegurar leading slash para que sea absoluta desde la raíz
  if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;

  return cleaned;
}

/**
 * Obtener la ruta base.
 * Por defecto devuelve rutas absolutas desde la raíz (recomendado).
 * Si necesitás deploy en subcarpeta, podés cambiarlo a rutas relativas.
 */
function obtenerRutaBase() {
  return {
    paraRaiz: '/',      // ej. /perfil.html
    paraAdmin: '/admin/' // ej. /admin/index.html
  };
}

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
    authLink.href = normHref(obtenerRutaBase().paraRaiz, 'login.html');
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
 * Crear menú dropdown de usuario (usa normHref para todos los hrefs)
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

  // Obtener rutas base
  const rutas = obtenerRutaBase();

  // Construir las URLs según el tipo de usuario
  let menuItems = '';

  if (usuario.tipo === 'admin') {
    // ADMIN - siempre va a páginas de admin
    menuItems = `
      <a href="${normHref(rutas.paraAdmin, 'index.html')}" class="dropdown-item">
          <span class="dropdown-item-icon">📊</span>
          <div class="dropdown-item-content">
              <div class="dropdown-item-title">Panel Admin</div>
              <div class="dropdown-item-desc">Dashboard principal</div>
          </div>
      </a>
      
      <a href="${normHref(rutas.paraAdmin, 'perfil.html')}" class="dropdown-item">
          <span class="dropdown-item-icon">👤</span>
          <div class="dropdown-item-content">
              <div class="dropdown-item-title">Mi Perfil</div>
              <div class="dropdown-item-desc">Información personal</div>
          </div>
      </a>
      
      <a href="${normHref(rutas.paraAdmin, 'productos.html')}" class="dropdown-item">
          <span class="dropdown-item-icon">📦</span>
          <div class="dropdown-item-content">
              <div class="dropdown-item-title">Gestionar Productos</div>
              <div class="dropdown-item-desc">CRUD de productos</div>
          </div>
      </a>
      
      <a href="${normHref(rutas.paraAdmin, 'pedidos.html')}" class="dropdown-item">
          <span class="dropdown-item-icon">🛒</span>
          <div class="dropdown-item-content">
              <div class="dropdown-item-title">Pedidos</div>
              <div class="dropdown-item-desc">Gestionar pedidos</div>
          </div>
      </a>
    `;
  } else {
    // CLIENTE - va a páginas de cliente
    menuItems = `
      <a href="${normHref(rutas.paraRaiz, 'perfil.html')}" class="dropdown-item">
          <span class="dropdown-item-icon">👤</span>
          <div class="dropdown-item-content">
              <div class="dropdown-item-title">Mi Perfil</div>
              <div class="dropdown-item-desc">Información personal</div>
          </div>
      </a>
      
      <a href="${normHref(rutas.paraRaiz, 'mis-pedidos.html')}" class="dropdown-item">
          <span class="dropdown-item-icon">📦</span>
          <div class="dropdown-item-content">
              <div class="dropdown-item-title">Mis Pedidos</div>
              <div class="dropdown-item-desc">Ver historial</div>
          </div>
      </a>
      
      <a href="${normHref(rutas.paraRaiz, 'mis-direcciones.html')}" class="dropdown-item">
          <span class="dropdown-item-icon">📍</span>
          <div class="dropdown-item-content">
              <div class="dropdown-item-title">Direcciones</div>
              <div class="dropdown-item-desc">Gestionar envíos</div>
          </div>
      </a>
      
      <a href="${normHref(rutas.paraRaiz, 'favoritos.html')}" class="dropdown-item">
          <span class="dropdown-item-icon">❤️</span>
          <div class="dropdown-item-content">
              <div class="dropdown-item-title">Favoritos</div>
              <div class="dropdown-item-desc">Productos guardados</div>
          </div>
      </a>
    `;
  }

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
              ${menuItems}
              
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

/** Abrir dropdown */
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

/** Cerrar dropdown */
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

/** Obtener iniciales del nombre */
function obtenerIniciales(nombre) {
  if (!nombre) return '?';

  const palabras = nombre.trim().split(' ');
  if (palabras.length === 1) {
    return palabras[0].charAt(0).toUpperCase();
  }

  return (palabras[0].charAt(0) + palabras[palabras.length - 1].charAt(0)).toUpperCase();
}

/** Cerrar sesión */
function cerrarSesion() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    // redirigir a la raíz
    window.location.href = normHref(obtenerRutaBase().paraRaiz, 'index.html');
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', actualizarHeaderAuth);

// Actualizar cuando cambie el localStorage
window.addEventListener('storage', actualizarHeaderAuth);
