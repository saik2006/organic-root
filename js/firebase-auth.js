/* ============================================================
   ORGANICROOT — Firebase Auth + OTP Module
   - Email/Password auth via Firebase
   - Phone OTP via 2Factor.in + Netlify functions
   ============================================================ */

// ── Wait for Firebase to be ready ─────────────────────────
function waitForFb(callback, attempts = 0) {
  if (window._fb) { callback(); return; }
  if (attempts > 20) { console.warn('Firebase never loaded'); return; }
  setTimeout(() => waitForFb(callback, attempts + 1), 200);
}

// ── Sign In ────────────────────────────────────────────────
async function signIn(email, password) {
  waitForFb(async () => {
    const { auth, signInWithEmailAndPassword } = window._fb;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      closeModal('modal-auth');
      window.showToast?.(`Welcome back, ${cred.user.displayName || 'there'}! 🌿`, 'success');
      if (typeof renderAccountPage === 'function') renderAccountPage();
    } catch (err) {
      let msg = 'Sign in failed. Check your email and password.';
      if (err.code === 'auth/user-not-found') msg = 'No account with that email.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (err.code === 'auth/invalid-credential') msg = 'Email or password is incorrect.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
      window.showToast?.(msg, 'error');
    }
  });
}

// ── Sign Up ────────────────────────────────────────────────
async function signUp(name, email, password) {
  waitForFb(async () => {
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
      window.showToast?.(`Welcome to OrganicRoot, ${name}! 🌿`, 'success');
    } catch (err) {
      let msg = 'Sign up failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
      if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
      if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
      window.showToast?.(msg, 'error');
    }
  });
}

// ── Sign Out ───────────────────────────────────────────────
async function signOut() {
  if (!window._fb) return;
  await window._fb.signOut();
  window.currentUser = null;
  window.showToast?.('Signed out. See you soon!', '');
  showPage('home');
}

// ── Password Reset ─────────────────────────────────────────
async function sendPasswordReset(email) {
  waitForFb(async () => {
    const { auth, sendPasswordResetEmail } = window._fb;
    try {
      await sendPasswordResetEmail(auth, email);
      window.showToast?.('Password reset email sent. Check your inbox.', 'success');
      closeModal('modal-auth');
    } catch (err) {
      window.showToast?.('Could not send reset email. Check the address.', 'error');
    }
  });
}

// ── OTP: Send ──────────────────────────────────────────────
let otpSessionId = null;

async function sendOTP(phone) {
  // Ensure phone has country code
  const formatted = phone.startsWith('+') ? phone : '+91' + phone.replace(/^0/, '');
  const btn = document.getElementById('otp-send-btn');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

  try {
    const res = await fetch('/.netlify/functions/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formatted.replace('+', '') })
    });
    const data = await res.json();
    if (data.success) {
      otpSessionId = data.sessionId;
      // Show OTP input field
      document.getElementById('otp-step-1').style.display = 'none';
      document.getElementById('otp-step-2').style.display = 'block';
      window.showToast?.('OTP sent to ' + formatted, 'success');
    } else {
      window.showToast?.('Failed to send OTP. Check the number.', 'error');
    }
  } catch (err) {
    window.showToast?.('OTP service error. Try again.', 'error');
  }

  if (btn) { btn.textContent = 'Send OTP'; btn.disabled = false; }
}

