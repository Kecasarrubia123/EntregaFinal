document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('pqrsForm');
  const error = document.getElementById('pqrsError');
  const success = document.getElementById('pqrsSuccess');
  const lookupForm = document.getElementById('pqrsLookupForm');
  const lookupEmail = document.getElementById('lookupEmail');
  const historyBox = document.getElementById('pqrsHistory');
  const readJSON = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const currentUser = readJSON('sc_current_user', null);
  const nameInput = document.getElementById('pqrsName');
  const emailInput = document.getElementById('pqrsEmail');
  if (currentUser) {
    if (nameInput && !nameInput.value) nameInput.value = currentUser.name || '';
    if (emailInput && !emailInput.value) emailInput.value = currentUser.email || '';
    if (lookupEmail && !lookupEmail.value) lookupEmail.value = currentUser.email || '';
  }
  function getTickets() {
    const value = readJSON('sc_pqrs', []);
    return Array.isArray(value) ? value : [];
  }
  function ticketCode() {
    return `SC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    if (error) error.textContent = '';
    if (success) { success.hidden = true; success.textContent = ''; }
    const ticket = {
      id: ticketCode(),
      createdAt: new Date().toISOString(),
      name: nameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      type: document.getElementById('pqrsType').value,
      area: document.getElementById('pqrsArea').value,
      subject: document.getElementById('pqrsSubject').value.trim(),
      message: document.getElementById('pqrsMessage').value.trim(),
      status: 'Recibida',
      response: '',
      userEmail: currentUser?.email || ''
    };
    if (!ticket.name || !ticket.email || !ticket.type || !ticket.area || !ticket.subject || ticket.message.length < 10) {
      if (error) error.textContent = 'Completa todos los campos. La descripción debe tener al menos 10 caracteres.';
      return;
    }
    const tickets = getTickets();
    tickets.unshift(ticket);
    writeJSON('sc_pqrs', tickets);
    if (success) {
      success.hidden = false;
      success.innerHTML = '';
      const title = document.createElement('strong'); title.textContent = 'Solicitud registrada.';
      const text = document.createElement('p'); text.textContent = `Tu código de seguimiento es ${ticket.id}. Guárdalo para identificar la solicitud. Esta es una confirmación del prototipo académico.`;
      success.append(title, text);
    }
    if (lookupEmail) lookupEmail.value = ticket.email;
    renderHistory(ticket.email);
    form.reset();
    if (currentUser) { nameInput.value = currentUser.name || ''; emailInput.value = currentUser.email || ''; }
  });
  function renderHistory(email) {
    if (!historyBox) return;
    historyBox.textContent = '';
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) { historyBox.textContent = 'Escribe un correo electrónico para consultar.'; return; }
    const found = getTickets().filter(ticket => String(ticket.email || '').toLowerCase() === cleanEmail);
    if (!found.length) { historyBox.textContent = 'No hay solicitudes guardadas para ese correo en este navegador.'; return; }
    found.forEach(ticket => {
      const card = document.createElement('article'); card.className = 'pqrs-history-item';
      const title = document.createElement('strong'); title.textContent = `${ticket.id} · ${ticket.type}`;
      const subject = document.createElement('p'); subject.textContent = ticket.subject;
      const status = document.createElement('span'); status.className = 'pqrs-status'; status.textContent = `Estado: ${ticket.status || 'Recibida'}`;
      const date = document.createElement('small'); date.textContent = new Date(ticket.createdAt).toLocaleString('es-CO');
      card.append(title, subject, status, date);
      if (ticket.response) { const response = document.createElement('p'); response.className = 'pqrs-admin-response'; response.textContent = `Respuesta: ${ticket.response}`; card.appendChild(response); }
      historyBox.appendChild(card);
    });
  }
  if (lookupForm) lookupForm.addEventListener('submit', event => { event.preventDefault(); renderHistory(lookupEmail.value); });
  if (lookupEmail?.value) renderHistory(lookupEmail.value);
});
