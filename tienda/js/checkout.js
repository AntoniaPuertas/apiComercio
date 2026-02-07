/**
 * CheckoutModule - Flujo de checkout en 3 pasos
 */

const CheckoutModule = {
    step: 1,
    shippingData: {},

    activate() {
        // Verificar que hay items en el carrito
        if (Cart.getItemCount() === 0) {
            TiendaApp.navigateTo('catalog');
            TiendaApp.showToast('Tu carrito esta vacio', 'info');
            return;
        }

        // Verificar autenticacion
        if (!Auth.isAuthenticated()) {
            AuthModal.showLogin(() => {
                // Callback: volver a intentar checkout tras login
                TiendaApp.navigateTo('checkout');
            });
            TiendaApp.showToast('Debes iniciar sesion para realizar un pedido', 'info');
            return;
        }

        this.step = 1;
        this.render();
    },

    deactivate() {},

    render() {
        const container = document.getElementById('store-content');
        container.innerHTML = `
            <div class="checkout-container">
                <h2>Finalizar Compra</h2>
                <div class="checkout-steps">
                    <div class="checkout-step ${this.step >= 1 ? (this.step > 1 ? 'completed' : 'active') : ''}">
                        1. Revision
                    </div>
                    <div class="checkout-step ${this.step >= 2 ? (this.step > 2 ? 'completed' : 'active') : ''}">
                        2. Envio
                    </div>
                    <div class="checkout-step ${this.step >= 3 ? 'active' : ''}">
                        3. Confirmacion
                    </div>
                </div>
                <div id="checkout-content"></div>
            </div>
        `;

        switch (this.step) {
            case 1: this.renderStep1(); break;
            case 2: this.renderStep2(); break;
            case 3: this.renderStep3(); break;
        }
    },

    renderStep1() {
        const items = Cart.getItems();
        const total = Cart.getTotal();

        const content = document.getElementById('checkout-content');
        content.innerHTML = `
            <div class="checkout-section">
                <h3>Revisa tu pedido</h3>
                <table class="order-items-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.nombre}</td>
                                <td>${item.precio.toFixed(2)} &euro;</td>
                                <td>
                                    <div class="cart-item-quantity">
                                        <button onclick="CheckoutModule.updateQty(${item.producto_id}, ${item.cantidad - 1})">-</button>
                                        <span>${item.cantidad}</span>
                                        <button onclick="CheckoutModule.updateQty(${item.producto_id}, ${item.cantidad + 1})">+</button>
                                    </div>
                                </td>
                                <td class="text-right">${(item.precio * item.cantidad).toFixed(2)} &euro;</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-right">Total</td>
                            <td class="text-right">${total.toFixed(2)} &euro;</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="checkout-actions">
                <button class="btn btn-secondary" onclick="TiendaApp.navigateTo('cart')">Volver al carrito</button>
                <button class="btn btn-primary" onclick="CheckoutModule.nextStep()">Continuar</button>
            </div>
        `;
    },

    renderStep2() {
        const content = document.getElementById('checkout-content');
        content.innerHTML = `
            <div class="checkout-section">
                <h3>Datos de Envio</h3>
                <div class="form-group">
                    <label for="checkout-direccion">Direccion de envio *</label>
                    <input type="text" id="checkout-direccion" placeholder="Calle, numero, piso..."
                        value="${this.shippingData.direccion_envio || ''}">
                </div>
                <div class="form-group">
                    <label for="checkout-ciudad">Ciudad *</label>
                    <input type="text" id="checkout-ciudad" placeholder="Tu ciudad"
                        value="${this.shippingData.ciudad || ''}">
                </div>
                <div class="form-group">
                    <label for="checkout-notas">Notas del pedido (opcional)</label>
                    <textarea id="checkout-notas" placeholder="Instrucciones especiales de entrega...">${this.shippingData.notas || ''}</textarea>
                </div>
            </div>
            <div class="checkout-actions">
                <button class="btn btn-secondary" onclick="CheckoutModule.prevStep()">Volver</button>
                <button class="btn btn-primary" onclick="CheckoutModule.nextStep()">Continuar</button>
            </div>
        `;

        setTimeout(() => document.getElementById('checkout-direccion').focus(), 100);
    },

    renderStep3() {
        const items = Cart.getItems();
        const total = Cart.getTotal();
        const user = Auth.getUser();

        const content = document.getElementById('checkout-content');
        content.innerHTML = `
            <div class="checkout-section">
                <h3>Confirma tu pedido</h3>

                <div class="pedido-info">
                    <p><strong>Cliente:</strong> ${user.nombre} (${user.email})</p>
                    <p><strong>Direccion:</strong> ${this.shippingData.direccion_envio}</p>
                    <p><strong>Ciudad:</strong> ${this.shippingData.ciudad}</p>
                    ${this.shippingData.notas ? `<p><strong>Notas:</strong> ${this.shippingData.notas}</p>` : ''}
                </div>

                <table class="order-items-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.nombre}</td>
                                <td>${item.precio.toFixed(2)} &euro;</td>
                                <td>${item.cantidad}</td>
                                <td class="text-right">${(item.precio * item.cantidad).toFixed(2)} &euro;</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-right">Total</td>
                            <td class="text-right"><strong>${total.toFixed(2)} &euro;</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="checkout-actions">
                <button class="btn btn-secondary" onclick="CheckoutModule.prevStep()">Volver</button>
                <button class="btn btn-primary" id="btn-place-order" onclick="CheckoutModule.placeOrder()">Confirmar Pedido</button>
            </div>
        `;
    },

    updateQty(productoId, cantidad) {
        if (cantidad < 1) {
            Cart.removeItem(productoId);
            // Si el carrito queda vacio, volver al catalogo
            if (Cart.getItemCount() === 0) {
                TiendaApp.navigateTo('catalog');
                TiendaApp.showToast('Carrito vacio', 'info');
                return;
            }
        } else {
            Cart.updateQuantity(productoId, cantidad);
        }
        this.renderStep1();
    },

    nextStep() {
        if (this.step === 2) {
            // Validar datos de envio
            const direccion = document.getElementById('checkout-direccion').value.trim();
            const ciudad = document.getElementById('checkout-ciudad').value.trim();
            const notas = document.getElementById('checkout-notas').value.trim();

            if (!direccion || !ciudad) {
                TiendaApp.showToast('Direccion y ciudad son requeridos', 'error');
                return;
            }

            this.shippingData = { direccion_envio: direccion, ciudad: ciudad, notas: notas };
        }

        this.step++;
        this.render();
    },

    prevStep() {
        // Guardar datos de envio si estamos en paso 2
        if (this.step === 2) {
            const direccion = document.getElementById('checkout-direccion');
            const ciudad = document.getElementById('checkout-ciudad');
            const notas = document.getElementById('checkout-notas');
            if (direccion && ciudad) {
                this.shippingData = {
                    direccion_envio: direccion.value.trim(),
                    ciudad: ciudad.value.trim(),
                    notas: notas ? notas.value.trim() : ''
                };
            }
        }
        this.step--;
        this.render();
    },

    async placeOrder() {
        const btn = document.getElementById('btn-place-order');
        btn.disabled = true;
        btn.textContent = 'Procesando pedido...';

        try {
            const orderData = {
                direccion_envio: this.shippingData.direccion_envio,
                ciudad: this.shippingData.ciudad,
                notas: this.shippingData.notas || null,
                productos: Cart.toOrderProducts()
            };

            const response = await API.tienda.createOrder(orderData);

            // Limpiar carrito
            Cart.clear();
            this.shippingData = {};
            this.step = 1;

            // Mostrar exito
            const container = document.getElementById('store-content');
            container.innerHTML = `
                <div class="order-success">
                    <div class="order-success-icon">&#10004;</div>
                    <h2>Pedido realizado con exito</h2>
                    <p>Tu pedido #${response.pedido_id} ha sido creado y esta pendiente de procesamiento.</p>
                    <button class="btn btn-primary" onclick="TiendaApp.navigateTo('catalog')">Seguir Comprando</button>
                    <a href="/apiComercio/cliente/index.html" class="btn btn-secondary">Ver Mis Pedidos</a>
                </div>
            `;

        } catch (error) {
            TiendaApp.showToast(error.message || 'Error al crear el pedido', 'error');
            btn.disabled = false;
            btn.textContent = 'Confirmar Pedido';
        }
    }
};

