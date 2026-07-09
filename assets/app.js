const WHATSAPP = '553192180872';
const PIX = '00020101021126360014br.gov.bcb.pix0114+55319921808725204000053039865802BR5928INGRID EMANUELLE DAMASCENO6009BELO HORIZONTE62070503***6304ABCD';
const money = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const defaultStock = {brigadeiro:20, oreo:20, maracuja:20, coco:20, morango:0, uva:0};
const products = [
 {id:'brigadeiro',name:'Brigadeiro',desc:'Clássica, cremosa e intensa. Perfeita para quem ama chocolate.',price:5,emoji:'🍫'},
 {id:'oreo',name:'Oreo',desc:'Mais docinha, com biscoito preto e recheio branco crocante.',price:5,emoji:'⚫'},
 {id:'maracuja',name:'Maracujá',desc:'Mais forte e equilibrada. O azedinho combina muito com chocolate.',price:5,emoji:'🟡'},
 {id:'coco',name:'Coco',desc:'Leve, cremosa e delicada, com sabor tropical.',price:5,emoji:'🥥'},
 {id:'morango',name:'Morango',desc:'Visível no cardápio, mas indisponível no momento.',price:5,emoji:'🍓'},
 {id:'uva',name:'Uva',desc:'Visível no cardápio, mas indisponível no momento.',price:5,emoji:'🍇'}
];
let stock = JSON.parse(localStorage.getItem('de_stock')||'null') || defaultStock;
let cart = JSON.parse(localStorage.getItem('de_cart')||'[]');
let orders = JSON.parse(localStorage.getItem('de_orders')||'[]');
let auth = sessionStorage.getItem('de_auth') === 'ok';
let selectedPay = 'pix';
let fulfillment = 'retirada';

function save(){localStorage.setItem('de_stock',JSON.stringify(stock));localStorage.setItem('de_cart',JSON.stringify(cart));localStorage.setItem('de_orders',JSON.stringify(orders));}
function route(id){ $$('.screen').forEach(s=>s.classList.remove('active')); const el=$('#'+id); if(el) el.classList.add('active'); if(id==='empresa') renderDashboard(); if(id==='cliente') renderClientOrders(); if(id==='checkout') renderCheckout(); window.location.hash=id; }
window.addEventListener('hashchange',()=>route(location.hash.replace('#','')||'inicio'));
$$('[data-route]').forEach(b=>b.onclick=()=>route(b.dataset.route));

