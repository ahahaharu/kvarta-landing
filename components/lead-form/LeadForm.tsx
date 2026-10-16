"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ShortFull } from "@/components/ui/ShortFull";
import { captureAttribution, readAttribution } from "@/lib/attribution";
import { order, type Interest } from "@/lib/content";
import { callbackText } from "@/lib/lead/callback";
import {
  clearDraft,
  FORM_FIELDS,
  getStorage,
  loadDraft,
  saveDraft,
  validateField,
  validateForm,
  type FormErrors,
  type FormField,
} from "@/lib/lead/form";
import { formatByPhone, normalizeByPhone } from "@/lib/lead/phone";
import { createIdempotencyKey, submitLead } from "@/lib/lead/submit";
import { prefersReducedMotion } from "@/lib/motion";
import { nextComment, readPrefill } from "@/lib/prefill";
import { controlClasses, Field, fieldDescribedBy } from "./Field";
import { FormError, FormSuccess, type FormErrorReason } from "./FormStatus";
import { InterestChips } from "./InterestChips";

const { form } = order;

type Values = Record<FormField, string> & { interest: Interest };

// Дрожание поля с ошибкой при отправке (ТЗ, раздел 11): ±4 px за 250 мс
const SHAKE: Keyframe[] = [0, -4, 4, -4, 4, 0].map((x) => ({
  transform: `translateX(${x}px)`,
}));

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; reason: FormErrorReason }
  | {
      kind: "done";
      name: string;
      phone: string;
      duplicate: boolean;
      callback: string | null;
    };

const initialValues: Values = {
  name: "",
  phone: "",
  interest: "subscription",
  comment: "",
};

