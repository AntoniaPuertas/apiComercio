/**
 * Modulo de Productos - CRUD completo
 */

const ProductosModule = {
    currentSearch: '',

    // =========================================
    // Inicializacion
    // =========================================

    init() {
        Components.search.init((value) => {
            this.currentSearch = value;
            Components.pagination.reset();
            this.loadData();
        });

        Components.pagination.init((page) => {
            this.loadData(page);
        });

        document.getElementById('btn-nuevo').onclick = () => this.showForm();
    },

    // =========================================
    // Cargar datos
    // =========================================

    async loadData(page = 1) {
        Components.table.showLoading(true);

        try {
            const params = {
                page: page,
                limit: Components.pagination.limit
            };

            if (this.currentSearch) {
                params.search = this.currentSearch;
            }

            const response = await API.productos.getAll(params);

            this.renderTable(response.data);
            Components.pagination.update(response.pagination);

        } catch (error) {
            Components.toast.error('Error al cargar productos');
            Components.table.showLoading(false);
        }
    },

    // =========================================
    // Renderizar tabla
    // =========================================

    renderTable(productos) {
        Components.table.setHeaders([
            'Codigo', 'Nombre', 'Precio', 'Descripcion', 'Acciones'
        ]);

        const rows = productos.map(p => `
            <tr>
                <td><strong>${Components.helpers.escapeHtml(p.codigo)}</strong></td>
                <td>${Components.helpers.escapeHtml(p.nombre)}</td>
                <td class="price">${Components.helpers.formatPrice(p.precio)}</td>
                <td class="truncate">${Components.helpers.escapeHtml(Components.helpers.truncate(p.descripcion, 40))}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="ProductosModule.showForm(${p.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="ProductosModule.delete(${p.id})">Eliminar</button>
                </td>
            </tr>
        `);

        Components.table.setData(rows);
    },

    // =========================================
    // Formulario
    // =========================================

    async showForm(id = null) {
        const isEdit = id !== null;
        let producto = { codigo: '', nombre: '', precio: '', descripcion: '', imagen: '' };

        if (isEdit) {
            try {
                const response = await API.productos.getById(id);
                producto = response.data;
            } catch (error) {
                Components.toast.error('Error al cargar producto');
                return;
            }
        }

        const formHtml = `
            <form id="producto-form">
                <div class="form-group">
                    <label for="codigo">Codigo *</label>
                    <input type="text" id="codigo" value="${Components.helpers.escapeHtml(producto.codigo)}" required>
                </div>
                <div class="form-group">
                    <label for="nombre">Nombre *</label>
                    <input type="text" id="nombre" value="${Components.helpers.escapeHtml(producto.nombre)}" required>
                </div>
                <div class="form-group">
                    <label for="precio">Precio *</label>
                    <input type="number" id="precio" step="0.01" min="0" value="${producto.precio}" required>
                </div>
                <div class="form-group">
                    <label for="descripcion">Descripcion</label>
                    <textarea id="descripcion">${Components.helpers.escapeHtml(producto.descripcion || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="imagen">URL Imagen</label>
                    <input type="url" id="imagen" value="${Components.helpers.escapeHtml(producto.imagen || '')}">
                </div>
            </form>
        `;

        Components.modal.open(
            isEdit ? 'Editar Producto' : 'Nuevo Producto',
            formHtml,
            () => this.save(id)
        );
    },

    // =========================================
    // Guardar
    // =========================================

    async save(id = null) {
        const form = document.getElementById('producto-form');
        const data = {
            codigo: document.getElementById('codigo').value.trim(),
            nombre: document.getElementById('nombre').value.trim(),
            precio: parseFloat(document.getElementById('precio').value),
            descripcion: document.getElementById('descripcion').value.trim(),
            imagen: document.getElementById('imagen').value.trim()
        };

        if (!data.codigo || !data.nombre || isNaN(data.precio)) {
            Components.toast.error('Por favor completa los campos requeridos');
            return;
        }

        try {
            if (id) {
                await API.productos.update(id, data);
                Components.toast.success('Producto actualizado correctamente');
            } else {
                await API.productos.create(data);
                Components.toast.success('Producto creado correctamente');
            }

            Components.modal.close();
            this.loadData(Components.pagination.currentPage);

        } catch (error) {
            Components.toast.error(error.message || 'Error al guardar producto');
        }
    },

    // =========================================
    // Eliminar
    // =========================================

    async delete(id) {
        if (!confirm('¿Estas seguro de eliminar este producto?')) {
            return;
        }

        try {
            await API.productos.delete(id);
            Components.toast.success('Producto eliminado correctamente');
            this.loadData(Components.pagination.currentPage);

        } catch (error) {
            Components.toast.error(error.message || 'Error al eliminar producto');
        }
    },

    // =========================================
    // Activar modulo
    // =========================================

    activate() {
        document.getElementById('section-title').textContent = 'Productos';
        document.getElementById('btn-nuevo').style.display = 'inline-flex';
        document.getElementById('btn-nuevo').textContent = '+ Nuevo Producto';
        document.getElementById('filter-estado-container').style.display = 'none';
        document.getElementById('search-input').placeholder = 'Buscar por codigo o nombre...';

        this.currentSearch = '';
        Components.search.clear();
        Components.pagination.reset();
        this.init();
        this.loadData();
    }
};
