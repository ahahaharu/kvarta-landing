// Когда ждать звонка (ТЗ, раздел 5): по часам работы из content.ts
// и времени Минска, а не часам телефона.
import { business, order } from "@/lib/content";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type Hours = readonly {
  days: readonly string[];
  opens: string;
  closes: string;
}[];

function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

function minskClock(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return {
    weekday: WEEKDAYS.indexOf(part("weekday") ?? ""),
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

export type CallbackWindow =
  | { kind: "until"; time: string }
  | { kind: "after"; dayOffset: number; time: string };

export function callbackWindow(
  now: Date,
  hours: Hours = business.hours,
  timeZone: string = business.timeZone,
): CallbackWindow | null {
  const { weekday, minutes } = minskClock(now, timeZone);
  const hoursOn = (offset: number) =>
    hours.find((h) => h.days.includes(WEEKDAYS[(weekday + offset) % 7]!));

  const today = hoursOn(0);
  if (today) {
    if (minutes < toMinutes(today.opens)) {
      return { kind: "after", dayOffset: 0, time: today.opens };
    }
    if (minutes < toMinutes(today.closes)) {
      return { kind: "until", time: today.closes };
    }
  }
  for (let offset = 1; offset <= 7; offset++) {
    const day = hoursOn(offset);
    if (day) return { kind: "after", dayOffset: offset, time: day.opens };
  }
  return null;
}

/** «Перезвоним сегодня до 20:00» / «Перезвоним завтра после 10:00» */
export function callbackText(now: Date): string | null {
  const window = callbackWindow(now);
  if (!window) return null;
  const { status } = order.form;
  // «08:00» из часов для JSON-LD → «8:00», как в тексте страницы
  const time = window.time.replace(/^0(?=\d:)/, "");
  return window.kind === "until"
    ? status.callbackUntil(time)
    : status.callbackAfter(window.dayOffset, time);
}