// ── OTP: Verify ────────────────────────────────────────────
async function verifyOTP(otp) {
  if (!otpSessionId) { window.showToast?.('Session expired. Resend OTP.', 'error'); return; }
  const btn = document.getElementById('otp-verify-btn');
  if (btn) { btn.textContent = 'Verifying…'; btn.disabled = true; }

  try {
    const res = await fetch('/.netlify/functions/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: otpSessionId, otp })
    });
    const data = await res.json();
    if (data.success) {
      waitForFb(async () => {
        try {
          const { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, doc, setDoc, getDoc } = window._fb;
          const name = document.getElementById('otp-name')?.value.trim() || 'Customer';
          const phone = document.getElementById('otp-phone')?.value.trim().replace(/^0/, '');
          const phoneEmail = `91${phone}@organicroot.phone`;
          // Stable password derived from phone — not a security measure, just satisfies Firebase email/password requirement
          const phonePassword = `OR_${phone}_ph`;

          let cred;
          let isNewUser = false;

          try {
            // Try signing in first — returning OTP user
            cred = await signInWithEmailAndPassword(auth, phoneEmail, phonePassword);
          } catch (signInErr) {
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
              // New user — create a real account
              cred = await createUserWithEmailAndPassword(auth, phoneEmail, phonePassword);
              isNewUser = true;
            } else {
              throw signInErr;
            }
          }

          // Update display name
          await updateProfile(cred.user, { displayName: name });
          window.currentUser = cred.user;

          if (isNewUser) {
            // Store in Firestore — same structure as email signup
            await setDoc(doc(db, 'users', cred.user.uid), {
              name,
              phone: `+91${phone}`,
              email: phoneEmail,
              loginMethod: 'otp',
              role: 'customer',
              createdAt: new Date().toISOString(),
            });
          } else {
            // Returning user — update name if changed
            const snap = await getDoc(doc(db, 'users', cred.user.uid));
            if (snap.exists() && snap.data().name !== name) {
              await setDoc(doc(db, 'users', cred.user.uid), { name }, { merge: true });
              await updateProfile(cred.user, { displayName: name });
            }
          }

          closeModal('modal-auth');
          const greeting = isNewUser ? `Welcome to OrganicRoot, ${name}! 🌿` : `Welcome back, ${name}! 🌿`;
          window.showToast?.(greeting, 'success');

          const navBtn = document.getElementById('nav-account-btn');
          if (navBtn) {
            navBtn.textContent = '👤 ' + (name.split(' ')[0] || 'Account');
            navBtn.onclick = () => window.showPage('account');
          }

          if (typeof renderAccountPage === 'function') renderAccountPage();

        } catch(e) {
          console.error('OTP auth error:', e);
          window.showToast?.('Verification succeeded but sign-in failed. Please try again.', 'error');
        }
      });
    } else {
      window.showToast?.('Incorrect OTP. Try again.', 'error');
    }
  } catch (err) {
    window.showToast?.('Verification failed. Try again.', 'error');
  }

  if (btn) { btn.textContent = 'Verify OTP'; btn.disabled = false; }
}

// ── Admin Role Check ───────────────────────────────────────
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

  // Sign In
  document.getElementById('signin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('si-email').value.trim();
    const password = document.getElementById('si-password').value;
    const btn = e.target.querySelector('.btn-primary');
    btn.textContent = 'Signing in…'; btn.disabled = true;
    await signIn(email, password);
    btn.textContent = 'Sign In'; btn.disabled = false;
  });

  // Sign Up
  document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('su-name').value.trim();
    const email = document.getElementById('su-email').value.trim();
    const password = document.getElementById('su-password').value;
    if (password.length < 6) { window.showToast?.('Password must be at least 6 characters', 'error'); return; }
    const btn = e.target.querySelector('.btn-primary');
    btn.textContent = 'Creating account…'; btn.disabled = true;
    await signUp(name, email, password);
    btn.textContent = 'Create Account'; btn.disabled = false;
  });

  // Forgot password
  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('fp-email').value.trim();
    await sendPasswordReset(email);
  });

  // OTP send
  document.getElementById('otp-send-btn')?.addEventListener('click', () => {
    const phone = document.getElementById('otp-phone').value.trim();
    if (!phone || phone.length < 10) { window.showToast?.('Enter a valid 10-digit number', 'error'); return; }
    sendOTP(phone);
  });

  // OTP verify
  document.getElementById('otp-verify-btn')?.addEventListener('click', () => {
    const otp = document.getElementById('otp-code').value.trim();
    if (!otp || otp.length !== 6) { window.showToast?.('Enter the 6-digit OTP', 'error'); return; }
    verifyOTP(otp);
  });

  // OTP resend
  document.getElementById('otp-resend-btn')?.addEventListener('click', () => {
    const phone = document.getElementById('otp-phone').value.trim();
    sendOTP(phone);
  });

  // Tab toggles
  document.getElementById('switch-to-signup')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'none';
    document.getElementById('auth-form-signup').style.display = 'block';
    document.getElementById('auth-form-forgot').style.display = 'none';
    document.getElementById('auth-form-otp').style.display = 'none';
  });
  document.getElementById('switch-to-signin')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'block';
    document.getElementById('auth-form-signup').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'none';
    document.getElementById('auth-form-otp').style.display = 'none';
  });
  document.getElementById('switch-to-forgot')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'none';
    document.getElementById('auth-form-signup').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'block';
    document.getElementById('auth-form-otp').style.display = 'none';
  });
  document.getElementById('switch-to-otp')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'none';
    document.getElementById('auth-form-signup').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'none';
    document.getElementById('auth-form-otp').style.display = 'block';
  });

  // Sign out
  document.getElementById('btn-signout')?.addEventListener('click', signOut);
});

