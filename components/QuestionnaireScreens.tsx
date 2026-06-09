"use client";
import * as React from "react";
import { AppAnswers } from "@/lib/domain/questionnaire";
import { OptionCard, Button, IconButton, RetailerChip, FixedActionBar, SurfaceCard } from "./UI";

interface QProps {
  stepIndex: number;
  direction: number;
  answers: AppAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<AppAnswers>>;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

function WizardLayout({
  step,
  total = 7,
  title,
  subtitle,
  onBack,
  onNext,
  onSkip,
  canNext,
  children
}: {
  step: number;
  total?: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  canNext: boolean;
  children: React.ReactNode;
}) {
  const pct = (step / total) * 100;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-kts-bg overflow-hidden">
      <div className="px-[var(--screen-x)] flex items-center justify-between z-10 pt-[calc(var(--safe-top)+12px)] pb-2">
         <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-kts-muted">KTS Beauty</div>
         <button onClick={onSkip} className="text-[13px] text-kts-muted hover:text-kts-text px-2 py-1 transition-colors">Пропустить</button>
      </div>

      <div className="px-[var(--screen-x)] pt-3 pb-3 z-10">
         <div className="mb-4">
            <span className="text-[12px] font-medium tracking-wide uppercase text-kts-muted mb-2 inline-block">{step} из {total}</span>
            <div className="h-1 w-full bg-kts-line rounded-full overflow-hidden">
               <div className="h-full bg-kts-accent rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
            </div>
         </div>
         <h2 className="text-[28px] font-semibold tracking-normal leading-[1.08] mb-2 text-kts-text">{title}</h2>
         {subtitle && <p className="text-kts-muted opacity-90 leading-snug text-[14px]">{subtitle}</p>}
      </div>

      <div className="flex-1 min-h-0 px-[var(--screen-x)] z-0 relative pb-[var(--fixed-cta-inset)]">
        <div
          ref={scrollRef}
          className="relative z-10 h-full min-h-0 overflow-y-auto hide-scrollbar pt-2 pr-0.5"
        >
          {children}
        </div>
      </div>

      <FixedActionBar>
        <IconButton onClick={onBack} />
        <Button disabled={!canNext} onClick={onNext} className="flex-1">Далее</Button>
      </FixedActionBar>
    </div>
  );
}

export function QStep1({ answers, setAnswers, onNext, onBack, onSkip, stepIndex }: QProps) {
  const opts = [
    { id: 'face', title: 'Уход за лицом', desc: 'очищение, сыворотки, крем, SPF' },
    { id: 'body', title: 'Уход за телом', desc: 'увлажнение, текстура, чувствительность' },
    { id: 'hair', title: 'Волосы', desc: 'кожа головы, сухость, восстановление' },
    { id: 'spf', title: 'SPF', desc: 'защита на каждый день в городе или отпуске' },
  ];

  const handleToggle = (id: string) => {
    setAnswers(s => ({
      ...s,
      category: s.category.includes(id) ? s.category.filter(x => x !== id) : [...s.category, id]
    }))
  };

  const isSel = answers.category.length > 0;

  return (
    <WizardLayout step={1} title={<>Что хочешь<br/>подобрать?</>} subtitle="Выбери направления, с которых начнём." onBack={onBack} onNext={onNext} onSkip={onSkip} canNext={isSel}>
      <div className="flex flex-col gap-2.5 pt-2">
        {opts.map((o) => (
           <OptionCard 
             key={o.id} 
             title={o.title} 
             desc={o.desc}
             selected={answers.category.includes(o.id)}
             onClick={() => handleToggle(o.id)}
           />
        ))}
      </div>
    </WizardLayout>
  );
}

