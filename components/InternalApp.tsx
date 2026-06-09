"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  CloudSun,
  Droplets,
  Heart,
  History,
  Leaf,
  MapPin,
  PackagePlus,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Tag,
  User,
  Waves,
} from "lucide-react";
import { BottomNav, Button, FixedActionBar, GlassCard, IconButton, SurfaceCard } from "./UI";
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
import { useApiCareToday, useApiProfile, useApiRecommendations } from "@/lib/api/hooks";
import { useTelegram } from "@/lib/telegram/provider";

export type InternalScreenState = {
  name: AppScreen;
  productId?: string;
  stepId?: string;
  startStepId?: string;
};

type InternalAppProps = {
  initialTab: AppTab;
  hasRoutine: boolean;
  onStartQuestionnaire: () => void;
  onClear: () => void;
};

const careDayOptions = [
  { id: "may-27", day: "27", dots: 1, status: "done", greeting: "Уход сохранён.", routineIntro: "Вы выполнили вечерний уход 27-го числа." },
  { id: "may-28", day: "28", dots: 2, status: "done", greeting: "День закрыт.", routineIntro: "Вы выполнили весь уход 28-го числа." },
  { id: "may-29", day: "29", dots: 1, status: "done", greeting: "SPF был на месте.", routineIntro: "Вы выполнили дневную защиту 29-го числа." },
  { id: "may-30", day: "30", dots: 2, status: "done", greeting: "Хороший ритм.", routineIntro: "Вы выполнили весь уход 30-го числа." },
  { id: "may-31", day: "31", dots: 2, status: "done", greeting: "Вчера всё закрыто.", routineIntro: "Вы выполнили весь уход 31-го числа." },
  { id: "jun-01", day: "01", dots: 2, status: "due", greeting: "Доброе утро!", routineIntro: "Вот ваша утренняя рутина." },
  { id: "jun-02", day: "02", dots: 1, status: "planned", greeting: "Завтра без спешки.", routineIntro: "На 2 июня запланирован утренний уход." },
  { id: "jun-03", day: "03", dots: 2, status: "planned", greeting: "План уже собран.", routineIntro: "На 3 июня запланирован утренний уход и дневная SPF-защита." },
  { id: "jun-04", day: "04", dots: 1, status: "planned", greeting: "Лёгкий день.", routineIntro: "На 4 июня запланирована SPF-защита и вечернее восстановление." },
  { id: "jun-05", day: "05", dots: 2, status: "planned", greeting: "Уход впереди.", routineIntro: "На 5 июня запланирован утренний уход." },
  { id: "jun-06", day: "06", dots: 1, status: "planned", greeting: "План готов.", routineIntro: "На 6 июня запланирован вечерний уход." },
  { id: "jun-07", day: "07", dots: 2, status: "planned", greeting: "Неделя продолжается.", routineIntro: "На 7 июня запланирован утренний уход и SPF-защита." },
  { id: "jun-08", day: "08", dots: 1, status: "planned", greeting: "Уход в календаре.", routineIntro: "На 8 июня запланирован вечерний уход." },
  { id: "jun-09", day: "09", dots: 2, status: "planned", greeting: "План уже здесь.", routineIntro: "На 9 июня запланирован полный утренний уход." },
];

const careDaySummary = {
  month: "июнь",
  temperature: "26°",
  city: "Москва",
  uv: "UV 7 высокий",
};

const routineFlowSteps = [
  { stepId: "m1", label: "Очищение", icon: Sparkles },
  { stepId: "m3", label: "Увлажнение", icon: Droplets },
  { stepId: "m4", label: "SPF", icon: Sun },
] as const;

const routineFlowGuidance: Record<string, { lead: string; actions: string[]; note: string }> = {
  m1: {
    lead: "Сними ночь с кожи мягко: без скрипа, трения и ощущения стянутости.",
    actions: ["смочи лицо прохладной водой", "распредели очищение кончиками пальцев", "смой и промокни кожу полотенцем"],
    note: "Если после умывания кожа тянет, в следующий раз уменьши время контакта со средством.",
  },
  m3: {
    lead: "Запечатай влагу тонким слоем, чтобы SPF лёг ровнее и не конфликтовал с кремом.",
    actions: ["возьми небольшую порцию крема", "распредели по щекам, лбу и подбородку", "дай впитаться одну-две минуты"],
    note: "Крем должен ощущаться как мягкая подложка, а не плотная маска.",
  },
  m4: {
    lead: "Сегодня высокий UV, поэтому защита работает как главный дневной шаг.",
    actions: ["нанеси примерно два пальца SPF", "не забудь шею, уши и линию роста волос", "подожди 10-15 минут перед выходом"],
    note: "Если будешь долго на улице, обнови SPF днём.",
  },
};

const demoNotifications = [
  { id: "n1", title: "Напоминание о SPF", text: "Не забудь обновить SPF после обеда." },
  { id: "n2", title: "Сыворотка заканчивается", text: "Осталось примерно на 10 дней использования." },
  { id: "n3", title: "Новая цена", text: "Для Niacinamide 10% найдено предложение дешевле." },
];

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

