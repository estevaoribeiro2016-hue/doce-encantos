const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const BRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const BASE_PRODUCTS = [
  { id: 'brigadeiro', name: 'Brigadeiro', emoji: '🍫', price: 5, stock: 20, min: 8, desc: 'Clássica, cremosa e intensa. Perfeita para quem ama chocolate.' },
  { id: 'oreo', name: 'Oreo', emoji: '🖤', price: 5, stock: 20, min: 8, desc: 'Mais docinha, com biscoito preto e recheio branco crocante.' },
  { id: 'maracuja', name: 'Maracujá', emoji: '💛', price: 5, stock: 20, min: 8, desc: 'Equilibrada, com toque cítrico que combina muito com chocolate.' },
  { id: 'coco', name: 'Coco', emoji: '🥥', price: 5, stock: 20, min: 8, desc: 'Suave, cremosa e delicada.' }
];

const STORE = 'de_v43_';
const LEGACY_STORES = ['de_v40_', 'de_v41_', 'de_v42_'];
const STORE_ADDRESS = 'Rua Aletes, 78, Pindorama, Belo Horizonte/MG, 30865-180';
const DELIVERY_MODE = 'Uber Moto';
const DELIVERY_FEES = { pindorama: 5, filadelfia: 5, gloria: 6, coqueiros: 6 };
const DEFAULT_DELIVERY_FEE = 10;
const ADMIN_USERS = {
  'teteu.trufa': { name: 'Teteu', role: 'Administrador', fullAccess: true },
  'ingrid.trufa': { name: 'Ingrid', role: 'Administradora', fullAccess: true }
};

function loadJSON(key, fallback) {
  const current = localStorage.getItem(STORE + key);
  if (current) {
    try { return JSON.parse(current); } catch { }
  }
  for (const prefix of LEGACY_STORES) {
    const raw = localStorage.getItem(prefix + key);
    if (raw) {
      try { return JSON.parse(raw); } catch { }
    }
  }
  return fallback;
}

let inventory = loadJSON('inventory', BASE_PRODUCTS.map(p => ({ id: p.id, stock: p.stock, min: p.min })));
let products = BASE_PRODUCTS.map(p => ({ ...p, ...(inventory.find(i => i.id === p.id) || {}) }));
let cart = loadJSON('cart', []);
let orders = loadJSON('orders', []);
let stockMoves = loadJSON('stockMoves', []);
let promo = [];
let currentAdmin = null;
let deliveryInfo = { type: 'retirada', fee: 0, status: 'Retirada na loja', method: 'Retirada', applied: false, region: '' };

const normalizeText = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const productById = (id) => products.find(p => p.id === id);
const faceKey = (u) => STORE + 'faceid_' + u;
const hasFaceId = (u) => localStorage.getItem(faceKey(u)) === 'enabled';

function save() {
  localStorage.setItem(STORE + 'inventory', JSON.stringify(products.map(({ id, stock, min }) => ({ id, stock, min }))));
  localStorage.setItem(STORE + 'cart', JSON.stringify(cart));
  localStorage.setItem(STORE + 'orders', JSON.stringify(orders));
  localStorage.setItem(STORE + 'stockMoves', JSON.stringify(stockMoves));
}
function say(t) { const s = $('#speech'); if (s) s.innerHTML = t; }
function jump(t) { say(t); const tr = $('#trufita'); if (tr) { tr.classList.add('jump'); setTimeout(() => tr.classList.remove('jump'), 800); } }
function pointPix(t) { say(t); const tr = $('#trufita'); if (tr) { tr.classList.add('point'); setTimeout(() => tr.classList.remove('point'), 2200); } }
function confetti() { for (let i = 0; i < 26; i++) { const e = document.createElement('span'); e.className = 'confetti'; e.textContent = ['🍫', '✨', '💖', '🎉'][i % 4]; e.style.left = Math.random() * 100 + 'vw'; e.style.animationDelay = Math.random() * .18 + 's'; document.body.append(e); setTimeout(() => e.remove(), 1400); } }
function fly(btn, emoji) { if (!btn || !$('#cartOpen')) return; const r = btn.getBoundingClientRect(), c = $('#cartOpen').getBoundingClientRect(), el = document.createElement('div'); el.className = 'fly'; el.textContent = emoji; el.style.left = r.left + r.width / 2 + 'px'; el.style.top = r.top + r.height / 2 + 'px'; document.body.append(el); requestAnimationFrame(() => { el.style.transform = `translate(${c.left - r.left}px,${c.top - r.top}px) scale(.25) rotate(360deg)`; el.style.opacity = '.15'; }); setTimeout(() => { el.remove(); $('#cartOpen').classList.add('pop'); setTimeout(() => $('#cartOpen').classList.remove('pop'), 500); }, 760); }