export function QStep2({ answers, setAnswers, onNext, onBack, onSkip, stepIndex }: QProps) {
  const opts = ["Постакне", "Жирный блеск", "Увлажнение", "Ровный тон", "Чувствительность", "Сияние", "SPF-защита", "Морщины"];
  const toggle = (id: string) => {
    setAnswers(s => ({
      ...s,
      focus: s.focus.includes(id) ? s.focus.filter(x => x !== id) : [...s.focus, id]
    }))
  };
  const isSel = answers.focus.length > 0;

  return (
    <WizardLayout step={2} title={<>Что сейчас важнее<br/>всего для кожи?</>} subtitle="Можно выбрать несколько" onBack={onBack} onNext={onNext} onSkip={onSkip} canNext={isSel}>
      <div className="flex flex-wrap gap-2.5 content-start pt-2 pb-2">
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => toggle(o)}
            className={[
              "inline-flex h-11 items-center rounded-full border px-5 text-[15px] font-medium whitespace-nowrap transition-all",
              answers.focus.includes(o)
                ? "bg-kts-accent border-kts-accent text-kts-btn-text"
                : "bg-kts-surface/72 border-kts-line text-kts-text hover:bg-kts-surface"
            ].join(" ")}
          >
            {o}
          </button>
        ))}
      </div>
    </WizardLayout>
  );
}

export function QStep3({ answers, setAnswers, onNext, onBack, onSkip, stepIndex }: QProps) {
  const opts = ["Сухая", "Жирная", "Комбинированная", "Нормальная", "Чувствительная", "Не знаю"];
  const isSel = !!answers.skinType;
  return (
    <WizardLayout step={3} title={<>Какой у тебя<br/>тип кожи?</>} subtitle="Если не уверена, можно выбрать «Не знаю»." onBack={onBack} onNext={onNext} onSkip={onSkip} canNext={isSel}>
      <div className="flex flex-col gap-2.5 pt-2 pb-2">
        {opts.map((o) => (
           <OptionCard key={o} title={o} selected={answers.skinType === o} onClick={() => setAnswers(s => ({ ...s, skinType: o }))} />
        ))}
      </div>
    </WizardLayout>
  );
}

export function QStep4({ answers, setAnswers, onNext, onBack, onSkip, stepIndex }: QProps) {
  const toggles = ["Кожа легко раздражается", "Есть аллергические реакции", "Не люблю активные формулы"];
  const chips = ["Ретинол", "Кислоты", "Спирт", "Отдушки", "Эфирные масла", "Комедогенные масла"];

  const toggleSensitivity = (id: string) => setAnswers(s => ({
    ...s, restrictions: { ...s.restrictions, sensitivity: { ...s.restrictions.sensitivity, [id]: !s.restrictions.sensitivity[id] } }
  }));
  const toggleChip = (id: string) => setAnswers(s => ({
    ...s, restrictions: { ...s.restrictions, exclude: s.restrictions.exclude.includes(id) ? s.restrictions.exclude.filter(x => x !== id) : [...s.restrictions.exclude, id] }
  }));

  // Not mandatory to select restrictions, so always enabled next
  return (
    <WizardLayout step={4} title={<>Есть ли<br/>ограничения?</>} onBack={onBack} onNext={onNext} onSkip={onSkip} canNext={true}>
      <div className="flex flex-col pt-1 pb-2 gap-4">
        <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase px-1 opacity-70">Чувствительность</div>
        <div className="flex flex-col gap-2.5">
           {toggles.map((t) => (
              <OptionCard key={t} title={t} selected={!!answers.restrictions.sensitivity[t]} onClick={() => toggleSensitivity(t)} />
           ))}
        </div>

        <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase pt-2 px-1 opacity-70">Исключить из рекомендаций</div>
        <div className="flex flex-wrap gap-2 content-start">
           {chips.map((c) => (
              <button
                key={c}
                onClick={() => toggleChip(c)}
                className={[
                  "inline-flex h-11 items-center rounded-full border px-5 text-[15px] font-medium transition-all",
                  answers.restrictions.exclude.includes(c)
                    ? "bg-kts-accent border-kts-accent text-kts-btn-text"
                    : "bg-kts-surface/72 border-kts-line text-kts-text hover:bg-kts-surface"
                ].join(" ")}
              >
                {c}
              </button>
           ))}
        </div>
      </div>
    </WizardLayout>
  );
}

