"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Heart,
  History,
  Leaf,
  PackagePlus,
  ScanLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Tag,
  User,
  Wand2,
} from "lucide-react";
import { BottomNav, Button, GlassCard, RetailerChip } from "./UI";
import {
  AppScreen,
  AppTab,
  Product,
  alternatives,
  cabinet,
  getProduct,
  getRetailer,
  inciAnalysis,
  priceOffers,
  products,
  profileSummary,
  retailers,
  routineSteps,
  skinDynamics,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type ScreenState = {
  name: AppScreen;
  productId?: string;
  stepId?: string;
};

type InternalAppProps = {
  initialTab: AppTab;
  hasRoutine: boolean;
  onStartQuestionnaire: () => void;
  onClear: () => void;
};

const dayOptions = [
  { id: -1 as const, label: "Вчера" },
  { id: 0 as const, label: "Сегодня" },
  { id: 1 as const, label: "Завтра" },
];

const demoNotifications = [
  { id: "n1", title: "Напоминание о SPF", text: "Не забудь обновить SPF после обеда." },
  { id: "n2", title: "Сыворотка заканчивается", text: "Осталось примерно на 10 дней использования." },
  { id: "n3", title: "Новая цена", text: "Для Niacinamide 10% найдено предложение дешевле." },
];

const periods = [
  { id: "morning", label: "Утро", icon: Sun },
  { id: "evening", label: "Вечер", icon: Sparkles },
  { id: "weekly", label: "1-2 раза", icon: Wand2 },
] as const;

function money(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function ProductPackshot({ product, className }: { product: Product; className?: string }) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-kts-glass-line bg-kts-glass-soft", className)}>
      <Image src={product.image} alt="" width={220} height={220} className="h-full w-full object-cover" />
    </div>
  );
}