function deliveryFeeByRegion(bairro) { return DELIVERY_FEES[normalizeText(bairro)] || DEFAULT_DELIVERY_FEE; }
function deliveryFeeLabel(bairro) { const key = normalizeText(bairro); if (key === 'pindorama' || key === 'filadelfia') return 'Região local'; if (key === 'gloria' || key === 'coqueiros') return 'Região intermediária'; return 'Demais bairros'; }
function calc() { return cart.reduce((a, i) => a + Number(i.price || 0) * Number(i.qty || 0), 0); }
function stockReservedInCart(id) { return cart.reduce((a, i) => a + (i.flavors ? i.flavors.filter(f => f.id === id).length * (i.qty || 1) : (i.id === id ? (i.qty || 0) : 0)), 0); }
function stockNeededByCart() {
  const need = {};
  for (const i of cart) {
    if (i.flavors) i.flavors.forEach(f => need[f.id] = (need[f.id] || 0) + (i.qty || 1));
    else need[i.id] = (need[i.id] || 0) + (i.qty || 0);
  }
  return need;
}
function canAddProduct(id, qty = 1) { const p = productById(id); return p && p.stock > 0 && stockReservedInCart(id) + qty <= p.stock; }
function canAddPromoBatch(item, extraQty = 1) {
  const need = {};
  (item.flavors || []).forEach(f => need[f.id] = (need[f.id] || 0) + extraQty);
  for (const [id, qty] of Object.entries(need)) if (stockReservedInCart(id) + qty > productById(id).stock) return false;
  return true;
}
function checkCartStock() {
  const need = stockNeededByCart();
  for (const [id, qty] of Object.entries(need)) {
    const p = productById(id);
    if (!p || p.stock <= 0) return { ok: false, msg: `${p?.name || id} está indisponível.` };
    if (qty > p.stock) return { ok: false, msg: `Não temos estoque suficiente de ${p.name}. Disponível: ${p.stock}. No carrinho: ${qty}.` };
  }
  return { ok: true };
}
function addStockMove(type, productId, qty, reason, orderId = '') {
  const p = productById(productId) || BASE_PRODUCTS.find(x => x.id === productId);
  stockMoves.unshift({ id: 'MV' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90), date: new Date().toLocaleString('pt-BR'), type, productId, productName: p?.name || productId, emoji: p?.emoji || '📦', qty, reason, orderId });
  stockMoves = stockMoves.slice(0, 300);
}
function deductStockForOrder(order) {
  const need = {};
  order.items.forEach(i => {
    if (i.flavors) i.flavors.forEach(f => need[f.id] = (need[f.id] || 0) + (i.qty || 1));
    else need[i.id] = (need[i.id] || 0) + (i.qty || 0);
  });
  for (const [id, qty] of Object.entries(need)) {
    const p = productById(id);
    p.stock = Math.max(0, p.stock - qty);
    addStockMove('Saída', id, -qty, 'Pedido finalizado', order.id);
  }
}
function restoreStockForOrder(order) {
  if (order.stockRestored) return;
  const need = {};
  order.items.forEach(i => {
    if (i.flavors) i.flavors.forEach(f => need[f.id] = (need[f.id] || 0) + (i.qty || 1));
    else need[i.id] = (need[i.id] || 0) + (i.qty || 0);
  });
  for (const [id, qty] of Object.entries(need)) {
    const p = productById(id);
    p.stock += qty;
    addStockMove('Cancelamento', id, qty, 'Pedido cancelado / estoque devolvido', order.id);
  }
  order.stockRestored = true;
}

