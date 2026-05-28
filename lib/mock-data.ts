export type AppTab = "routine" | "scan" | "catalog" | "profile";

export type AppScreen =
  | "main"
  | "routineStep"
  | "replaceProduct"
  | "productDetail"
  | "priceCompare"
  | "inciResult"
  | "myProducts"
  | "skinDynamics";

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  retailerId: string;
  retailer: string;
  description: string;
  actives: string[];
  reasons: string[];
  caution?: string;
  inci: string;
};

export type RoutineStep = {
  id: string;
  period: "morning" | "evening" | "weekly";
  label: string;
  goal: string;
  productId: string;
  why: string;
  how: string;
};

export const profileSummary = {
  name: "Аня",
  skinType: "Комбинированная кожа",
  goals: ["постакне", "жирный блеск", "ровный тон"],
  budget: "около 4 000 ₽",
};

export const retailers = [
  { id: "golden-apple", name: "Золотое Яблоко", logo: "/assets/retailers/golden-apple.png", note: "в наличии" },
  { id: "letual", name: "ЛЭТУАЛЬ", logo: "/assets/retailers/letual.png", note: "лучшее предложение" },
  { id: "rive-gauche", name: "РИВ ГОШ", logo: "/assets/retailers/rive-gauche.png", note: "карта лояльности" },
  { id: "ozon", name: "Ozon", logo: "/assets/retailers/ozon.png", note: "проверить продавца" },
  { id: "wildberries", name: "Wildberries", logo: "/assets/retailers/wildberries.png", note: "есть риск дублей" },
];

export const products: Product[] = [
  {
    id: "cleanser",
    brand: "Medik8",
    name: "Gentle Cleanser",
    category: "Очищение",
    price: 1380,
    image: "/assets/products/cleanser.png",
    retailerId: "golden-apple",
    retailer: "Золотое Яблоко",
    description: "мягкое начало без пересушивания",
    actives: ["глицерин", "пантенол", "мягкие ПАВ"],
    reasons: ["бережно очищает", "не конфликтует с активами", "подходит для утреннего ритуала"],
    inci: "Aqua, Glycerin, Panthenol, Cocamidopropyl Betaine, Sodium Chloride.",
  },
  {
    id: "serum",
    brand: "KTS BEAUTY",
    name: "Niacinamide 10%",
    category: "Сыворотка",
    price: 1290,
    oldPrice: 1790,
    image: "/assets/products/serum.png",
    retailerId: "letual",
    retailer: "ЛЭТУАЛЬ",
    description: "ниацинамид для тона и себума",
    actives: ["ниацинамид", "пантенол", "цинк"],
    reasons: ["регулирует себум", "помогает с постакне", "поддерживает барьер"],
    caution: "Возможна индивидуальная реакция при чувствительной коже.",
    inci: "Aqua, Niacinamide, Propanediol, Zinc PCA, Panthenol, Betaine, Glycerin.",
  },
  {
    id: "cream",
    brand: "Innisfree",
    name: "Rice Probiotics Barrier Cream",
    category: "Крем",
    price: 1390,
    image: "/assets/products/cream.png",
    retailerId: "rive-gauche",
    retailer: "РИВ ГОШ",
    description: "поддержка барьера",
    actives: ["церамиды", "рисовые пробиотики", "сквалан"],
    reasons: ["снижает сухость", "успокаивает", "не перегружает дневной уход"],
    inci: "Aqua, Squalane, Ceramide NP, Rice Ferment, Glycerin.",
  },
  {
    id: "spf",
    brand: "Beauty of Joseon",
    name: "Relief Sun SPF50+ PA++++",
    category: "SPF",
    price: 820,
    image: "/assets/products/spf.png",
    retailerId: "ozon",
    retailer: "Ozon",
    description: "защита каждый день",
    actives: ["spf-фильтры", "рисовый экстракт", "пробиотики"],
    reasons: ["важен при постакне", "снижает риск пятен", "легкая текстура"],
    inci: "Aqua, Dibutyl Adipate, Propanediol, Niacinamide, Rice Extract.",
  },
  {
    id: "oil",
    brand: "DHC",
    name: "Deep Cleansing Oil",
    category: "Очищение",
    price: 1190,
    image: "/assets/products/oil.png",
    retailerId: "wildberries",
    retailer: "Wildberries",
    description: "очищение SPF и макияжа",
    actives: ["оливковое масло", "витамин E"],
    reasons: ["растворяет SPF", "подходит для вечернего очищения"],
    inci: "Olea Europaea Fruit Oil, Sorbeth-30 Tetraoleate, Tocopherol.",
  },
];

