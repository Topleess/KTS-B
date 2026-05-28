"use client";

import * as React from "react";
import { BlurCTAFooter, Button, GlassCard, IconButton } from "./UI";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function VideoPreview({ children }: { children: React.ReactNode }) {
  return (
    <GlassCard className="mt-5 mb-4 flex-1 min-h-[300px] w-full max-w-[400px] mx-auto p-2 flex flex-col items-center justify-center">
       <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/80 via-transparent to-transparent z-10 pointer-events-none" />
       
       <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-[#18181A]/40 border border-white/5 flex flex-col text-white/50 text-sm italic z-0 backdrop-blur-md overflow-y-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] pt-10">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <div className="w-8 h-2 rounded-full bg-white/10" />
            <div className="w-4 h-4 rounded-full bg-white/10" />
          </div>
          {children}
       </div>
    </GlassCard>
  );
}

const onboardingSlides = [
  {
    title: "Соберём уход, а не список товаров",
    subtitle: "Рутина будет разделена на утро, вечер и дополнительные шаги.",
    body: (
      <div className="flex flex-col w-full px-6 py-8 space-y-4 opacity-50 flex-1 justify-center">
        <div className="h-10 border border-white/10 rounded-xl w-full bg-white/5" />
        <div className="h-10 border border-white/10 rounded-xl w-[80%] bg-white/5" />
        <div className="h-10 border border-white/10 rounded-xl w-[90%] bg-white/5" />
      </div>
    ),
  },
  {
    title: "Учтём кожу, бюджет и ограничения",
    subtitle: "Ты сможешь исключить активы, выбрать бюджет и предпочитаемые магазины.",
    body: (
      <div className="grid grid-cols-2 gap-3 w-full px-6 pt-6 opacity-40 flex-1 content-start">
        <div className="h-14 border border-white/10 rounded-[16px] w-full bg-white/5" />
        <div className="h-14 border border-white/10 rounded-[16px] w-full bg-white/5" />
        <div className="h-14 border border-white/10 rounded-[16px] w-full bg-white/5" />
        <div className="h-14 border border-white/10 rounded-[16px] w-full bg-white/5" />
      </div>
    ),
  },
  {
    title: "Покажем, где выгоднее купить",
    subtitle: "Сравним цены, покажем лучшие предложения и поможем выбрать.",
    body: (
      <div className="flex items-end justify-center w-full px-8 pb-8 gap-2 h-full opacity-40">
        <div className="w-1/4 bg-white/20 h-[30%] rounded-t-sm" />
        <div className="w-1/4 bg-white/20 h-[50%] rounded-t-sm" />
        <div className="w-1/4 bg-white/20 h-[80%] rounded-t-sm" />
        <div className="w-1/4 bg-white/40 h-[60%] rounded-t-sm" />
      </div>
    ),
  },
  {
    title: "Сопроводим рутину каждый день",
    subtitle: "Ты увидишь задачи на вчера, сегодня и завтра в одном месте.",
    body: (
      <div className="flex flex-col justify-center gap-3 w-full px-6 py-8 opacity-45">
        <div className="h-12 border border-white/10 rounded-[16px] bg-white/5" />
        <div className="h-12 border border-white/10 rounded-[16px] bg-white/5" />
        <div className="h-12 border border-white/10 rounded-[16px] bg-white/5" />
      </div>
    ),
  },
] as const;

export function OnboardingCarousel({ onNext, onSkip, onBack }: { onNext: () => void; onSkip: () => void; onBack: () => void }) {
  const [idx, setIdx] = React.useState(0);
  const [segmentProgress, setSegmentProgress] = React.useState(0);
  const slide = onboardingSlides[idx];

  React.useEffect(() => {
    const totalMs = 5200;
    const tickMs = 60;
    const step = (tickMs / totalMs) * 100;
    const timer = window.setInterval(() => {
      setSegmentProgress((prev) => (prev + step >= 100 ? 0 : prev + step));
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [idx]);

  const moveNext = () => {
    if (idx === onboardingSlides.length - 1) {
      onNext();
      return;
    }
    setIdx((v) => v + 1);
    setSegmentProgress(0);
  };

  return (
    <div className="flex-1 flex flex-col pt-6 pb-[132px] px-6 h-full relative z-0 overflow-y-auto hide-scrollbar">
      <div className="flex items-center justify-between mt-2">
        <div className="font-editorial uppercase tracking-[0.15em] text-[15px] opacity-80">KTS Beauty</div>
        <button onClick={onSkip} className="text-[13px] text-kts-muted hover:text-white px-2 py-1 transition-colors">Пропустить</button>
      </div>
      <div className="flex flex-col mt-3">
        <div className="mb-3 flex items-center gap-2">
          {onboardingSlides.map((_, slideIdx) => {
            const done = slideIdx < idx;
            const active = slideIdx === idx;
            return (
              <div
                key={slideIdx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500 overflow-hidden",
                  active ? "w-9 bg-white/20" : "w-3",
                  done ? "bg-white/90" : active ? "bg-white/20" : "bg-white/20"
                )}
              >
                {active && (
                  <div
                    className="h-full bg-white transition-[width] duration-75 ease-linear"
                    style={{ width: `${segmentProgress}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <h2 className="font-editorial text-[31px] tracking-tight leading-[1.02] mb-3 text-white">{slide.title}</h2>
        <p className="text-kts-muted leading-relaxed text-[15px] opacity-90">{slide.subtitle}</p>
      </div>

      <VideoPreview>
        <div className="h-full w-full">
          <div className="h-full w-full transition-opacity duration-300">{slide.body}</div>
        </div>
      </VideoPreview>

      <BlurCTAFooter>
        <div className="flex w-full gap-3">
          <IconButton onClick={idx === 0 ? onBack : () => { setIdx((v) => Math.max(0, v - 1)); setSegmentProgress(0); }} />
          <Button onClick={moveNext} className="w-full shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">{idx === onboardingSlides.length - 1 ? "Начать" : "Дальше"}</Button>
        </div>
      </BlurCTAFooter>
    </div>
  );
}

export function PreQuestionnaireIntro({ onNext, onBack, onSkip }: { onNext: () => void, onBack: () => void, onSkip: () => void }) {
  return (
    <div className="flex-1 flex flex-col pt-6 pb-[120px] px-6 h-full relative z-0">
      <div className="flex items-center justify-between mt-2 z-10 w-full mb-8">
         <div className="font-editorial uppercase tracking-widest text-[16px] opacity-80">KTS Beauty</div>
         <button onClick={onSkip} className="text-[13px] text-kts-muted hover:text-white px-2 py-1 transition-colors">Заполнить позже</button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h2 className="font-editorial text-[42px] tracking-tight leading-[1] mb-4 text-white">Соберём персональный<br/>уход</h2>
        <p className="text-kts-muted leading-relaxed text-[16px] opacity-90 max-w-[280px]">Нужно всего несколько шагов, чтобы подобрать подходящую рутину.</p>
      </div>

      <BlurCTAFooter>
        <div className="flex w-full gap-3">
          <IconButton onClick={onBack} />
          <Button onClick={onNext} className="w-full shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">Начать анкету</Button>
        </div>
      </BlurCTAFooter>
    </div>
  );
}

export function GeneratingScreen({ onNext }: { onNext: () => void }) {
  const statuses = [
    "Анализируем профиль кожи...",
    "Проверяем ограничения...",
    "Собираем утро и вечер...",
    "Сверяем бюджет и наличие..."
  ];
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (idx >= statuses.length) {
      setTimeout(() => onNext(), 400);
      return;
    }
    const tm = setTimeout(() => { setIdx((i) => i + 1) }, 800);
    return () => clearTimeout(tm);
  }, [idx, onNext, statuses.length]);

  return (
    <div className="flex-1 flex flex-col p-6 h-full bg-transparent">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <GlassCard className="w-full max-w-[340px] p-6">
          <div className="relative mx-auto mb-6 h-24 w-24">
             <div className="absolute inset-0 rounded-full border border-white/10 animate-[spin_3s_linear_infinite]" />
             <div className="absolute inset-2 rounded-full border border-white/20 border-t-white/80 animate-[spin_2s_ease-in-out_infinite]" />
             <div className="absolute inset-5 rounded-full bg-white/[0.08] backdrop-blur-xl" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
             </div>
          </div>
          <h2 className="font-editorial text-[31px] tracking-tight leading-tight mb-7 text-white">Собираем<br/>твою рутину</h2>
          <div className="flex flex-col items-start gap-3 w-full max-w-[260px] mx-auto text-left">
          {statuses.map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-500",
                i < idx ? "bg-white/40" : i === idx ? "bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-white/10"
              )} />
              <div className={cn(
                "text-[14px] transition-all duration-500",
                i < idx ? "text-white/40" : i === idx ? "text-white font-medium" : "text-white/20"
              )}>
                {stat}
              </div>
            </div>
          ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export function RoutineResultScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex-1 flex flex-col p-6 pb-[132px] h-full relative z-0 overflow-hidden">
      
      <div className="flex flex-col items-center justify-start text-center pt-8">
        <h2 className="font-editorial text-[33px] tracking-tight leading-[1] mb-2 text-white">Твоя рутина готова</h2>
        <p className="text-kts-muted mb-6 opacity-90 leading-snug text-[14px]">Персональный уход для твоей кожи</p>
        
        <GlassCard className="w-full max-w-[360px] p-5 space-y-4 text-left">
           <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5 text-[15px] text-white"><span className="text-white/60 text-lg">☼</span> Утро</div>
                <div className="text-white/60 text-[13px]">4 средства</div>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5 text-[15px] text-white"><span className="text-white/60 text-lg">☾</span> Вечер</div>
                <div className="text-white/60 text-[13px]">3 средства</div>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5 text-[15px] text-white"><span className="text-white/60 text-lg">◌</span> 1–2 раза в неделю</div>
                <div className="text-white/60 text-[13px]">доп. уход</div>
              </div>
           </div>
           
           <div className="flex items-end justify-between pt-1 pb-1">
             <div className="text-white/60 text-[13px]">Итого:</div>
             <div className="text-[24px] tracking-tight font-medium text-white">4 280 ₽</div>
           </div>
           
           <div className="flex flex-col gap-2 pt-2">
             <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
               <span className="text-sm opacity-60">Акцент на постакне и себум</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
               <span className="text-sm opacity-60">Без отдушек и спирта</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
               <span className="text-sm opacity-60">SPF каждый день</span>
             </div>
           </div>
        </GlassCard>
      </div>
      
      <BlurCTAFooter>
        <div className="flex w-full flex-col gap-2">
          <Button onClick={onFinish} className="w-full shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">Открыть приложение</Button>
        </div>
      </BlurCTAFooter>
    </div>
  );
}