function syncProducts() { products = BASE_PRODUCTS.map(p => ({ ...p, ...(products.find(i => i.id === p.id) || {}) })); save(); renderProducts(); renderPromo(); renderCart(); if (currentAdmin) renderAdmin(); }
function renderProducts() {
  if (!$('#products')) return;
  $('#products').innerHTML = products.map(p => {
    const out = p.stock <= 0;
    return `<article class="product ${out ? 'soldout' : ''}"><div class="art">${p.emoji}</div><h3>Trufa de ${p.name}</h3><p>${p.desc}</p><small class="stockBadge ${out ? 'danger' : ''}">${out ? 'Indisponível' : 'Estoque: ' + p.stock}</small><div class="price">${BRL(p.price)}</div><button class="primary full add" data-id="${p.id}" ${out ? 'disabled' : ''}>${out ? 'Indisponível' : 'Adicionar'}</button></article>`;
  }).join('');
  $$('.add').forEach(b => b.onclick = () => addItem(b.dataset.id, b));
}
function renderPromo() {
  if (!$('#promoChoices')) return;
  const count = promo.length, percent = (count / 3) * 100;
  $$('.slots span').forEach((s, i) => { const id = promo[i]; s.textContent = id ? productById(id).emoji : ''; s.classList.toggle('filled', !!id); });
  $('#promoProgress').style.width = percent + '%'; $('#promoCounter').textContent = `${count} de 3 escolhidas`;
  $('#promoChoices').innerHTML = products.map(p => {
    const selected = promo.filter(x => x === p.id).length, out = p.stock <= 0, limit = stockReservedInCart(p.id) + selected >= p.stock;
    return `<div class="choice ${out ? 'soldout' : ''}"><div class="emoji">${p.emoji}</div><h3>${p.name}</h3><p>${p.desc}</p><small>${out ? 'Indisponível' : `Estoque: ${p.stock} • Selecionadas: ${selected}`}</small><div class="qty"><button data-minus="${p.id}" ${selected === 0 ? 'disabled' : ''}>-</button><b>${selected}</b><button data-plus="${p.id}" ${(out || promo.length >= 3 || limit) ? 'disabled' : ''}>+</button></div></div>`;
  }).join('');
  $$('[data-plus]').forEach(b => b.onclick = () => promoPlus(b.dataset.plus, b));
  $$('[data-minus]').forEach(b => b.onclick = () => promoMinus(b.dataset.minus));
  const add = $('#addPromo'), msg = $('#promoMsg'); add.disabled = count !== 3;
  msg.innerHTML = count === 0 ? 'Escolha 3 trufas. Pode repetir sabores normalmente. 💖' : count === 1 ? 'Ótimo começo! Falta escolher mais 2 trufas.' : count === 2 ? 'Quase lá! Falta só mais 1 trufa para fechar sua promoção. 😍' : `🏆 Promoção pronta! Sua caixa: <b>${promo.map(id => productById(id).name).join(', ')}</b>.`;
  $('#promoResult').classList.toggle('complete', count === 3);
}
function promoPlus(id, btn) { const p = productById(id); if (promo.length >= 3) return; if (stockReservedInCart(id) + promo.filter(x => x === id).length >= p.stock) return say(`Você atingiu o limite de estoque de ${p.name}.`); promo.push(id); fly(btn, p.emoji); renderPromo(); if (promo.length === 3) { confetti(); jump('Promoção desbloqueada! Agora é só adicionar ao carrinho 🎉'); } }
function promoMinus(id) { const idx = promo.lastIndexOf(id); if (idx >= 0) { promo.splice(idx, 1); renderPromo(); } }
function addPromo() { if (promo.length !== 3) return; const flavors = promo.map(id => ({ id, name: productById(id).name, emoji: productById(id).emoji })); const item = { id: 'promo-' + Date.now(), name: 'Promoção 3 trufas', emoji: '🎁', qty: 1, price: 14, flavors }; if (!canAddPromoBatch(item, 0)) return say('Estoque insuficiente para essa promoção.'); cart.push(item); promo = []; save(); renderPromo(); renderCart(); jump('Promoção adicionada ao carrinho! 🛒'); }
function suggestPromo() { promo = []; for (const id of ['maracuja', 'coco', 'oreo', 'brigadeiro']) { if (promo.length < 3 && productById(id).stock > stockReservedInCart(id) + promo.filter(x => x === id).length) promo.push(id); } renderPromo(); say('Minha sugestão equilibrada: Maracujá, Coco e Oreo. Uma cítrica, uma suave e uma mais docinha 💖'); }
function addItem(id, btn) { const p = productById(id); if (!p || p.stock <= 0) return say(`${p?.name || 'Produto'} está indisponível hoje.`); if (!canAddProduct(id, 1)) return say(`Você atingiu o limite de estoque de ${p.name}.`); const item = cart.find(i => i.id === id && !i.flavors); if (item) item.qty++; else cart.push({ id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1 }); fly(btn, p.emoji); jump(`${p.name} foi para o carrinho! Excelente escolha 🍫`); save(); renderCart(); }

function freeShippingProgress() { const sub = calc(), missing = Math.max(0, 30 - sub), pct = Math.min(100, (sub / 30) * 100); if (sub >= 30) return `<div class="freeShip unlocked"><b>🎉 Frete grátis desbloqueado!</b><small>Seu pedido passou de R$30,00.</small></div>`; return `<div class="freeShip"><b>🎁 Frete grátis acima de R$30,00</b><div class="freeBar"><i style="width:${pct}%"></i></div><small>Faltam ${BRL(missing)} para ganhar frete grátis.</small></div>`; }
function deliveryFee() { const f = $('[name=fulfillment]:checked')?.value || 'retirada'; if (f !== 'entrega') return 0; if (calc() >= 30) return 0; if (deliveryInfo && deliveryInfo.applied && typeof deliveryInfo.fee === 'number') return deliveryInfo.fee; return 0; }
function applyDeliveryByRegion(showMessage = true) { const bairro = $('#bairro')?.value?.trim() || ''; if (!bairro) return false; const sub = calc(), baseFee = deliveryFeeByRegion(bairro), region = deliveryFeeLabel(bairro), fee = sub >= 30 ? 0 : baseFee; deliveryInfo = { type: 'entrega', fee, status: fee === 0 ? 'Frete grátis aplicado' : 'Frete por bairro aplicado', method: DELIVERY_MODE, bairro, region, applied: true, baseFee }; const box = $('#deliveryQuote'); if (box) { box.classList.remove('hidden'); box.innerHTML = `<b>🛵 Entrega por ${DELIVERY_MODE}</b><br><b>📍 Bairro: ${bairro}</b><br><b>🚚 Frete: ${fee === 0 ? '🎉 GRÁTIS' : BRL(fee)}</b><br><b>💰 Total com entrega: ${BRL(sub + fee)}</b><br><small>${fee === 0 ? 'Pedido acima de R$30,00.' : region + '. Frete aplicado por bairro.'}</small>${freeShippingProgress()}`; } if (showMessage) say(fee === 0 ? `Parabéns! Você desbloqueou frete grátis para ${bairro}. Total: ${BRL(sub)} 🎉` : `Frete para ${bairro}: ${BRL(fee)}. Total com entrega: ${BRL(sub + fee)} 💖`); updateTotals(); return true; }
function updateTotals() { const sub = calc(), isDelivery = $('[name=fulfillment]:checked')?.value === 'entrega'; if (isDelivery && $('#bairro')?.value?.trim() && !deliveryInfo.applied) applyDeliveryByRegion(false); const fee = isDelivery ? deliveryFee() : 0, total = sub + fee; if ($('#subtotal')) $('#subtotal').textContent = BRL(sub); if ($('#frete')) $('#frete').textContent = isDelivery ? (fee === 0 && sub >= 30 ? 'Grátis' : BRL(fee)) : BRL(0); if ($('#grandTotal')) $('#grandTotal').textContent = BRL(total); if ($('#distanceLabel')) $('#distanceLabel').textContent = isDelivery ? DELIVERY_MODE : 'Retirada'; if ($('#cartTotal')) $('#cartTotal').textContent = BRL(sub); if ($('#freeShipSummary')) $('#freeShipSummary').innerHTML = isDelivery ? freeShippingProgress() : ''; const box = $('#deliveryQuote'); if (isDelivery && deliveryInfo.applied && box && !box.classList.contains('hidden')) applyDeliveryByRegion(false); }
function renderCart() { const totalQty = cart.reduce((a, i) => a + (i.qty || 0), 0); if ($('#cartCount')) $('#cartCount').textContent = totalQty; const html = cart.length ? cart.map((i, idx) => `<div class="cartRow"><div><b>${i.emoji} ${i.name}</b><br><small>${i.flavors ? i.flavors.map(f => f.name).join(', ') + (i.qty > 1 ? ` • ${i.qty} promoções iguais` : '') : ''}</small></div><div class="qty"><button data-dec="${idx}">-</button><b>${i.qty}</b><button data-inc="${idx}">+</button></div></div>`).join('') : '<p>Seu carrinho está vazio.</p>'; if ($('#cartItems')) $('#cartItems').innerHTML = html; if ($('#checkoutItems')) $('#checkoutItems').innerHTML = html; $$('[data-dec]').forEach(b => b.onclick = () => { const i = cart[Number(b.dataset.dec)]; if (!i) return; i.qty--; if (i.qty <= 0) cart.splice(Number(b.dataset.dec), 1); save(); renderCart(); renderPromo(); }); $$('[data-inc]').forEach(b => b.onclick = () => { const i = cart[Number(b.dataset.inc)]; if (!i) return; if (i.flavors) { if (!canAddPromoBatch(i, 1)) return say('Estoque insuficiente para adicionar mais uma promoção igual.'); i.qty++; } else { if (!canAddProduct(i.id, 1)) return say(`Limite de ${i.name} atingido.`); i.qty++; } save(); renderCart(); renderPromo(); }); updateTotals(); }

