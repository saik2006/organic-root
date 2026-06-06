/* ============================================================
   ORGANICROOT — Main App JS
   Handles: UI routing, cart, product rendering, checkout flow,
   contact form (EmailJS), order tracking
   ============================================================ */

// ── State ──────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('or_cart') || '[]');
let currentPage = 'home';
let currentCategory = 'all';
let searchQuery = '';

// ── DOM Ready ──────────────────────────────────────────────
function initApp() {
  renderNav();
  renderHome();
  updateCartBadge();
  setupEventListeners();
}

document.addEventListener('DOMContentLoaded', initApp);
window.initApp = initApp;

// ── Page Router ────────────────────────────────────────────
function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-home')?.classList.toggle('active', page === 'home');
  document.getElementById('page-shop')?.classList.toggle('active', page === 'shop');
  document.getElementById('page-account')?.classList.toggle('active', page === 'account');
  document.getElementById('page-contact')?.classList.toggle('active', page === 'contact');
  document.getElementById('page-blog')?.classList.toggle('active', page === 'blog');
  document.getElementById('page-track')?.classList.toggle('active', page === 'track');

  if (page === 'shop') renderShopPage();
  if (page === 'account') renderAccountPage();
  if (page === 'blog') renderBlogPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Render Home ────────────────────────────────────────────
function renderHome() {
  const grid = document.getElementById('home-products');
  if (!grid) return;
  const featured = window.PRODUCTS.slice(0, 8);
  grid.innerHTML = '';
  featured.forEach(p => grid.appendChild(buildProductCard(p)));
}

// ── Render Shop Page ───────────────────────────────────────
function renderShopPage() {
  const grid = document.getElementById('shop-products');
  if (!grid) return;
  let filtered = window.PRODUCTS;
  if (currentCategory !== 'all') filtered = filtered.filter(p => p.category === currentCategory);
  if (searchQuery) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );
  grid.innerHTML = '';
  filtered.forEach(p => {
    const card = buildProductCard(p);
    grid.appendChild(card);
  });
}

// ── Product Grid Builder ───────────────────────────────────
function createProductGrid(products, id) {
  const grid = document.createElement('div');
  grid.className = 'products-grid';
  grid.id = id;
  products.forEach(p => grid.appendChild(buildProductCard(p)));
  return grid;
}

function buildProductCard(product) {
  const inCart = cart.find(i => i.id === product.id);
  const outOfStock = product.available === false;
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-img" style="${outOfStock ? 'opacity:0.6;filter:grayscale(0.4)' : ''}">
      <span>${product.emoji}</span>
      ${outOfStock ? '<div class="product-badge" style="background:var(--bark)">Out of Stock</div>' : (product.badge ? `<div class="product-badge">${product.badge}</div>` : '')}
      <div class="product-unit">${product.unit}</div>
    </div>
    <div class="product-info">
      <h3>${product.name}</h3>
      <p class="product-desc">${product.desc}</p>
      <div class="product-footer">
        <div class="product-price">₹${product.price} <s>₹${product.originalPrice}</s></div>
        <button class="btn-add ${outOfStock ? 'in-cart' : inCart ? 'in-cart' : ''}" 
          data-id="${product.id}" ${outOfStock ? 'disabled style="cursor:not-allowed;opacity:0.6"' : ''}>
          ${outOfStock ? 'Out of Stock' : inCart ? '✓ Added' : '+ Add'}
        </button>
      </div>
    </div>
  `;
  if (!outOfStock) {
    card.querySelector('.btn-add').addEventListener('click', (e) => {
      addToCart(product.id);
      e.target.textContent = '✓ Added';
      e.target.classList.add('in-cart');
    });
  }
  return card;
}

// ── Cart Functions ─────────────────────────────────────────
function addToCart(productId) {
  const product = window.PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  renderCartItems();
  showToast(`${product.emoji} ${product.name} added to cart`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartBadge();
  renderCartItems();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else {
    saveCart();
    updateCartBadge();
    renderCartItems();
  }
}

function saveCart() {
  localStorage.setItem('or_cart', JSON.stringify(cart));
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const p = window.PRODUCTS.find(x => x.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

function renderCartItems() {
  const body = document.getElementById('cart-body');
  if (!body) return;
  const footer = document.getElementById('cart-footer');

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🧺</div>
        <h4>Your basket is empty</h4>
        <p>Add some fresh, organic goodness to get started.</p>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';
  body.innerHTML = cart.map(item => {
    const p = window.PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="cart-item-emoji">${p.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">₹${p.price} × ${item.qty} = ₹${p.price * item.qty}</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" data-id="${p.id}" data-delta="-1">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" data-id="${p.id}" data-delta="1">+</button>
        </div>
      </div>`;
  }).join('');

  body.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      updateQty(btn.dataset.id, parseInt(btn.dataset.delta));
    });
  });

  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = `₹${cartTotal()}`;
}