function productBy(id){return products.find(p=>p.id===id)}
function cartQty(id){return cart.filter(i=>i.id===id).reduce((s,i)=>s+i.qty,0)}
function total(){return cart.reduce((s,i)=>s+i.price*i.qty,0)}
function totalItems(){return cart.reduce((s,i)=>s+i.qty,0)}
function available(id){return (stock[id]||0) - cartQty(id)}
function mascotSay(t, mood='normal'){ $('#mascotSpeech').textContent=t; const m=$('#mascot'); m.classList.remove('jump','point','party'); void m.offsetWidth; if(mood) m.classList.add(mood); }
function flyFromButton(btn, emoji='🍫'){ const r=btn.getBoundingClientRect(); const c=$('#cartBtn').getBoundingClientRect(); const el=document.createElement('div'); el.className='fly'; el.textContent=emoji; el.style.left=r.left+r.width/2+'px'; el.style.top=r.top+r.height/2+'px'; document.body.appendChild(el); const dx=c.left-r.left, dy=c.top-r.top; el.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.25)`,opacity:.35}],{duration:750,easing:'cubic-bezier(.2,.9,.2,1)'}).onfinish=()=>el.remove(); $('#cartBtn').classList.add('cart-bump'); setTimeout(()=>$('#cartBtn').classList.remove('cart-bump'),350); }

function renderProducts(){
 const grid=$('#productsGrid'); grid.innerHTML='';
 products.forEach(p=>{
  const isOn=(stock[p.id]||0)>0;
  const card=document.createElement('article'); card.className='card'+(isOn?'':' disabled');
  card.innerHTML=`<div class="product-emoji">${p.emoji}</div><span class="stock">Estoque: ${stock[p.id]||0}</span><h3>Trufa de ${p.name}</h3><p>${p.desc}</p><div class="price">${money(p.price)}</div><button class="btn add" ${isOn?'':'disabled'}>${isOn?'Adicionar':'Indisponível'}</button>`;
  card.querySelector('.add').onclick=(e)=>addItem(p.id,1,e.currentTarget);
  grid.appendChild(card);
 });
 renderPromoSelectors(); updateCart();
}
function renderPromoSelectors(){
 const box=$('#promoSelectors'); box.innerHTML='';
 for(let i=1;i<=3;i++){
  const sel=document.createElement('select'); sel.innerHTML='<option value="">Escolha o sabor '+i+'</option>'+products.filter(p=>['brigadeiro','oreo','maracuja','coco'].includes(p.id)&&stock[p.id]>0).map(p=>`<option value="${p.id}">${p.name} (estoque ${stock[p.id]})</option>`).join('');
  box.appendChild(sel);
 }
}
function addItem(id,qty=1,btn=null, promo=false){
 const p=productBy(id); if(!p) return;
 if(available(id)<qty){alert(`Você atingiu o limite do estoque de ${p.name}.`); return false;}
 let row=cart.find(i=>i.id===id && i.promo===promo);
 if(row) row.qty+=qty; else cart.push({id, name:p.name, price: promo ? 14/3 : p.price, qty, promo});
 save(); updateCart(); if(btn) flyFromButton(btn,p.emoji); mascotSay('Oba! Adicionei ao carrinho 💕','jump'); return true;
}
$('#addPromo').onclick=(e)=>{
 const vals=$$('#promoSelectors select').map(s=>s.value); if(vals.some(v=>!v)){alert('Escolha os 3 sabores da promoção.');return;}
 const counts={}; vals.forEach(v=>counts[v]=(counts[v]||0)+1);
 for(const [id,q] of Object.entries(counts)){ if(available(id)<q){alert(`Não há estoque suficiente de ${productBy(id).name}.`);return;} }
 vals.forEach(id=>addItem(id,1,null,true)); flyFromButton(e.currentTarget,'🎁'); mascotSay('Promoção desbloqueada! 3 por R$14 🎉','party');
};
function updateCart(){
 $('#cartCount').textContent=totalItems(); $('#cartTotal').textContent=money(total());
 const box=$('#cartItems'); box.innerHTML='';
 if(!cart.length){box.innerHTML='<p>Seu carrinho está vazio.</p>'} else cart.forEach((i,idx)=>{
  const row=document.createElement('div'); row.className='cart-row'; row.innerHTML=`<div><b>${i.name}</b><small>${i.promo?'Promoção':'Unitária'} • ${money(i.price)}</small></div><div class="qty"><button>-</button><b>${i.qty}</b><button>+</button></div>`;
  row.querySelectorAll('button')[0].onclick=()=>{i.qty--; if(i.qty<=0)cart.splice(idx,1); save(); updateCart();};
  row.querySelectorAll('button')[1].onclick=()=>addItem(i.id,1,null,i.promo);
  box.appendChild(row);
 });
 renderCheckout();
}
$('#cartBtn').onclick=()=>$('#cartDrawer').classList.add('open'); $('#closeCart').onclick=()=>$('#cartDrawer').classList.remove('open');
$('#clearCart').onclick=()=>{cart=[];save();updateCart();mascotSay('Carrinho limpo. Vamos escolher de novo? 😊')};
$('#goCheckout').onclick=()=>{ if(!cart.length){alert('Adicione produtos ao carrinho.');return;} $('#cartDrawer').classList.remove('open'); route('checkout'); };

function renderCheckout(){
 const items=$('#checkoutItems'); if(!items)return; items.innerHTML = cart.length? cart.map(i=>`<p>${i.qty}x ${i.name} <b>${money(i.qty*i.price)}</b></p>`).join(''):'<p>Carrinho vazio.</p>';
 $('#checkoutTotal').textContent=money(total()); renderPayOptions();
}
function renderPayOptions(){
 fulfillment=$('input[name="fulfillment"]:checked')?.value || 'retirada';
 const pay=$('#payOptions'); pay.innerHTML='';
 const opts=fulfillment==='entrega' ? [['pix','Pix']] : [['pix','Pix'],['dinheiro','Dinheiro'],['cartao','Cartão na retirada']];
 opts.forEach(([v,n])=>{ const b=document.createElement('button'); b.className='ghost'; b.textContent=n; b.onclick=()=>{selectedPay=v; renderPayOptions();}; if(selectedPay===v)b.style.outline='3px solid var(--pink)'; pay.appendChild(b); });
 if(!opts.some(o=>o[0]===selectedPay)) selectedPay='pix';
 $('#pixBox').classList.toggle('hidden', selectedPay!=='pix');
 $('#deliveryFields').classList.toggle('hidden',fulfillment!=='entrega');
 $('#pickupAddress').classList.toggle('hidden',fulfillment!=='retirada');
 if(selectedPay==='pix') mascotSay('Pode apontar a câmera para o QR Code Pix 👉','point');
}
$$('input[name="fulfillment"]').forEach(r=>r.onchange=renderPayOptions);
$('#copyPix').onclick=()=>navigator.clipboard?.writeText(PIX).then(()=>alert('Pix copia e cola copiado!'));
$('#receipt').onchange=()=>{ $('#receiptStatus').textContent='Comprovante recebido. Trufita AI: pagamento confirmado (simulado).'; };
$('#sendOrder').onclick=()=>{
 if(!cart.length){alert('Carrinho vazio.');return;}
 const name=$('#clientName').value.trim()||'Cliente'; const phone=$('#clientPhone').value.trim();
 if(fulfillment==='entrega' && (!$('#cep').value||!$('#rua').value||!$('#numero').value||!$('#bairro').value)){alert('Informe CEP, rua, número e bairro para entrega.');return;}
 const order={id:Date.now(),name,phone,items:cart,total:total(),pay:selectedPay,fulfillment,status:'Recebido',date:new Date().toLocaleString('pt-BR'),address:fulfillment==='entrega'?`${$('#rua').value}, ${$('#numero').value}, ${$('#bairro').value}, CEP ${$('#cep').value}`:'Rua Aletes, 78, Pindorama, 30865-180'};
 orders.unshift(order); cart.forEach(i=>stock[i.id]=Math.max(0,(stock[i.id]||0)-i.qty)); cart=[]; save(); renderProducts(); updateCart(); mascotSay('Pedido enviado! Obrigada pela preferência 🥳','party');
 const msg=`🍫 *NOVO PEDIDO - DOCE ENCANTO*\n\n👤 Cliente: ${order.name}\n📱 WhatsApp: ${order.phone||'não informado'}\n\n🛒 *Itens:*\n${order.items.map(i=>`• ${i.qty}x ${i.name} ${i.promo?'(promoção)':''} - ${money(i.qty*i.price)}`).join('\n')}\n\n💰 *Total:* ${money(order.total)}\n💳 *Pagamento:* ${order.pay.toUpperCase()}\n📦 *Opção:* ${order.fulfillment}\n📍 *Endereço:* ${order.address}\n\n✨ Pedido gerado pelo sistema Doce Encanto.`;
 window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank'); route('cliente');
};

function renderClientOrders(){ const box=$('#clientOrders'); box.innerHTML=orders.length? orders.map(o=>`<div class="panel"><b>Pedido #${o.id}</b><p>${o.date}</p><p>${o.items.map(i=>i.qty+'x '+i.name).join(', ')}</p><p>Total: <b>${money(o.total)}</b></p><p>Status: <b>${o.status}</b></p></div>`).join(''):'<div class="panel">Nenhum pedido salvo neste aparelho ainda.</div>'; }
$('#loginBtn').onclick=()=>{ const u=$('#user').value.trim(); const p=$('#pass').value.trim(); if((u==='teteu.trufa'||u==='ingrid.trufa')&&p==='30707420'){auth=true; sessionStorage.setItem('de_auth','ok'); renderDashboard();} else $('#loginError').textContent='Usuário ou senha inválidos.'; };
$('#logoutBtn').onclick=()=>{auth=false;sessionStorage.removeItem('de_auth');renderDashboard();};
function renderDashboard(){
 $('#loginBox').classList.toggle('hidden',auth); $('#dashboard').classList.toggle('hidden',!auth); if(!auth)return;
 const revenue=orders.reduce((s,o)=>s+o.total,0); $('#stats').innerHTML=`<div class="stat"><b>${orders.length}</b><small> pedidos</small></div><div class="stat"><b>${money(revenue)}</b><small> faturamento</small></div><div class="stat"><b>${orders.filter(o=>o.status==='Recebido').length}</b><small> novos</small></div><div class="stat"><b>${Object.values(stock).reduce((a,b)=>a+b,0)}</b><small> em estoque</small></div>`;
 $('#stockEditor').innerHTML=products.map(p=>`<div class="stock-line"><b>${p.name}</b><input type="number" min="0" value="${stock[p.id]||0}" data-stock="${p.id}"/><span>${stock[p.id]>0?'Ativo':'Indisponível'}</span></div>`).join('');
 $$('[data-stock]').forEach(inp=>inp.onchange=()=>{stock[inp.dataset.stock]=Math.max(0,Number(inp.value)||0);save();renderProducts();renderDashboard();});
 $('#adminOrders').innerHTML=orders.length?orders.map((o,idx)=>`<div class="cart-row"><div><b>#${o.id} ${o.name}</b><small>${o.items.map(i=>i.qty+'x '+i.name).join(', ')} • ${money(o.total)}</small></div><select data-order="${idx}"><option ${o.status==='Recebido'?'selected':''}>Recebido</option><option ${o.status==='Produção'?'selected':''}>Produção</option><option ${o.status==='Pronto'?'selected':''}>Pronto</option><option ${o.status==='Entregue'?'selected':''}>Entregue</option></select></div>`).join(''):'Sem pedidos ainda.';
 $$('[data-order]').forEach(sel=>sel.onchange=()=>{orders[sel.dataset.order].status=sel.value;save();renderDashboard();});
 const counts={}; orders.flatMap(o=>o.items).forEach(i=>counts[i.name]=(counts[i.name]||0)+i.qty);
 $('#production').innerHTML=Object.entries(counts).length?Object.entries(counts).map(([k,v])=>`<p>Produzir/reposição: <b>${v}</b> ${k}</p>`).join(''):'Sem produção pendente.';
 const best=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]; $('#finance').innerHTML=`<p>Faturamento total: <b>${money(revenue)}</b></p><p>Ticket médio: <b>${money(orders.length?revenue/orders.length:0)}</b></p><p>Sabor mais vendido: <b>${best?best[0]:'-'}</b></p>`;
}
function stockText(){
 const availableProducts = products.filter(p => (stock[p.id]||0)>0).map(p=>`${p.name} (${stock[p.id]} un.)`);
 const off = products.filter(p => (stock[p.id]||0)<=0).map(p=>p.name);
 return `Hoje temos disponível: ${availableProducts.join(', ') || 'nenhum sabor no estoque'}. ${off.length ? `Indisponíveis no momento: ${off.join(', ')}.` : ''}`;
}
function bestSellerText(){
 const counts={}; orders.flatMap(o=>o.items||[]).forEach(i=>counts[i.name]=(counts[i.name]||0)+i.qty);
 const best=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
 return best ? `Pelos pedidos salvos neste sistema, o sabor mais vendido é ${best[0]} com ${best[1]} unidade(s).` : 'Ainda não tenho vendas suficientes salvas neste aparelho. Mas a Brigadeiro costuma ser uma ótima campeã para começar!';
}
function addAiMessage(text, who='bot'){
 const box=$('#aiMessages'); if(!box) return;
 const msg=document.createElement('div'); msg.className=`ai-msg ${who}`; msg.textContent=text; box.appendChild(msg); box.scrollTop=box.scrollHeight;
 if(who==='bot') mascotSay('Trufita AI respondeu 💖','normal');
}
function trufitaReply(raw){
 const q=raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const cartValue=total();
 const deliveryMissing=Math.max(0,30-cartValue);
 if(q.includes('estoque')||q.includes('sabores')||q.includes('tem hoje')||q.includes('disponivel')) return stockText();
 if(q.includes('menos doce')||q.includes('nao seja muito doce')||q.includes('forte')||q.includes('azedo')) return 'Eu recomendo Maracujá 💛. Ela tem um recheio cítrico mais marcante, então equilibra muito bem com o chocolate e não fica enjoativa.';
 if(q.includes('oreo')) return 'A trufa de Oreo é mais docinha e tem aquele toque de biscoito preto com recheio branco. É ótima para quem gosta de sabor cremoso e crocante. 🍪';
 if(q.includes('brigadeiro')) return 'Brigadeiro é a clássica da Doce Encanto 🍫: cremosa, bem chocolatuda e perfeita para quem quer uma escolha sem erro.';
 if(q.includes('coco')) return 'Coco é uma opção mais leve e cremosa 🥥. Ela combina muito com quem quer algo delicado, mas ainda com bastante sabor.';
 if(q.includes('promocao')||q.includes('promoção')||q.includes('3 por')||q.includes('14')) return 'Nossa promoção é 3 trufas por R$14 🎁. Você pode repetir sabor, tipo 3 Maracujá, ou montar 2 Maracujá + 1 Oreo, do jeitinho que preferir.';
 if(q.includes('20')||q.includes('vinte')||q.includes('orçamento')||q.includes('tenho r')) return 'Com R$20 eu sugiro aproveitar a promoção de 3 trufas por R$14 e escolher Brigadeiro, Oreo e Maracujá. Fica uma combinação clássica, doce e equilibrada. 😍';
 if(q.includes('presente')||q.includes('namorada')||q.includes('esposa')||q.includes('aniversario')) return 'Para presente, eu montaria uma combinação charmosa: Brigadeiro, Oreo, Maracujá e Coco. Fica bonito, variado e agrada bastante. 🎁💖';
 if(q.includes('pagar')||q.includes('pagamento')||q.includes('pix')||q.includes('cartao')||q.includes('dinheiro')) return 'Para entrega, trabalhamos apenas com Pix. Para retirada na loja, você pode escolher Pix, dinheiro ou cartão. No checkout eu mostro as opções certinhas para você. 💳';
 if(q.includes('entrega')||q.includes('frete')||q.includes('retirada')) return deliveryMissing>0 ? `Fazemos entrega a partir de R$30. Seu carrinho está em ${money(cartValue)}, faltam ${money(deliveryMissing)} para liberar entrega. Para retirada, o endereço é Rua Aletes, 78, Pindorama, 30865-180. 📍` : 'Seu carrinho já libera a opção de entrega! No checkout você informa CEP, rua, número e bairro. Para retirada, o endereço é Rua Aletes, 78, Pindorama, 30865-180. 📍';
 if(q.includes('mais vendida')||q.includes('campea')||q.includes('vendeu mais')) return bestSellerText();
 if(q.includes('oi')||q.includes('ola')||q.includes('olá')||q.includes('bom dia')||q.includes('boa tarde')||q.includes('boa noite')) return 'Oii! 💖 Eu sou a Trufita AI, sua vendedora virtual da Doce Encanto. Posso te ajudar a escolher sabores, explicar promoções, falar do estoque ou ajudar no pagamento.';
 return 'Posso te ajudar sim! 💖 Eu conheço os sabores, estoque, promoção de 3 por R$14, pagamento, retirada e entrega. Me pergunte, por exemplo: “qual é menos doce?”, “quais sabores tem hoje?” ou “tenho R$20, o que você recomenda?”.';
}
function openAi(){
 $('#aiPop').classList.add('open');
 if(!$('#aiMessages').dataset.started){
  $('#aiMessages').dataset.started='1';
  addAiMessage('Oii! Eu sou a Trufita AI 🍫💖. Agora eu respondo perguntas como uma vendedora virtual: sabores, estoque, promoções, pagamento, entrega e sugestões.', 'bot');
 }
}
$('#openAi').onclick=openAi; $('#closeAi').onclick=()=>$('#aiPop').classList.remove('open');
$('#aiForm')?.addEventListener('submit',e=>{e.preventDefault(); const input=$('#aiInput'); const text=input.value.trim(); if(!text)return; addAiMessage(text,'user'); input.value=''; $('#mascot')?.classList.add('trufita-thinking'); setTimeout(()=>{addAiMessage(trufitaReply(text),'bot'); $('#mascot')?.classList.remove('trufita-thinking');},350);});
$$('[data-ai]').forEach(b=>b.onclick=()=>{openAi(); const t=b.dataset.ai; addAiMessage(t,'user'); setTimeout(()=>addAiMessage(trufitaReply(t),'bot'),250);});
$('#themeBtn').onclick=()=>{document.body.classList.toggle('dark'); localStorage.setItem('de_theme',document.body.classList.contains('dark')?'dark':'light');};
if(localStorage.getItem('de_theme')==='dark') document.body.classList.add('dark');
if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
renderProducts(); route(location.hash.replace('#','')||'inicio');
