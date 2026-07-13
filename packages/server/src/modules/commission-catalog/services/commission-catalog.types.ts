export interface CommissionTypeView {
  id: number;
  code: string;
  label: string;
  icon?: string;
  active: boolean;
  fieldSchema?: unknown;
  createdAt: Date;
}

export interface CreateCommissionTypeParams {
  code: string;
  label: string;
  icon?: string;
  fieldSchema?: unknown;
  createdByUserId: number;
}

export interface UpdateCommissionTypeParams {
  label?: string;
  icon?: string;
  fieldSchema?: unknown;
  updatedByUserId: number;
}
