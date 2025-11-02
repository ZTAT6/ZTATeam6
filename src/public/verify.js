(() => {
  const API_BASE = '';
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';
  const emailDisplay = document.getElementById('emailDisplay');
  const grid = document.getElementById('codeGrid');
  const inputs = Array.from(grid.querySelectorAll('input.code-input'));
  const errorEl = document.getElementById('verifyError');
  const verifyBtn = document.getElementById('verifyBtn');
  const resendLink = document.getElementById('resendLink');

  emailDisplay.textContent = email || 'Unknown email';

  // Helpers
  const focusInput = (idx) => {
    if (idx >= 0 && idx < inputs.length) inputs[idx].focus();
  };
  const collectCode = () => inputs.map(i => i.value.trim()).join('');
  const clearCode = () => inputs.forEach(i => i.value = '');
  const numeric = (str) => str.replace(/\D+/g, '');

  // Auto-advance and backspace handling
  inputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const val = numeric(e.target.value);
      e.target.value = val.slice(0, 1);
      if (val && idx < inputs.length - 1) focusInput(idx + 1);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        focusInput(idx - 1);
      }
    });
    input.addEventListener('paste', (e) => {
      const text = numeric((e.clipboardData || window.clipboardData).getData('text'));
      if (!text) return;
      e.preventDefault();
      clearCode();
      for (let i = 0; i < Math.min(text.length, inputs.length); i++) {
        inputs[i].value = text[i];
      }
      focusInput(Math.min(text.length, inputs.length) - 1);
    });
  });

  // Verify
  verifyBtn.addEventListener('click', async () => {
    errorEl.textContent = '';
    const code = collectCode();
    if (code.length !== 6) {
      errorEl.textContent = 'Enter the 6-digit code.';
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      alert('Email verified. You can now log in.');
      window.location.href = '/';
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  // Resend
  resendLink.addEventListener('click', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    try {
      const res = await fetch(`${API_BASE}/auth/resend-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resend failed');
      alert('Verification code sent.');
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  // Focus first box initially
  focusInput(0);
})();