export function QStep5({ answers, setAnswers, onNext, onBack, onSkip, stepIndex }: QProps) {
  const ages = ["до 18", "18–24", "25–34", "35–44", "45+"];
  const expr = ["Помоги разобраться", "Знаю базу", "Разбираюсь хорошо"];
  
  const canNext = !!answers.age && !!answers.experience;

  return (
    <WizardLayout step={5} title={<>Немного<br/>о тебе</>} onBack={onBack} onNext={onNext} onSkip={onSkip} canNext={canNext}>
      <div className="flex flex-col gap-8 pt-2">
        <div>
           <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase mb-3 px-1 opacity-70">Возраст</div>
           <div className="flex flex-col gap-2.5">
             {ages.map(a => <OptionCard key={a} title={a} selected={answers.age === a} onClick={() => setAnswers(s => ({ ...s, age: a }))} />)}
           </div>
        </div>
        <div>
           <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase mb-3 px-1 opacity-70">Опыт в уходе</div>
           <div className="flex flex-col gap-2.5">
             {expr.map(e => <OptionCard key={e} title={e} selected={answers.experience === e} onClick={() => setAnswers(s => ({ ...s, experience: e }))} />)}
           </div>
        </div>
      </div>
    </WizardLayout>
  );
}

export function QStep6({ answers, setAnswers, onNext, onBack, onSkip, stepIndex }: QProps) {
  const budgets = [
    { id: 'b1', title: 'Базовый', desc: 'до 1 500 ₽' },
    { id: 'b2', title: 'Сбалансированный', desc: 'около 4 000 ₽' },
    { id: 'b3', title: 'Premium', desc: 'от 8 000 ₽' }
  ];
  const stores = [
    { id: 'ЗЯ', name: 'Золотое Яблоко', imageSrc: '/assets/retailers/golden-apple.png' },
    { id: 'ЛЭТУАЛЬ', name: 'ЛЭТУАЛЬ', imageSrc: '/assets/retailers/letual.png' },
    { id: 'РИВ ГОШ', name: 'РИВ ГОШ', imageSrc: '/assets/retailers/rive-gauche.png' },
    { id: 'Ozon', name: 'Ozon', imageSrc: '/assets/retailers/ozon.png' },
    { id: 'WB', name: 'Wildberries', imageSrc: '/assets/retailers/wildberries.png' },
  ];

  const toggleS = (id: string) => setAnswers(s => ({
    ...s, stores: s.stores.includes(id) ? s.stores.filter(x => x !== id) : [...s.stores, id]
  }));
  const canNext = !!answers.budget;

  return (
    <WizardLayout step={6} title={<>Какой уход<br/>собираем?</>} subtitle="Выбери комфортный бюджет." onBack={onBack} onNext={onNext} onSkip={onSkip} canNext={canNext}>
      <div className="flex flex-col gap-8 pt-2">
        <div className="flex flex-col gap-2.5">
          {budgets.map(b => (
             <OptionCard key={b.id} title={b.title} desc={b.desc} selected={answers.budget === b.id} onClick={() => setAnswers(s => ({ ...s, budget: b.id }))} />
          ))}
        </div>
        <div>
           <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase mb-3 px-1 opacity-70">Предпочитаемые магазины</div>
           <div className="flex flex-wrap gap-2">
             {stores.map(s => <RetailerChip key={s.id} label={s.name} imageSrc={s.imageSrc} selected={answers.stores.includes(s.id)} onClick={() => toggleS(s.id)} />)}
           </div>
        </div>
      </div>
    </WizardLayout>
  );
}

