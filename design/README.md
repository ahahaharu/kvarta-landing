# design/ – референс макета «Кварта», вариант A

Источник – макет в Claude Design (десктоп 1440 и мобильная 390). Здесь облегчённая версия для разработки: скриншоты по секциям, токены и тексты. HTML макета сюда не кладём – он тяжёлый из-за inline-стилей и только тратит токены.

## Как пользоваться (для Claude Code)

- Верстаешь секцию – открой ТОЛЬКО её два скриншота: `screens/mobile-NN-*.png` и `screens/desktop-NN-*.png`.
- Цвета, шрифты, размеры, тени – из `tokens.md`. Не подбирай значения «на глаз» по картинке.
- Тексты, цены, alt – из `content.md`. Не придумывай свои формулировки.
- `screens/*-full.jpg` – общий вид страницы, открывать только при необходимости.
- Фото – не здесь, а сразу в `public/images/` (photo-1-hero.jpg … photo-7-shop.jpg, до 1800 px, JPEG). Номер фото = номер в `content.md`.

## Карта файлов

| № | Секция | Мобильная | Десктоп |
| --- | --- | --- | --- |
| 01 | Шапка | mobile-01-header.png | desktop-01-header.png |
| 02 | Hero | mobile-02-hero.png, mobile-first-screen.png | desktop-02-hero.png |
| 03 | Свежесть | mobile-03-freshness.png | desktop-03-freshness.png |
| 04 | Аня и Дмитрий | mobile-04-founders.png | desktop-04-founders.png |
| 05 | Кофе (ассортимент) | mobile-05-catalog.png | desktop-05-catalog.png |
| 06 | Подписка | mobile-06-subscription.png | desktop-06-subscription.png |
| 07 | Заявка + доставка | mobile-07-order.png | desktop-07-order.png |
| 08 | Подвал | mobile-08-footer.png | desktop-08-footer.png |

`mobile-first-screen.png` – первый экран iPhone (390×844) с нижней плашкой «Подписка 54 BYN / мес».

## Где ТЗ сознательно отличается от макета

- На макете мобильная плашка нарисована поверх первого экрана. В коде она появляется после hero и прячется, когда форма в зоне видимости.
- Бургер на мобильном открывает список якорей. Делаем без JS-библиотек: `<details>` или popover.
- `[Instagram]` в подвале – заглушка, ссылка вымышленная.
- Состояния формы (ошибка, отправка, успех) в макете не нарисованы – тексты в ТЗ, раздел 5.
