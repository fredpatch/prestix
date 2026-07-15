// Full Drizzle schema for M1-M12 lands here (Sprint 0, task: "Full Drizzle schema").
// Placeholder table below only proves the toolchain wires up end-to-end.

import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────

export const settingTypeEnum = pgEnum("setting_type", ["integer", "boolean", "text"]);

export const roleEnum = pgEnum("role", ["agent", "manager", "admin", "super_admin"]);
export const roleLevel = { agent: 1, manager: 2, admin: 3, super_admin: 4 } as const;

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "issued",
  "expired",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "mobile_money",
  "virement",
  "credit",
  "epargne",
]);

export const installmentStatusEnum = pgEnum("installment_status", ["unpaid", "partial", "paid"]);

export const ticketClassEnum = pgEnum("ticket_class", ["economy", "business", "first", "premium"]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", ["IN", "OUT", "ADJUST"]);

export const commissionTypeEnum = pgEnum("commission_type", [
  "mobile_money",
  "transfert_change",
  "visa",
  "location_voiture",
  "hebergement",
  "assurance_voyage",
  "canalplus",
]);

export const savingsTxnNatureEnum = pgEnum("savings_txn_nature", ["deposit", "withdraw"]);
export const savingsTxnStatusEnum = pgEnum("savings_txn_status", ["draft", "recorded"]);

export const creditUnderfeePolicyEnum = pgEnum("credit_underfee_policy", [
  "HOLD_AND_NOTIFY",
  "WAIVE_AND_CONVERT",
]);

// ─────────────────────────────────────────────────────────────────
// M1 — Auth
// ─────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("agent"),
    active: boolean("active").notNull().default(true),
    activatedAt: timestamp("activated_at"),
    firstLogin: boolean("first_login").notNull().default(true), // OTP required until password set
    otpHash: varchar("otp_hash", { length: 255 }),
    otpExpiresAt: timestamp("otp_expires_at"),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────
// M2 — Settings & Catalog
// ─────────────────────────────────────────────────────────────────

// Single-row business settings (id=1 enforced at app layer)
export const settings = pgTable(
  "settings",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 100 }).notNull(),
    value: text("value").notNull(),
    type: settingTypeEnum("type").notNull(),
    module: varchar("module", { length: 20 }).notNull(),
    description: text("description"),
    updatedBy: integer("updated_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    keyIdx: uniqueIndex("settings_key_idx").on(t.key),
  }),
);

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: serial("id").primaryKey(),
    moduleCode: varchar("module_code", { length: 50 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => ({
    moduleIdx: uniqueIndex("feature_flags_module_idx").on(t.moduleCode),
  }),
);

// Data-driven commission-type catalog (super_admin-extensible)
export const commissionTypeCatalog = pgTable(
  "commission_type_catalog",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 50 }).notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    icon: varchar("icon", { length: 50 }),
    active: boolean("active").notNull().default(true),
    fieldSchema: jsonb("field_schema"), // describes custom JSONB fields for this type
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: uniqueIndex("commission_type_catalog_code_idx").on(t.code),
  }),
);

// ─────────────────────────────────────────────────────────────────
// M4 — Document Engine
// ─────────────────────────────────────────────────────────────────

// Row-locked, continuous serial counters (INV-, PRO-)
export const counters = pgTable(
  "counters",
  {
    id: serial("id").primaryKey(),
    counterKey: varchar("counter_key", { length: 20 }).notNull(), // 'INV' | 'PRO'
    currentValue: integer("current_value").notNull().default(0),
  },
  (t) => ({
    keyIdx: uniqueIndex("counters_key_idx").on(t.counterKey),
  }),
);

export const proformas = pgTable(
  "proformas",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 30 }).notNull(),
    partyId: integer("party_id")
      .notNull()
      .references(() => parties.id),
    referrerPartyId: integer("referrer_party_id").references(() => parties.id),
    partySnapshot: jsonb("party_snapshot").notNull(),
    status: documentStatusEnum("status").notNull().default("draft"),
    expiresAt: timestamp("expires_at"), // set at issue, 48h expiry
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    numberIdx: uniqueIndex("proformas_number_idx").on(t.number),
  }),
);