export function QStep7({ onNext, onBack, onSkip, stepIndex }: QProps) {
  return (
    <WizardLayout step={7} title={<>Уточним<br/>картину</>} onBack={onBack} onNext={onNext} onSkip={onSkip} canNext={true}>
      <div className="flex flex-col gap-3 pt-2">
        <SurfaceCard className="relative overflow-hidden p-5 flex flex-col justify-between items-start gap-4 h-[160px]">
           <div className="z-10">
             <h4 className="font-medium text-[16px] mb-1 text-kts-text">Фото кожи <span className="opacity-50 font-normal ml-1">(Скоро)</span></h4>
             <p className="text-[13px] text-kts-muted line-clamp-2 w-[80%]">Это поможет точнее определить зоны внимания и локальные проблемы.</p>
           </div>
           <Button variant="secondary" className="w-[180px] h-[44px] text-[13px] z-10">Загрузить фото</Button>
           <div className="absolute right-4 top-5 h-24 w-24 rounded-[22px] border border-white/10 bg-[url('/assets/brand/beauty-portrait.jpg')] bg-cover bg-center opacity-35 blur-[0.2px]" />
           <div className="absolute right-7 top-8 h-16 w-16 rounded-full border border-white/25 bg-white/[0.04]" />
        </SurfaceCard>
        
        <SurfaceCard className="relative overflow-hidden p-5 flex flex-col justify-between items-start gap-4 h-[160px]">
           <div className="z-10">
             <h4 className="font-medium text-[16px] mb-1 text-kts-text">Что уже есть у тебя</h4>
             <p className="text-[13px] text-kts-muted line-clamp-2 w-[80%]">Добавь свои средства, чтобы мы не рекомендовали лишнее.</p>
           </div>
           <Button variant="secondary" className="w-[180px] h-[44px] text-[13px] z-10">Добавить средства</Button>
           <div className="absolute right-4 top-5 flex h-24 w-24 items-end justify-center gap-1 rounded-[22px] border border-white/10 bg-white/[0.04] opacity-45">
              <div className="mb-5 h-11 w-5 rounded-t-full rounded-b-md bg-white/30" />
              <div className="mb-5 h-16 w-7 rounded-t-lg rounded-b-md bg-white/18" />
              <div className="mb-5 h-9 w-5 rounded-full bg-white/25" />
           </div>
        </SurfaceCard>
      </div>
    </WizardLayout>
  );
}

type QuestionnaireFlowProps = {
  answers: AppAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<AppAnswers>>;
  onComplete: () => void;
  onBackToIntro: () => void;
  onSkip?: () => void;
};

