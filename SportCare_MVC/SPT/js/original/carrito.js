// Tienda de Sports Care. Todas las compras son simuladas y se guardan solo en este navegador.
const productos = [
  { id: 1, nombre: 'Proteína Whey', categoria: 'SUPLEMENTO', precio: 129900, imagen: 'img/tienda/whey.svg', descripcion: 'Producto de demostración para complementar el catálogo de la tienda.' },
  { id: 2, nombre: 'Creatina Monohidratada', categoria: 'SUPLEMENTO', precio: 74900, imagen: 'img/tienda/creatina.svg', descripcion: 'Suplemento mostrado como ejemplo del catálogo académico.' },
  { id: 3, nombre: 'Shaker Deportivo', categoria: 'ACCESORIO', precio: 29900, imagen: 'img/tienda/shaker.svg', descripcion: 'Mezclador práctico para llevar bebidas deportivas.' },
  { id: 4, nombre: 'Bandas de Resistencia', categoria: 'IMPLEMENTO', precio: 45900, imagen: 'img/tienda/bandas.svg', descripcion: 'Set de bandas para movilidad y entrenamiento funcional.' },
  { id: 5, nombre: 'Mancuernas 5 kg', categoria: 'IMPLEMENTO', precio: 89900, imagen: 'img/tienda/mancuernas.svg', descripcion: 'Par de mancuernas para ejercicios de fuerza.' },
  { id: 6, nombre: 'Colchoneta Fitness', categoria: 'IMPLEMENTO', precio: 69900, imagen: 'img/tienda/colchoneta.svg', descripcion: 'Superficie acolchada para estiramientos y movilidad.' },
  { id: 7, nombre: 'Cuerda para Saltar', categoria: 'IMPLEMENTO', precio: 34900, imagen: 'img/tienda/cuerda.svg', descripcion: 'Cuerda ajustable para cardio y coordinación.' },
  { id: 8, nombre: 'Guantes de Entrenamiento', categoria: 'ACCESORIO', precio: 54900, imagen: 'img/tienda/guantes.svg', descripcion: 'Guantes de agarre para sesiones de entrenamiento.' },
  { id: 9, nombre: 'Rodillo de Espuma', categoria: 'RECUPERACIÓN', precio: 59900, imagen: 'img/tienda/rodillo.svg', descripcion: 'Rodillo para complementar movilidad y recuperación.' },
  { id: 10, nombre: 'Botella Deportiva', categoria: 'ACCESORIO', precio: 39900, imagen: 'img/tienda/botella.svg', descripcion: 'Botella reutilizable para mantener la hidratación.' },
  { id: 11, nombre: 'Barra de Proteína', categoria: 'NUTRICIÓN', precio: 9900, imagen: 'img/tienda/barra.svg', descripcion: 'Barra de ejemplo para el catálogo de nutrición deportiva.' },
  { id: 12, nombre: 'Straps de Levantamiento', categoria: 'ACCESORIO', precio: 31900, imagen: 'img/tienda/straps.svg', descripcion: 'Correas de apoyo para ejercicios de tracción.' }
];
let carrito = {};
let temporizador;
try {
  const guardado = JSON.parse(localStorage.getItem('sc_store_cart') || '{}');
  if (guardado && typeof guardado === 'object' && !Array.isArray(guardado)) carrito = guardado;
} catch (error) { carrito = {}; }

