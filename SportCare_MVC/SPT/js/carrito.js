// Catálogo y carrito de Sports Care: productos y pedidos proceden de la API Java.
let productos = [];
let carrito = {};
let temporizador;
try {
  const guardado = JSON.parse(localStorage.getItem('sc_store_cart') || '{}');
  if (guardado && typeof guardado === 'object' && !Array.isArray(guardado)) carrito = guardado;
} catch { carrito = {}; }

async function storeApi(url, options = {}) {
  const config = { method: options.method || 'GET', credentials: 'same-origin', headers: {} };
  if (options.body !== undefined) { config.headers['Content-Type'] = 'application/json'; config.body = JSON.stringify(options.body); }
  const response = await fetch(url, config);
  const raw = await response.text(); let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { error: raw }; }
  if (!response.ok) throw new Error(data?.error || `Error HTTP ${response.status}`);
  return data;
}
function formatearPrecio(valor) { return '$' + Number(valor || 0).toLocaleString('es-CO') + ' COP'; }
function contarProductos() { return productos.reduce((sum, p) => sum + (Number(carrito[p.id]) || 0), 0); }
function calcularTotal() { return productos.reduce((sum, p) => sum + Number(p.price || 0) * (Number(carrito[p.id]) || 0), 0); }
function mostrarMensaje(texto) {
  const toast = document.getElementById('toast'); if (!toast) return;
  toast.textContent = texto; toast.className = 'toast show'; clearTimeout(temporizador);
  temporizador = setTimeout(() => { toast.className = 'toast'; }, 2600);
}
function mostrarProductos() {
  const grid = document.getElementById('product-grid'); if (!grid) return;
  grid.innerHTML = '';
  productos.forEach(p => {
    const card = document.createElement('article'); card.className = 'product-card';
    const visual = document.createElement('div'); visual.className = 'product-visual';
    const cat = document.createElement('span'); cat.className = 'product-category'; cat.textContent = p.category || 'Producto';
    const img = document.createElement('img'); img.className = 'product-img'; img.src = p.image || 'img/logo.jpeg'; img.alt = p.name; img.loading = 'lazy';
    img.onerror = () => { img.onerror = null; img.alt = `${p.name} (ilustración no disponible)`; img.src = 'img/logo.jpeg'; };
    visual.append(cat, img);
    const body = document.createElement('div'); body.className = 'product-body';
    const title = document.createElement('h3'); title.textContent = p.name;
    const desc = document.createElement('p'); desc.textContent = p.description || '';
    const footer = document.createElement('div'); footer.className = 'product-footer';
    const price = document.createElement('span'); price.className = 'product-price'; price.textContent = formatearPrecio(p.price);
    const add = document.createElement('button'); add.type = 'button'; add.className = 'btn btn-primary add-btn'; add.textContent = '+ Agregar'; add.addEventListener('click', () => agregar(p.id));
    footer.append(price, add); body.append(title, desc, footer); card.append(visual, body); grid.appendChild(card);
  });
}
function persistirCarrito() { localStorage.setItem('sc_store_cart', JSON.stringify(carrito)); }
function mostrarCarrito() {
  const itemsNode = document.getElementById('cart-items'); if (!itemsNode) return;
  itemsNode.innerHTML = '';
  productos.forEach(p => {
    const units = Number(carrito[p.id]) || 0; if (units < 1) return;
    const item = document.createElement('div'); item.className = 'cart-item';
    const icon = document.createElement('div'); icon.className = 'cart-item-icon';
    const img = document.createElement('img'); img.src = p.image || 'img/logo.jpeg'; img.alt = p.name; img.onerror = () => { img.onerror = null; img.src = 'img/logo.jpeg'; }; icon.appendChild(img);
    const info = document.createElement('div'); info.className = 'cart-item-info';
    const name = document.createElement('strong'); name.textContent = p.name;
    const total = document.createElement('small'); total.textContent = formatearPrecio(Number(p.price) * units); info.append(name, total);
    const quantity = document.createElement('div'); quantity.className = 'quantity-controls';
    const minus = document.createElement('button'); minus.type = 'button'; minus.className = 'qty-btn'; minus.textContent = '−'; minus.setAttribute('aria-label', `Quitar una unidad de ${p.name}`); minus.addEventListener('click', () => cambiar(p.id, -1));
    const count = document.createElement('span'); count.textContent = String(units);
    const plus = document.createElement('button'); plus.type = 'button'; plus.className = 'qty-btn'; plus.textContent = '+'; plus.setAttribute('aria-label', `Agregar una unidad de ${p.name}`); plus.addEventListener('click', () => cambiar(p.id, 1));
    quantity.append(minus, count, plus);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-btn'; remove.textContent = 'Eliminar'; remove.addEventListener('click', () => eliminar(p.id));
    item.append(icon, info, quantity, remove); itemsNode.appendChild(item);
  });
  const count = contarProductos();
  ['cart-count', 'cart-badge', 'summary-count'].forEach(id => { const node = document.getElementById(id); if (node) node.textContent = String(count); });
  const total = document.getElementById('cart-total'); if (total) total.textContent = formatearPrecio(calcularTotal());
  const empty = document.getElementById('empty-cart'); if (empty) empty.style.display = count === 0 ? 'block' : 'none';
  const checkout = document.getElementById('checkout-btn'); if (checkout) checkout.disabled = count === 0;
  const clear = document.getElementById('clear-btn'); if (clear) clear.style.visibility = count === 0 ? 'hidden' : 'visible';
  persistirCarrito();
}
function agregar(id) { carrito[id] = (Number(carrito[id]) || 0) + 1; mostrarCarrito(); mostrarMensaje('Producto agregado al carrito.'); }
function cambiar(id, change) { carrito[id] = (Number(carrito[id]) || 0) + change; if (carrito[id] <= 0) delete carrito[id]; mostrarCarrito(); }
function eliminar(id) { delete carrito[id]; mostrarCarrito(); mostrarMensaje('Producto eliminado del carrito.'); }
function vaciar() { carrito = {}; mostrarCarrito(); mostrarMensaje('Carrito vaciado.'); }
function abrirPago() {
  if (!contarProductos()) return;
  const summary = document.getElementById('pago-resumen'); if (!summary) return;
  summary.innerHTML = '';
  productos.forEach(p => { const qty = Number(carrito[p.id]) || 0; if (!qty) return; const row = document.createElement('div'); row.className = 'pago-linea'; const name = document.createElement('span'); name.textContent = `${qty} × ${p.name}`; const price = document.createElement('strong'); price.textContent = formatearPrecio(qty * Number(p.price)); row.append(name, price); summary.appendChild(row); });
  const total = document.getElementById('pago-total'); if (total) total.textContent = formatearPrecio(calcularTotal());
  document.getElementById('pago-form-area').style.display = 'block'; document.getElementById('pago-exito').style.display = 'none'; cambiarMetodo(); document.getElementById('pago-modal').style.display = 'grid';
}
function cerrarPago() { const modal = document.getElementById('pago-modal'); if (modal) modal.style.display = 'none'; }
function cambiarMetodo() {
  const method = document.getElementById('metodo'); const note = document.getElementById('nota-metodo'); if (!method || !note) return;
  const messages = { 'simulacion': 'Esta opción solo muestra el flujo de una compra de prueba. No hay pasarela de pagos conectada.', 'pse-simulado': 'PSE se presenta únicamente como ejemplo de interfaz; no se solicitarán datos bancarios.', 'contraentrega-demo': 'La opción de contraentrega es una demostración, no genera un envío real.' };
  note.textContent = messages[method.value] || 'Compra de demostración sin cobro real.';
}
async function pagar() {
  const form = document.getElementById('form-pago'); if (!form || !form.reportValidity()) return false;
  const buyerName = form.querySelector('[name="buyerName"]').value.trim();
  const buyerEmail = form.querySelector('[name="buyerEmail"]').value.trim().toLowerCase();
  const address = form.querySelector('[name="address"]').value.trim();
  const methodSelect = document.getElementById('metodo');
  const items = productos.filter(p => Number(carrito[p.id]) > 0).map(p => ({ productId: p.id, quantity: Number(carrito[p.id]) }));
  const submit = form.querySelector('[type="submit"]'); if (submit) submit.disabled = true;
  try {
    const order = await storeApi('/api/orders', { method: 'POST', body: { buyerName, buyerEmail, address, method: methodSelect.options[methodSelect.selectedIndex].text, items } });
    document.getElementById('exito-pedido').textContent = order.id;
    document.getElementById('exito-metodo').textContent = order.method;
    document.getElementById('exito-total').textContent = formatearPrecio(order.total);
    document.getElementById('pago-form-area').style.display = 'none'; document.getElementById('pago-exito').style.display = 'block';
    form.reset(); carrito = {}; mostrarCarrito();
  } catch (error) { mostrarMensaje(error.message); }
  finally { if (submit) submit.disabled = false; }
  return false;
}
window.agregar = agregar; window.cambiar = cambiar; window.eliminar = eliminar; window.vaciar = vaciar;
window.abrirPago = abrirPago; window.cerrarPago = cerrarPago; window.cambiarMetodo = cambiarMetodo; window.pagar = pagar;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    productos = await storeApi('/api/products');
    // Los productos eliminados del catálogo se descartan del carrito del navegador.
    const validIds = new Set(productos.map(p => String(p.id)));
    Object.keys(carrito).forEach(id => { if (!validIds.has(String(id))) delete carrito[id]; });
    mostrarProductos(); mostrarCarrito();
  } catch (error) { mostrarMensaje(error.message); }
  document.getElementById('form-pago')?.addEventListener('submit', event => { event.preventDefault(); pagar(); });
  const modal = document.getElementById('pago-modal'); modal?.addEventListener('click', event => { if (event.target === modal) cerrarPago(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') cerrarPago(); });
});
