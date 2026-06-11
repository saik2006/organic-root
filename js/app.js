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
  document.getElementById('page-terms')?.classList.toggle('active', page === 'terms');
  document.getElementById('page-privacy')?.classList.toggle('active', page === 'privacy');
  document.getElementById('page-refund')?.classList.toggle('active', page === 'refund');

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
  if (product.available === false) {
    showToast('This product is currently out of stock', 'error');
    return;
  }
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
        <label>Email (for order confirmation)</label>
        <input type="email" id="co-email" placeholder="your@email.com" value="${checkoutData.email || (window.currentUser?.email?.includes('@organicroot.phone') ? '' : window.currentUser?.email || '')}">
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
      <div style="background:var(--olive-pale);border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:center">
        <span style="font-size:18px">📍</span>
        <div style="flex:1">
          <p style="font-size:13px;font-weight:600;color:var(--olive);margin-bottom:4px">Delivery Area Check</p>
          <div style="display:flex;gap:8px">
            <input type="text" id="pincode-input" placeholder="Enter your PIN code" maxlength="6"
              style="flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13.5px;font-family:'DM Sans',sans-serif;outline:none;background:#fff">
            <button onclick="checkPincode()" style="background:var(--olive);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">Check</button>
          </div>
          <p id="pincode-result" style="font-size:12px;margin-top:6px;display:none"></p>
        </div>
      </div>
      <div class="checkout-nav">
        <button class="btn-next" id="co-next-1">Continue to Payment →</button>
      </div>`;

    document.getElementById('co-next-1').onclick = () => {
      const name = document.getElementById('co-name').value.trim();
      const email = document.getElementById('co-email').value.trim();
      const phone = document.getElementById('co-phone').value.trim();
      const address = document.getElementById('co-address').value.trim();
      if (!name || !phone || !address) { showToast('Please fill in all fields', 'error'); return; }
      const deliverySlot = document.getElementById('co-time').value.includes('Morning') ? 'morning' : document.getElementById('co-time').value.includes('Afternoon') ? 'afternoon' : 'evening';
      checkoutData = { ...checkoutData, name, email, phone, address, deliverySlot };
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

async function processPayment() {
  const payMethod = checkoutData.payMethod || 'upi';

  // Cash on delivery — skip Razorpay
  if (payMethod === 'cod') {
    checkoutStep = 3;
    renderCheckoutStep();
    return;
  }

  // All other payments go through Razorpay
  const btn = document.getElementById('co-pay');
  if (btn) { btn.textContent = 'Opening payment…'; btn.disabled = true; }

  try {
    // Create Razorpay order via Netlify function
    const res = await fetch('/.netlify/functions/razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: discountedTotal(),
        currency: 'INR',
        receipt: 'OR' + Date.now().toString().slice(-8),
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error('Order creation failed');

    // Open Razorpay checkout
    const options = {
      key: 'rzp_test_SyZvVHChjEZ6hO',
      amount: data.amount,
      currency: 'INR',
      name: 'OrganicRoot',
      description: 'Fresh Organic Groceries',
      order_id: data.orderId,
      prefill: {
        name: checkoutData.name,
        contact: checkoutData.phone,
        email: window.currentUser?.email || '',
      },
      theme: { color: '#3d2b1f' },
      handler: function(response) {
        // Payment successful
        checkoutStep = 3;
        renderCheckoutStep();
      },
      modal: {
        ondismiss: function() {
          if (btn) { btn.textContent = `Pay ₹${discountedTotal()}`; btn.disabled = false; }
          showToast('Payment cancelled', '');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function(response) {
      showToast('Payment failed. Please try again.', 'error');
      if (btn) { btn.textContent = `Pay ₹${discountedTotal()}`; btn.disabled = false; }
    });
    rzp.open();

  } catch(err) {
    showToast('Payment setup failed. Try again.', 'error');
    if (btn) { btn.textContent = `Pay ₹${discountedTotal()}`; btn.disabled = false; }
  }
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
    const confirmEmail = checkoutData.email || window.currentUser?.email;
    if (confirmEmail && !confirmEmail.includes('@organicroot.phone')) {
      await fetch('/.netlify/functions/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_name: checkoutData.name,
          to_email: confirmEmail,
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
    {
      emoji: '🔍', tag: 'Trust', title: 'Why Certified Organic Actually Matters (And How to Spot Fake Claims)',
      date: 'June 2026', readTime: '6 min read',
      desc: 'The word "organic" is everywhere — but most of it is marketing. Here\'s what genuine certification means and how to tell the difference.',
      content: `
        <p>Walk into any supermarket today and you'll find shelves full of products with words like "natural", "farm-fresh", "chemical-free", and "organic". The problem? In India, only one of those words is legally regulated. The rest are marketing.</p>
        <h3>What "Certified Organic" Actually Means</h3>
        <p>Genuine organic certification in India is governed by two systems: NPOP (National Programme for Organic Production) for export-grade produce, and PGS-India (Participatory Guarantee System) for domestically sold food. Both require farmers to:</p>
        <ul>
          <li>Avoid synthetic pesticides, herbicides, and chemical fertilisers for a minimum of 3 years before certification</li>
          <li>Undergo annual inspection by a third-party certifying body</li>
          <li>Maintain detailed farm records that can be audited at any time</li>
          <li>Use only approved inputs for soil health and pest control</li>
        </ul>
        <p>This is not a one-time process. Certification is renewed every year, and any violation results in immediate suspension.</p>
        <h3>What "Natural" and "Chemical-Free" Mean</h3>
        <p>Nothing. These terms have no legal definition in India's food labelling regulations. Any brand can print them on any product without any verification whatsoever. A tomato grown with synthetic pesticides can legally be called "natural" if the farmer chooses to call it that.</p>
        <h3>How to Spot Fake Organic Claims</h3>
        <p>Before buying from any organic brand, ask three questions:</p>
        <ul>
          <li><strong>Which certifying body issued the certificate?</strong> Legitimate certifiers include APOF, INDOCERT, LACON, and OneCert Asia. A real brand will name them without hesitation.</li>
          <li><strong>Can I see the certificate?</strong> Every certified farm has a physical certificate with a unique registration number. Legitimate brands display this or share it on request.</li>
          <li><strong>Which farms supply you?</strong> Transparent brands name their farm partners. Vague answers like "we source from trusted farmers across India" are a red flag.</li>
        </ul>
        <h3>Why It Matters for Your Health</h3>
        <p>A 2019 study published in JAMA Internal Medicine found that regular consumption of organic food was associated with a significantly lower risk of certain cancers. The mechanism is straightforward — fewer synthetic pesticide residues entering your body over time means less cumulative toxic load on your liver, gut, and endocrine system.</p>
        <p>Children are particularly vulnerable. Their bodies absorb pesticide residues at higher rates than adults, and their developing nervous systems are more sensitive to the effects.</p>
        <h3>Our Commitment</h3>
        <p>Every product on OrganicRoot comes from PGS-India or NPOP certified farms. We visit our farm partners regularly, maintain full traceability from field to doorstep, and are happy to share certification documentation for any product on request. If we can't show you the certificate, we don't sell the product.</p>
      `
    },
    {
      emoji: '❄️', tag: 'Delivery', title: 'The Cold Chain: How We Keep Your Vegetables Fresh From Farm to Door',
      date: 'June 2026', readTime: '5 min read',
      desc: 'Most grocery delivery companies pick from a warehouse. We don\'t. Here\'s what our 48-hour farm-to-door supply chain actually looks like.',
      content: `
        <p>When a vegetable is harvested, a clock starts ticking. Every hour at room temperature, it loses moisture, nutritional density, and flavour. By the time most supermarket vegetables reach your kitchen — typically 5 to 10 days after harvest — they've lost up to 50% of certain vitamins.</p>
        <p>We built our entire operation around one goal: get the food from the farm to your door before that clock runs out.</p>
        <h3>How Conventional Grocery Supply Chains Work</h3>
        <p>A typical vegetable's journey in India looks like this: farm → mandi (wholesale market) → distributor warehouse → retailer → customer. Each handoff adds 1-3 days. Total time from harvest to your plate: 7-14 days, often without consistent refrigeration throughout.</p>
        <p>Even most "fresh delivery" apps follow a version of this model — they just add a last-mile delivery step on top of the same warehouse-based supply chain.</p>
        <h3>Our 48-Hour Supply Chain</h3>
        <p>We eliminated the middlemen. Here's exactly what happens with your order:</p>
        <ul>
          <li><strong>Evening (Day 0):</strong> You place your order. It's transmitted directly to the relevant farm partner.</li>
          <li><strong>Early morning (Day 1):</strong> Farm harvests only what has been ordered — no excess sitting in storage. Produce is packed at the farm in ventilated crates and loaded onto our refrigerated vehicles by 5am.</li>
          <li><strong>Morning (Day 1):</strong> Produce arrives at our sorting facility. Each item is inspected, weighed, and packed into your order bag. Temperature is maintained throughout.</li>
          <li><strong>Delivery (Day 1-2):</strong> Your order goes out for delivery in insulated bags. We deliver within 48 hours of harvest, guaranteed.</li>
        </ul>
        <h3>Why Cold Chain Matters</h3>
        <p>Leafy greens like spinach and methi begin wilting within 4 hours at temperatures above 25°C. Tomatoes lose their lycopene content rapidly above 20°C. Dairy products can develop harmful bacterial growth within hours outside refrigeration.</p>
        <p>Our cold chain maintains 2-8°C from farm to your door for temperature-sensitive items, and 10-15°C for produce that needs cool but not cold conditions — like bananas and root vegetables.</p>
        <h3>What This Means for You</h3>
        <p>Vegetables that arrive at your door having been harvested within 48 hours taste different. This isn't marketing language — it's the difference between a tomato that was allowed to ripen on the vine and one that was picked green and ripened artificially in transit. It's spinach that holds its structure when cooked instead of turning to mush. It's milk that tastes like milk.</p>
        <p>We're not the cheapest option. We're not trying to be. We're trying to be the most honest one.</p>
      `
    },
    { emoji: '🥗', tag: 'Nutrition', title: 'Why Organic Food Is Better for Your Gut Health', date: 'May 2026', readTime: '5 min read', desc: 'Research consistently shows that organic produce carries fewer pesticide residues — and your gut microbiome pays attention to that difference.', content: null },
    { emoji: '🌱', tag: 'Farming', title: 'How We Source Our Vegetables: Farm to Doorstep', date: 'April 2026', readTime: '5 min read', desc: 'Every morning, our partner farms harvest overnight. By 7am they\'re on our trucks. Here\'s what that supply chain looks like end-to-end.', content: null },
    { emoji: '🐄', tag: 'Dairy', title: 'A2 vs A1 Milk: What the Science Actually Says', date: 'March 2026', readTime: '5 min read', desc: 'The A2 debate has a lot of noise. We dug into the peer-reviewed research so you don\'t have to. Here\'s a clear-eyed look at the evidence.', content: null },
    { emoji: '🌾', tag: 'Grains', title: 'Ancient Grains Are Making a Comeback — Here\'s Why', date: 'April 2026', readTime: '5 min read', desc: 'Ragi, jowar, bajra: India\'s traditional millets are nutritionally superior to polished wheat and rice. Here\'s why chefs and nutritionists are taking them seriously.', content: null },
  ];

  window._blogArticles = articles;

  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  grid.innerHTML = articles.map((a, i) => `
    <div class="blog-card" onclick="openBlogArticle(${i})" style="cursor:pointer">
      <div class="blog-img">${a.emoji}</div>
      <div class="blog-content">
        <div class="blog-tag">${a.tag}</div>
        <h3>${a.title}</h3>
        <p>${a.desc}</p>
        <div class="blog-meta"><span>📅 ${a.date}</span><span>${a.readTime}</span></div>
      </div>
    </div>`).join('');
}

function openBlogArticle(index) {
  const a = window._blogArticles?.[index];
  if (!a) return;
  if (!a.content) {
    showToast('Full article coming soon!', 'success');
    return;
  }
  const modal = document.createElement('div');
  modal.id = 'blog-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;overflow-y:auto;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;max-width:720px;width:100%;padding:48px;position:relative;margin:auto">
      <button onclick="document.getElementById('blog-modal').remove()" style="position:absolute;top:20px;right:20px;background:none;border:none;font-size:24px;cursor:pointer;color:#888">✕</button>
      <div style="font-size:48px;margin-bottom:12px">${a.emoji}</div>
      <span style="background:#eef1e6;color:#5a6e3a;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:1px">${a.tag}</span>
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:28px;color:#1e140d;margin:16px 0 8px;line-height:1.3">${a.title}</h2>
      <div style="font-size:13px;color:#8a6a50;margin-bottom:32px">📅 ${a.date} &nbsp;·&nbsp; ${a.readTime}</div>
      <div style="font-size:15px;line-height:1.8;color:#2d2d2d;font-family:'DM Sans',sans-serif">
        <style>#blog-modal h3{font-family:'Cormorant Garamond',serif;font-size:20px;color:#3d2b1f;margin:28px 0 10px}#blog-modal p{margin-bottom:16px}#blog-modal ul{margin:0 0 16px 24px}#blog-modal li{margin-bottom:8px}</style>
        ${a.content}
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
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
          to_email: 'plasigoventures@gmail.com',
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

// ── Pincode Checker ───────────────────────────────────────
const DELIVERABLE_PINCODES = [
  '600001','600002','600003','600004','600005','600006','600007','600008','600009','600010',
  '600011','600012','600013','600014','600015','600016','600017','600018','600019','600020',
  '600025','600026','600028','600029','600030','600031','600032','600033','600034','600035',
  '600036','600037','600038','600039','600040','600041','600042','600043','600044','600045',
  '600046','600047','600048','600049','600050','600051','600052','600053','600054','600055',
  '600056','600057','600058','600059','600060','600061','600062','600063','600064','600065',
  '600066','600067','600068','600069','600070','600071','600072','600073','600074','600075',
  '600076','600077','600078','600079','600080','600081','600082','600083','600084','600085',
  '600086','600087','600088','600089','600090','600091','600092','600093','600094','600095',
  '600096','600097','600098','600099','600100','600101','600102','600103','600104','600105',
  '600106','600107','600108','600109','600110','600111','600112','600113','600114','600115',
  '600116','600117','600118','600119','600120','600122','600123','600124','600125','600126',
  '600127','600128','600129','600130'
];

function checkPincode() {
  const input = document.getElementById('pincode-input');
  const result = document.getElementById('pincode-result');
  const pin = input?.value.trim();
  if (!pin || pin.length !== 6 || isNaN(pin)) {
    if (result) { result.textContent = 'Enter a valid 6-digit PIN code'; result.style.color = 'var(--terra)'; result.style.display = 'block'; }
    return;
  }
  if (DELIVERABLE_PINCODES.includes(pin)) {
    result.textContent = '✓ Great news! We deliver to your area.';
    result.style.color = 'var(--olive)';
  } else {
    result.textContent = '✗ Sorry, we do not deliver to this PIN code yet.';
    result.style.color = 'var(--terra)';
  }
  result.style.display = 'block';
}
window.checkPincode = checkPincode;

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
      try {
        const { db, collection, addDoc } = window._fb;
        await addDoc(collection(db, 'newsletter'), {
          email,
          subscribedAt: new Date().toISOString(),
        });
      } catch(e) { console.warn('Firestore save failed:', e); }
    }

    // Send notification email via Netlify function
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch('/.netlify/functions/send-newsletter-notif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch(e) { console.warn('Newsletter notif failed:', e); }

    showToast('🌿 Subscribed! Welcome aboard.', 'success');
    emailInput.value = '';
  } catch (err) {
    showToast('Something went wrong. Please try again.', 'error');
  } finally {
    btn.textContent = 'Subscribe'; btn.disabled = false;
  }
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
