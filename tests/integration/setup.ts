// Для каждого integration-файла: after() кладёт задачу в очередь, а не бросает
import { beforeEach, vi } from "vitest";
import { clearAfter, enqueueAfter } from "./after-queue";

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: enqueueAfter,
}));

beforeEach(clearAfter);
