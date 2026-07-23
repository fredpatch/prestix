CREATE TYPE "party_type" AS ENUM('individual', 'company');--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "party_type" "party_type" DEFAULT 'individual'::"party_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "trade_name" varchar(255);--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "tax_id" varchar(50);