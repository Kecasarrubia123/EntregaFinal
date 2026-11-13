document.addEventListener('DOMContentLoaded', () => {
  const message = document.getElementById('planMessage');
  function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('is-error', isError);
    message.classList.add('visible');
  }

  document.querySelectorAll('.plan-select').forEach(button => {
    button.addEventListener('click', async () => {
      const planCode = String(button.dataset.plan || '').toUpperCase();
      if (planCode === 'DEMO') {
        showMessage('Seleccionaste el plan de demostración. Puedes explorar el catálogo y registrar actividades; no se realiza ningún cobro.');
        return;
      }
      let currentUser = null;
      try { currentUser = (await apiRequest('/api/auth/me')).user; } catch { /* La tabla admite intereses sin una cuenta registrada. */ }
      let guestData = {};
      if (!currentUser) {
        const name = prompt('Para registrar tu interés, escribe tu nombre:');
        if (!name || !name.trim()) return;
        const email = prompt('Escribe un correo electrónico de contacto:');
        if (!email || !email.trim()) return;
        guestData = { name: name.trim(), email: email.trim().toLowerCase() };
      }
      button.disabled = true;
      try {
        await apiRequest('/api/plan-interests', { method: 'POST', body: { planCode, ...guestData } });
        const planName = planCode === 'INDIVIDUAL' ? 'Plan Individual' : 'Plan para instituciones';
        showMessage(`${planName}: registramos tu interés en sports_care. Este plan es una propuesta futura; no se activa una suscripción ni se realiza ningún cobro. Para dejar una pregunta, visita Quejas y reclamos.`);
      } catch (error) { showMessage(error.message, true); }
      finally { button.disabled = false; }
    });
  });
});