function TopBar({ title, onBack, right }: { title?: string | null; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between pt-[var(--safe-top)]">
      <button onClick={onBack} className={cn("flex h-11 w-11 items-center justify-center rounded-[16px] border border-kts-line bg-kts-surface/80 text-kts-text", !onBack && "invisible")}>
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-kts-muted">{title === null ? "" : title || "KTS Beauty"}</div>
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
      <button onClick={() => setOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-full border border-kts-accent/35 bg-transparent text-kts-text/72 backdrop-blur-sm transition-colors active:bg-kts-accent/10">
        <Bell className="h-[19px] w-[19px]" strokeWidth={1.45} />
      </button>
      {open && (
        <div className="absolute right-0 top-[48px] z-40 w-[300px] overflow-hidden rounded-[20px] border border-kts-accent/20 bg-kts-bg/88 shadow-2xl backdrop-blur-2xl">
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
    <div className="flex rounded-[18px] border border-kts-line bg-kts-surface/78 p-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn("flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] text-[14px] text-kts-muted transition-all", value === item.id && "bg-kts-accent text-kts-btn-text shadow-sm")}
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
        <button key={item.id} onClick={() => onChange(item.id)} className={cn("h-10 shrink-0 rounded-full border border-kts-line bg-kts-surface/72 px-4 text-[14px] text-kts-muted", value === item.id && "border-kts-accent bg-kts-accent text-kts-btn-text")}>
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
    <SurfaceCard className={cn("p-4", compact ? "flex gap-3" : "flex gap-4")}>
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
    </SurfaceCard>
  );
}

function RoutineStepCard({ step, index, onOpen, onProduct }: { step: typeof routineSteps[number]; index: number; onOpen: () => void; onProduct: () => void }) {
  const product = getProduct(step.productId);
  return (
    <SurfaceCard className="p-4">
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
    </SurfaceCard>
  );
}

function HomeScreen({ open, hasRoutine, onStart }: { open: (screen: InternalScreenState) => void; hasRoutine: boolean; onStart: () => void }) {
  const careQuery = useApiCareToday();
  const care = careQuery.data;
  const skinLine = care
    ? `${care.environment.city} · ${care.environment.temperature_c}° · UV ${care.environment.uv_index}`
    : `${profileSummary.skinType} · цель: ${profileSummary.goals.join(" и ")} · бюджет ${profileSummary.budget}`;
  const routineStepsCount = care?.routine.steps.filter((step) => step.period === care.active_period).length || 4;
  const lowProduct = care?.products_low[0];
  return (
    <div className="px-[var(--screen-x)] pt-[var(--screen-top)] pb-[var(--bottom-nav-inset)]">
      <TopBar right={<NotificationBell />} />
      <h1 className="text-[32px] font-semibold leading-tight">Главная</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-kts-muted">{skinLine}</p>

      <SurfaceCard className="mt-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-kts-muted">Сегодня</div>
            <div className="mt-2 text-[24px] font-semibold">{care?.active_period === "evening" ? "Вечерний ритуал" : "Утренний ритуал"}</div>
            <p className="mt-2 text-[14px] text-kts-muted">{routineStepsCount} шага · {care?.environment.spf_hint || "итоговая стоимость 4 280 ₽"}</p>
          </div>
          <Sparkles className="h-7 w-7 text-kts-accent" />
        </div>
        <Button onClick={() => hasRoutine ? open({ name: "main" }) : onStart()} className="mt-5 w-full">{hasRoutine ? "Открыть рутину" : "Собрать рутину"}</Button>
      </SurfaceCard>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <QuickAction icon={ScanLine} label="Скан состава" onClick={() => open({ name: "inciResult" })} />
        <QuickAction icon={Tag} label="Где дешевле" onClick={() => open({ name: "priceCompare", productId: "serum" })} />
        <QuickAction icon={PackagePlus} label="Мои средства" onClick={() => open({ name: "myProducts" })} />
        <QuickAction icon={Calendar} label="Динамика кожи" onClick={() => open({ name: "skinDynamics" })} />
      </div>

      <SurfaceCard className="mt-5 p-5">
        <div className="font-medium">{lowProduct ? `${lowProduct.product.name} заканчивается` : "Сыворотка заканчивается"}</div>
        <p className="mt-1 text-[14px] text-kts-muted">{lowProduct?.note || "Осталось примерно на 10 дней. Лучшее предложение сейчас в ЛЭТУАЛЬ."}</p>
      </SurfaceCard>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[18px] border border-kts-line bg-kts-surface/78 p-4 text-left active:scale-[0.99]">
      <Icon className="mb-4 h-5 w-5 text-kts-accent" />
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}

type CareDayId = (typeof careDayOptions)[number]["id"];

function CareDayNav({ value, onChange }: { value: CareDayId; onChange: (id: CareDayId) => void }) {
  const itemRefs = React.useRef(new Map<CareDayId, HTMLButtonElement>());

  React.useEffect(() => {
    itemRefs.current.get(value)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [value]);

  return (
    <div className="mt-4">
      <div className="px-0 text-[13px] uppercase leading-none text-kts-muted">{careDaySummary.month}</div>
      <div className="relative -mx-[var(--screen-x)] mt-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-kts-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-kts-bg to-transparent" />
        <div className="hide-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-[calc(50%-35px)] py-1.5">
          {careDayOptions.map((item) => {
            const active = value === item.id;
            const planned = item.status === "planned";
            return (
              <button
                key={item.id}
                ref={(node) => {
                  if (node) itemRefs.current.set(item.id, node);
                  else itemRefs.current.delete(item.id);
                }}
                type="button"
                onClick={() => onChange(item.id)}
                className={cn(
                  "flex h-[74px] w-[70px] shrink-0 snap-center flex-col items-center justify-center rounded-[18px] text-center outline-none transition-colors",
                  active ? "bg-kts-surface/52" : "active:bg-kts-accent/10 focus-visible:bg-kts-accent/10"
                )}
              >
                <span className={cn("font-editorial text-[32px] leading-none text-kts-muted transition-colors", active && "text-kts-text")}>{item.day}</span>
                <span className="mt-3 flex h-2 items-center justify-center gap-1.5">
                  {Array.from({ length: item.dots }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "rounded-full transition-all",
                        planned ? "h-1 w-1 bg-kts-muted/50" : "h-1.5 w-1.5 bg-kts-muted",
                        active && "h-1.5 w-1.5 bg-kts-text"
                      )}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InlineCareChip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-[15px] inline-flex min-h-10 translate-y-[-1px] items-center gap-0 rounded-full border border-kts-accent/70 px-[15px] text-[24px] leading-none text-kts-accent transition-colors active:bg-kts-accent/10"
    >
      {children}
    </button>
  );
}

function InlineTextChip({ children, onClick, compact = false }: { children: React.ReactNode; onClick?: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mx-0.5 inline-flex min-h-9 translate-y-[-3px] items-center rounded-full border border-kts-accent/38 text-[22px] font-light leading-none text-kts-accent transition-colors active:bg-kts-accent/10",
        compact ? "px-1.5" : "px-2.5"
      )}
    >
      {children}
    </button>
  );
}

function CareRoutineRow({ index, label, icon: Icon }: { index: number; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) {
  return (
    <div className="grid grid-cols-[56px_1fr_28px] items-center border-b border-kts-line py-2.5 last:border-b-0">
      <div className="font-editorial text-[28px] leading-none text-kts-text/80">{String(index).padStart(2, "0")}</div>
      <div className="text-[23px] font-light leading-none text-kts-text/86">{label}</div>
      <Icon className="h-6 w-6 text-kts-accent/85" strokeWidth={1.4} />
    </div>
  );
}

function CareFeelingChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-[20px] font-light leading-none transition-colors",
        active ? "border-kts-accent/70 bg-kts-accent/10 text-kts-accent" : "border-kts-accent/38 text-kts-text/74 active:bg-kts-accent/10"
      )}
    >
      {label}
    </button>
  );
}

function SkinInlineFollowup({ feeling }: { feeling: string }) {
  return (
    <div className="animate-skin-reveal mt-4 overflow-hidden rounded-[22px] border border-kts-accent/22 bg-kts-surface/28 p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] text-kts-accent">
        <Sparkles className="h-4 w-4" strokeWidth={1.4} />
        уточним ощущение
      </div>
      <p className="text-[18px] font-light leading-snug text-kts-text/72">
        {feeling === "Комфортно" ? "Отлично. Отметить, после какого шага коже особенно комфортно?" : feeling === "Сухость" ? "Понял. Где сильнее ощущается сухость?" : "Понял. Насколько заметно покраснение сейчас?"}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(feeling === "Комфортно" ? ["после очищения", "после крема", "после SPF"] : feeling === "Сухость" ? ["щёки", "нос", "вся кожа"] : ["слегка", "заметно", "мешает"]).map((item) => (
          <button key={item} type="button" className="rounded-full border border-kts-accent/35 px-3 py-2 text-[15px] font-light text-kts-text/72 active:bg-kts-accent/10">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function RoutineScreen({ open }: { open: (screen: InternalScreenState) => void }) {
  const [selectedDay, setSelectedDay] = React.useState<CareDayId>("jun-01");
  const [selectedFeeling, setSelectedFeeling] = React.useState<string | null>(null);
  const dayScenario = careDayOptions.find((item) => item.id === selectedDay) || careDayOptions[2];
  const visibleSteps = [
    { label: "Очищение", icon: Sparkles },
    { label: "Увлажнение", icon: Droplets },
    { label: "SPF", icon: Sun },
  ];
  const isDueToday = dayScenario.status === "due";

  return (
    <div className="px-[var(--screen-x)] pb-[var(--bottom-nav-inset)]">
      <div className="sticky top-0 z-30 -mx-[var(--screen-x)] flex items-center justify-between gap-4 bg-kts-bg/82 px-[var(--screen-x)] pb-3 pt-[calc(10px+var(--safe-top))] backdrop-blur-xl">
        <h1 className="font-editorial text-[38px] font-normal leading-none text-kts-text/78">Мой уход</h1>
        <NotificationBell />
      </div>

      <CareDayNav value={selectedDay} onChange={setSelectedDay} />

      <div className="mt-5 flex items-center gap-2 whitespace-nowrap text-[14px] font-light leading-none text-kts-text/66">
        <button type="button" onClick={() => open({ name: "weatherDay" })} className="inline-flex items-center gap-1.5 rounded-full py-1 text-kts-text/68 active:text-kts-accent">
          <Sun className="h-4 w-4 shrink-0 text-kts-accent/80" strokeWidth={1.35} />
          <span>{careDaySummary.temperature},</span>
          <span>{careDaySummary.uv}</span>
        </button>
        <button type="button" onClick={() => open({ name: "locationPicker" })} className="inline-flex items-center gap-1.5 rounded-full py-1 text-kts-text/68 active:text-kts-accent">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-kts-chip text-kts-muted">
            <Send className="h-3 w-3" strokeWidth={1.6} />
          </span>
          <span>{careDaySummary.city}</span>
        </button>
      </div>

      <section className="mt-5">
        <h2 className="font-editorial text-[43px] font-normal leading-none text-kts-text/72">{dayScenario.greeting}</h2>
        <p className="mt-3 text-[21px] font-light leading-snug text-kts-text/74">{dayScenario.routineIntro}</p>
      </section>

      <div className="mt-5">
        {visibleSteps.map((step, index) => (
          <CareRoutineRow key={step.label} index={index + 1} label={step.label} icon={step.icon} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => open({ name: "routineFlow", startStepId: "m1" })}
        className="mx-auto mt-5 flex h-[56px] w-[72%] items-center justify-center rounded-full border border-kts-accent/85 text-[22px] font-light text-kts-accent transition-colors active:bg-kts-accent/10"
      >
        {isDueToday ? "Начать рутину" : "Открыть уход"}
      </button>

      {isDueToday && (
        <p className="mt-7 text-[23px] font-light leading-snug text-kts-text/74">
          Сегодня высокий UV, перед выходом не забудь
          <InlineCareChip onClick={() => open({ name: "routineFlow", startStepId: "m4" })}>нанести SPF</InlineCareChip>
        </p>
      )}

      <section className="mt-8">
        <h3 className="text-[23px] font-light leading-snug text-kts-text/78">Как ощущается твоя кожа сегодня?</h3>
        <div className="hide-scrollbar -mx-[var(--screen-x)] mt-4 flex gap-3 overflow-x-auto px-[var(--screen-x)]">
          {["Комфортно", "Сухость", "Покраснение"].map((label) => (
            <CareFeelingChip key={label} label={label} active={selectedFeeling === label} onClick={() => setSelectedFeeling(label)} />
          ))}
        </div>
        {selectedFeeling && <SkinInlineFollowup feeling={selectedFeeling} />}
      </section>

      <p className="mt-8 text-[22px] font-light leading-snug text-kts-text/74">
        Хочешь
        <InlineTextChip onClick={() => open({ name: "replaceProduct", stepId: "m2" })}>обновить уход</InlineTextChip>
        или открыть
        <InlineTextChip compact onClick={() => open({ name: "skinDynamics" })}>дневник кожи</InlineTextChip>
        ?
      </p>

      <div className="mt-5 flex h-[66px] items-center rounded-full border border-kts-accent/45 bg-kts-surface/35 pl-7 pr-2">
        <input aria-label="спросить вопрос" placeholder="спросить вопрос" className="min-w-0 flex-1 bg-transparent text-[23px] font-light text-kts-text outline-none placeholder:text-kts-muted" />
        <button type="button" className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-kts-accent/25 text-kts-text">
          <ChevronRight className="h-8 w-8" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function ScanScreen({ open }: { open: (screen: InternalScreenState) => void }) {
  const cards = [
    ["INCI-сканер", "Разберем состав по фото", ScanLine],
    ["Штрихкод", "Найдем средство в базе", Search],
    ["Фото продукта", "Определим банку и цены", ShoppingBag],
    ["Фото кожи", "Сравним динамику", User],
  ] as const;
  return (
    <div className="px-[var(--screen-x)] pt-[var(--screen-top)] pb-[var(--bottom-nav-inset)]">
      <TopBar right={<History className="h-5 w-5 text-kts-muted" />} />
      <h1 className="text-[32px] font-semibold leading-tight">Скан</h1>
      <p className="mt-3 text-[15px] text-kts-muted">Проверяй составы, продукты и прогресс кожи в одном месте.</p>
      <div className="mt-6 grid gap-3">
        {cards.map(([title, desc, Icon]) => (
          <button key={title} onClick={() => open({ name: title === "INCI-сканер" ? "inciResult" : "skinDynamics" })} className="rounded-[18px] border border-kts-line bg-kts-surface/78 p-5 text-left active:scale-[0.99]">
            <Icon className="mb-5 h-6 w-6 text-kts-accent" />
            <div className="text-[20px] font-semibold">{title}</div>
            <div className="mt-1 text-[14px] text-kts-muted">{desc}</div>
          </button>
        ))}
      </div>
      <SurfaceCard className="mt-5 p-5">
        <div className="font-medium">Последний скан</div>
        <p className="mt-1 text-[14px] text-kts-muted">Niacinamide Balance Serum · с осторожностью из-за отдушки.</p>
      </SurfaceCard>
    </div>
  );
}

function CatalogScreen({ open }: { open: (screen: InternalScreenState) => void }) {
  const [filter, setFilter] = React.useState("postacne");
  const recommendationsQuery = useApiRecommendations();
  const recommendations = recommendationsQuery.data?.slice(0, 3) || [];
  return (
    <div className="px-[var(--screen-x)] pt-[var(--screen-top)] pb-[var(--bottom-nav-inset)]">
      <TopBar right={<Search className="h-5 w-5 text-kts-muted" />} />
      <h1 className="text-[32px] font-semibold leading-tight">Каталог</h1>
      <p className="mt-3 text-[15px] text-kts-muted">Подборки под профиль кожи, бюджет и ограничения.</p>
      <div className="mt-6"><FilterChipRow value={filter} onChange={setFilter} items={[{ id: "postacne", label: "Постакне" }, { id: "spf", label: "SPF" }, { id: "no-fragrance", label: "Без отдушек" }, { id: "budget", label: "до 1500 ₽" }]} /></div>
      <div className="mt-2 text-[12px] text-kts-muted">{recommendations.length ? "Первые карточки подтянуты из backend-рекомендаций." : "Фильтры сейчас работают как mock-подборки прототипа."}</div>
      {recommendations.length > 0 && (
        <div className="mt-5 space-y-3">
          {recommendations.map((item) => (
            <SurfaceCard key={item.product.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] uppercase tracking-[0.16em] text-kts-muted">{item.product.category} · score {item.score}</div>
                  <div className="mt-1 font-editorial text-[22px] leading-tight">{item.product.name}</div>
                  <div className="mt-1 text-[14px] text-kts-muted">{item.product.brand}</div>
                  <div className="mt-3 text-[13px] text-kts-muted">{item.reasons.join(" · ")}</div>
                </div>
                <div className="shrink-0 text-right text-[15px] font-medium">{item.best_offer ? money(item.best_offer.price) : "—"}</div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
      <div className="mt-5 space-y-3">
        {[...products, ...alternatives].slice(0, 7).map((product) => <ProductCard key={product.id} product={product} onOpen={() => open({ name: "productDetail", productId: product.id })} />)}
      </div>
    </div>
  );
}

function ProfileScreen({ open, onClear }: { open: (screen: InternalScreenState) => void; onClear: () => void }) {
  const [theme, setTheme] = React.useState(() => (typeof window === "undefined" ? "dark" : localStorage.getItem("kts-theme") || "dark"));
  const profileQuery = useApiProfile();
  const telegram = useTelegram();
  const apiProfile = profileQuery.data;
  const skinType = apiProfile?.skin_type || profileSummary.skinType;
  const goals = apiProfile?.goals?.length ? apiProfile.goals : profileSummary.goals;
  const budget = apiProfile?.budget_limit ? `до ${apiProfile.budget_limit.toLocaleString("ru-RU")} ₽` : profileSummary.budget;
  const sourceLabel = apiProfile ? "Backend profile" : profileQuery.isLoading ? "Синхронизация" : "Local fallback";
  const profileName = telegram.telegramUser?.first_name || telegram.authUser?.display_name || profileSummary.name;
  const avatarLetter = profileName.slice(0, 1).toUpperCase();
  const toggleTheme = (next: string) => {
    setTheme(next);
    localStorage.setItem("kts-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  return (
    <div className="px-[var(--screen-x)] pt-[var(--screen-top)] pb-[var(--bottom-nav-inset)]">
      <TopBar right={<NotificationBell />} />
      <h1 className="text-[32px] font-semibold leading-tight">Профиль</h1>
      <SurfaceCard className="mt-6 flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kts-accent text-kts-btn-text">{avatarLetter}</div>
        <div>
          <div className="text-[18px] font-medium">{profileName}</div>
          <div className="text-[13px] text-kts-muted">{skinType}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-kts-muted/70">{sourceLabel}</div>
        </div>
      </SurfaceCard>
      <TelegramDiagnostics telegram={telegram} />
      <div className="mt-5"><SegmentedControl value={theme} onChange={toggleTheme} items={[{ id: "dark", label: "Тёмная" }, { id: "light", label: "Светлая" }]} /></div>
      <div className="mt-5 space-y-3">
        <ProfileRow icon={PackagePlus} title="Мои средства" desc="Что используется, заканчивается и не подошло" onClick={() => open({ name: "myProducts" })} />
        <ProfileRow icon={Calendar} title="Динамика кожи" desc="Фото и метрики по неделям" onClick={() => open({ name: "skinDynamics" })} />
        <ProfileRow icon={ShieldCheck} title="Данные анкеты" desc={`${goals.join(", ")} · ${budget}`} onClick={() => {}} />
      </div>
      <Button variant="ghost" className="mt-6 w-full" onClick={onClear}>Очистить данные</Button>
    </div>
  );
}

function TelegramDiagnostics({ telegram }: { telegram: ReturnType<typeof useTelegram> }) {
  if (process.env.NODE_ENV === "production") return null;

  const rows = [
    ["Telegram WebApp", telegram.isTelegramEnvironment ? "available" : "missing"],
    ["initData", telegram.initData ? "present" : "empty"],
    ["user", telegram.telegramUser ? "present" : "empty"],
    ["id", telegram.telegramUser?.id ? String(telegram.telegramUser.id) : "n/a"],
    ["username", telegram.telegramUser?.username ? `@${telegram.telegramUser.username}` : "n/a"],
    ["first_name", telegram.telegramUser?.first_name || "n/a"],
    ["auth", telegram.authError || (telegram.isReady ? "ready" : "loading")],
  ];

  return (
    <SurfaceCard className="mt-4 p-4">
      <div className="mb-3 text-[12px] uppercase tracking-[0.16em] text-kts-muted">Telegram debug</div>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 text-[12px]">
            <span className="w-28 shrink-0 text-kts-muted">{label}</span>
            <span className="min-w-0 break-words text-kts-text">{value}</span>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

function ProfileRow({ icon: Icon, title, desc, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-[18px] border border-kts-line bg-kts-surface/78 p-4 text-left active:scale-[0.99]">
      <Icon className="h-5 w-5 text-kts-accent" />
      <span className="min-w-0 flex-1"><span className="block font-medium">{title}</span><span className="block text-[13px] text-kts-muted">{desc}</span></span>
      <ChevronRight className="h-5 w-5 text-kts-muted" />
    </button>
  );
}

function RoutineStepDetail({ state, open, back }: { state: InternalScreenState; open: (s: InternalScreenState) => void; back: () => void }) {
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

function RoutineFlow({ state, open, back }: { state: InternalScreenState; open: (s: InternalScreenState) => void; back: () => void }) {
  const initialIndex = Math.max(0, routineFlowSteps.findIndex((item) => item.stepId === state.startStepId));
  const [index, setIndex] = React.useState(initialIndex);
  const [done, setDone] = React.useState(false);
  const flowStep = routineFlowSteps[index] || routineFlowSteps[0];
  const step = routineSteps.find((item) => item.id === flowStep.stepId) || routineSteps[0];
  const product = getProduct(step.productId);
  const guidance = routineFlowGuidance[step.id] || {
    lead: step.goal,
    actions: [step.how],
    note: step.why,
  };
  const pct = ((index + 1) / routineFlowSteps.length) * 100;
  const FlowIcon = flowStep.icon;

  const goBack = () => {
    if (done) {
      setDone(false);
      setIndex(routineFlowSteps.length - 1);
      return;
    }
    if (index === 0) back();
    else setIndex((value) => value - 1);
  };

  const goNext = () => {
    if (done) {
      back();
      return;
    }
    if (index === routineFlowSteps.length - 1) setDone(true);
    else setIndex((value) => value + 1);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-kts-bg">
      <div className="px-[var(--screen-x)] pt-[calc(var(--safe-top)+12px)]">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-kts-accent/35 text-kts-text/72">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.45} />
          </button>
          <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-kts-muted">KTS Beauty</div>
          <button onClick={back} className="text-[13px] text-kts-muted">Закрыть</button>
        </div>
      </div>

      {!done ? (
        <>
          <div className="px-[var(--screen-x)] pt-6">
            <span className="mb-2 inline-block text-[12px] font-medium uppercase tracking-wide text-kts-muted">{index + 1} из {routineFlowSteps.length}</span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-kts-line">
              <div className="h-full rounded-full bg-kts-accent transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="hide-scrollbar flex-1 overflow-y-auto px-[var(--screen-x)] pb-[var(--fixed-cta-inset)] pt-5">
            <div className="rounded-[24px] border border-kts-accent/18 bg-[linear-gradient(145deg,rgba(215,183,141,0.10),rgba(255,255,255,0.025)_44%,rgba(215,183,141,0.06))] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-kts-accent">
                  <FlowIcon className="h-7 w-7" strokeWidth={1.35} />
                  <span className="text-[13px] uppercase tracking-[0.18em]">{flowStep.label}</span>
                </div>
                <span className="font-editorial text-[28px] leading-none text-kts-text/36">0{index + 1}</span>
              </div>
              <h1 className="mt-6 font-editorial text-[46px] font-normal leading-none text-kts-text/86">{step.label}</h1>
              <p className="mt-3 text-[18px] font-light leading-snug text-kts-text/68">{guidance.lead}</p>
              <div className="mt-4 border-t border-kts-line/70 pt-3 text-[14px] font-light leading-snug text-kts-text/54">
                {guidance.note}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-3 text-[12px] uppercase tracking-[0.18em] text-kts-muted">Сделай сейчас</div>
              <div className="space-y-2">
                {guidance.actions.map((action, actionIndex) => (
                  <div key={action} className="grid grid-cols-[34px_1fr] items-start gap-3 border-b border-kts-line/70 pb-2.5 last:border-b-0 last:pb-0">
                    <span className="font-editorial text-[24px] leading-none text-kts-accent/82">{String(actionIndex + 1).padStart(2, "0")}</span>
                    <span className="text-[17px] font-light leading-snug text-kts-text/76">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => open({ name: "productDetail", productId: product.id })} className="mt-4 flex w-full items-center gap-3.5 rounded-[20px] border border-kts-line/80 bg-kts-surface/34 p-3.5 text-left transition-colors active:bg-kts-accent/8">
              <ProductPackshot product={product} className="h-14 w-14 rounded-[15px]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] uppercase tracking-[0.16em] text-kts-muted">Средство для шага</span>
                <span className="mt-1 block truncate text-[16px] text-kts-text/82">{product.name}</span>
                <span className="mt-1.5 block text-[13px] text-kts-accent">{product.brand} · карточка средства</span>
              </span>
              <ChevronRight className="h-5 w-5 text-kts-muted" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col justify-center px-[var(--screen-x)] pb-[var(--fixed-cta-inset)]">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-kts-accent/45 text-kts-accent">
            <Check className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="font-editorial text-[50px] font-normal leading-none text-kts-text/82">Уход выполнен</h1>
          <p className="mt-5 text-[22px] font-light leading-snug text-kts-text/70">Кожа получила очищение, увлажнение и защиту. После ухода можно отметить ощущения на экране «Мой уход».</p>
        </div>
      )}

      <FixedActionBar>
        <IconButton onClick={goBack} />
        <Button onClick={goNext} className="flex-1">
          {done ? "Вернуться в Мой уход" : index === routineFlowSteps.length - 1 ? "Завершить уход" : "Далее"}
        </Button>
      </FixedActionBar>
    </div>
  );
}

function WeatherDay({ back }: { back: () => void }) {
  const forecast = [
    { time: "сейчас", temp: "26°", note: "UV 7 высокий" },
    { time: "14:00", temp: "28°", note: "обновить SPF" },
    { time: "18:00", temp: "24°", note: "мягкое солнце" },
    { time: "21:00", temp: "19°", note: "вечерний уход" },
  ];
  return (
    <DetailScaffold title="Погода" back={back} right={<CloudSun className="h-5 w-5 text-kts-muted" />}>
      <h1 className="font-editorial text-[44px] font-normal leading-none text-kts-text/82">Погода на день</h1>
      <p className="text-[18px] font-light leading-snug text-kts-text/68">Москва, сегодня. Позже сюда можно подключить прогноз и UV-индекс из API.</p>
      <GlassCard className="p-5">
        <div className="flex items-center gap-4">
          <Sun className="h-9 w-9 text-kts-accent" strokeWidth={1.35} />
          <div>
            <div className="font-editorial text-[48px] leading-none">26°</div>
            <div className="mt-1 text-[14px] text-kts-muted">UV 7 высокий · SPF обязателен</div>
          </div>
        </div>
      </GlassCard>
      <div className="space-y-2">
        {forecast.map((item) => (
          <button key={item.time} className="flex w-full items-center rounded-[18px] border border-kts-line bg-kts-surface/55 px-4 py-3 text-left">
            <Clock className="mr-3 h-5 w-5 text-kts-accent" strokeWidth={1.4} />
            <span className="flex-1 text-[16px] text-kts-text/78">{item.time}</span>
            <span className="mr-3 font-editorial text-[28px] leading-none">{item.temp}</span>
            <span className="text-[13px] text-kts-muted">{item.note}</span>
          </button>
        ))}
      </div>
    </DetailScaffold>
  );
}

function LocationPicker({ back }: { back: () => void }) {
  const places = [
    { city: "Москва", time: "GMT+3", selected: true },
    { city: "Санкт-Петербург", time: "GMT+3" },
    { city: "Тбилиси", time: "GMT+4" },
    { city: "Ереван", time: "GMT+4" },
    { city: "Дубай", time: "GMT+4" },
  ];
  return (
    <DetailScaffold title="Локация" back={back} right={<MapPin className="h-5 w-5 text-kts-muted" />}>
      <h1 className="font-editorial text-[42px] font-normal leading-none text-kts-text/82">Город и время</h1>
      <p className="text-[18px] font-light leading-snug text-kts-text/68">Выбор как в часовом поясе: город меняет погоду, UV и локальные напоминания.</p>
      <div className="rounded-[22px] border border-kts-line bg-kts-surface/45 p-2">
        {places.map((place) => (
          <button key={place.city} className="flex w-full items-center rounded-[18px] px-4 py-3 text-left active:bg-kts-accent/10">
            <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-kts-chip text-kts-muted">
              <Send className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <span className="flex-1">
              <span className="block text-[18px] text-kts-text/82">{place.city}</span>
              <span className="block text-[13px] text-kts-muted">{place.time}</span>
            </span>
            {place.selected && <Check className="h-5 w-5 text-kts-accent" strokeWidth={1.5} />}
          </button>
        ))}
      </div>
    </DetailScaffold>
  );
}

function SkinCheck({ back }: { back: () => void }) {
  const [step, setStep] = React.useState(1);
  const total = 3;
  const pct = (step / total) * 100;
  const options = step === 1 ? ["Комфортно", "Стянутость", "Жжение"] : step === 2 ? ["Сухость", "Жирный блеск", "Покраснение"] : ["После SPF", "После сыворотки", "Без причины"];
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-kts-bg">
      <div className="px-[var(--screen-x)] pt-[calc(var(--safe-top)+12px)]">
        <div className="flex items-center justify-between">
          <button onClick={back} className="flex h-10 w-10 items-center justify-center rounded-full border border-kts-accent/35 text-kts-text/72">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.45} />
          </button>
          <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-kts-muted">Состояние кожи</div>
          <div className="w-10" />
        </div>
        <div className="pt-6">
          <span className="mb-2 inline-block text-[12px] font-medium uppercase tracking-wide text-kts-muted">{step} из {total}</span>
          <div className="h-1 w-full overflow-hidden rounded-full bg-kts-line">
            <div className="h-full rounded-full bg-kts-accent transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="hide-scrollbar flex-1 overflow-y-auto px-[var(--screen-x)] pb-[var(--fixed-cta-inset)] pt-8">
        <h1 className="font-editorial text-[44px] font-normal leading-none text-kts-text/82">{step === 1 ? "Как кожа сейчас?" : step === 2 ? "Что заметнее всего?" : "С чем связываешь?"}</h1>
        <p className="mt-4 text-[19px] font-light leading-snug text-kts-text/68">Ответ займёт пару секунд и поможет подстроить уход на сегодня.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          {options.map((option) => (
            <button key={option} className="rounded-full border border-kts-accent/55 px-[15px] py-3 text-[20px] font-light text-kts-text/78 active:bg-kts-accent/10">{option}</button>
          ))}
        </div>
      </div>
      <FixedActionBar>
        <Button variant="secondary" onClick={() => step === 1 ? back() : setStep((value) => value - 1)} className="w-[92px]">Назад</Button>
        <Button onClick={() => step === total ? back() : setStep((value) => value + 1)} className="flex-1">{step === total ? "Сохранить" : "Дальше"}</Button>
      </FixedActionBar>
    </div>
  );
}

function ProductDetail({ state, open, back }: { state: InternalScreenState; open: (s: InternalScreenState) => void; back: () => void }) {
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

function PriceCompare({ state, back }: { state: InternalScreenState; back: () => void }) {
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

function ReplaceProduct({ state, back }: { state: InternalScreenState; back: () => void }) {
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

function MyProducts({ open, back }: { open: (s: InternalScreenState) => void; back: () => void }) {
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
  return <div className="px-[var(--screen-x)] pt-[var(--screen-top)] pb-[var(--screen-bottom)]"><TopBar title={title} onBack={back} right={right} /><div className="space-y-4">{children}</div></div>;
}

export function InternalApp({ initialTab, hasRoutine, onStartQuestionnaire, onClear }: InternalAppProps) {
  const [tab, setTab] = React.useState<AppTab>(initialTab || "routine");
  const [screen, setScreen] = React.useState<InternalScreenState>({ name: "main" });
  const [recentDetailScroll, setRecentDetailScroll] = React.useState<Array<{ productId: string; scrollTop: number }>>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevScreenRef = React.useRef<InternalScreenState>({ name: "main" });

  const rememberScroll = React.useCallback((productId: string, scrollTop: number) => {
    setRecentDetailScroll((prev) => {
      const without = prev.filter((entry) => entry.productId !== productId);
      const next = [...without, { productId, scrollTop }];
      return next.length > 2 ? next.slice(next.length - 2) : next;
    });
  }, []);

  const open = (next: InternalScreenState) => setScreen(next);
  const back = () => setScreen({ name: "main" });
  const navigateTab = (next: string) => {
    setTab(next as AppTab);
    setScreen({ name: "main" });
  };

  let content: React.ReactNode;
  if (screen.name === "routineFlow") content = <RoutineFlow state={screen} open={open} back={back} />;
  else if (screen.name === "routineStep") content = <RoutineStepDetail state={screen} open={open} back={back} />;
  else if (screen.name === "replaceProduct") content = <ReplaceProduct state={screen} back={back} />;
  else if (screen.name === "productDetail") content = <ProductDetail state={screen} open={open} back={back} />;
  else if (screen.name === "priceCompare") content = <PriceCompare state={screen} back={back} />;
  else if (screen.name === "inciResult") content = <InciResult back={back} />;
  else if (screen.name === "myProducts") content = <MyProducts open={open} back={back} />;
  else if (screen.name === "skinDynamics") content = <SkinDynamics back={back} />;
  else if (screen.name === "weatherDay") content = <WeatherDay back={back} />;
  else if (screen.name === "locationPicker") content = <LocationPicker back={back} />;
  else if (screen.name === "skinCheck") content = <SkinCheck back={back} />;
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
      {screen.name === "main" && <BottomNav current={tab} onNavigate={navigateTab} />}
    </div>
  );
}