// ── Open/Close Cart ────────────────────────────────────────
function openCart() {
  renderCartItems();
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

// ── Auth Modal (Sign In / Sign Up) ─────────────────────────
function openSignIn() {
  showModal('modal-auth');
  document.getElementById('auth-form-signin').style.display = 'block';
  document.getElementById('auth-form-signup').style.display = 'none';
  document.getElementById('auth-form-forgot').style.display = 'none';
}

function showModal(id) {
  document.querySelectorAll('.modal-wrapper').forEach(m => m.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// ── Checkout Flow ──────────────────────────────────────────
let checkoutStep = 1;
let checkoutData = {};
let appliedCoupon = null;

// Coupon codes — add more in admin panel later
const COUPONS = {
  'ORGANIC10': { type: 'percent', value: 10, desc: '10% off your order' },
  'WELCOME20': { type: 'percent', value: 20, desc: '20% off your order' },
};

function discountedTotal() {
  const base = cartTotal();
  if (!appliedCoupon) return base;
  if (appliedCoupon.type === 'percent') return Math.round(base * (1 - appliedCoupon.value / 100));
  return Math.max(0, base - appliedCoupon.value);
}

function applyCoupon(code) {
  const coupon = COUPONS[code.toUpperCase()];
  if (!coupon) { showToast('Invalid coupon code', 'error'); return; }
  appliedCoupon = { ...coupon, code: code.toUpperCase() };
  showToast(`✓ Coupon applied — ${coupon.desc}`, 'success');
  renderCheckoutStep();
}

function removeCoupon() {
  appliedCoupon = null;
  renderCheckoutStep();
}

function openCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty', 'error'); return; }
  if (!window.currentUser) {
    openSignIn();
    showToast('Please sign in to continue', 'error');
    return;
  }
  checkoutStep = 1;
  closeCart();
  document.getElementById('checkout-wrapper').classList.add('active');
  renderCheckoutStep();
}

function renderCheckoutStep() {
  const body = document.getElementById('checkout-body');
  updateStepTrack();

  if (checkoutStep === 1) {
    body.innerHTML = `
      <div class="order-recap">
        <h4>Order Summary</h4>
        ${cart.map(item => {
          const p = window.PRODUCTS.find(x => x.id === item.id);
          return p ? `<div class="recap-item"><span>${p.emoji} ${p.name} ×${item.qty}</span><strong>₹${p.price * item.qty}</strong></div>` : '';
        }).join('')}
        <hr class="recap-divider">
        ${appliedCoupon ? `
          <div class="recap-item"><span>Subtotal</span><strong>₹${cartTotal()}</strong></div>
          <div class="recap-item" style="color:var(--olive)"><span>🎟 ${appliedCoupon.code} (${appliedCoupon.desc})</span><strong>−₹${cartTotal() - discountedTotal()}</strong></div>
          <hr class="recap-divider">` : ''}
        <div class="recap-total"><span>Total</span><span>₹${discountedTotal()}</span></div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:18px;align-items:center">
        ${appliedCoupon ? `
          <div style="flex:1;background:var(--olive-pale);border:1.5px solid var(--olive);border-radius:11px;padding:11px 16px;font-size:13.5px;font-weight:600;color:var(--olive)">
            🎟 ${appliedCoupon.code} applied
          </div>
          <button onclick="removeCoupon()" style="background:none;border:1.5px solid var(--border);border-radius:11px;padding:11px 14px;cursor:pointer;font-size:13px;color:var(--text-muted);font-family:'DM Sans',sans-serif">Remove</button>
        ` : `
          <input type="text" id="coupon-input" placeholder="Have a coupon code?" 
            style="flex:1;padding:11px 16px;border:2px solid var(--border);border-radius:11px;font-size:13.5px;font-family:'DM Sans',sans-serif;outline:none;background:var(--cream);text-transform:uppercase"
            onfocus="this.style.borderColor='var(--olive)'" onblur="this.style.borderColor='var(--border)'">
          <button onclick="applyCoupon(document.getElementById('coupon-input').value)" 
            style="background:var(--olive);color:#fff;border:none;border-radius:11px;padding:11px 18px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">Apply</button>
        `}
      </div>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="co-name" placeholder="Your name" value="${window.currentUser?.displayName || ''}">
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input type="tel" id="co-phone" placeholder="+91 XXXXX XXXXX" value="${checkoutData.phone || ''}">
      </div>
      <div class="form-group">
        <label>Delivery Address</label>
        <textarea id="co-address" placeholder="House/Flat number, Street, Area, City, PIN code">${checkoutData.address || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Delivery Time Preference</label>
        <select id="co-time">
          <option>Morning (7am – 12pm)</option>
          <option>Afternoon (12pm – 5pm)</option>
          <option>Evening (5pm – 9pm)</option>
        </select>
      </div>
      <div class="checkout-nav">
        <button class="btn-next" id="co-next-1">Continue to Payment →</button>
      </div>`;

    document.getElementById('co-next-1').onclick = () => {
      const name = document.getElementById('co-name').value.trim();
      const phone = document.getElementById('co-phone').value.trim();
      const address = document.getElementById('co-address').value.trim();
      if (!name || !phone || !address) { showToast('Please fill in all fields', 'error'); return; }
      const deliverySlot = document.getElementById('co-time').value.includes('Morning') ? 'morning' : document.getElementById('co-time').value.includes('Afternoon') ? 'afternoon' : 'evening';
      checkoutData = { ...checkoutData, name, phone, address, deliverySlot };
      checkoutStep = 2;
      renderCheckoutStep();
    };

  } else if (checkoutStep === 2) {
    body.innerHTML = `
      <div class="order-recap">
        <div class="recap-item"><span>Delivering to</span><strong>${checkoutData.name}</strong></div>
        <div class="recap-item"><span>Address</span><strong style="max-width:200px;text-align:right">${checkoutData.address}</strong></div>
        ${appliedCoupon ? `<div class="recap-item" style="color:var(--olive)"><span>🎟 ${appliedCoupon.code}</span><strong>−₹${cartTotal() - discountedTotal()}</strong></div>` : ''}
        <hr class="recap-divider">
        <div class="recap-total"><span>Total</span><span>₹${discountedTotal()}</span></div>
      </div>
      <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:16px;font-weight:600">Select Payment Method</p>
      <div class="pay-grid">
        <div class="pay-tile selected" data-pay="upi"><span class="pay-tile-icon">📲</span>UPI</div>
        <div class="pay-tile" data-pay="card"><span class="pay-tile-icon">💳</span>Card</div>
        <div class="pay-tile" data-pay="netbanking"><span class="pay-tile-icon">🏦</span>Net Banking</div>
        <div class="pay-tile" data-pay="cod"><span class="pay-tile-icon">💵</span>Cash on Delivery</div>
      </div>
      <div id="pay-detail">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Select UPI app</p>
        <div class="upi-apps">
          <div class="upi-app selected" data-upi="gpay">📗<br>Google Pay</div>
          <div class="upi-app" data-upi="phonepe">📘<br>PhonePe</div>
          <div class="upi-app" data-upi="paytm">📙<br>Paytm</div>
          <div class="upi-app" data-upi="bhim">🇮🇳<br>BHIM</div>
        </div>
        <div class="form-group">
          <label>UPI ID (optional)</label>
          <input type="text" placeholder="yourname@upi">
        </div>
      </div>
      <div class="checkout-nav">
        <button class="btn-back" id="co-back-2">← Back</button>
        <button class="btn-pay" id="co-pay">Pay ₹${discountedTotal()}</button>
      </div>`;

    // Payment method toggle
    body.querySelectorAll('.pay-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        body.querySelectorAll('.pay-tile').forEach(t => t.classList.remove('selected'));
        tile.classList.add('selected');
        checkoutData.payMethod = tile.dataset.pay;
        const detail = document.getElementById('pay-detail');
        if (tile.dataset.pay === 'upi') {
          detail.innerHTML = `<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Select UPI app</p>
          <div class="upi-apps">
            <div class="upi-app selected">📗<br>Google Pay</div>
            <div class="upi-app">📘<br>PhonePe</div>
            <div class="upi-app">📙<br>Paytm</div>
            <div class="upi-app">🇮🇳<br>BHIM</div>
          </div>
          <div class="form-group"><label>UPI ID (optional)</label><input type="text" placeholder="yourname@upi"></div>`;
        } else if (tile.dataset.pay === 'card') {
          detail.innerHTML = `<div class="form-group"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456"></div>
          <div class="form-row">
            <div class="form-group"><label>Expiry</label><input type="text" placeholder="MM/YY"></div>
            <div class="form-group"><label>CVV</label><input type="text" placeholder="•••" maxlength="3"></div>
          </div>
          <div class="form-group"><label>Name on Card</label><input type="text" placeholder="As printed on card"></div>`;
        } else if (tile.dataset.pay === 'netbanking') {
          detail.innerHTML = `<div class="form-group"><label>Select Bank</label>
          <select><option>HDFC Bank</option><option>SBI</option><option>ICICI Bank</option><option>Axis Bank</option><option>Kotak Bank</option><option>Other</option></select></div>`;
        } else {
          detail.innerHTML = `<div style="background:var(--olive-pale);border-radius:12px;padding:16px;font-size:14px;color:var(--olive);font-weight:500">💚 Cash on delivery available. Our delivery partner will collect the payment at your doorstep.</div>`;
        }
      });
    });

    document.getElementById('co-back-2').onclick = () => { checkoutStep = 1; renderCheckoutStep(); };
    document.getElementById('co-pay').onclick = processPayment;

  } else if (checkoutStep === 3) {
    // Processing
    body.innerHTML = `
      <div class="processing show">
        <div class="spinner"></div>
        <p style="font-size:16px;font-weight:600;color:var(--clay)">Processing your order…</p>
        <p style="font-size:13px;color:var(--text-muted);margin-top:8px">Please wait, do not close this window.</p>
      </div>`;

    setTimeout(() => {
      checkoutStep = 4;
      renderCheckoutStep();
    }, 2200);

  } else if (checkoutStep === 4) {
    const orderId = 'OR' + Date.now().toString().slice(-8);
    // Save order to Firebase if available
    saveOrder(orderId);

    body.innerHTML = `
      <div style="text-align:center;padding:40px 20px">
        <div style="font-size:72px;margin-bottom:16px">🌿</div>
        <h3 style="font-size:26px;color:var(--clay);margin-bottom:10px;font-family:'Cormorant Garamond',serif">Order Placed!</h3>
        <p style="font-size:15px;color:var(--text-muted);margin-bottom:8px">Order ID: <strong style="color:var(--clay)">#${orderId}</strong></p>
        <p style="font-size:14px;color:var(--text-muted);line-height:1.7;max-width:340px;margin:0 auto 28px">
          Thank you, ${checkoutData.name}! Your organic order is confirmed and will be delivered to you soon.
        </p>
        <button class="btn-primary" onclick="closeCheckout();showPage('track')">Track Your Order</button>
      </div>`;

    cart = [];
    saveCart();
    updateCartBadge();
  }
}

