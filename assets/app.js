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


// ===============================
// V50 REAL — SUPABASE / TEMPO REAL
// ===============================
let supabaseClient=null;
let supabaseReady=false;
let supabaseStatus='não configurado';
let realtimeChannel=null;
const ADMIN_EMAILS={'teteu.trufa':'teteu.trufa@doceencanto.local','ingrid.trufa':'ingrid.trufa@doceencanto.local'};
function isSupabaseConfigured(){const c=window.DoceEncantoSupabaseConfig||{},k=c.publishableKey||c.anonKey;return !!(c.url&&k&&!String(c.url).includes('COLE_AQUI')&&!String(k).includes('COLE_AQUI'));}
async function initSupabase(){if(!window.supabase||!isSupabaseConfigured()){console.warn('Supabase não configurado.');return;}try{const c=window.DoceEncantoSupabaseConfig;supabaseClient=window.supabase.createClient(c.url,c.publishableKey||c.anonKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});await loadPublicInventory();subscribeInventoryRealtime();supabaseReady=true;supabaseStatus='online';}catch(e){supabaseStatus='erro';console.error(e);}}
function supabaseStatusHtml(){return supabaseReady?'<span class="pill ok">🟢 Banco online conectado</span>':'<span class="pill danger">🔴 Banco online não configurado</span>';}
async function loadPublicInventory(){if(!supabaseClient)return;const {data,error}=await supabaseClient.from('inventory').select('*').order('flavor_id');if(error)throw error;if(data?.length){inventory=data.map(r=>({id:r.flavor_id,stock:Number(r.stock||0),min:Number(r.min_stock||1)}));products=BASE_PRODUCTS.map(p=>({...p,...(inventory.find(i=>i.id===p.id)||{})}));saveLocalOnly();}}
async function loadAdminSupabaseState(){if(!supabaseClient)return;const [o,m]=await Promise.all([supabaseClient.from('orders').select('*').order('created_at',{ascending:false}).limit(500),supabaseClient.from('stock_movements').select('*').order('created_at',{ascending:false}).limit(500)]);if(o.error)throw o.error;if(m.error)throw m.error;orders=(o.data||[]).map(orderFromSupabase);stockMoves=(m.data||[]).map(moveFromSupabase);saveLocalOnly();}
function orderFromSupabase(r){return{id:r.id,created:r.created_label||new Date(r.created_at).toLocaleString('pt-BR'),customerName:r.customer_name,customerPhone:r.customer_phone,items:r.items||[],subtotal:Number(r.subtotal||0),freight:Number(r.freight||0),total:Number(r.total||0),fulfillment:r.fulfillment,deliveryMethod:r.delivery_method,deliveryRegion:r.delivery_region,address:r.address,payment:r.payment,paymentLabel:r.payment_label,status:r.status,stockRestored:!!r.stock_restored,deliveredAt:r.delivered_at?new Date(r.delivered_at).toLocaleString('pt-BR'):'',canceledAt:r.canceled_at?new Date(r.canceled_at).toLocaleString('pt-BR'):''};}
function moveFromSupabase(r){return{id:r.id,date:new Date(r.created_at).toLocaleString('pt-BR'),type:r.type,productId:r.flavor_id,productName:r.flavor_name,emoji:r.emoji,qty:Number(r.qty||0),reason:r.reason,orderId:r.order_id||''};}
function subscribeInventoryRealtime(){if(!supabaseClient)return;supabaseClient.channel('public-inventory-v50').on('postgres_changes',{event:'*',schema:'public',table:'inventory'},async()=>{await loadPublicInventory();renderProducts();renderPromo();renderCart();if(currentAdmin)renderAdmin();}).subscribe();}
function subscribeAdminRealtime(){if(!supabaseClient)return;if(realtimeChannel)supabaseClient.removeChannel(realtimeChannel);realtimeChannel=supabaseClient.channel('admin-v50').on('postgres_changes',{event:'*',schema:'public',table:'orders'},async()=>{await loadAdminSupabaseState();if(currentAdmin)renderAdmin();}).on('postgres_changes',{event:'*',schema:'public',table:'stock_movements'},async()=>{await loadAdminSupabaseState();if(currentAdmin)renderAdmin();}).subscribe();}
function saveLocalOnly(){localStorage.setItem(STORE+'inventory',JSON.stringify(products.map(({id,stock,min})=>({id,stock,min}))));localStorage.setItem(STORE+'cart',JSON.stringify(cart));localStorage.setItem(STORE+'orders',JSON.stringify(orders));localStorage.setItem(STORE+'stockMoves',JSON.stringify(stockMoves));}
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
  saveLocalOnly();
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
  const move = { id: 'MV' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90), date: new Date().toLocaleString('pt-BR'), type, productId, productName: p?.name || productId, emoji: p?.emoji || '📦', qty, reason, orderId };
  stockMoves.unshift(move);
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


