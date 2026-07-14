CREATE TABLE "proforma_lines" (
	"id" serial PRIMARY KEY,
	"proforma_id" integer NOT NULL,
	"line_type" varchar(20) NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"discount" numeric(12,2) DEFAULT '0' NOT NULL,
	"line_total" numeric(12,2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proforma_lines" ADD CONSTRAINT "proforma_lines_proforma_id_proformas_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "proformas"("id");