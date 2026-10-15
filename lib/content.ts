// Единственный источник текстов, цен, адреса и часов (design/content.md, ТЗ разделы 4–5).
// Типографика: тире «–», кавычки «», неразрывный пробел перед BYN, «г» и «кг».
// Заголовки хранятся в обычном регистре – верхний регистр задаёт CSS.
// { full, short } – текст, который на мобильной короче, чем на десктопе.

const NBSP = " ";

export const CURRENCY = "BYN";

export function formatPrice(value: number): string {
  return `${value}${NBSP}${CURRENCY}`;
}

export const interestLabels = {
  subscription: "Подписка",
  order: "Разовый заказ",
  question: "Вопрос",
} as const;

export type Interest = keyof typeof interestLabels;

const ADDRESS_STREET = "ул. Короля, 9";
const CITY = "Минск";
const FOUNDED_YEAR = 2019;
const BATCH = `5${NBSP}кг`;
const PACK = `250${NBSP}г`;
const FREE_DELIVERY_FROM = 50;
const SUBSCRIPTION_PRICE = 54;

export const business = {
  name: "Кварта",
  city: CITY,
  street: ADDRESS_STREET,
  address: `${CITY}, ${ADDRESS_STREET}`,
  mapUrl: `https://yandex.by/maps/?text=${encodeURIComponent(`${CITY}, ${ADDRESS_STREET}`)}`,
  // Вымышленный аккаунт: клиент учебный
  instagramUrl: "https://www.instagram.com/kvarta.demo/",
  foundedYear: FOUNDED_YEAR,
  timeZone: "Europe/Minsk",
  freeDeliveryFrom: FREE_DELIVERY_FROM,
  // days – как в schema.org (JSON-LD), время – по Минску
  hours: [
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "20:00",
      label: "Пн–пт 8:00–20:00",
    },
    {
      days: ["Saturday", "Sunday"],
      opens: "10:00",
      closes: "18:00",
      label: "Сб–вс 10:00–18:00",
    },
  ],
} as const;

export const photos = {
  hero: {
    src: "/images/photo-1-hero.jpg",
    width: 1344,
    height: 1800,
    alt: "Руки держат крафтовую пачку кофе, рядом рассыпаны обжаренные зёрна",
  },
  roast: {
    src: "/images/photo-2-roast.jpg",
    width: 1800,
    height: 1344,
    alt: "Обжарочная машина: зёрна высыпаются в чашу охлаждения",
  },
  delivery: {
    src: "/images/photo-3-delivery.jpg",
    width: 1800,
    height: 1344,
    alt: "Коробка с крафтовыми пачками кофе у входной двери",
  },
  home: {
    src: "/images/photo-4-home.jpg",
    width: 1800,
    height: 1344,
    alt: "Чашка чёрного кофе, рядом дриппер и пачка с зёрнами",
  },
  founders: {
    src: "/images/photo-5-founders.jpg",
    width: 1800,
    height: 1344,
    alt: "Аня и Дмитрий работают в обжарке: она набирает зёрна совком, он делает записи",
  },
  subscription: {
    src: "/images/photo-6-subscription.jpg",
    width: 1800,
    height: 1344,
    alt: "Две крафтовые пачки кофе и открытая коробка на кухонном столе",
  },
  shop: {
    src: "/images/photo-7-shop.jpg",
    width: 1800,
    height: 1344,
    alt: "Мастерская: деревянный прилавок, полки с крафтовыми пачками и обжарочная машина",
  },
} as const;

export type Photo = (typeof photos)[keyof typeof photos];

export const ORDER_HREF = "#order";
// По нему мобильная плашка понимает, что форма на экране
export const LEAD_FORM_ID = "lead-form";

export const nav = {
  logo: business.name,
  links: [
    { label: "Кофе", href: "#coffee" },
    { label: "Подписка", href: "#subscription" },
    { label: "Доставка и самовывоз", href: ORDER_HREF },
    { label: "Контакты", href: "#footer" },
  ],
  cta: "Оставить заявку",
  menuLabel: "Меню",
  ariaLabel: "Разделы страницы",
  skipLink: "К форме заявки",
} as const;

export const coffee = {
  title: "Что сейчас в обжарке",
  subtitle: `Цены за пачку ${PACK}`,
  orderLabel: "Заказать",
  items: [
    {
      number: "01",
      tag: "Светлая обжарка",
      name: "Эфиопия Иргачеффе",
      notes: "цветочный, бергамот",
      price: 32,
      orderComment: `Эфиопия Иргачеффе, ${PACK}`,
    },
    {
      number: "02",
      tag: "Колумбия",
      name: "Колумбия Уила",
      notes: "карамель, красное яблоко",
      price: 29,
      orderComment: `Колумбия Уила, ${PACK}`,
    },
    {
      number: "03",
      tag: "Под эспрессо",
      name: "Бразилия Серрадо",
      notes: "орех, шоколад",
      price: 26,
      orderComment: `Бразилия Серрадо, ${PACK}`,
    },
    {
      number: "04",
      tag: "10 штук",
      name: "Дрип-пакеты, ассорти",
      notes: "для офиса и поездок: залили кипятком и готово",
      notesShort: "залили кипятком и готово",
      price: 18,
      orderComment: "Дрип-пакеты, ассорти, 10 шт.",
    },
  ],
} as const;

export type CoffeeItem = (typeof coffee.items)[number];

const featured = coffee.items[0];