function onlyDigits(v) { return (v || '').replace(/\D/g, ''); }
function maskCep(v) { v = onlyDigits(v).slice(0, 8); return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v; }

const LOCAL_CEP_FALLBACK = {
  '30865130': { logradouro: 'Rua Arauto', bairro: 'Pindorama', localidade: 'Belo Horizonte', uf: 'MG' },
  '30865180': { logradouro: 'Rua Aletes', bairro: 'Pindorama', localidade: 'Belo Horizonte', uf: 'MG' },
  '30865300': { logradouro: 'Rua Aredius', bairro: 'Pindorama', localidade: 'Belo Horizonte', uf: 'MG' }
};
function applyCepData(data, source='ViaCEP') {
  if ($('#rua')) $('#rua').value = data.logradouro || '';
  if ($('#bairro')) $('#bairro').value = data.bairro || '';
  if ($('#cidade')) $('#cidade').value = data.localidade || '';
  if ($('#estado')) $('#estado').value = data.uf || '';
  const status = $('#cepStatus');
  if (status) {
    status.textContent = source === 'local' ? 'Endereço reconhecido pela base local. Complete o número e finalize normalmente.' : 'Endereço preenchido automaticamente. Complete o número e finalize normalmente.';
    status.className = 'cepStatus ok';
  }
  $('#numero')?.focus();
  if ($('#bairro')?.value) applyDeliveryByRegion(false);
}
function localCepFallback(raw) {
  if (LOCAL_CEP_FALLBACK[raw]) return LOCAL_CEP_FALLBACK[raw];
  if (raw.startsWith('30865')) return { logradouro: '', bairro: 'Pindorama', localidade: 'Belo Horizonte', uf: 'MG' };
  return null;
}
async function lookupCep() {
  const cepEl = $('#cep');
  if (!cepEl) return;
  const status = $('#cepStatus'), raw = onlyDigits(cepEl.value);
  cepEl.value = maskCep(cepEl.value);
  resetDeliveryQuote();
  if (raw.length < 8) {
    if (status) { status.textContent = 'Digite o CEP para preencher a rua automaticamente.'; status.className = 'cepStatus'; }
    return;
  }
  if (status) { status.textContent = 'Buscando endereço pelo CEP...'; status.className = 'cepStatus loading'; }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('ViaCEP indisponível');
    const data = await res.json();
    if (data.erro) throw new Error('CEP não encontrado');
    applyCepData(data, 'viacep');
  } catch (e) {
    const fallback = localCepFallback(raw);
    if (fallback) {
      applyCepData(fallback, 'local');
      return;
    }
    if (status) { status.textContent = 'Não foi possível consultar o CEP agora. Preencha manualmente e clique em Aplicar frete por bairro.'; status.className = 'cepStatus error'; }
  }
}

