// Ошибки сервера: клиенту – только код, в лог – без номера и параметров запроса
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lead/route";
import { leadRequest, validLead } from "./helpers";

// Ошибка postgres.js несёт текст запроса и параметры – в них номер телефона
const dbError = Object.assign(new Error("connection refused"), {
  code: "ECONNREFUSED",
  query: "insert into leads ...",
  parameters: ["Анна", "+375291234567"],
});

vi.mock("@/db/client", () => ({
  getDb: () => {
    throw dbError;
  },
  closeDb: async () => {},
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function captureErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

describe("ошибки сервера", () => {
  it("БД недоступна → 500 без деталей, номер в логе только с маской", async () => {
    const errorLog = captureErrorLog();

    const response = await POST(leadRequest(validLead()));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "server" });

    const logged = errorLog.mock.calls.flat().join("\n");
    expect(logged).toContain("ECONNREFUSED");
    expect(logged).toContain("+375 29 ***-**-67");
    expect(logged).not.toContain("1234567");
    expect(logged).not.toContain("insert into");
  });

  it("нет IP_HASH_SALT в production → 500, причина в логе", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("IP_HASH_SALT", "");
    const errorLog = captureErrorLog();

    const response = await POST(leadRequest(validLead()));
    expect(response.status).toBe(500);
    expect(errorLog.mock.calls.flat().join("\n")).toContain("IP_HASH_SALT");
  });
});
