/**
 * CatalogModule - Catalogo de productos
 */

const CatalogModule = {
    productos: [],
    categorias: [],
    currentPage: 1,
    totalPages: 1,
    limit: 12,
    searchQuery: '',
    selectedCategoria: '',
    searchTimeout: null,

    activate() {
        this.render();
        this.loadCategorias();
        this.loadProductos();
    },

    deactivate() {},

    render() {
        const container = document.getElementById('store-content');
        container.innerHTML = `
            <div class="catalog-header">
                <h2>Nuestros Productos</h2>
                <div class="catalog-filters">
                    <div class="catalog-search">
                        <input type="text" id="catalog-search" placeholder="Buscar productos..."
                            value="${this.searchQuery}">
                    </div>
                    <div class="category-pills" id="category-pills">
                        <button class="category-pill active" data-category="">Todos</button>
                    </div>
                </div>
            </div>
            <div class="product-grid" id="product-grid">
                <div class="loading">Cargando productos...</div>
            </div>
            <div class="pagination" id="catalog-pagination"></div>
        `;

        // Evento de busqueda con debounce
        const searchInput = document.getElementById('catalog-search');
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.loadProductos();
            }, 300);
        });
    },

    async loadCategorias() {
        try {
            const response = await API.productos.getCategorias();
            this.categorias = response.data || [];
            this.renderCategorias();
        } catch (error) {
            console.error('Error cargando categorias:', error);
        }
    },

    renderCategorias() {
        const container = document.getElementById('category-pills');
        if (!container) return;

        let html = `<button class="category-pill ${this.selectedCategoria === '' ? 'active' : ''}"
            data-category="">Todos</button>`;

        this.categorias.forEach(cat => {
            html += `<button class="category-pill ${this.selectedCategoria === cat ? 'active' : ''}"
                data-category="${cat}">${cat}</button>`;
        });

        container.innerHTML = html;

        // Eventos de click en categorias
        container.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                this.selectedCategoria = e.target.dataset.category;
                this.currentPage = 1;
                this.loadProductos();

                // Actualizar estado activo
                container.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },

    async loadProductos() {
        const grid = document.getElementById('product-grid');
        if (grid) grid.innerHTML = '<div class="loading">Cargando productos...</div>';

        try {
            const params = {
                page: this.currentPage,
                limit: this.limit
            };

            if (this.searchQuery) params.search = this.searchQuery;
            if (this.selectedCategoria) params.categoria = this.selectedCategoria;

            const response = await API.productos.getAll(params);
            this.productos = response.data || [];
            this.totalPages = response.pagination ? response.pagination.total_pages : 1;

            this.renderProducts();
            this.renderPagination();
        } catch (error) {
            console.error('Error cargando productos:', error);
            if (grid) grid.innerHTML = '<div class="catalog-empty"><div class="catalog-empty-icon">!</div><h3>Error al cargar productos</h3></div>';
        }
    },

    renderProducts() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        if (this.productos.length === 0) {
            grid.innerHTML = `
                <div class="catalog-empty" style="grid-column: 1/-1">
                    <div class="catalog-empty-icon">&#128269;</div>
                    <h3>No se encontraron productos</h3>
                    <p>Intenta con otra busqueda o categoria</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.productos.map(producto => this.renderProductCard(producto)).join('');

        // Eventos de agregar al carrito
        grid.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.addToCart(id);
            });
        });
    },

    getImagenSrc(imagen) {
        if (!imagen) return '';
        if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
            return imagen;
        }
        return '/apiComercio/' + imagen;
    },

    renderProductCard(producto) {
        let imagenHtml;
        if (producto.imagen) {
            const src = this.getImagenSrc(producto.imagen);
            imagenHtml = `<img src="${src}" alt="${producto.nombre}" onerror="this.parentElement.innerHTML='<span>&#128230;</span>'">`;
        } else {
            imagenHtml = '<span>&#128230;</span>';
        }

        return `
            <div class="product-card">
                <div class="product-card-image">
                    ${imagenHtml}
                </div>
                <div class="product-card-body">
                    ${producto.categoria ? `<div class="product-card-category">${producto.categoria}</div>` : ''}
                    <div class="product-card-name">${producto.nombre}</div>
                    <div class="product-card-desc">${producto.descripcion || ''}</div>
                    <div class="product-card-footer">
                        <span class="product-card-price">${parseFloat(producto.precio).toFixed(2)} &euro;</span>
                        <button class="btn-add-cart" data-id="${producto.id}">Agregar al carrito</button>
                    </div>
                </div>
            </div>
        `;
    },

    addToCart(productoId) {
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) return;

        Cart.addItem(producto);
        TiendaApp.showToast('Producto agregado al carrito', 'success');
    },

    renderPagination() {
        const container = document.getElementById('catalog-pagination');
        if (!container || this.totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <button class="btn btn-secondary btn-sm" ${this.currentPage <= 1 ? 'disabled' : ''}
                onclick="CatalogModule.goToPage(${this.currentPage - 1})">Anterior</button>
            <span id="pagination-info">Pagina ${this.currentPage} de ${this.totalPages}</span>
            <button class="btn btn-secondary btn-sm" ${this.currentPage >= this.totalPages ? 'disabled' : ''}
                onclick="CatalogModule.goToPage(${this.currentPage + 1})">Siguiente</button>
        `;
    },

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadProductos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
