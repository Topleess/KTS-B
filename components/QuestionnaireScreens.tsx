"use client";
import * as React from "react";
import { AppAnswers, ScreenHeader, OptionCard, Button, IconButton, Chip, Toggle, RetailerChip } from "./UI";
import { motion, AnimatePresence } from "motion/react";

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
  
  return (
    <div className="flex-1 flex flex-col pt-2 bg-transparent min-h-full">
      <div className="px-6 flex items-center justify-between z-10 sticky top-0 py-2">
         <div className="font-editorial uppercase tracking-[0.15em] text-[15px] opacity-80">KTS Beauty</div>
         <button onClick={onSkip} className="text-[13px] text-kts-muted hover:text-white px-2 py-1 transition-colors">Пропустить</button>
      </div>

      <div className="px-6 pt-4 pb-2 z-10">
         <div className="mb-4">
            <span className="text-[12px] font-medium tracking-wide uppercase text-kts-muted mb-2 inline-block">{step} из {total}</span>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
            </div>
         </div>
         <h2 className="font-editorial text-[34px] tracking-tight leading-[1.05] mb-2 text-white">{title}</h2>
         {subtitle && <p className="text-kts-muted opacity-90 leading-snug text-[14px]">{subtitle}</p>}
      </div>

      <div className="flex-1 px-6 pb-[120px] overflow-y-auto hide-scrollbar z-0 relative">
        {children}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[140px] pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/80 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex gap-3 pointer-events-none">
        <div className="w-full max-w-[430px] mx-auto flex gap-3 pointer-events-auto">
          <IconButton onClick={onBack} />
          <Button disabled={!canNext} onClick={onNext} className="flex-1 shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">Далее</Button>
        </div>
      </div>
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
      <div className="flex flex-wrap gap-2 content-start pt-2">
        {opts.map((o) => (
           <Chip 
             key={o} 
             label={o} 
             selected={answers.focus.includes(o)}
             onClick={() => toggle(o)}
           />
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
      <div className="flex flex-col gap-2.5 pt-2">
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

  const setTog = (id: string, val: boolean) => setAnswers(s => ({
    ...s, restrictions: { ...s.restrictions, sensitivity: { ...s.restrictions.sensitivity, [id]: val } }
  }));
  const toggleChip = (id: string) => setAnswers(s => ({
    ...s, restrictions: { ...s.restrictions, exclude: s.restrictions.exclude.includes(id) ? s.restrictions.exclude.filter(x => x !== id) : [...s.restrictions.exclude, id] }
  }));

  // Not mandatory to select restrictions, so always enabled next
  return (
    <WizardLayout step={4} title={<>Есть ли<br/>ограничения?</>} onBack={onBack} onNext={onNext} onSkip={onSkip} canNext={true}>
      <div className="flex flex-col pt-2 gap-4">
        <div className="bg-[#18181A]/40 border border-white/5 rounded-[24px] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] backdrop-blur-md">
          <h4 className="font-medium text-[15px] mb-1 text-white">Чувствительность</h4>
          <div className="flex flex-col flex-1 divide-y divide-white/5">
             {toggles.map((t) => (
                <Toggle key={t} label={t} checked={!!answers.restrictions.sensitivity[t]} onChange={(v) => setTog(t, v)} />
             ))}
          </div>
        </div>

        <div className="bg-[#18181A]/40 border border-white/5 rounded-[24px] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] backdrop-blur-md">
          <h4 className="font-medium text-[15px] mb-3 text-white">Исключить из рекомендаций</h4>
          <div className="flex flex-wrap gap-1.5">
             {chips.map((c) => (
                <Chip key={c} label={c} selected={answers.restrictions.exclude.includes(c)} onClick={() => toggleChip(c)} />
             ))}
          </div>
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
           <div className="flex flex-wrap gap-1.5">
             {ages.map(a => <Chip key={a} label={a} selected={answers.age === a} onClick={() => setAnswers(s => ({ ...s, age: a }))} />)}
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
    { id: 'ЗЯ', name: 'Золотое Яблоко', icon: <div className="w-4 h-4 rounded-full bg-[#E5F700]" /> },
    { id: 'ЛЭТУАЛЬ', name: 'ЛЭТУАЛЬ', icon: <div className="w-4 h-4 rounded-[4px] bg-[#001DFF]" /> },
    { id: 'РИВ ГОШ', name: 'РИВ ГОШ', icon: <div className="w-4 h-4 rounded-[4px] bg-gradient-to-r from-[#FF48A6] to-[#00A8FF]" /> },
    { id: 'Ozon', name: 'Ozon', icon: <div className="w-4 h-4 rounded-[4px] bg-[#005BFF]" /> },
    { id: 'WB', name: 'Wildberries', icon: <div className="w-4 h-4 rounded-[4px] bg-gradient-to-br from-[#FF00B2] to-[#6000FF]" /> },
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
             {stores.map(s => <RetailerChip key={s.id} label={s.name} icon={s.icon} selected={answers.stores.includes(s.id)} onClick={() => toggleS(s.id)} />)}
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
        <div className="bg-[#18181A]/40 border border-white/5 rounded-[24px] p-5 flex flex-col justify-between items-start gap-4 h-[160px] relative overflow-hidden backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
           <div className="z-10">
             <h4 className="font-medium text-[16px] mb-1 text-white">Фото кожи <span className="opacity-50 font-normal ml-1">(Скоро)</span></h4>
             <p className="text-[13px] text-kts-muted line-clamp-2 w-[80%]">Это поможет точнее определить зоны внимания и локальные проблемы.</p>
           </div>
           <Button variant="secondary" className="w-[180px] h-[44px] text-[13px] z-10 bg-white/10 border-white/20 text-white">Загрузить фото</Button>
           <div className="absolute top-0 right-0 h-full w-[40%] bg-gradient-to-l from-[#18181A]/80 to-transparent z-0 pointer-events-none" />
           <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-20">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M19.07 4.93l-1.41 1.41"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M2.05 11l2 1"/><path d="M19.95 11l2-1"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>
           </div>
        </div>
        
        <div className="bg-[#18181A]/40 border border-white/5 rounded-[24px] p-5 flex flex-col justify-between items-start gap-4 h-[160px] relative overflow-hidden backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
           <div className="z-10">
             <h4 className="font-medium text-[16px] mb-1 text-white">Что уже есть у тебя</h4>
             <p className="text-[13px] text-kts-muted line-clamp-2 w-[80%]">Добавь свои средства, чтобы мы не рекомендовали лишнее.</p>
           </div>
           <Button variant="secondary" className="w-[180px] h-[44px] text-[13px] z-10 bg-white/10 border-white/20 text-white">Добавить средства</Button>
           <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-20">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 10c0 1.25.5 2.5 1.5 3.5.5.5 1 1.2 1 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4c0-.8.5-1.5 1-2C6.5 12.5 7 11.25 7 10"/><path d="M14 4h-4v6h4V4z"/><path d="M10.5 4V2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2"/></svg>
           </div>
        </div>
      </div>
    </WizardLayout>
  );
}