// Форма заявки (ТЗ, раздел 5): ошибки – на blur и при отправке, один запрос
// за раз, «Повторить» шлёт тот же idempotencyKey
export function LeadForm() {
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const fieldRefs = useRef<Partial<Record<FormField, HTMLElement | null>>>({});
  const honeypotRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef(0);
  const idempotencyKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const lastPrefilled = useRef("");

  // Время открытия формы, метки рекламы и черновик – только в браузере
  useEffect(() => {
    startedAt.current = Date.now();
    captureAttribution(
      location.href,
      document.referrer,
      getStorage("localStorage"),
      new Date(),
    );
    // sessionStorage есть только в браузере: в начальном состоянии черновик
    // разошёлся бы с HTML статической сборки при гидратации
    const draft = loadDraft(getStorage("sessionStorage"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setValues((v) => ({ ...v, ...draft }));
  }, []);

  useEffect(() => {
    saveDraft(getStorage("sessionStorage"), {
      name: values.name,
      phone: values.phone,
    });
  }, [values.name, values.phone]);

  // CTA на странице – ссылки на #order с data-interest / data-comment
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const prefill = readPrefill(event.target);
      if (!prefill) return;
      // Апдейтер React вызовет позже – прошлое значение берём заранее
      const previous = lastPrefilled.current;
      lastPrefilled.current = prefill.comment ?? "";
      setValues((v) => ({
        ...v,
        interest: prefill.interest,
        comment: nextComment(v.comment, previous, prefill.comment),
      }));
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function setField(field: FormField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    // Ошибка уже показана → пересчитываем на ходу, чтобы она ушла, как только поле исправлено
    if (errors[field]) {
      setErrors((e) => ({
        ...e,
        [field]: validateField(field, value) ?? undefined,
      }));
    }
  }

  function handleBlur(field: FormField) {
    let value = values[field];
    if (field === "phone") {
      // Мягкое форматирование вместо маски: вставка и автозаполнение не ломаются
      const normalized = normalizeByPhone(value);
      if (normalized) {
        value = formatByPhone(normalized);
        setValues((v) => ({ ...v, phone: value }));
      }
    }
    // Пустое поле, которое просто проскочили табом, не ругаем
    if (value.trim() === "" && !errors[field]) return;
    setErrors((e) => ({
      ...e,
      [field]: validateField(field, value) ?? undefined,
    }));
  }

  // Отправка не прошла из-за полей: фокус на первое, все ошибочные вздрагивают.
  // На blur не дрожим – человек уже ушёл к следующему полю
  function showInvalid(fieldErrors: FormErrors) {
    const invalid = FORM_FIELDS.filter((field) => fieldErrors[field]);
    if (invalid.length === 0) return;
    fieldRefs.current[invalid[0]]?.focus();
    if (prefersReducedMotion()) return;
    for (const field of invalid) {
      fieldRefs.current[field]?.animate(SHAKE, {
        duration: 250,
        easing: "ease-in-out",
      });
    }
  }

  async function handleSubmit() {
    if (inFlight.current) return;

    const fieldErrors = validateForm(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      setStatus({ kind: "idle" });
      showInvalid(fieldErrors);
      return;
    }

    inFlight.current = true;
    setStatus({ kind: "submitting" });
    idempotencyKey.current ??= createIdempotencyKey();

    const outcome = await submitLead({
      name: values.name.trim(),
      phone: values.phone,
      interest: values.interest,
      comment: values.comment.trim(),
      website: honeypotRef.current?.value ?? "",
      idempotencyKey: idempotencyKey.current,
      startedAt: startedAt.current,
      attribution: readAttribution(
        location.href,
        document.referrer,
        getStorage("localStorage"),
        new Date(),
      ),
    });
    inFlight.current = false;

    switch (outcome.kind) {
      case "success": {
        clearDraft(getStorage("sessionStorage"));
        const normalized = normalizeByPhone(values.phone);
        setStatus({
          kind: "done",
          name: values.name.trim(),
          phone: normalized ? formatByPhone(normalized) : values.phone,
          duplicate: outcome.duplicate,
          callback: callbackText(new Date()),
        });
        return;
      }
      case "validation":
        setErrors(outcome.fields);
        setStatus({ kind: "idle" });
        showInvalid(outcome.fields);
        return;
      default:
        setStatus({ kind: "error", reason: outcome.kind });
    }
  }

  if (status.kind === "done") {
    return (
      <FormSuccess
        name={status.name}
        phone={status.phone}
        duplicate={status.duplicate}
        callback={status.callback}
      />
    );
  }

  const submitting = status.kind === "submitting";
  const canRetry = status.kind === "error" && status.reason !== "rate_limited";

  const inputProps = (field: FormField, hint?: string) => ({
    id: `lead-${field}`,
    name: field,
    value: values[field],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(field, event.target.value),
    onBlur: () => handleBlur(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": fieldDescribedBy(`lead-${field}`, {
      hint,
      error: errors[field],
    }),
  });

  return (
    <form
      method="post"
      noValidate
      className="relative flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <Field id="lead-name" label={form.name.label} error={errors.name}>
        <input
          {...inputProps("name")}
          ref={(node) => {
            fieldRefs.current.name = node;
          }}
          type="text"
          autoComplete="given-name"
          placeholder={form.name.placeholder}
          className={`${controlClasses} h-14`}
        />
      </Field>

      <Field
        id="lead-phone"
        label={form.phone.label}
        hint={form.phone.hint}
        error={errors.phone}
      >
        <input
          {...inputProps("phone", form.phone.hint)}
          ref={(node) => {
            fieldRefs.current.phone = node;
          }}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={form.phone.placeholder}
          className={`${controlClasses} h-14`}
        />
      </Field>

      <InterestChips
        value={values.interest}
        onChange={(interest) => setValues((v) => ({ ...v, interest }))}
      />

      <Field
        id="lead-comment"
        label={form.comment.label}
        error={errors.comment}
      >
        <textarea
          {...inputProps("comment")}
          ref={(node) => {
            fieldRefs.current.comment = node;
          }}
          rows={3}
          placeholder={
            values.interest === "question"
              ? form.comment.placeholderQuestion
              : form.comment.placeholder
          }
          className={`${controlClasses} resize-y py-3`}
        />
      </Field>

      {/* Ловушка для ботов: вне экрана, вне порядка Tab и дерева доступности */}
      <div
        aria-hidden="true"
        className="absolute left-[-100vw] size-px overflow-hidden"
      >
        <label htmlFor="lead-website">{form.honeypot}</label>
        <input
          ref={honeypotRef}
          id="lead-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div>
        {status.kind === "error" && <FormError reason={status.reason} />}
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          // Мышь не уводит фокус из поля: иначе blur покажет ошибку над кнопкой,
          // кнопка съедет вниз, mouseup придётся мимо – и клик потеряется.
          // Ошибки и фокус после отправки расставит handleSubmit
          onMouseDown={(event) => event.preventDefault()}
          className={status.kind === "error" ? "mt-4 w-full" : "w-full"}
        >
          {submitting ? form.submitting : canRetry ? form.retry : form.submit}
        </Button>
        <p className="mt-4 text-sm text-brown">
          <ShortFull text={form.note} />
        </p>
        <p className="mt-2 text-sm text-brown">
          {form.consent.before}{" "}
          <a
            href={form.consent.href}
            className="underline decoration-1 underline-offset-2 hover:decoration-orange"
          >
            {form.consent.link}
          </a>
        </p>
      </div>
    </form>
  );
}
