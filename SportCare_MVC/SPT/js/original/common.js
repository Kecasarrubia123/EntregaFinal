// Utilidades y datos de demostración de Sports Care.
// Esta versión funciona en el navegador con localStorage; no reemplaza una base de datos real.

function readStorageJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
        console.warn(`No se pudieron leer los datos de ${key}; se utilizará el valor predeterminado.`, error);
        return fallback;
    }
}

function writeStorageJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

function getDefaultExercises() {
    return [
        { code: 'EX-001', name: 'Press de banca con barra', category: 'Fuerza', description: 'Ejercicio para trabajar pectorales, tríceps y hombros. Utiliza una carga adecuada y controla el movimiento.', duration: '4 series x 10 repeticiones', series: '4', level: 'Intermedio', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80' },
        { code: 'EX-002', name: 'Sentadillas libres', category: 'Fuerza', description: 'Ejercicio multiarticular para trabajar piernas y glúteos. Mantén la espalda en una posición cómoda.', duration: '4 series x 12 repeticiones', series: '4', level: 'Principiante', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80' },
        { code: 'EX-003', name: 'Dominadas en barra', category: 'Hipertrofia', description: 'Ejercicio con peso corporal para trabajar espalda y brazos. Utiliza una variante acorde con tu experiencia.', duration: '3 series x 8 repeticiones', series: '3', level: 'Avanzado', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80' },
        { code: 'EX-004', name: 'Caminata en banda', category: 'Cardio', description: 'Actividad cardiovascular para trabajar la resistencia. Ajusta la velocidad a tu condición física.', duration: '20 minutos', series: '1', level: 'Principiante', image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=600&q=80' },
        { code: 'EX-005', name: 'Saltos de cuerda', category: 'Resistencia', description: 'Actividad para mejorar la coordinación y la resistencia. Empieza con intervalos cortos si lo necesitas.', duration: '3 series x 1 minuto', series: '3', level: 'Intermedio', image: '' }
    ];
}

function initializeStorage() {
    // Garantiza que las cuentas de demo estén disponibles aunque ya exista una lista de usuarios.
    const demoUsers = [
        { name: 'Administrador General', email: 'admin@sportscare.com', password: 'Admin123*', role: 'admin', active: true },
        { name: 'Usuario Demo', email: 'usuario@sportscare.com', password: 'User123*', role: 'user', active: true }
    ];
    let users = readStorageJSON('sc_users', []);
    if (!Array.isArray(users)) users = [];
    users = users.filter(user => user && typeof user === 'object');
    demoUsers.forEach(demo => {
        const index = users.findIndex(user => String(user.email || '').toLowerCase() === demo.email);
        if (index === -1) users.push(demo);
        else users[index] = { ...demo, ...users[index], email: demo.email, password: demo.password, role: demo.role, active: typeof users[index].active === 'boolean' ? users[index].active : true };
    });
    writeStorageJSON('sc_users', users);

    const storedExercises = readStorageJSON('sc_exercises', null);
    if (!Array.isArray(storedExercises)) writeStorageJSON('sc_exercises', getDefaultExercises());

    const storedQuestionnaires = readStorageJSON('sc_questionnaires', null);
    if (!storedQuestionnaires || typeof storedQuestionnaires !== 'object' || Array.isArray(storedQuestionnaires)) {
        writeStorageJSON('sc_questionnaires', {});
    }

    const storedActivities = readStorageJSON('sc_activities', null);
    if (!storedActivities || typeof storedActivities !== 'object' || Array.isArray(storedActivities)) {
        writeStorageJSON('sc_activities', {});
    }

    const storedPqrs = readStorageJSON('sc_pqrs', null);
    if (!Array.isArray(storedPqrs)) writeStorageJSON('sc_pqrs', []);
    const storedPlanInterests = readStorageJSON('sc_plan_interests', null);
    if (!Array.isArray(storedPlanInterests)) writeStorageJSON('sc_plan_interests', []);
    const storedOrders = readStorageJSON('sc_store_orders', null);
    if (!Array.isArray(storedOrders)) writeStorageJSON('sc_store_orders', []);
}

function setCurrentSession(user) {
    const safeUser = { name: user.name, email: user.email, role: user.role };
    writeStorageJSON('sc_current_user', safeUser);
}

function checkAuth(requiredRole = 'user') {
    const sessionUser = readStorageJSON('sc_current_user', null);
    if (!sessionUser || !sessionUser.email) {
        window.location.href = 'index.html';
        return null;
    }

    // Consulta la lista actual para respetar cambios realizados desde el panel administrativo.
    const users = readStorageJSON('sc_users', []);
    const account = Array.isArray(users) ? users.find(user => String(user.email || '').toLowerCase() === String(sessionUser.email).toLowerCase()) : null;
    if (!account || account.active === false) {
        localStorage.removeItem('sc_current_user');
        window.location.href = 'index.html';
        return null;
    }

    if (requiredRole === 'admin' && account.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return null;
    }
    if (requiredRole === 'user' && account.role !== 'user') {
        window.location.href = 'admin.html';
        return null;
    }

    return { name: account.name, email: account.email, role: account.role };
}

function logout() {
    localStorage.removeItem('sc_current_user');
    window.location.href = 'index.html';
}

window.readStorageJSON = readStorageJSON;
window.writeStorageJSON = writeStorageJSON;
window.escapeHTML = escapeHTML;
window.checkAuth = checkAuth;
window.logout = logout;

// Manejadores de la página de inicio. Las comprobaciones permiten reutilizar este archivo en todas las páginas.
document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();

    // Si una imagen externa no carga, muestra el logo local en vez de un icono roto.
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

    if (openLoginBtn) openLoginBtn.addEventListener('click', () => showModal(loginModal, registerModal, loginError));
    if (openRegisterBtn) openRegisterBtn.addEventListener('click', () => showModal(registerModal, loginModal, registerError));
    if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', () => showModal(registerModal, loginModal, registerError));
    if (closeLogin) closeLogin.addEventListener('click', () => { if (loginModal) loginModal.style.display = 'none'; });
    if (closeRegister) closeRegister.addEventListener('click', () => { if (registerModal) registerModal.style.display = 'none'; });

    if (switchToRegister) switchToRegister.addEventListener('click', event => {
        event.preventDefault();
        showModal(registerModal, loginModal, registerError);
    });
    if (switchToLogin) switchToLogin.addEventListener('click', event => {
        event.preventDefault();
        showModal(loginModal, registerModal, loginError);
    });

    // Permite abrir el modal desde enlaces de otras páginas, por ejemplo index.html?modal=register.
    const requestedModal = new URLSearchParams(window.location.search).get('modal');
    if (requestedModal === 'login') showModal(loginModal, registerModal, loginError);
    if (requestedModal === 'register') showModal(registerModal, loginModal, registerError);

    window.addEventListener('click', event => {
        if (loginModal && event.target === loginModal) loginModal.style.display = 'none';
        if (registerModal && event.target === registerModal) registerModal.style.display = 'none';
    });

    if (registerForm) registerForm.addEventListener('submit', event => {
        event.preventDefault();
        if (registerError) registerError.textContent = '';
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;

        if (!name) { registerError.textContent = 'Escribe tu nombre.'; return; }
        if (password.length < 6) { registerError.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }

        const users = readStorageJSON('sc_users', []);
        if (!Array.isArray(users)) { registerError.textContent = 'No se pudieron leer las cuentas guardadas. Recarga la página e inténtalo de nuevo.'; return; }
        if (users.some(user => String(user.email || '').toLowerCase() === email)) {
            registerError.textContent = 'El correo electrónico ya está registrado.';
            return;
        }

        const newUser = { name, email, password, role: 'user', active: true };
        users.push(newUser);
        writeStorageJSON('sc_users', users);
        setCurrentSession(newUser);
        window.location.href = 'dashboard.html';
    });

    if (loginForm) loginForm.addEventListener('submit', event => {
        event.preventDefault();
        if (loginError) loginError.textContent = '';
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const users = readStorageJSON('sc_users', []);
        const user = Array.isArray(users) ? users.find(account => String(account.email || '').toLowerCase() === email && account.password === password && account.active !== false) : null;

        if (!user) {
            if (loginError) loginError.textContent = 'Correo o contraseña incorrectos. Comprueba los datos o utiliza una cuenta registrada.';
            return;
        }

        setCurrentSession(user);
        window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
    });

    // Menú adaptable para pantallas pequeñas.
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
