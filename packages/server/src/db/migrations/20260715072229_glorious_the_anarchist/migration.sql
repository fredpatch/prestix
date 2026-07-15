CREATE TABLE "proforma_ticket_details" (
	"id" serial PRIMARY KEY,
	"proforma_line_id" integer NOT NULL,
	"travel_class" "ticket_class" NOT NULL,
	"passenger_name" varchar(255) NOT NULL,
	"segments" jsonb NOT NULL,
	"references" jsonb,
	"supplier_price" numeric(12,2) NOT NULL,
	"selling_price" numeric(12,2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proforma_ticket_details" ADD CONSTRAINT "proforma_ticket_details_proforma_line_id_proforma_lines_id_fkey" FOREIGN KEY ("proforma_line_id") REFERENCES "proforma_lines"("id");