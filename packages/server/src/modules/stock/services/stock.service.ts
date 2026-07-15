import { db } from "../../../db/index.js";
import { stockArticles, stockItems, stockMovements } from "../../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import type {
  CreateStockArticleParams,
  StockArticleView,
  StockMovementView,
  UpdateStockArticleParams,
} from "./stock.types.js";

interface RecordMovementParams {
  articleId: number;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  refType?: string;
  refId?: string;
  agentId: number;
  allowNegativeOverride: boolean;
}

async function toView(a: typeof stockArticles.$inferSelect): Promise<StockArticleView> {
  const [item] = await db.select().from(stockItems).where(eq(stockItems.articleId, a.id));
  return {
    id: a.id,
    name: a.name,
    unit: a.unit,
    defaultSellingPrice: a.defaultSellingPrice,
    defaultSupplierPrice: a.defaultSupplierPrice,
    minLevel: a.minLevel,
    active: a.active,
    onHand: item?.onHand ?? 0,
  };
}

export async function listStockArticles(includeInactive = false): Promise<StockArticleView[]> {
  const rows = includeInactive
    ? await db.select().from(stockArticles)
    : await db.select().from(stockArticles).where(eq(stockArticles.active, true));
  return Promise.all(rows.map(toView));
}

export async function getStockArticleById(id: number): Promise<StockArticleView> {
  const [row] = await db.select().from(stockArticles).where(eq(stockArticles.id, id));
  if (!row) throw new Error("STOCK_ARTICLE_NOT_FOUND");
  return toView(row);
}

// manager+ (route-gated) — creates the article AND its stock_items row (onHand
// starts at 0, first stock comes in via a restock IN movement).
export async function createStockArticle(
  params: CreateStockArticleParams,
  userId: number,
): Promise<StockArticleView> {
  const result = await db.transaction(async (tx) => {
    const [article] = await tx
      .insert(stockArticles)
      .values({
        name: params.name,
        unit: params.unit ?? "unit",
        defaultSellingPrice: params.defaultSellingPrice.toFixed(2),
        defaultSupplierPrice: (params.defaultSupplierPrice ?? 0).toFixed(2),
        minLevel: params.minLevel ?? 0,
      })
      .returning();

    await tx.insert(stockItems).values({ articleId: article.id, onHand: 0 });
    return article;
  });

  await logAudit({
    userId,
    action: "STOCK_ARTICLE_CREATED",
    entityType: "stock_articles",
    entityId: String(result.id),
    metadata: { name: result.name },
  });

  return toView(result);
}

export async function updateStockArticle(
  id: number,
  params: UpdateStockArticleParams,
  userId: number,
): Promise<StockArticleView> {
  const [existing] = await db.select().from(stockArticles).where(eq(stockArticles.id, id));
  if (!existing) throw new Error("STOCK_ARTICLE_NOT_FOUND");

  const updates: Partial<typeof stockArticles.$inferInsert> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.unit !== undefined) updates.unit = params.unit;
  if (params.defaultSellingPrice !== undefined)
    updates.defaultSellingPrice = params.defaultSellingPrice.toFixed(2);
  if (params.defaultSupplierPrice !== undefined)
    updates.defaultSupplierPrice = params.defaultSupplierPrice.toFixed(2);
  if (params.minLevel !== undefined) updates.minLevel = params.minLevel;

  const [updated] = await db
    .update(stockArticles)
    .set(updates)
    .where(eq(stockArticles.id, id))
    .returning();

  await logAudit({
    userId,
    action: "STOCK_ARTICLE_UPDATED",
    entityType: "stock_articles",
    entityId: String(id),
    metadata: updates,
  });

  return toView(updated);
}

// Soft-delete only — "stock article with movement history → soft-delete only" (M9 edge case).
export async function toggleStockArticleActive(
  id: number,
  active: boolean,
  userId: number,
): Promise<StockArticleView> {
  const [existing] = await db.select().from(stockArticles).where(eq(stockArticles.id, id));
  if (!existing) throw new Error("STOCK_ARTICLE_NOT_FOUND");

  const [updated] = await db
    .update(stockArticles)
    .set({ active })
    .where(eq(stockArticles.id, id))
    .returning();

  await logAudit({
    userId,
    action: active ? "STOCK_ARTICLE_ACTIVATED" : "STOCK_ARTICLE_DEACTIVATED",
    entityType: "stock_articles",
    entityId: String(id),
  });

  return toView(updated);
}

