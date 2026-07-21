CREATE TYPE "mail_delivery_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "mail_outbox" (
	"id" serial PRIMARY KEY,
	"notification_id" integer,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"template_key" varchar(80) DEFAULT 'manual' NOT NULL,
	"status" "mail_delivery_status" DEFAULT 'pending'::"mail_delivery_status" NOT NULL,
	"source_type" varchar(80),
	"source_id" varchar(100),
	"message_id" varchar(255),
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_outbox" ADD CONSTRAINT "mail_outbox_notification_id_notifications_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id");