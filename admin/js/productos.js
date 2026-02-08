/**
 * Modulo de Productos - CRUD completo con subida de imagenes
 */

const ProductosModule = {
    currentSearch: '',
    currentCategoria: '',
    categoriasLoaded: false,
    selectedFile: null,

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

            if (this.currentCategoria) {
                params.categoria = this.currentCategoria;
            }

            const response = await API.productos.getAll(params);

            this.renderTable(response.data);
            Components.pagination.update(response.pagination);

        } catch (error) {
            Components.toast.error('Error al cargar productos');
            Components.table.showLoading(false);
        }
    },

    async loadCategorias() {
        if (this.categoriasLoaded) return;

        try {
            const response = await API.productos.getCategorias();
            const filterCategoria = document.getElementById('filter-categoria');

            response.data.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                filterCategoria.appendChild(option);
            });

            this.categoriasLoaded = true;
        } catch (error) {
            console.error('Error cargando categorias:', error);
        }
    },

    // =========================================
    // Helpers de imagen
    // =========================================

    getImagenSrc(imagen) {
        if (!imagen) return '';
        if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
            return imagen;
        }
        return '/apiComercio/' + imagen;
    },

    renderThumb(imagen) {
        if (!imagen) {
            return '<div class="product-thumb product-thumb-placeholder">&#128230;</div>';
        }
        const src = this.getImagenSrc(imagen);
        return `<img class="product-thumb" src="${Components.helpers.escapeHtml(src)}" alt="" onerror="this.outerHTML='<div class=\\'product-thumb product-thumb-placeholder\\'>&#128230;</div>'">`;
    },

    // =========================================
    // Renderizar tabla
    // =========================================

    renderTable(productos) {
        Components.table.setHeaders([
            'Imagen', 'Codigo', 'Nombre', 'Categoria', 'Precio', 'Acciones'
        ]);

        const rows = productos.map(p => `
            <tr>
                <td>${this.renderThumb(p.imagen)}</td>
                <td><strong>${Components.helpers.escapeHtml(p.codigo)}</strong></td>
                <td>${Components.helpers.escapeHtml(p.nombre)}</td>
                <td>${Components.helpers.escapeHtml(p.categoria || '-')}</td>
                <td class="price">${Components.helpers.formatPrice(p.precio)}</td>
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
        let producto = { codigo: '', nombre: '', precio: '', descripcion: '', categoria: '', imagen: '' };
        let categorias = [];
        this.selectedFile = null;

        try {
            const catResponse = await API.productos.getCategorias();
            categorias = catResponse.data || [];
        } catch (error) {
            console.error('Error cargando categorias:', error);
        }

        if (isEdit) {
            try {
                const response = await API.productos.getById(id);
                producto = response.data;
            } catch (error) {
                Components.toast.error('Error al cargar producto');
                return;
            }
        }

        const categoriasOptions = categorias.map(cat =>
            `<option value="${Components.helpers.escapeHtml(cat)}" ${producto.categoria === cat ? 'selected' : ''}>${Components.helpers.escapeHtml(cat)}</option>`
        ).join('');

        let imagenPreview = '';
        if (producto.imagen) {
            const src = this.getImagenSrc(producto.imagen);
            imagenPreview = `<div class="imagen-preview" id="imagen-preview">
                <img src="${Components.helpers.escapeHtml(src)}" alt="Imagen actual" onerror="this.parentElement.innerHTML='<div class=\\'imagen-preview-placeholder\\'>Sin imagen</div>'">
                <button type="button" class="btn btn-danger btn-sm imagen-preview-remove" id="btn-remove-imagen" title="Quitar imagen">&#10005;</button>
            </div>`;
        } else {
            imagenPreview = '<div class="imagen-preview" id="imagen-preview"><div class="imagen-preview-placeholder">Sin imagen</div></div>';
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
                    <label for="categoria">Categoria</label>
                    <input type="text" id="categoria" list="categorias-list" value="${Components.helpers.escapeHtml(producto.categoria || '')}" placeholder="Seleccionar o escribir nueva">
                    <datalist id="categorias-list">
                        ${categoriasOptions}
                    </datalist>
                </div>
                <div class="form-group">
                    <label for="descripcion">Descripcion</label>
                    <textarea id="descripcion">${Components.helpers.escapeHtml(producto.descripcion || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="imagen-file">Imagen del producto</label>
                    ${imagenPreview}
                    <input type="file" id="imagen-file" accept="image/jpeg,image/png,image/webp,image/gif">
                    <small>Max. 2 MB. Formatos: JPG, PNG, WebP, GIF</small>
                </div>
            </form>
        `;

        Components.modal.open(
            isEdit ? 'Editar Producto' : 'Nuevo Producto',
            formHtml,
            () => this.save(id)
        );

        // Evento de preview al seleccionar archivo
        document.getElementById('imagen-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                this.selectedFile = null;
                return;
            }

            // Validar tipo
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!tiposPermitidos.includes(file.type)) {
                Components.toast.error('Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF');
                e.target.value = '';
                this.selectedFile = null;
                return;
            }

            // Validar tamaño (2 MB)
            if (file.size > 2 * 1024 * 1024) {
                Components.toast.error('La imagen no puede superar 2 MB');
                e.target.value = '';
                this.selectedFile = null;
                return;
            }

            this.selectedFile = file;

            // Mostrar preview
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('imagen-preview');
                if (preview) {
                    preview.innerHTML = `
                        <img src="${ev.target.result}" alt="Preview">
                        <button type="button" class="btn btn-danger btn-sm imagen-preview-remove" id="btn-remove-imagen" title="Quitar imagen">&#10005;</button>
                    `;
                    document.getElementById('btn-remove-imagen').addEventListener('click', () => {
                        this.selectedFile = null;
                        document.getElementById('imagen-file').value = '';
                        preview.innerHTML = '<div class="imagen-preview-placeholder">Sin imagen</div>';
                    });
                }
            };
            reader.readAsDataURL(file);
        });

        // Evento para quitar imagen existente
        const btnRemove = document.getElementById('btn-remove-imagen');
        if (btnRemove) {
            btnRemove.addEventListener('click', () => {
                this.selectedFile = null;
                document.getElementById('imagen-file').value = '';
                document.getElementById('imagen-preview').innerHTML = '<div class="imagen-preview-placeholder">Sin imagen</div>';
            });
        }
    },

    // =========================================
    // Guardar
    // =========================================

    async save(id = null) {
        const data = {
            codigo: document.getElementById('codigo').value.trim(),
            nombre: document.getElementById('nombre').value.trim(),
            precio: parseFloat(document.getElementById('precio').value),
            categoria: document.getElementById('categoria').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim()
        };

        if (!data.codigo || !data.nombre || isNaN(data.precio)) {
            Components.toast.error('Por favor completa los campos requeridos');
            return;
        }

        try {
            let productoId = id;

            if (id) {
                await API.productos.update(id, data);
            } else {
                const response = await API.productos.create(data);
                productoId = response.data.id;
            }

            // Subir imagen si se selecciono un archivo
            if (this.selectedFile && productoId) {
                try {
                    await API.productos.uploadImagen(productoId, this.selectedFile);
                } catch (imgError) {
                    Components.toast.error('Producto guardado pero error al subir imagen: ' + imgError.message);
                    Components.modal.close();
                    this.categoriasLoaded = false;
                    this.loadData(Components.pagination.currentPage);
                    return;
                }
            }

            Components.toast.success(id ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
            Components.modal.close();
            this.categoriasLoaded = false;
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
        document.getElementById('filter-categoria-container').style.display = 'block';
        document.getElementById('filter-categoria').value = '';
        document.getElementById('search-input').placeholder = 'Buscar por codigo o nombre...';

        this.currentSearch = '';
        this.currentCategoria = '';
        Components.search.clear();
        Components.pagination.reset();
        this.init();
        this.initCategoriaFilter();
        this.loadCategorias();
        this.loadData();
    },

    initCategoriaFilter() {
        const filterCategoria = document.getElementById('filter-categoria');
        filterCategoria.onchange = () => {
            this.currentCategoria = filterCategoria.value;
            Components.pagination.reset();
            this.loadData();
        };
    },

    deactivate() {
        document.getElementById('filter-categoria-container').style.display = 'none';
    }
};