export const proformaLines = pgTable("proforma_lines", {
  id: serial("id").primaryKey(),
  proformaId: integer("proforma_id")
    .notNull()
    .references(() => proformas.id),
  lineType: varchar("line_type", { length: 20 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proformaTicketDetails = pgTable("proforma_ticket_details", {
  id: serial("id").primaryKey(),
  proformaLineId: integer("proforma_line_id")
    .notNull()
    .references(() => proformaLines.id),
  travelClass: ticketClassEnum("travel_class").notNull(),
  passengerName: varchar("passenger_name", { length: 255 }).notNull(),
  segments: jsonb("segments").notNull(),
  references: jsonb("references"),
  supplierPrice: numeric("supplier_price", { precision: 12, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 30 }),
    proformaId: integer("proforma_id").references(() => proformas.id),
    partyId: integer("party_id")
      .notNull()
      .references(() => parties.id),
    referrerPartyId: integer("referrer_party_id").references(() => parties.id),
    partySnapshot: jsonb("party_snapshot").notNull(),
    status: documentStatusEnum("status").notNull().default("draft"),
    paymentStatus: installmentStatusEnum("payment_status").notNull().default("unpaid"),
    requestId: varchar("request_id", { length: 100 }), // issue() idempotency key
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    totalDiscount: numeric("total_discount", { precision: 12, scale: 2 }).notNull().default("0"),
    dueDate: date("due_date"),
    issuedAt: timestamp("issued_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
    cancelledBy: integer("cancelled_by").references(() => users.id),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    numberIdx: uniqueIndex("invoices_number_idx").on(t.number),
    requestIdx: uniqueIndex("invoices_request_id_idx").on(t.requestId),
  }),
);

// Generic line — ticket / shop / service; type-specific detail tables below
export const invoiceLines = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  lineType: varchar("line_type", { length: 20 }).notNull(), // 'ticket' | 'shop'
  description: varchar("description", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"), // M7, manager+, >=0, <= line amount
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryNotes = pgTable("delivery_notes", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 30 }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────
// M3 — Party & Credit ledger
// ─────────────────────────────────────────────────────────────────

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  isClient: boolean("is_client").notNull().default(false),
  isReferrer: boolean("is_referrer").notNull().default(false),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Append-only credit/avoir ledger — dated lots, FIFO consumption
export const creditLots = pgTable("credit_lots", {
  id: serial("id").primaryKey(),
  partyId: integer("party_id")
    .notNull()
    .references(() => parties.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(), // original lot amount
  remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  sourceInvoiceId: integer("source_invoice_id").references(() => invoices.id),
  decisionWindowExpiresAt: timestamp("decision_window_expires_at").notNull(),
  convertedAt: timestamp("converted_at"), // set when converted to épargne
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ledger entries against a lot: spend / refund / convert (append-only, audit trail)
export const creditLotEntries = pgTable("credit_lot_entries", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id")
    .notNull()
    .references(() => creditLots.id),
  entryType: varchar("entry_type", { length: 30 }).notNull(), // 'spend' | 'refund' | 'convert_to_epargne'
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  refType: varchar("ref_type", { length: 50 }), // e.g. 'INVOICE_PAYMENT'
  refId: varchar("ref_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────
// M5 — Payments & Échéancier
// ─────────────────────────────────────────────────────────────────

export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  sequence: integer("sequence").notNull(), // 1..3
  expectedDate: date("expected_date").notNull(),
  expectedAmount: numeric("expected_amount", { precision: 12, scale: 2 }).notNull(),
  status: installmentStatusEnum("status").notNull().default("unpaid"),
  rescheduledFrom: date("rescheduled_from"), // audit trail on reschedule
  rescheduledBy: integer("rescheduled_by").references(() => users.id),
  rescheduledReason: text("rescheduled_reason"),
});

// Append-only payment records
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  installmentId: integer("installment_id").references(() => installments.id), // target of allocation, nullable if FIFO-auto
  amountTendered: numeric("amount_tendered", { precision: 12, scale: 2 }).notNull(),
  amountApplied: numeric("amount_applied", { precision: 12, scale: 2 }).notNull(),
  changeGiven: numeric("change_given", { precision: 12, scale: 2 }).notNull().default("0"),
  creditedAmount: numeric("credited_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  method: paymentMethodEnum("method").notNull(),
  allocationTarget: varchar("allocation_target", { length: 20 }), // 'principal' | 'penalty' (M6)
  agentId: integer("agent_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────
// M6 — Pénalités
// ─────────────────────────────────────────────────────────────────

// One row per weekly accrual tick, keyed to (invoiceId, installmentId) — parallel independent streams
export const penalties = pgTable("penalties", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  installmentId: integer("installment_id")
    .notNull()
    .references(() => installments.id),
  amountXaf: numeric("amount_xaf", { precision: 12, scale: 2 }).notNull(), // snapshot of setting at accrual time
  graceWeeks: integer("grace_weeks").notNull().default(1), // snapshot of PENALTY_GRACE at accrual time,
  accruedAt: timestamp("accrued_at").defaultNow().notNull(),
  voidedAt: timestamp("voided_at"), // set on invoice cancellation
  voidedReason: text("voided_reason"),
});

// ─────────────────────────────────────────────────────────────────
// M8 — Billetterie (ticket line details)
// ─────────────────────────────────────────────────────────────────

export const ticketDetails = pgTable("ticket_details", {
  id: serial("id").primaryKey(),
  invoiceLineId: integer("invoice_line_id")
    .notNull()
    .references(() => invoiceLines.id),
  travelClass: ticketClassEnum("travel_class").notNull(),
  passengerName: varchar("passenger_name", { length: 255 }).notNull(),
  segments: jsonb("segments").notNull(), // [{from, to, date, flightNo, ...}]
  references: jsonb("references"), // booking refs etc.
  supplierPrice: numeric("supplier_price", { precision: 12, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull(),
});

// ─────────────────────────────────────────────────────────────────
// M9 — PrestiShop & Stock
// ─────────────────────────────────────────────────────────────────

export const stockArticles = pgTable("stock_articles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("unit"),
  defaultSellingPrice: numeric("default_selling_price", { precision: 12, scale: 2 }).notNull(),
  defaultSupplierPrice: numeric("default_supplier_price", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  minLevel: integer("min_level").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Current on-hand snapshot (derived from movements, but maintained for fast reads)
export const stockItems = pgTable(
  "stock_items",
  {
    id: serial("id").primaryKey(),
    articleId: integer("article_id")
      .notNull()
      .references(() => stockArticles.id),
    onHand: integer("on_hand").notNull().default(0),
  },
  (t) => ({
    articleIdx: uniqueIndex("stock_items_article_idx").on(t.articleId),
  }),
);

// Append-only movements — IN / OUT / ADJUST
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: serial("id").primaryKey(),
    articleId: integer("article_id")
      .notNull()
      .references(() => stockArticles.id),
    type: stockMovementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(), // signed: OUT negative, IN positive
    refType: varchar("ref_type", { length: 50 }), // idempotency guard e.g. 'SHOP_ORDER'
    refId: varchar("ref_id", { length: 50 }),
    isNegativeOverride: boolean("is_negative_override").notNull().default(false), // manager+ override flag
    agentId: integer("agent_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    idempotencyIdx: uniqueIndex("stock_movements_ref_idx").on(t.refType, t.refId),
  }),
);

export const shopDetails = pgTable("shop_details", {
  id: serial("id").primaryKey(),
  invoiceLineId: integer("invoice_line_id")
    .notNull()
    .references(() => invoiceLines.id),
  articleId: integer("article_id").references(() => stockArticles.id), // nullable — pure service item
  supplierPrice: numeric("supplier_price", { precision: 12, scale: 2 }).notNull().default("0"),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull(),
  passengerName: varchar("passenger_name", { length: 255 }), // dropdown or free-text
});

// ─────────────────────────────────────────────────────────────────
// M10 — Commission Divers
// ─────────────────────────────────────────────────────────────────

export const commissionTransactions = pgTable("commission_transactions", {
  id: serial("id").primaryKey(),
  type: commissionTypeEnum("type").notNull(),
  agentId: integer("agent_id")
    .notNull()
    .references(() => users.id),
  clientPartyId: integer("client_party_id").references(() => parties.id),
  referrerPartyId: integer("referrer_party_id").references(() => parties.id),
  date: date("date").notNull(),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }).notNull(), // manual, > 0
  details: jsonb("details"), // opérateur, fournisseur, visa type, période{start,end}, référence...
  active: boolean("active").notNull().default(true), // soft-delete
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────
// M11 — Épargne Voyage
// ─────────────────────────────────────────────────────────────────

export const savingsAccounts = pgTable(
  "savings_accounts",
  {
    id: serial("id").primaryKey(),
    partyId: integer("party_id")
      .notNull()
      .references(() => parties.id),
    currency: varchar("currency", { length: 3 }).notNull().default("XAF"),
    inscriptionFeeAmount: numeric("inscription_fee_amount", { precision: 12, scale: 2 }).notNull(), // snapshot at enroll
    subscriptionSource: varchar("subscription_source", { length: 20 }).notNull(), // 'direct' | 'credit_conversion'
    sourceCreditLotId: integer("source_credit_lot_id").references(() => creditLots.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    partyCurrencyIdx: uniqueIndex("savings_accounts_party_currency_idx").on(t.partyId, t.currency),
  }),
);

// Append-only ledger — balance always derived, never stored
export const savingsTransactions = pgTable("savings_transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => savingsAccounts.id),
  nature: savingsTxnNatureEnum("nature").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(), // server-computed amount*quantity
  status: savingsTxnStatusEnum("status").notNull().default("draft"),
  appliedToInvoiceId: integer("applied_to_invoice_id").references(() => invoices.id), // épargne-as-payment
  agentId: integer("agent_id")
    .notNull()
    .references(() => users.id),
  recordedAt: timestamp("recorded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
