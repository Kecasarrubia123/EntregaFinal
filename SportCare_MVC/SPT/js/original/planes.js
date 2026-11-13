document.addEventListener('DOMContentLoaded', () => {
  const message = document.getElementById('planMessage');
  const readJSON = (key, fallback) => {
    try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
    catch { return fallback; }
  };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const plans = {
    demo: { id: 'demo', name: 'Plan de demostración', price: 0, unit: 'COP', status: 'Seleccionado para demostración' },
    individual: { id: 'individual', name: 'Plan Individual', price: 29900, unit: 'COP/mes', status: 'Interés registrado; plan futuro' },
    institucional: { id: 'institucional', name: 'Plan para instituciones', price: 249000, unit: 'COP/mes', status: 'Interés registrado; plan futuro' }
  };
  function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('is-error', isError);
    message.classList.add('visible');
  }
  document.querySelectorAll('.plan-select').forEach(button => {
    button.addEventListener('click', () => {
      const plan = plans[button.dataset.plan];
      if (!plan) return;
      const currentUser = readJSON('sc_current_user', null);
      const selections = readJSON('sc_plan_selections', {});
      const selection = { ...plan, selectedAt: new Date().toISOString(), email: currentUser?.email || '' };
      const selectionKey = currentUser?.email || 'guest';
      selections[selectionKey] = selection;
      writeJSON('sc_plan_selections', selections);
      if (plan.id !== 'demo') {
        const interests = readJSON('sc_plan_interests', []);
        interests.push({ ...selection, id: `PLAN-${Date.now().toString().slice(-7)}` });
        writeJSON('sc_plan_interests', interests);
        showMessage(`${plan.name}: registramos tu interés en este navegador. Este plan es una propuesta futura; no se activa una suscripción ni se realiza ningún cobro. Para dejar una pregunta, visita Quejas y reclamos.`, false);
      } else {
        showMessage('Seleccionaste el plan de demostración. Puedes explorar el catálogo y registrar actividades; no se realiza ningún cobro.', false);
      }
    });
  });
});
