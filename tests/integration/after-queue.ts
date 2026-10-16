// after() из next/server работает только внутри запроса Next, а тесты зовут POST
// напрямую. Подменяем его очередью (setup.ts): задачи выполняются, когда тест
// вызовет runAfter(), – так видно, что ответ не ждал Telegram.
type Task = () => unknown;

const tasks: Task[] = [];

export function enqueueAfter(task: Task | Promise<unknown>): void {
  tasks.push(typeof task === "function" ? task : () => task);
}

export async function runAfter(): Promise<void> {
  while (tasks.length > 0) await tasks.shift()!();
}

export function clearAfter(): void {
  tasks.length = 0;
}