function stockStatus(p) { if (p.stock <= 0) return ['Sem estoque', 'danger', 'Produzir hoje']; if (p.stock <= p.min) return ['Atenção', 'warn', 'Repor em breve']; return ['OK', 'ok', 'Estoque saudável']; }
function orderIsDelivered(o) { return normalizeText(o.status) === 'entregue'; }
function orderIsCanceled(o) { return normalizeText(o.status) === 'cancelado'; }
function orderIsProduction(o) { return ['recebido', 'producao', 'produção', 'pronto', 'saiu para entrega', 'aguardando retirada'].includes(normalizeText(o.status)) && !orderIsDelivered(o) && !orderIsCanceled(o); }
function nextProductionStatus(current, fulfillment) { const c = normalizeText(current); if (c === 'recebido') return 'Produção'; if (c === 'producao' || c === 'produção') return 'Pronto'; if (c === 'pronto') return fulfillment === 'entrega' ? 'Saiu para entrega' : 'Aguardando retirada'; if (c === 'saiu para entrega' || c === 'aguardando retirada') return 'Entregue'; return 'Produção'; }
function statusBadgeClass(status) { const s = normalizeText(status); if (s === 'recebido') return 'new'; if (s === 'producao' || s === 'produção') return 'doing'; if (s === 'pronto' || s === 'saiu para entrega' || s === 'aguardando retirada') return 'ready'; if (s === 'entregue') return 'done'; if (s === 'cancelado') return 'danger'; return ''; }
function orderShortItems(o) { return o.items.map(i => i.flavors ? `🎁 ${i.qty}× Promoção: ${i.flavors.map(f => f.name).join(', ')}` : `${i.emoji} ${i.qty}× ${i.name}`).join('<br>'); }
function cleanPhoneBR(phone) { let d = onlyDigits(phone || ''); if (!d) return ''; if (!d.startsWith('55')) d = '55' + d; return d; }
function orderNotifyMessage(o, type) { const loja = STORE_ADDRESS; if (type === 'ready') return `🍫 *Doce Encanto*\n\nOlá, *${o.customerName}*! 💖\n\nSeu pedido *#${o.id}* já está *pronto*!\n\n${o.fulfillment === 'retirada' ? `Você já pode retirar em:\n📍 *${loja}*` : `Ele será enviado em breve por *Uber Moto*. 🛵`}\n\nObrigado pela preferência! 🍫✨`; if (type === 'delivery') return `🍫 *Doce Encanto*\n\nOlá, *${o.customerName}*! 💖\n\nSeu pedido *#${o.id}* já saiu para entrega.\n\n🛵 A entrega será realizada por um parceiro *Uber Moto*.\n\nFique atento ao telefone, pois o entregador poderá entrar em contato caso necessário.\n\nObrigado pela confiança! ❤️`; if (type === 'delivered') return `🍫 *Doce Encanto*\n\nOlá, *${o.customerName}*!\n\nConsta para nós que seu pedido *#${o.id}* foi entregue. 😍\n\nEsperamos que você aproveite muito suas trufas!\n\nAgradecemos pela preferência e esperamos ver você novamente em breve. 💖🍫`; if (type === 'canceled') return `🍫 *Doce Encanto*\n\nOlá, *${o.customerName}*!\n\nSeu pedido *#${o.id}* foi cancelado. Se precisar, fale com a gente por aqui. 💖`; return ''; }
function openClientWhatsApp(o, msg = '') { const phone = cleanPhoneBR(o.customerPhone); if (!phone) return alert('Este pedido não possui telefone válido do cliente.'); window.open(`https://wa.me/${phone}${msg ? '?text=' + encodeURIComponent(msg) : ''}`, '_blank'); }
function setOrderStatusAndNotify(id, status, type) { const o = orders.find(x => x.id === id); if (!o) return; if (status === 'Cancelado') restoreStockForOrder(o); o.status = status; if (orderIsDelivered(o) && !o.deliveredAt) o.deliveredAt = new Date().toLocaleString('pt-BR'); if (orderIsCanceled(o) && !o.canceledAt) o.canceledAt = new Date().toLocaleString('pt-BR'); save(); syncProducts(); renderAdmin(); const msg = type ? orderNotifyMessage(o, type) : ''; if (msg || type === 'chat') openClientWhatsApp(o, msg); }

