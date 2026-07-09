const products=[
 {name:'Trufa de Brigadeiro',price:5,available:true,desc:'Recheio cremoso de brigadeiro com cobertura de chocolate.'},
 {name:'Trufa de Oreo',price:5,available:true,desc:'Creme suave com pedacinhos de Oreo.'},
 {name:'Trufa de Maracujá',price:5,available:true,desc:'Recheio azedinho e doce na medida certa.'},
 {name:'Trufa de Coco',price:5,available:true,desc:'Coco cremoso com chocolate artesanal.'},
 {name:'Trufa de Morango',price:5,available:false,desc:'Visível no cardápio, mas indisponível hoje.'},
 {name:'Trufa de Uva',price:5,available:false,desc:'Visível no cardápio, mas indisponível hoje.'}
];
let cart=JSON.parse(localStorage.getItem('de_cart')||'[]');
const money=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function save(){localStorage.setItem('de_cart',JSON.stringify(cart));renderCart()}
function renderProducts(){document.getElementById('productGrid').innerHTML=products.map((p,i)=>`<article class="card ${!p.available?'disabled':''}"><span class="badge ${p.available?'ok':'off'}">${p.available?'Disponível':'Indisponível'}</span><h3>${p.name}</h3><p>${p.desc}</p><div class="price">${money(p.price)}</div><button class="btn ${p.available?'pink':'primary'}" ${!p.available?'disabled':''} onclick="add(${i})">${p.available?'Adicionar ao carrinho':'Indisponível'}</button></article>`).join('')}
function add(i){cart.push(products[i]);save();openCart()}
function addPromo(){cart.push({name:'Promoção 3 trufas',price:14,available:true,desc:'Promoção especial'});save();openCart()}
function removeItem(i){cart.splice(i,1);save()}
function clearCart(){cart=[];save()}
function total(){return cart.reduce((s,p)=>s+p.price,0)}
function renderCart(){const box=document.getElementById('cartItems');box.innerHTML=cart.length?cart.map((p,i)=>`<div class="item"><span>${p.name}</span><b>${money(p.price)}</b><button onclick="removeItem(${i})">×</button></div>`).join(''):'<p>Seu carrinho está vazio.</p>';document.getElementById('cartTotal').textContent=money(total());togglePix()}
function openCart(){document.getElementById('cart').classList.add('open')}function closeCart(){document.getElementById('cart').classList.remove('open')}
function toggleAI(){document.getElementById('aiPanel').classList.toggle('open')}
function togglePix(){const p=document.getElementById('payment')?.value;const pix=document.getElementById('pixBox');if(pix)pix.style.display=p==='Pix'?'block':'none'}
function checkout(){if(!cart.length){alert('Adicione produtos ao carrinho primeiro.');return}const payment=document.getElementById('payment').value;const items=cart.map((p,i)=>`${i+1}. ${p.name} - ${money(p.price)}`).join('%0A');const msg=`Olá, Doce Encanto! Quero fazer um pedido:%0A%0A${items}%0A%0ATotal: ${money(total())}%0AForma de pagamento: ${payment}${payment==='Pix'?'%0AJá vi o QR Code Pix no site.':''}%0A%0ARetirada: Rua Aletes, 78, Pindorama - portão marrom.`;window.open(`https://wa.me/553192180872?text=${msg}`,'_blank')}
renderProducts();renderCart();
