/**
 * AuthModal - Modales de login, registro y recuperacion de contrasena
 */

const AuthModal = {
    onLoginSuccess: null,

    showLogin(onSuccess = null) {
        this.onLoginSuccess = onSuccess;

        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = 'Iniciar Sesion';
        document.getElementById('modal-footer').innerHTML = '';

        document.getElementById('modal-body').innerHTML = `
            <div class="auth-form">
                <div class="auth-error" id="auth-error"></div>
                <div class="form-group">
                    <label for="login-email">Email</label>
                    <input type="email" id="login-email" placeholder="tu@email.com">
                </div>
                <div class="form-group">
                    <label for="login-password">Contrasena</label>
                    <input type="password" id="login-password" placeholder="Tu contrasena">
                </div>
                <button class="btn btn-primary" id="btn-login">Iniciar Sesion</button>
                <div class="auth-links">
                    <p><a href="#" id="link-forgot">Olvidaste tu contrasena?</a></p>
                    <p>No tienes cuenta? <a href="#" id="link-register">Crear cuenta</a></p>
                </div>
            </div>
        `;

        modal.classList.add('active');

        // Eventos
        document.getElementById('btn-login').addEventListener('click', () => this.handleLogin());
        document.getElementById('link-forgot').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPassword();
        });
        document.getElementById('link-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegister(onSuccess);
        });

        // Enter para submit
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Cerrar modal
        document.getElementById('modal-close').onclick = () => this.closeModal();
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Focus en email
        setTimeout(() => document.getElementById('login-email').focus(), 100);
    },

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('auth-error');

        if (!email || !password) {
            errorDiv.textContent = 'Email y contrasena son requeridos';
            errorDiv.style.display = 'block';
            return;
        }

        const btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.textContent = 'Iniciando sesion...';
        errorDiv.style.display = 'none';

        try {
            const response = await API.auth.login(email, password);

            Auth.setToken(response.data.token);
            Auth.setUser(response.data.usuario);

            this.closeModal();
            this.updateAuthUI();
            TiendaApp.showToast('Bienvenido, ' + response.data.usuario.nombre, 'success');

            if (this.onLoginSuccess) {
                this.onLoginSuccess();
                this.onLoginSuccess = null;
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Error al iniciar sesion';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesion';
        }
    },

    showRegister(onSuccess = null) {
        this.onLoginSuccess = onSuccess;

        document.getElementById('modal-title').textContent = 'Crear Cuenta';
        document.getElementById('modal-footer').innerHTML = '';

        document.getElementById('modal-body').innerHTML = `
            <div class="auth-form">
                <div class="auth-error" id="auth-error"></div>
                <div class="form-group">
                    <label for="reg-nombre">Nombre</label>
                    <input type="text" id="reg-nombre" placeholder="Tu nombre completo">
                </div>
                <div class="form-group">
                    <label for="reg-email">Email</label>
                    <input type="email" id="reg-email" placeholder="tu@email.com">
                </div>
                <div class="form-group">
                    <label for="reg-password">Contrasena</label>
                    <input type="password" id="reg-password" placeholder="Minimo 6 caracteres">
                </div>
                <div class="form-group">
                    <label for="reg-password2">Confirmar Contrasena</label>
                    <input type="password" id="reg-password2" placeholder="Repite tu contrasena">
                </div>
                <button class="btn btn-primary" id="btn-register">Crear Cuenta</button>
                <div class="auth-links">
                    <p>Ya tienes cuenta? <a href="#" id="link-login">Iniciar Sesion</a></p>
                </div>
            </div>
        `;

        const modal = document.getElementById('modal');
        modal.classList.add('active');

        document.getElementById('btn-register').addEventListener('click', () => this.handleRegister());
        document.getElementById('link-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLogin(onSuccess);
        });

        document.getElementById('reg-password2').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });

        document.getElementById('modal-close').onclick = () => this.closeModal();

        setTimeout(() => document.getElementById('reg-nombre').focus(), 100);
    },

    async handleRegister() {
        const nombre = document.getElementById('reg-nombre').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const password2 = document.getElementById('reg-password2').value;
        const errorDiv = document.getElementById('auth-error');

        if (!nombre || !email || !password) {
            errorDiv.textContent = 'Todos los campos son requeridos';
            errorDiv.style.display = 'block';
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = 'La contrasena debe tener al menos 6 caracteres';
            errorDiv.style.display = 'block';
            return;
        }

        if (password !== password2) {
            errorDiv.textContent = 'Las contrasenas no coinciden';
            errorDiv.style.display = 'block';
            return;
        }

        const btn = document.getElementById('btn-register');
        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';
        errorDiv.style.display = 'none';

        try {
            const response = await API.auth.register(email, nombre, password);

            Auth.setToken(response.data.token);
            Auth.setUser(response.data.usuario);

            this.closeModal();
            this.updateAuthUI();
            TiendaApp.showToast('Cuenta creada. Bienvenido, ' + response.data.usuario.nombre, 'success');

            if (this.onLoginSuccess) {
                this.onLoginSuccess();
                this.onLoginSuccess = null;
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Error al crear la cuenta';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Crear Cuenta';
        }
    },

    showForgotPassword() {
        document.getElementById('modal-title').textContent = 'Recuperar Contrasena';
        document.getElementById('modal-footer').innerHTML = '';

        document.getElementById('modal-body').innerHTML = `
            <div class="auth-form">
                <div class="auth-error" id="auth-error"></div>
                <div class="auth-success" id="auth-success"></div>
                <div id="forgot-step1">
                    <p style="margin-bottom:16px;color:var(--secondary);font-size:0.875rem">
                        Introduce tu email y te enviaremos instrucciones para restablecer tu contrasena.
                    </p>
                    <div class="form-group">
                        <label for="forgot-email">Email</label>
                        <input type="email" id="forgot-email" placeholder="tu@email.com">
                    </div>
                    <button class="btn btn-primary" id="btn-forgot">Enviar</button>
                </div>
                <div id="forgot-step2" style="display:none">
                    <div class="reset-token-display" id="reset-token-display" style="display:none"></div>
                    <div class="form-group">
                        <label for="reset-token">Token de recuperacion</label>
                        <input type="text" id="reset-token" placeholder="Pega aqui el token">
                    </div>
                    <div class="form-group">
                        <label for="reset-password">Nueva contrasena</label>
                        <input type="password" id="reset-password" placeholder="Minimo 6 caracteres">
                    </div>
                    <div class="form-group">
                        <label for="reset-password2">Confirmar contrasena</label>
                        <input type="password" id="reset-password2" placeholder="Repite la contrasena">
                    </div>
                    <button class="btn btn-primary" id="btn-reset">Restablecer Contrasena</button>
                </div>
                <div class="auth-links">
                    <p><a href="#" id="link-back-login">Volver al login</a></p>
                </div>
            </div>
        `;

        const modal = document.getElementById('modal');
        modal.classList.add('active');

        document.getElementById('btn-forgot').addEventListener('click', () => this.handleForgotPassword());
        document.getElementById('link-back-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLogin();
        });

        document.getElementById('modal-close').onclick = () => this.closeModal();

        document.getElementById('forgot-email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleForgotPassword();
        });

        setTimeout(() => document.getElementById('forgot-email').focus(), 100);
    },

    async handleForgotPassword() {
        const email = document.getElementById('forgot-email').value.trim();
        const errorDiv = document.getElementById('auth-error');

        if (!email) {
            errorDiv.textContent = 'Email es requerido';
            errorDiv.style.display = 'block';
            return;
        }

        const btn = document.getElementById('btn-forgot');
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        errorDiv.style.display = 'none';

        try {
            const response = await API.auth.forgotPassword(email);

            // Mostrar paso 2
            document.getElementById('forgot-step1').style.display = 'none';
            document.getElementById('forgot-step2').style.display = 'block';

            // Si viene token (modo desarrollo), mostrarlo
            if (response.data && response.data.token) {
                const tokenDisplay = document.getElementById('reset-token-display');
                tokenDisplay.innerHTML = `
                    <p><strong>Modo desarrollo:</strong> Token de recuperacion generado</p>
                    <code>${response.data.token}</code>
                `;
                tokenDisplay.style.display = 'block';

                // Auto-rellenar el campo token
                document.getElementById('reset-token').value = response.data.token;
            }

            // Evento de reset
            document.getElementById('btn-reset').addEventListener('click', () => this.handleResetPassword());

            document.getElementById('reset-password2').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleResetPassword();
            });

            setTimeout(() => document.getElementById('reset-password').focus(), 100);

        } catch (error) {
            errorDiv.textContent = error.message || 'Error al procesar la solicitud';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Enviar';
        }
    },

    async handleResetPassword() {
        const token = document.getElementById('reset-token').value.trim();
        const password = document.getElementById('reset-password').value;
        const password2 = document.getElementById('reset-password2').value;
        const errorDiv = document.getElementById('auth-error');

        if (!token || !password) {
            errorDiv.textContent = 'Token y nueva contrasena son requeridos';
            errorDiv.style.display = 'block';
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = 'La contrasena debe tener al menos 6 caracteres';
            errorDiv.style.display = 'block';
            return;
        }

        if (password !== password2) {
            errorDiv.textContent = 'Las contrasenas no coinciden';
            errorDiv.style.display = 'block';
            return;
        }

        const btn = document.getElementById('btn-reset');
        btn.disabled = true;
        btn.textContent = 'Restableciendo...';
        errorDiv.style.display = 'none';

        try {
            await API.auth.resetPassword(token, password);

            const successDiv = document.getElementById('auth-success');
            successDiv.textContent = 'Contrasena actualizada correctamente. Ya puedes iniciar sesion.';
            successDiv.style.display = 'block';
            document.getElementById('forgot-step2').style.display = 'none';

            // Cambiar enlace a login
            setTimeout(() => this.showLogin(), 2000);

        } catch (error) {
            errorDiv.textContent = error.message || 'Error al restablecer la contrasena';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Restablecer Contrasena';
        }
    },

    updateAuthUI() {
        const authDiv = document.getElementById('store-auth');
        if (!authDiv) return;

        if (Auth.isAuthenticated()) {
            const user = Auth.getUser();
            authDiv.innerHTML = `
                <div class="user-menu">
                    <span class="user-name" id="user-menu-toggle">${user.nombre} &#9662;</span>
                    <div class="user-dropdown" id="user-dropdown">
                        <a href="/apiComercio/cliente/index.html">Mi Cuenta</a>
                        <a href="#" id="btn-logout">Cerrar Sesion</a>
                    </div>
                </div>
            `;

            document.getElementById('user-menu-toggle').addEventListener('click', () => {
                document.getElementById('user-dropdown').classList.toggle('active');
            });

            document.getElementById('btn-logout').addEventListener('click', (e) => {
                e.preventDefault();
                Auth.clearAuth();
                this.updateAuthUI();
                TiendaApp.showToast('Sesion cerrada', 'info');
                // Si estaba en checkout, volver al catalogo
                if (TiendaApp.currentView === 'checkout') {
                    TiendaApp.navigateTo('catalog');
                }
            });

            // Cerrar dropdown al hacer click fuera
            document.addEventListener('click', (e) => {
                const dropdown = document.getElementById('user-dropdown');
                const toggle = document.getElementById('user-menu-toggle');
                if (dropdown && toggle && !toggle.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        } else {
            authDiv.innerHTML = `
                <button class="btn btn-secondary" id="btn-show-login">Iniciar Sesion</button>
                <button class="btn btn-primary" id="btn-show-register">Registrarse</button>
            `;

            document.getElementById('btn-show-login').addEventListener('click', () => this.showLogin());
            document.getElementById('btn-show-register').addEventListener('click', () => this.showRegister());
        }
    },

    closeModal() {
        document.getElementById('modal').classList.remove('active');
        this.onLoginSuccess = null;
    }
};
