export interface StockArticleView {
  id: number;
  name: string;
  unit: string;
  defaultSellingPrice: string;
  defaultSupplierPrice: string;
  minLevel: number;
  active: boolean;
  onHand: number;
}

export interface CreateStockArticleParams {
  name: string;
  unit?: string;
  defaultSellingPrice: number;
  defaultSupplierPrice?: number;
  minLevel?: number;
}

export interface UpdateStockArticleParams {
  name?: string;
  unit?: string;
  defaultSellingPrice?: number;
  defaultSupplierPrice?: number;
  minLevel?: number;
}

export interface StockMovementView {
  id: number;
  articleId: number;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  refType?: string;
  refId?: string;
  isNegativeOverride: boolean;
  agentId: number;
  createdAt: Date;
}
