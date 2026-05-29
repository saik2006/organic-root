/* ============================================================
   ORGANICROOT — Firebase Auth Module
   - Firebase Auth for all user sign in/up/out
   - NO hardcoded passwords anywhere
   - Admin access via Firebase Auth + Firestore role check
   ============================================================ */

// Firebase config (exposed client-side - normal for Firebase apps)
// Security comes from Firestore Security Rules, not hiding the config
const firebaseConfig = {
  apiKey: "AIzaSyA4FxrwM8yK2W0QePjfMUrCclcGI6023W8",
  authDomain: "organicroot-3c2d5.firebaseapp.com",
  projectId: "organicroot-3c2d5",
  storageBucket: "organicroot-3c2d5.firebasestorage.app",
  messagingSenderId: "203213074206",
  appId: "1:203213074206:web:8dcb5dcacecc1771dea30f"
};

// Auth state handler (called after Firebase loads via module in HTML)
// This file provides the auth UI logic

// ── Sign In ────────────────────────────────────────────────
async function signIn(email, password) {
  if (!window._fb) { showToast('Auth not ready, try again', 'error'); return; }
  const { auth, signInWithEmailAndPassword } = window._fb;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    closeModal('modal-auth');
    showToast(`Welcome back, ${cred.user.displayName || 'there'}! 🌿`, 'success');
    renderAccountPage();
  } catch (err) {
    let msg = 'Sign in failed. Check your email and password.';
    if (err.code === 'auth/user-not-found') msg = 'No account with that email.';
    if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
    if (err.code === 'auth/invalid-credential') msg = 'Email or password is incorrect.';
    if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    showToast(msg, 'error');
  }
}

// ── Sign Up ────────────────────────────────────────────────
async function signUp(name, email, password) {
  if (!window._fb) { showToast('Auth not ready, try again', 'error'); return; }
  const { auth, db, createUserWithEmailAndPassword, updateProfile, doc, setDoc } = window._fb;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      role: 'customer',
      createdAt: new Date().toISOString(),
    });
    closeModal('modal-auth');
    showToast(`Welcome to OrganicRoot, ${name}! 🌿`, 'success');
  } catch (err) {
    let msg = 'Sign up failed. Please try again.';
    if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
    if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
    if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
    showToast(msg, 'error');
  }
}

// ── Sign Out ───────────────────────────────────────────────
async function signOut() {
  if (!window._fb) return;
  await window._fb.signOut(window._fb.auth);
  showToast('Signed out. See you soon!', '');
  showPage('home');
}

// ── Password Reset ─────────────────────────────────────────
async function sendPasswordReset(email) {
  if (!window._fb) return;
  const { auth, sendPasswordResetEmail } = window._fb;
  try {
    await sendPasswordResetEmail(auth, email);
    showToast('Password reset email sent. Check your inbox.', 'success');
    closeModal('modal-auth');
  } catch (err) {
    showToast('Could not send reset email. Check the address.', 'error');
  }
}

// ── Admin Role Check ───────────────────────────────────────
// Admin access is determined by a 'role: admin' field in Firestore
// NOT by a hardcoded password
async function checkAdminRole(uid) {
  if (!window._fb) return false;
  try {
    const { db, doc, getDoc } = window._fb;
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() && snap.data().role === 'admin';
  } catch {
    return false;
  }
}

// ── Setup Auth Form UI ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Sign In form submit
  document.getElementById('signin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('si-email').value.trim();
    const password = document.getElementById('si-password').value;
    const btn = e.target.querySelector('.btn-primary');
    btn.textContent = 'Signing in…'; btn.disabled = true;
    await signIn(email, password);
    btn.textContent = 'Sign In'; btn.disabled = false;
  });

  // Sign Up form submit
  document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('su-name').value.trim();
    const email = document.getElementById('su-email').value.trim();
    const password = document.getElementById('su-password').value;
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    const btn = e.target.querySelector('.btn-primary');
    btn.textContent = 'Creating account…'; btn.disabled = true;
    await signUp(name, email, password);
    btn.textContent = 'Create Account'; btn.disabled = false;
  });

  // Forgot password form
  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('fp-email').value.trim();
    await sendPasswordReset(email);
  });

  // Tab toggles inside auth modal
  document.getElementById('switch-to-signup')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'none';
    document.getElementById('auth-form-signup').style.display = 'block';
    document.getElementById('auth-form-forgot').style.display = 'none';
  });
  document.getElementById('switch-to-signin')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'block';
    document.getElementById('auth-form-signup').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'none';
  });
  document.getElementById('switch-to-forgot')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'none';
    document.getElementById('auth-form-signup').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'block';
  });

  // Sign out button
  document.getElementById('btn-signout')?.addEventListener('click', signOut);
});

// Expose
window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.checkAdminRole = checkAdminRole;
