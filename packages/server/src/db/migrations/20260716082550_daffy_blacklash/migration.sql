ALTER TABLE "savings_transactions" ADD COLUMN "receipt_number" varchar(30);--> statement-breakpoint
ALTER TABLE "savings_transactions" ADD COLUMN "reversal_of_transaction_id" integer;--> statement-breakpoint
ALTER TABLE "savings_transactions" ALTER COLUMN "agent_id" DROP NOT NULL;