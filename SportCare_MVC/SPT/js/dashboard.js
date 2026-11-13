document.addEventListener('DOMContentLoaded', async () => {
    let currentUser;
    try {
        const session = await apiRequest('/api/auth/me');
        currentUser = session.user;
        if (currentUser.role === 'ADMINISTRADOR') { window.location.href = 'admin.html'; return; }
    } catch { window.location.href = 'index.html?modal=login'; return; }

    const welcome = document.getElementById('userWelcomeText');
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (welcome) welcome.textContent = `Hola, ${currentUser.name}`;
    if (dateDisplay) dateDisplay.textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    const links = document.querySelectorAll('.sidebar-link[data-target]');
    const sections = document.querySelectorAll('.dash-section');
    links.forEach(link => link.addEventListener('click', () => {
        links.forEach(item => item.classList.toggle('active', item === link));
        sections.forEach(section => { section.style.display = section.id === link.dataset.target ? 'block' : 'none'; });
    }));

    // Cuestionario conectado a cuestionarios_iniciales.
    const questionnaireForm = document.getElementById('questionnaireForm');
    const questionnaireIds = ['goal', 'experience', 'days', 'age', 'height', 'weight'];
    try {
        const saved = await apiRequest('/api/dashboard/questionnaire');
        if (saved) questionnaireIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = saved[id] ?? '';
        });
    } catch (error) {
        const success = document.getElementById('questSuccess');
        if (success) success.textContent = error.message;
    }
    questionnaireForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const data = {};
        questionnaireIds.forEach(id => { data[id] = document.getElementById(id)?.value ?? ''; });
        const success = document.getElementById('questSuccess');
        try {
            await apiRequest('/api/dashboard/questionnaire', { method: 'PUT', body: data });
            if (success) { success.textContent = 'Cuestionario guardado correctamente en sports_care.'; success.setAttribute('role', 'status'); }
        } catch (error) { if (success) success.textContent = error.message; }
    });

    // Catálogo consultado desde ejercicios y categorias_ejercicio.
    const catalogGrid = document.getElementById('catalogGrid');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const filterLevel = document.getElementById('filterLevel');
    const activityExerciseSelect = document.getElementById('activityExercise');
    const fallbackImage = 'img/logo.jpeg';
    let exercises = [];

    function populateCategoryFilter() {
        if (!filterCategory) return;
        const selected = filterCategory.value;
        const categories = [...new Set(exercises.map(ex => ex.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
        filterCategory.innerHTML = '<option value="">Todas las categorías</option>' + categories.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join('');
        if (categories.includes(selected)) filterCategory.value = selected;
    }

    function renderCatalog() {
        const search = (searchInput?.value || '').trim().toLocaleLowerCase('es');
        const category = filterCategory?.value || '';
        const level = filterLevel?.value || '';
        if (activityExerciseSelect) {
            const previous = activityExerciseSelect.value;
            activityExerciseSelect.innerHTML = '<option value="">Seleccione ejercicio...</option>';
            exercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise.code;
                option.textContent = `${exercise.name} (${exercise.category})`;
                activityExerciseSelect.appendChild(option);
            });
            if (exercises.some(ex => ex.code === previous)) activityExerciseSelect.value = previous;
        }
        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';
        const filtered = exercises.filter(exercise => {
            const name = String(exercise.name || '').toLocaleLowerCase('es');
            const description = String(exercise.description || '').toLocaleLowerCase('es');
            return (name.includes(search) || description.includes(search)) && (!category || exercise.category === category) && (!level || exercise.level === level);
        });
        if (!filtered.length) {
            const empty = document.createElement('p'); empty.className = 'empty-state';
            empty.textContent = exercises.length ? 'No se encontraron ejercicios con esos filtros.' : 'Todavía no hay ejercicios en el catálogo.';
            catalogGrid.appendChild(empty); return;
        }
        filtered.forEach(exercise => {
            const card = document.createElement('article'); card.className = 'exercise-card';
            const image = document.createElement('img'); image.className = 'exercise-card-img'; image.alt = `Imagen de ${exercise.name}`; image.loading = 'lazy';
            const imageURL = String(exercise.image || '').trim(); image.src = /^(https?:\/\/|img\/)/i.test(imageURL) ? imageURL : fallbackImage;
            image.onerror = () => { image.onerror = null; image.src = fallbackImage; };
            const body = document.createElement('div'); body.className = 'exercise-card-body';
            body.innerHTML = `<span class="badge">${escapeHTML(exercise.category)}</span><span class="badge badge-level">${escapeHTML(exercise.level)}</span><h3>${escapeHTML(exercise.name)}</h3><p class="exercise-description">${escapeHTML(exercise.description)}</p><button type="button" class="btn btn-outline btn-sm btn-full details-btn">Ver detalle</button>`;
            body.querySelector('.details-btn').addEventListener('click', () => openExerciseModal(exercise));
            card.append(image, body); catalogGrid.appendChild(card);
        });
    }
    [searchInput, filterCategory, filterLevel].forEach(input => input?.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', renderCatalog));
    try { exercises = await apiRequest('/api/exercises'); populateCategoryFilter(); renderCatalog(); }
    catch (error) { if (catalogGrid) catalogGrid.textContent = error.message; }

    const detailModal = document.getElementById('exerciseDetailModal');
    function openExerciseModal(exercise) {
        document.getElementById('modalExName').textContent = exercise.name || '';
        document.getElementById('modalExCat').textContent = exercise.category || '';
        document.getElementById('modalExLevel').textContent = exercise.level || '';
        document.getElementById('modalExDuration').textContent = `${exercise.duration || 'Sin dato'} (Series: ${exercise.series || 'Sin dato'})`;
        document.getElementById('modalExDesc').textContent = exercise.description || '';
        if (detailModal) detailModal.style.display = 'flex';
    }
    document.getElementById('closeDetail')?.addEventListener('click', () => { if (detailModal) detailModal.style.display = 'none'; });
    window.addEventListener('click', event => { if (detailModal && event.target === detailModal) detailModal.style.display = 'none'; });

    const activityDate = document.getElementById('activityDate');
    const todayLocal = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };
    if (activityDate && !activityDate.value) activityDate.value = todayLocal();
    const activityForm = document.getElementById('activityForm');
    const activityHistoryTable = document.getElementById('activityHistoryTable');
    const activityError = document.getElementById('activityError');

    async function renderActivities() {
        if (!activityHistoryTable) return;
        try {
            const activities = await apiRequest('/api/dashboard/activities');
            activityHistoryTable.innerHTML = '';
            if (!activities.length) { activityHistoryTable.innerHTML = '<tr><td colspan="4" class="empty-cell">No hay sesiones registradas todavía.</td></tr>'; return; }
            activities.forEach(activity => {
                const row = document.createElement('tr');
                [activity.date, activity.exerciseName, activity.category || 'General', activity.details || 'Completado'].forEach((value, index) => {
                    const cell = document.createElement('td'); cell.textContent = value || '';
                    if (index === 1) { const strong = document.createElement('strong'); strong.textContent = value || ''; cell.textContent = ''; cell.appendChild(strong); }
                    row.appendChild(cell);
                });
                activityHistoryTable.appendChild(row);
            });
        } catch (error) { activityHistoryTable.innerHTML = `<tr><td colspan="4" class="empty-cell">${escapeHTML(error.message)}</td></tr>`; }
    }

    activityForm?.addEventListener('submit', async event => {
        event.preventDefault(); if (activityError) activityError.textContent = '';
        const exerciseCode = activityExerciseSelect?.value || ''; const date = activityDate?.value || '';
        if (!exercises.some(item => item.code === exerciseCode)) { if (activityError) activityError.textContent = 'Selecciona un ejercicio disponible.'; return; }
        if (!date) { if (activityError) activityError.textContent = 'Selecciona la fecha de la actividad.'; return; }
        if (date > todayLocal()) { if (activityError) activityError.textContent = 'La fecha no puede estar en el futuro.'; return; }
        try {
            await apiRequest('/api/dashboard/activities', { method: 'POST', body: { exerciseCode, date } });
            await renderActivities(); activityForm.reset(); if (activityDate) activityDate.value = todayLocal();
            if (activityError) { activityError.className = 'success-msg'; activityError.textContent = 'Actividad registrada correctamente en sports_care.'; }
        } catch (error) { if (activityError) activityError.textContent = error.message; }
    });
    await renderActivities();
});
