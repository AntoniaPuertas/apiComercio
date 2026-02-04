/**
 * Modulo de Pedidos - CRUD con detalles
 */

const PedidosModule = {
    currentEstado: '',
    currentCliente: '',
    clientesLoaded: false,

    // =========================================
    // Inicializacion
    // =========================================

    init() {
        const filterEstado = document.getElementById('filter-estado');
        filterEstado.addEventListener('change', () => {
            this.currentEstado = filterEstado.value;
            Components.pagination.reset();
            this.loadData();
        });

        const filterCliente = document.getElementById('filter-cliente');
        filterCliente.addEventListener('change', () => {
            this.currentCliente = filterCliente.value;
            Components.pagination.reset();
            this.loadData();
        });

        Components.pagination.init((page) => {
            this.loadData(page);
        });

        document.getElementById('btn-nuevo').onclick = () => this.showForm();
    },

    // =========================================
    // Cargar clientes en el filtro
    // =========================================

    async loadClientes() {
        if (this.clientesLoaded) return;

        try {
            const response = await API.usuarios.getAll({ limit: 100 });
            const filterCliente = document.getElementById('filter-cliente');

            response.data.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = `${u.nombre} (${u.email})`;
                filterCliente.appendChild(option);
            });

            this.clientesLoaded = true;
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
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

            if (this.currentEstado) {
                params.estado = this.currentEstado;
            }

            if (this.currentCliente) {
                params.usuario_id = this.currentCliente;
            }

            const response = await API.pedidos.getAll(params);

            this.renderTable(response.data);
            Components.pagination.update(response.pagination);

        } catch (error) {
            Components.toast.error('Error al cargar pedidos');
            Components.table.showLoading(false);
        }
    },

    // =========================================
    // Renderizar tabla
    // =========================================

    renderTable(pedidos) {
        Components.table.setHeaders([
            'ID', 'Cliente', 'Estado', 'Total', 'Fecha', 'Acciones'
        ]);

        const rows = pedidos.map(p => `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td>
                    <div>${Components.helpers.escapeHtml(p.cliente_nombre)}</div>
                    <small class="text-muted">${Components.helpers.escapeHtml(p.cliente_email)}</small>
                </td>
                <td>
                    <select class="status-select" onchange="PedidosModule.updateEstado(${p.id}, this.value)">
                        <option value="pendiente" ${p.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="procesando" ${p.estado === 'procesando' ? 'selected' : ''}>Procesando</option>
                        <option value="enviado" ${p.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
                        <option value="entregado" ${p.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                        <option value="cancelado" ${p.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
                <td class="price">${Components.helpers.formatPrice(p.total)}</td>
                <td>${Components.helpers.formatDate(p.created_at)}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="PedidosModule.showDetails(${p.id})">Ver</button>
                    <button class="btn btn-danger btn-sm" onclick="PedidosModule.delete(${p.id})">Eliminar</button>
                </td>
            </tr>
        `);

        Components.table.setData(rows);
    },

    // =========================================
    // Actualizar estado
    // =========================================

    async updateEstado(id, estado) {
        try {
            await API.pedidos.updateEstado(id, estado);
            Components.toast.success('Estado actualizado');
        } catch (error) {
            Components.toast.error('Error al actualizar estado');
            this.loadData(Components.pagination.currentPage);
        }
    },

    // =========================================
    // Ver detalles
    // =========================================

    async showDetails(id) {
        try {
            const [pedidoRes, detallesRes] = await Promise.all([
                API.pedidos.getById(id),
                API.pedidos.getDetalles(id)
            ]);

            const pedido = pedidoRes.data;
            const detalles = detallesRes.data || [];

            const detallesHtml = detalles.length > 0 ? `
                <table class="detalles-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detalles.map(d => `
                            <tr>
                                <td>${Components.helpers.escapeHtml(d.producto_nombre || 'Producto #' + d.producto_id)}</td>
                                <td>${d.cantidad}</td>
                                <td>${Components.helpers.formatPrice(d.precio_unitario)}</td>
                                <td>${Components.helpers.formatPrice(d.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-right"><strong>Total:</strong></td>
                            <td><strong>${Components.helpers.formatPrice(pedido.total)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            ` : '<p class="text-muted">No hay detalles para este pedido</p>';

            const contentHtml = `
                <div class="pedido-info">
                    <p><strong>Pedido:</strong> #${pedido.id}</p>
                    <p><strong>Cliente:</strong> ${Components.helpers.escapeHtml(pedido.cliente_nombre || 'N/A')}</p>
                    <p><strong>Email:</strong> ${Components.helpers.escapeHtml(pedido.cliente_email || 'N/A')}</p>
                    <p><strong>Estado:</strong> ${Components.helpers.statusBadge(pedido.estado)}</p>
                    <p><strong>Direccion:</strong> ${Components.helpers.escapeHtml(pedido.direccion_envio || 'N/A')}</p>
                    <p><strong>Notas:</strong> ${Components.helpers.escapeHtml(pedido.notas || 'Sin notas')}</p>
                    <p><strong>Fecha:</strong> ${Components.helpers.formatDate(pedido.created_at)}</p>
                </div>
                <h4>Detalles del Pedido</h4>
                ${detallesHtml}
            `;

            Components.modal.open('Detalles del Pedido #' + id, contentHtml, null);
            Components.modal.showSaveButton(false);

        } catch (error) {
            Components.toast.error('Error al cargar detalles del pedido');
        }
    },

    // =========================================
    // Formulario nuevo pedido
    // =========================================

    async showForm() {
        try {
            const response = await API.usuarios.getAll({ limit: 100 });
            const usuarios = response.data;

            const formHtml = `
                <form id="pedido-form">
                    <div class="form-group">
                        <label for="usuario_id">Cliente *</label>
                        <select id="usuario_id" required>
                            <option value="">Seleccionar cliente</option>
                            ${usuarios.map(u => `
                                <option value="${u.id}">${Components.helpers.escapeHtml(u.nombre)} (${Components.helpers.escapeHtml(u.email)})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="direccion_envio">Direccion de envio *</label>
                        <textarea id="direccion_envio" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="notas">Notas</label>
                        <textarea id="notas"></textarea>
                    </div>
                </form>
                <p class="text-muted"><small>* Despues de crear el pedido podras añadir productos desde la vista de detalles.</small></p>
            `;

            Components.modal.open('Nuevo Pedido', formHtml, () => this.save());
            Components.modal.showSaveButton(true);

        } catch (error) {
            Components.toast.error('Error al cargar usuarios');
        }
    },

    // =========================================
    // Guardar
    // =========================================

    async save() {
        const data = {
            usuario_id: parseInt(document.getElementById('usuario_id').value),
            direccion_envio: document.getElementById('direccion_envio').value.trim(),
            notas: document.getElementById('notas').value.trim()
        };

        if (!data.usuario_id || !data.direccion_envio) {
            Components.toast.error('Por favor completa los campos requeridos');
            return;
        }

        try {
            await API.pedidos.create(data);
            Components.toast.success('Pedido creado correctamente');
            Components.modal.close();
            this.loadData(Components.pagination.currentPage);

        } catch (error) {
            Components.toast.error(error.message || 'Error al crear pedido');
        }
    },

    // =========================================
    // Eliminar
    // =========================================

    async delete(id) {
        if (!confirm('¿Estas seguro de eliminar este pedido?')) {
            return;
        }

        try {
            await API.pedidos.delete(id);
            Components.toast.success('Pedido eliminado correctamente');
            this.loadData(Components.pagination.currentPage);

        } catch (error) {
            Components.toast.error(error.message || 'Error al eliminar pedido');
        }
    },

    // =========================================
    // Activar modulo
    // =========================================

    activate() {
        document.getElementById('section-title').textContent = 'Pedidos';
        document.getElementById('btn-nuevo').style.display = 'inline-flex';
        document.getElementById('btn-nuevo').textContent = '+ Nuevo Pedido';
        document.getElementById('filter-estado-container').style.display = 'block';
        document.getElementById('filter-estado').value = '';
        document.getElementById('filter-cliente-container').style.display = 'block';
        document.getElementById('filter-cliente').value = '';
        document.getElementById('search-input').placeholder = 'Buscar...';
        document.getElementById('search-input').style.display = 'none';

        this.currentEstado = '';
        this.currentCliente = '';
        Components.pagination.reset();
        this.init();
        this.loadClientes();
        this.loadData();
    },

    deactivate() {
        document.getElementById('search-input').style.display = 'block';
        document.getElementById('filter-cliente-container').style.display = 'none';
    }
};
