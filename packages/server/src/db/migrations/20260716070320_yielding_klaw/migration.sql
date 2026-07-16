CREATE TYPE "commission_edit_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "commission_edit_requests" (
	"id" serial PRIMARY KEY,
	"commission_transaction_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"reason" text NOT NULL,
	"proposed_changes" jsonb NOT NULL,
	"status" "commission_edit_status" DEFAULT 'pending'::"commission_edit_status" NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commission_edit_requests" ADD CONSTRAINT "commission_edit_requests_cydzbb7ASeyc_fkey" FOREIGN KEY ("commission_transaction_id") REFERENCES "commission_transactions"("id");--> statement-breakpoint
ALTER TABLE "commission_edit_requests" ADD CONSTRAINT "commission_edit_requests_requested_by_users_id_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "commission_edit_requests" ADD CONSTRAINT "commission_edit_requests_reviewed_by_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");