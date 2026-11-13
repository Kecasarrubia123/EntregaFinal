document.addEventListener('DOMContentLoaded', () => {
    const currentUser = checkAuth('user');
    if (!currentUser) return;

    const welcome = document.getElementById('userWelcomeText');
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (welcome) welcome.textContent = `Hola, ${currentUser.name}`;
    if (dateDisplay) dateDisplay.textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Navegación dentro del panel del usuario.
    const links = document.querySelectorAll('.sidebar-link[data-target]');
    const sections = document.querySelectorAll('.dash-section');
    links.forEach(link => link.addEventListener('click', () => {
        links.forEach(item => item.classList.toggle('active', item === link));
        sections.forEach(section => { section.style.display = section.id === link.dataset.target ? 'block' : 'none'; });
    }));

    // Cuestionario: se guarda por correo y no genera rutinas automáticamente.
    const questionnaireForm = document.getElementById('questionnaireForm');
    let questionnaires = readStorageJSON('sc_questionnaires', {});
    if (!questionnaires || typeof questionnaires !== 'object' || Array.isArray(questionnaires)) questionnaires = {};
    const savedQuestionnaire = questionnaires[currentUser.email];
    if (savedQuestionnaire) {
        ['goal', 'experience', 'days', 'age', 'height', 'weight'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = savedQuestionnaire[id] ?? '';
        });
    }

    if (questionnaireForm) questionnaireForm.addEventListener('submit', event => {
        event.preventDefault();
        const data = {};
        ['goal', 'experience', 'days', 'age', 'height', 'weight'].forEach(id => {
            const input = document.getElementById(id);
            if (input) data[id] = input.value;
        });
        questionnaires = readStorageJSON('sc_questionnaires', {});
        if (!questionnaires || typeof questionnaires !== 'object' || Array.isArray(questionnaires)) questionnaires = {};
        questionnaires[currentUser.email] = data;
        writeStorageJSON('sc_questionnaires', questionnaires);
        const success = document.getElementById('questSuccess');
        if (success) {
            success.textContent = 'Cuestionario guardado. Tus respuestas quedaron asociadas a tu cuenta en este navegador.';
            success.setAttribute('role', 'status');
        }
    });

    // Catálogo de ejercicios.
    const catalogGrid = document.getElementById('catalogGrid');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const filterLevel = document.getElementById('filterLevel');
    const activityExerciseSelect = document.getElementById('activityExercise');
    const fallbackImage = 'img/logo.jpeg';

    function populateCategoryFilter() {
        if (!filterCategory) return;
        const selected = filterCategory.value;
        const exercises = readStorageJSON('sc_exercises', []);
        const categories = [...new Set((Array.isArray(exercises) ? exercises : []).map(ex => ex.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
        filterCategory.innerHTML = '<option value="">Todas las categorías</option>' + categories.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join('');
        if (categories.includes(selected)) filterCategory.value = selected;
    }

    function getAllExercises() {
        const data = readStorageJSON('sc_exercises', []);
        return Array.isArray(data) ? data : [];
    }

    function renderCatalog() {
        const exercises = getAllExercises();
        const search = (searchInput?.value || '').trim().toLocaleLowerCase('es');
        const category = filterCategory?.value || '';
        const level = filterLevel?.value || '';

        // El selector de sesiones siempre contiene todos los ejercicios; no depende de los filtros visuales.
        if (activityExerciseSelect) {
            const previous = activityExerciseSelect.value;
            activityExerciseSelect.innerHTML = '<option value="">Seleccione ejercicio...</option>';
            exercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise.code;
                option.textContent = `${exercise.name} (${exercise.category})`;
                activityExerciseSelect.appendChild(option);
            });
            if (exercises.some(exercise => exercise.code === previous)) activityExerciseSelect.value = previous;
        }

        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';
        const filtered = exercises.filter(exercise => {
            const name = String(exercise.name || '').toLocaleLowerCase('es');
            const description = String(exercise.description || '').toLocaleLowerCase('es');
            return (name.includes(search) || description.includes(search))
                && (!category || exercise.category === category)
                && (!level || exercise.level === level);
        });

        if (!filtered.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = exercises.length ? 'No se encontraron ejercicios con esos filtros.' : 'Todavía no hay ejercicios en el catálogo.';
            catalogGrid.appendChild(empty);
            return;
        }

        filtered.forEach(exercise => {
            const card = document.createElement('article');
            card.className = 'exercise-card';
            const image = document.createElement('img');
            image.className = 'exercise-card-img';
            image.alt = `Imagen de ${exercise.name}`;
            image.loading = 'lazy';
            const imageURL = String(exercise.image || '').trim();
            image.src = /^(https?:\/\/|img\/)/i.test(imageURL) ? imageURL : fallbackImage;
            image.onerror = () => { image.onerror = null; image.src = fallbackImage; };

            const body = document.createElement('div');
            body.className = 'exercise-card-body';
            body.innerHTML = `
                <span class="badge">${escapeHTML(exercise.category)}</span>
                <span class="badge badge-level">${escapeHTML(exercise.level)}</span>
                <h3>${escapeHTML(exercise.name)}</h3>
                <p class="exercise-description">${escapeHTML(exercise.description)}</p>
                <button type="button" class="btn btn-outline btn-sm btn-full details-btn">Ver detalle</button>`;
            body.querySelector('.details-btn').addEventListener('click', () => openExerciseModal(exercise));
            card.append(image, body);
            catalogGrid.appendChild(card);
        });
    }

    [searchInput, filterCategory, filterLevel].forEach(input => {
        if (input) input.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', renderCatalog);
    });
    populateCategoryFilter();
    renderCatalog();

    // Modal de detalle del ejercicio.
    const detailModal = document.getElementById('exerciseDetailModal');
    const closeDetail = document.getElementById('closeDetail');
    function openExerciseModal(exercise) {
        document.getElementById('modalExName').textContent = exercise.name || '';
        document.getElementById('modalExCat').textContent = exercise.category || '';
        document.getElementById('modalExLevel').textContent = exercise.level || '';
        document.getElementById('modalExDuration').textContent = `${exercise.duration || 'Sin dato'} (Series: ${exercise.series || 'Sin dato'})`;
        document.getElementById('modalExDesc').textContent = exercise.description || '';
        if (detailModal) detailModal.style.display = 'flex';
    }
    if (closeDetail && detailModal) closeDetail.addEventListener('click', () => { detailModal.style.display = 'none'; });
    window.addEventListener('click', event => { if (detailModal && event.target === detailModal) detailModal.style.display = 'none'; });

    // Fecha local, evitando que el selector muestre el día anterior en algunas zonas horarias.
    const activityDate = document.getElementById('activityDate');
    const todayLocal = () => {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${today.getFullYear()}-${month}-${day}`;
    };
    if (activityDate && !activityDate.value) activityDate.value = todayLocal();

    const activityForm = document.getElementById('activityForm');
    const activityHistoryTable = document.getElementById('activityHistoryTable');
    const activityError = document.getElementById('activityError');

    function renderActivities() {
        if (!activityHistoryTable) return;
        const activities = readStorageJSON('sc_activities', {});
        const userActivities = Array.isArray(activities?.[currentUser.email]) ? [...activities[currentUser.email]] : [];
        activityHistoryTable.innerHTML = '';
        userActivities.sort((a, b) => String(b.date).localeCompare(String(a.date)));

        if (!userActivities.length) {
            activityHistoryTable.innerHTML = '<tr><td colspan="4" class="empty-cell">No hay sesiones registradas todavía.</td></tr>';
            return;
        }

        userActivities.forEach(activity => {
            const row = document.createElement('tr');
            [activity.date, activity.exerciseName, activity.category || 'General', activity.details || 'Completado'].forEach((value, index) => {
                const cell = document.createElement('td');
                cell.textContent = value || '';
                if (index === 1) { const strong = document.createElement('strong'); strong.textContent = value || ''; cell.textContent = ''; cell.appendChild(strong); }
                row.appendChild(cell);
            });
            activityHistoryTable.appendChild(row);
        });
    }

    if (activityForm) activityForm.addEventListener('submit', event => {
        event.preventDefault();
        if (activityError) activityError.textContent = '';
        const exerciseCode = activityExerciseSelect?.value || '';
        const date = activityDate?.value || '';
        const exercises = getAllExercises();
        const exercise = exercises.find(item => item.code === exerciseCode);
        if (!exercise) { if (activityError) activityError.textContent = 'Selecciona un ejercicio disponible.'; return; }
        if (!date) { if (activityError) activityError.textContent = 'Selecciona la fecha de la actividad.'; return; }
        if (date > todayLocal()) { if (activityError) activityError.textContent = 'La fecha no puede estar en el futuro.'; return; }

        const activities = readStorageJSON('sc_activities', {});
        const safeActivities = activities && typeof activities === 'object' && !Array.isArray(activities) ? activities : {};
        if (!Array.isArray(safeActivities[currentUser.email])) safeActivities[currentUser.email] = [];
        safeActivities[currentUser.email].push({ exerciseCode: exercise.code, exerciseName: exercise.name, category: exercise.category, details: exercise.duration, date });
        writeStorageJSON('sc_activities', safeActivities);
        renderActivities();
        activityForm.reset();
        if (activityDate) activityDate.value = todayLocal();
        if (activityError) { activityError.className = 'success-msg'; activityError.textContent = 'Actividad registrada correctamente en este navegador.'; }
    });
    renderActivities();
});