function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between pt-4">
      <button onClick={onBack} className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-kts-glass-line bg-kts-glass-soft text-kts-text backdrop-blur-xl", !onBack && "invisible")}>
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="font-editorial text-[18px] uppercase tracking-[0.22em] text-kts-text/85">{title || "KTS Beauty"}</div>
      <div className="flex h-11 min-w-11 items-center justify-end">{right}</div>
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button onClick={() => setOpen((v) => !v)} className="rounded-full border border-kts-glass-line bg-kts-glass-soft p-2.5 text-kts-muted backdrop-blur-xl">
        <Bell className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-[52px] z-40 w-[300px] overflow-hidden rounded-[20px] border border-kts-glass-line bg-kts-bg/90 shadow-2xl backdrop-blur-2xl">
          <div className="border-b border-kts-line px-4 py-3 text-[13px] uppercase tracking-[0.14em] text-kts-muted">Уведомления</div>
          <div className="max-h-[220px] overflow-y-auto p-2">
            {demoNotifications.map((item) => (
              <div key={item.id} className="rounded-[14px] px-3 py-2.5 hover:bg-kts-chip">
                <div className="text-[14px] font-medium">{item.title}</div>
                <div className="mt-1 text-[13px] text-kts-muted">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentedControl<T extends string>({ value, items, onChange }: { value: T; items: { id: T; label: string; icon?: React.ComponentType<{ className?: string }> }[]; onChange: (id: T) => void }) {
  return (
    <div className="flex rounded-full border border-kts-glass-line bg-kts-glass-soft p-1 backdrop-blur-xl">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn("flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[14px] text-kts-muted transition-all", value === item.id && "bg-kts-accent text-kts-btn-text shadow-lg")}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterChipRow<T extends string>({ value, items, onChange }: { value: T; items: { id: T; label: string }[]; onChange: (id: T) => void }) {
  return (
    <div className="hide-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">
      {items.map((item) => (
        <button key={item.id} onClick={() => onChange(item.id)} className={cn("h-10 shrink-0 rounded-full border border-kts-glass-line px-4 text-[14px] text-kts-muted", value === item.id && "bg-kts-accent text-kts-btn-text")}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function MockLineChart() {
  const points = "0,70 42,62 84,50 126,46 168,36 210,44 252,30 294,28 336,22 378,24 420,18 462,16 504,14";
  return (
    <GlassCard className="p-4">
      <div className="mb-3 text-[16px] font-medium">Динамика цены за 30 дней</div>
      <svg viewBox="0 0 520 110" className="h-[130px] w-full overflow-visible">
        {[0, 1, 2].map((i) => <line key={i} x1="0" x2="520" y1={22 + i * 34} y2={22 + i * 34} stroke="currentColor" opacity=".1" />)}
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="504" cy="14" r="8" fill="var(--accent-2)" />
      </svg>
      <div className="flex justify-between text-[12px] text-kts-muted">
        <span>21 апр</span><span>5 мая</span><span>19 мая</span><span>сегодня</span>
      </div>
    </GlassCard>
  );
}

function ProductCard({ product, onOpen, compact = false }: { product: Product; onOpen: () => void; compact?: boolean }) {
  const retailer = getRetailer(product.retailerId);
  return (
    <GlassCard className={cn("p-4", compact ? "flex gap-3" : "flex gap-4")}>
      <ProductPackshot product={product} className={compact ? "h-24 w-24" : "h-28 w-28"} />
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="text-[12px] uppercase tracking-[0.16em] text-kts-muted">{product.category}</div>
        <div className="mt-1 font-editorial text-[22px] leading-tight">{product.name}</div>
        <div className="mt-1 text-[14px] text-kts-muted">{product.brand}</div>
        <div className="mt-3 flex items-center gap-2">
          <Image src={retailer.logo} alt="" width={22} height={22} className="rounded-md bg-white/90" />
          <span className="text-[13px] text-kts-muted">{retailer.name}</span>
          <span className="ml-auto text-[16px] font-medium">{money(product.price)}</span>
        </div>
      </button>
    </GlassCard>
  );
}

function RoutineStepCard({ step, index, onOpen, onProduct }: { step: typeof routineSteps[number]; index: number; onOpen: () => void; onProduct: () => void }) {
  const product = getProduct(step.productId);
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-4">
        <div className="font-editorial text-[44px] text-kts-muted/60">{index}</div>
        <button onClick={onProduct}>
          <ProductPackshot product={product} className="h-24 w-24" />
        </button>
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="text-[12px] uppercase tracking-[0.16em] text-kts-muted">{step.label}</div>
          <div className="font-editorial text-[21px] leading-tight">{product.name}</div>
          <div className="mt-1 text-[13px] text-kts-muted">{step.goal}</div>
          <div className="mt-2 text-[15px] font-medium">{money(product.price)}</div>
        </button>
        <ChevronRight className="h-5 w-5 text-kts-muted" />
      </div>
    </GlassCard>
  );
}

function HomeScreen({ open, hasRoutine, onStart }: { open: (screen: ScreenState) => void; hasRoutine: boolean; onStart: () => void }) {
  return (
    <div className="p-6 pb-[130px]">
      <TopBar right={<NotificationBell />} />
      <h1 className="font-editorial text-[42px] leading-none">Главная</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-kts-muted">{profileSummary.skinType} · цель: {profileSummary.goals.join(" и ")} · бюджет {profileSummary.budget}</p>

      <GlassCard className="mt-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-kts-muted">Сегодня</div>
            <div className="mt-2 font-editorial text-[28px]">Утренний ритуал</div>
            <p className="mt-2 text-[14px] text-kts-muted">4 шага · итоговая стоимость 4 280 ₽</p>
          </div>
          <Sparkles className="h-7 w-7 text-kts-accent" />
        </div>
        <Button onClick={() => hasRoutine ? open({ name: "main" }) : onStart()} className="mt-5 w-full">{hasRoutine ? "Открыть рутину" : "Собрать рутину"}</Button>
      </GlassCard>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <QuickAction icon={ScanLine} label="Скан состава" onClick={() => open({ name: "inciResult" })} />
        <QuickAction icon={Tag} label="Где дешевле" onClick={() => open({ name: "priceCompare", productId: "serum" })} />
        <QuickAction icon={PackagePlus} label="Мои средства" onClick={() => open({ name: "myProducts" })} />
        <QuickAction icon={Calendar} label="Динамика кожи" onClick={() => open({ name: "skinDynamics" })} />
      </div>

      <GlassCard className="mt-5 p-5">
        <div className="font-medium">Сыворотка заканчивается</div>
        <p className="mt-1 text-[14px] text-kts-muted">Осталось примерно на 10 дней. Лучшее предложение сейчас в ЛЭТУАЛЬ.</p>
      </GlassCard>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[22px] border border-kts-glass-line bg-kts-glass-soft p-4 text-left backdrop-blur-xl">
      <Icon className="mb-4 h-5 w-5 text-kts-accent" />
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}

function RoutineScreen({ open }: { open: (screen: ScreenState) => void }) {
  const [period, setPeriod] = React.useState<(typeof periods)[number]["id"]>("morning");
  const [dayOffset, setDayOffset] = React.useState<-1 | 0 | 1>(0);
  const visible = routineSteps.filter((step) => step.period === period);
  const total = visible.reduce((sum, step) => sum + getProduct(step.productId).price, 0);
  return (
    <div className="p-6 pb-[130px]">
      <TopBar title="Рутина" right={<NotificationBell />} />
      <h1 className="font-editorial text-[42px] leading-none">Моя рутина</h1>
      <div className="hide-scrollbar mt-4 -mx-1 flex gap-2 overflow-x-auto px-1">
        {dayOptions.map((item) => (
          <button
            key={item.id}
            onClick={() => setDayOffset(item.id)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-[14px] backdrop-blur-xl transition-all",
              dayOffset === item.id
                ? "border-kts-accent bg-kts-accent text-kts-btn-text"
                : "border-kts-glass-line bg-kts-glass-soft text-kts-muted"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-kts-muted">
        {dayOffset === -1 ? "Разбор вчерашних шагов" : dayOffset === 0 ? "План на сегодня" : "План на завтра"}
      </p>
      <div className="mt-6"><SegmentedControl value={period} items={[...periods]} onChange={setPeriod} /></div>
      <div className="mt-5 space-y-3">
        {visible.map((step, index) => (
          <RoutineStepCard key={step.id} step={step} index={index + 1} onOpen={() => open({ name: "routineStep", stepId: step.id })} onProduct={() => open({ name: "productDetail", productId: step.productId })} />
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => open({ name: "priceCompare", productId: "serum" })}>Хочу дешевле</Button>
        <Button variant="secondary" className="flex-1" onClick={() => open({ name: "replaceProduct", stepId: visible[1]?.id || "m2" })}>Заменить шаг</Button>
      </div>
      <GlassCard className="mt-4 flex items-center justify-between p-5">
        <div className="text-[14px] text-kts-muted">Итого</div>
        <div className="font-editorial text-[28px]">{money(total)}</div>
      </GlassCard>
    </div>
  );
}

function ScanScreen({ open }: { open: (screen: ScreenState) => void }) {
  const cards = [
    ["INCI-сканер", "Разберем состав по фото", ScanLine],
    ["Штрихкод", "Найдем средство в базе", Search],
    ["Фото продукта", "Определим банку и цены", ShoppingBag],
    ["Фото кожи", "Сравним динамику", User],
  ] as const;
  return (
    <div className="p-6 pb-[130px]">
      <TopBar right={<History className="h-5 w-5 text-kts-muted" />} />
      <h1 className="font-editorial text-[42px] leading-none">Скан</h1>
      <p className="mt-3 text-[15px] text-kts-muted">Проверяй составы, продукты и прогресс кожи в одном месте.</p>
      <div className="mt-6 grid gap-3">
        {cards.map(([title, desc, Icon]) => (
          <button key={title} onClick={() => open({ name: title === "INCI-сканер" ? "inciResult" : "skinDynamics" })} className="rounded-[26px] border border-kts-glass-line bg-kts-glass-soft p-5 text-left backdrop-blur-xl">
            <Icon className="mb-5 h-6 w-6 text-kts-accent" />
            <div className="font-editorial text-[25px]">{title}</div>
            <div className="mt-1 text-[14px] text-kts-muted">{desc}</div>
          </button>
        ))}
      </div>
      <GlassCard className="mt-5 p-5">
        <div className="font-medium">Последний скан</div>
        <p className="mt-1 text-[14px] text-kts-muted">Niacinamide Balance Serum · с осторожностью из-за отдушки.</p>
      </GlassCard>
    </div>
  );
}

function CatalogScreen({ open }: { open: (screen: ScreenState) => void }) {
  const [filter, setFilter] = React.useState("postacne");
  return (
    <div className="p-6 pb-[130px]">
      <TopBar right={<Search className="h-5 w-5 text-kts-muted" />} />
      <h1 className="font-editorial text-[42px] leading-none">Каталог</h1>
      <p className="mt-3 text-[15px] text-kts-muted">Подборки под профиль кожи, бюджет и ограничения.</p>
      <div className="mt-6"><FilterChipRow value={filter} onChange={setFilter} items={[{ id: "postacne", label: "Постакне" }, { id: "spf", label: "SPF" }, { id: "no-fragrance", label: "Без отдушек" }, { id: "budget", label: "до 1500 ₽" }]} /></div>
      <div className="mt-5 space-y-3">
        {[...products, ...alternatives].slice(0, 7).map((product) => <ProductCard key={product.id} product={product} onOpen={() => open({ name: "productDetail", productId: product.id })} />)}
      </div>
    </div>
  );
}

function ProfileScreen({ open, onClear }: { open: (screen: ScreenState) => void; onClear: () => void }) {
  const [theme, setTheme] = React.useState(() => (typeof window === "undefined" ? "dark" : localStorage.getItem("kts-theme") || "dark"));
  const toggleTheme = (next: string) => {
    setTheme(next);
    localStorage.setItem("kts-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  return (
    <div className="p-6 pb-[130px]">
      <TopBar right={<NotificationBell />} />
      <h1 className="font-editorial text-[42px] leading-none">Профиль</h1>
      <GlassCard className="mt-6 flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kts-accent text-kts-btn-text">А</div>
        <div>
          <div className="text-[18px] font-medium">{profileSummary.name}</div>
          <div className="text-[13px] text-kts-muted">{profileSummary.skinType}</div>
        </div>
      </GlassCard>
      <div className="mt-5"><SegmentedControl value={theme} onChange={toggleTheme} items={[{ id: "dark", label: "Тёмная" }, { id: "light", label: "Светлая" }]} /></div>
      <div className="mt-5 space-y-3">
        <ProfileRow icon={PackagePlus} title="Мои средства" desc="Что используется, заканчивается и не подошло" onClick={() => open({ name: "myProducts" })} />
        <ProfileRow icon={Calendar} title="Динамика кожи" desc="Фото и метрики по неделям" onClick={() => open({ name: "skinDynamics" })} />
        <ProfileRow icon={ShieldCheck} title="Данные анкеты" desc={`${profileSummary.goals.join(", ")} · ${profileSummary.budget}`} onClick={() => {}} />
      </div>
      <Button variant="ghost" className="mt-6 w-full" onClick={onClear}>Очистить данные</Button>
    </div>
  );
}

function ProfileRow({ icon: Icon, title, desc, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-[24px] border border-kts-glass-line bg-kts-glass-soft p-4 text-left backdrop-blur-xl">
      <Icon className="h-5 w-5 text-kts-accent" />
      <span className="min-w-0 flex-1"><span className="block font-medium">{title}</span><span className="block text-[13px] text-kts-muted">{desc}</span></span>
      <ChevronRight className="h-5 w-5 text-kts-muted" />
    </button>
  );
}

function RoutineStepDetail({ state, open, back }: { state: ScreenState; open: (s: ScreenState) => void; back: () => void }) {
  const step = routineSteps.find((item) => item.id === state.stepId) || routineSteps[1];
  const product = getProduct(step.productId);
  return (
    <DetailScaffold title="Шаг рутины" back={back}>
      <GlassCard className="p-5">
        <div className="mb-4 rounded-full bg-kts-chip px-4 py-2 text-[13px] text-kts-muted">Шаг {routineSteps.filter(s => s.period === step.period).findIndex(s => s.id === step.id) + 1} · {step.label}</div>
        <div className="grid grid-cols-[1fr_130px] gap-4">
          <div><h1 className="font-editorial text-[34px] leading-none">{step.label}</h1><p className="mt-3 text-[15px] text-kts-muted">{step.goal}</p><div className="mt-8 text-[12px] uppercase tracking-[0.16em] text-kts-muted">{product.brand}</div><div className="font-medium">{product.name}</div><div className="mt-2 text-[22px]">{money(product.price)}</div></div>
          <ProductPackshot product={product} className="h-44 w-full" />
        </div>
      </GlassCard>
      <InfoBlock icon={Sparkles} title="Зачем этот шаг" text={step.why} />
      <InfoBlock icon={User} title="Почему подходит тебе" text={product.reasons.join(" · ")} />
      <InfoBlock icon={Leaf} title="Как использовать" text={step.how} />
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => open({ name: "replaceProduct", stepId: step.id })}>Заменить</Button>
        <Button variant="secondary" onClick={() => open({ name: "productDetail", productId: product.id })}>Карточка</Button>
      </div>
    </DetailScaffold>
  );
}

function ProductDetail({ state, open, back }: { state: ScreenState; open: (s: ScreenState) => void; back: () => void }) {
  const product = getProduct(state.productId || "serum");
  const retailer = getRetailer(product.retailerId);
  return (
    <DetailScaffold title="KTS Beauty" back={back} right={<Heart className="h-5 w-5 text-kts-muted" />}>
      <ProductPackshot product={product} className="h-[250px] w-full" />
      <GlassCard className="-mt-8 p-5">
        <div className="text-[14px] text-kts-muted">{product.brand}</div>
        <h1 className="font-editorial text-[36px] leading-none">{product.name}</h1>
        <div className="mt-5 flex items-center gap-4"><span className="text-[32px]">{money(product.price)}</span>{product.oldPrice && <span className="text-[20px] text-kts-muted line-through">{money(product.oldPrice)}</span>}</div>
        <button onClick={() => open({ name: "priceCompare", productId: product.id })} className="mt-4 flex w-full items-center gap-3 rounded-[18px] bg-kts-chip px-4 py-3">
          <Image src={retailer.logo} alt="" width={28} height={28} className="rounded-lg bg-white/90" />
          <span className="flex-1 text-left">{retailer.name}</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </GlassCard>
      <InfoBlock icon={Check} title="Почему тебе подходит" text={product.reasons.join(" · ")} />
      <GlassCard className="p-5"><div className="mb-3 text-[18px] font-medium">Активы</div><div className="flex flex-wrap gap-2">{product.actives.map(a => <span key={a} className="rounded-full bg-kts-chip px-3 py-2 text-[13px]">{a}</span>)}</div></GlassCard>
      {product.caution && <InfoBlock icon={ShieldCheck} title="Осторожно" text={product.caution} />}
      <GlassCard className="p-5"><div className="mb-2 text-[18px] font-medium">Состав</div><p className="text-[14px] leading-relaxed text-kts-muted">{product.inci}</p></GlassCard>
      <div className="grid grid-cols-2 gap-3"><Button>Купить</Button><Button variant="secondary" onClick={() => open({ name: "priceCompare", productId: product.id })}>Сравнить цены</Button></div>
    </DetailScaffold>
  );
}

function PriceCompare({ state, back }: { state: ScreenState; back: () => void }) {
  const product = getProduct(state.productId || "serum");
  const best = priceOffers[0];
  return (
    <DetailScaffold title="Где дешевле" back={back}>
      <div className="flex gap-4"><ProductPackshot product={product} className="h-24 w-24" /><div className="pt-2"><div className="text-[20px] font-medium">{product.name}</div><div className="mt-3 text-kts-muted">{product.brand}</div></div></div>
      <GlassCard className="p-5"><div className="text-kts-accent">Лучшее предложение</div><div className="mt-4 text-[26px]">{getRetailer(best.retailerId).name}</div><div className="font-editorial text-[44px]">{money(best.price)}</div><Button className="mt-4 w-full">Купить</Button></GlassCard>
      <div className="space-y-3">{priceOffers.slice(1).map((offer) => { const retailer = getRetailer(offer.retailerId); return <GlassCard key={offer.retailerId} className="flex items-center gap-4 p-4"><Image src={retailer.logo} alt="" width={42} height={42} className="rounded-xl bg-white/90" /><div className="flex-1"><div className="font-medium">{retailer.name}</div><div className="text-[13px] text-kts-muted">{offer.stock}</div></div><div className="text-[20px]">{money(offer.price)}</div><ChevronRight className="h-5 w-5 text-kts-muted" /></GlassCard>; })}</div>
      <MockLineChart />
    </DetailScaffold>
  );
}

function ReplaceProduct({ state, back }: { state: ScreenState; back: () => void }) {
  const [filter, setFilter] = React.useState("cheap");
  const [selected, setSelected] = React.useState(alternatives[0].id);
  const step = routineSteps.find((item) => item.id === state.stepId) || routineSteps[1];
  const current = getProduct(step.productId);
  return (
    <DetailScaffold title="Заменить продукт" back={back}>
      <GlassCard className="flex gap-4 p-4"><ProductPackshot product={current} className="h-28 w-28" /><div><div className="text-[13px] text-kts-muted">Текущий шаг</div><div className="font-editorial text-[24px]">{step.label}</div><div className="mt-2 text-[14px] text-kts-muted">{current.brand}<br />{current.name}</div><div className="mt-2 text-[20px]">{money(current.price)}</div></div></GlassCard>
      <FilterChipRow value={filter} onChange={setFilter} items={[{ id: "cheap", label: "Дешевле" }, { id: "soft", label: "Мягче" }, { id: "premium", label: "Premium" }, { id: "no-fragrance", label: "Без отдушки" }]} />
      <div className="space-y-3">{alternatives.map(product => <button key={product.id} onClick={() => setSelected(product.id)} className="w-full text-left"><GlassCard className={cn("flex gap-4 p-4", selected === product.id && "border-kts-accent")}><ProductPackshot product={product} className="h-28 w-28" /><div className="min-w-0 flex-1"><div className="font-editorial text-[24px]">{product.name}</div><div className="text-[14px] text-kts-muted">{product.brand}</div><div className="mt-2 text-[22px]">{money(product.price)}</div><p className="mt-2 text-[13px] text-kts-muted">{product.description}</p></div><div className={cn("h-7 w-7 rounded-full border border-kts-line", selected === product.id && "bg-kts-accent")} /></GlassCard></button>)}</div>
      <Button onClick={back} className="w-full">Применить замену</Button>
    </DetailScaffold>
  );
}

function InciResult({ back }: { back: () => void }) {
  return (
    <DetailScaffold title="INCI-сканер" back={back} right={<History className="h-5 w-5 text-kts-muted" />}>
      <GlassCard className="p-5"><div className="rounded-[24px] bg-kts-chip p-5 font-mono text-[15px] leading-relaxed">СОСТАВ (INCI): Aqua, Glycerin, Niacinamide, Panthenol, Betaine, Squalane, Parfum, Linalool.</div></GlassCard>
      <GlassCard className="p-5"><ShieldCheck className="mb-4 h-10 w-10 text-kts-accent" /><h1 className="font-editorial text-[34px]">{inciAnalysis.verdict}</h1><p className="mt-2 text-[15px] leading-relaxed text-kts-muted">{inciAnalysis.summary}</p></GlassCard>
      <IngredientGroup title="Полезные ингредиенты" tone="good" items={inciAnalysis.useful} />
      <GlassCard className="p-5"><div className="mb-3 text-[20px] text-kts-accent">Нейтральные</div><p className="text-kts-muted">{inciAnalysis.neutral.join(", ")}</p></GlassCard>
      <IngredientGroup title="С осторожностью" tone="warn" items={inciAnalysis.caution} />
      <Button className="w-full">Что выбрать вместо</Button>
    </DetailScaffold>
  );
}

function IngredientGroup({ title, items }: { title: string; tone: "good" | "warn"; items: string[][] }) {
  return <GlassCard className="p-5"><div className="mb-3 text-[20px] text-kts-accent">{title}</div><div className="space-y-2">{items.map(([name, desc]) => <div key={name} className="rounded-[16px] bg-kts-chip p-3"><div className="font-medium">{name}</div><div className="text-[13px] text-kts-muted">{desc}</div></div>)}</div></GlassCard>;
}

function MyProducts({ open, back }: { open: (s: ScreenState) => void; back: () => void }) {
  const [filter, setFilter] = React.useState("all");
  const items = cabinet.filter(item => filter === "all" || item.status === filter);
  return (
    <DetailScaffold title="Мои средства" back={back} right={<Bell className="h-5 w-5 text-kts-muted" />}>
      <FilterChipRow value={filter} onChange={setFilter} items={[{ id: "all", label: "Все" }, { id: "used", label: "Используется" }, { id: "ending", label: "Заканчивается" }, { id: "bad", label: "Не подошло" }, { id: "repeat", label: "Купить снова" }]} />
      <div className="space-y-3">{items.map(item => { const product = getProduct(item.productId); return <GlassCard key={item.productId} className="flex gap-4 p-4"><ProductPackshot product={product} className="h-28 w-28" /><button onClick={() => open({ name: "productDetail", productId: product.id })} className="flex-1 text-left"><div className="font-editorial text-[24px]">{product.name}</div><div className="text-kts-muted">{product.brand}</div><div className="mt-4 inline-flex rounded-full bg-kts-chip px-3 py-1 text-[13px]">{item.label}</div><p className="mt-3 text-[14px] text-kts-muted">{item.note}</p></button></GlassCard>; })}</div>
      <Button className="w-full">Добавить продукт</Button>
    </DetailScaffold>
  );
}

function SkinDynamics({ back }: { back: () => void }) {
  return (
    <DetailScaffold title="Динамика кожи" back={back} right={<Calendar className="h-5 w-5 text-kts-muted" />}>
      <h1 className="font-editorial text-[40px] leading-none">Динамика кожи</h1>
      <p className="text-kts-muted">Сравниваем фото и записи дневника.</p>
      <div className="grid grid-cols-4 gap-3">{skinDynamics.weeks.map((week, i) => <div key={week.label} className="text-center"><Image src={week.image} alt="" width={110} height={110} className={cn("rounded-[22px] border border-kts-glass-line", i === 3 && "border-kts-accent")} /><div className="mt-2 text-[12px] text-kts-muted">{week.date}</div></div>)}</div>
      <GlassCard className="p-5"><div className="font-editorial text-[28px]">Итоги за 4 недели</div><div className="mt-4 space-y-4">{skinDynamics.metrics.map(metric => <div key={metric.label} className="flex items-center gap-4 border-b border-kts-line pb-3 last:border-0"><div className="h-11 w-11 rounded-full bg-kts-chip" /><div className="flex-1"><div className="font-medium">{metric.label}</div><div className="text-[13px] text-kts-muted">{metric.detail}</div></div><div className="font-editorial text-[30px] text-kts-accent">{metric.value}</div></div>)}</div><MockLineChart /></GlassCard>
      <GlassCard className="p-5"><div className="font-editorial text-[26px]">Что могло повлиять</div><div className="mt-4 space-y-3"><ProfileRow icon={PackagePlus} title="Новый крем" desc="Вы начали использовать новое средство 3 недели назад" onClick={() => {}} /><ProfileRow icon={Sun} title="SPF регулярно" desc="В среднем 6 дней в неделю" onClick={() => {}} /></div></GlassCard>
    </DetailScaffold>
  );
}

function InfoBlock({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return <GlassCard className="flex gap-4 p-5"><Icon className="mt-1 h-6 w-6 shrink-0 text-kts-accent" /><div><div className="text-[20px] font-medium">{title}</div><p className="mt-2 text-[15px] leading-relaxed text-kts-muted">{text}</p></div></GlassCard>;
}

function DetailScaffold({ title, back, right, children }: { title: string; back: () => void; right?: React.ReactNode; children: React.ReactNode }) {
  return <div className="p-6 pb-[130px]"><TopBar title={title} onBack={back} right={right} /><div className="space-y-4">{children}</div></div>;
}

export function InternalApp({ initialTab, hasRoutine, onStartQuestionnaire, onClear }: InternalAppProps) {
  const [tab, setTab] = React.useState<AppTab>(initialTab || "routine");
  const [screen, setScreen] = React.useState<ScreenState>({ name: "main" });
  const [recentDetailScroll, setRecentDetailScroll] = React.useState<Array<{ productId: string; scrollTop: number }>>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevScreenRef = React.useRef<ScreenState>({ name: "main" });

  const rememberScroll = React.useCallback((productId: string, scrollTop: number) => {
    setRecentDetailScroll((prev) => {
      const without = prev.filter((entry) => entry.productId !== productId);
      const next = [...without, { productId, scrollTop }];
      return next.length > 2 ? next.slice(next.length - 2) : next;
    });
  }, []);

  const open = (next: ScreenState) => setScreen(next);
  const back = () => setScreen({ name: "main" });
  const navigateTab = (next: string) => {
    setTab(next as AppTab);
    setScreen({ name: "main" });
  };

  let content: React.ReactNode;
  if (screen.name === "routineStep") content = <RoutineStepDetail state={screen} open={open} back={back} />;
  else if (screen.name === "replaceProduct") content = <ReplaceProduct state={screen} back={back} />;
  else if (screen.name === "productDetail") content = <ProductDetail state={screen} open={open} back={back} />;
  else if (screen.name === "priceCompare") content = <PriceCompare state={screen} back={back} />;
  else if (screen.name === "inciResult") content = <InciResult back={back} />;
  else if (screen.name === "myProducts") content = <MyProducts open={open} back={back} />;
  else if (screen.name === "skinDynamics") content = <SkinDynamics back={back} />;
  else if (tab === "routine") content = <RoutineScreen open={open} />;
  else if (tab === "scan") content = <ScanScreen open={open} />;
  else if (tab === "catalog") content = <CatalogScreen open={open} />;
  else content = <ProfileScreen open={open} onClear={onClear} />;

  React.useEffect(() => {
    const prev = prevScreenRef.current;
    const el = scrollRef.current;
    if (!el) return;

    if (prev.name === "productDetail" && prev.productId) {
      rememberScroll(prev.productId, el.scrollTop);
    }

    if (screen.name === "productDetail" && screen.productId) {
      const found = recentDetailScroll.find((entry) => entry.productId === screen.productId);
      el.scrollTo({ top: found ? found.scrollTop : 0, behavior: "auto" });
    } else {
      el.scrollTo({ top: 0, behavior: "auto" });
    }

    prevScreenRef.current = screen;
  }, [screen, recentDetailScroll, rememberScroll]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || screen.name !== "productDetail" || !screen.productId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => rememberScroll(screen.productId as string, el.scrollTop), 180);
    };
    el.addEventListener("scroll", onScroll);
    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [screen, rememberScroll]);

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div ref={scrollRef} className="hide-scrollbar flex-1 overflow-y-auto">{content}</div>
      <BottomNav current={tab} onNavigate={navigateTab} />
    </div>
  );
}
