const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const BRL=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const BASE_PRODUCTS=[
 {id:'brigadeiro',name:'Brigadeiro',emoji:'🍫',price:5,stock:20,min:8,desc:'Clássica, cremosa e intensa. Perfeita para quem ama chocolate.'},
 {id:'oreo',name:'Oreo',emoji:'🖤',price:5,stock:20,min:8,desc:'Mais docinha, com biscoito preto e recheio branco crocante.'},
 {id:'maracuja',name:'Maracujá',emoji:'💛',price:5,stock:20,min:8,desc:'Equilibrada, com toque cítrico que combina muito com chocolate.'},
 {id:'coco',name:'Coco',emoji:'🥥',price:5,stock:20,min:8,desc:'Suave, cremosa e delicada.'}
];
const STORE='de_v39_';
const STORE_ADDRESS='Rua Aletes, 78, Pindorama, Belo Horizonte/MG, 30865-180';
let deliveryInfo={type:'retirada',fee:0,status:'Retirada na loja',method:'Retirada',applied:false,region:''};
const DELIVERY_MODE='Uber Moto';
const DELIVERY_FEES={pindorama:5,filadelfia:5,gloria:6,coqueiros:6};
const DEFAULT_DELIVERY_FEE=10;
function normalizeText(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function deliveryFeeByRegion(bairro){const key=normalizeText(bairro); return DELIVERY_FEES[key] || DEFAULT_DELIVERY_FEE;}
function deliveryFeeLabel(bairro){const key=normalizeText(bairro); if(key==='pindorama'||key==='filadelfia')return 'Região local'; if(key==='gloria'||key==='coqueiros')return 'Região intermediária'; return 'Demais bairros';}
let inventory=JSON.parse(localStorage.getItem(STORE+'inventory')||'null')||BASE_PRODUCTS.map(p=>({id:p.id,stock:p.stock,min:p.min}));
let products=BASE_PRODUCTS.map(p=>({...p,...(inventory.find(i=>i.id===p.id)||{})}));
let cart=JSON.parse(localStorage.getItem(STORE+'cart')||'[]');
let orders=JSON.parse(localStorage.getItem(STORE+'orders')||'[]');
let promo=[]; let currentAdmin=null;
const ADMIN_USERS={
  'teteu.trufa':{name:'Teteu',role:'Administrador',fullAccess:true},
  'ingrid.trufa':{name:'Ingrid',role:'Administradora',fullAccess:true}
};
const faceKey=u=>STORE+'faceid_'+u;
function hasFaceId(u){return localStorage.getItem(faceKey(u))==='enabled'}
async function requireFaceId(u){
  if(!hasFaceId(u)) return true;
  if(window.PublicKeyCredential && navigator.credentials){
    try{
      await navigator.credentials.get({publicKey:{challenge:new Uint8Array([1,2,3,4,5,6,7,8]),timeout:60000,userVerification:'preferred'}});
      return true;
    }catch(e){
      return confirm('Confirme o Face ID/Windows Hello para continuar. Se seu aparelho não abriu a biometria, clique em OK para confirmar manualmente.');
    }
  }
  return confirm('Face ID/Windows Hello cadastrado. Confirmar acesso agora?');
}
async function registerFaceId(){
  const u=($('#user')?.value||currentAdmin||'').trim();
  const p=($('#pass')?.value||'').trim();
  if(!ADMIN_USERS[u]) return alert('Digite primeiro um usuário autorizado.');
  if(!currentAdmin && p!=='30707420') return alert('Para cadastrar Face ID, primeiro informe usuário e senha corretos.');
  if(window.PublicKeyCredential && navigator.credentials){
    try{
      await navigator.credentials.create({publicKey:{challenge:new Uint8Array([8,7,6,5,4,3,2,1]),rp:{name:'Doce Encanto'},user:{id:new TextEncoder().encode(u),name:u,displayName:ADMIN_USERS[u].name},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{userVerification:'preferred'},timeout:60000}});
    }catch(e){
      if(!confirm('Seu navegador não concluiu o Face ID/Windows Hello. Deseja deixar o acesso biométrico marcado neste aparelho mesmo assim?')) return;
    }
  }
  localStorage.setItem(faceKey(u),'enabled');
  alert('Face ID/Windows Hello cadastrado para este usuário neste aparelho. A senha continuará sendo exigida primeiro.');
}
const productById=id=>products.find(p=>p.id===id);
const cartQty=id=>cart.reduce((a,i)=>a+(i.id===id?i.qty:0)+(i.flavors?i.flavors.filter(f=>f.id===id).length:0),0);
const calc=()=>cart.reduce((a,i)=>a+i.price*i.qty,0);
function save(){localStorage.setItem(STORE+'inventory',JSON.stringify(products.map(({id,stock,min})=>({id,stock,min}))));localStorage.setItem(STORE+'cart',JSON.stringify(cart));localStorage.setItem(STORE+'orders',JSON.stringify(orders));}
function syncProducts(){products=BASE_PRODUCTS.map(p=>({...p,...(products.find(i=>i.id===p.id)||{})}));save();renderProducts();renderPromo();renderCart();if(currentAdmin)renderAdmin();}
function say(t){const s=$('#speech'); if(s)s.innerHTML=t;}
function jump(t){say(t);const tr=$('#trufita'); if(tr){tr.classList.add('jump');setTimeout(()=>tr.classList.remove('jump'),800)}}
function pointPix(t){say(t);const tr=$('#trufita'); if(tr){tr.classList.add('point');setTimeout(()=>tr.classList.remove('point'),2200)}}
function confetti(){for(let i=0;i<26;i++){const e=document.createElement('span');e.className='confetti';e.textContent=['🍫','✨','💖','🎉'][i%4];e.style.left=Math.random()*100+'vw';e.style.animationDelay=Math.random()*.18+'s';document.body.append(e);setTimeout(()=>e.remove(),1400)}}
function fly(btn,emoji){if(!btn)return;let r=btn.getBoundingClientRect(), c=$('#cartOpen').getBoundingClientRect(), el=document.createElement('div');el.className='fly';el.textContent=emoji;el.style.left=r.left+r.width/2+'px';el.style.top=r.top+r.height/2+'px';document.body.append(el);requestAnimationFrame(()=>{el.style.transform=`translate(${c.left-r.left}px,${c.top-r.top}px) scale(.25) rotate(360deg)`;el.style.opacity='.15'});setTimeout(()=>{el.remove();$('#cartOpen').classList.add('pop');setTimeout(()=>$('#cartOpen').classList.remove('pop'),500)},760)}
function renderProducts(){
 $('#products').innerHTML=products.map(p=>{
  const out=p.stock<=0;
  return `<article class="product ${out?'soldout':''}"><div class="art">${p.emoji}</div><h3>Trufa de ${p.name}</h3><p>${p.desc}</p><small class="stockBadge ${out?'danger':''}">${out?'Indisponível':'Estoque: '+p.stock}</small><div class="price">${BRL(p.price)}</div><button class="primary full add" data-id="${p.id}" ${out?'disabled':''}>${out?'Indisponível':'Adicionar'}</button></article>`
 }).join('');
 $$('.add').forEach(b=>b.onclick=()=>addItem(b.dataset.id,b));
}
function renderPromo(){
 const count=promo.length, percent=(count/3)*100;
 $$('.slots span').forEach((s,i)=>{let id=promo[i];s.textContent=id?productById(id).emoji:'';s.classList.toggle('filled',!!id)});
 $('#promoProgress').style.width=percent+'%'; $('#promoCounter').textContent=`${count} de 3 escolhidas`;
 $('#promoChoices').innerHTML=products.map(p=>{let selected=promo.filter(x=>x===p.id).length;let out=p.stock<=0;return `<div class="choice ${out?'soldout':''}"><div class="emoji">${p.emoji}</div><h3>${p.name}</h3><p>${p.desc}</p><small>${out?'Indisponível':`Estoque: ${p.stock} • Selecionadas: ${selected}`}</small><div class="qty"><button data-minus="${p.id}" ${selected===0?'disabled':''}>-</button><b>${selected}</b><button data-plus="${p.id}" ${out||promo.length>=3?'disabled':''}>+</button></div></div>`}).join('');
 $$('[data-plus]').forEach(b=>b.onclick=()=>promoPlus(b.dataset.plus,b)); $$('[data-minus]').forEach(b=>b.onclick=()=>promoMinus(b.dataset.minus));
 const add=$('#addPromo'), msg=$('#promoMsg'); add.disabled=count!==3;
 msg.innerHTML=count===0?'Escolha 3 trufas. Pode repetir sabores normalmente. 💖':count===1?'Ótimo começo! Falta escolher mais 2 trufas.':count===2?'Quase lá! Falta só mais 1 trufa para fechar sua promoção. 😍':`🏆 Promoção pronta! Sua caixa: <b>${promo.map(id=>productById(id).name).join(', ')}</b>.`;
 $('#promoResult').classList.toggle('complete',count===3);
}
function promoPlus(id,btn){const p=productById(id); if(promo.length>=3)return; if(cartQty(id)+promo.filter(x=>x===id).length>=p.stock)return say(`Você atingiu o limite de estoque de ${p.name}.`); promo.push(id); fly(btn,p.emoji); renderPromo(); if(promo.length===3){confetti();jump('Promoção desbloqueada! Agora é só adicionar ao carrinho 🎉')}}
function promoMinus(id){let idx=promo.lastIndexOf(id); if(idx>=0){promo.splice(idx,1);renderPromo();}}
function addPromo(){if(promo.length!==3)return;let flavors=promo.map(id=>({id,name:productById(id).name,emoji:productById(id).emoji})); cart.push({id:'promo-'+Date.now(),name:'Promoção 3 trufas',emoji:'🎁',qty:1,price:14,flavors}); promo=[]; save(); renderPromo(); renderCart(); jump('Promoção adicionada ao carrinho! 🛒');}
function suggestPromo(){promo=['maracuja','coco','oreo'].filter(id=>productById(id).stock>cartQty(id)).slice(0,3);renderPromo();say('Minha sugestão equilibrada: Maracujá, Coco e Oreo. Uma cítrica, uma suave e uma mais docinha 💖');}
function addItem(id,btn){let p=productById(id); if(p.stock<=0)return say(`${p.name} está indisponível hoje.`); if(cartQty(id)>=p.stock)return say(`Você atingiu o limite de estoque de ${p.name}.`); let item=cart.find(i=>i.id===id&&!i.flavors); if(item)item.qty++; else cart.push({...p,qty:1}); fly(btn,p.emoji); jump(`${p.name} foi para o carrinho! Excelente escolha 🍫`); save(); renderCart();}
function deliveryFee(){
 const f=$('[name=fulfillment]:checked')?.value||'retirada';
 if(f!=='entrega') return 0;
 if(calc()>=30) return 0;
 if(deliveryInfo && deliveryInfo.applied && typeof deliveryInfo.fee==='number') return deliveryInfo.fee;
 return 0;
}
function freeShippingProgress(){
 const sub=calc();
 const missing=Math.max(0,30-sub);
 const pct=Math.min(100,(sub/30)*100);
 if(sub>=30) return `<div class="freeShip unlocked"><b>🎉 Frete grátis desbloqueado!</b><small>Seu pedido passou de R$30,00.</small></div>`;
 return `<div class="freeShip"><b>🎁 Frete grátis acima de R$30,00</b><div class="freeBar"><i style="width:${pct}%"></i></div><small>Faltam ${BRL(missing)} para ganhar frete grátis.</small></div>`;
}
function updateTotals(){
 const sub=calc(), fee=deliveryFee(), total=sub+fee;
 if($('#subtotal')) $('#subtotal').textContent=BRL(sub);
 if($('#frete')) $('#frete').textContent=$('[name=fulfillment]:checked')?.value==='entrega'&&sub>=30?'Grátis':BRL(fee);
 if($('#grandTotal')) $('#grandTotal').textContent=BRL(total);
 if($('#distanceLabel')) $('#distanceLabel').textContent=$('[name=fulfillment]:checked')?.value==='entrega' ? DELIVERY_MODE : 'Retirada';
 if($('#cartTotal')) $('#cartTotal').textContent=BRL(sub);
}
function renderCart(){
 const totalQty=cart.reduce((a,i)=>a+i.qty,0); $('#cartCount').textContent=totalQty;
 const html=cart.length?cart.map((i,idx)=>`<div class="cartRow"><div><b>${i.emoji} ${i.name}</b><br><small>${i.flavors?i.flavors.map(f=>f.name).join(', '):''}</small></div><div class="qty"><button data-dec="${idx}">-</button><b>${i.qty}</b><button data-inc="${idx}">+</button></div></div>`).join(''):'<p>Seu carrinho está vazio.</p>';
 $('#cartItems').innerHTML=html; $('#checkoutItems').innerHTML=html;
 $$('[data-dec]').forEach(b=>b.onclick=()=>{let i=cart[b.dataset.dec];i.qty--;if(i.qty<=0)cart.splice(b.dataset.dec,1);save();renderCart()});
 $$('[data-inc]').forEach(b=>b.onclick=()=>{let i=cart[b.dataset.inc]; if(i.flavors)return; if(cartQty(i.id)>=productById(i.id).stock)return say(`Limite de ${i.name} atingido.`); i.qty++;save();renderCart()});
 updateTotals();
}
function aiAnswer(q){q=q.toLowerCase();if(/menos doce|não.*doce|nao.*doce|enjoativo/.test(q))return '💛 Eu recomendo a trufa de Maracujá. O recheio cítrico equilibra muito bem o chocolate e deixa o sabor menos enjoativo. Se quiser algo mais suave, Coco também é uma ótima escolha.';if(/promo|3|14/.test(q))return '🎉 A promoção é 3 trufas por R$14. Você pode escolher Brigadeiro, Oreo, Maracujá e Coco, repetindo sabores se quiser. Exemplo: 3 Maracujá ou 2 Oreo + 1 Coco.';if(/estoque|tem hoje|sabores/.test(q))return 'Hoje temos: '+products.map(p=>`${p.emoji} ${p.name}: ${p.stock>0?p.stock+' disponíveis':'indisponível'}`).join(', ')+'.';if(/20|vinte/.test(q))return 'Com R$20 eu aproveitaria a promoção de 3 por R$14. Minha sugestão: Maracujá, Oreo e Brigadeiro.';if(/presente|namorada|esposa|anivers/.test(q))return '🎁 Para presente eu montaria uma caixa com Brigadeiro, Oreo, Maracujá e Coco. Fica bonita, variada e agrada vários gostos.';if(/cart|dinheiro|pix|pagamento/.test(q))return 'Para retirada aceitamos Pix, dinheiro ou cartão. Para entrega, somente Pix.';return 'Me conta seu gosto: você prefere mais chocolate, mais docinha, mais suave ou mais equilibrada? Eu monto uma sugestão para você. 🍫'}
function addChat(t,who='bot'){$('#chatLog').innerHTML+=`<div class="msg ${who}">${t}</div>`;$('#chatLog').scrollTop=$('#chatLog').scrollHeight;}

function onlyDigits(v){return (v||'').replace(/\D/g,'')}
function maskCep(v){v=onlyDigits(v).slice(0,8);return v.length>5?v.slice(0,5)+'-'+v.slice(5):v}
async function lookupCep(){
 const cepEl=$('#cep'); if(!cepEl)return;
 const status=$('#cepStatus'); const raw=onlyDigits(cepEl.value);
 cepEl.value=maskCep(cepEl.value); resetDeliveryQuote();
 if(raw.length<8){ if(status){status.textContent='Digite o CEP para preencher a rua automaticamente.';status.className='cepStatus'} return; }
 if(status){status.textContent='Buscando endereço pelo CEP...';status.className='cepStatus loading'}
 try{
  const res=await fetch(`https://viacep.com.br/ws/${raw}/json/`);
  const data=await res.json();
  if(data.erro){ if(status){status.textContent='CEP não encontrado. Verifique e tente novamente.';status.className='cepStatus error'} return; }
  if($('#rua')) $('#rua').value=data.logradouro||'';
  if($('#bairro')) $('#bairro').value=data.bairro||'';
  if($('#cidade')) $('#cidade').value=data.localidade||'';
  if($('#estado')) $('#estado').value=data.uf||'';
  if(status){status.textContent='Endereço preenchido automaticamente. Complete o número e aplique o frete por região.';status.className='cepStatus ok'}
  $('#numero')?.focus();
 }catch(e){ if(status){status.textContent='Não foi possível consultar o CEP agora. Você pode preencher manualmente.';status.className='cepStatus error'} }
}
function resetDeliveryQuote(){
 deliveryInfo={type:$('[name=fulfillment]:checked')?.value||'retirada',fee:0,status:'Informe o endereço e aplique o frete por bairro',method:$('[name=fulfillment]:checked')?.value==='entrega'?DELIVERY_MODE:'Retirada',applied:false,region:''};
 const box=$('#deliveryQuote'); if(box){box.classList.add('hidden'); box.innerHTML=''}
 updateTotals();
}
function deliveryAddressText(){return `${$('#rua')?.value||''}, ${$('#numero')?.value||''}, ${$('#bairro')?.value||''}, ${$('#cidade')?.value||''}/${$('#estado')?.value||''}, CEP ${$('#cep')?.value||''}`.replace(/\s+/g,' ').trim()}
function calculateDeliveryDistance(){
 if($('[name=fulfillment]:checked')?.value!=='entrega') return;
 const required=['cep','rua','numero','bairro','cidade','estado'];
 for(const id of required){if(!$('#'+id)?.value.trim()) return alert('Preencha CEP, rua, número, bairro, cidade e UF para aplicar o frete.')}
 const bairro=$('#bairro').value.trim();
 const baseFee=deliveryFeeByRegion(bairro);
 const region=deliveryFeeLabel(bairro);
 const fee=calc()>=30?0:baseFee;
 deliveryInfo={type:'entrega',fee,status:fee===0?'Frete grátis aplicado':'Frete por bairro aplicado',method:DELIVERY_MODE,bairro,region,applied:true,baseFee};
 const box=$('#deliveryQuote');
 if(box){
  box.classList.remove('hidden');
  box.innerHTML=`<b>🛵 Entrega por ${DELIVERY_MODE}</b><br><b>📍 Bairro: ${bairro}</b><br><b>🚚 Frete: ${fee===0?'🎉 GRÁTIS':BRL(fee)}</b><br><small>${fee===0?'Pedido acima de R$30,00.':region+'. Não usamos mais cálculo de distância para evitar divergências.'}</small>${freeShippingProgress()}`;
 }
 say(fee===0?`Parabéns! Você desbloqueou frete grátis para ${bairro} via ${DELIVERY_MODE}. 🎉`:`Frete aplicado para ${bairro}: ${BRL(fee)} via ${DELIVERY_MODE}. 💖`);
 updateTotals();
}
function orderItemsText(items){
 return items.map(i=>`• ${i.qty}x ${i.name}${i.flavors?'\n   Sabores: '+i.flavors.map(f=>f.name).join(', '):''}`).join('\n');
}
function finish(){
 if(!cart.length)return alert('Carrinho vazio.');
 const f=$('[name=fulfillment]:checked').value, pay=$('#payment').value;
 const customerName=($('#customerName')?.value||'').trim();
 const customerPhone=($('#customerPhone')?.value||'').trim();
 if(!customerName) return alert('Informe o nome do cliente.');
 if(!customerPhone) return alert('Informe o telefone/WhatsApp do cliente.');
 if(f==='entrega'){
   if(!$('#cep').value||!$('#rua').value||!$('#numero').value||!$('#bairro').value||!$('#cidade').value||!$('#estado').value)return alert('Informe CEP, rua, número, bairro, cidade e UF.');
   if(pay!=='pix')return alert('Para entrega, somente Pix.');
   if(!deliveryInfo.applied){return alert('Aplique o frete por bairro antes de finalizar a entrega.');}
 }
 const id='DE'+Date.now().toString().slice(-6);
 const sub=calc(), fee=f==='entrega'?deliveryFee():0, total=sub+fee;
 let order={id,customerName,customerPhone,items:cart,total,subtotal:sub,frete:fee,deliveryMethod:f==='entrega'?DELIVERY_MODE:'Retirada',bairro:$('#bairro')?.value||'',deliveryRegion:deliveryInfo.region||'',fulfillment:f,payment:pay,status:'Recebido',paymentStatus:pay==='pix'?'Aguardando comprovante':'Pagamento na retirada',created:new Date().toLocaleString('pt-BR'),address:f==='entrega'?deliveryAddressText():STORE_ADDRESS};
 order.items.forEach(i=>{if(i.flavors){i.flavors.forEach(f=>{let p=productById(f.id);p.stock=Math.max(0,p.stock-1)})}else{let p=productById(i.id);p.stock=Math.max(0,p.stock-i.qty)}});
 orders.unshift(order);
 const msg=`🍫 *NOVO PEDIDO - DOCE ENCANTO*

📦 *Pedido:* ${order.id}
📅 *Data:* ${order.created}

👤 *Cliente*
Nome: ${customerName}
Telefone: ${customerPhone}

━━━━━━━━━━━━━━
🛒 *ITENS*
${orderItemsText(cart)}

━━━━━━━━━━━━━━
💵 *Resumo*
Subtotal: ${BRL(sub)}
Frete: ${fee===0&&f==='entrega'?'🎉 GRÁTIS':BRL(fee)}
Total: *${BRL(total)}*

━━━━━━━━━━━━━━
${f==='retirada'?`🏪 *RETIRADA NA LOJA*
Endereço: ${STORE_ADDRESS}`:`🚚 *ENTREGA*
Modalidade: ${DELIVERY_MODE}
Endereço: ${deliveryAddressText()}
Bairro: ${$('#bairro')?.value||''}
Região: ${deliveryInfo.region||'Demais bairros'}
Frete aplicado: ${fee===0?'🎉 GRÁTIS — pedido acima de R$30,00':BRL(fee)}`}

━━━━━━━━━━━━━━
💳 *Pagamento*
Forma: ${pay.toUpperCase()}
Status: ${order.paymentStatus}
Comprovante: ${pay==='pix'?'Aguardando envio/confirmação':'Não necessário agora'}

📦 *Produção*
Status: Recebido

✅ Pedido enviado pelo site da Doce Encanto.`;
 cart=[]; deliveryInfo={type:'retirada',fee:0,status:'Retirada na loja',method:'Retirada',applied:false,region:''}; save(); syncProducts(); renderCart(); confetti(); jump('Pedido finalizado! A mensagem completa foi enviada para o WhatsApp 🎉'); window.open('https://wa.me/5531992180872?text='+encodeURIComponent(msg),'_blank');
}
function stockStatus(p){if(p.stock<=0)return ['Sem estoque','danger','Produzir hoje']; if(p.stock<=p.min)return ['Atenção','warn','Repor em breve']; return ['OK','ok','Estoque saudável'];}
function renderAdmin(){
 const revenue=orders.reduce((a,o)=>a+o.total,0), today=orders.length, low=products.filter(p=>p.stock<=p.min).length, totalStock=products.reduce((a,p)=>a+p.stock,0);
 $('#adminPanel').innerHTML=`
 <div class="adminHero"><div><p class="tag">Centro de Controle</p><h2>Área da Empresa</h2><p>Controle simples para Teteu e Ingrid acompanharem pedidos, estoque, produção e financeiro.</p></div><button id="adminBack" class="secondary">Voltar ao site</button></div>
 <div class="dashCards"><div><small>Vendas</small><b>${BRL(revenue)}</b></div><div><small>Pedidos</small><b>${today}</b></div><div><small>Estoque total</small><b>${totalStock}</b></div><div><small>Alertas</small><b>${low}</b></div></div>
 <div class="adminGrid"><section class="adminCard"><h3>Pedidos recentes</h3>${orders.length?orders.slice(0,6).map(o=>`<div class="orderLine"><b>#${o.id}</b><span>${BRL(o.total)}</span><select data-status="${o.id}"><option ${o.status==='Recebido'?'selected':''}>Recebido</option><option ${o.status==='Produção'?'selected':''}>Produção</option><option ${o.status==='Pronto'?'selected':''}>Pronto</option><option ${o.status==='Entregue'?'selected':''}>Entregue</option></select></div>`).join(''):'<p>Nenhum pedido ainda.</p>'}</section>
 <section class="adminCard"><h3>Estoque inteligente</h3><div class="stockTable">${products.map(p=>{let [label,cls,act]=stockStatus(p);return `<div class="stockRow"><div><b>${p.emoji} ${p.name}</b><small>${act}</small></div><input data-stock="${p.id}" type="number" min="0" value="${p.stock}"><input data-min="${p.id}" type="number" min="1" value="${p.min}"><span class="pill ${cls}">${label}</span></div>`}).join('')}</div><button id="saveStock" class="primary full">Salvar estoque</button></section>
 <section class="adminCard"><h3>Produção sugerida</h3>${products.map(p=>{let need=Math.max(0,p.min*2-p.stock);return `<div class="line"><span>${p.name}</span><b>${need?`Produzir ${need}`:'OK'}</b></div>`}).join('')}</section>
 <section class="adminCard"><h3>Financeiro simples</h3><div class="line"><span>Faturamento</span><b>${BRL(revenue)}</b></div><div class="line"><span>Ticket médio</span><b>${BRL(orders.length?revenue/orders.length:0)}</b></div><div class="line"><span>Pedidos Pix</span><b>${orders.filter(o=>o.payment==='pix').length}</b></div></section></div>`;
 $('#adminBack').onclick=()=>location.hash='home'; $('#saveStock').onclick=()=>{$$('[data-stock]').forEach(inp=>{let p=productById(inp.dataset.stock);p.stock=Math.max(0,Number(inp.value)||0)});$$('[data-min]').forEach(inp=>{let p=productById(inp.dataset.min);p.min=Math.max(1,Number(inp.value)||1)});save();syncProducts();jump('Estoque atualizado. O site já respeita os sabores disponíveis. ✅')};
 $$('[data-status]').forEach(sel=>sel.onchange=()=>{let o=orders.find(x=>x.id===sel.dataset.status);o.status=sel.value;save();renderAdmin()});
}
async function loginAdmin(){const u=$('#user').value.trim(), p=$('#pass').value.trim(); if(ADMIN_USERS[u]&&p==='30707420'){const ok=await requireFaceId(u); if(!ok)return; currentAdmin=u; $('#adminPanel').classList.remove('hidden');$('.login').classList.add('hidden');renderAdmin();}else alert('Usuário ou senha incorretos.');}
renderProducts();renderPromo();renderCart();addChat('Oii! Eu sou a Trufita AI 💖. Posso indicar sabores, explicar promoções e consultar o estoque para você.');
$('#cartOpen').onclick=()=>{$('#cartDrawer').classList.add('open');$('#overlay').classList.add('show')};$('#cartClose').onclick=$('#overlay').onclick=()=>{$('#cartDrawer').classList.remove('open');$('#overlay').classList.remove('show')};$('#clearCart').onclick=()=>{cart=[];save();renderCart();say('Carrinho limpo. Posso te ajudar a montar uma nova promoção 😊')};$('#goCheckout').onclick=()=>{$('#cartDrawer').classList.remove('open');$('#overlay').classList.remove('show')};
$$('[name=fulfillment]').forEach(r=>r.onchange=()=>{let entrega=$('[name=fulfillment]:checked').value==='entrega';$('#addressBox').classList.toggle('hidden',!entrega);$('#storeAddress').classList.toggle('hidden',entrega);resetDeliveryQuote();if(entrega){$('#payment').value='pix';pointPix('Para entrega, usamos Pix e envio por Uber Moto. Informe o endereço para aplicar o frete por bairro. Frete grátis acima de R$30 💖')}renderCart()});$('#payment').onchange=()=>{if($('[name=fulfillment]:checked').value==='entrega'&&$('#payment').value!=='pix'){$('#payment').value='pix';alert('Para entrega, somente Pix.')}if($('#payment').value==='pix')pointPix('Aqui está o QR Code Pix. Depois é só finalizar o pedido. 📱')};$('#copyPix').onclick=()=>navigator.clipboard?.writeText($('#pixCode').value).then(()=>alert('Pix copia e cola copiado!'));$('#finishOrder').onclick=finish;$('#addPromo').onclick=addPromo;$('#resetPromo').onclick=()=>{promo=[];renderPromo()};$('#suggestPromo').onclick=suggestPromo;$('#aiForm').onsubmit=e=>{e.preventDefault();let q=$('#aiInput').value.trim();if(!q)return;addChat(q,'user');let a=aiAnswer(q);setTimeout(()=>{addChat(a);say(a.split('.')[0]+'.')},160);$('#aiInput').value=''};$$('.chips button').forEach(b=>b.onclick=()=>{$('#aiInput').value=b.dataset.q;$('#aiForm').dispatchEvent(new Event('submit'))});$('#loginBtn').onclick=loginAdmin; const faceBtn=$('#faceRegister'); if(faceBtn)faceBtn.onclick=registerFaceId; $('#themeToggle').onclick=()=>{document.body.classList.toggle('dark');$('#themeToggle').textContent=document.body.classList.contains('dark')?'☀️':'🌙'}; if($('#cep')){$('#cep').addEventListener('input',()=>{$('#cep').value=maskCep($('#cep').value);resetDeliveryQuote()});$('#cep').addEventListener('blur',lookupCep);$('#cep').addEventListener('change',lookupCep)};['rua','numero','bairro','cidade','estado'].forEach(id=>{$('#'+id)?.addEventListener('input',resetDeliveryQuote)});$('#calcDistance')?.addEventListener('click',calculateDeliveryDistance);if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});
