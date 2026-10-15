CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"interest" text NOT NULL,
	"comment" text,
	"idempotency_key" uuid,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"click_id" text,
	"click_id_type" text,
	"referrer" text,
	"landing_url" text,
	"page_url" text,
	"first_seen_at" timestamp with time zone,
	"user_agent" text,
	"telegram_status" text DEFAULT 'pending' NOT NULL,
	"ip_hash" text NOT NULL,
	CONSTRAINT "leads_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "leads_interest_check" CHECK ("leads"."interest" in ('subscription', 'order', 'question')),
	CONSTRAINT "leads_telegram_status_check" CHECK ("leads"."telegram_status" in ('pending', 'sent', 'failed', 'skipped'))
);
--> statement-breakpoint
CREATE INDEX "leads_phone_created_at_idx" ON "leads" USING btree ("phone","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "leads_ip_hash_created_at_idx" ON "leads" USING btree ("ip_hash","created_at");