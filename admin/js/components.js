/**
 * Components - Componentes reutilizables del dashboard
 */

const Components = {
    // =========================================
    // Toast Notifications
    // =========================================

    toast: {
        container: null,

        init() {
            this.container = document.getElementById('toast-container');
        },

        show(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;

            this.container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        success(message) {
            this.show(message, 'success');
        },

        error(message) {
            this.show(message, 'error');
        },

        info(message) {
            this.show(message, 'info');
        }
    },

    // =========================================
    // Modal
    // =========================================

    modal: {
        element: null,
        title: null,
        body: null,
        saveBtn: null,
        onSave: null,

        init() {
            this.element = document.getElementById('modal');
            this.title = document.getElementById('modal-title');
            this.body = document.getElementById('modal-body');
            this.saveBtn = document.getElementById('modal-save');

            document.getElementById('modal-close').addEventListener('click', () => this.close());
            document.getElementById('modal-cancel').addEventListener('click', () => this.close());

            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) this.close();
            });

            this.saveBtn.addEventListener('click', () => {
                if (this.onSave) this.onSave();
            });
        },

        open(title, content, onSave, saveText = 'Guardar') {
            this.title.textContent = title;
            this.body.innerHTML = content;
            this.onSave = onSave;
            this.saveBtn.textContent = saveText;
            this.element.classList.add('active');
        },

        close() {
            this.element.classList.remove('active');
            this.onSave = null;
        },

        showSaveButton(show = true) {
            this.saveBtn.style.display = show ? 'inline-flex' : 'none';
        }
    },

    // =========================================
    // Pagination
    // =========================================

    pagination: {
        currentPage: 1,
        totalPages: 1,
        limit: 10,
        onPageChange: null,

        init(onPageChange) {
            this.onPageChange = onPageChange;

            document.getElementById('btn-prev').addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            });

            document.getElementById('btn-next').addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            });
        },

        update(pagination) {
            this.currentPage = pagination.page;
            this.totalPages = pagination.total_pages;
            this.limit = pagination.limit;

            document.getElementById('pagination-info').textContent =
                `Pagina ${this.currentPage} de ${this.totalPages || 1}`;

            document.getElementById('btn-prev').disabled = this.currentPage <= 1;
            document.getElementById('btn-next').disabled = this.currentPage >= this.totalPages;
        },

        goToPage(page) {
            this.currentPage = page;
            if (this.onPageChange) {
                this.onPageChange(page);
            }
        },

        reset() {
            this.currentPage = 1;
        }
    },

    // =========================================
    // Search with Debounce
    // =========================================

    search: {
        input: null,
        timeout: null,
        onSearch: null,
        debounceTime: 300,
        initialized: false,

        init(onSearch) {
            this.input = document.getElementById('search-input');
            this.onSearch = onSearch;

            if (!this.initialized) {
                this.input.addEventListener('input', () => {
                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(() => {
                        if (this.onSearch) {
                            this.onSearch(this.input.value);
                        }
                    }, this.debounceTime);
                });
                this.initialized = true;
            }
        },

        clear() {
            if (this.input) {
                this.input.value = '';
            }
        },

        getValue() {
            return this.input ? this.input.value : '';
        }
    },

    // =========================================
    // Table
    // =========================================

    table: {
        head: null,
        body: null,
        loading: null,
        emptyState: null,

        init() {
            this.head = document.getElementById('table-head');
            this.body = document.getElementById('table-body');
            this.loading = document.getElementById('loading');
            this.emptyState = document.getElementById('empty-state');
        },

        setHeaders(headers) {
            this.head.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        },

        setData(rows) {
            this.body.innerHTML = rows.join('');
            this.showLoading(false);
            this.showEmpty(rows.length === 0);
        },

        showLoading(show = true) {
            this.loading.style.display = show ? 'block' : 'none';
            if (show) {
                this.body.innerHTML = '';
                this.showEmpty(false);
            }
        },

        showEmpty(show = true) {
            this.emptyState.style.display = show ? 'block' : 'none';
        }
    },

    // =========================================
    // Helpers
    // =========================================

    helpers: {
        formatPrice(price) {
            return parseFloat(price).toFixed(2) + ' EUR';
        },

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        },

        statusBadge(status) {
            return `<span class="status-badge status-${status}">${status}</span>`;
        },

        roleBadge(rol) {
            return `<span class="role-badge role-${rol}">${rol}</span>`;
        },

        activoBadge(activo) {
            const status = activo ? 'activo' : 'inactivo';
            return `<span class="status-badge status-${status}">${status}</span>`;
        },

        truncate(text, length = 50) {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        },

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    },

    // =========================================
    // Initialize all components
    // =========================================

    init() {
        this.toast.init();
        this.modal.init();
        this.table.init();
        // Pre-inicializar input de busqueda para evitar null
        this.search.input = document.getElementById('search-input');
    }
};