function renderPendingOrders(pending) { if (!pending.length) return '<p class="emptyState">Nenhum pedido pendente no momento.</p>'; return pending.map(o => `<article class="orderCard status-${statusBadgeClass(o.status)}"><div class="orderTop"><div><b>#${o.id}</b><small>${o.created}</small></div><span class="pill ${statusBadgeClass(o.status)}">${o.status}</span></div><div class="orderClient"><b>${o.customerName}</b><small>${o.customerPhone}</small></div><div class="orderItemsMini">${orderShortItems(o)}</div><div class="orderMeta"><span>${o.fulfillment === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}</span><b>${BRL(o.total)}</b></div><div class="orderActions smartActions"><select data-status="${o.id}"><option ${o.status === 'Recebido' ? 'selected' : ''}>Recebido</option><option ${o.status === 'Produção' ? 'selected' : ''}>Produção</option><option ${o.status === 'Pronto' ? 'selected' : ''}>Pronto</option><option ${o.status === 'Saiu para entrega' ? 'selected' : ''}>Saiu para entrega</option><option ${o.status === 'Aguardando retirada' ? 'selected' : ''}>Aguardando retirada</option><option ${o.status === 'Entregue' ? 'selected' : ''}>Entregue</option></select><button class="secondary" data-next="${o.id}">Avançar</button><button class="primary" data-ready="${o.id}">🟢 Pedido pronto</button>${o.fulfillment === 'entrega' ? `<button class="secondary" data-delivery="${o.id}">🛵 Saiu para entrega</button>` : ''}<button class="secondary" data-delivered="${o.id}">✅ Entregue</button><button class="ghost" data-chat="${o.id}">💬 Conversar</button><button class="dangerBtn" data-cancel="${o.id}">Cancelar</button></div></article>`).join(''); }
function renderProductionQueue(queue) { if (!queue.length) return '<p class="emptyState">Nenhum pedido aguardando produção.</p>'; return queue.map(o => `<article class="productionTicket"><div class="ticketHead"><b>#${o.id}</b><span class="pill ${statusBadgeClass(o.status)}">${o.status}</span></div><h4>${o.customerName}</h4><p>${orderShortItems(o)}</p><div class="ticketFoot"><small>${o.fulfillment === 'entrega' ? '🛵 Entrega Uber Moto' : '🏪 Retirada na loja'}</small><button class="primary" data-next="${o.id}">${nextProductionStatus(o.status, o.fulfillment) === 'Entregue' ? 'Marcar entregue' : 'Avançar etapa'}</button></div></article>`).join(''); }
function renderHistory(history) { if (!history.length) return '<p class="emptyState">Nenhum pedido entregue ou cancelado ainda.</p>'; return `<div class="historyTable"><div class="historyHead"><b>Pedido</b><b>Cliente</b><b>Total</b><b>Finalizado</b></div>${history.map(o => `<div class="historyRow"><span>#${o.id}<br><small>${o.status}</small></span><span>${o.customerName}</span><b>${BRL(o.total)}</b><span>${o.deliveredAt || o.canceledAt || o.created}</span></div>`).join('')}</div>`; }
function renderStockMoves() { if (!stockMoves.length) return '<p class="emptyState">Nenhuma movimentação de estoque ainda.</p>'; return `<div class="historyTable stockMoves"><div class="historyHead"><b>Data</b><b>Produto</b><b>Qtd</b><b>Motivo</b></div>${stockMoves.map(m => `<div class="historyRow"><span>${m.date}</span><span>${m.emoji} ${m.productName}<br><small>${m.type}${m.orderId ? ' • ' + m.orderId : ''}</small></span><b>${m.qty > 0 ? '+' : ''}${m.qty}</b><span>${m.reason}</span></div>`).join('')}</div>`; }
function renderAdmin() { const pending = orders.filter(o => !orderIsDelivered(o) && !orderIsCanceled(o)); const history = orders.filter(o => orderIsDelivered(o) || orderIsCanceled(o)); const production = pending.filter(orderIsProduction); const revenue = orders.filter(o => !orderIsCanceled(o)).reduce((a, o) => a + o.total, 0), deliveredRevenue = orders.filter(orderIsDelivered).reduce((a, o) => a + o.total, 0), low = products.filter(p => p.stock <= p.min).length; $('#adminPanel').innerHTML = `<div class="adminHero"><div><p class="tag">Centro de Controle</p><h2>Área da Empresa</h2><p>Pedidos entram em <b>pendentes</b>, descontam estoque ao finalizar e só vão ao histórico quando entregues ou cancelados.</p></div><button id="adminBack" class="secondary">Voltar ao site</button></div><div class="dashCards"><div><small>Pendentes</small><b>${pending.length}</b></div><div><small>Produção</small><b>${production.length}</b></div><div><small>Estoque baixo</small><b>${low}</b></div><div><small>Faturamento entregue</small><b>${BRL(deliveredRevenue)}</b></div></div><div class="adminTabs"><button class="active" data-tabbtn="pending">📌 Pendentes</button><button data-tabbtn="production">🏭 Produção</button><button data-tabbtn="history">📚 Histórico</button><button data-tabbtn="stock">📦 Estoque</button><button data-tabbtn="moves">🔁 Movimentações</button><button data-tabbtn="finance">💰 Financeiro</button></div><div class="tabPanel active" data-tab="pending"><section class="adminCard wide"><h3>📌 Pedidos pendentes</h3><p class="helper">Todo pedido novo fica aqui e não sai enquanto não for marcado como entregue ou cancelado.</p><div class="ordersGrid">${renderPendingOrders(pending)}</div></section></div><div class="tabPanel" data-tab="production"><section class="adminCard wide"><h3>🏭 Painel de Produção Inteligente</h3><div class="productionBoard"><div><h4>🔴 Recebidos</h4>${renderProductionQueue(production.filter(o => normalizeText(o.status) === 'recebido'))}</div><div><h4>🟡 Em produção</h4>${renderProductionQueue(production.filter(o => ['producao', 'produção'].includes(normalizeText(o.status))))}</div><div><h4>🟢 Prontos / Saída</h4>${renderProductionQueue(production.filter(o => ['pronto', 'saiu para entrega', 'aguardando retirada'].includes(normalizeText(o.status))))}</div></div></section></div><div class="tabPanel" data-tab="history"><section class="adminCard wide"><h3>📚 Histórico</h3>${renderHistory(history)}</section></div><div class="tabPanel" data-tab="stock"><section class="adminCard wide"><h3>📦 Estoque inteligente</h3><p class="helper">Cadastre quantas trufas existem por sabor. Se zerar, o sabor fica indisponível no site.</p><div class="stockTable">${products.map(p => { const [label, cls, act] = stockStatus(p); return `<div class="stockRow"><div><b>${p.emoji} ${p.name}</b><small>${act}</small></div><input data-stock="${p.id}" type="number" min="0" value="${p.stock}"><input data-min="${p.id}" type="number" min="1" value="${p.min}"><span class="pill ${cls}">${label}</span></div>`; }).join('')}</div><button id="saveStock" class="primary full">Salvar estoque</button></section></div><div class="tabPanel" data-tab="moves"><section class="adminCard wide"><h3>🔁 Histórico de movimentação do estoque</h3>${renderStockMoves()}</section></div><div class="tabPanel" data-tab="finance"><section class="adminCard wide"><h3>💰 Financeiro simples</h3><div class="line"><span>Faturamento total sem cancelados</span><b>${BRL(revenue)}</b></div><div class="line"><span>Faturamento entregue</span><b>${BRL(deliveredRevenue)}</b></div><div class="line"><span>Ticket médio</span><b>${BRL(orders.length ? revenue / Math.max(1, orders.filter(o => !orderIsCanceled(o)).length) : 0)}</b></div></section></div>`;
  $('#adminBack').onclick = () => location.hash = 'home';
  $$('[data-tabbtn]').forEach(btn => btn.onclick = () => { $$('[data-tabbtn]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); $$('[data-tab]').forEach(p => p.classList.toggle('active', p.dataset.tab === btn.dataset.tabbtn)); });
  $('#saveStock')?.addEventListener('click', () => { $$('[data-stock]').forEach(inp => { const p = productById(inp.dataset.stock), old = p.stock, next = Math.max(0, Number(inp.value) || 0); const diff = next - old; p.stock = next; if (diff !== 0) addStockMove(diff > 0 ? 'Entrada' : 'Ajuste', p.id, diff, diff > 0 ? 'Entrada manual no estoque' : 'Ajuste manual de estoque'); }); $$('[data-min]').forEach(inp => { const p = productById(inp.dataset.min); p.min = Math.max(1, Number(inp.value) || 1); }); save(); syncProducts(); jump('Estoque atualizado. O site já respeita os sabores disponíveis. ✅'); });
  $$('[data-status]').forEach(sel => sel.onchange = () => setOrderStatusAndNotify(sel.dataset.status, sel.value));
  $$('[data-next]').forEach(btn => btn.onclick = () => { const o = orders.find(x => x.id === btn.dataset.next); if (!o) return; setOrderStatusAndNotify(o.id, nextProductionStatus(o.status, o.fulfillment)); });
  $$('[data-ready]').forEach(btn => btn.onclick = () => setOrderStatusAndNotify(btn.dataset.ready, 'Pronto', 'ready'));
  $$('[data-delivery]').forEach(btn => btn.onclick = () => setOrderStatusAndNotify(btn.dataset.delivery, 'Saiu para entrega', 'delivery'));
  $$('[data-delivered]').forEach(btn => btn.onclick = () => setOrderStatusAndNotify(btn.dataset.delivered, 'Entregue', 'delivered'));
  $$('[data-chat]').forEach(btn => btn.onclick = () => { const o = orders.find(x => x.id === btn.dataset.chat); if (o) openClientWhatsApp(o, ''); });
  $$('[data-cancel]').forEach(btn => btn.onclick = () => { if (confirm('Cancelar este pedido e devolver o estoque?')) setOrderStatusAndNotify(btn.dataset.cancel, 'Cancelado', 'canceled'); });
}

function aiAnswer(q) { q = q.toLowerCase(); if (/menos doce|não.*doce|nao.*doce|enjoativo/.test(q)) return '💛 Eu recomendo a trufa de Maracujá. O recheio cítrico equilibra muito bem o chocolate e deixa o sabor menos enjoativo. Se quiser algo mais suave, Coco também é uma ótima escolha.'; if (/promo|3|14/.test(q)) return '🎉 A promoção é 3 trufas por R$14. Você pode escolher Brigadeiro, Oreo, Maracujá e Coco, repetindo sabores se quiser. Exemplo: 3 Maracujá ou 2 Oreo + 1 Coco.'; if (/estoque|tem hoje|sabores/.test(q)) return 'Hoje temos: ' + products.map(p => `${p.emoji} ${p.name}: ${p.stock > 0 ? p.stock + ' disponíveis' : 'indisponível'}`).join(', ') + '.'; if (/20|vinte/.test(q)) return 'Com R$20 eu aproveitaria a promoção de 3 por R$14. Minha sugestão: Maracujá, Oreo e Brigadeiro.'; if (/presente|namorada|esposa|anivers/.test(q)) return '🎁 Para presente eu montaria uma caixa com Brigadeiro, Oreo, Maracujá e Coco. Fica bonita, variada e agrada vários gostos.'; if (/cart|dinheiro|pix|pagamento/.test(q)) return 'Para retirada aceitamos Pix, dinheiro ou cartão. Para entrega, somente Pix.'; return 'Me conta seu gosto: você prefere mais chocolate, mais docinha, mais suave ou mais equilibrada? Eu monto uma sugestão para você. 🍫'; }
function addChat(t, who = 'bot') { if (!$('#chatLog')) return; $('#chatLog').innerHTML += `<div class="msg ${who}">${t}</div>`; $('#chatLog').scrollTop = $('#chatLog').scrollHeight; }
async function requireFaceId(u) { if (!hasFaceId(u)) return true; if (window.PublicKeyCredential && navigator.credentials) { try { await navigator.credentials.get({ publicKey: { challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), timeout: 60000, userVerification: 'preferred' } }); return true; } catch { return confirm('Confirme o Face ID/Windows Hello para continuar. Se seu aparelho não abriu a biometria, clique em OK para confirmar manualmente.'); } } return confirm('Face ID/Windows Hello cadastrado. Confirmar acesso agora?'); }
async function registerFaceId() { const u = ($('#user')?.value || currentAdmin || '').trim(), p = ($('#pass')?.value || '').trim(); if (!ADMIN_USERS[u]) return alert('Digite primeiro um usuário autorizado.'); if (!currentAdmin && p !== '30707420') return alert('Para cadastrar Face ID, primeiro informe usuário e senha corretos.'); localStorage.setItem(faceKey(u), 'enabled'); alert('Face ID/Windows Hello cadastrado para este usuário neste aparelho. A senha continuará sendo exigida primeiro.'); }
async function loginAdmin() { const u = $('#user').value.trim(), p = $('#pass').value.trim(); if (ADMIN_USERS[u] && p === '30707420') { const ok = await requireFaceId(u); if (!ok) return; currentAdmin = u; $('#adminPanel').classList.remove('hidden'); $('.login').classList.add('hidden'); renderAdmin(); } else alert('Usuário ou senha incorretos.'); }

function init() {
  renderProducts(); renderPromo(); renderCart(); addChat('Oii! Eu sou a Trufita AI 💖. Posso indicar sabores, explicar promoções e consultar o estoque para você.');
  $('#cartOpen').onclick = () => { $('#cartDrawer').classList.add('open'); $('#overlay').classList.add('show'); };
  $('#cartClose').onclick = $('#overlay').onclick = () => { $('#cartDrawer').classList.remove('open'); $('#overlay').classList.remove('show'); };
  $('#clearCart').onclick = () => { cart = []; save(); renderCart(); renderPromo(); say('Carrinho limpo. Posso te ajudar a montar uma nova promoção 😊'); };
  $('#goCheckout').onclick = () => { $('#cartDrawer').classList.remove('open'); $('#overlay').classList.remove('show'); };
  $$('[name=fulfillment]').forEach(r => r.onchange = () => { const entrega = $('[name=fulfillment]:checked').value === 'entrega'; $('#addressBox').classList.toggle('hidden', !entrega); $('#storeAddress').classList.toggle('hidden', entrega); resetDeliveryQuote(); if (entrega) { $('#payment').value = 'pix'; pointPix('Para entrega, usamos Pix e envio por Uber Moto. Informe o endereço para aplicar o frete por bairro. Frete grátis acima de R$30 💖'); } renderCart(); });
  $('#payment').onchange = () => { if ($('[name=fulfillment]:checked').value === 'entrega' && $('#payment').value !== 'pix') { $('#payment').value = 'pix'; alert('Para entrega, somente Pix.'); } if ($('#payment').value === 'pix') pointPix('Aqui está o QR Code Pix. Depois é só finalizar o pedido. 📱'); };
  $('#copyPix').onclick = () => navigator.clipboard?.writeText($('#pixCode').value).then(() => alert('Pix copia e cola copiado!'));
  $('#finishOrder').onclick = finish; $('#addPromo').onclick = addPromo; $('#resetPromo').onclick = () => { promo = []; renderPromo(); }; $('#suggestPromo').onclick = suggestPromo;
  $('#aiForm').onsubmit = e => { e.preventDefault(); const q = $('#aiInput').value.trim(); if (!q) return; addChat(q, 'user'); const a = aiAnswer(q); setTimeout(() => { addChat(a); say(a.split('.')[0] + '.'); }, 160); $('#aiInput').value = ''; };
  $$('.chips button').forEach(b => b.onclick = () => { $('#aiInput').value = b.dataset.q; $('#aiForm').dispatchEvent(new Event('submit')); });
  $('#loginBtn').onclick = loginAdmin; $('#faceRegister') && ($('#faceRegister').onclick = registerFaceId);
  $('#themeToggle').onclick = () => { document.body.classList.toggle('dark'); $('#themeToggle').textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'; };
  if ($('#cep')) { $('#cep').addEventListener('input', () => { $('#cep').value = maskCep($('#cep').value); resetDeliveryQuote(); }); $('#cep').addEventListener('blur', lookupCep); $('#cep').addEventListener('change', lookupCep); }
  ['rua', 'cidade', 'estado', 'numero'].forEach(id => { $('#' + id)?.addEventListener('input', () => updateTotals()); });
  ['rua','numero','bairro','cidade','estado'].forEach(id => $('#' + id)?.addEventListener('input', () => { if ($('[name=fulfillment]:checked')?.value === 'entrega' && $('#bairro')?.value.trim()) applyDeliveryByRegion(false); else resetDeliveryQuote(); }));
  $('#calcDistance')?.addEventListener('click', calculateDeliveryDistance);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => { });
}
init();
