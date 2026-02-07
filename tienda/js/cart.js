/**
 * Cart - Modulo de carrito de compras con localStorage
 */

const Cart = {
    STORAGE_KEY: 'tienda_cart',
    items: [],

    init() {
        this.load();
        this.updateBadge();
    },

    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.items = stored ? JSON.parse(stored) : [];
        } catch (e) {
            this.items = [];
        }
    },

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        this.updateBadge();
    },

    addItem(producto, cantidad = 1) {
        const existing = this.items.find(item => item.producto_id === producto.id);

        if (existing) {
            existing.cantidad += cantidad;
        } else {
            this.items.push({
                producto_id: producto.id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                precio: parseFloat(producto.precio),
                categoria: producto.categoria || '',
                cantidad: cantidad
            });
        }

        this.save();
    },

    removeItem(productoId) {
        this.items = this.items.filter(item => item.producto_id !== productoId);
        this.save();
    },

    updateQuantity(productoId, cantidad) {
        if (cantidad < 1) {
            this.removeItem(productoId);
            return;
        }

        const item = this.items.find(item => item.producto_id === productoId);
        if (item) {
            item.cantidad = cantidad;
            this.save();
        }
    },

    clear() {
        this.items = [];
        this.save();
    },

    getItems() {
        return this.items;
    },

    getItemCount() {
        return this.items.reduce((total, item) => total + item.cantidad, 0);
    },

    getTotal() {
        return this.items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    },

    updateBadge() {
        const badge = document.getElementById('cart-count');
        if (!badge) return;

        const count = this.getItemCount();
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    },

    toOrderProducts() {
        return this.items.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad
        }));
    }
};
