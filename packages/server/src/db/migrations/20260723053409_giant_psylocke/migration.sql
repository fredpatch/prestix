CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY,
	"event_code" varchar(80) NOT NULL UNIQUE,
	"label" varchar(180) NOT NULL,
	"description" text,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
