ALTER TABLE "penalties" ADD COLUMN "grace_weeks" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD COLUMN "currency" varchar(3) DEFAULT 'XAF' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "savings_accounts_party_currency_idx" ON "savings_accounts" ("party_id","currency");--> statement-breakpoint
ALTER TABLE "credit_lots" ADD CONSTRAINT "credit_lots_source_invoice_id_invoices_id_fkey" FOREIGN KEY ("source_invoice_id") REFERENCES "invoices"("id");