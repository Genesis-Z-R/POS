// Global State
const API_URL = window.location.protocol === 'file:' 
  ? 'http://localhost:5000/api' 
  : '/api';

// Utility: Show Toast Notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast border-${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'danger' || type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';

  toast.innerHTML = `<i class="fa-solid fa-${icon} text-${type === 'error' ? 'danger' : type}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Utility: Fetch Wrapper with Auth
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('pos_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - Clear token & Redirect to login
        logout();
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth functions
function setAuthData(token, user) {
  localStorage.setItem('pos_token', token);
  localStorage.setItem('pos_user', JSON.stringify(user));
}

function getAuthUser() {
  const user = localStorage.getItem('pos_user');
  return user ? JSON.parse(user) : null;
}

function isAuthenticated() {
  return !!localStorage.getItem('pos_token');
}

function logout() {
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
  window.location.href = 'login.html';
}

// Role based access checking
function requireAuth(allowedRoles = []) {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return null;
  }

  const user = getAuthUser();
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard based on role
    if (user.role === 'cashier') window.location.href = 'pos.html';
    else window.location.href = 'dashboard.html';
    return null;
  }

  return user;
}

// Format Currency
function formatCurrency(amount) {
  return `GHS ${parseFloat(amount).toFixed(2)}`;
}

// Update UI profile elements if present
document.addEventListener('DOMContentLoaded', () => {
    const user = getAuthUser();
    
    // Inject FontAwesome globally if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fa = document.createElement('link');
      fa.rel = 'stylesheet';
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fa);
    }

    if (user) {
        const userNameEls = document.querySelectorAll('.user-name-display');
        userNameEls.forEach(el => el.textContent = user.name);
        
        const avatarEls = document.querySelectorAll('.user-avatar');
        avatarEls.forEach(el => el.textContent = user.name.charAt(0).toUpperCase());
    }

    // Attach logout handlers
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    }));
});
