/**
 * Modulo de Usuarios - CRUD completo
 */

const UsuariosModule = {
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

            const response = await API.usuarios.getAll(params);

            this.renderTable(response.data);
            Components.pagination.update(response.pagination);

        } catch (error) {
            Components.toast.error('Error al cargar usuarios');
            Components.table.showLoading(false);
        }
    },

    // =========================================
    // Renderizar tabla
    // =========================================

    renderTable(usuarios) {
        Components.table.setHeaders([
            'ID', 'Email', 'Nombre', 'Rol', 'Estado', 'Acciones'
        ]);

        const rows = usuarios.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${Components.helpers.escapeHtml(u.email)}</td>
                <td>${Components.helpers.escapeHtml(u.nombre)}</td>
                <td>${Components.helpers.roleBadge(u.rol)}</td>
                <td>${Components.helpers.activoBadge(u.activo)}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="UsuariosModule.showForm(${u.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="UsuariosModule.delete(${u.id})">Eliminar</button>
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
        let usuario = { email: '', nombre: '', rol: 'usuario', activo: 1 };

        if (isEdit) {
            try {
                const response = await API.usuarios.getById(id);
                usuario = response.data;
            } catch (error) {
                Components.toast.error('Error al cargar usuario');
                return;
            }
        }

        const formHtml = `
            <form id="usuario-form">
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" value="${Components.helpers.escapeHtml(usuario.email)}" required>
                </div>
                <div class="form-group">
                    <label for="nombre">Nombre *</label>
                    <input type="text" id="nombre" value="${Components.helpers.escapeHtml(usuario.nombre)}" required>
                </div>
                <div class="form-group">
                    <label for="password">Password ${isEdit ? '(dejar vacio para mantener)' : '*'}</label>
                    <input type="password" id="password" ${isEdit ? '' : 'required'}>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="rol">Rol *</label>
                        <select id="rol" required>
                            <option value="usuario" ${usuario.rol === 'usuario' ? 'selected' : ''}>Usuario</option>
                            <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="activo">Estado *</label>
                        <select id="activo" required>
                            <option value="1" ${usuario.activo ? 'selected' : ''}>Activo</option>
                            <option value="0" ${!usuario.activo ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        Components.modal.open(
            isEdit ? 'Editar Usuario' : 'Nuevo Usuario',
            formHtml,
            () => this.save(id)
        );
    },

    // =========================================
    // Guardar
    // =========================================

    async save(id = null) {
        const data = {
            email: document.getElementById('email').value.trim(),
            nombre: document.getElementById('nombre').value.trim(),
            rol: document.getElementById('rol').value,
            activo: parseInt(document.getElementById('activo').value)
        };

        const password = document.getElementById('password').value;

        if (!data.email || !data.nombre) {
            Components.toast.error('Por favor completa los campos requeridos');
            return;
        }

        if (!id && !password) {
            Components.toast.error('La contraseña es requerida para nuevos usuarios');
            return;
        }

        if (password) {
            data.password = password;
        }

        try {
            if (id) {
                await API.usuarios.update(id, data);
                Components.toast.success('Usuario actualizado correctamente');
            } else {
                await API.usuarios.create(data);
                Components.toast.success('Usuario creado correctamente');
            }

            Components.modal.close();
            this.loadData(Components.pagination.currentPage);

        } catch (error) {
            Components.toast.error(error.message || 'Error al guardar usuario');
        }
    },

    // =========================================
    // Eliminar
    // =========================================

    async delete(id) {
        if (!confirm('¿Estas seguro de eliminar este usuario?')) {
            return;
        }

        try {
            await API.usuarios.delete(id);
            Components.toast.success('Usuario eliminado correctamente');
            this.loadData(Components.pagination.currentPage);

        } catch (error) {
            Components.toast.error(error.message || 'Error al eliminar usuario');
        }
    },

    // =========================================
    // Activar modulo
    // =========================================

    activate() {
        document.getElementById('section-title').textContent = 'Usuarios';
        document.getElementById('btn-nuevo').style.display = 'inline-flex';
        document.getElementById('btn-nuevo').textContent = '+ Nuevo Usuario';
        document.getElementById('filter-estado-container').style.display = 'none';
        document.getElementById('search-input').placeholder = 'Buscar por email o nombre...';

        this.currentSearch = '';
        Components.search.clear();
        Components.pagination.reset();
        this.init();
        this.loadData();
    }
};
