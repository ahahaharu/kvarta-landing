// Запись заявки (ТЗ, разделы 6, 10): дедуп, лимит по IP и INSERT в одной транзакции.
import { and, asc, count, desc, eq, gt, or, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { leads } from "@/db/schema";
import type { Lead } from "./schema";

export const DUPLICATE_WINDOW_MINUTES = 10;
export const RATE_LIMIT_PER_HOUR = 5;

// Пространства ключей advisory lock: хеш IP и хеш номера не пересекаются
const LOCK_IP = 1;
const LOCK_PHONE = 2;

export type LeadMeta = {
  ipHash: string;
  userAgent: string | null;
};

export type CreateLeadResult =
  | { kind: "created"; id: string }
  | { kind: "duplicate"; id: string }
  | { kind: "rate_limited" };

function minutesAgo(minutes: number) {
  return sql`now() - make_interval(mins => ${minutes})`;
}

/**
 * Блокировки сериализуют только запросы с тем же IP или тем же номером и
 * снимаются в конце транзакции. Без них два запроса от двойного клика оба
 * увидят «дублей нет» и оба вставят строку. Порядок всегда IP → номер,
 * поэтому взаимной блокировки нет.
 *
 * Сначала дубль, потом лимит: повтор той же заявки – 200, а не 429.
 */
export async function createLead(
  db: Db,
  lead: Lead,
  meta: LeadMeta,
): Promise<CreateLeadResult> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${LOCK_IP}, hashtext(${meta.ipHash}))`,
    );
    await tx.execute(
      sql`select pg_advisory_xact_lock(${LOCK_PHONE}, hashtext(${lead.phone}))`,
    );

    const sameKey = eq(leads.idempotencyKey, lead.idempotencyKey);
    const [existing] = await tx
      .select({ id: leads.id })
      .from(leads)
      .where(
        or(
          sameKey,
          and(
            eq(leads.phone, lead.phone),
            gt(leads.createdAt, minutesAgo(DUPLICATE_WINDOW_MINUTES)),
          ),
        ),
      )
      // Совпал ключ – это та же отправка; иначе отдаём id первой заявки
      .orderBy(desc(sameKey), asc(leads.createdAt))
      .limit(1);
    if (existing) return { kind: "duplicate", id: existing.id };

    const [recent] = await tx
      .select({ total: count() })
      .from(leads)
      .where(
        and(eq(leads.ipHash, meta.ipHash), gt(leads.createdAt, minutesAgo(60))),
      );
    if ((recent?.total ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return { kind: "rate_limited" };
    }

    const a = lead.attribution;
    const [inserted] = await tx
      .insert(leads)
      .values({
        name: lead.name,
        phone: lead.phone,
        interest: lead.interest,
        comment: lead.comment || null,
        idempotencyKey: lead.idempotencyKey,
        utmSource: a.utm_source,
        utmMedium: a.utm_medium,
        utmCampaign: a.utm_campaign,
        utmContent: a.utm_content,
        utmTerm: a.utm_term,
        clickId: a.click_id,
        clickIdType: a.click_id_type,
        referrer: a.referrer,
        landingUrl: a.landing_url,
        pageUrl: a.page_url,
        firstSeenAt: a.first_seen_at ? new Date(a.first_seen_at) : null,
        userAgent: meta.userAgent,
        ipHash: meta.ipHash,
      })
      // Тот же ключ с другим номером: блокировки разные, решает уникальный индекс
      .onConflictDoNothing({ target: leads.idempotencyKey })
      .returning({ id: leads.id });
    if (inserted) return { kind: "created", id: inserted.id };

    const [byKey] = await tx
      .select({ id: leads.id })
      .from(leads)
      .where(sameKey)
      .limit(1);
    if (!byKey) throw new Error("Lead conflict without a matching row");
    return { kind: "duplicate", id: byKey.id };
  });
}
