// Tab toggle per provided snippet (apply slide to the inner track)
const titleInner = document.querySelector('.title-inner');
const loginForm = document.querySelector('form.login');
const loginBtn = document.querySelector('label.login');
const signupBtn = document.querySelector('label.signup');
const signupLink = document.querySelector('form .signup-link a');
const slideControls = document.getElementById('tabs');

signupBtn.onclick = (() => {
  document.querySelector('.form-inner').style.transform = 'translateX(-50%)';
  titleInner.style.transform = 'translateX(-50%)';
  slideControls.classList.add('active');
});
loginBtn.onclick = (() => {
  document.querySelector('.form-inner').style.transform = 'translateX(0%)';
  titleInner.style.transform = 'translateX(0%)';
  slideControls.classList.remove('active');
});
signupLink.onclick = (() => {
  signupBtn.click();
  return false;
});

const API_BASE = window.location.origin;

// Popup helpers
const popupBackdrop = document.getElementById('popupBackdrop');
const popupMessage = document.getElementById('popupMessage');
const popupOk = document.getElementById('popupOk');
function showPopup(msg) {
  if (!popupBackdrop) return;
  popupMessage && (popupMessage.textContent = msg);
  popupBackdrop.classList.add('visible');
}
function hidePopup() {
  popupBackdrop && popupBackdrop.classList.remove('visible');
}
popupOk && popupOk.addEventListener('click', hidePopup);
popupBackdrop && popupBackdrop.addEventListener('click', (e) => {
  if (e.target === popupBackdrop) hidePopup();
});

// Login handler — allows email as identifier
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const infoEl = document.querySelector('#loginForm .notice');
  errorEl.textContent = '';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }) // backend accepts username OR email
    });
    const data = await res.json();
    const go = (role) => {
      const map = { admin: '/admin.html', teacher: '/teacher.html', student: '/student.html' };
      window.location.href = map[role] || '/dashboard.html';
    };
    if (res.status === 202) {
      if (infoEl) infoEl.textContent = 'Check your email and confirm this login.';
      const challengeId = data.challenge_id;
      const start = Date.now();
      const poll = setInterval(async () => {
        if (Date.now() - start > 10 * 60 * 1000) {
          clearInterval(poll);
          errorEl.textContent = 'Login confirmation timed out.';
          showPopup('Login confirmation timed out. Please try again.');
          return;
        }
        try {
          const r = await fetch(`/auth/challenge-status?id=${encodeURIComponent(challengeId)}`);
          const s = await r.json();
          if (s.approved && s.token) {
            clearInterval(poll);
            localStorage.setItem('token', s.token);
            localStorage.setItem('role', data.role || 'student');
            go(data.role || 'student');
          }
        } catch (_) {}
      }, 3000);
      return;
    }
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    go(data.role);
  } catch (err) {
    errorEl.textContent = err.message;
    // Show popup for credential-related errors
    if (/invalid credentials/i.test(err.message)) {
      showPopup('Invalid email or password. Please try again.');
    } else {
      showPopup(err.message || 'Login failed.');
    }
  }
});

// Signup handler — registers student only per zero-trust rule
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const password2 = document.getElementById('signupPassword2').value;
  const errorEl = document.getElementById('signupError');
  errorEl.textContent = '';
  if (password !== password2) {
    errorEl.textContent = 'Passwords do not match';
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, email, password, full_name: '' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    // Redirect to dedicated verification page with email
    alert('Signup successful. Please verify your email.');
    window.location.href = `/verify.html?email=${encodeURIComponent(email)}`;
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// Ensure initial state is login visible
document.addEventListener('DOMContentLoaded', () => {
  loginBtn.click();
});
// Verification page is now a separate file (verify.html)