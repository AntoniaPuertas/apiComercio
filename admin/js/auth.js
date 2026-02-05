/**
 * Auth - Modulo de autenticacion para el dashboard
 *
 * Maneja el login, logout, almacenamiento del token JWT
 * y verificacion de sesion.
 *
 * Uso:
 *   Auth.login(email, password)  - Iniciar sesion
 *   Auth.logout()                - Cerrar sesion
 *   Auth.isAuthenticated()       - Verificar si hay sesion
 *   Auth.getToken()              - Obtener token JWT
 *   Auth.getUser()               - Obtener datos del usuario
 *   Auth.checkAuth()             - Redirigir a login si no hay sesion
 *
 * @author API Comercio
 * @version 1.0
 */

const Auth = {
    // =========================================
    // Configuracion
    // =========================================

    // URL base de la API
    baseUrl: '/apiComercio/api',

    // Claves de localStorage
    TOKEN_KEY: 'jwt_token',
    USER_KEY: 'user_data',

    // =========================================
    // Metodos de Autenticacion
    // =========================================

    /**
     * Inicia sesion con email y password
     *
     * @param {string} email - Email del usuario
     * @param {string} password - Password del usuario
     * @returns {Promise<object>} Datos del usuario logueado
     * @throws {Error} Si las credenciales son invalidas
     */
    async login(email, password) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Error al iniciar sesion');
        }

        // Guardar token y datos del usuario
        this.setToken(data.data.token);
        this.setUser(data.data.usuario);

        return data.data.usuario;
    },

    /**
     * Cierra la sesion actual
     * Elimina el token y datos del usuario del localStorage
     */
    logout() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');

        // Redirigir a login (raiz del proyecto)
        window.location.href = '/apiComercio/login.html';
    },

    /**
     * Verifica si el usuario esta autenticado
     *
     * @returns {boolean} true si hay un token valido
     */
    isAuthenticated() {
        const token = this.getToken();

        if (!token) {
            return false;
        }

        // Verificar si el token ha expirado (decodificando el payload)
        try {
            const payload = this.decodeToken(token);

            if (!payload || !payload.exp) {
                return false;
            }

            // Verificar expiracion (exp esta en segundos)
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                // Token expirado - limpiar datos
                this.clearAuth();
                return false;
            }

            return true;

        } catch (e) {
            this.clearAuth();
            return false;
        }
    },

    /**
     * Verifica autenticacion y redirige a login si no hay sesion
     * Usar al inicio de paginas protegidas
     */
    checkAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/apiComercio/login.html';
            return false;
        }
        return true;
    },

    /**
     * Verifica si el usuario actual tiene rol de admin
     *
     * @returns {boolean} true si el usuario es admin
     */
    isAdmin() {
        const user = this.getUser();
        return user && user.rol === 'admin';
    },

    // =========================================
    // Gestion de Token
    // =========================================

    /**
     * Obtiene el token JWT del localStorage
     *
     * @returns {string|null} Token JWT o null si no existe
     */
    getToken() {
        return localStorage.getItem('jwt_token');
    },

    /**
     * Guarda el token JWT en localStorage
     *
     * @param {string} token - Token JWT
     */
    setToken(token) {
        localStorage.setItem('jwt_token', token);
    },

    /**
     * Decodifica el payload del token JWT
     * NOTA: Esto NO valida la firma, solo extrae el payload
     *
     * @param {string} token - Token JWT
     * @returns {object|null} Payload decodificado o null si es invalido
     */
    decodeToken(token) {
        try {
            // El token tiene formato: header.payload.signature
            const parts = token.split('.');

            if (parts.length !== 3) {
                return null;
            }

            // Decodificar el payload (segunda parte)
            // Convertir Base64URL a Base64 estandar
            let payload = parts[1];
            payload = payload.replace(/-/g, '+').replace(/_/g, '/');

            // Añadir padding si es necesario
            const padding = payload.length % 4;
            if (padding) {
                payload += '='.repeat(4 - padding);
            }

            // Decodificar y parsear JSON
            const decoded = atob(payload);
            return JSON.parse(decoded);

        } catch (e) {
            console.error('Error decodificando token:', e);
            return null;
        }
    },

    // =========================================
    // Gestion de Usuario
    // =========================================

    /**
     * Obtiene los datos del usuario del localStorage
     *
     * @returns {object|null} Datos del usuario o null si no existe
     */
    getUser() {
        const userData = localStorage.getItem('user_data');

        if (!userData) {
            return null;
        }

        try {
            return JSON.parse(userData);
        } catch (e) {
            return null;
        }
    },

    /**
     * Guarda los datos del usuario en localStorage
     *
     * @param {object} user - Datos del usuario
     */
    setUser(user) {
        localStorage.setItem('user_data', JSON.stringify(user));
    },

    // =========================================
    // Utilidades
    // =========================================

    /**
     * Limpia todos los datos de autenticacion
     */
    clearAuth() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
    },

    /**
     * Obtiene el tiempo restante de la sesion en segundos
     *
     * @returns {number} Segundos restantes, 0 si expirado o sin sesion
     */
    getTimeRemaining() {
        const token = this.getToken();

        if (!token) {
            return 0;
        }

        try {
            const payload = this.decodeToken(token);

            if (!payload || !payload.exp) {
                return 0;
            }

            const now = Math.floor(Date.now() / 1000);
            const remaining = payload.exp - now;

            return Math.max(0, remaining);

        } catch (e) {
            return 0;
        }
    },

    /**
     * Formatea el tiempo restante en formato legible
     *
     * @returns {string} Tiempo formateado (ej: "23h 45m")
     */
    getTimeRemainingFormatted() {
        const seconds = this.getTimeRemaining();

        if (seconds <= 0) {
            return 'Expirado';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }

        return `${minutes}m`;
    }
};