export function QuestionnaireFlow({ answers, setAnswers, onComplete, onBackToIntro, onSkip }: QuestionnaireFlowProps) {
  const [step, setStep] = React.useState(1);

  const goBack = () => {
    if (step === 1) {
      onBackToIntro();
      return;
    }
    setStep((current) => Math.max(1, current - 1));
  };

  const goNext = () => {
    if (step === 7) {
      onComplete();
      return;
    }
    setStep((current) => Math.min(7, current + 1));
  };

  const chipClass = (selected: boolean) => [
    "inline-flex h-11 items-center rounded-full border px-5 text-[15px] font-medium transition-all",
    selected
      ? "bg-kts-accent border-kts-accent text-kts-btn-text"
      : "bg-kts-surface/72 border-kts-line text-kts-text hover:bg-kts-surface"
  ].join(" ");

  const renderStep = () => {
    if (step === 1) {
      const opts = [
        { id: "face", title: "Уход за лицом", desc: "очищение, сыворотки, крем, SPF" },
        { id: "body", title: "Уход за телом", desc: "увлажнение, текстура, чувствительность" },
        { id: "hair", title: "Волосы", desc: "кожа головы, сухость, восстановление" },
        { id: "spf", title: "SPF", desc: "защита на каждый день в городе или отпуск" },
      ];
      const toggle = (id: string) => setAnswers((state) => ({
        ...state,
        category: state.category.includes(id) ? state.category.filter((item) => item !== id) : [...state.category, id]
      }));
      return {
        title: <>Что хочешь<br />подобрать?</>,
        subtitle: "Выбери направления, с которых начнём.",
        canNext: answers.category.length > 0,
        content: (
          <div className="flex flex-col gap-2.5 pt-2">
            {opts.map((item) => (
              <OptionCard key={item.id} title={item.title} desc={item.desc} selected={answers.category.includes(item.id)} onClick={() => toggle(item.id)} />
            ))}
          </div>
        ),
      };
    }

    if (step === 2) {
      const opts = ["Постакне", "Жирный блеск", "Увлажнение", "Ровный тон", "Чувствительность", "Сияние", "SPF-защита", "Морщины"];
      const toggle = (id: string) => setAnswers((state) => ({
        ...state,
        focus: state.focus.includes(id) ? state.focus.filter((item) => item !== id) : [...state.focus, id]
      }));
      return {
        title: <>Что сейчас важнее<br />всего для кожи?</>,
        subtitle: "Можно выбрать несколько",
        canNext: answers.focus.length > 0,
        content: (
          <div className="flex flex-wrap gap-2.5 content-start pt-2 pb-2">
            {opts.map((item) => (
              <button key={item} onClick={() => toggle(item)} className={chipClass(answers.focus.includes(item))}>{item}</button>
            ))}
          </div>
        ),
      };
    }

    if (step === 3) {
      const opts = ["Сухая", "Жирная", "Комбинированная", "Нормальная", "Чувствительная", "Не знаю"];
      return {
        title: <>Какой у тебя<br />тип кожи?</>,
        subtitle: "Если не уверена, можно выбрать «Не знаю».",
        canNext: !!answers.skinType,
        content: (
          <div className="flex flex-col gap-2.5 pt-2 pb-2">
            {opts.map((item) => (
              <OptionCard key={item} title={item} selected={answers.skinType === item} onClick={() => setAnswers((state) => ({ ...state, skinType: item }))} />
            ))}
          </div>
        ),
      };
    }

    if (step === 4) {
      const toggles = ["Кожа легко раздражается", "Есть аллергические реакции", "Не люблю активные формулы"];
      const chips = ["Ретинол", "Кислоты", "Спирт", "Отдушки", "Эфирные масла", "Комедогенные масла"];
      const toggleSensitivity = (id: string) => setAnswers((state) => ({
        ...state,
        restrictions: {
          ...state.restrictions,
          sensitivity: { ...state.restrictions.sensitivity, [id]: !state.restrictions.sensitivity[id] }
        }
      }));
      const toggleChip = (id: string) => setAnswers((state) => ({
        ...state,
        restrictions: {
          ...state.restrictions,
          exclude: state.restrictions.exclude.includes(id) ? state.restrictions.exclude.filter((item) => item !== id) : [...state.restrictions.exclude, id]
        }
      }));
      return {
        title: <>Есть ли<br />ограничения?</>,
        canNext: true,
        content: (
          <div className="flex flex-col pt-1 pb-2 gap-4">
            <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase px-1 opacity-70">Чувствительность</div>
            <div className="flex flex-col gap-2.5">
              {toggles.map((item) => (
                <OptionCard key={item} title={item} selected={!!answers.restrictions.sensitivity[item]} onClick={() => toggleSensitivity(item)} />
              ))}
            </div>
            <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase pt-2 px-1 opacity-70">Исключить из рекомендаций</div>
            <div className="flex flex-wrap gap-2 content-start">
              {chips.map((item) => (
                <button key={item} onClick={() => toggleChip(item)} className={chipClass(answers.restrictions.exclude.includes(item))}>{item}</button>
              ))}
            </div>
          </div>
        ),
      };
    }

    if (step === 5) {
      const ages = ["до 18", "18–24", "25–34", "35–44", "45+"];
      const experience = ["Помоги разобраться", "Знаю базу", "Разбираюсь хорошо"];
      return {
        title: <>Немного<br />о тебе</>,
        canNext: !!answers.age && !!answers.experience,
        content: (
          <div className="flex flex-col gap-8 pt-2">
            <div>
              <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase mb-3 px-1 opacity-70">Возраст</div>
              <div className="flex flex-col gap-2.5">
                {ages.map((item) => (
                  <OptionCard key={item} title={item} selected={answers.age === item} onClick={() => setAnswers((state) => ({ ...state, age: item }))} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase mb-3 px-1 opacity-70">Опыт в уходе</div>
              <div className="flex flex-col gap-2.5">
                {experience.map((item) => (
                  <OptionCard key={item} title={item} selected={answers.experience === item} onClick={() => setAnswers((state) => ({ ...state, experience: item }))} />
                ))}
              </div>
            </div>
          </div>
        ),
      };
    }

    if (step === 6) {
      const budgets = [
        { id: "b1", title: "Базовый", desc: "до 1 500 ₽" },
        { id: "b2", title: "Сбалансированный", desc: "около 4 000 ₽" },
        { id: "b3", title: "Premium", desc: "от 8 000 ₽" }
      ];
      const stores = [
        { id: "ЗЯ", name: "Золотое Яблоко", imageSrc: "/assets/retailers/golden-apple.png" },
        { id: "ЛЭТУАЛЬ", name: "ЛЭТУАЛЬ", imageSrc: "/assets/retailers/letual.png" },
        { id: "РИВ ГОШ", name: "РИВ ГОШ", imageSrc: "/assets/retailers/rive-gauche.png" },
        { id: "Ozon", name: "Ozon", imageSrc: "/assets/retailers/ozon.png" },
        { id: "WB", name: "Wildberries", imageSrc: "/assets/retailers/wildberries.png" },
      ];
      const toggleStore = (id: string) => setAnswers((state) => ({
        ...state,
        stores: state.stores.includes(id) ? state.stores.filter((item) => item !== id) : [...state.stores, id]
      }));
      return {
        title: <>Какой уход<br />собираем?</>,
        subtitle: "Выбери комфортный бюджет.",
        canNext: !!answers.budget,
        content: (
          <div className="flex flex-col gap-8 pt-2">
            <div className="flex flex-col gap-2.5">
              {budgets.map((item) => (
                <OptionCard key={item.id} title={item.title} desc={item.desc} selected={answers.budget === item.id} onClick={() => setAnswers((state) => ({ ...state, budget: item.id }))} />
              ))}
            </div>
            <div>
              <div className="text-kts-muted text-[12px] font-medium tracking-widest uppercase mb-3 px-1 opacity-70">Предпочитаемые магазины</div>
              <div className="flex flex-wrap gap-2">
                {stores.map((item) => (
                  <RetailerChip key={item.id} label={item.name} imageSrc={item.imageSrc} selected={answers.stores.includes(item.id)} onClick={() => toggleStore(item.id)} />
                ))}
              </div>
            </div>
          </div>
        ),
      };
    }

    return {
      title: <>Уточним<br />картину</>,
      canNext: true,
      content: (
        <div className="flex flex-col gap-3 pt-2">
          <SurfaceCard className="relative overflow-hidden p-5 flex flex-col justify-between items-start gap-4 h-[160px]">
            <div className="z-10">
              <h4 className="font-medium text-[16px] mb-1 text-kts-text">Фото кожи <span className="opacity-50 font-normal ml-1">(Скоро)</span></h4>
              <p className="text-[13px] text-kts-muted line-clamp-2 w-[80%]">Это поможет точнее определить зоны внимания и локальные проблемы.</p>
            </div>
            <Button variant="secondary" className="w-[180px] h-[44px] text-[13px] z-10">Загрузить фото</Button>
            <div className="absolute right-4 top-5 h-24 w-24 rounded-[22px] border border-white/10 bg-[url('/assets/brand/beauty-portrait.jpg')] bg-cover bg-center opacity-35 blur-[0.2px]" />
            <div className="absolute right-7 top-8 h-16 w-16 rounded-full border border-white/25 bg-white/[0.04]" />
          </SurfaceCard>
          <SurfaceCard className="relative overflow-hidden p-5 flex flex-col justify-between items-start gap-4 h-[160px]">
            <div className="z-10">
              <h4 className="font-medium text-[16px] mb-1 text-kts-text">Что уже есть у тебя</h4>
              <p className="text-[13px] text-kts-muted line-clamp-2 w-[80%]">Добавь свои средства, чтобы мы не рекомендовали лишнее.</p>
            </div>
            <Button variant="secondary" className="w-[180px] h-[44px] text-[13px] z-10">Добавить средства</Button>
            <div className="absolute right-4 top-5 flex h-24 w-24 items-end justify-center gap-1 rounded-[22px] border border-white/10 bg-white/[0.04] opacity-45">
              <div className="mb-5 h-11 w-5 rounded-t-full rounded-b-md bg-white/30" />
              <div className="mb-5 h-16 w-7 rounded-t-lg rounded-b-md bg-white/18" />
              <div className="mb-5 h-9 w-5 rounded-full bg-white/25" />
            </div>
          </SurfaceCard>
        </div>
      ),
    };
  };

  const current = renderStep();

  return (
    <WizardLayout
      step={step}
      title={current.title}
      subtitle={current.subtitle}
      onBack={goBack}
      onNext={goNext}
      onSkip={onSkip}
      canNext={current.canNext}
    >
      <div className="transition-opacity duration-200 ease-out">
        {current.content}
      </div>
    </WizardLayout>
  );
}
