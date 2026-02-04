/**
 * App - Inicializacion y navegacion del dashboard
 */

const App = {
    currentSection: 'productos',
    modules: {
        productos: ProductosModule,
        usuarios: UsuariosModule,
        pedidos: PedidosModule
    },

    // =========================================
    // Inicializacion
    // =========================================

    init() {
        // Inicializar componentes comunes
        Components.init();

        // Configurar navegacion
        this.setupNavigation();

        // Cargar seccion inicial
        this.navigateTo('productos');
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

        // Activar nuevo modulo
        this.currentSection = section;

        if (this.modules[section]) {
            this.modules[section].activate();
        }
    }
};

// =========================================
// Iniciar aplicacion cuando el DOM este listo
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