export const hero = {
  tags: [
    { full: "Обжарка по четвергам", short: "Обжарка по четвергам" },
    {
      full: `${CITY} · с ${FOUNDED_YEAR} года`,
      short: `${CITY} · с ${FOUNDED_YEAR}`,
    },
  ],
  // «В пятницу» выделено оранжевым
  title: {
    before: "Обжарили в четверг.",
    accent: "В пятницу",
    after: "уже у вас.",
  },
  lead: {
    full: `Маленькая мастерская в Минске. Жарим партиями по ${BATCH}, чтобы зерно доезжало до вас на 1–3 день после обжарки.`,
    short:
      "Маленькая мастерская в Минске. Зерно доезжает до вас на 1–3 день после обжарки.",
  },
  ctas: [
    { label: "Оформить подписку", interest: "subscription" },
    { label: "Заказать разово", interest: "order" },
  ],
  facts: [
    "Доставка по Минску в пятницу",
    `От ${formatPrice(FREE_DELIVERY_FROM)} бесплатно`,
    `Самовывоз: ${ADDRESS_STREET}`,
  ],
  sticker: {
    brand: "Кварта · обжарка",
    weight: PACK,
    name: featured.name,
    notes: featured.notes,
    tags: ["Обжарено чт", "Доставка пт"],
  },
  photo: photos.hero,
} as const;

export const freshness = {
  tag: "Почему свежесть важна",
  title: "Кофе вкуснее, пока он свежий",
  text: {
    full: "Поэтому мы жарим небольшими партиями раз в неделю и сразу развозим. Зерно приходит к вам на 1–3 день после обжарки.",
    short:
      "Поэтому мы жарим небольшими партиями раз в неделю и сразу развозим.",
  },
  steps: [
    { day: "Четверг", text: `обжариваем партию ${BATCH}`, photo: photos.roast },
    { day: "Пятница", text: "развозим по Минску", photo: photos.delivery },
    { day: "1–3 день", text: "зерно уже у вас", photo: photos.home },
  ],
} as const;

export const founders = {
  tag: "Кто мы",
  title: "Аня и Дмитрий",
  text: `Раньше мы работали бариста, а с ${FOUNDED_YEAR} года жарим кофе сами. Партии небольшие, по ${BATCH}. Свежесть – главное, что мы продаём.`,
  photo: photos.founders,
} as const;

const PER_MONTH = "/ мес";
const subscriptionPrice = `${formatPrice(SUBSCRIPTION_PRICE)} ${PER_MONTH}`;

export const subscription = {
  tag: "Подписка",
  title: "Две пачки в месяц, доставка бесплатно",
  text: {
    full: `2 пачки по ${PACK} раз в месяц. Оставьте заявку: менеджер перезвонит и всё оформит. Корзина и оплата онлайн не нужны.`,
    short: "Оставьте заявку: менеджер перезвонит и всё оформит.",
  },
  price: SUBSCRIPTION_PRICE,
  priceLabel: subscriptionPrice,
  priceUnit: `${CURRENCY} ${PER_MONTH}`,
  priceNote: `2 пачки по ${PACK}`,
  cta: { label: "Хочу подписку", interest: "subscription" },
  photo: photos.subscription,
} as const;

export const order = {
  title: "Оставьте заявку – мы перезвоним",
  info: [
    {
      title: "Доставка",
      lines: [
        `По Минску в пятницу. От ${formatPrice(FREE_DELIVERY_FROM)} бесплатно.`,
      ],
    },
    { title: "Самовывоз", lines: [business.address], href: business.mapUrl },
    { title: "Часы", lines: business.hours.map((h) => h.label) },
  ],
  photo: photos.shop,
  form: {
    name: { label: "Имя", placeholder: "Как к вам обращаться" },
    phone: {
      label: "Телефон",
      placeholder: "+375 29 123-45-67",
      hint: "Белорусский номер, например +375 29 123-45-67",
    },
    interest: { label: "Что интересует", options: interestLabels },
    comment: {
      label: "Комментарий",
      placeholder: "Какой кофе, как завариваете, что важно знать",
      placeholderQuestion: "Напишите ваш вопрос",
    },
    submit: "Отправить заявку",
    submitting: "Отправляем…",
    retry: "Повторить",
    note: "Менеджер перезвонит в рабочее время и всё оформит. Оплата онлайн не нужна.",
    consent: {
      before: "Нажимая кнопку, вы соглашаетесь на",
      link: "обработку персональных данных",
      href: "/privacy",
    },
    errors: {
      name: "Напишите, как к вам обращаться",
      phone: "Нужен белорусский мобильный, например +375 29 123-45-67",
      comment: "Не больше 500 символов",
    },
    status: {
      successTitle: (name: string) => `Спасибо, ${name}!`,
      successText: (phone: string) => `Перезвоним на ${phone}`,
      duplicate: "Заявка с этого номера уже у нас – перезвоним",
      network:
        "Не получилось отправить – похоже, пропал интернет. Данные сохранили, нажмите «Повторить»",
      server:
        "У нас что-то сломалось. Попробуйте ещё раз через минуту или напишите нам в Instagram",
      rateLimited:
        "Слишком много заявок. Попробуйте позже или напишите нам в Instagram",
    },
  },
} as const;

export const footer = {
  logo: business.name,
  address: business.address,
  since: `обжарка с ${FOUNDED_YEAR} года`,
  instagram: { label: "Instagram", href: business.instagramUrl },
  privacy: {
    label: "Политика обработки персональных данных",
    href: "/privacy",
  },
  disclaimer: "Учебный проект, клиент вымышленный",
} as const;

export const mobileBar = {
  tag: "Подписка",
  price: subscriptionPrice,
  cta: "Заявка",
  interest: "subscription",
} as const;
