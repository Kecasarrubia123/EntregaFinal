document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('pqrsForm');
  const error = document.getElementById('pqrsError');
  const success = document.getElementById('pqrsSuccess');
  const lookupForm = document.getElementById('pqrsLookupForm');
  const lookupEmail = document.getElementById('lookupEmail');
  const historyBox = document.getElementById('pqrsHistory');
  const nameInput = document.getElementById('pqrsName');
  const emailInput = document.getElementById('pqrsEmail');
  let currentUser = null;
  try { currentUser = (await apiRequest('/api/auth/me')).user; } catch { /* El formulario también admite visitantes. */ }
  if (currentUser) {
    if (nameInput && !nameInput.value) nameInput.value = currentUser.name || '';
    if (emailInput && !emailInput.value) emailInput.value = currentUser.email || '';
    if (lookupEmail && !lookupEmail.value) lookupEmail.value = currentUser.email || '';
  }

  if (form) form.addEventListener('submit', async event => {
    event.preventDefault();
    if (error) error.textContent = '';
    if (success) { success.hidden = true; success.textContent = ''; }
    const ticket = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      type: document.getElementById('pqrsType').value,
      area: document.getElementById('pqrsArea').value,
      subject: document.getElementById('pqrsSubject').value.trim(),
      message: document.getElementById('pqrsMessage').value.trim()
    };
    if (!ticket.name || !ticket.email || !ticket.type || !ticket.area || !ticket.subject || ticket.message.length < 10) {
      if (error) error.textContent = 'Completa todos los campos. La descripción debe tener al menos 10 caracteres.';
      return;
    }
    try {
      const saved = await apiRequest('/api/pqrs', { method: 'POST', body: ticket });
      if (success) {
        success.hidden = false; success.innerHTML = '';
        const title = document.createElement('strong'); title.textContent = 'Solicitud registrada.';
        const text = document.createElement('p'); text.textContent = `Tu código de seguimiento es ${saved.id}. Guárdalo para identificar la solicitud. Esta es una confirmación del prototipo académico.`;
        success.append(title, text);
      }
      if (lookupEmail) lookupEmail.value = ticket.email;
      await renderHistory(ticket.email);
      form.reset();
      if (currentUser) { nameInput.value = currentUser.name || ''; emailInput.value = currentUser.email || ''; }
    } catch (err) { if (error) error.textContent = err.message; }
  });

  async function renderHistory(email) {
    if (!historyBox) return;
    historyBox.textContent = '';
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) { historyBox.textContent = 'Escribe un correo electrónico para consultar.'; return; }
    try {
      const found = await apiRequest(`/api/pqrs?email=${encodeURIComponent(cleanEmail)}`);
      if (!found.length) { historyBox.textContent = 'No hay solicitudes registradas para ese correo.'; return; }
      found.forEach(ticket => {
        const card = document.createElement('article'); card.className = 'pqrs-history-item';
        const title = document.createElement('strong'); title.textContent = `${ticket.id} · ${ticket.type}`;
        const subject = document.createElement('p'); subject.textContent = ticket.subject;
        const status = document.createElement('span'); status.className = 'pqrs-status'; status.textContent = `Estado: ${ticket.status || 'Recibida'}`;
        const date = document.createElement('small'); date.textContent = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('es-CO') : '';
        card.append(title, subject, status, date);
        if (ticket.response) { const response = document.createElement('p'); response.className = 'pqrs-admin-response'; response.textContent = `Respuesta: ${ticket.response}`; card.appendChild(response); }
        historyBox.appendChild(card);
      });
    } catch (err) { historyBox.textContent = err.message; }
  }
  lookupForm?.addEventListener('submit', event => { event.preventDefault(); renderHistory(lookupEmail.value); });
  if (lookupEmail?.value) await renderHistory(lookupEmail.value);
});
