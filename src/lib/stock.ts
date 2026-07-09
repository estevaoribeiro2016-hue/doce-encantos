import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;
export type StockNeed = { productId: string; quantity: number };

export function mergeNeeds(needs: StockNeed[]) {
  const map = new Map<string, number>();
  for (const n of needs) map.set(n.productId, (map.get(n.productId) ?? 0) + n.quantity);
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export async function getPromotionNeeds(tx: Tx, promotionId: string, quantity: number) {
  const items = await tx.promotionItem.findMany({ where: { promotionId }, include: { product: true } });
  return items.map(i => ({ productId: i.productId, quantity: i.quantity * quantity }));
}

export async function assertStock(tx: Tx, needs: StockNeed[]) {
  const merged = mergeNeeds(needs);
  for (const need of merged) {
    const stock = await tx.stock.findUnique({ where: { productId: need.productId }, include: { product: true } });
    if (!stock || stock.quantity < need.quantity || stock.product.status !== 'AVAILABLE') {
      throw new Error(`Estoque insuficiente para ${stock?.product.name ?? 'produto'}. Disponível: ${stock?.quantity ?? 0}, necessário: ${need.quantity}.`);
    }
  }
}

export async function subtractStock(tx: Tx, needs: StockNeed[], orderId: string) {
  const merged = mergeNeeds(needs);
  for (const need of merged) {
    const stock = await tx.stock.findUniqueOrThrow({ where: { productId: need.productId } });
    if (stock.quantity < need.quantity) throw new Error('Estoque insuficiente.');
    const updated = await tx.stock.update({ where: { id: stock.id }, data: { quantity: stock.quantity - need.quantity } });
    await tx.stockMovement.create({ data: { stockId: stock.id, productId: need.productId, type: 'SALE', quantity: -need.quantity, beforeQty: stock.quantity, afterQty: updated.quantity, reason: 'Pedido finalizado', orderId } });
  }
}

export async function restoreStock(tx: Tx, orderId: string) {
  const exits = await tx.stockMovement.findMany({ where: { orderId, type: 'SALE' } });
  for (const m of exits) {
    const stock = await tx.stock.findUniqueOrThrow({ where: { productId: m.productId } });
    const restoreQty = Math.abs(m.quantity);
    const updated = await tx.stock.update({ where: { id: stock.id }, data: { quantity: stock.quantity + restoreQty } });
    await tx.stockMovement.create({ data: { stockId: stock.id, productId: m.productId, type: 'RESERVATION_CANCEL', quantity: restoreQty, beforeQty: stock.quantity, afterQty: updated.quantity, reason: 'Pedido cancelado: estoque devolvido', orderId } });
  }
}