export const alternatives: Product[] = [
  {
    id: "revox",
    brand: "REVOX",
    name: "Just Niacinamide 10%",
    category: "Сыворотка",
    price: 590,
    oldPrice: 740,
    image: "/assets/products/revox.png",
    retailerId: "golden-apple",
    retailer: "Золотое Яблоко",
    description: "мягкая формула дешевле текущей",
    actives: ["ниацинамид", "глицерин"],
    reasons: ["дешевле", "подходит чувствительной коже", "без отдушки"],
    inci: "Aqua, Niacinamide, Glycerin, Phenoxyethanol.",
  },
  {
    id: "anua",
    brand: "Anua",
    name: "Niacinamide 10% + TXA 4%",
    category: "Сыворотка",
    price: 1390,
    image: "/assets/products/anua.png",
    retailerId: "ozon",
    retailer: "Ozon",
    description: "осветляет постакне и пигментацию",
    actives: ["ниацинамид", "TXA"],
    reasons: ["фокус на постакне", "без тяжелых масел"],
    inci: "Aqua, Niacinamide, Tranexamic Acid, Betaine.",
  },
  {
    id: "svr",
    brand: "SVR",
    name: "Ampoule Relax",
    category: "Сыворотка",
    price: 1850,
    image: "/assets/products/svr.png",
    retailerId: "rive-gauche",
    retailer: "РИВ ГОШ",
    description: "успокаивает и укрепляет барьер",
    actives: ["пантенол", "центелла"],
    reasons: ["мягче", "без отдушки", "для чувствительности"],
    inci: "Aqua, Panthenol, Centella Asiatica Extract, Glycerin.",
  },
  {
    id: "medik8",
    brand: "Medik8",
    name: "Clarity Peptides",
    category: "Сыворотка",
    price: 2990,
    image: "/assets/products/medik8.png",
    retailerId: "letual",
    retailer: "ЛЭТУАЛЬ",
    description: "премиум-сыворотка для чистой кожи",
    actives: ["пептиды", "ниацинамид"],
    reasons: ["premium", "для ровного тона"],
    inci: "Aqua, Niacinamide, Peptides, Hyaluronic Acid.",
  },
];

export const routineSteps: RoutineStep[] = [
  { id: "m1", period: "morning", label: "Очищение", goal: "мягкое начало без пересушивания", productId: "cleanser", why: "Очищение убирает себум и остатки ночного ухода, не повреждая барьер.", how: "Наноси утром на влажную кожу, смой прохладной водой." },
  { id: "m2", period: "morning", label: "Сыворотка", goal: "ниацинамид для тона и себума", productId: "serum", why: "Ниацинамид помогает с жирным блеском и следами постакне.", how: "2-3 капли после очищения, перед кремом." },
  { id: "m3", period: "morning", label: "Крем", goal: "поддержка барьера", productId: "cream", why: "Барьерная поддержка снижает риск раздражения от активов.", how: "Горошина крема после сыворотки." },
  { id: "m4", period: "morning", label: "SPF", goal: "защита каждый день", productId: "spf", why: "SPF помогает не усиливать постакне и неровный тон.", how: "Два пальца средства за 15 минут до выхода." },
  { id: "e1", period: "evening", label: "Масло", goal: "смыть SPF", productId: "oil", why: "Гидрофильное масло растворяет SPF и плотные текстуры.", how: "Нанеси на сухую кожу, эмульгируй водой и смой." },
  { id: "e2", period: "evening", label: "Очищение", goal: "второй этап", productId: "cleanser", why: "Второй этап убирает остатки масла.", how: "Мягко вспень и смой." },
  { id: "e3", period: "evening", label: "Крем", goal: "восстановление", productId: "cream", why: "Ночью коже нужна поддержка барьера.", how: "Нанеси тонким слоем." },
];

export const cabinet = [
  { productId: "serum", status: "used", label: "Используется", note: "Использую с 12 мая" },
  { productId: "spf", status: "ending", label: "Заканчивается", note: "Осталось на 10 дней" },
  { productId: "cream", status: "bad", label: "Не подошло", note: "Вызвал(а) высыпания" },
  { productId: "oil", status: "repeat", label: "Купить снова", note: "Очень нравится, кожа чистая и мягкая" },
];

export const priceOffers = [
  { retailerId: "letual", price: 1290, discount: "-28%", stock: "В наличии" },
  { retailerId: "golden-apple", price: 1390, stock: "В наличии" },
  { retailerId: "rive-gauche", price: 1510, stock: "В наличии" },
  { retailerId: "ozon", price: 1240, stock: "проверить продавца" },
  { retailerId: "wildberries", price: 1199, stock: "есть риск дублей" },
];

export const skinDynamics = {
  weeks: [
    { label: "Неделя 1", date: "29 апр.", image: "/assets/skin/week-1.png" },
    { label: "Неделя 2", date: "6 мая", image: "/assets/skin/week-2.png" },
    { label: "Неделя 3", date: "13 мая", image: "/assets/skin/week-3.png" },
    { label: "Неделя 4", date: "20 мая", image: "/assets/skin/week-4.png" },
  ],
  metrics: [
    { label: "Жирный блеск", detail: "Уменьшился", value: "-18%" },
    { label: "Покраснение", detail: "Без изменений", value: "0%" },
    { label: "Барьер кожи", detail: "Стал стабильнее", value: "+12%" },
  ],
};

export const inciAnalysis = {
  verdict: "С осторожностью",
  summary: "Подходит по профилю, но содержит потенциально раздражающие компоненты.",
  useful: [
    ["Niacinamide", "Выравнивает тон, укрепляет барьер"],
    ["Panthenol", "Успокаивает, увлажняет"],
    ["Glycerin", "Поддерживает баланс влаги"],
  ],
  neutral: ["Aqua", "Propanediol", "Betaine", "Squalane"],
  caution: [
    ["Parfum (Fragrance)", "Может вызывать раздражение у чувствительной кожи"],
    ["Linalool", "Потенциальный аллерген"],
  ],
};

export function getProduct(id: string) {
  return [...products, ...alternatives].find((product) => product.id === id) || products[0];
}

export function getRetailer(id: string) {
  return retailers.find((retailer) => retailer.id === id) || retailers[0];
}