function formatearPrecio(valor) { return '$' + Number(valor || 0).toLocaleString('es-CO') + ' COP'; }
function contarProductos() { return productos.reduce((suma, p) => suma + (Number(carrito[p.id]) || 0), 0); }
function calcularTotal() { return productos.reduce((suma, p) => suma + p.precio * (Number(carrito[p.id]) || 0), 0); }
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
    const cat = document.createElement('span'); cat.className = 'product-category'; cat.textContent = p.categoria;
    const img = document.createElement('img'); img.className = 'product-img'; img.src = p.imagen; img.alt = p.nombre; img.loading = 'lazy';
    img.onerror = () => { img.onerror = null; img.alt = `${p.nombre} (ilustración no disponible)`; img.src = 'img/logo.jpeg'; };
    visual.append(cat, img);
    const body = document.createElement('div'); body.className = 'product-body';
    const title = document.createElement('h3'); title.textContent = p.nombre;
    const desc = document.createElement('p'); desc.textContent = p.descripcion;
    const footer = document.createElement('div'); footer.className = 'product-footer';
    const price = document.createElement('span'); price.className = 'product-price'; price.textContent = formatearPrecio(p.precio);
    const add = document.createElement('button'); add.type = 'button'; add.className = 'btn btn-primary add-btn'; add.textContent = '+ Agregar'; add.addEventListener('click', () => agregar(p.id));
    footer.append(price, add); body.append(title, desc, footer); card.append(visual, body); grid.appendChild(card);
  });
}
function persistirCarrito() { localStorage.setItem('sc_store_cart', JSON.stringify(carrito)); }
function mostrarCarrito() {
  const itemsNode = document.getElementById('cart-items'); if (!itemsNode) return;
  itemsNode.innerHTML = '';
  productos.forEach(p => {
    const unidades = Number(carrito[p.id]) || 0; if (unidades < 1) return;
    const item = document.createElement('div'); item.className = 'cart-item';
    const icon = document.createElement('div'); icon.className = 'cart-item-icon';
    const img = document.createElement('img'); img.src = p.imagen; img.alt = p.nombre; img.onerror = () => { img.onerror = null; img.src = 'img/logo.jpeg'; }; icon.appendChild(img);
    const info = document.createElement('div'); info.className = 'cart-item-info';
    const name = document.createElement('strong'); name.textContent = p.nombre;
    const total = document.createElement('small'); total.textContent = formatearPrecio(p.precio * unidades); info.append(name, total);
    const quantity = document.createElement('div'); quantity.className = 'quantity-controls';
    const minus = document.createElement('button'); minus.type = 'button'; minus.className = 'qty-btn'; minus.textContent = '−'; minus.setAttribute('aria-label', `Quitar una unidad de ${p.nombre}`); minus.addEventListener('click', () => cambiar(p.id, -1));
    const count = document.createElement('span'); count.textContent = String(unidades);
    const plus = document.createElement('button'); plus.type = 'button'; plus.className = 'qty-btn'; plus.textContent = '+'; plus.setAttribute('aria-label', `Agregar una unidad de ${p.nombre}`); plus.addEventListener('click', () => cambiar(p.id, 1));
    quantity.append(minus, count, plus);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-btn'; remove.textContent = 'Eliminar'; remove.addEventListener('click', () => eliminar(p.id));
    item.append(icon, info, quantity, remove); itemsNode.appendChild(item);
  });
  const count = contarProductos();
  ['cart-count','cart-badge','summary-count'].forEach(id => { const node=document.getElementById(id); if(node) node.textContent=String(count); });
  const totalNode = document.getElementById('cart-total'); if(totalNode) totalNode.textContent = formatearPrecio(calcularTotal());
  const empty = document.getElementById('empty-cart'); if(empty) empty.style.display = count === 0 ? 'block' : 'none';
  const checkout = document.getElementById('checkout-btn'); if(checkout) checkout.disabled = count === 0;
  const clear = document.getElementById('clear-btn'); if(clear) clear.style.visibility = count === 0 ? 'hidden' : 'visible';
  persistirCarrito();
}
function agregar(id) { carrito[id] = (Number(carrito[id]) || 0) + 1; mostrarCarrito(); mostrarMensaje('Producto agregado al carrito.'); }
function cambiar(id, cambio) { carrito[id] = (Number(carrito[id]) || 0) + cambio; if (carrito[id] <= 0) delete carrito[id]; mostrarCarrito(); }
function eliminar(id) { delete carrito[id]; mostrarCarrito(); mostrarMensaje('Producto eliminado del carrito.'); }
function vaciar() { carrito = {}; mostrarCarrito(); mostrarMensaje('Carrito vaciado.'); }
function abrirPago() {
  if (!contarProductos()) return;
  const summary = document.getElementById('pago-resumen'); if (!summary) return;
  summary.innerHTML = '';
  productos.forEach(p => { const qty=Number(carrito[p.id])||0; if(!qty) return; const row=document.createElement('div'); row.className='pago-linea'; const name=document.createElement('span'); name.textContent=`${qty} × ${p.nombre}`; const price=document.createElement('strong'); price.textContent=formatearPrecio(qty*p.precio); row.append(name,price); summary.appendChild(row); });
  const totalNode=document.getElementById('pago-total'); if(totalNode) totalNode.textContent=formatearPrecio(calcularTotal());
  document.getElementById('pago-form-area').style.display='block'; document.getElementById('pago-exito').style.display='none'; cambiarMetodo(); document.getElementById('pago-modal').style.display='grid';
}
function cerrarPago() { const modal=document.getElementById('pago-modal'); if(modal) modal.style.display='none'; }
function cambiarMetodo() {
  const method=document.getElementById('metodo'); const note=document.getElementById('nota-metodo'); if(!method||!note) return;
  const messages={
    'simulacion':'Esta opción solo muestra el flujo de una compra de prueba. No hay pasarela de pagos conectada.',
    'pse-simulado':'PSE se presenta únicamente como ejemplo de interfaz; no se solicitarán datos bancarios.',
    'contraentrega-demo':'La opción de contraentrega es una demostración, no genera un envío real.'
  };
  note.textContent=messages[method.value] || 'Compra de demostración sin cobro real.';
}
function pagar() {
  const form=document.getElementById('form-pago'); if(!form) return false;
  if (!form.reportValidity()) return false;
  const buyerName=form.querySelector('[name="buyerName"]').value.trim();
  const buyerEmail=form.querySelector('[name="buyerEmail"]').value.trim().toLowerCase();
  const address=form.querySelector('[name="address"]').value.trim();
  const method=document.getElementById('metodo');
  const ordersRaw=localStorage.getItem('sc_store_orders'); let orders=[];
  try { orders=ordersRaw ? JSON.parse(ordersRaw) : []; } catch { orders=[]; }
  if(!Array.isArray(orders)) orders=[];
  const orderId='SC-T-'+Math.random().toString(36).slice(2,8).toUpperCase();
  const items=productos.filter(p=>Number(carrito[p.id])>0).map(p=>({id:p.id,name:p.nombre,price:p.precio,quantity:Number(carrito[p.id])}));
  const order={id:orderId,createdAt:new Date().toISOString(),buyerName,buyerEmail,address,method:method.options[method.selectedIndex].text,total:calcularTotal(),items,status:'Pedido simulado'};
  orders.push(order); localStorage.setItem('sc_store_orders',JSON.stringify(orders));
  document.getElementById('exito-pedido').textContent=orderId;
  document.getElementById('exito-metodo').textContent=order.method;
  document.getElementById('exito-total').textContent=formatearPrecio(order.total);
  document.getElementById('pago-form-area').style.display='none'; document.getElementById('pago-exito').style.display='block';
  form.reset(); carrito={}; mostrarCarrito(); return false;
}
window.agregar=agregar; window.cambiar=cambiar; window.eliminar=eliminar; window.vaciar=vaciar; window.abrirPago=abrirPago; window.cerrarPago=cerrarPago; window.cambiarMetodo=cambiarMetodo; window.pagar=pagar;
document.addEventListener('DOMContentLoaded', () => {
  mostrarProductos(); mostrarCarrito();
  document.getElementById('form-pago')?.addEventListener('submit', event => { event.preventDefault(); pagar(); });
  const modal=document.getElementById('pago-modal'); modal?.addEventListener('click', event => { if(event.target===modal) cerrarPago(); });
  document.addEventListener('keydown', event => { if(event.key==='Escape') cerrarPago(); });
});
