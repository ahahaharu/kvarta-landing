// Миграции в kvarta_test – только когда сервер поднимаем сами. Превью-деплой
// (PLAYWRIGHT_BASE_URL) пишет в свою базу, её не трогаем
import migrateTestDatabase from "../integration/global-setup";

export default async function setup() {
  if (process.env.PLAYWRIGHT_BASE_URL) return;
  await migrateTestDatabase();
}
