# Implementación de Autenticación JWT

## Índice

1. [Resumen](#resumen)
2. [Análisis del Código Existente](#análisis-del-código-existente)
3. [Arquitectura de la Solución](#arquitectura-de-la-solución)
4. [Componentes a Crear](#componentes-a-crear)
5. [Flujo de Autenticación](#flujo-de-autenticación)
6. [Especificación de Endpoints](#especificación-de-endpoints)
7. [Estructura de Archivos](#estructura-de-archivos)
8. [Seguridad](#seguridad)
9. [Checklist de Implementación](#checklist-de-implementación)

---

## Resumen

Implementación de autenticación basada en JWT (JSON Web Tokens) para la API REST de comercio electrónico. La solución incluye:

- **Backend**: Librería JWT nativa en PHP (sin dependencias externas)
- **Endpoint**: `POST /api/auth/login` para autenticación
- **Middleware**: Validación de tokens y control de acceso por rol
- **Frontend**: Pantalla de login y protección de rutas en el dashboard

---

## Análisis del Código Existente

### Componentes Relevantes Encontrados

| Archivo | Funcionalidad | Estado |
|---------|---------------|--------|
| `api/index.php` | Router principal | ✅ Ya tiene header `Authorization` en CORS |
| `models/UsuarioDB.php` | Modelo de usuarios | ✅ Ya tiene `verificarCredenciales()` |
| `config/config.php` | Configuración | ✅ Se usará para clave secreta JWT |
| `admin/js/api.js` | Cliente HTTP | ⚠️ Necesita modificación para enviar tokens |

### Método Existente: `verificarCredenciales()`

```php
// models/UsuarioDB.php - Línea 184
public function verificarCredenciales($email, $password)
{
    $usuario = $this->getByEmail($email);
    if ($usuario && password_verify($password, $usuario['password'])) {
        unset($usuario['password']); // Elimina password antes de retornar
        return $usuario;
    }
    return null;
}
```

Este método ya:
- Busca usuario por email
- Verifica password con `password_verify()` (bcrypt)
- Retorna datos del usuario SIN el password
- Retorna `null` si credenciales inválidas

---

## Arquitectura de la Solución

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLUJO DE LOGIN                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  Cliente (Dashboard)                    Servidor (API PHP)
  ═══════════════════                    ═══════════════════
         │                                      │
         │  POST /api/auth/login                │
         │  {email, password}                   │
         │─────────────────────────────────────>│
         │                                      │
         │                              ┌───────┴───────┐
         │                              │ AuthController │
         │                              │               │
         │                              │ 1. Validar    │
         │                              │    campos     │
         │                              │               │
         │                              │ 2. Verificar  │
         │                              │    credencial │
         │                              │    (UsuarioDB)│
         │                              │               │
         │                              │ 3. Generar    │
         │                              │    JWT        │
         │                              └───────┬───────┘
         │                                      │
         │  {success, token, usuario}           │
         │<─────────────────────────────────────│
         │                                      │
         │  Guardar token en localStorage       │
         │                                      │


┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE PETICIÓN PROTEGIDA                          │
└─────────────────────────────────────────────────────────────────────────────┘

  Cliente (Dashboard)                    Servidor (API PHP)
  ═══════════════════                    ═══════════════════
         │                                      │
         │  GET /api/usuarios                   │
         │  Authorization: Bearer <token>       │
         │─────────────────────────────────────>│
         │                                      │
         │                              ┌───────┴───────┐
         │                              │ AuthMiddleware │
         │                              │               │
         │                              │ 1. Extraer   │
         │                              │    token     │
         │                              │               │
         │                              │ 2. Validar   │
         │                              │    firma     │
         │                              │               │
         │                              │ 3. Verificar │
         │                              │    expiración│
         │                              │               │
         │                              │ 4. Verificar │
         │                              │    rol       │
         │                              └───────┬───────┘
         │                                      │
         │                              ┌───────┴───────┐
         │                              │ Controller    │
         │                              │ (procesa)     │
         │                              └───────┬───────┘
         │                                      │
         │  {success, data}                     │
         │<─────────────────────────────────────│
```

### Estructura JWT

Un token JWT consta de tres partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
└──────────── Header ────────────┘.└──────── Payload ────────┘.└─────────── Signature ───────────┘
```

**Header** (Algoritmo y tipo):
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** (Datos del usuario):
```json
{
  "sub": 1,              // ID del usuario
  "email": "admin@comercio.com",
  "nombre": "Administrador",
  "rol": "admin",
  "iat": 1699900000,     // Issued At (timestamp)
  "exp": 1699986400      // Expiration (timestamp)
}
```

**Signature** (Firma de verificación):
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```

---

## Componentes a Crear

### 1. Librería JWT (`lib/JWT.php`)

**Propósito**: Generar y validar tokens JWT sin dependencias externas.

**Métodos**:

| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `encode()` | `array $payload` | `string` | Genera token JWT |
| `decode()` | `string $token` | `array\|null` | Decodifica y valida token |
| `base64UrlEncode()` | `string $data` | `string` | Codifica en Base64URL |
| `base64UrlDecode()` | `string $data` | `string` | Decodifica Base64URL |

**Configuración**:
- Algoritmo: HS256 (HMAC-SHA256)
- Expiración por defecto: 24 horas
- Clave secreta: Definida en `config/config.php`

---

### 2. AuthController (`controllers/AuthController.php`)

**Propósito**: Manejar el endpoint de login.

**Endpoint**: `POST /api/auth/login`

**Flujo**:
1. Recibir `email` y `password` del body JSON
2. Validar que los campos no estén vacíos
3. Llamar a `UsuarioDB::verificarCredenciales()`
4. Verificar que el usuario esté activo
5. Generar token JWT con datos del usuario
6. Retornar token y datos del usuario

---

### 3. AuthMiddleware (`lib/AuthMiddleware.php`)

**Propósito**: Validar tokens en peticiones protegidas.

**Métodos**:

| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `verificar()` | `array $rolesPermitidos` | `array\|false` | Valida token y rol |
| `getToken()` | - | `string\|null` | Extrae token del header |
| `respuestaNoAutorizado()` | `string $mensaje` | `void` | Responde 401 y termina |

**Header esperado**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

### 4. Configuración JWT (`config/config.php`)

**Nuevas constantes**:

```php
// Clave secreta para firmar tokens JWT (CAMBIAR EN PRODUCCIÓN)
define('JWT_SECRET_KEY', 'tu_clave_secreta_muy_larga_y_segura_cambiar_en_produccion');

// Tiempo de expiración del token en segundos (24 horas)
define('JWT_EXPIRATION', 86400);

// Nombre del emisor del token
define('JWT_ISSUER', 'apiComercio');
```

---

### 5. Frontend: Pantalla de Login (`admin/login.html`)

**Elementos**:
- Formulario con campos email y password
- Botón de submit
- Mensajes de error
- Redirección automática si ya hay sesión

**Diseño**: Consistente con el estilo del dashboard existente.

---

### 6. Frontend: Módulo de Autenticación (`admin/js/auth.js`)

**Funcionalidades**:

| Función | Descripción |
|---------|-------------|
| `login(email, password)` | Envía credenciales y guarda token |
| `logout()` | Elimina token y redirige a login |
| `isAuthenticated()` | Verifica si hay token válido |
| `getToken()` | Obtiene token del localStorage |
| `getUser()` | Obtiene datos del usuario logueado |
| `checkAuth()` | Redirige a login si no hay sesión |

**Almacenamiento**:
- Token: `localStorage.setItem('jwt_token', token)`
- Usuario: `localStorage.setItem('user_data', JSON.stringify(usuario))`

---

### 7. Modificación: Cliente API (`admin/js/api.js`)

**Cambio**: Añadir token a todas las peticiones.

```javascript
// Antes
headers: {
    'Content-Type': 'application/json',
}

// Después
headers: {
    'Content-Type': 'application/json',
    'Authorization': Auth.getToken() ? `Bearer ${Auth.getToken()}` : ''
}
```

---

## Flujo de Autenticación

### Login (Primer acceso)

```
1. Usuario accede a /admin/login.html
2. Introduce email y password
3. Frontend envía POST /api/auth/login
4. Backend valida credenciales
5. Backend genera y retorna JWT
6. Frontend guarda token en localStorage
7. Frontend redirige a /admin/index.html
```

### Petición Autenticada

```
1. Usuario realiza acción en dashboard
2. Frontend añade header Authorization: Bearer <token>
3. Backend extrae y valida token (AuthMiddleware)
4. Si válido y rol permitido → procesa petición
5. Si inválido → retorna 401 Unauthorized
6. Si rol no permitido → retorna 403 Forbidden
```

### Logout

```
1. Usuario hace clic en "Cerrar sesión"
2. Frontend elimina token de localStorage
3. Frontend redirige a /admin/login.html
```

### Token Expirado

```
1. Petición con token expirado
2. Backend retorna 401 con mensaje "Token expirado"
3. Frontend detecta 401
4. Frontend elimina token y redirige a login
```

---

## Especificación de Endpoints

### POST /api/auth/login

**Descripción**: Autentica un usuario y retorna un token JWT.

**Request**:
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
    "email": "admin@comercio.com",
    "password": "password"
}
```

**Response Exitoso (200)**:
```json
{
    "success": true,
    "message": "Login exitoso",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expira_en": 86400,
        "usuario": {
            "id": 1,
            "email": "admin@comercio.com",
            "nombre": "Administrador",
            "rol": "admin"
        }
    }
}
```

**Response Error - Credenciales Inválidas (401)**:
```json
{
    "success": false,
    "error": "Credenciales inválidas"
}
```

**Response Error - Usuario Inactivo (401)**:
```json
{
    "success": false,
    "error": "Usuario inactivo"
}
```

**Response Error - Campos Faltantes (400)**:
```json
{
    "success": false,
    "error": "Email y password son requeridos"
}
```

---

### Protección de Endpoints Existentes

| Endpoint | Método | Protección | Roles Permitidos |
|----------|--------|------------|------------------|
| `/api/auth/login` | POST | ❌ Público | - |
| `/api/productos` | GET | ❌ Público | - |
| `/api/productos` | POST, PUT, DELETE | ✅ Protegido | admin |
| `/api/usuarios` | GET, POST, PUT, DELETE | ✅ Protegido | admin |
| `/api/pedidos` | GET | ✅ Protegido | admin, usuario |
| `/api/pedidos` | POST, PUT, DELETE | ✅ Protegido | admin |

---

## Estructura de Archivos

### Archivos Nuevos a Crear

```
apiComercio/
├── lib/                          # NUEVO - Librerías
│   ├── JWT.php                   # Clase para manejar tokens JWT
│   └── AuthMiddleware.php        # Middleware de autenticación
│
├── controllers/
│   └── AuthController.php        # NUEVO - Controller de autenticación
│
├── admin/
│   ├── login.html                # NUEVO - Página de login
│   └── js/
│       └── auth.js               # NUEVO - Módulo de autenticación JS
│
└── docs/
    └── IMPLEMENTACION_JWT.md     # NUEVO - Esta documentación
```

### Archivos a Modificar

```
apiComercio/
├── config/
│   └── config.php                # Añadir constantes JWT
│
├── api/
│   └── index.php                 # Añadir ruta /auth y middleware
│
└── admin/
    ├── index.html                # Añadir script auth.js y botón logout
    └── js/
        ├── api.js                # Añadir header Authorization
        └── app.js                # Verificar autenticación al iniciar
```

---

## Seguridad

### Medidas Implementadas

1. **Contraseñas hasheadas**: Ya implementado con `password_hash()` (bcrypt)

2. **Tokens firmados**: HMAC-SHA256 previene manipulación

3. **Expiración de tokens**: 24 horas por defecto

4. **Validación de usuario activo**: Se verifica en cada petición

5. **Sin información sensible en token**: No se incluye password

6. **HTTPS recomendado**: Los tokens viajan en headers

### Recomendaciones para Producción

```php
// config/config.php - IMPORTANTE: Cambiar en producción

// Generar una clave segura (mínimo 32 caracteres aleatorios)
define('JWT_SECRET_KEY', 'CAMBIAR_POR_CLAVE_SEGURA_DE_32_CARACTERES_MINIMO');

// Considerar expiración más corta para mayor seguridad
define('JWT_EXPIRATION', 3600); // 1 hora en lugar de 24
```

### Posibles Mejoras Futuras

- [ ] Refresh tokens para renovar sesión
- [ ] Blacklist de tokens revocados
- [ ] Rate limiting en endpoint de login
- [ ] Registro de intentos fallidos
- [ ] 2FA (Autenticación de dos factores)

---

## Checklist de Implementación

### Fase 1: Backend - Librería JWT
- [x] Crear directorio `lib/`
- [x] Crear `lib/JWT.php` con métodos encode/decode
- [x] Añadir constantes JWT a `config/config.php`
- [x] Probar generación y validación de tokens

### Fase 2: Backend - Endpoint Login
- [x] Crear `controllers/AuthController.php`
- [x] Añadir ruta `/auth/login` en `api/index.php`
- [x] Probar endpoint con Postman/curl

### Fase 3: Backend - Middleware
- [x] Crear `lib/AuthMiddleware.php`
- [x] Integrar middleware en `api/index.php`
- [x] Aplicar protección a endpoints según tabla
- [x] Probar acceso con/sin token

### Fase 4: Frontend - Login
- [x] Crear `admin/login.html`
- [x] Crear `admin/js/auth.js`
- [x] Probar flujo de login completo

### Fase 5: Frontend - Integración
- [x] Modificar `admin/js/api.js` para enviar token
- [x] Modificar `admin/js/app.js` para verificar auth
- [x] Añadir botón de logout en `admin/index.html`
- [x] Probar flujo completo de autenticación

### Fase 6: Pruebas Finales
- [x] Probar login con credenciales válidas
- [x] Probar login con credenciales inválidas
- [x] Probar acceso a rutas protegidas sin token
- [x] Probar acceso con token expirado
- [x] Probar restricción por roles
- [x] Probar logout

---

## Datos de Prueba

Usuarios disponibles para testing:

| Email | Password | Rol | Activo |
|-------|----------|-----|--------|
| admin@comercio.com | password | admin | Sí |
| juan@ejemplo.com | password | usuario | Sí |
| maria@ejemplo.com | password | usuario | Sí |
| carlos@ejemplo.com | password | usuario | Sí |

---

## Comandos de Prueba

### Probar Login con curl

```bash
curl -X POST http://localhost/apiComercio/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@comercio.com","password":"password"}'
```

### Probar Endpoint Protegido

```bash
curl -X GET http://localhost/apiComercio/api/usuarios \
  -H "Authorization: Bearer <TOKEN_AQUI>"
```

---

*Documento creado: Fase 2 del Plan de Dashboard*
*Última actualización: 2026-02-05*
