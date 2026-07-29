async function handleSignIn(e) {
  e.preventDefault();

  const btn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('auth-error');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Hide previous error
  errorEl.style.display = 'none';

  // Basic client-side check
  if (!email || !password) {
    errorEl.textContent = 'Email and password are required.';
    errorEl.style.display = 'block';
    return;
  }

  // Loading state
  btn.disabled = true;
  btn.value = 'Signing in...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!data.success) {
      errorEl.textContent = data.message;
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.value = 'Sign in';
      return;
    }

    // Success — redirect to dashboard
    window.location.href = '/dashboard';
  } catch (err) {
    errorEl.textContent = 'Network error. Please check your connection and try again.';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.value = 'Sign in';
  }
}

async function handleSignUp(e) {
  e.preventDefault();

  const btn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('auth-error');
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Hide previous error
  errorEl.style.display = 'none';

  // Basic client-side checks
  if (!username || !email || !password) {
    errorEl.textContent = 'All fields are required.';
    errorEl.style.display = 'block';
    return;
  }
  if (username.length < 3) {
    errorEl.textContent = 'Username must be at least 3 characters.';
    errorEl.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters.';
    errorEl.style.display = 'block';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorEl.textContent = 'Please enter a valid email address.';
    errorEl.style.display = 'block';
    return;
  }

  // Loading state
  btn.disabled = true;
  btn.value = 'Creating account...';

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (!data.success) {
      errorEl.textContent = data.message;
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.value = 'Sign up';
      return;
    }

    // Success — redirect to dashboard
    window.location.href = '/dashboard';
  } catch (err) {
    errorEl.textContent = 'Network error. Please check your connection and try again.';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.value = 'Sign up';
  }
}