window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.checkAdminRole = checkAdminRole;/* ============================================================
   ORGANICROOT — Firebase Auth + OTP Module
   - Email/Password auth via Firebase
   - Phone OTP via 2Factor.in + Netlify functions
   ============================================================ */

// ── Wait for Firebase to be ready ─────────────────────────
function waitForFb(callback, attempts = 0) {
  if (window._fb) { callback(); return; }
  if (attempts > 20) { console.warn('Firebase never loaded'); return; }
  setTimeout(() => waitForFb(callback, attempts + 1), 200);
}

// ── Sign In ────────────────────────────────────────────────
async function signIn(email, password) {
  waitForFb(async () => {
    const { auth, signInWithEmailAndPassword } = window._fb;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      closeModal('modal-auth');
      window.showToast?.(`Welcome back, ${cred.user.displayName || 'there'}! 🌿`, 'success');
      if (typeof renderAccountPage === 'function') renderAccountPage();
    } catch (err) {
      let msg = 'Sign in failed. Check your email and password.';
      if (err.code === 'auth/user-not-found') msg = 'No account with that email.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (err.code === 'auth/invalid-credential') msg = 'Email or password is incorrect.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
      window.showToast?.(msg, 'error');
    }
  });
}

// ── Sign Up ────────────────────────────────────────────────
async function signUp(name, email, password) {
  waitForFb(async () => {
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
      window.showToast?.(`Welcome to OrganicRoot, ${name}! 🌿`, 'success');
    } catch (err) {
      let msg = 'Sign up failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
      if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
      if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
      window.showToast?.(msg, 'error');
    }
  });
}

// ── Sign Out ───────────────────────────────────────────────
async function signOut() {
  if (!window._fb) return;
  await window._fb.signOut();
  window.currentUser = null;
  window.showToast?.('Signed out. See you soon!', '');
  showPage('home');
}

// ── Password Reset ─────────────────────────────────────────
async function sendPasswordReset(email) {
  waitForFb(async () => {
    const { auth, sendPasswordResetEmail } = window._fb;
    try {
      await sendPasswordResetEmail(auth, email);
      window.showToast?.('Password reset email sent. Check your inbox.', 'success');
      closeModal('modal-auth');
    } catch (err) {
      window.showToast?.('Could not send reset email. Check the address.', 'error');
    }
  });
}

// ── OTP: Send ──────────────────────────────────────────────
let otpSessionId = null;

async function sendOTP(phone) {
  // Ensure phone has country code
  const formatted = phone.startsWith('+') ? phone : '+91' + phone.replace(/^0/, '');
  const btn = document.getElementById('otp-send-btn');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

  try {
    const res = await fetch('/.netlify/functions/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formatted.replace('+', '') })
    });
    const data = await res.json();
    if (data.success) {
      otpSessionId = data.sessionId;
      // Show OTP input field
      document.getElementById('otp-step-1').style.display = 'none';
      document.getElementById('otp-step-2').style.display = 'block';
      window.showToast?.('OTP sent to ' + formatted, 'success');
    } else {
      window.showToast?.('Failed to send OTP. Check the number.', 'error');
    }
  } catch (err) {
    window.showToast?.('OTP service error. Try again.', 'error');
  }

  if (btn) { btn.textContent = 'Send OTP'; btn.disabled = false; }
}

