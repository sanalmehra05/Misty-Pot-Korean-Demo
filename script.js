document.addEventListener('DOMContentLoaded', () => {
    // Navigation active state highlight
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.style.color = 'var(--accent-yellow)';
            link.style.borderBottom = '2px solid var(--accent-yellow)';
        }
    });

    // Cart State management
    // Cart is now an array of objects to handle same items with different options
    let cart = JSON.parse(localStorage.getItem('mistyCartV3')) || [];

    const updateCartUI = () => {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCountBadge = document.querySelectorAll('.cart-count');
        const cartTotalSpan = document.getElementById('cart-total-amount');

        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Your cart is empty.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map((item, index) => {
                const optionsList = item.options.length > 0
                    ? `<div style="font-size: 0.75rem; color: var(--accent-purple);">+ ${item.options.map(o => o.name).join(', ')}</div>`
                    : '';
                const editBtn = item.options.length > 0
                    ? `<button class="edit-cart-item" data-index="${index}" style="background:none; border:none; color:var(--accent-purple); cursor:pointer; font-size: 0.75rem; text-decoration: underline; padding: 0;">Edit Options</button>`
                    : '';
                return `
                    <div class="cart-item">
                        <div style="flex-grow: 1;">
                            <p style="font-weight: 700;">${item.name}</p>
                            ${optionsList}
                            ${editBtn}
                            <p style="font-size: 0.8rem;">$${item.price.toFixed(2)} x ${item.qty}</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button class="cart-qty-btn minus" data-index="${index}" style="cursor:pointer; font-weight:bold; border:1px solid var(--primary-blue); background:none; padding: 2px 8px;">-</button>
                            <span style="font-weight:bold;">${item.qty}</span>
                            <button class="cart-qty-btn plus" data-index="${index}" style="cursor:pointer; font-weight:bold; border:1px solid var(--primary-blue); background:none; padding: 2px 8px;">+</button>
                        </div>
                        <p style="font-weight: 800; min-width: 60px; text-align: right;">$${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                `;
            }).join('');
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        if (cartTotalSpan) cartTotalSpan.innerText = `$${total.toFixed(2)}`;

        const totalQtyCount = cart.reduce((sum, item) => sum + item.qty, 0);
        cartCountBadge.forEach(count => count.innerText = totalQtyCount);

        localStorage.setItem('mistyCartV3', JSON.stringify(cart));
        syncQuantityDisplays();
    };

    const syncQuantityDisplays = () => {
        // Only sync items that HAVE NO OPTIONS (base items)
        // For items with options, it's safer to just show the base + button or handle specially
        document.querySelectorAll('.order-card').forEach(card => {
            const id = card.getAttribute('data-id');
            const hasOptions = card.hasAttribute('data-options');
            const qtyDisplay = card.querySelector('.item-qty');
            const controls = card.querySelector('.qty-controls');
            const addBtn = card.querySelector('.add-first-btn');

            if (!qtyDisplay) return;

            // Find sum of qty for this base ID in cart
            const totalQty = cart.reduce((sum, item) => item.baseId === id ? sum + item.qty : sum, 0);

            if (totalQty > 0 && !hasOptions) {
                qtyDisplay.innerText = totalQty;
                controls.classList.add('active');
                addBtn.style.display = 'none';
            } else {
                qtyDisplay.innerText = '0';
                controls.classList.remove('active');
                addBtn.style.display = 'flex';
            }
        });
    };

    const addToCart = (baseId, name, price, qty, options = []) => {
        // Find if an item with EXACT same options exists
        const optionString = JSON.stringify(options.sort((a, b) => a.name.localeCompare(b.name)));
        const existingItem = cart.find(item => item.baseId === baseId && JSON.stringify(item.options.sort((a, b) => a.name.localeCompare(b.name))) === optionString);

        if (existingItem) {
            existingItem.qty += qty;
        } else {
            cart.push({ baseId, name, price, qty, options });
        }
        updateCartUI();
    };

    const updateItemQtyByIndex = (index, delta) => {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    };

    // Modal handle
    const modal = document.getElementById('customize-modal');
    const modalTitle = document.getElementById('modal-item-name');
    const modalContainer = document.getElementById('modal-options-container');
    const confirmBtn = document.getElementById('confirm-customize');
    let currentCustomizingItem = null;
    let editingCartIndex = -1;

    const openCustomizeModal = (card, existingOptions = null, cartIndex = -1) => {
        editingCartIndex = cartIndex;
        if (card) {
            currentCustomizingItem = {
                id: card.getAttribute('data-id'),
                name: card.querySelector('h3').innerText,
                price: parseFloat(card.querySelector('.price-tag').innerText),
                optionsData: JSON.parse(card.getAttribute('data-options'))
            };
        } else if (existingOptions && cartIndex !== -1) {
            // Editing from cart
            const cartItem = cart[cartIndex];
            // Find the base card in DOM to get full optionsData
            const baseCard = document.querySelector(`.order-card[data-id="${cartItem.baseId}"]`);
            currentCustomizingItem = {
                id: cartItem.baseId,
                name: cartItem.name,
                price: parseFloat(baseCard.querySelector('.price-tag').innerText),
                optionsData: JSON.parse(baseCard.getAttribute('data-options'))
            };
        }

        modalTitle.innerText = editingCartIndex === -1 ? `Customize ${currentCustomizingItem.name}` : `Edit ${currentCustomizingItem.name}`;
        confirmBtn.innerText = editingCartIndex === -1 ? "Add to Order" : "Update Item";
        modalContainer.innerHTML = '';

        for (const [groupName, options] of Object.entries(currentCustomizingItem.optionsData)) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'option-group';
            groupDiv.innerHTML = `<h4 class="retro-font">${groupName}</h4>`;

            options.forEach(opt => {
                const isSelected = existingOptions && existingOptions.some(o => o.name === opt.name);
                const priceText = opt.price > 0 ? ` (+ $${opt.price})` : '';
                groupDiv.innerHTML += `
                    <label class="option-item">
                        <input type="${groupName.toLowerCase().includes('sauce') ? 'radio' : 'checkbox'}" 
                               name="${groupName}" 
                               data-name="${opt.name}" 
                               data-price="${opt.price}"
                               ${isSelected ? 'checked' : ''}>
                        ${opt.name}${priceText}
                    </label>
                `;
            });
            modalContainer.appendChild(groupDiv);
        }
        modal.classList.add('active');
    };

    // Listeners
    document.addEventListener('click', (e) => {
        // Sidebar Cart Open/Close
        if (e.target.closest('#cart-icon')) {
            document.getElementById('cart-sidebar').classList.add('open');
        }
        if (e.target.id === 'close-cart') {
            document.getElementById('cart-sidebar').classList.remove('open');
        }

        // Mobile Menu Toggle
        if (e.target.closest('#mobile-menu-btn')) {
            const btn = document.getElementById('mobile-menu-btn');
            const nav = document.querySelector('.nav-links');
            btn.classList.toggle('active');
            nav.classList.toggle('active');
        }

        // Close mobile menu when clicking a link
        if (e.target.closest('.nav-links a')) {
            const btn = document.getElementById('mobile-menu-btn');
            const nav = document.querySelector('.nav-links');
            if (btn) btn.classList.remove('active');
            if (nav) nav.classList.remove('active');
        }

        // Add Button
        if (e.target.classList.contains('add-first-btn')) {
            const card = e.target.closest('.order-card');
            const hasOptions = card.hasAttribute('data-options');

            if (hasOptions) {
                openCustomizeModal(card);
            } else {
                const id = card.getAttribute('data-id');
                const name = e.target.getAttribute('data-name');
                const price = parseFloat(e.target.getAttribute('data-price'));
                addToCart(id, name, price, 1);
            }
        }

        // +/- Grid context (only for non-option items)
        if (e.target.classList.contains('qty-btn')) {
            const id = e.target.closest('.order-card').getAttribute('data-id');
            const delta = e.target.classList.contains('plus') ? 1 : -1;
            // Find the item index in cart for this baseId (no options)
            const index = cart.findIndex(item => item.baseId === id && item.options.length === 0);
            if (index !== -1) {
                updateItemQtyByIndex(index, delta);
            }
        }

        // Edit Cart Item context
        if (e.target.classList.contains('edit-cart-item')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const cartItem = cart[index];
            openCustomizeModal(null, cartItem.options, index);
        }

        // +/- Cart context
        if (e.target.classList.contains('cart-qty-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const delta = e.target.classList.contains('plus') ? 1 : -1;
            updateItemQtyByIndex(index, delta);
        }

        // Modal confirm/cancel
        if (e.target.id === 'cancel-customize') {
            modal.classList.remove('active');
        }
        if (e.target.id === 'confirm-customize') {
            const selectedOptions = [];
            let extraPrice = 0;
            modalContainer.querySelectorAll('input:checked').forEach(input => {
                selectedOptions.push({
                    name: input.getAttribute('data-name'),
                    price: parseFloat(input.getAttribute('data-price'))
                });
                extraPrice += parseFloat(input.getAttribute('data-price'));
            });

            if (editingCartIndex === -1) {
                addToCart(
                    currentCustomizingItem.id,
                    currentCustomizingItem.name,
                    currentCustomizingItem.price + extraPrice,
                    1,
                    selectedOptions
                );
            } else {
                // Update existing item
                cart[editingCartIndex].options = selectedOptions;
                cart[editingCartIndex].price = currentCustomizingItem.price + extraPrice;
                updateCartUI();
            }
            modal.classList.remove('active');
            document.getElementById('cart-sidebar').classList.add('open');
        }

        // Checkout Button
        if (e.target.classList.contains('checkout-btn')) {
            if (cart.length === 0) {
                alert('Your cart is empty!');
            } else {
                const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
                alert(`Misty Pot Order Placed!\n-------------------\nTotal: $${total.toFixed(2)}\n\nYour fresh Korean feast is being prepared!`);
                cart = [];
                updateCartUI();
                document.getElementById('cart-sidebar').classList.remove('open');
            }
        }

        // Category Filter
        if (e.target.classList.contains('cat-btn')) {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.getAttribute('data-category');
            document.querySelectorAll('.order-card').forEach(card => {
                card.style.display = (category === 'all' || card.getAttribute('data-category') === category) ? 'flex' : 'none';
            });
        }
    });

    // Initial Sync
    updateCartUI();
});
