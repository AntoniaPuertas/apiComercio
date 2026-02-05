/**
 * Modulo Mis Pedidos - Vista de pedidos del cliente
 */

const MisPedidosModule = {
    pedidos: [],
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    filtroEstado: '',

    // =========================================
    // Activacion/Desactivacion
    // =========================================

    activate() {
        this.render();
        this.loadPedidos();
    },

    deactivate() {
        // Limpiar si es necesario
    },

    // =========================================
    // Renderizado
    // =========================================

    render() {
        const container = document.getElementById('content-container');
        if (!container) return;

        container.innerHTML = `
            <!-- Filtros -->
            <div class="filters-bar">
                <div class="filter-select">
                    <select id="filter-estado">
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="procesando">Procesando</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            <!-- Tabla de pedidos -->
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="pedidos-body">
                        <!-- Contenido dinamico -->
                    </tbody>
                </table>
                <div id="loading" class="loading" style="display: none;">Cargando...</div>
                <div id="empty-state" class="empty-state" style="display: none;">
                    No tienes pedidos aun
                </div>
            </div>

            <!-- Paginacion -->
            <div class="pagination">
                <button id="btn-prev" class="btn btn-secondary" disabled>Anterior</button>
                <span id="pagination-info">Pagina 1 de 1</span>
                <button id="btn-next" class="btn btn-secondary" disabled>Siguiente</button>
            </div>
        `;

        this.setupEventListeners();
    },

    setupEventListeners() {
        // Filtro de estado
        const filterEstado = document.getElementById('filter-estado');
        if (filterEstado) {
            filterEstado.value = this.filtroEstado;
            filterEstado.addEventListener('change', (e) => {
                this.filtroEstado = e.target.value;
                this.currentPage = 1;
                this.loadPedidos();
            });
        }

        // Paginacion
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadPedidos();
                }
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.loadPedidos();
                }
            });
        }
    },

    // =========================================
    // Carga de datos
    // =========================================

    async loadPedidos() {
        const tbody = document.getElementById('pedidos-body');
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('empty-state');

        if (!tbody) return;

        // Mostrar loading
        tbody.innerHTML = '';
        if (loading) loading.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        try {
            let url = `/pedidos?page=${this.currentPage}&limit=${this.limit}`;
            if (this.filtroEstado) {
                url += `&estado=${this.filtroEstado}`;
            }

            const response = await API.get(url);

            if (loading) loading.style.display = 'none';

            if (response.success && response.data) {
                this.pedidos = response.data;
                this.totalPages = response.pagination?.total_pages || 1;

                if (this.pedidos.length === 0) {
                    if (emptyState) emptyState.style.display = 'block';
                } else {
                    this.renderPedidos();
                }

                this.updatePagination();
            } else {
                throw new Error(response.error || 'Error al cargar pedidos');
            }
        } catch (error) {
            if (loading) loading.style.display = 'none';
            console.error('Error cargando pedidos:', error);
            ClienteApp.showToast('Error al cargar los pedidos', 'error');
        }
    },

    renderPedidos() {
        const tbody = document.getElementById('pedidos-body');
        if (!tbody) return;

        tbody.innerHTML = this.pedidos.map(pedido => `
            <tr>
                <td>#${pedido.id}</td>
                <td>${this.formatDate(pedido.created_at)}</td>
                <td><span class="badge badge-${this.getEstadoClass(pedido.estado)}">${pedido.estado}</span></td>
                <td>$${parseFloat(pedido.total).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="MisPedidosModule.verDetalles(${pedido.id})">
                        Ver detalles
                    </button>
                </td>
            </tr>
        `).join('');
    },

    updatePagination() {
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        const info = document.getElementById('pagination-info');

        if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
        if (btnNext) btnNext.disabled = this.currentPage >= this.totalPages;
        if (info) info.textContent = `Pagina ${this.currentPage} de ${this.totalPages}`;
    },

    // =========================================
    // Ver detalles
    // =========================================

    async verDetalles(pedidoId) {
        try {
            const response = await API.get(`/pedidos/${pedidoId}`);

            if (response.success && response.data) {
                const pedido = response.data;
                const detalles = pedido.detalles || [];

                const content = `
                    <div class="pedido-detalles">
                        <div class="pedido-info">
                            <p><strong>Pedido #${pedido.id}</strong></p>
                            <p><strong>Fecha:</strong> ${this.formatDate(pedido.created_at)}</p>
                            <p><strong>Estado:</strong> <span class="badge badge-${this.getEstadoClass(pedido.estado)}">${pedido.estado}</span></p>
                            <p><strong>Direccion de envio:</strong> ${pedido.direccion_envio}</p>
                            ${pedido.notas ? `<p><strong>Notas:</strong> ${pedido.notas}</p>` : ''}
                        </div>

                        <h4 style="margin-top: 20px;">Productos</h4>
                        <table class="data-table" style="margin-top: 10px;">
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
                                        <td>${d.producto_nombre || 'Producto #' + d.producto_id}</td>
                                        <td>${d.cantidad}</td>
                                        <td>$${parseFloat(d.precio_unitario).toFixed(2)}</td>
                                        <td>$${parseFloat(d.subtotal).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                                    <td><strong>$${parseFloat(pedido.total).toFixed(2)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `;

                ClienteApp.openModal(`Pedido #${pedido.id}`, content, false);
            } else {
                throw new Error(response.error || 'Error al cargar detalles');
            }
        } catch (error) {
            console.error('Error cargando detalles:', error);
            ClienteApp.showToast('Error al cargar los detalles del pedido', 'error');
        }
    },

    // =========================================
    // Utilidades
    // =========================================

    formatDate(dateString) {
        if (!dateString) return '-';
        // MySQL devuelve "YYYY-MM-DD HH:MM:SS", convertir a formato ISO
        const isoString = dateString.replace(' ', 'T');
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return dateString; // Fallback si no se puede parsear
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getEstadoClass(estado) {
        const clases = {
            'pendiente': 'warning',
            'procesando': 'info',
            'enviado': 'primary',
            'entregado': 'success',
            'cancelado': 'danger'
        };
        return clases[estado] || 'secondary';
    }
};