// M9's two distinct negative-stock rules live here as two different entry
// points, not one flag threaded through — manual ops NEVER go negative (no
// override exists for them at all); the issue()-triggered OUT is the only path
// that can ever carry an override, and only manager+ can set it.

// Manual IN/ADJUST — restock or correction. Always blocks negative, no override.
// Opens its own transaction — never called from inside another one.
export async function recordManualStockMovement(
  articleId: number,
  type: "IN" | "ADJUST",
  quantity: number,
  agentId: number,
): Promise<StockMovementView> {
  const result = await db.transaction((tx: any) =>
    recordMovementInTx(tx, { articleId, type, quantity, agentId, allowNegativeOverride: false }),
  );
  return finalizeMovement(result);
}

// Automatic OUT at issue() — the only path that can ever carry a negative
// override. MUST be called with the SAME tx as the invoice-issuance
// transaction (M9 spec: "inside THIS transaction, not as separate calls").
// Never opens its own transaction — that would repeat the exact
// cross-transaction risk already flagged for Sprint 12.
export async function recordShopSaleStockMovementInTx(
  tx: typeof db,
  articleId: number,
  quantity: number,
  refType: string,
  refId: string,
  agentId: number,
  allowNegativeOverride: boolean,
): Promise<StockMovementView> {
  const result = await recordMovementInTx(tx, {
    articleId,
    type: "OUT",
    quantity: -Math.abs(quantity),
    refType,
    refId,
    agentId,
    allowNegativeOverride,
  });
  return finalizeMovement(result, false); // audit logged separately after the OUTER transaction commits
}

async function recordMovementInTx(tx: typeof db, params: RecordMovementParams) {
  if (params.refType && params.refId) {
    const [existing] = await tx
      .select()
      .from(stockMovements)
      .where(
        and(eq(stockMovements.refType, params.refType), eq(stockMovements.refId, params.refId)),
      );
    if (existing) throw new Error("MOVEMENT_ALREADY_RECORDED");
  }

  const [item] = await tx
    .select()
    .from(stockItems)
    .where(eq(stockItems.articleId, params.articleId))
    .for("update");
  if (!item) throw new Error("STOCK_ARTICLE_NOT_FOUND");

  const newOnHand = item.onHand + params.quantity;
  const isNegative = newOnHand < 0;

  if (isNegative && !params.allowNegativeOverride) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  await tx
    .update(stockItems)
    .set({ onHand: newOnHand })
    .where(eq(stockItems.articleId, params.articleId));

  const [movement] = await tx
    .insert(stockMovements)
    .values({
      articleId: params.articleId,
      type: params.type,
      quantity: params.quantity,
      refType: params.refType,
      refId: params.refId,
      isNegativeOverride: isNegative && params.allowNegativeOverride,
      agentId: params.agentId,
    })
    .returning();

  return movement;
}

async function finalizeMovement(
  result: typeof stockMovements.$inferSelect,
  logNow = true,
): Promise<StockMovementView> {
  if (result.isNegativeOverride && logNow) {
    await logAudit({
      userId: result.agentId,
      action: "STOCK_NEGATIVE_OVERRIDE",
      entityType: "stock_movements",
      entityId: String(result.id),
      metadata: { articleId: result.articleId, quantity: result.quantity },
    });
  }

  return {
    id: result.id,
    articleId: result.articleId,
    type: result.type,
    quantity: result.quantity,
    refType: result.refType ?? undefined,
    refId: result.refId ?? undefined,
    isNegativeOverride: result.isNegativeOverride,
    agentId: result.agentId,
    createdAt: result.createdAt,
  };
}

export async function listMovementsForArticle(articleId: number): Promise<StockMovementView[]> {
  const rows = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.articleId, articleId));
  return rows.map((m) => ({
    id: m.id,
    articleId: m.articleId,
    type: m.type,
    quantity: m.quantity,
    refType: m.refType ?? undefined,
    refId: m.refId ?? undefined,
    isNegativeOverride: m.isNegativeOverride,
    agentId: m.agentId,
    createdAt: m.createdAt,
  }));
}

// M12 foundation — not displayed anywhere yet, just queryable for the future
// dashboard's "operational KPIs only, never revenue cards" requirement.
export async function listLowStockArticles(): Promise<StockArticleView[]> {
  const all = await listStockArticles(false);
  return all.filter((a) => a.onHand < a.minLevel);
}
