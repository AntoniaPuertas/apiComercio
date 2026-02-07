/**
 * Tienda API - Extensiones del API client para la tienda
 * Extiende el objeto API definido en admin/js/api.js
 */

// Metodos de autenticacion para la tienda
API.auth = {
    async login(email, password) {
        return API.post('/auth/login', { email, password });
    },

    async register(email, nombre, password) {
        return API.post('/auth/register', { email, nombre, password });
    },

    async forgotPassword(email) {
        return API.post('/auth/forgot-password', { email });
    },

    async resetPassword(token, newPassword) {
        return API.post('/auth/reset-password', { token, new_password: newPassword });
    },

    async verify() {
        return API.get('/auth/verify');
    }
};

// Metodos de tienda (pedidos desde el cliente)
API.tienda = {
    async createOrder(data) {
        return API.post('/pedidos', data);
    }
};

// Override del manejo de 401 para la tienda (mostrar modal en vez de redirigir)
(function() {
    const originalRequest = API.request.bind(API);

    API.request = async function(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
        };

        if (typeof Auth !== 'undefined' && Auth.getToken()) {
            headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        }

        const finalHeaders = { ...headers, ...(options.headers || {}) };
        const config = { ...options, headers: finalHeaders };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (response.status === 401) {
                if (typeof Auth !== 'undefined') {
                    Auth.clearAuth();
                }
                // En la tienda, mostrar modal de login en vez de redirigir
                if (typeof AuthModal !== 'undefined') {
                    AuthModal.updateAuthUI();
                }
                throw new Error(data.error || 'Sesion expirada');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error en la peticion');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };
})();
