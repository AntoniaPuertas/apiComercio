/**
 * API Client - Cliente HTTP para la API REST
 */

const API = {
    baseUrl: '/apiComercio/api',

    /**
     * Realiza una peticion fetch con configuracion comun
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        // Construir headers incluyendo el token de autenticacion si existe
        const headers = {
            'Content-Type': 'application/json',
        };

        // Añadir token de autenticacion si existe
        if (typeof Auth !== 'undefined' && Auth.getToken()) {
            headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        }

        // Combinar headers con los de options si existen
        const finalHeaders = { ...headers, ...(options.headers || {}) };

        const config = {
            ...options,
            headers: finalHeaders
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // Si el servidor responde 401, la sesion ha expirado
            if (response.status === 401) {
                // Limpiar sesion y redirigir a login
                if (typeof Auth !== 'undefined') {
                    Auth.clearAuth();
                    window.location.href = '/apiComercio/login.html';
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
    },

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    /**
     * POST request
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    /**
     * PUT request
     */
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // =========================================
    // Productos
    // =========================================

    productos: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.get(`/productos${query ? '?' + query : ''}`);
        },

        async getById(id) {
            return API.get(`/productos/${id}`);
        },

        async getCategorias() {
            return API.get('/productos/categorias');
        },

        async create(data) {
            return API.post('/productos', data);
        },

        async update(id, data) {
            return API.put(`/productos/${id}`, data);
        },

        async delete(id) {
            return API.delete(`/productos/${id}`);
        },

        async uploadImagen(id, file) {
            const formData = new FormData();
            formData.append('imagen', file);

            const url = `${API.baseUrl}/productos/${id}/imagen`;
            const headers = {};
            if (typeof Auth !== 'undefined' && Auth.getToken()) {
                headers['Authorization'] = `Bearer ${Auth.getToken()}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const data = await response.json();

            if (response.status === 401) {
                if (typeof Auth !== 'undefined') {
                    Auth.clearAuth();
                    window.location.href = '/apiComercio/login.html';
                }
                throw new Error(data.error || 'Sesion expirada');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Error al subir imagen');
            }

            return data;
        }
    },

    // =========================================
    // Usuarios
    // =========================================

    usuarios: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.get(`/usuarios${query ? '?' + query : ''}`);
        },

        async getById(id) {
            return API.get(`/usuarios/${id}`);
        },

        async create(data) {
            return API.post('/usuarios', data);
        },

        async update(id, data) {
            return API.put(`/usuarios/${id}`, data);
        },

        async delete(id) {
            return API.delete(`/usuarios/${id}`);
        }
    },

    // =========================================
    // Pedidos
    // =========================================

    pedidos: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.get(`/pedidos${query ? '?' + query : ''}`);
        },

        async getById(id) {
            return API.get(`/pedidos/${id}`);
        },

        async create(data) {
            return API.post('/pedidos', data);
        },

        async update(id, data) {
            return API.put(`/pedidos/${id}`, data);
        },

        async updateEstado(id, estado) {
            return API.put(`/pedidos/${id}/estado`, { estado });
        },

        async delete(id) {
            return API.delete(`/pedidos/${id}`);
        },

        async getDetalles(id) {
            return API.get(`/pedidos/${id}/detalles`);
        },

        async addDetalle(pedidoId, data) {
            return API.post(`/pedidos/${pedidoId}/detalles`, data);
        },

        async deleteDetalle(pedidoId, detalleId) {
            return API.request(`/pedidos/${pedidoId}/detalles`, {
                method: 'DELETE',
                body: JSON.stringify({ detalle_id: detalleId })
            });
        },

        async updateCantidad(pedidoId, detalleId, cantidad) {
            return API.put(`/pedidos/${pedidoId}/detalles`, { detalle_id: detalleId, cantidad: cantidad });
        }
    }
};
