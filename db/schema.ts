// Таблица заявок (ТЗ, раздел 7). Номер – уже нормализованный `+375XXXXXXXXX`,
// IP не храним – только ip_hash для лимита заявок.
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    interest: text("interest").notNull(),
    comment: text("comment"),
    idempotencyKey: uuid("idempotency_key").unique(),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    clickId: text("click_id"),
    clickIdType: text("click_id_type"),
    referrer: text("referrer"),
    landingUrl: text("landing_url"),
    pageUrl: text("page_url"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }),
    userAgent: text("user_agent"),
    telegramStatus: text("telegram_status").notNull().default("pending"),
    ipHash: text("ip_hash").notNull(),
  },
  (t) => [
    check(
      "leads_interest_check",
      sql`${t.interest} in ('subscription', 'order', 'question')`,
    ),
    check(
      "leads_telegram_status_check",
      sql`${t.telegramStatus} in ('pending', 'sent', 'failed', 'skipped')`,
    ),
    // Под проверку дублей: тот же номер за последние 10 минут
    index("leads_phone_created_at_idx").on(t.phone, t.createdAt.desc()),
    // Под лимит: заявки с одного IP за последний час
    index("leads_ip_hash_created_at_idx").on(t.ipHash, t.createdAt),
  ],
);

export type LeadRow = typeof leads.$inferSelect;
export type NewLeadRow = typeof leads.$inferInsert;
