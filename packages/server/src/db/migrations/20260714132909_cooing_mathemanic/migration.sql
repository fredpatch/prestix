ALTER TABLE "invoices" ADD COLUMN "referrer_party_id" integer;--> statement-breakpoint
ALTER TABLE "proformas" ADD COLUMN "referrer_party_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_referrer_party_id_parties_id_fkey" FOREIGN KEY ("referrer_party_id") REFERENCES "parties"("id");--> statement-breakpoint
ALTER TABLE "proformas" ADD CONSTRAINT "proformas_referrer_party_id_parties_id_fkey" FOREIGN KEY ("referrer_party_id") REFERENCES "parties"("id");