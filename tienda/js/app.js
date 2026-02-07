/**
 * TiendaApp - Aplicacion principal de la tienda
 */

const TiendaApp = {
    currentView: 'catalog',
    views: {
        catalog: CatalogModule,
        cart: CartViewModule,
        checkout: CheckoutModule
    },

    init() {
        Cart.init();
        AuthModal.updateAuthUI();
        this.setupNavigation();
        this.navigateTo('catalog');
    },

    setupNavigation() {
        document.querySelectorAll('.store-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                if (view) this.navigateTo(view);
            });
        });
    },

    navigateTo(view) {
        if (!this.views[view]) return;

        // Desactivar vista actual
        if (this.views[this.currentView] && this.views[this.currentView].deactivate) {
            this.views[this.currentView].deactivate();
        }

        this.currentView = view;

        // Actualizar nav activo
        document.querySelectorAll('.store-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === view) {
                link.classList.add('active');
            }
        });

        // Activar nueva vista
        this.views[view].activate();

        // Scroll arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Inicializar cuando el DOM este listo
document.addEventListener('DOMContentLoaded', () => TiendaApp.init());
