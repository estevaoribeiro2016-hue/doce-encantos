const WHATSAPP = '5531992180872';
const PIX_KEY = '(31) 99218-0872';
const PIX_COPY = '00020101021126580014br.gov.bcb.pix0136cbbf4567-58fb-4bdf-9d2e-doceencanto5204000053039865802BR5925INGRID EMANUELLE DAMASCENO6009BELO HORIZONTE62140510DOCEENCANTO6304A1B2';
const products = [
  { id:'brigadeiro', name:'Trufa de Brigadeiro', flavor:'Brigadeiro', price:5, available:true, emoji:'🍫', desc:'Recheio cremoso de brigadeiro tradicional.' },
  { id:'oreo', name:'Trufa de Oreo', flavor:'Oreo', price:5, available:true, emoji:'🖤', desc:'Creme de Oreo com cobertura de chocolate.' },
  { id:'maracuja', name:'Trufa de Maracujá', flavor:'Maracujá', price:5, available:true, emoji:'💛', desc:'Maracujá cremoso com toque azedinho.' },
  { id:'coco', name:'Trufa de Coco', flavor:'Coco', price:5, available:true, emoji:'🥥', desc:'Coco cremoso e chocolate na medida certa.' },
  { id:'morango', name:'Trufa de Morango', flavor:'Morango', price:5, available:false, emoji:'🍓', desc:'Sabor visível, mas indisponível hoje.' },
  { id:'uva', name:'Trufa de Uva', flavor:'Uva', price:5, available:false, emoji:'🍇', desc:'Sabor visível, mas indisponível hoje.' },
];
let cart = JSON.parse(localStorage.getItem('doce_cart_v16') || '[]');
let promo = { Brigadeiro:0, Oreo:0, Maracujá:0, Coco:0 };
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
function save(){ localStorage.setItem('doce_cart_v16', JSON.stringify(cart)); }
function mascotSay(text, mood=''){
  $('#mascotSpeech').textContent = text;
  const m = $('#mascot');
  m.classList.remove('jump','point','celebrate');
  if(mood){ void m.offsetWidth; m.classList.add(mood); }
}
function renderProducts(){
  $('#productGrid').innerHTML = products.map(p => `
    <article class="product ${!p.available?'unavailable':''}">
      <div class="emoji">${p.emoji}</div>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="price">${money(p.price)}</div>
      <button class="btn ${p.available?'secondary':'primary'}" ${!p.available?'disabled':''} data-add="${p.id}">${p.available?'Adicionar ao carrinho':'Indisponível'}</button>
    </article>
  `).join('');
}
function addItem(product, qty=1, customName=null, price=null){
  const id = customName ? `promo-${Date.now()}` : product.id;
  if(customName){ cart.push({ id, name:customName, price, qty }); }
  else {
    const existing = cart.find(i=>i.id===product.id);
    if(existing) existing.qty += qty;
    else cart.push({ id:product.id, name:product.name, price:product.price, qty });
  }
  save(); renderCart(); mascotSay('Eba! Foi para o carrinho 💕','jump'); bumpCart();
}
function total(){ return cart.reduce((s,i)=>s+i.price*i.qty,0); }
function renderCart(){
  $('#cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  $('#cartTotal').textContent = money(total());
  $('#cartItems').innerHTML = cart.length ? cart.map(i=>`
    <div class="cart-line">
      <div><strong>${i.name}</strong><br><small>${money(i.price)} cada</small></div>
      <div class="qty"><button data-dec="${i.id}">−</button><b>${i.qty}</b><button data-inc="${i.id}">+</button></div>
    </div>
  `).join('') : '<p class="muted">Seu carrinho está vazio. Escolha suas trufas favoritas 💖</p>';
}
function flyToCart(fromBtn){
  const tpl = $('#flyTpl').content.firstElementChild.cloneNode(true);
  const start = fromBtn.getBoundingClientRect(); const target = $('#openCart').getBoundingClientRect();
  tpl.style.left = `${start.left + start.width/2 - 29}px`; tpl.style.top = `${start.top + start.height/2 - 29}px`;
  tpl.style.setProperty('--dx', `${target.left - start.left}px`); tpl.style.setProperty('--dy', `${target.top - start.top}px`);
  document.body.appendChild(tpl); setTimeout(()=>tpl.remove(), 820);
}
function bumpCart(){ const c=$('#openCart'); c.animate([{transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}],{duration:320}); }
function openCart(){ $('#cartDrawer').classList.add('open'); $('#cartDrawer').setAttribute('aria-hidden','false'); mascotSay('Confira seu pedido no carrinho 🛒'); }
function closeCart(){ $('#cartDrawer').classList.remove('open'); $('#cartDrawer').setAttribute('aria-hidden','true'); }
function selectedPay(){ return document.querySelector('input[name="pay"]:checked')?.value || 'Pix'; }
function customer(){ return { name: $('#customerName')?.value.trim() || 'Cliente', phone: $('#customerPhone')?.value.trim() || 'Não informado', note: $('#customerNote')?.value.trim() || '' }; }
function makeOrder(){
  const c = customer();
  const order = { id: `DE-${Date.now().toString().slice(-6)}`, createdAt: new Date().toISOString(), customer:c, items:cart, total:total(), payment:selectedPay(), status:'Recebido' };
  const orders = JSON.parse(localStorage.getItem('doce_orders_v16') || '[]');
  orders.unshift(order); localStorage.setItem('doce_orders_v16', JSON.stringify(orders));
  localStorage.setItem('doce_last_order', JSON.stringify(order));
  return order;
}
function buildMessage(order){
  const lines = order.items.map(i=>`• ${i.qty}x ${i.name} — ${money(i.price*i.qty)}`).join('\n');
  const pix = order.payment==='Pix' ? `\n💳 *PIX:* cliente vai pagar pelo QR Code / Pix copia e cola.\n🔑 Chave Pix: ${PIX_KEY}` : '';
  return `🍫✨ *NOVO PEDIDO - DOCE ENCANTO* ✨🍫\n\n🧾 *Pedido:* ${order.id}\n👤 *Cliente:* ${order.customer.name}\n📱 *WhatsApp:* ${order.customer.phone}\n\n📦 *Itens:*\n${lines}\n\n💰 *Total:* ${money(order.total)}\n💳 *Pagamento:* ${order.payment}${pix}\n${order.customer.note?`\n📝 *Observação:* ${order.customer.note}\n`:''}\n📍 *Retirada:* Rua Aletes, 78, Pindorama — portão marrom.\n\n✅ Pedido registrado no site da Doce Encanto.\n💖 Mais que doce, é sentimento.`;
}
function finishWhats(){
  if(!cart.length){ mascotSay('Escolha uma trufinha antes 💖','point'); openCart(); return; }
  const order = makeOrder();
  mascotSay('Pedido enviado! Uhuul 🎉','celebrate');
  cart=[]; save(); renderCart();
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildMessage(order))}`, '_blank');
}
function renderPromo(){
  const count = Object.values(promo).reduce((a,b)=>a+b,0);
  Object.entries(promo).forEach(([flavor,qty])=>{ const el = document.getElementById(`promo-${flavor}`); if(el) el.textContent = qty; });
  const btn = $('#addPromo');
  btn.disabled = count !== 3;
  btn.textContent = count === 3 ? 'Adicionar promoção por R$ 14,00' : `Escolha ${3-count} trufa(s)`;
}
function promoLabel(){ return Object.entries(promo).filter(([,q])=>q>0).map(([f,q])=>`${q} ${f}`).join(' + '); }
function setupPromo(){ renderPromo(); }
document.addEventListener('click', e=>{
  const add = e.target.closest('[data-add]');
  if(add){ const p = products.find(x=>x.id===add.dataset.add); flyToCart(add); setTimeout(()=>addItem(p), 260); }
  const pinc = e.target.closest('[data-promo-inc]');
  if(pinc){ const totalPromo = Object.values(promo).reduce((a,b)=>a+b,0); if(totalPromo < 3){ promo[pinc.dataset.promoInc]++; renderPromo(); } else mascotSay('A promoção já tem 3 trufas 💕','point'); }
  const pdec = e.target.closest('[data-promo-dec]');
  if(pdec){ const f=pdec.dataset.promoDec; if(promo[f] > 0){ promo[f]--; renderPromo(); } }
  if(e.target.closest('#addPromo')){ addItem({}, 1, `Promoção 3 trufas (${promoLabel()})`, 14); promo = { Brigadeiro:0, Oreo:0, Maracujá:0, Coco:0 }; renderPromo(); openCart(); }
  if(e.target.closest('#openCart') || e.target.closest('#heroOrder')) openCart();
  if(e.target.closest('#closeCart')) closeCart();
  if(e.target.closest('#clearCart')){ cart=[]; save(); renderCart(); mascotSay('Carrinho limpinho! 🧹'); }
  const inc=e.target.closest('[data-inc]'); if(inc){ const i=cart.find(x=>x.id===inc.dataset.inc); if(i)i.qty++; save(); renderCart(); }
  const dec=e.target.closest('[data-dec]'); if(dec){ const i=cart.find(x=>x.id===dec.dataset.dec); if(i){ i.qty--; if(i.qty<=0) cart=cart.filter(x=>x.id!==i.id); } save(); renderCart(); }
  if(e.target.closest('#goPayment')){
    if(!cart.length){ mascotSay('Seu carrinho ainda está vazio 🛒','point'); return; }
    const pay = selectedPay();
    if(pay==='Pix'){ $('#paymentModal').classList.add('open'); closeCart(); mascotSay('Apontei para o Pix! 👉','point'); }
    else finishWhats();
  }
  if(e.target.closest('#backToCart')){ $('#paymentModal').classList.remove('open'); openCart(); }
  if(e.target.closest('#finishOrder')) finishWhats();
  if(e.target.closest('#quickWhats')) finishWhats();
  if(e.target.closest('#copyPix')){ navigator.clipboard?.writeText(PIX_COPY); $('#copyPix').textContent='Pix copiado ✅'; mascotSay('Pix copiado com sucesso! 💳','celebrate'); setTimeout(()=>$('#copyPix').textContent='Copiar Pix copia e cola',1800); }
});
window.addEventListener('mousemove', e=>{
  const m=$('#mascot'); const x=(e.clientX/window.innerWidth-.5)*8; const y=(e.clientY/window.innerHeight-.5)*8;
  m.style.transform = `translate(${x}px,${y}px)`;
});
renderProducts(); renderCart(); setupPromo();
setInterval(()=>{ const frases=['Posso ajudar você a escolher? 💖','Brigadeiro, Oreo, Maracujá ou Coco?','A promoção 3 por R$14 está esperando ✨']; mascotSay(frases[Math.floor(Math.random()*frases.length)]); }, 9000);
