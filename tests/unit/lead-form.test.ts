import { describe, expect, it } from "vitest";
import { order } from "@/lib/content";
import { callbackText, callbackWindow } from "@/lib/lead/callback";
import {
  DRAFT_STORAGE_KEY,
  loadDraft,
  saveDraft,
  validateField,
  validateForm,
} from "@/lib/lead/form";
import { isInterest, nextComment } from "@/lib/prefill";

const errors = order.form.errors;

describe("validateForm", () => {
  it("passes a valid lead", () => {
    expect(
      validateForm({ name: "Анна", phone: "8 029 123 45 67", comment: "" }),
    ).toEqual({});
  });

  it("returns texts for every invalid field", () => {
    expect(
      validateForm({
        name: " ",
        phone: "+375 17 123-45-67",
        comment: "к".repeat(501),
      }),
    ).toEqual({
      name: errors.name,
      phone: errors.phone,
      comment: errors.comment,
    });
  });

  it("validates one field on blur", () => {
    expect(validateField("phone", "291234567")).toBeNull();
    expect(validateField("name", "А")).toBe(errors.name);
  });
});

describe("draft", () => {
  function memoryStorage() {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    };
  }

  it("round-trips name and phone", () => {
    const storage = memoryStorage();
    saveDraft(storage, { name: "Анна", phone: "+375 29" });
    expect(loadDraft(storage)).toEqual({ name: "Анна", phone: "+375 29" });
  });

  it("removes an empty draft", () => {
    const storage = memoryStorage();
    saveDraft(storage, { name: "Анна", phone: "" });
    saveDraft(storage, { name: "", phone: "" });
    expect(storage.data.has(DRAFT_STORAGE_KEY)).toBe(false);
  });

  it("survives broken data and unavailable storage", () => {
    const storage = memoryStorage();
    storage.setItem(DRAFT_STORAGE_KEY, '{"name":1}');
    expect(loadDraft(storage)).toEqual({ name: "", phone: "" });
    storage.setItem(DRAFT_STORAGE_KEY, "{oops");
    expect(loadDraft(storage)).toBeNull();

    const throwing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(loadDraft(throwing)).toBeNull();
    expect(() => saveDraft(throwing, { name: "А", phone: "" })).not.toThrow();
    expect(loadDraft(null)).toBeNull();
  });
});

describe("callbackWindow", () => {
  // Минск – UTC+3 круглый год; 16.10.2026 – пятница
  const minsk = (date: string, time: string) =>
    new Date(`${date}T${time}:00+03:00`);

  it.each([
    [
      "пт до открытия",
      minsk("2026-10-16", "07:30"),
      "Перезвоним сегодня после 8:00",
    ],
    [
      "пт в рабочее время",
      minsk("2026-10-16", "12:00"),
      "Перезвоним сегодня до 20:00",
    ],
    [
      "пт после закрытия",
      minsk("2026-10-16", "20:00"),
      "Перезвоним завтра после 10:00",
    ],
    [
      "сб до открытия",
      minsk("2026-10-17", "09:59"),
      "Перезвоним сегодня после 10:00",
    ],
    [
      "сб в рабочее время",
      minsk("2026-10-17", "17:59"),
      "Перезвоним сегодня до 18:00",
    ],
    [
      "вс после закрытия",
      minsk("2026-10-18", "23:30"),
      "Перезвоним завтра после 8:00",
    ],
    [
      "пн ночью по UTC – уже утро в Минске",
      new Date("2026-10-19T05:30:00Z"),
      "Перезвоним сегодня до 20:00",
    ],
  ])("%s", (_case, now, expected) => {
    expect(callbackText(now)).toBe(expected);
  });

  it("skips days without hours", () => {
    const weekdaysOnly = [
      {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "20:00",
      },
    ];
    expect(
      callbackWindow(
        minsk("2026-10-17", "12:00"),
        weekdaysOnly,
        "Europe/Minsk",
      ),
    ).toEqual({ kind: "after", dayOffset: 2, time: "08:00" });
  });
});

describe("prefill", () => {
  it("accepts only known interests", () => {
    expect(isInterest("order")).toBe(true);
    expect(isInterest("toString")).toBe(false);
    expect(isInterest(undefined)).toBe(false);
  });

  it.each([
    [
      "fills an empty comment",
      "",
      "",
      "Колумбия Уила, 250 г",
      "Колумбия Уила, 250 г",
    ],
    [
      "replaces the previous CTA comment",
      "Эфиопия",
      "Эфиопия",
      "Колумбия",
      "Колумбия",
    ],
    ["clears the previous CTA comment", "Эфиопия", "Эфиопия", undefined, ""],
    [
      "keeps text the person typed",
      "Молотый под турку",
      "",
      "Колумбия",
      "Молотый под турку",
    ],
    [
      "keeps an edited CTA comment",
      "Эфиопия, 2 пачки",
      "Эфиопия",
      "Колумбия",
      "Эфиопия, 2 пачки",
    ],
  ])("%s", (_case, current, last, incoming, expected) => {
    expect(nextComment(current, last, incoming)).toBe(expected);
  });
});
