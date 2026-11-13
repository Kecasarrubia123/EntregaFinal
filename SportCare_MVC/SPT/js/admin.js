document.addEventListener('DOMContentLoaded', async () => {
    let adminUser;
    try {
        const session = await apiRequest('/api/auth/me');
        adminUser = session.user;
        if (adminUser.role !== 'ADMINISTRADOR') { window.location.href = 'dashboard.html'; return; }
    } catch { window.location.href = 'index.html?modal=login'; return; }

    const welcome = document.getElementById('adminWelcomeText');
    if (welcome) welcome.textContent = `Administrador: ${adminUser.name}`;
    document.getElementById('adminLogoutBtn')?.addEventListener('click', logout);

    const sectionLinks = document.querySelectorAll('.sidebar-link[data-admin-target]');
    const adminSections = document.querySelectorAll('.admin-section');
    sectionLinks.forEach(link => link.addEventListener('click', () => {
        sectionLinks.forEach(item => item.classList.toggle('active', item === link));
        adminSections.forEach(section => { section.style.display = section.id === link.dataset.adminTarget ? 'block' : 'none'; });
    }));

    const makeCell = (value, tag = 'td') => { const cell = document.createElement(tag); cell.textContent = value ?? ''; return cell; };
    const formatCOP = value => '$' + Number(value || 0).toLocaleString('es-CO') + ' COP';
    let exercises = [], users = [], tickets = [], orders = [], interests = [];

    // CRUD real de ejercicios. DELETE desactiva el ejercicio para mantener intactos sus registros históricos.
    const exerciseTable = document.getElementById('adminExerciseTable');
    const adminSearch = document.getElementById('adminSearch');
    const exerciseModal = document.getElementById('exerciseModal');
    const exerciseForm = document.getElementById('exerciseForm');
    const formError = document.getElementById('adminFormError');

    function renderAdminTable() {
        if (!exerciseTable) return;
        const query = (adminSearch?.value || '').trim().toLocaleLowerCase('es');
        const filtered = exercises.filter(ex => [ex.name, ex.code, ex.category].some(v => String(v || '').toLocaleLowerCase('es').includes(query)));
        exerciseTable.innerHTML = '';
        if (!filtered.length) {
            const row = document.createElement('tr'); const cell = makeCell(exercises.length ? 'No se encontraron ejercicios con esa búsqueda.' : 'No hay ejercicios registrados.');
            cell.colSpan = 6; cell.className = 'empty-cell'; row.appendChild(cell); exerciseTable.appendChild(row); return;
        }
        filtered.forEach(ex => {
            const row = document.createElement('tr');
            row.append(makeCell(ex.code), makeCell(ex.name), makeCell(ex.category), makeCell(ex.level), makeCell(`${ex.duration} / ${ex.series} series`));
            const actions = document.createElement('td');
            const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'btn btn-outline btn-sm'; edit.textContent = 'Editar';
            edit.addEventListener('click', () => openEditModal(ex.code));
            const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-danger btn-sm'; remove.textContent = 'Eliminar';
            remove.addEventListener('click', () => deleteExercise(ex.code));
            actions.append(edit, document.createTextNode(' '), remove); row.appendChild(actions); exerciseTable.appendChild(row);
        });
    }
    async function loadExercises() { exercises = await apiRequest('/api/exercises'); renderAdminTable(); }
    adminSearch?.addEventListener('input', renderAdminTable);

    function openCreateModal() {
        exerciseForm.reset(); document.getElementById('modalTitle').textContent = 'Registrar nuevo ejercicio';
        document.getElementById('editIndex').value = ''; document.getElementById('exCode').disabled = false;
        if (formError) formError.textContent = ''; exerciseModal.style.display = 'flex';
    }
    function openEditModal(code) {
        const ex = exercises.find(item => item.code === code); if (!ex) return;
        exerciseForm.reset(); document.getElementById('modalTitle').textContent = 'Editar ejercicio';
        document.getElementById('editIndex').value = ex.code; document.getElementById('exCode').value = ex.code; document.getElementById('exCode').disabled = true;
        document.getElementById('exName').value = ex.name; document.getElementById('exCategory').value = ex.category;
        document.getElementById('exLevel').value = ex.level; document.getElementById('exDuration').value = ex.duration;
        document.getElementById('exSeries').value = ex.series; document.getElementById('exImage').value = ex.image || '';
        document.getElementById('exDesc').value = ex.description; if (formError) formError.textContent = '';
        exerciseModal.style.display = 'flex';
    }
    document.getElementById('openCreateModalBtn')?.addEventListener('click', openCreateModal);
    document.getElementById('closeExerciseModal')?.addEventListener('click', () => { exerciseModal.style.display = 'none'; });
    window.addEventListener('click', event => { if (event.target === exerciseModal) exerciseModal.style.display = 'none'; });

    exerciseForm?.addEventListener('submit', async event => {
        event.preventDefault(); if (formError) formError.textContent = '';
        const code = document.getElementById('exCode').value.trim().toUpperCase();
        const payload = {
            code,
            name: document.getElementById('exName').value.trim(),
            category: document.getElementById('exCategory').value,
            level: document.getElementById('exLevel').value,
            duration: document.getElementById('exDuration').value.trim(),
            series: Number(document.getElementById('exSeries').value),
            image: document.getElementById('exImage').value.trim(),
            description: document.getElementById('exDesc').value.trim()
        };
        const editCode = document.getElementById('editIndex').value;
        if (!payload.code || !payload.name || !payload.duration || !payload.description) { formError.textContent = 'Completa todos los campos obligatorios.'; return; }
        if (!Number.isInteger(payload.series) || payload.series < 1 || payload.series > 10) { formError.textContent = 'El número de series debe estar entre 1 y 10.'; return; }
        if (payload.image && !/^https?:\/\//i.test(payload.image) && !/^img\//i.test(payload.image)) { formError.textContent = 'La imagen debe tener una URL http(s) válida o una ruta local dentro de img/.'; return; }
        try {
            if (editCode) await apiRequest(`/api/exercises/${encodeURIComponent(editCode)}`, { method: 'PUT', body: payload });
            else await apiRequest('/api/exercises', { method: 'POST', body: payload });
            exerciseModal.style.display = 'none'; await loadExercises(); alert(editCode ? 'Ejercicio actualizado correctamente.' : 'Ejercicio registrado correctamente.');
        } catch (error) { if (formError) formError.textContent = error.message; }
    });
    async function deleteExercise(code) {
        const ex = exercises.find(item => item.code === code);
        if (!ex || !confirm(`¿Quieres eliminar el ejercicio "${ex.name}"?`)) return;
        try { await apiRequest(`/api/exercises/${encodeURIComponent(code)}`, { method: 'DELETE' }); await loadExercises(); }
        catch (error) { alert(error.message); }
    }

    // Gestión de usuarios registrados en usuarios / roles.
    const userTable = document.getElementById('adminUserTable');
    const userSearch = document.getElementById('adminUserSearch');
    function renderUsers() {
        if (!userTable) return;
        const query = (userSearch?.value || '').trim().toLocaleLowerCase('es');
        const filtered = users.filter(u => `${u.name || ''} ${u.email || ''}`.toLocaleLowerCase('es').includes(query));
        userTable.innerHTML = '';
        if (!filtered.length) { const row = document.createElement('tr'); const cell = makeCell('No se encontraron usuarios.'); cell.colSpan = 5; cell.className = 'empty-cell'; row.appendChild(cell); userTable.appendChild(row); return; }
        filtered.forEach(user => {
            const row = document.createElement('tr');
            row.append(makeCell(user.name), makeCell(user.email), makeCell(user.role === 'ADMINISTRADOR' ? 'Administrador' : 'Usuario'), makeCell(user.active ? 'Activo' : 'Inactivo'));
            const actions = document.createElement('td');
            const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'btn btn-outline btn-sm'; edit.textContent = 'Editar nombre';
            edit.addEventListener('click', async () => {
                const newName = prompt('Escribe el nuevo nombre visible:', user.name || ''); if (newName === null) return;
                if (!newName.trim()) { alert('El nombre no puede quedar vacío.'); return; }
                try { await apiRequest(`/api/users/${user.id}/name`, { method: 'PUT', body: { name: newName.trim() } }); await loadUsers(); }
                catch (error) { alert(error.message); }
            });
            actions.appendChild(edit);
            if (user.role !== 'ADMINISTRADOR') {
                const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'btn btn-sm ' + (user.active ? 'btn-danger' : 'btn-solid');
                toggle.textContent = user.active ? 'Desactivar' : 'Activar'; toggle.style.marginLeft = '6px';
                toggle.addEventListener('click', async () => {
                    if (!confirm(`${user.active ? '¿Desactivar' : '¿Activar'} la cuenta de ${user.name}?`)) return;
                    try { await apiRequest(`/api/users/${user.id}/status`, { method: 'PUT', body: { active: !user.active } }); await loadUsers(); }
                    catch (error) { alert(error.message); }
                });
                actions.appendChild(toggle);
            }
            row.appendChild(actions); userTable.appendChild(row);
        });
    }
    async function loadUsers() { users = await apiRequest('/api/users'); renderUsers(); }
    userSearch?.addEventListener('input', renderUsers);

    // PQRS: estados y respuestas quedan guardados en la tabla pqrs.
    const pqrsTable = document.getElementById('adminPqrsTable');
    const pqrsSearch = document.getElementById('adminPqrsSearch');
    const pqrsStatuses = ['Recibida', 'En revisión', 'Respondida', 'Cerrada'];
    function renderPqrs() {
        if (!pqrsTable) return;
        const query = (pqrsSearch?.value || '').trim().toLocaleLowerCase('es');
        const filtered = tickets.filter(item => [item.id, item.name, item.email, item.type, item.area, item.subject, item.message].some(v => String(v || '').toLocaleLowerCase('es').includes(query)));
        pqrsTable.innerHTML = '';
        if (!filtered.length) { const row = document.createElement('tr'); const cell = makeCell(tickets.length ? 'No hay solicitudes que coincidan con la búsqueda.' : 'Todavía no se han recibido solicitudes.'); cell.colSpan = 5; cell.className = 'empty-cell'; row.appendChild(cell); pqrsTable.appendChild(row); return; }
        filtered.forEach(item => {
            const row = document.createElement('tr');
            const ticketCell = document.createElement('td'); const code = document.createElement('strong'); code.textContent = item.id || 'Sin código';
            const date = document.createElement('small'); date.className = 'admin-subtext'; date.textContent = item.createdAt ? new Date(item.createdAt).toLocaleString('es-CO') : 'Fecha no disponible';
            ticketCell.append(code, document.createElement('br'), date); row.appendChild(ticketCell);
            const contact = document.createElement('td'); const name = document.createElement('strong'); name.textContent = item.name || 'Sin nombre';
            const email = document.createElement('small'); email.className = 'admin-subtext'; email.textContent = item.email || 'Sin correo';
            contact.append(name, document.createElement('br'), email); row.appendChild(contact);
            const typeCell = document.createElement('td'); const type = document.createElement('span'); type.className = 'badge'; type.textContent = item.type || 'Solicitud';
            const area = document.createElement('small'); area.className = 'admin-subtext'; area.textContent = item.area || 'General';
            typeCell.append(type, document.createElement('br'), area); row.appendChild(typeCell);
            const messageCell = document.createElement('td'); const subject = document.createElement('strong'); subject.textContent = item.subject || 'Sin asunto';
            const details = document.createElement('details'); details.className = 'admin-details'; const summary = document.createElement('summary'); summary.textContent = 'Leer mensaje';
            const body = document.createElement('p'); body.textContent = item.message || ''; details.append(summary, body);
            if (item.response) { const response = document.createElement('p'); response.className = 'pqrs-admin-response'; response.textContent = `Respuesta: ${item.response}`; details.appendChild(response); }
            messageCell.append(subject, details); row.appendChild(messageCell);
            const statusCell = document.createElement('td'); const select = document.createElement('select'); select.className = 'status-select'; select.setAttribute('aria-label', `Estado de ${item.id}`);
            pqrsStatuses.forEach(status => { const option = document.createElement('option'); option.value = status; option.textContent = status; select.appendChild(option); });
            select.value = pqrsStatuses.includes(item.status) ? item.status : 'Recibida';
            select.addEventListener('change', async () => {
                try { await apiRequest(`/api/admin/pqrs/${encodeURIComponent(item.id)}/status`, { method: 'PUT', body: { status: select.value } }); await loadPqrs(); }
                catch (error) { alert(error.message); }
            });
            const reply = document.createElement('button'); reply.type = 'button'; reply.className = 'btn btn-outline btn-sm admin-reply-btn'; reply.textContent = item.response ? 'Editar respuesta' : 'Responder';
            reply.addEventListener('click', async () => {
                const text = prompt(`Respuesta para ${item.id}:`, item.response || ''); if (text === null) return;
                try { await apiRequest(`/api/admin/pqrs/${encodeURIComponent(item.id)}/response`, { method: 'PUT', body: { response: text.trim() } }); await loadPqrs(); }
                catch (error) { alert(error.message); }
            });
            statusCell.append(select, document.createElement('br'), reply); row.appendChild(statusCell); pqrsTable.appendChild(row);
        });
    }
    async function loadPqrs() { tickets = await apiRequest('/api/admin/pqrs'); renderPqrs(); }
    pqrsSearch?.addEventListener('input', renderPqrs);

    // Pedidos de demostración almacenados en pedidos / pedido_detalles (sin cobros ni envíos reales).
    const ordersTable = document.getElementById('adminOrdersTable');
    const orderStatuses = ['Pedido simulado', 'En preparación (demo)', 'Entregado (demo)', 'Cancelado (demo)'];
    function renderOrders() {
        if (!ordersTable) return;
        ordersTable.innerHTML = '';
        if (!orders.length) { const row = document.createElement('tr'); const cell = makeCell('No hay pedidos simulados todavía.'); cell.colSpan = 6; cell.className = 'empty-cell'; row.appendChild(cell); ordersTable.appendChild(row); return; }
        orders.forEach(order => {
            const row = document.createElement('tr'); row.append(makeCell(order.id), makeCell(order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO') : 'Sin fecha'));
            const buyer = document.createElement('td'); const buyerName = document.createElement('strong'); buyerName.textContent = order.buyerName || 'Cliente';
            const buyerEmail = document.createElement('small'); buyerEmail.className = 'admin-subtext'; buyerEmail.textContent = order.buyerEmail || '';
            buyer.append(buyerName, document.createElement('br'), buyerEmail); row.appendChild(buyer);
            const items = document.createElement('td'); items.textContent = Array.isArray(order.items) ? order.items.map(i => `${i.quantity} × ${i.name}`).join(', ') : 'Detalle no disponible'; row.appendChild(items);
            row.appendChild(makeCell(formatCOP(order.total)));
            const statusCell = document.createElement('td'); const select = document.createElement('select'); select.className = 'status-select';
            orderStatuses.forEach(status => { const option = document.createElement('option'); option.value = status; option.textContent = status; select.appendChild(option); });
            select.value = orderStatuses.includes(order.status) ? order.status : 'Pedido simulado';
            select.addEventListener('change', async () => {
                try { await apiRequest(`/api/admin/orders/${encodeURIComponent(order.id)}/status`, { method: 'PUT', body: { status: select.value } }); await loadOrders(); }
                catch (error) { alert(error.message); }
            });
            statusCell.appendChild(select); row.appendChild(statusCell); ordersTable.appendChild(row);
        });
    }
    async function loadOrders() { orders = await apiRequest('/api/admin/orders'); renderOrders(); }

    // Seguimiento de intereses en planes propuestos; no activa suscripciones.
    const planInterestTable = document.getElementById('adminPlanInterestTable');
    const planInterestStatuses = ['Interés registrado', 'Contactado (demo)', 'Cerrado (demo)'];
    function renderPlanInterests() {
        if (!planInterestTable) return;
        planInterestTable.innerHTML = '';
        if (!interests.length) { const row = document.createElement('tr'); const cell = makeCell('Todavía no hay intereses registrados desde la página de planes.'); cell.colSpan = 5; cell.className = 'empty-cell'; row.appendChild(cell); planInterestTable.appendChild(row); return; }
        interests.forEach(item => {
            const row = document.createElement('tr');
            row.append(makeCell(item.selectedAt ? new Date(item.selectedAt).toLocaleString('es-CO') : 'Sin fecha'), makeCell(item.name), makeCell(item.email), makeCell(formatCOP(item.price) + (item.unit === 'COP/mes' ? ' / mes' : '')));
            const statusCell = document.createElement('td'); const select = document.createElement('select'); select.className = 'status-select';
            planInterestStatuses.forEach(status => { const option = document.createElement('option'); option.value = status; option.textContent = status; select.appendChild(option); });
            select.value = planInterestStatuses.includes(item.adminStatus) ? item.adminStatus : 'Interés registrado';
            select.addEventListener('change', async () => {
                try { await apiRequest(`/api/admin/plan-interests/${item.id}/status`, { method: 'PUT', body: { status: select.value } }); await loadInterests(); }
                catch (error) { alert(error.message); }
            });
            statusCell.appendChild(select); row.appendChild(statusCell); planInterestTable.appendChild(row);
        });
    }
    async function loadInterests() { interests = await apiRequest('/api/admin/plan-interests'); renderPlanInterests(); }

    try {
        await Promise.all([loadExercises(), loadUsers(), loadPqrs(), loadOrders(), loadInterests()]);
    } catch (error) {
        alert(`No se pudieron cargar todos los datos administrativos: ${error.message}`);
    }
});
