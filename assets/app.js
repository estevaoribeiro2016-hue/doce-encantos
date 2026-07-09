const WHATS='553192180872';
const STORE_ADDRESS='Rua Aletes, 78, Pindorama, 30865-180';
const PIX='00020126360014BR.GOV.BCB.PIX0114+5531992180872520400005303986540514.005802BR5929INGRID EMANUELLE DAMASCENO6009BELO HORIZ62070503***6304ABCD';
const creds={"teteu.trufa":"30707420","ingrid.trufa":"30707420"};
const baseProducts=[
 {id:'brigadeiro',name:'Brigadeiro',emoji:'🍫',desc:'Clássica, cremosa e intensa. Perfeita para quem ama chocolate.',price:5,stock:20,active:true,tip:'Brigadeiro é a escolha mais segura: chocolate marcante, textura cremosa e sabor clássico.'},
 {id:'oreo',name:'Oreo',emoji:'⚫',desc:'Mais docinha, com biscoito preto e recheio branco crocante.',price:5,stock:20,active:true,tip:'Oreo é mais doce e tem o contraste gostoso do biscoito preto com o recheio branco.'},
 {id:'maracuja',name:'Maracujá',emoji:'🟡',desc:'Mais forte e cítrica; encaixa muito bem com o chocolate.',price:5,stock:20,active:true,tip:'Maracujá é ótima para quem não quer algo tão doce. O azedinho combina muito com chocolate.'},
 {id:'coco',name:'Coco',emoji:'🥥',desc:'Leve, tropical e bem cremosa.',price:5,stock:20,active:true,tip:'Coco é suave, delicada e combina muito com café ou presente.'},
 {id:'morango',name:'Morango',emoji:'🍓',desc:'Visível, mas indisponível no momento.',price:5,stock:0,active:false,tip:'Morango está indisponível hoje.'},
 {id:'uva',name:'Uva',emoji:'🍇',desc:'Visível, mas indisponível no momento.',price:5,stock:0,active:false,tip:'Uva está indisponível hoje.'}
];
let products=JSON.parse(localStorage.getItem('de_products')||'null')||baseProducts;
let cart=JSON.parse(localStorage.getItem('de_cart')||'[]');
let orders=JSON.parse(localStorage.getItem('de_orders')||'[]');
let favorites=JSON.parse(localStorage.getItem('de_favs')||'[]');
let stamps=Number(localStorage.getItem('de_stamps')||'3');
let promoPick=[];
let pixProofConfirmed=false;
let fulfillment='retirada';
let theme=localStorage.getItem('de_theme')||'light';
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function save(){localStorage.setItem('de_products',JSON.stringify(products));localStorage.setItem('de_cart',JSON.stringify(cart));localStorage.setItem('de_orders',JSON.stringify(orders));localStorage.setItem('de_favs',JSON.stringify(favorites));localStorage.setItem('de_stamps',String(stamps));localStorage.setItem('de_theme',theme)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark'); $('#themeToggle').textContent=theme==='dark'?'☀️':'🌙'}
$('#themeToggle').onclick=()=>{theme=theme==='dark'?'light':'dark';save();applyTheme()};
applyTheme();
function route(){let id=location.hash?.slice(1)||'inicio'; const el=$('#'+id)||$('#inicio'); $$('.view').forEach(v=>v.classList.remove('active')); el.classList.add('active'); if(el.id==='empresa') renderAdmin(); if(el.id==='checkout') renderCheckout(); window.scrollTo({top:0,behavior:'smooth'});}
window.addEventListener('hashchange',route); route();
$('#whatsBlank').href=`https://wa.me/${WHATS}`;
function productVisual(p){
 if(p.id==='oreo') return `<div class="dessert oreo-dessert"><span></span></div>`;
 if(p.id==='maracuja') return `<div class="dessert passion-dessert"><span></span></div>`;
 if(p.id==='brigadeiro') return `<div class="dessert choco-dessert"><span></span></div>`;
 if(p.id==='coco') return `<div class="dessert coco-dessert"><span></span></div>`;
 return `<div class="icon">${p.emoji}</div>`;
}
function renderProducts(){const grid=$('#productGrid'); grid.innerHTML=''; products.forEach(p=>{const off=!p.active||p.stock<=0; const card=document.createElement('article'); card.className='product glass '+(off?'off':''); card.innerHTML=`<button class="heart" data-fav="${p.id}">${favorites.includes(p.id)?'❤️':'🤍'}</button><div class="product-visual" data-visual="${p.id}">${productVisual(p)}</div><h3>Trufa de ${p.name}</h3><p>${p.desc}</p><span class="stock">${off?'Indisponível':`Estoque: ${p.stock}`}</span><button class="btn primary full" data-add="${p.id}" ${off?'disabled':''}>Adicionar</button>`; grid.appendChild(card)}); $$('#productGrid [data-add]').forEach(b=>b.onclick=e=>addProduct(b.dataset.add,e)); $$('[data-fav]').forEach(b=>b.onclick=()=>{let id=b.dataset.fav; favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id]; save();renderProducts();});}
function renderPromo(){const pg=$('#promoGrid'); pg.innerHTML=''; products.filter(p=>['brigadeiro','oreo','maracuja','coco'].includes(p.id)).forEach(p=>{let count=promoPick.filter(x=>x===p.id).length; let btn=document.createElement('button'); btn.className='promo-btn'; btn.innerHTML=`${p.emoji}<b>${count}</b><span>${p.name}</span>`; btn.onclick=()=>{let cartCount=countInCart(p.id); if(count+cartCount>=p.stock){alert(`Você atingiu o limite em estoque de ${p.name}.`);return} if(promoPick.length<3){promoPick.push(p.id)} else {promoPick.shift();promoPick.push(p.id)} renderPromo();}; pg.appendChild(btn)}); $('#promoHint').textContent=`${promoPick.length}/3 escolhidas`}
function countInCart(id){return cart.reduce((sum,i)=>{if(i.type==='product'&&i.id===id)return sum+i.qty;if(i.type==='promo')return sum+i.flavors.filter(f=>f===id).length*i.qty;return sum},0)}
$('#addPromo').onclick=()=>{if(promoPick.length!==3){alert('Escolha 3 trufas para a promoção.');return} const grouped={}; promoPick.forEach(id=>grouped[id]=(grouped[id]||0)+1); for(const id in grouped){let p=products.find(x=>x.id===id); if(countInCart(id)+grouped[id]>p.stock){alert(`Limite de estoque atingido para ${p.name}.`);return}} cart.push({type:'promo',id:'promo-'+Date.now(),name:'Promoção 3 trufas',flavors:[...promoPick],price:14,qty:1}); promoPick=[]; mascotReact('jump','Promoção desbloqueada! 🎉'); save();renderAll();openCart();};
function addProduct(id,e){let p=products.find(x=>x.id===id); if(!p||!p.active||p.stock<=0){alert('Sabor indisponível.');return} if(countInCart(id)>=p.stock){alert(`Você atingiu o limite que temos em estoque de ${p.name}.`);return} let item=cart.find(i=>i.type==='product'&&i.id===id); if(item)item.qty++; else cart.push({type:'product',id:p.id,name:`Trufa de ${p.name}`,price:p.price,qty:1,emoji:p.emoji}); flyToCart(e,p); mascotReact('jump',`Amei sua escolha: ${p.name}!`); save();renderAll();}
function flyToCart(e,p){
 const targetBtn=$('#cartDock')||$('#openCart');
 const sourceCard=e.target.closest('.product');
 const visual=sourceCard?.querySelector('.product-visual')?.getBoundingClientRect() || e.target.getBoundingClientRect();
 const target=targetBtn.getBoundingClientRect();
 const startX=visual.left+visual.width/2-35, startY=visual.top+visual.height/2-35;
 const endX=target.left+target.width/2-35, endY=target.top+target.height/2-35;
 const f=document.createElement('div');
 f.className='fly-truffle fly-direct';
 f.innerHTML=productVisual(p);
 f.style.left=startX+'px'; f.style.top=startY+'px';
 document.body.appendChild(f);
 const dx=endX-startX, dy=endY-startY;
 try{
  f.animate([
   {transform:'translate3d(0,0,0) scale(1) rotate(0deg)',opacity:1},
   {transform:`translate3d(${dx*.55}px,${dy*.55-90}px,0) scale(.9) rotate(180deg)`,opacity:1,offset:.62},
   {transform:`translate3d(${dx}px,${dy}px,0) scale(.18) rotate(420deg)`,opacity:.15}
  ],{duration:900,easing:'cubic-bezier(.18,.9,.12,1)',fill:'forwards'});
 }catch(_){f.style.setProperty('--tx',dx+'px');f.style.setProperty('--ty',dy+'px')}
 [targetBtn,$('#openCart')].filter(Boolean).forEach(b=>{b.classList.add('pop');setTimeout(()=>b.classList.remove('pop'),650)});
 setTimeout(()=>f.remove(),950);
}
function cartTotal(){return cart.reduce((s,i)=>s+i.price*i.qty,0)}
function deliveryFee(){return fulfillment==='entrega'?7:0}
function finalTotal(){return cartTotal()+deliveryFee()}
function renderCart(){let box=$('#cartItems'); box.innerHTML=cart.length?'':'<p class="muted">Seu carrinho está vazio.</p>'; cart.forEach((i,idx)=>{let line=document.createElement('div');line.className='cart-line'; let detail=i.type==='promo'?i.flavors.map(id=>products.find(p=>p.id===id)?.name).join(', '):`${i.qty} unidade(s)`; line.innerHTML=`<div><b>${i.name}</b><small>${detail}</small></div><div class="qty"><button data-dec="${idx}">-</button><b>${i.qty}</b><button data-inc="${idx}">+</button><button data-rem="${idx}">🗑</button></div>`; box.appendChild(line)}); $('#subtotal').textContent=brl(cartTotal()); $('#total').textContent=brl(cartTotal()); const qtyTotal=cart.reduce((s,i)=>s+i.qty,0); $('#cartCount').textContent=qtyTotal; if($('#cartDockCount')) $('#cartDockCount').textContent=qtyTotal; $$('[data-rem]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.rem,1);save();renderAll()}); $$('[data-dec]').forEach(b=>b.onclick=()=>{let i=cart[+b.dataset.dec]; if(i.qty>1)i.qty--;else cart.splice(+b.dataset.dec,1);save();renderAll()}); $$('[data-inc]').forEach(b=>b.onclick=()=>{let i=cart[+b.dataset.inc]; if(i.type==='promo'){alert('Para repetir promoção, adicione outra promoção.');return} let p=products.find(x=>x.id===i.id); if(countInCart(i.id)>=p.stock){alert(`Você atingiu o limite em estoque de ${p.name}.`);return} i.qty++;save();renderAll()});}
function renderCheckout(){
 if(!cart.length){$('#checkoutItems').innerHTML='<p class="muted">Carrinho vazio. Volte ao cardápio para adicionar produtos.</p>'}else{$('#checkoutItems').innerHTML=cart.map(i=>{let detail=i.type==='promo'?i.flavors.map(id=>products.find(p=>p.id===id)?.name).join(', '):`${i.qty}x`;return `<div class="checkout-item"><span><b>${i.name}</b><small>${detail}</small></span><b>${brl(i.price*i.qty)}</b></div>`}).join('')}
 $('#checkoutSubtotal').textContent=brl(cartTotal()); $('#deliveryFee').textContent=brl(deliveryFee()); $('#checkoutTotal').textContent=brl(finalTotal()); updateFulfillmentUI();
}
function renderStamps(){let s=$('#stamps'); if(!s)return; s.innerHTML=''; for(let i=1;i<=10;i++){let sp=document.createElement('span'); sp.textContent=i<=stamps?'🍫':'○'; s.appendChild(sp)} $('#vipStatus').textContent=stamps>=10?'Cliente Ouro':'Cliente Encantado'}
function renderAll(){renderProducts();renderPromo();renderCart();renderStamps();renderCheckout();renderAdmin();}
function openCart(){$('#cartPanel').classList.add('open')} $('#openCart').onclick=openCart; if($('#cartDock')) $('#cartDock').onclick=openCart; $('#closeCart').onclick=()=>$('#cartPanel').classList.remove('open'); $('#backShopping').onclick=()=>$('#cartPanel').classList.remove('open'); $('#clearCart').onclick=()=>{cart=[];save();renderAll()};
$('#goCheckout').onclick=e=>{if(!cart.length){e.preventDefault();alert('Carrinho vazio.');return} $('#cartPanel').classList.remove('open'); setTimeout(()=>renderCheckout(),40)};
function updateFulfillmentUI(){
 fulfillment=document.querySelector('input[name="fulfillment"]:checked')?.value||'retirada';
 $('#retiradaBox').classList.toggle('hidden',fulfillment!=='retirada'); $('#entregaBox').classList.toggle('hidden',fulfillment!=='entrega');
 const entrega=fulfillment==='entrega';
 if(entrega && cartTotal()<30){mascotReact('point','Entrega só a partir de R$ 30,00.');}
 $$('.pay-retirada input').forEach(i=>{i.disabled=entrega}); $$('.pay-retirada').forEach(l=>l.classList.toggle('disabled',entrega));
 if(entrega){document.querySelector('input[name="payment"][value="pix"]').checked=true;}
 renderCheckoutTotalsOnly();
}
function renderCheckoutTotalsOnly(){if($('#checkoutSubtotal')){$('#checkoutSubtotal').textContent=brl(cartTotal()); $('#deliveryFee').textContent=brl(deliveryFee()); $('#checkoutTotal').textContent=brl(finalTotal());}}
$$('input[name="fulfillment"]').forEach(r=>r.onchange=updateFulfillmentUI);
$$('input[name="payment"]').forEach(r=>r.onchange=()=>{if(r.value==='pix'&&r.checked)mascotReact('point','Apontei para o Pix! É só escanear o QR Code.');});
$('#copyPix').onclick=()=>navigator.clipboard.writeText(PIX).then(()=>$('#copyMsg').textContent='Pix copia e cola copiado!');
$('#scanPix').onclick=()=>{if(!$('#pixProof').files.length){alert('Envie uma imagem ou PDF do comprovante primeiro.');return} $('#proofStatus').classList.remove('hidden'); pixProofConfirmed=true; mascotReact('celebrate','Comprovante lido! Pagamento confirmado ✅');};
$('#finishOrder').onclick=()=>{let name=$('#customerName').value.trim(), phone=$('#customerPhone').value.trim(); if(!cart.length){alert('Carrinho vazio.');return} if(!name||!phone){alert('Informe nome e WhatsApp.');return} fulfillment=document.querySelector('input[name="fulfillment"]:checked')?.value||'retirada'; if(fulfillment==='entrega'){if(cartTotal()<30){alert('Entrega disponível somente a partir de R$ 30,00.');return} if(!$('#cep').value.trim()||!$('#street').value.trim()||!$('#number').value.trim()||!$('#district').value.trim()){alert('Informe CEP, rua, número e bairro para entrega.');return}}
 let payment=document.querySelector('input[name="payment"]:checked')?.value||'pix'; if(fulfillment==='entrega'&&payment!=='pix'){alert('Para entrega, somente Pix está disponível.');return}
 let id='DE'+String(Date.now()).slice(-6); let total=finalTotal(); let address=fulfillment==='retirada'?STORE_ADDRESS:`${$('#street').value}, ${$('#number').value} - ${$('#district').value}, CEP ${$('#cep').value}. Ref: ${$('#reference').value||'Não informado'}`; let order={id,name,phone,total,subtotal:cartTotal(),fee:deliveryFee(),payment,fulfillment,address,proofConfirmed:pixProofConfirmed,obs:$('#customerObs').value,status:pixProofConfirmed?'Pagamento confirmado':'Recebido',items:cart,created:new Date().toLocaleString('pt-BR')}; orders.unshift(order); stamps=Math.min(10,stamps+1); products=products.map(p=>{let used=0; cart.forEach(i=>{if(i.type==='product'&&i.id===p.id)used+=i.qty;if(i.type==='promo')used+=i.flavors.filter(f=>f===p.id).length}); const next=p.stock-used; return {...p,stock:Math.max(0,next),active:next>0}}); cart=[]; pixProofConfirmed=false; save();renderAll();mascotReact('celebrate','Pedido enviado! Vou comemorar com você! 🎉');
 let itemsText=order.items.map(i=> i.type==='promo'?`• ${i.name}: ${i.flavors.map(f=>baseProducts.find(p=>p.id===f)?.name||f).join(', ')} - ${brl(i.price)}`:`• ${i.qty}x ${i.name} - ${brl(i.price*i.qty)}`).join('%0A');
 let msg=`🍫✨ *PEDIDO DOCE ENCANTO* ✨🍫%0A%0A🧾 *Pedido:* ${id}%0A👤 *Cliente:* ${name}%0A📱 *WhatsApp:* ${phone}%0A%0A📋 *Itens do pedido:*%0A${itemsText}%0A%0A💰 *Subtotal:* ${brl(order.subtotal)}%0A🚚 *Frete:* ${brl(order.fee)}%0A💵 *Total:* ${brl(total)}%0A%0A📦 *Recebimento:* ${fulfillment==='retirada'?'Retirada na loja':'Entrega'}%0A📍 *Endereço:* ${address}%0A%0A💳 *Pagamento:* ${payment.toUpperCase()}%0A✅ *Comprovante:* ${order.proofConfirmed?'Enviado e confirmado pela Trufita AI':'Não enviado ainda'}%0A📝 *Observação:* ${order.obs||'Sem observações'}%0A%0A💖 Obrigado por escolher a Doce Encanto!`;
 window.open(`https://wa.me/${WHATS}?text=${msg}`,'_blank'); location.hash='cliente';};
$('#addGift').onclick=()=>{let size=Number($('#giftSize').value); cart.push({type:'gift',id:'gift-'+Date.now(),name:`Caixa presente com ${size}`,price:size*5+($('#giftWrap').value.includes('premium')?8:$('#giftWrap').value==='Presente'?4:0),qty:1}); mascotReact('celebrate','Caixa presente adicionada!'); save();renderAll();openCart()};
function aiAnswer(q){q=q.toLowerCase(); if(q.includes('doce'))return products.find(p=>p.id==='maracuja').tip; if(q.includes('present'))return 'Para presentear, recomendo uma caixa com 6 e uma mensagem especial. Brigadeiro, Oreo, Maracujá e Coco ficam bem equilibradas.'; if(q.includes('café'))return 'Com café, eu recomendo Coco ou Brigadeiro. Coco fica leve; Brigadeiro fica mais intenso.'; if(q.includes('dispon'))return 'Disponíveis hoje: '+products.filter(p=>p.active&&p.stock>0).map(p=>`${p.name} (${p.stock})`).join(', ')+'.'; return 'Posso sugerir Maracujá para equilíbrio, Oreo para quem gosta mais doce, Brigadeiro para clássico e Coco para algo suave.'}
function addMsg(text,cls='bot'){let d=document.createElement('div');d.className='msg '+cls;d.textContent=text;$('#aiMessages').appendChild(d);$('#aiMessages').scrollTop=9999} $('#openAi').onclick=()=>{$('#aiPanel').classList.add('open'); if(!$('#aiMessages').children.length)addMsg('Oi! Sou a Trufita AI. Posso recomendar sabores, presentes e promoções.')} ; $('#closeAi').onclick=()=>$('#aiPanel').classList.remove('open'); $('#sendAi').onclick=()=>{let q=$('#aiInput').value.trim(); if(!q)return; addMsg(q,'me'); addMsg(aiAnswer(q),'bot'); $('#aiInput').value=''}; $$('.quick-prompts button').forEach(b=>b.onclick=()=>{addMsg(b.dataset.q,'me');addMsg(aiAnswer(b.dataset.q),'bot')});
function mascotReact(cls,text){let m=$('#mascot'); $('#mascotSpeech').textContent=text; m.classList.remove('jump','point','celebrate'); void m.offsetWidth; m.classList.add(cls); setTimeout(()=>m.classList.remove(cls),1600)}
$('#loginBtn').onclick=()=>{if(creds[$('#user').value]===$('#pass').value){sessionStorage.setItem('de_auth','1');renderAdmin()}else alert('Login ou senha incorretos.')}; $('#bioBtn').onclick=()=>alert('Face ID/Windows Hello depende do aparelho e navegador. Nesta versão, use usuário e senha.'); $('#logoutBtn').onclick=()=>{sessionStorage.removeItem('de_auth');renderAdmin()};
function renderAdmin(){let ok=sessionStorage.getItem('de_auth')==='1'; $('#loginBox').classList.toggle('hidden',ok); $('#dashboard').classList.toggle('hidden',!ok); if(!ok)return; let todayTotal=orders.reduce((s,o)=>s+o.total,0); $('#metrics').innerHTML=`<div class="metric"><span>Pedidos</span><b>${orders.length}</b></div><div class="metric"><span>Faturamento</span><b>${brl(todayTotal)}</b></div><div class="metric"><span>Ticket médio</span><b>${brl(orders.length?todayTotal/orders.length:0)}</b></div><div class="metric"><span>Estoque total</span><b>${products.reduce((s,p)=>s+p.stock,0)}</b></div>`; $('#adminOrders').innerHTML=orders.length?'':'<p>Nenhum pedido ainda.</p>'; orders.forEach((o,idx)=>{let el=document.createElement('div');el.className='order';el.innerHTML=`<div><b>${o.id}</b><small>${o.name} • ${brl(o.total)} • ${o.status}<br>${o.fulfillment==='entrega'?'Entrega':'Retirada'} • ${o.payment.toUpperCase()}</small></div><button class="statusBtn" data-status="${idx}">Avançar</button>`; $('#adminOrders').appendChild(el)}); $$('[data-status]').forEach(b=>b.onclick=()=>{let seq=['Recebido','Pagamento confirmado','Produção','Pronto','Entregue']; let o=orders[+b.dataset.status]; o.status=seq[Math.min(seq.indexOf(o.status)+1,seq.length-1)]; save();renderAdmin();}); $('#stockManager').innerHTML=products.map(p=>`<div class="stock-row"><span>${p.emoji} ${p.name}</span><input type="number" min="0" value="${p.stock}" data-stock="${p.id}"><button class="statusBtn" data-toggle="${p.id}">${p.active?'Ativo':'Off'}</button></div>`).join(''); $$('[data-stock]').forEach(i=>i.onchange=()=>{let p=products.find(p=>p.id===i.dataset.stock); p.stock=+i.value; p.active=p.stock>0; save();renderAll();}); $$('[data-toggle]').forEach(b=>b.onclick=()=>{let p=products.find(p=>p.id===b.dataset.toggle); p.active=!p.active; save();renderAll();}); let sold={}; orders.flatMap(o=>o.items).forEach(i=>{if(i.type==='product')sold[i.name]=(sold[i.name]||0)+i.qty;if(i.type==='promo')i.flavors.forEach(f=>sold[products.find(p=>p.id===f)?.name]=(sold[products.find(p=>p.id===f)?.name]||0)+1)}); $('#productionPlan').innerHTML=products.filter(p=>p.active).map(p=>`<div class="report-pill"><span>${p.name}</span><b>Produzir ${Math.max(0,12-p.stock)}</b></div>`).join(''); $('#reports').innerHTML=`<div class="report-pill"><span>Sabor mais vendido</span><b>${Object.entries(sold).sort((a,b)=>b[1]-a[1])[0]?.[0]||'Ainda sem vendas'}</b></div><div class="report-pill"><span>Cliente VIP</span><b>${orders[0]?.name||'Aguardando'}</b></div><div class="report-pill"><span>Margem estimada</span><b>${brl(todayTotal*.55)}</b></div>`; $('#alerts').innerHTML=products.filter(p=>p.stock<=3).map(p=>`<div class="report-pill"><span>⚠ ${p.name}</span><b>Estoque baixo</b></div>`).join('')||'<p>Sem alertas críticos.</p>'; drawChart(todayTotal)}

$('#findOrders').onclick=()=>{const phone=$('#clientPhone').value.trim().replace(/\D/g,''); const list=$('#clientOrders'); if(!phone){alert('Digite seu WhatsApp para buscar.');return} const found=orders.filter(o=>o.phone.replace(/\D/g,'').includes(phone)||phone.includes(o.phone.replace(/\D/g,''))); list.innerHTML=found.length?'':'<p class="muted">Nenhum pedido encontrado para esse WhatsApp neste aparelho.</p>'; found.forEach(o=>{let el=document.createElement('div'); el.className='order'; el.innerHTML=`<div><b>${o.id}</b><small>${o.created}<br>${o.items.map(i=>i.type==='promo'?i.flavors.map(f=>products.find(p=>p.id===f)?.name).join(', '):i.name+' x'+i.qty).join(' • ')}<br>Status: ${o.status}</small></div><b>${brl(o.total)}</b>`; list.appendChild(el);});};
let deferredInstall=null; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;});
async function installPwa(){ if(deferredInstall){deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall=null;} else {alert('Para instalar no celular: abra o menu do navegador e toque em "Adicionar à tela inicial". No iPhone, use Compartilhar > Adicionar à Tela de Início.');}}
if($('#installApp')) $('#installApp').onclick=installPwa; if($('#installAppHero')) $('#installAppHero').onclick=installPwa;

function drawChart(total){let c=$('#financeChart'); if(!c)return; let ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); let vals=[total*.2,total*.35,total*.55,total*.75,total]; ctx.strokeStyle=theme==='dark'?'#ff9bc8':'#d63384';ctx.lineWidth=5;ctx.beginPath(); vals.forEach((v,i)=>{let x=25+i*90,y=190-(v/(Math.max(...vals)||1))*150; if(i)ctx.lineTo(x,y); else ctx.moveTo(x,y);});ctx.stroke();ctx.fillStyle=theme==='dark'?'#fff':'#4b2e2b';ctx.font='14px Arial';ctx.fillText('Vendas e crescimento do período',18,22); $('#financeText').innerHTML=`<div class="report-pill"><span>Lucro estimado</span><b>${brl(total*.55)}</b></div>`}
renderAll();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
