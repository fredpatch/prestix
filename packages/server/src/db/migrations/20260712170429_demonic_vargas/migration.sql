CREATE TYPE "commission_type" AS ENUM('mobile_money', 'transfert_change', 'visa', 'location_voiture', 'hebergement', 'assurance_voyage', 'canalplus');--> statement-breakpoint
CREATE TYPE "credit_underfee_policy" AS ENUM('HOLD_AND_NOTIFY', 'WAIVE_AND_CONVERT');--> statement-breakpoint
CREATE TYPE "document_status" AS ENUM('draft', 'issued', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "installment_status" AS ENUM('unpaid', 'partial', 'paid');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('cash', 'mobile_money', 'virement', 'credit', 'epargne');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('agent', 'manager', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "savings_txn_nature" AS ENUM('deposit', 'withdraw');--> statement-breakpoint
CREATE TYPE "savings_txn_status" AS ENUM('draft', 'recorded');--> statement-breakpoint
CREATE TYPE "setting_type" AS ENUM('integer', 'boolean', 'text');--> statement-breakpoint
CREATE TYPE "stock_movement_type" AS ENUM('IN', 'OUT', 'ADJUST');--> statement-breakpoint
CREATE TYPE "ticket_class" AS ENUM('economy', 'business', 'first', 'premium');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_transactions" (
	"id" serial PRIMARY KEY,
	"type" "commission_type" NOT NULL,
	"agent_id" integer NOT NULL,
	"client_party_id" integer,
	"referrer_party_id" integer,
	"date" date NOT NULL,
	"commission_amount" numeric(12,2) NOT NULL,
	"details" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_type_catalog" (
	"id" serial PRIMARY KEY,
	"code" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"icon" varchar(50),
	"active" boolean DEFAULT true NOT NULL,
	"field_schema" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"id" serial PRIMARY KEY,
	"counter_key" varchar(20) NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_lot_entries" (
	"id" serial PRIMARY KEY,
	"lot_id" integer NOT NULL,
	"entry_type" varchar(30) NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"ref_type" varchar(50),
	"ref_id" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_lots" (
	"id" serial PRIMARY KEY,
	"party_id" integer NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"remaining_amount" numeric(12,2) NOT NULL,
	"source_invoice_id" integer,
	"decision_window_expires_at" timestamp NOT NULL,
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_notes" (
	"id" serial PRIMARY KEY,
	"number" varchar(30),
	"invoice_id" integer NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY,
	"module_code" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installments" (
	"id" serial PRIMARY KEY,
	"invoice_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"expected_date" date NOT NULL,
	"expected_amount" numeric(12,2) NOT NULL,
	"status" "installment_status" DEFAULT 'unpaid'::"installment_status" NOT NULL,
	"rescheduled_from" date,
	"rescheduled_by" integer,
	"rescheduled_reason" text
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" serial PRIMARY KEY,
	"invoice_id" integer NOT NULL,
	"line_type" varchar(20) NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"discount" numeric(12,2) DEFAULT '0' NOT NULL,
	"line_total" numeric(12,2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY,
	"number" varchar(30),
	"proforma_id" integer,
	"party_id" integer NOT NULL,
	"party_snapshot" jsonb NOT NULL,
	"status" "document_status" DEFAULT 'draft'::"document_status" NOT NULL,
	"request_id" varchar(100),
	"total_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"total_discount" numeric(12,2) DEFAULT '0' NOT NULL,
	"due_date" date,
	"issued_at" timestamp,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"cancelled_by" integer,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" serial PRIMARY KEY,
	"code" varchar(30),
	"full_name" varchar(255) NOT NULL,
	"is_client" boolean DEFAULT false NOT NULL,
	"is_referrer" boolean DEFAULT false NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"address" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"invoice_id" integer NOT NULL,
	"installment_id" integer,
	"amount_tendered" numeric(12,2) NOT NULL,
	"amount_applied" numeric(12,2) NOT NULL,
	"change_given" numeric(12,2) DEFAULT '0' NOT NULL,
	"credited_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"method" "payment_method" NOT NULL,
	"allocation_target" varchar(20),
	"agent_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penalties" (
	"id" serial PRIMARY KEY,
	"invoice_id" integer NOT NULL,
	"installment_id" integer NOT NULL,
	"amount_xaf" numeric(12,2) NOT NULL,
	"accrued_at" timestamp DEFAULT now() NOT NULL,
	"voided_at" timestamp,
	"voided_reason" text
);
--> statement-breakpoint
CREATE TABLE "proformas" (
	"id" serial PRIMARY KEY,
	"number" varchar(30) NOT NULL,
	"party_id" integer NOT NULL,
	"party_snapshot" jsonb NOT NULL,
	"status" "document_status" DEFAULT 'draft'::"document_status" NOT NULL,
	"expires_at" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_accounts" (
	"id" serial PRIMARY KEY,
	"party_id" integer NOT NULL,
	"inscription_fee_amount" numeric(12,2) NOT NULL,
	"subscription_source" varchar(20) NOT NULL,
	"source_credit_lot_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_transactions" (
	"id" serial PRIMARY KEY,
	"account_id" integer NOT NULL,
	"nature" "savings_txn_nature" NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_amount" numeric(12,2) NOT NULL,
	"status" "savings_txn_status" DEFAULT 'draft'::"savings_txn_status" NOT NULL,
	"applied_to_invoice_id" integer,
	"agent_id" integer NOT NULL,
	"recorded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"type" "setting_type" NOT NULL,
	"module" varchar(20) NOT NULL,
	"description" text,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_details" (
	"id" serial PRIMARY KEY,
	"invoice_line_id" integer NOT NULL,
	"article_id" integer,
	"supplier_price" numeric(12,2) DEFAULT '0' NOT NULL,
	"selling_price" numeric(12,2) NOT NULL,
	"passenger_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "stock_articles" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"unit" varchar(20) DEFAULT 'unit' NOT NULL,
	"default_selling_price" numeric(12,2) NOT NULL,
	"default_supplier_price" numeric(12,2) DEFAULT '0' NOT NULL,
	"min_level" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_items" (
	"id" serial PRIMARY KEY,
	"article_id" integer NOT NULL,
	"on_hand" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY,
	"article_id" integer NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"ref_type" varchar(50),
	"ref_id" varchar(50),
	"is_negative_override" boolean DEFAULT false NOT NULL,
	"agent_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_details" (
	"id" serial PRIMARY KEY,
	"invoice_line_id" integer NOT NULL,
	"travel_class" "ticket_class" NOT NULL,
	"passenger_name" varchar(255) NOT NULL,
	"segments" jsonb NOT NULL,
	"references" jsonb,
	"supplier_price" numeric(12,2) NOT NULL,
	"selling_price" numeric(12,2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"full_name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'agent'::"role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"activated_at" timestamp,
	"first_login" boolean DEFAULT true NOT NULL,
	"otp_hash" varchar(255),
	"otp_expires_at" timestamp,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "commission_type_catalog_code_idx" ON "commission_type_catalog" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "counters_key_idx" ON "counters" ("counter_key");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flags_module_idx" ON "feature_flags" ("module_code");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_idx" ON "invoices" ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_request_id_idx" ON "invoices" ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proformas_number_idx" ON "proformas" ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "savings_accounts_party_idx" ON "savings_accounts" ("party_id");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_key_idx" ON "settings" ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_items_article_idx" ON "stock_items" ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_movements_ref_idx" ON "stock_movements" ("ref_type","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_agent_id_users_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_client_party_id_parties_id_fkey" FOREIGN KEY ("client_party_id") REFERENCES "parties"("id");--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_referrer_party_id_parties_id_fkey" FOREIGN KEY ("referrer_party_id") REFERENCES "parties"("id");--> statement-breakpoint
ALTER TABLE "credit_lot_entries" ADD CONSTRAINT "credit_lot_entries_lot_id_credit_lots_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "credit_lots"("id");--> statement-breakpoint
ALTER TABLE "credit_lots" ADD CONSTRAINT "credit_lots_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id");--> statement-breakpoint
ALTER TABLE "delivery_notes" ADD CONSTRAINT "delivery_notes_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_rescheduled_by_users_id_fkey" FOREIGN KEY ("rescheduled_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_proforma_id_proformas_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "proformas"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cancelled_by_users_id_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_installment_id_installments_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "installments"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_agent_id_users_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_installment_id_installments_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "installments"("id");--> statement-breakpoint
ALTER TABLE "proformas" ADD CONSTRAINT "proformas_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id");--> statement-breakpoint
ALTER TABLE "proformas" ADD CONSTRAINT "proformas_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id");--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_source_credit_lot_id_credit_lots_id_fkey" FOREIGN KEY ("source_credit_lot_id") REFERENCES "credit_lots"("id");--> statement-breakpoint
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_account_id_savings_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "savings_accounts"("id");--> statement-breakpoint
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_applied_to_invoice_id_invoices_id_fkey" FOREIGN KEY ("applied_to_invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_agent_id_users_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "shop_details" ADD CONSTRAINT "shop_details_invoice_line_id_invoice_lines_id_fkey" FOREIGN KEY ("invoice_line_id") REFERENCES "invoice_lines"("id");--> statement-breakpoint
ALTER TABLE "shop_details" ADD CONSTRAINT "shop_details_article_id_stock_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "stock_articles"("id");--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_article_id_stock_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "stock_articles"("id");--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_article_id_stock_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "stock_articles"("id");--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_agent_id_users_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ticket_details" ADD CONSTRAINT "ticket_details_invoice_line_id_invoice_lines_id_fkey" FOREIGN KEY ("invoice_line_id") REFERENCES "invoice_lines"("id");