function resetDeliveryQuote() {
  deliveryInfo = { type: $('[name=fulfillment]:checked')?.value || 'retirada', fee: 0, status: 'Não aplicado', method: deliveryInfo?.method || DELIVERY_MODE, applied: false, region: '' };
  const box = $('#deliveryQuote');
  if (box) { box.classList.add('hidden'); box.innerHTML = ''; }
  updateTotals();
}
function calculateDeliveryDistance() {
  return applyDeliveryByRegion(true);
}
function orderItemsText(items) {
  return items.map(i => {
    if (i.flavors) {
      const counts = {};
      i.flavors.forEach(f => counts[f.name] = (counts[f.name] || 0) + 1);
      const flavors = Object.entries(counts).map(([name, qty]) => `   • ${qty}x ${name}`).join('\n');
      return `🎁 ${i.qty}x Promoção 3 trufas por R$14\n${flavors}`;
    }
    return `${i.emoji} ${i.qty}x Trufa de ${i.name} — ${BRL(i.price * i.qty)}`;
  }).join('\n\n');
}
function buildWhatsappMessage(order) {
  const isDelivery = order.fulfillment === 'entrega';
  const lines = [];
  lines.push('🍫 *NOVO PEDIDO - DOCE ENCANTO*');
  lines.push('');
  lines.push(`📦 *Pedido:* #${order.id}`);
  lines.push(`📅 *Data:* ${order.created}`);
  lines.push('');
  lines.push('👤 *Cliente*');
  lines.push(`Nome: ${order.customerName}`);
  lines.push(`Telefone: ${order.customerPhone}`);
  lines.push('');
  lines.push('🛒 *Itens*');
  lines.push(orderItemsText(order.items));
  lines.push('');
  lines.push('💰 *Resumo*');
  lines.push(`Produtos: ${BRL(order.subtotal)}`);
  lines.push(`Frete: ${order.freight === 0 && isDelivery ? '🎉 GRÁTIS' : BRL(order.freight)}`);
  lines.push(`Total: *${BRL(order.total)}*`);
  lines.push('');
  if (isDelivery) {
    lines.push('🚚 *Entrega*');
    lines.push(`Modalidade: ${DELIVERY_MODE}`);
    lines.push(`CEP: ${order.address.cep}`);
    lines.push(`Rua: ${order.address.rua}`);
    lines.push(`Número: ${order.address.numero}`);
    if (order.address.complemento) lines.push(`Complemento: ${order.address.complemento}`);
    lines.push(`Bairro: ${order.address.bairro}`);
    lines.push(`Cidade/UF: ${order.address.cidade}/${order.address.estado}`);
    lines.push(`Região: ${order.deliveryRegion || 'Frete por bairro'}`);
    lines.push('');
  } else {
    lines.push('🏪 *Retirada na loja*');
    lines.push(STORE_ADDRESS);
    lines.push('');
  }
  lines.push('💳 *Pagamento*');
  lines.push(`Forma: ${order.paymentLabel}`);
  lines.push(order.payment === 'pix' ? 'Status: Aguardando confirmação do Pix' : 'Status: A combinar na retirada');
  lines.push('');
  lines.push('📌 *Status inicial:* Recebido');
  return lines.join('\n');
}
function normalizePaymentLabel(v) {
  if (v === 'pix') return 'PIX';
  if (v === 'dinheiro') return 'Dinheiro';
  if (v === 'cartao') return 'Cartão';
  return v || 'Não informado';
}
async function finish(){
  if(!supabaseReady)return alert('O banco online ainda não está configurado. Siga o README da V50 REAL.');
  if(!cart.length)return alert('Seu carrinho está vazio.');
  const customerName=($('#customerName')?.value||'').trim(),customerPhone=($('#customerPhone')?.value||'').trim();
  if(!customerName){$('#customerName')?.focus();return alert('Informe o nome do cliente.');}
  if(!customerPhone){$('#customerPhone')?.focus();return alert('Informe o telefone/WhatsApp do cliente.');}
  const fulfillment=$('[name=fulfillment]:checked')?.value||'retirada';let payment=$('#payment')?.value||'pix';let address=null;
  if(fulfillment==='entrega'){payment='pix';$('#payment').value='pix';const cep=($('#cep')?.value||'').trim(),rua=($('#rua')?.value||'').trim(),numero=($('#numero')?.value||'').trim(),bairro=($('#bairro')?.value||'').trim(),cidade=($('#cidade')?.value||'').trim(),estado=($('#estado')?.value||'').trim();if(!cep||!rua||!numero||!bairro||!cidade||!estado)return alert('Preencha CEP, rua, número, bairro, cidade e UF para entrega.');address={cep,rua,numero,complemento:($('#complemento')?.value||'').trim(),bairro,cidade,estado};}
  const btn=$('#finishOrder');btn.disabled=true;btn.textContent='Finalizando...';
  try{const payload={customerName,customerPhone,items:JSON.parse(JSON.stringify(cart)),fulfillment,address,payment,paymentLabel:normalizePaymentLabel(payment)};const {data,error}=await supabaseClient.rpc('create_order',{p_payload:payload});if(error)throw error;const order=orderFromSupabase(data);orders.unshift(order);cart=[];save();await loadPublicInventory();renderCart();renderProducts();renderPromo();confetti();jump('Pedido salvo online! Teteu e Ingrid verão em tempo real. 💖');window.open(`https://wa.me/553192180872?text=${encodeURIComponent(buildWhatsappMessage(order))}`,'_blank');location.hash='empresa';}
  catch(e){console.error(e);alert(e.message||'Não foi possível finalizar o pedido.');}
  finally{btn.disabled=false;btn.textContent='Finalizar pedido';}
}
function enableEnterToNextField() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (!el.matches('input, select, button')) return;
    if (el.closest('#aiForm')) return;
    if (el.tagName === 'BUTTON') return;
    e.preventDefault();
    const focusables = $$('input, select, button, a[href], textarea')
      .filter(x => !x.disabled && x.offsetParent !== null && x.tabIndex !== -1 && !x.closest('.hidden'));
    const idx = focusables.indexOf(el);
    const next = focusables[idx + 1];
    if (next) next.focus();
  });
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
async function setOrderStatusAndNotify(id,status,type){if(!supabaseReady||!currentAdmin)return alert('Entre na central online.');try{const {data,error}=await supabaseClient.rpc('admin_update_order_status',{p_order_id:id,p_status:status});if(error)throw error;const updated=orderFromSupabase(data);const idx=orders.findIndex(x=>x.id===id);if(idx>=0)orders[idx]=updated;await loadPublicInventory();await loadAdminSupabaseState();renderAdmin();renderProducts();renderPromo();const msg=type?orderNotifyMessage(updated,type):'';if(msg||type==='chat')openClientWhatsApp(updated,msg);}catch(e){console.error(e);alert(e.message||'Não foi possível atualizar o pedido.');}}