function updateStepTrack() {
  document.querySelectorAll('.step-node').forEach((node, i) => {
    const step = i + 1;
    node.classList.remove('active', 'done');
    if (step < checkoutStep) node.classList.add('done');
    else if (step === checkoutStep) node.classList.add('active');
  });
}

function processPayment() {
  checkoutStep = 3;
  renderCheckoutStep();
}

function closeCheckout() {
  document.getElementById('checkout-wrapper').classList.remove('active');
  checkoutStep = 1;
  checkoutData = {};
  appliedCoupon = null;
}

async function saveOrder(orderId) {
  const orderItems = cart.map(item => {
    const p = window.PRODUCTS.find(x => x.id === item.id);
    return { id: item.id, name: p?.name, qty: item.qty, price: p?.price };
  });

  // ── Send order confirmation email via Resend (Netlify function) ──
  try {
    if (window.currentUser?.email) {
      await fetch('/.netlify/functions/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_name: checkoutData.name,
          to_email: window.currentUser.email,
          order_id: orderId,
          items: orderItems.map(i => `${i.name} x${i.qty} — ₹${i.price * i.qty}`).join('\n'),
          total: `₹${discountedTotal()}`,
        }),
      });
    }
  } catch (err) {
    console.warn('Order confirmation email failed:', err);
  }

  // ── Save order to Firestore ──
  if (!window._fb || !window.currentUser) return;
  try {
    const { db, collection, addDoc } = window._fb;
    await addDoc(collection(db, 'orders'), {
      orderId,
      userId: window.currentUser.uid,
      userName: checkoutData.name,
      phone: checkoutData.phone,
      address: checkoutData.address,
      items: orderItems,
      total: discountedTotal(),
      discount: cartTotal() - discountedTotal(),
      coupon: appliedCoupon?.code || null,
      status: 'confirmed',
      payMethod: checkoutData.payMethod || 'upi',
      deliverySlot: checkoutData.deliverySlot || 'morning',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Order save failed:', err);
  }
}

// ── Account Page ───────────────────────────────────────────
function renderAccountPage() {
  if (!window.currentUser) {
    document.getElementById('acc-logged-out').style.display = 'block';
    document.getElementById('acc-logged-in').style.display = 'none';
    return;
  }
  document.getElementById('acc-logged-out').style.display = 'none';
  document.getElementById('acc-logged-in').style.display = 'grid';
  document.getElementById('acc-display-name').textContent = window.currentUser.displayName || 'Guest';
  document.getElementById('acc-display-email').textContent = window.currentUser.email || '';
  loadUserOrders();
}

async function loadUserOrders() {
  const container = document.getElementById('orders-list');
  if (!container || !window.currentUser) return;

  container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted)"><div style="width:36px;height:36px;border:3px solid var(--olive-pale);border-top-color:var(--olive);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px"></div><p style="font-size:13px">Loading orders…</p></div>`;

  // Try Firestore SDK first, fall back to REST API
  try {
    let orders = [];

    if (window._fb) {
      const { db, collection, getDocs, query, where } = window._fb;
      const q = query(collection(db, 'orders'), where('userId', '==', window.currentUser.uid));
      const snap = await getDocs(q);
      snap.forEach(doc => orders.push(doc.data()));
    } else {
      throw new Error('Firebase SDK not ready');
    }

    renderUserOrders(orders, container);
  } catch (err) {
    // Fallback: REST API
    try {
      const token = await window.currentUser.getIdToken();
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/organicroot-3c2d5/databases/(default)/documents/orders?pageSize=50`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      const orders = (data.documents || [])
        .map(d => {
          const f = d.fields || {};
          return {
            orderId: f.orderId?.stringValue,
            userId: f.userId?.stringValue,
            status: f.status?.stringValue,
            total: f.total?.integerValue || f.total?.doubleValue,
            createdAt: f.createdAt?.stringValue,
            items: (f.items?.arrayValue?.values || []).map(v => ({
              name: v.mapValue?.fields?.name?.stringValue,
              qty: v.mapValue?.fields?.qty?.integerValue,
            })),
          };
        })
        .filter(o => o.userId === window.currentUser.uid);

      renderUserOrders(orders, container);
    } catch (e2) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)"><p>Couldn't load orders right now. Please try again.</p></div>`;
    }
  }
}

