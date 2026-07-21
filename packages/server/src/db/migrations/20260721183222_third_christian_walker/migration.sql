CREATE TYPE "notification_category" AS ENUM('system', 'documents', 'finance', 'stock', 'commission', 'savings');--> statement-breakpoint
CREATE TYPE "notification_severity" AS ENUM('info', 'success', 'warning', 'danger');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY,
	"recipient_user_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"body" text NOT NULL,
	"category" "notification_category" DEFAULT 'system'::"notification_category" NOT NULL,
	"severity" "notification_severity" DEFAULT 'info'::"notification_severity" NOT NULL,
	"source_type" varchar(80),
	"source_id" varchar(100),
	"action_url" varchar(255),
	"dedupe_key" varchar(180),
	"metadata" jsonb,
	"read_at" timestamp,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_recipient_dedupe_idx" ON "notifications" ("recipient_user_id","dedupe_key");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id");