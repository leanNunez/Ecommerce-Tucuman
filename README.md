# 🛒 E-commerce Tucumán

<div align="center">

![E-commerce Banner](https://img.shields.io/badge/E--commerce-Tucumán-4F46E5?style=for-the-badge&logo=shopping-cart&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Plataforma de comercio electrónico completa desarrollada con Node.js y MySQL**

[Demo en Vivo](#) • [Documentación](#características) • [Instalación](#instalación) • [Contribuir](#contribución)

</div>

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## ✨ Características

### 🎯 Funcionalidades Principales

- **🛍️ Catálogo de Productos**
  - Visualización de productos con imágenes, precios y descripciones
  - Filtrado por categorías
  - Búsqueda inteligente en tiempo real
  - Sistema de paginación

- **🛒 Carrito de Compras**
  - Agregar/eliminar productos
  - Actualizar cantidades
  - Persistencia con LocalStorage
  - Cálculo automático de totales y envío

- **💳 Sistema de Checkout**
  - Formulario completo de datos de envío
  - Múltiples métodos de pago (Efectivo, Transferencia, Mercado Pago)
  - Validación de datos en tiempo real
  - Generación de número de pedido único

- **👥 Gestión de Usuarios**
  - Registro e inicio de sesión
  - Autenticación con JWT
  - Perfiles de usuario
  - Sistema de roles (Admin/Usuario)

- **📊 Panel de Administración**
  - Gestión completa de productos (CRUD)
  - Administración de pedidos
  - Actualización de estados de pedido
  - Dashboard con estadísticas
  - Sistema de categorías

- **📱 Diseño Responsive**
  - Optimizado para dispositivos móviles
  - Interfaz moderna y atractiva
  - Experiencia de usuario fluida

---

## 🛠️ Tecnologías

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MySQL2** - Base de datos relacional
- **JWT** - Autenticación segura
- **bcrypt** - Encriptación de contraseñas
- **dotenv** - Variables de entorno

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos y responsive
- **JavaScript (ES6+)** - Interactividad
- **Fetch API** - Comunicación con backend

### Base de Datos
- **MySQL 8.0** - Sistema de gestión de base de datos

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (v18 o superior)
- [MySQL](https://www.mysql.com/) (v8.0 o superior)
- [Git](https://git-scm.com/)
- Un editor de código (recomendado: [VS Code](https://code.visualstudio.com/))

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/leanNunez/Ecommerce-Tucuman
cd ecommerce-tucuman
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Configurar la base de datos

```bash
# Inicia sesión en MySQL
mysql -u root -p

# Ejecuta el script de creación de base de datos
source backend/database/schema.sql
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=ecommerce_tucuman
DB_PORT=3306

# JWT
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:5500
```

### 5. Iniciar el servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### 6. Abrir el frontend

Abre el archivo `index.html` con un servidor local (como Live Server de VS Code) o accede a:

```
http://localhost:5500
```

---

## ⚙️ Configuración

### Base de Datos

La estructura de la base de datos incluye las siguientes tablas:

- `usuarios` - Información de usuarios
- `categorias` - Categorías de productos
- `productos` - Catálogo de productos
- `pedidos` - Órdenes de compra
- `pedido_detalles` - Items de cada pedido

### Usuario Administrador por Defecto

```
Email: admin@ecommerce.com
Contraseña: admin123
```

> ⚠️ **Importante**: Cambia estas credenciales después de la primera instalación.

---

## 📁 Estructura del Proyecto

```
ecommerce-tucuman/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración de MySQL
│   ├── controllers/
│   │   ├── authController.js    # Autenticación
│   │   ├── productosController.js
│   │   └── pedidosController.js
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticación
│   ├── routes/
│   │   ├── auth.js
│   │   ├── productos.js
│   │   └── pedidos.js
│   ├── database/
│   │   └── schema.sql           # Estructura de BD
│   ├── .env
│   ├── server.js                # Punto de entrada
│   └── package.json
│
├── frontend/
│   ├── css/
│   │   ├── style.css            # Estilos globales
│   │   ├── productos.css        # Página de productos
│   │   ├── checkout.css         # Página de checkout
│   │   └── detalle.css          # Detalle de producto
│   ├── js/
│   │   ├── api.js               # Cliente API
│   │   ├── carrito.js           # Lógica del carrito
│   │   ├── auth-helper.js       # Helpers de autenticación
│   │   └── producto-detalle.js
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── productos.html
│   │   └── pedidos.html
│   ├── index.html
│   ├── productos.html
│   ├── detalle.html
│   ├── carrito.html
│   ├── checkout.html
│   └── login.html
│
└── README.md
```

---

## 🔌 API Endpoints

### Autenticación

```http
POST   /api/auth/register        # Registro de usuario
POST   /api/auth/login           # Inicio de sesión
GET    /api/auth/perfil          # Obtener perfil (requiere token)
```

### Productos

```http
GET    /api/productos            # Listar productos
GET    /api/productos/:id        # Detalle de producto
POST   /api/productos            # Crear producto (admin)
PUT    /api/productos/:id        # Actualizar producto (admin)
DELETE /api/productos/:id        # Eliminar producto (admin)
```

### Pedidos

```http
POST   /api/pedidos              # Crear pedido
GET    /api/pedidos              # Listar pedidos (admin)
GET    /api/pedidos/:id          # Detalle de pedido (admin)
PATCH  /api/pedidos/:id/estado   # Actualizar estado (admin)
GET    /api/pedidos/mis-pedidos  # Mis pedidos (usuario)
```

### Categorías

```http
GET    /api/categorias           # Listar categorías
POST   /api/categorias           # Crear categoría (admin)
PUT    /api/categorias/:id       # Actualizar categoría (admin)
DELETE /api/categorias/:id       # Eliminar categoría (admin)
```

---

## 📸 Capturas de Pantalla

### Página Principal
![Home](/screenshots/home.png)
![Home](/screenshots/home_productosDestacados.png)
![Home](/screenshots/home_footer.png)

### Catálogo de Productos
![Productos](/screenshots/productos00.png)
![Productos](/screenshots/productos01.png)
![Productos](/screenshots/productos02.png)

### Carrito de Compras
![Carrito](/screenshots/carrito_vacio.png)
![Carrito](/screenshots/carrito_conStock.png)
![Carrito](/screenshots/finalizar_compra00.png)
![Carrito](/screenshots/finalizar_compra01.png)
![Carrito](/screenshots/finalizar_compra02.png)
![Carrito](/screenshots/finalizar_compra03.png)

### Panel de Administración
![Admin](/screenshots/panel_administracion.png)

---

## 🗺️ Roadmap

### Versión 1.1 (En desarrollo)
- [ ] Integración con Mercado Pago
- [ ] Sistema de reseñas de productos
- [ ] Wishlist de productos favoritos
- [ ] Recuperación de contraseña por email

### Versión 1.2 (Planificado)
- [ ] Sistema de cupones de descuento
- [ ] Tracking de pedidos en tiempo real
- [ ] Notificaciones push
- [ ] Chat de soporte en vivo

### Versión 2.0 (Futuro)
- [ ] Aplicación móvil (React Native)
- [ ] Sistema de puntos de fidelidad
- [ ] Múltiples vendedores (Marketplace)
- [ ] Integración con redes sociales

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas contribuir:

1. 🍴 Fork el proyecto
2. 🔀 Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. 💾 Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. 📤 Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. 🔃 Abre un Pull Request

### Código de Conducta

Por favor, lee nuestro [Código de Conducta](CODE_OF_CONDUCT.md) antes de contribuir.

---

## 🐛 Reportar Bugs

Si encuentras un bug, por favor:

1. Verifica que no esté ya reportado en [Issues](https://github.com/tu-usuario/ecommerce-tucuman/issues)
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducirlo
   - Comportamiento esperado vs actual
   - Screenshots (si aplica)
   - Información del sistema

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2024 E-commerce Tucumán

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👨‍💻 Autor

**Leandro Nuñez**

- 📧 Email: leandro_castillero@hotmail.es
- 💼 LinkedIn: [Leandro Nuñez](https://www.linkedin.com/in/lean-nunez)
- 🐙 GitHub: [@leanNunez](https://github.com/leanNunez)

---

## 🙏 Agradecimientos

- Comunidad de Node.js
- Documentación de Express.js
- Stack Overflow
- Todos los contribuidores

---

## 📞 Contacto

¿Tienes preguntas o sugerencias? 

- 📧 Email: leandro_castillero@hotmail.es
---

<div align="center">

**⭐ Si te gustó este proyecto, dale una estrella! ⭐**

Hecho con ❤️ en Tucumán, Argentina

![Tucumán](https://img.shields.io/badge/Made%20in-Tucumán,%20Argentina-1E90FF?style=for-the-badge)

</div>
