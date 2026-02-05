/**
 * Modulo Mi Perfil - Gestion del perfil del cliente
 */

const MiPerfilModule = {
    perfil: null,

    // =========================================
    // Activacion/Desactivacion
    // =========================================

    activate() {
        this.render();
        this.loadPerfil();
    },

    deactivate() {
        // Limpiar si es necesario
    },

    // =========================================
    // Renderizado
    // =========================================

    render() {
        const container = document.getElementById('content-container');
        if (!container) return;

        container.innerHTML = `
            <div class="perfil-container" style="max-width: 600px;">
                <div id="loading" class="loading">Cargando...</div>

                <div id="perfil-content" style="display: none;">
                    <!-- Informacion del perfil -->
                    <div class="card" style="margin-bottom: 20px;">
                        <div class="card-header">
                            <h3>Informacion Personal</h3>
                        </div>
                        <div class="card-body">
                            <form id="form-perfil">
                                <div class="form-group">
                                    <label for="perfil-nombre">Nombre</label>
                                    <input type="text" id="perfil-nombre" required>
                                </div>
                                <div class="form-group">
                                    <label for="perfil-email">Correo electronico</label>
                                    <input type="email" id="perfil-email" required>
                                </div>
                                <button type="submit" class="btn btn-primary">Guardar cambios</button>
                            </form>
                        </div>
                    </div>

                    <!-- Cambiar password -->
                    <div class="card">
                        <div class="card-header">
                            <h3>Cambiar Contrasena</h3>
                        </div>
                        <div class="card-body">
                            <form id="form-password">
                                <div class="form-group">
                                    <label for="perfil-password">Nueva contrasena</label>
                                    <input type="password" id="perfil-password" minlength="6" placeholder="Minimo 6 caracteres">
                                </div>
                                <div class="form-group">
                                    <label for="perfil-password-confirm">Confirmar contrasena</label>
                                    <input type="password" id="perfil-password-confirm" minlength="6">
                                </div>
                                <button type="submit" class="btn btn-primary">Cambiar contrasena</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    },

    setupEventListeners() {
        // Form de perfil
        const formPerfil = document.getElementById('form-perfil');
        if (formPerfil) {
            formPerfil.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePerfil();
            });
        }

        // Form de password
        const formPassword = document.getElementById('form-password');
        if (formPassword) {
            formPassword.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePassword();
            });
        }
    },

    // =========================================
    // Carga de datos
    // =========================================

    async loadPerfil() {
        const loading = document.getElementById('loading');
        const content = document.getElementById('perfil-content');

        try {
            const response = await API.get('/perfil');

            if (loading) loading.style.display = 'none';
            if (content) content.style.display = 'block';

            if (response.success && response.data) {
                this.perfil = response.data;
                this.fillForm();
            } else {
                throw new Error(response.error || 'Error al cargar perfil');
            }
        } catch (error) {
            if (loading) loading.style.display = 'none';
            console.error('Error cargando perfil:', error);
            ClienteApp.showToast('Error al cargar el perfil', 'error');
        }
    },

    fillForm() {
        if (!this.perfil) return;

        const nombreInput = document.getElementById('perfil-nombre');
        const emailInput = document.getElementById('perfil-email');

        if (nombreInput) nombreInput.value = this.perfil.nombre || '';
        if (emailInput) emailInput.value = this.perfil.email || '';
    },

    // =========================================
    // Actualizacion de datos
    // =========================================

    async updatePerfil() {
        const nombre = document.getElementById('perfil-nombre')?.value.trim();
        const email = document.getElementById('perfil-email')?.value.trim();

        if (!nombre || !email) {
            ClienteApp.showToast('Por favor completa todos los campos', 'warning');
            return;
        }

        try {
            const response = await API.put('/perfil', {
                nombre,
                email
            });

            if (response.success) {
                ClienteApp.showToast('Perfil actualizado correctamente', 'success');

                // Actualizar datos locales
                this.perfil = response.data;

                // Actualizar localStorage con el nuevo nombre/email
                const user = Auth.getUser();
                if (user) {
                    user.nombre = nombre;
                    user.email = email;
                    localStorage.setItem('user_data', JSON.stringify(user));

                    // Actualizar nombre en el sidebar
                    const userNameEl = document.getElementById('user-name');
                    if (userNameEl) {
                        userNameEl.textContent = nombre;
                    }
                }
            } else {
                throw new Error(response.error || 'Error al actualizar perfil');
            }
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            ClienteApp.showToast(error.message || 'Error al actualizar el perfil', 'error');
        }
    },

    async updatePassword() {
        const password = document.getElementById('perfil-password')?.value;
        const passwordConfirm = document.getElementById('perfil-password-confirm')?.value;

        if (!password || !passwordConfirm) {
            ClienteApp.showToast('Por favor completa ambos campos de contrasena', 'warning');
            return;
        }

        if (password !== passwordConfirm) {
            ClienteApp.showToast('Las contrasenas no coinciden', 'warning');
            return;
        }

        if (password.length < 6) {
            ClienteApp.showToast('La contrasena debe tener al menos 6 caracteres', 'warning');
            return;
        }

        try {
            const response = await API.put('/perfil', {
                password
            });

            if (response.success) {
                ClienteApp.showToast('Contrasena actualizada correctamente', 'success');

                // Limpiar campos
                document.getElementById('perfil-password').value = '';
                document.getElementById('perfil-password-confirm').value = '';
            } else {
                throw new Error(response.error || 'Error al cambiar contrasena');
            }
        } catch (error) {
            console.error('Error cambiando contrasena:', error);
            ClienteApp.showToast(error.message || 'Error al cambiar la contrasena', 'error');
        }
    }
};
