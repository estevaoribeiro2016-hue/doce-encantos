import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main(){
  const products = [
    ['Trufa de Brigadeiro','trufa-brigadeiro','trufas',500,'AVAILABLE'],
    ['Trufa de Oreo','trufa-oreo','trufas',500,'AVAILABLE'],
    ['Trufa de Maracujá','trufa-maracuja','trufas',500,'AVAILABLE'],
    ['Trufa de Coco','trufa-coco','trufas',500,'AVAILABLE'],
    ['Trufa de Morango','trufa-morango','trufas',500,'UNAVAILABLE'],
    ['Trufa de Uva','trufa-uva','trufas',500,'UNAVAILABLE'],
  ] as const;
  for (const [name,slug,category,priceCents,status] of products){
    const p = await prisma.product.upsert({where:{slug},update:{name,category,priceCents,status},create:{name,slug,category,priceCents,status}});
    await prisma.stock.upsert({where:{productId:p.id},update:{quantity:20},create:{productId:p.id,quantity:20,minAlert:5}})
  }
  const promo = await prisma.promotion.upsert({where:{slug:'promocao-3-trufas'},update:{name:'🎁 Promoção 3 trufas',priceCents:1400,active:true},create:{slug:'promocao-3-trufas',name:'🎁 Promoção 3 trufas',priceCents:1400,active:true,description:'Escolha 3 trufas por R$ 14,00'}});
  const maracuja = await prisma.product.findUniqueOrThrow({where:{slug:'trufa-maracuja'}});
  await prisma.promotionItem.deleteMany({where:{promotionId:promo.id}});
  await prisma.promotionItem.create({data:{promotionId:promo.id,productId:maracuja.id,quantity:3}});
}
main().finally(()=>prisma.$disconnect());
