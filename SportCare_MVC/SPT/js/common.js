// Servicios compartidos de Sports Care. La sesión y los datos persistentes viven en el backend Java.
// El navegador conserva únicamente el carrito temporal de la tienda.

async function apiRequest(url, options = {}) {
    const config = { method: options.method || 'GET', credentials: 'same-origin', headers: { ...(options.headers || {}) } };
    if (options.body !== undefined) {
        config.headers['Content-Type'] = 'application/json';
        config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    const response = await fetch(url, config);
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { error: text || 'Respuesta no válida del servidor.' }; }
    if (!response.ok) throw new Error(data?.error || `Error HTTP ${response.status}`);
    return data;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

async function getCurrentUser() {
    try {
        const result = await apiRequest('/api/auth/me');
        return result?.user || null;
    } catch {
        return null;
    }
}

async function logout() {
    try { await apiRequest('/api/auth/logout', { method: 'POST', body: {} }); }
    finally { window.location.href = 'index.html'; }
}

window.apiRequest = apiRequest;
window.escapeHTML = escapeHTML;
window.getCurrentUser = getCurrentUser;
window.logout = logout;

// Comportamiento de autenticación y navegación de la página de inicio.
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('img[src^="http://"], img[src^="https://"]').forEach(image => {
        image.addEventListener('error', () => {
            image.onerror = null;
            image.src = 'img/logo.jpeg';
        }, { once: true });
    });

    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const openLoginBtn = document.getElementById('openLoginModal');
    const openRegisterBtn = document.getElementById('openRegisterModal');
    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    const closeLogin = document.getElementById('closeLogin');
    const closeRegister = document.getElementById('closeRegister');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    const showModal = (modal, otherModal, errorBox) => {
        if (!modal) return;
        if (otherModal) otherModal.style.display = 'none';
        if (errorBox) errorBox.textContent = '';
        modal.style.display = 'flex';
    };

    openLoginBtn?.addEventListener('click', () => showModal(loginModal, registerModal, loginError));
    openRegisterBtn?.addEventListener('click', () => showModal(registerModal, loginModal, registerError));
    heroRegisterBtn?.addEventListener('click', () => showModal(registerModal, loginModal, registerError));
    closeLogin?.addEventListener('click', () => { if (loginModal) loginModal.style.display = 'none'; });
    closeRegister?.addEventListener('click', () => { if (registerModal) registerModal.style.display = 'none'; });

    switchToRegister?.addEventListener('click', event => {
        event.preventDefault(); showModal(registerModal, loginModal, registerError);
    });
    switchToLogin?.addEventListener('click', event => {
        event.preventDefault(); showModal(loginModal, registerModal, loginError);
    });

    const requestedModal = new URLSearchParams(window.location.search).get('modal');
    if (requestedModal === 'login') showModal(loginModal, registerModal, loginError);
    if (requestedModal === 'register') showModal(registerModal, loginModal, registerError);

    window.addEventListener('click', event => {
        if (loginModal && event.target === loginModal) loginModal.style.display = 'none';
        if (registerModal && event.target === registerModal) registerModal.style.display = 'none';
    });

    registerForm?.addEventListener('submit', async event => {
        event.preventDefault();
        if (registerError) registerError.textContent = '';
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        if (!name) { registerError.textContent = 'Escribe tu nombre.'; return; }
        if (password.length < 6) { registerError.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
        const submit = registerForm.querySelector('[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            await apiRequest('/api/auth/register', { method: 'POST', body: { name, email, password } });
            window.location.href = 'dashboard.html';
        } catch (error) {
            if (registerError) registerError.textContent = error.message;
        } finally { if (submit) submit.disabled = false; }
    });

    loginForm?.addEventListener('submit', async event => {
        event.preventDefault();
        if (loginError) loginError.textContent = '';
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const submit = loginForm.querySelector('[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            const result = await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
            window.location.href = result.user.role === 'ADMINISTRADOR' ? 'admin.html' : 'dashboard.html';
        } catch (error) {
            if (loginError) loginError.textContent = error.message || 'Correo o contraseña incorrectos.';
        } finally { if (submit) submit.disabled = false; }
    });

    const mobileToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    const authButtons = document.getElementById('authButtons');
    if (mobileToggle && navMenu && authButtons) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = mobileToggle.getAttribute('aria-expanded') === 'true';
            mobileToggle.setAttribute('aria-expanded', String(!isOpen));
            mobileToggle.textContent = isOpen ? '☰' : '✕';
            navMenu.classList.toggle('open', !isOpen);
            authButtons.classList.toggle('open', !isOpen);
        });
        navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.textContent = '☰';
            navMenu.classList.remove('open');
            authButtons.classList.remove('open');
        }));
    }
});
