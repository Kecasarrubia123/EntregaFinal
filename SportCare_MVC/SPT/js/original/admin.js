document.addEventListener('DOMContentLoaded', () => {
    const adminUser = checkAuth('admin');
    if (!adminUser) return;

    const welcome = document.getElementById('adminWelcomeText');
    if (welcome) welcome.textContent = `Administrador: ${adminUser.name}`;
    document.getElementById('adminLogoutBtn')?.addEventListener('click', logout);

    // Cambiar entre secciones del panel.
    const sectionLinks = document.querySelectorAll('.sidebar-link[data-admin-target]');
    const adminSections = document.querySelectorAll('.admin-section');
    sectionLinks.forEach(link => link.addEventListener('click', () => {
        sectionLinks.forEach(item => item.classList.toggle('active', item === link));
        adminSections.forEach(section => { section.style.display = section.id === link.dataset.adminTarget ? 'block' : 'none'; });
    }));

    // CRUD de ejercicios.
    const exerciseTable = document.getElementById('adminExerciseTable');
    const adminSearch = document.getElementById('adminSearch');
    const exerciseModal = document.getElementById('exerciseModal');
    const openCreateModalBtn = document.getElementById('openCreateModalBtn');
    const closeExerciseModal = document.getElementById('closeExerciseModal');
    const exerciseForm = document.getElementById('exerciseForm');
    const formError = document.getElementById('adminFormError');

    function getExercises() {
        const data = readStorageJSON('sc_exercises', []);
        return Array.isArray(data) ? data : [];
    }

    function makeCell(text, tag = 'td') {
        const cell = document.createElement(tag);
        cell.textContent = text ?? '';
        return cell;
    }

    function renderAdminTable() {
        const exercises = getExercises();
        const search = (adminSearch?.value || '').trim().toLocaleLowerCase('es');
        exerciseTable.innerHTML = '';
        const filtered = exercises.filter(exercise => [exercise.name, exercise.code, exercise.category]
            .some(value => String(value || '').toLocaleLowerCase('es').includes(search)));

        if (!filtered.length) {
            const row = document.createElement('tr');
            const cell = makeCell(exercises.length ? 'No se encontraron ejercicios con esa búsqueda.' : 'No hay ejercicios registrados.');
            cell.colSpan = 6;
            cell.className = 'empty-cell';
            row.appendChild(cell);
            exerciseTable.appendChild(row);
            return;
        }

        filtered.forEach(exercise => {
            const row = document.createElement('tr');
            row.append(makeCell(exercise.code), makeCell(exercise.name), makeCell(exercise.category), makeCell(exercise.level), makeCell(`${exercise.duration} / ${exercise.series} series`));
            const actions = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.type = 'button'; editButton.className = 'btn btn-outline btn-sm'; editButton.textContent = 'Editar';
            editButton.addEventListener('click', () => openEditModal(exercise.code));
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button'; deleteButton.className = 'btn btn-danger btn-sm'; deleteButton.textContent = 'Eliminar';
            deleteButton.addEventListener('click', () => deleteExercise(exercise.code));
            actions.append(editButton, document.createTextNode(' '), deleteButton);
            row.appendChild(actions);
            exerciseTable.appendChild(row);
        });
    }

    adminSearch?.addEventListener('input', renderAdminTable);

    function openCreateModal() {
        exerciseForm.reset();
        document.getElementById('modalTitle').textContent = 'Registrar nuevo ejercicio';
        document.getElementById('editIndex').value = '';
        document.getElementById('exCode').disabled = false;
        if (formError) formError.textContent = '';
        exerciseModal.style.display = 'flex';
    }

    function openEditModal(code) {
        const exercise = getExercises().find(item => item.code === code);
        if (!exercise) return;
        exerciseForm.reset();
        document.getElementById('modalTitle').textContent = 'Editar ejercicio';
        document.getElementById('editIndex').value = exercise.code;
        document.getElementById('exCode').value = exercise.code;
        document.getElementById('exCode').disabled = true;
        document.getElementById('exName').value = exercise.name;
        document.getElementById('exCategory').value = exercise.category;
        document.getElementById('exLevel').value = exercise.level;
        document.getElementById('exDuration').value = exercise.duration;
        document.getElementById('exSeries').value = exercise.series;
        document.getElementById('exImage').value = exercise.image || '';
        document.getElementById('exDesc').value = exercise.description;
        if (formError) formError.textContent = '';
        exerciseModal.style.display = 'flex';
    }

    openCreateModalBtn?.addEventListener('click', openCreateModal);
    closeExerciseModal?.addEventListener('click', () => { exerciseModal.style.display = 'none'; });
    window.addEventListener('click', event => { if (event.target === exerciseModal) exerciseModal.style.display = 'none'; });

    exerciseForm?.addEventListener('submit', event => {
        event.preventDefault();
        if (formError) formError.textContent = '';
        const code = document.getElementById('exCode').value.trim().toUpperCase();
        const name = document.getElementById('exName').value.trim();
        const category = document.getElementById('exCategory').value;
        const level = document.getElementById('exLevel').value;
        const duration = document.getElementById('exDuration').value.trim();
        const series = Number(document.getElementById('exSeries').value);
        const image = document.getElementById('exImage').value.trim();
        const description = document.getElementById('exDesc').value.trim();
        const editCode = document.getElementById('editIndex').value;
        let exercises = getExercises();

        if (!code || !name || !duration || !description) { if (formError) formError.textContent = 'Completa todos los campos obligatorios.'; return; }
        if (!Number.isInteger(series) || series < 1 || series > 10) { if (formError) formError.textContent = 'El número de series debe estar entre 1 y 10.'; return; }
        if (image && !/^https?:\/\//i.test(image) && !/^img\//i.test(image)) { if (formError) formError.textContent = 'La imagen debe tener una URL http(s) válida o una ruta local dentro de img/.'; return; }

        if (!editCode) {
            if (exercises.some(item => String(item.code).toUpperCase() === code)) { if (formError) formError.textContent = 'Ese código ya existe. Escribe uno diferente.'; return; }
            exercises.push({ code, name, category, description, duration, series: String(series), level, image });
        } else {
            exercises = exercises.map(item => item.code === editCode ? { ...item, name, category, description, duration, series: String(series), level, image } : item);
        }

        writeStorageJSON('sc_exercises', exercises);
        exerciseModal.style.display = 'none';
        renderAdminTable();
        alert(editCode ? 'Ejercicio actualizado correctamente.' : 'Ejercicio registrado correctamente.');
    });

    function deleteExercise(code) {
        const exercise = getExercises().find(item => item.code === code);
        if (!exercise || !confirm(`¿Quieres eliminar el ejercicio "${exercise.name}"?`)) return;
        writeStorageJSON('sc_exercises', getExercises().filter(item => item.code !== code));
        renderAdminTable();
    }

    // Consulta y actualización básica de cuentas, contemplada como función importante posterior.
    const userTable = document.getElementById('adminUserTable');
    const userSearch = document.getElementById('adminUserSearch');

    function renderUsers() {
        if (!userTable) return;
        const usersData = readStorageJSON('sc_users', []);
        const users = Array.isArray(usersData) ? usersData : [];
        const query = (userSearch?.value || '').trim().toLocaleLowerCase('es');
        const filtered = users.filter(user => `${user.name || ''} ${user.email || ''}`.toLocaleLowerCase('es').includes(query));
        userTable.innerHTML = '';
        if (!filtered.length) {
            const row = document.createElement('tr');
            const cell = makeCell('No se encontraron usuarios.'); cell.colSpan = 5; cell.className = 'empty-cell'; row.appendChild(cell); userTable.appendChild(row); return;
        }
        filtered.forEach(user => {
            const row = document.createElement('tr');
            row.appendChild(makeCell(user.name || 'Sin nombre'));
            row.appendChild(makeCell(user.email || 'Sin correo'));
            row.appendChild(makeCell(user.role === 'admin' ? 'Administrador' : 'Usuario'));
            row.appendChild(makeCell(user.active === false ? 'Inactivo' : 'Activo'));
            const actions = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.type = 'button'; editButton.className = 'btn btn-outline btn-sm'; editButton.textContent = 'Editar nombre';
            editButton.addEventListener('click', () => {
                const newName = prompt('Escribe el nuevo nombre visible:', user.name || '');
                if (newName === null) return;
                const cleanName = newName.trim();
                if (!cleanName) { alert('El nombre no puede quedar vacío.'); return; }
                const allUsers = readStorageJSON('sc_users', []);
                const updated = (Array.isArray(allUsers) ? allUsers : []).map(item => item.email === user.email ? { ...item, name: cleanName } : item);
                writeStorageJSON('sc_users', updated);
                const activeSession = readStorageJSON('sc_current_user', null);
                if (activeSession && activeSession.email === user.email) writeStorageJSON('sc_current_user', { ...activeSession, name: cleanName });
                renderUsers();
            });
            actions.appendChild(editButton);
            if (user.role !== 'admin') {
                const toggleButton = document.createElement('button');
                toggleButton.type = 'button';
                toggleButton.className = 'btn btn-sm ' + (user.active === false ? 'btn-solid' : 'btn-danger');
                toggleButton.textContent = user.active === false ? 'Activar' : 'Desactivar';
                toggleButton.style.marginLeft = '6px';
                toggleButton.addEventListener('click', () => {
                    const isActive = user.active !== false;
                    const question = isActive ? `¿Desactivar la cuenta de ${user.name}?` : `¿Activar la cuenta de ${user.name}?`;
                    if (!confirm(question)) return;
                    const allUsers = readStorageJSON('sc_users', []);
                    const updated = (Array.isArray(allUsers) ? allUsers : []).map(item => item.email === user.email ? { ...item, active: !isActive } : item);
                    writeStorageJSON('sc_users', updated);
                    renderUsers();
                });
                actions.appendChild(toggleButton);
            }
            row.appendChild(actions);
            userTable.appendChild(row);
        });
    }

    userSearch?.addEventListener('input', renderUsers);

    // Gestión de PQRS: peticiones, quejas, reclamos, sugerencias y felicitaciones.
    const pqrsTable = document.getElementById('adminPqrsTable');
    const pqrsSearch = document.getElementById('adminPqrsSearch');
    const pqrsStatuses = ['Recibida', 'En revisión', 'Respondida', 'Cerrada'];
    function getPqrs() {
        const data = readStorageJSON('sc_pqrs', []);
        return Array.isArray(data) ? data : [];
    }
    function renderPqrs() {
        if (!pqrsTable) return;
        const list = getPqrs();
        const query = (pqrsSearch?.value || '').trim().toLocaleLowerCase('es');
        const filtered = list.filter(item => [item.id, item.name, item.email, item.type, item.area, item.subject, item.message]
            .some(value => String(value || '').toLocaleLowerCase('es').includes(query)));
        pqrsTable.innerHTML = '';
        if (!filtered.length) {
            const row = document.createElement('tr');
            const cell = makeCell(list.length ? 'No hay solicitudes que coincidan con la búsqueda.' : 'Todavía no se han recibido solicitudes.');
            cell.colSpan = 5; cell.className = 'empty-cell'; row.appendChild(cell); pqrsTable.appendChild(row); return;
        }
        filtered.forEach(item => {
            const row = document.createElement('tr');
            const ticketCell = document.createElement('td');
            const code = document.createElement('strong'); code.textContent = item.id || 'Sin código';
            const date = document.createElement('small'); date.className = 'admin-subtext';
            date.textContent = item.createdAt ? new Date(item.createdAt).toLocaleString('es-CO') : 'Fecha no disponible';
            ticketCell.append(code, document.createElement('br'), date); row.appendChild(ticketCell);
            const contact = document.createElement('td');
            const name = document.createElement('strong'); name.textContent = item.name || 'Sin nombre';
            const email = document.createElement('small'); email.className = 'admin-subtext'; email.textContent = item.email || 'Sin correo';
            contact.append(name, document.createElement('br'), email); row.appendChild(contact);
            const typeCell = document.createElement('td');
            const type = document.createElement('span'); type.className = 'badge'; type.textContent = item.type || 'Solicitud';
            const area = document.createElement('small'); area.className = 'admin-subtext'; area.textContent = item.area || 'General';
            typeCell.append(type, document.createElement('br'), area); row.appendChild(typeCell);
            const messageCell = document.createElement('td');
            const subject = document.createElement('strong'); subject.textContent = item.subject || 'Sin asunto';
            const details = document.createElement('details'); details.className = 'admin-details';
            const summary = document.createElement('summary'); summary.textContent = 'Leer mensaje';
            const body = document.createElement('p'); body.textContent = item.message || ''; details.append(summary, body);
            if (item.response) { const response = document.createElement('p'); response.className = 'pqrs-admin-response'; response.textContent = `Respuesta: ${item.response}`; details.appendChild(response); }
            messageCell.append(subject, details); row.appendChild(messageCell);
            const statusCell = document.createElement('td');
            const select = document.createElement('select'); select.className = 'status-select'; select.setAttribute('aria-label', `Estado de ${item.id}`);
            pqrsStatuses.forEach(status => { const option = document.createElement('option'); option.value = status; option.textContent = status; select.appendChild(option); });
            select.value = pqrsStatuses.includes(item.status) ? item.status : 'Recibida';
            select.addEventListener('change', () => {
                const updated = getPqrs().map(record => record.id === item.id ? { ...record, status: select.value } : record);
                writeStorageJSON('sc_pqrs', updated); renderPqrs();
            });
            const replyButton = document.createElement('button');
            replyButton.type = 'button'; replyButton.className = 'btn btn-outline btn-sm admin-reply-btn';
            replyButton.textContent = item.response ? 'Editar respuesta' : 'Responder';
            replyButton.addEventListener('click', () => {
                const responseText = prompt(`Respuesta para ${item.id}:`, item.response || '');
                if (responseText === null) return;
                const cleanResponse = responseText.trim();
                const updated = getPqrs().map(record => record.id === item.id ? { ...record, response: cleanResponse, status: cleanResponse ? 'Respondida' : (record.status || 'Recibida') } : record);
                writeStorageJSON('sc_pqrs', updated); renderPqrs();
            });
            statusCell.append(select, document.createElement('br'), replyButton); row.appendChild(statusCell); pqrsTable.appendChild(row);
        });
    }
    pqrsSearch?.addEventListener('input', renderPqrs);

    // Pedidos de la tienda: son compras simuladas, sin cobros ni envíos reales.
    const ordersTable = document.getElementById('adminOrdersTable');
    const orderStatuses = ['Pedido simulado', 'En preparación (demo)', 'Entregado (demo)', 'Cancelado (demo)'];
    const formatCOP = value => '$' + Number(value || 0).toLocaleString('es-CO') + ' COP';
    function getOrders() { const data = readStorageJSON('sc_store_orders', []); return Array.isArray(data) ? data : []; }
    function renderOrders() {
        if (!ordersTable) return;
        const orders = getOrders(); ordersTable.innerHTML = '';
        if (!orders.length) { const row = document.createElement('tr'); const cell = makeCell('No hay pedidos simulados todavía.'); cell.colSpan = 6; cell.className = 'empty-cell'; row.appendChild(cell); ordersTable.appendChild(row); return; }
        [...orders].reverse().forEach(order => {
            const row = document.createElement('tr');
            row.appendChild(makeCell(order.id || 'Sin número'));
            row.appendChild(makeCell(order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO') : 'Sin fecha'));
            const buyer = document.createElement('td'); const buyerName = document.createElement('strong'); buyerName.textContent = order.buyerName || 'Cliente'; const buyerEmail = document.createElement('small'); buyerEmail.className = 'admin-subtext'; buyerEmail.textContent = order.buyerEmail || ''; buyer.append(buyerName, document.createElement('br'), buyerEmail); row.appendChild(buyer);
            const itemsCell = document.createElement('td'); const summary = Array.isArray(order.items) ? order.items.map(item => `${item.quantity} × ${item.name}`).join(', ') : 'Detalle no disponible'; itemsCell.textContent = summary; row.appendChild(itemsCell);
            row.appendChild(makeCell(formatCOP(order.total)));
            const statusCell = document.createElement('td'); const select = document.createElement('select'); select.className = 'status-select'; select.setAttribute('aria-label', `Estado del pedido ${order.id}`);
            orderStatuses.forEach(status => { const option = document.createElement('option'); option.value = status; option.textContent = status; select.appendChild(option); });
            select.value = orderStatuses.includes(order.status) ? order.status : 'Pedido simulado';
            select.addEventListener('change', () => { const updated = getOrders().map(record => record.id === order.id ? { ...record, status: select.value } : record); writeStorageJSON('sc_store_orders', updated); renderOrders(); });
            statusCell.appendChild(select); row.appendChild(statusCell); ordersTable.appendChild(row);
        });
    }

    // Seguimiento de intereses en planes propuestos, sin activar suscripciones.
    const planInterestTable = document.getElementById('adminPlanInterestTable');
    const planInterestStatuses = ['Interés registrado', 'Contactado (demo)', 'Cerrado (demo)'];
    function getPlanInterests() { const data = readStorageJSON('sc_plan_interests', []); return Array.isArray(data) ? data : []; }
    function renderPlanInterests() {
        if (!planInterestTable) return;
        const interests = getPlanInterests(); planInterestTable.innerHTML = '';
        if (!interests.length) { const row = document.createElement('tr'); const cell = makeCell('Todavía no hay intereses registrados desde la página de planes.'); cell.colSpan = 5; cell.className = 'empty-cell'; row.appendChild(cell); planInterestTable.appendChild(row); return; }
        [...interests].reverse().forEach(item => {
            const row = document.createElement('tr');
            row.appendChild(makeCell(item.selectedAt ? new Date(item.selectedAt).toLocaleString('es-CO') : 'Sin fecha'));
            row.appendChild(makeCell(item.name || (item.id === 'individual' ? 'Plan Individual' : 'Plan para instituciones')));
            row.appendChild(makeCell(item.email || 'Interés anónimo en este navegador'));
            row.appendChild(makeCell(formatCOP(item.price) + (item.unit === 'COP/mes' ? ' / mes' : '')));
            const statusCell = document.createElement('td'); const select = document.createElement('select'); select.className = 'status-select'; select.setAttribute('aria-label', 'Estado del interés del plan');
            planInterestStatuses.forEach(status => { const option = document.createElement('option'); option.value = status; option.textContent = status; select.appendChild(option); });
            select.value = planInterestStatuses.includes(item.adminStatus) ? item.adminStatus : 'Interés registrado';
            select.addEventListener('change', () => { const updated = getPlanInterests().map(record => record === item || record.id === item.id && record.selectedAt === item.selectedAt ? { ...record, adminStatus: select.value } : record); writeStorageJSON('sc_plan_interests', updated); renderPlanInterests(); });
            statusCell.appendChild(select); row.appendChild(statusCell); planInterestTable.appendChild(row);
        });
    }

    renderAdminTable();
    renderUsers();
    renderPqrs();
    renderOrders();
    renderPlanInterests();
});
