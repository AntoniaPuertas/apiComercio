/**
 * App Cliente - Inicializacion y navegacion del area de cliente
 */

const ClienteApp = {
    currentSection: 'pedidos',
    modules: {
        pedidos: MisPedidosModule,
        perfil: MiPerfilModule
    },

    // =========================================
    // Inicializacion
    // =========================================

    init() {
        // Verificar autenticacion
        if (!Auth.isAuthenticated()) {
            window.location.replace('/apiComercio/login.html');
            return;
        }

        // Verificar que no sea admin
        const user = Auth.getUser();
        if (user && user.rol === 'admin') {
            window.location.replace('/apiComercio/admin/index.html');
            return;
        }

        // Mostrar informacion del usuario
        this.displayUserInfo();

        // Configurar navegacion
        this.setupNavigation();

        // Configurar logout
        this.setupLogout();

        // Configurar modal
        this.setupModal();

        // Cargar seccion inicial
        this.navigateTo('pedidos');
    },

    // =========================================
    // UI
    // =========================================

    displayUserInfo() {
        const user = Auth.getUser();
        if (user) {
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                userNameEl.textContent = user.nombre;
            }

            const userRoleEl = document.getElementById('user-role');
            if (userRoleEl) {
                userRoleEl.textContent = 'Cliente';
            }
        }
    },

    setupLogout() {
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Deseas cerrar sesion?')) {
                    Auth.logout();
                }
            });
        }
    },

    setupModal() {
        const modal = document.getElementById('modal');
        const closeBtn = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('modal-cancel');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    },

    openModal(title, content, showSave = false, onSave = null) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const saveBtn = document.getElementById('modal-save');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        if (saveBtn) {
            saveBtn.style.display = showSave ? 'inline-block' : 'none';
            if (showSave && onSave) {
                saveBtn.onclick = onSave;
            }
        }
        if (modal) modal.classList.add('active');
    },

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.classList.remove('active');
    },

    // =========================================
    // Navegacion
    // =========================================

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateTo(section);
            });
        });
    },

    navigateTo(section) {
        // Desactivar modulo anterior
        if (this.modules[this.currentSection] && this.modules[this.currentSection].deactivate) {
            this.modules[this.currentSection].deactivate();
        }

        // Actualizar navegacion activa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Actualizar titulo
        const titles = {
            pedidos: 'Mis Pedidos',
            perfil: 'Mi Perfil'
        };
        const titleEl = document.getElementById('section-title');
        if (titleEl) {
            titleEl.textContent = titles[section] || section;
        }

        // Activar nuevo modulo
        this.currentSection = section;

        if (this.modules[section]) {
            this.modules[section].activate();
        }
    },

    // =========================================
    // Utilidades
    // =========================================

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// =========================================
// Iniciar aplicacion cuando el DOM este listo
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    ClienteApp.init();
});

// =========================================
// Verificar auth cuando se navega con boton atras
// =========================================

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        if (!Auth.isAuthenticated()) {
            window.location.href = '/apiComercio/login.html';
        }
    }
});

// =========================================
// Verificar auth cuando la pagina vuelve a ser visible
// =========================================

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!Auth.isAuthenticated()) {
            window.location.href = '/apiComercio/login.html';
        }
    }
});