function renderPendingOrders(pending) { if (!pending.length) return '<p class="emptyState">Nenhum pedido pendente no momento.</p>'; return pending.map(o => `<article class="orderCard status-${statusBadgeClass(o.status)}"><div class="orderTop"><div><b>#${o.id}</b><small>${o.created}</small></div><span class="pill ${statusBadgeClass(o.status)}">${o.status}</span></div><div class="orderClient"><b>${o.customerName}</b><small>${o.customerPhone}</small></div><div class="orderItemsMini">${orderShortItems(o)}</div><div class="orderMeta"><span>${o.fulfillment === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}</span><b>${BRL(o.total)}</b></div><div class="orderActions smartActions"><select data-status="${o.id}"><option ${o.status === 'Recebido' ? 'selected' : ''}>Recebido</option><option ${o.status === 'Produção' ? 'selected' : ''}>Produção</option><option ${o.status === 'Pronto' ? 'selected' : ''}>Pronto</option><option ${o.status === 'Saiu para entrega' ? 'selected' : ''}>Saiu para entrega</option><option ${o.status === 'Aguardando retirada' ? 'selected' : ''}>Aguardando retirada</option><option ${o.status === 'Entregue' ? 'selected' : ''}>Entregue</option></select><button class="secondary" data-next="${o.id}">Avançar</button><button class="primary" data-ready="${o.id}">🟢 Pedido pronto</button>${o.fulfillment === 'entrega' ? `<button class="secondary" data-delivery="${o.id}">🛵 Saiu para entrega</button>` : ''}<button class="secondary" data-delivered="${o.id}">✅ Entregue</button><button class="ghost" data-chat="${o.id}">💬 Conversar</button><button class="dangerBtn" data-cancel="${o.id}">Cancelar</button></div></article>`).join(''); }
function renderProductionQueue(queue) { if (!queue.length) return '<p class="emptyState">Nenhum pedido aguardando produção.</p>'; return queue.map(o => `<article class="productionTicket"><div class="ticketHead"><b>#${o.id}</b><span class="pill ${statusBadgeClass(o.status)}">${o.status}</span></div><h4>${o.customerName}</h4><p>${orderShortItems(o)}</p><div class="ticketFoot"><small>${o.fulfillment === 'entrega' ? '🛵 Entrega Uber Moto' : '🏪 Retirada na loja'}</small><button class="primary" data-next="${o.id}">${nextProductionStatus(o.status, o.fulfillment) === 'Entregue' ? 'Marcar entregue' : 'Avançar etapa'}</button></div></article>`).join(''); }
function renderHistory(history) { if (!history.length) return '<p class="emptyState">Nenhum pedido entregue ou cancelado ainda.</p>'; return `<div class="historyTable"><div class="historyHead"><b>Pedido</b><b>Cliente</b><b>Total</b><b>Finalizado</b></div>${history.map(o => `<div class="historyRow"><span>#${o.id}<br><small>${o.status}</small></span><span>${o.customerName}</span><b>${BRL(o.total)}</b><span>${o.deliveredAt || o.canceledAt || o.created}</span></div>`).join('')}</div>`; }
function renderStockMoves() { if (!stockMoves.length) return '<p class="emptyState">Nenhuma movimentação de estoque ainda.</p>'; return `<div class="historyTable stockMoves"><div class="historyHead"><b>Data</b><b>Produto</b><b>Qtd</b><b>Motivo</b></div>${stockMoves.map(m => `<div class="historyRow"><span>${m.date}</span><span>${m.emoji} ${m.productName}<br><small>${m.type}${m.orderId ? ' • ' + m.orderId : ''}</small></span><b>${m.qty > 0 ? '+' : ''}${m.qty}</b><span>${m.reason}</span></div>`).join('')}</div>`; }
function renderAdmin() { const pending = orders.filter(o => !orderIsDelivered(o) && !orderIsCanceled(o)); const history = orders.filter(o => orderIsDelivered(o) || orderIsCanceled(o)); const production = pending.filter(orderIsProduction); const revenue = orders.filter(o => !orderIsCanceled(o)).reduce((a, o) => a + o.total, 0), deliveredRevenue = orders.filter(orderIsDelivered).reduce((a, o) => a + o.total, 0), low = products.filter(p => p.stock <= p.min).length; $('#adminPanel').innerHTML = `<div class="adminHero"><div><p class="tag">Centro de Controle</p><h2>Área da Empresa</h2><p>Pedidos entram em <b>pendentes</b>, descontam estoque ao finalizar e só vão ao histórico quando entregues ou cancelados.</p></div><div class="adminTopActions">${supabaseStatusHtml()}<button id="adminBack" class="secondary">Voltar ao site</button><button id="adminLogout" class="ghost">Sair</button></div></div><div class="dashCards"><div><small>Pendentes</small><b>${pending.length}</b></div><div><small>Produção</small><b>${production.length}</b></div><div><small>Estoque baixo</small><b>${low}</b></div><div><small>Faturamento entregue</small><b>${BRL(deliveredRevenue)}</b></div></div><div class="adminTabs"><button class="active" data-tabbtn="pending">📌 Pendentes</button><button data-tabbtn="production">🏭 Produção</button><button data-tabbtn="history">📚 Histórico</button><button data-tabbtn="stock">📦 Estoque</button><button data-tabbtn="moves">🔁 Movimentações</button><button data-tabbtn="finance">💰 Financeiro</button></div><div class="tabPanel active" data-tab="pending"><section class="adminCard wide"><h3>📌 Pedidos pendentes</h3><p class="helper">Todo pedido novo fica aqui e não sai enquanto não for marcado como entregue ou cancelado.</p><div class="ordersGrid">${renderPendingOrders(pending)}</div></section></div><div class="tabPanel" data-tab="production"><section class="adminCard wide"><h3>🏭 Painel de Produção Inteligente</h3><div class="productionBoard"><div><h4>🔴 Recebidos</h4>${renderProductionQueue(production.filter(o => normalizeText(o.status) === 'recebido'))}</div><div><h4>🟡 Em produção</h4>${renderProductionQueue(production.filter(o => ['producao', 'produção'].includes(normalizeText(o.status))))}</div><div><h4>🟢 Prontos / Saída</h4>${renderProductionQueue(production.filter(o => ['pronto', 'saiu para entrega', 'aguardando retirada'].includes(normalizeText(o.status))))}</div></div></section></div><div class="tabPanel" data-tab="history"><section class="adminCard wide"><h3>📚 Histórico</h3>${renderHistory(history)}</section></div><div class="tabPanel" data-tab="stock"><section class="adminCard wide"><h3>📦 Estoque inteligente</h3><p class="helper">Cadastre quantas trufas existem por sabor. Se zerar, o sabor fica indisponível no site.</p><div class="stockTable">${products.map(p => { const [label, cls, act] = stockStatus(p); return `<div class="stockRow"><div><b>${p.emoji} ${p.name}</b><small>${act}</small></div><input data-stock="${p.id}" type="number" min="0" value="${p.stock}"><input data-min="${p.id}" type="number" min="1" value="${p.min}"><span class="pill ${cls}">${label}</span></div>`; }).join('')}</div><button id="saveStock" class="primary full">Salvar estoque</button></section></div><div class="tabPanel" data-tab="moves"><section class="adminCard wide"><h3>🔁 Histórico de movimentação do estoque</h3>${renderStockMoves()}</section></div><div class="tabPanel" data-tab="finance"><section class="adminCard wide"><h3>💰 Financeiro simples</h3><div class="line"><span>Faturamento total sem cancelados</span><b>${BRL(revenue)}</b></div><div class="line"><span>Faturamento entregue</span><b>${BRL(deliveredRevenue)}</b></div><div class="line"><span>Ticket médio</span><b>${BRL(orders.length ? revenue / Math.max(1, orders.filter(o => !orderIsCanceled(o)).length) : 0)}</b></div></section></div>`;
  $('#adminBack').onclick=()=>location.hash='home'; $('#adminLogout').onclick=async()=>{await supabaseClient?.auth.signOut();currentAdmin=null;orders=[];stockMoves=[];$('#adminPanel').classList.add('hidden');$('.login').classList.remove('hidden');};
  $$('[data-tabbtn]').forEach(btn => btn.onclick = () => { $$('[data-tabbtn]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); $$('[data-tab]').forEach(p => p.classList.toggle('active', p.dataset.tab === btn.dataset.tabbtn)); });
  $('#saveStock')?.addEventListener('click', async () => {if(!supabaseReady||!currentAdmin)return alert('Entre na central online.');const btn=$('#saveStock');btn.disabled=true;btn.textContent='Salvando...';try{for(const inp of $$('[data-stock]')){const id=inp.dataset.stock,minInp=$(`[data-min="${id}"]`);const {error}=await supabaseClient.rpc('admin_set_inventory',{p_flavor_id:id,p_stock:Math.max(0,Number(inp.value)||0),p_min_stock:Math.max(0,Number(minInp?.value)||0)});if(error)throw error;}await loadPublicInventory();await loadAdminSupabaseState();renderAdmin();renderProducts();renderPromo();jump('Estoque salvo online e sincronizado para todos. ✅');}catch(e){console.error(e);alert(e.message||'Erro ao salvar estoque.');}finally{btn.disabled=false;btn.textContent='Salvar estoque';}});
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
async function loginAdmin(){const u=$('#user').value.trim(),p=$('#pass').value,email=ADMIN_EMAILS[u];if(!email)return alert('Usuário ou senha incorretos.');if(!supabaseReady)return alert('Configure o Supabase antes de acessar a central online.');const btn=$('#loginBtn');btn.disabled=true;btn.textContent='Entrando...';try{const {error}=await supabaseClient.auth.signInWithPassword({email,password:p});if(error)throw error;const ok=await requireFaceId(u);if(!ok)return;currentAdmin=u;await loadAdminSupabaseState();subscribeAdminRealtime();$('#adminPanel').classList.remove('hidden');$('.login').classList.add('hidden');renderAdmin();}catch(e){console.error(e);alert('Usuário ou senha incorretos, ou o usuário ainda não foi criado no Supabase.');}finally{btn.disabled=false;btn.textContent='Entrar';}}

async function init() {
  await initSupabase();
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
  if ($('#cep')) { let cepTimer=null; $('#cep').addEventListener('input', () => { $('#cep').value = maskCep($('#cep').value); resetDeliveryQuote(); clearTimeout(cepTimer); if (onlyDigits($('#cep').value).length === 8) cepTimer = setTimeout(lookupCep, 250); }); $('#cep').addEventListener('blur', lookupCep); $('#cep').addEventListener('change', lookupCep); }
  ['rua', 'cidade', 'estado', 'numero'].forEach(id => { $('#' + id)?.addEventListener('input', () => updateTotals()); });
  ['rua','numero','bairro','cidade','estado'].forEach(id => $('#' + id)?.addEventListener('input', () => { if ($('[name=fulfillment]:checked')?.value === 'entrega' && $('#bairro')?.value.trim()) applyDeliveryByRegion(false); else resetDeliveryQuote(); }));
  $('#calcDistance')?.addEventListener('click', calculateDeliveryDistance);
  enableEnterToNextField();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => { });
}
init();