function renderUserOrders(orders, container) {
  if (!orders.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:40px;margin-bottom:12px">📦</div><p>No orders yet. <button class="link-btn" onclick="showPage('shop')">Start shopping</button></p></div>`;
    return;
  }
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-card-head">
        <div class="order-id">#${order.orderId}</div>
        <div class="order-status status-${order.status === 'delivered' ? 'delivered' : order.status === 'transit' ? 'transit' : 'processing'}">${order.status}</div>
      </div>
      <div class="order-items-list">${(order.items||[]).map(i => `${i.name} ×${i.qty}`).join(', ')}</div>
      <div class="order-total-sm">₹${order.total}</div>
    </div>`).join('');
}

// ── Blog Page ──────────────────────────────────────────────
function renderBlogPage() {
  const articles = [
    { emoji: '🥗', tag: 'Nutrition', title: 'Why Organic Food Is Better for Your Gut Health', date: 'May 2026', desc: 'Research consistently shows that organic produce carries fewer pesticide residues — and your gut microbiome pays attention to that difference.' },
    { emoji: '🌱', tag: 'Farming', title: 'How We Source Our Vegetables: Farm to Doorstep', date: 'April 2026', desc: 'Every morning, our partner farms harvest overnight. By 7am they\'re on our trucks. Here\'s what that supply chain looks like end-to-end.' },
    { emoji: '🧑‍🍳', tag: 'Recipes', title: '5 Quick Recipes Using Only What\'s In Season Now', date: 'May 2026', desc: 'Seasonal eating isn\'t just an Instagram trend — it means better flavour, better nutrition, and better value. Five recipes you can make this week.' },
    { emoji: '🐄', tag: 'Dairy', title: 'A2 vs A1 Milk: What the Science Actually Says', date: 'March 2026', desc: 'The A2 debate has a lot of noise. We dug into the peer-reviewed research so you don\'t have to. Here\'s a clear-eyed look at the evidence.' },
    { emoji: '🌾', tag: 'Grains', title: 'Ancient Grains Are Making a Comeback — Here\'s Why', date: 'April 2026', desc: 'Ragi, jowar, bajra: India\'s traditional millets are nutritionally superior to polished wheat and rice. Here\'s why chefs and nutritionists are taking them seriously.' },
    { emoji: '🍯', tag: 'Ingredients', title: 'Everything You Need to Know About Raw Honey', date: 'February 2026', desc: 'Supermarket honey is often heated, filtered, and blended. Raw honey isn\'t. Here\'s how to tell the difference and why it matters for your health.' },
  ];

  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  grid.innerHTML = articles.map(a => `
    <div class="blog-card">
      <div class="blog-img">${a.emoji}</div>
      <div class="blog-content">
        <div class="blog-tag">${a.tag}</div>
        <h3>${a.title}</h3>
        <p>${a.desc}</p>
        <div class="blog-meta"><span>📅 ${a.date}</span><span>5 min read</span></div>
      </div>
    </div>`).join('');
}

// ── Contact Form ───────────────────────────────────────────
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-primary');
    const name = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email').value.trim();
    const subject = form.querySelector('#contact-subject').value.trim();
    const message = form.querySelector('#contact-message').value.trim();

    if (!name || !email || !message) { showToast('Please fill in all required fields', 'error'); return; }

    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      if (window.emailjs) {
        await window.emailjs.send('chemsupply-mail', 'template_qg80tgx', {
          from_name: name,
          from_email: email,
          subject: subject || 'Message from OrganicRoot website',
          message,
          to_email: 'hello@organicroot.in',
        });
      }
      showToast('✉️ Message sent! We\'ll reply within 24 hours.', 'success');
      form.reset();
    } catch (err) {
      // EmailJS not configured — still show a friendly message
      showToast('✉️ Message received! We\'ll be in touch.', 'success');
      form.reset();
    }
    btn.textContent = 'Send Message';
    btn.disabled = false;
  });
}

// ── Toast ──────────────────────────────────────────────────
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}

// ── Nav Builder ────────────────────────────────────────────
function renderNav() {
  // Update account button on auth state change — handled in firebase.js
}

// ── Event Listeners ────────────────────────────────────────
function setupEventListeners() {
  // Overlay click → close cart
  document.getElementById('overlay')?.addEventListener('click', closeCart);

  // Category pills on shop page
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.cat;
      renderShopPage();
    });
  });

  // Shop search with suggestions
  const shopSearch = document.getElementById('shop-search');
  const suggestionsBox = document.getElementById('search-suggestions');

  shopSearch?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderShopPage();
    showSearchSuggestions(e.target.value);
  });

  shopSearch?.addEventListener('blur', () => {
    setTimeout(() => {
      if (suggestionsBox) suggestionsBox.style.display = 'none';
    }, 200);
  });

  shopSearch?.addEventListener('focus', (e) => {
    if (e.target.value) showSearchSuggestions(e.target.value);
  });

function showSearchSuggestions(query) {
  const box = document.getElementById('search-suggestions');
  if (!box) return;
  if (!query || query.length < 2) { box.style.display = 'none'; return; }

  const matches = window.PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  if (!matches.length) { box.style.display = 'none'; return; }

  box.innerHTML = matches.map(p => `
    <div class="suggestion-item" data-id="${p.id}">
      <span style="font-size:20px">${p.emoji}</span>
      <div>
        <div style="font-size:13.5px;font-weight:600;color:var(--clay)">${p.name}</div>
        <div style="font-size:11.5px;color:var(--text-muted);text-transform:capitalize">${p.category} · ₹${p.price}</div>
      </div>
    </div>`).join('');

  box.style.display = 'block';

  box.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const product = window.PRODUCTS.find(p => p.id === item.dataset.id);
      if (product) {
        shopSearch.value = product.name;
        searchQuery = product.name;
        box.style.display = 'none';
        renderShopPage();
      }
    });
  });
}

  // Account panel nav
  document.querySelectorAll('.acc-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.acc-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const panel = item.dataset.panel;
      document.querySelectorAll('.acc-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${panel}`)?.classList.add('active');
    });
  });

  // Contact form
  setupContactForm();
}

// ── Newsletter Subscribe ──────────────────────────────────
async function subscribeNewsletter() {
  const emailInput = document.getElementById('newsletter-email');
  const btn = document.getElementById('newsletter-btn');
  const email = emailInput.value.trim();

  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  btn.textContent = 'Subscribing…'; btn.disabled = true;

  try {
    // Save to Firestore
    if (window._fb) {
      const { db, collection, addDoc } = window._fb;
      await addDoc(collection(db, 'newsletter'), {
        email,
        subscribedAt: new Date().toISOString(),
      });
    }

    // Send notification email via Netlify function
    await fetch('/.netlify/functions/send-newsletter-notif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    showToast('🌿 You're subscribed! Welcome aboard.', 'success');
    emailInput.value = '';
  } catch (err) {
    showToast('Something went wrong. Please try again.', 'error');
  }

  btn.textContent = 'Subscribe'; btn.disabled = false;
}

// Expose globals needed by HTML onclick attributes
window.showPage = showPage;
window.openCart = openCart;
window.closeCart = closeCart;
window.openSignIn = openSignIn;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.showToast = showToast;
window.closeModal = closeModal;
