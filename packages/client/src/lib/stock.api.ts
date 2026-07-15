import api from "./axios";

export interface StockArticle {
  id: number;
  name: string;
  unit: string;
  defaultSellingPrice: string;
  defaultSupplierPrice: string;
  minLevel: number;
  active: boolean;
  onHand: number;
}

export interface StockMovement {
  id: number;
  articleId: number;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  refType?: string;
  refId?: string;
  isNegativeOverride: boolean;
  agentId: number;
  createdAt: string;
}

export const stockApi = {
  list: (includeInactive = false) =>
    api.get<StockArticle[]>("/stock", { params: { includeInactive } }),
  getById: (id: number) => api.get<StockArticle>(`/stock/${id}`),
  create: (data: {
    name: string;
    unit?: string;
    defaultSellingPrice: number;
    defaultSupplierPrice?: number;
    minLevel?: number;
  }) => api.post<StockArticle>("/stock", data),
  update: (
    id: number,
    data: Partial<{
      name: string;
      unit: string;
      defaultSellingPrice: number;
      defaultSupplierPrice: number;
      minLevel: number;
    }>,
  ) => api.patch<StockArticle>(`/stock/${id}`, data),
  toggleActive: (id: number, active: boolean) =>
    api.patch<StockArticle>(`/stock/${id}/active`, { active }),
  restock: (id: number, type: "IN" | "ADJUST", quantity: number) =>
    api.post<StockMovement>(`/stock/${id}/restock`, { type, quantity }),
  listMovements: (id: number) => api.get<StockMovement[]>(`/stock/${id}/movements`),
};