/**
 * CartViewModule - Vista del carrito (sin checkout)
 */

const CartViewModule = {
    activate() {
        this.render();
    },

    deactivate() {},

    render() {
        const container = document.getElementById('store-content');
        const items = Cart.getItems();

        if (items.length === 0) {
            container.innerHTML = `
                <div class="cart-container">
                    <div class="cart-empty">
                        <div class="cart-empty-icon">&#128722;</div>
                        <h3>Tu carrito esta vacio</h3>
                        <p>Agrega productos desde el catalogo</p>
                        <button class="btn btn-primary" onclick="TiendaApp.navigateTo('catalog')">Ver Catalogo</button>
                    </div>
                </div>
            `;
            return;
        }

        const total = Cart.getTotal();

        container.innerHTML = `
            <div class="cart-container">
                <h2>Carrito de Compras</h2>
                <div class="cart-items">
                    ${items.map(item => `
                        <div class="cart-item">
                            <div class="cart-item-image">&#128230;</div>
                            <div class="cart-item-info">
                                <div class="cart-item-name">${item.nombre}</div>
                                <div class="cart-item-price">${item.precio.toFixed(2)} &euro; / unidad</div>
                            </div>
                            <div class="cart-item-quantity">
                                <button onclick="CartViewModule.updateQty(${item.producto_id}, ${item.cantidad - 1})">-</button>
                                <span>${item.cantidad}</span>
                                <button onclick="CartViewModule.updateQty(${item.producto_id}, ${item.cantidad + 1})">+</button>
                            </div>
                            <div class="cart-item-subtotal">${(item.precio * item.cantidad).toFixed(2)} &euro;</div>
                            <button class="cart-item-remove" onclick="CartViewModule.removeItem(${item.producto_id})">&times;</button>
                        </div>
                    `).join('')}
                </div>

                <div class="cart-summary">
                    <div class="cart-summary-row">
                        <span>Productos (${Cart.getItemCount()})</span>
                        <span>${total.toFixed(2)} &euro;</span>
                    </div>
                    <div class="cart-summary-row cart-summary-total">
                        <span>Total</span>
                        <span>${total.toFixed(2)} &euro;</span>
                    </div>
                    <div class="cart-actions">
                        <button class="btn btn-secondary" onclick="TiendaApp.navigateTo('catalog')">Seguir Comprando</button>
                        <button class="btn btn-primary" onclick="TiendaApp.navigateTo('checkout')">Proceder al Pago</button>
                    </div>
                </div>
            </div>
        `;
    },

    updateQty(productoId, cantidad) {
        if (cantidad < 1) {
            Cart.removeItem(productoId);
        } else {
            Cart.updateQuantity(productoId, cantidad);
        }
        this.render();
    },

    removeItem(productoId) {
        Cart.removeItem(productoId);
        this.render();
        TiendaApp.showToast('Producto eliminado del carrito', 'info');
    }
};
