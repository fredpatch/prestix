CREATE TABLE "proforma_shop_details" (
	"id" serial PRIMARY KEY,
	"proforma_line_id" integer NOT NULL,
	"article_id" integer,
	"supplier_price" numeric(12,2) DEFAULT '0' NOT NULL,
	"selling_price" numeric(12,2) NOT NULL,
	"passenger_name" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "proforma_shop_details" ADD CONSTRAINT "proforma_shop_details_proforma_line_id_proforma_lines_id_fkey" FOREIGN KEY ("proforma_line_id") REFERENCES "proforma_lines"("id");--> statement-breakpoint
ALTER TABLE "proforma_shop_details" ADD CONSTRAINT "proforma_shop_details_article_id_stock_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "stock_articles"("id");