// ── OTP: Verify ────────────────────────────────────────────
async function verifyOTP(otp) {
  if (!otpSessionId) { window.showToast?.('Session expired. Resend OTP.', 'error'); return; }
  const btn = document.getElementById('otp-verify-btn');
  if (btn) { btn.textContent = 'Verifying…'; btn.disabled = true; }

  try {
    const res = await fetch('/.netlify/functions/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: otpSessionId, otp })
    });
    const data = await res.json();
    if (data.success) {
      waitForFb(async () => {
        try {
          const { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, doc, setDoc, getDoc } = window._fb;
          const name = document.getElementById('otp-name')?.value.trim() || 'Customer';
          const phone = document.getElementById('otp-phone')?.value.trim().replace(/^0/, '');
          const phoneEmail = `91${phone}@organicroot.phone`;
          // Stable password derived from phone — not a security measure, just satisfies Firebase email/password requirement
          const phonePassword = `OR_${phone}_ph`;

          let cred;
          let isNewUser = false;

          try {
            // Try signing in first — returning OTP user
            cred = await signInWithEmailAndPassword(auth, phoneEmail, phonePassword);
          } catch (signInErr) {
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
              // New user — create a real account
              cred = await createUserWithEmailAndPassword(auth, phoneEmail, phonePassword);
              isNewUser = true;
            } else {
              throw signInErr;
            }
          }

          // Update display name
          await updateProfile(cred.user, { displayName: name });
          window.currentUser = cred.user;

          if (isNewUser) {
            // Store in Firestore — same structure as email signup
            await setDoc(doc(db, 'users', cred.user.uid), {
              name,
              phone: `+91${phone}`,
              email: phoneEmail,
              loginMethod: 'otp',
              role: 'customer',
              createdAt: new Date().toISOString(),
            });
          } else {
            // Returning user — update name if changed
            const snap = await getDoc(doc(db, 'users', cred.user.uid));
            if (snap.exists() && snap.data().name !== name) {
              await setDoc(doc(db, 'users', cred.user.uid), { name }, { merge: true });
              await updateProfile(cred.user, { displayName: name });
            }
          }

          closeModal('modal-auth');
          const greeting = isNewUser ? `Welcome to OrganicRoot, ${name}! 🌿` : `Welcome back, ${name}! 🌿`;
          window.showToast?.(greeting, 'success');

          const navBtn = document.getElementById('nav-account-btn');
          if (navBtn) {
            navBtn.textContent = '👤 ' + (name.split(' ')[0] || 'Account');
            navBtn.onclick = () => window.showPage('account');
          }

          if (typeof renderAccountPage === 'function') renderAccountPage();

        } catch(e) {
          console.error('OTP auth error:', e);
          window.showToast?.('Verification succeeded but sign-in failed. Please try again.', 'error');
        }
      });
    } else {
      window.showToast?.('Incorrect OTP. Try again.', 'error');
    }
  } catch (err) {
    window.showToast?.('Verification failed. Try again.', 'error');
  }

  if (btn) { btn.textContent = 'Verify OTP'; btn.disabled = false; }
}

// ── Admin Role Check ───────────────────────────────────────
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

  // Sign In
  document.getElementById('signin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('si-email').value.trim();
    const password = document.getElementById('si-password').value;
    const btn = e.target.querySelector('.btn-primary');
    btn.textContent = 'Signing in…'; btn.disabled = true;
    await signIn(email, password);
    btn.textContent = 'Sign In'; btn.disabled = false;
  });

  // Sign Up
  document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('su-name').value.trim();
    const email = document.getElementById('su-email').value.trim();
    const password = document.getElementById('su-password').value;
    if (password.length < 6) { window.showToast?.('Password must be at least 6 characters', 'error'); return; }
    const btn = e.target.querySelector('.btn-primary');
    btn.textContent = 'Creating account…'; btn.disabled = true;
    await signUp(name, email, password);
    btn.textContent = 'Create Account'; btn.disabled = false;
  });

  // Forgot password
  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('fp-email').value.trim();
    await sendPasswordReset(email);
  });

  // OTP send
  document.getElementById('otp-send-btn')?.addEventListener('click', () => {
    const phone = document.getElementById('otp-phone').value.trim();
    if (!phone || phone.length < 10) { window.showToast?.('Enter a valid 10-digit number', 'error'); return; }
    sendOTP(phone);
  });

  // OTP verify
  document.getElementById('otp-verify-btn')?.addEventListener('click', () => {
    const otp = document.getElementById('otp-code').value.trim();
    if (!otp || otp.length !== 6) { window.showToast?.('Enter the 6-digit OTP', 'error'); return; }
    verifyOTP(otp);
  });

  // OTP resend
  document.getElementById('otp-resend-btn')?.addEventListener('click', () => {
    const phone = document.getElementById('otp-phone').value.trim();
    sendOTP(phone);
  });

  // Tab toggles
  document.getElementById('switch-to-signup')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'none';
    document.getElementById('auth-form-signup').style.display = 'block';
    document.getElementById('auth-form-forgot').style.display = 'none';
    document.getElementById('auth-form-otp').style.display = 'none';
  });
  document.getElementById('switch-to-signin')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'block';
    document.getElementById('auth-form-signup').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'none';
    document.getElementById('auth-form-otp').style.display = 'none';
  });
  document.getElementById('switch-to-forgot')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'none';
    document.getElementById('auth-form-signup').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'block';
    document.getElementById('auth-form-otp').style.display = 'none';
  });
  document.getElementById('switch-to-otp')?.addEventListener('click', () => {
    document.getElementById('auth-form-signin').style.display = 'none';
    document.getElementById('auth-form-signup').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'none';
    document.getElementById('auth-form-otp').style.display = 'block';
  });

  // Sign out
  document.getElementById('btn-signout')?.addEventListener('click', signOut);
});

window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.checkAdminRole = checkAdminRole;
