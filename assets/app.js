const WHATSAPP='553192180872';
const PIX_CODE='00020101021226930014br.gov.bcb.pix2571api-h.developer.btgpactual.com/v1/p/v2/77b89d65148f4b8aac9b0f44c2a5c3675204000053039865802BR5925INGRID EMANUELLE DAMASCENO6009SAO PAULO62070503***6304ABCD';
const products=[
 {id:'brigadeiro',name:'Trufa de Brigadeiro',price:5,status:'on',icon:'🍫',desc:'Clássica, cremosa e intensa.'},
 {id:'oreo',name:'Trufa de Oreo',price:5,status:'on',icon:'⚫',desc:'Biscoito preto com recheio branco crocante.'},
 {id:'maracuja',name:'Trufa de Maracujá',price:5,status:'on',icon:'🟡',desc:'Recheio tropical de maracujá.'},
 {id:'coco',name:'Trufa de Coco',price:5,status:'on',icon:'🥥',desc:'Cremosa, leve e especial.'},
 {id:'morango',name:'Trufa de Morango',price:5,status:'off',icon:'🍓',desc:'Visível, porém indisponível.'},
 {id:'uva',name:'Trufa de Uva',price:5,status:'off',icon:'🍇',desc:'Visível, porém indisponível.'}
];
let cart=JSON.parse(localStorage.getItem('de_cart')||'[]');
const $=s=>document.querySelector(s); const $$=s=>document.querySelectorAll(s);
function save(){localStorage.setItem('de_cart',JSON.stringify(cart)); renderCart();}
function toast(t){const el=$('#toast'); if(!el)return; el.textContent=t; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200)}
function mascot(state){const m=$('#mascot'); if(!m)return; m.classList.remove('jump','point'); if(state)m.classList.add(state); setTimeout(()=>m.classList.remove('jump','point'),1400)}
function flyToCart(icon,x,y){const f=document.createElement('div'); f.className='fly'; f.textContent=icon; f.style.left=x+'px'; f.style.top=y+'px'; document.body.appendChild(f); const c=$('#cartBtn').getBoundingClientRect(); requestAnimationFrame(()=>{f.style.left=(c.left+20)+'px';f.style.top=(c.top+10)+'px';f.style.transform='scale(.25) rotate(360deg)';f.style.opacity='.1'}); setTimeout(()=>f.remove(),850)}
function add(id,ev){const p=products.find(x=>x.id===id); if(!p||p.status==='off')return; const item=cart.find(i=>i.id===id); if(item)item.qty++; else cart.push({id:p.id,name:p.name,price:p.price,qty:1}); if(ev)flyToCart(p.icon,ev.clientX,ev.clientY); mascot('jump'); toast('Adicionado ao carrinho 🍫'); save();}
function remove(id){cart=cart.filter(i=>i.id!==id); save()}
function changeQty(id,d){const item=cart.find(i=>i.id===id); if(!item)return; item.qty+=d; if(item.qty<=0)remove(id); else save();}
function clearCart(){cart=[]; save(); toast('Carrinho limpo')}
function total(){let q=cart.reduce((s,i)=>s+i.qty,0), regular=cart.reduce((s,i)=>s+i.qty*i.price,0); const promo=Math.floor(q/3)*14 + (q%3)*5; return Math.min(regular,promo)}
function renderProducts(){const grid=$('#products'); if(!grid)return; grid.innerHTML=products.map(p=>`<div class="card ${p.status==='off'?'unavailable':''}"><div class="prodIcon">${p.icon}</div><h3>${p.name}</h3><p>${p.desc}</p><div class="price">R$ ${p.price.toFixed(2).replace('.',',')}</div>${p.status==='on'?`<button class="btn" onclick="add('${p.id}',event)">Adicionar</button>`:`<button class="btn ghost" disabled>Indisponível</button>`}</div>`).join('')}
function renderPromo(){const box=$('#promoFlavors'); if(!box)return; box.innerHTML=products.filter(p=>p.status==='on').map(p=>`<div class="flavorControl"><b>${p.icon} ${p.name.replace('Trufa de ','')}</b><div class="qty"><button onclick="promoQty('${p.id}',-1)">-</button><span id="promo-${p.id}">0</span><button onclick="promoQty('${p.id}',1)">+</button></div></div>`).join('')}
let promo={brigadeiro:0,oreo:0,maracuja:0,coco:0};
function promoQty(id,d){const sum=Object.values(promo).reduce((a,b)=>a+b,0); if(d>0&&sum>=3)return toast('A promoção tem 3 trufas.'); promo[id]=Math.max(0,promo[id]+d); $(`#promo-${id}`).textContent=promo[id]; $('#promoTotal').textContent=Object.values(promo).reduce((a,b)=>a+b,0)}
function addPromo(){if(Object.values(promo).reduce((a,b)=>a+b,0)!==3)return toast('Escolha exatamente 3 trufas.'); Object.entries(promo).forEach(([id,q])=>{for(let i=0;i<q;i++) add(id)}); promo={brigadeiro:0,oreo:0,maracuja:0,coco:0}; renderPromo(); $('#promoTotal').textContent='0'; toast('Promoção adicionada: 3 por R$14 🎉')}
function renderCart(){const q=cart.reduce((s,i)=>s+i.qty,0); $$('#cartCount').forEach(e=>e.textContent=q); const list=$('#cartList'); if(!list)return; list.innerHTML=cart.length?cart.map(i=>`<div class="cartItem"><div><b>${i.name}</b><br><small>R$ ${i.price.toFixed(2).replace('.',',')} cada</small></div><div><button onclick="changeQty('${i.id}',-1)">−</button> <b>${i.qty}</b> <button onclick="changeQty('${i.id}',1)">+</button><br><button onclick="remove('${i.id}')">remover</button></div></div>`).join(''):'<p>Seu carrinho está vazio.</p>'; $('#cartTotal').textContent='R$ '+total().toFixed(2).replace('.',',')}
function openCart(){ $('#drawer').classList.add('open'); $('#overlay').classList.add('show'); renderCart()}
function closeCart(){ $('#drawer').classList.remove('open'); $('#overlay').classList.remove('show')}
function showPay(){ if(!cart.length)return toast('Adicione produtos primeiro.'); $('#payment').style.display='block'; mascot('point'); setTimeout(()=>$('#payment').scrollIntoView({behavior:'smooth'}),100)}
function copyPix(){navigator.clipboard?.writeText(PIX_CODE); toast('Pix copia e cola copiado!')}
function finishOrder(){if(!cart.length)return toast('Carrinho vazio.'); const id='DE'+Date.now().toString().slice(-6); const pedido={id,items:cart,total:total(),status:'Recebido',created:new Date().toLocaleString('pt-BR')}; const orders=JSON.parse(localStorage.getItem('de_orders')||'[]'); orders.unshift(pedido); localStorage.setItem('de_orders',JSON.stringify(orders)); const itens=cart.map(i=>`• ${i.qty}x ${i.name}`).join('%0A'); const msg=`🍫 *NOVO PEDIDO - DOCE ENCANTO*%0A%0A🧾 *Pedido:* ${id}%0A${itens}%0A%0A💰 *Total:* R$ ${total().toFixed(2).replace('.',',')}%0A💳 *Pagamento:* Pix%0A📍 *Retirada:* Rua Aletes, 78 - Pindorama%0A%0A✨ Pedido finalizado pelo site da Doce Encanto.`; cart=[]; save(); mascot('jump'); window.open(`https://wa.me/${WHATSAPP}?text=${msg}`,'_blank')}
function contactWhats(){window.open(`https://wa.me/${WHATSAPP}`,'_blank')}
document.addEventListener('DOMContentLoaded',()=>{renderProducts();renderPromo();renderCart();});
