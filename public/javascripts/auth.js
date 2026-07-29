async function handleSignIn(e) {
  e.preventDefault();

  var btn = document.getElementById('submit-btn');
  var errorEl = document.getElementById('auth-error');
  var email = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;

  errorEl.style.display = 'none';

  if (!email || !password) {
    errorEl.textContent = 'Email and password are required.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.value = 'Signing in...';

  try {
    var res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });

    var raw = await res.text();
    var data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      throw new Error('Server error. Try again.');
    }

    if (!data.success) {
      errorEl.textContent = data.message || 'Something went wrong.';
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.value = 'Sign in';
      return;
    }

    window.location.href = '/dashboard';
  } catch (err) {
    errorEl.textContent = err.message === 'Failed to fetch'
      ? 'Cannot reach server.'
      : err.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.value = 'Sign in';
  }
}

async function handleSignUp(e) {
  e.preventDefault();

  var btn = document.getElementById('submit-btn');
  var errorEl = document.getElementById('auth-error');
  var username = document.getElementById('username').value.trim();
  var email = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;

  errorEl.style.display = 'none';

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

  btn.disabled = true;
  btn.value = 'Creating account...';

  try {
    var res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, email: email, password: password })
    });

    var raw = await res.text();
    var data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      throw new Error('Server error. Try again.');
    }

    if (!data.success) {
      errorEl.textContent = data.message || 'Something went wrong.';
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.value = 'Sign up';
      return;
    }

    window.location.href = '/dashboard';
  } catch (err) {
    errorEl.textContent = err.message === 'Failed to fetch'
      ? 'Cannot reach server.'
      : err.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.value = 'Sign up';
  }
}
