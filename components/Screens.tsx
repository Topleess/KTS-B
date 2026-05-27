"use client";

import * as React from "react";
import { WelcomeScreen } from "./WelcomeScreen"; // I'll split Welcome out for motion
import { Button, ScreenHeader } from "./UI";
import { Loader2, Sparkles, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function TgInitScreen({ onNext }: { onNext: () => void }) {
  React.useEffect(() => {
    const tm = setTimeout(() => { onNext(); }, 1800);
    return () => clearTimeout(tm);
  }, [onNext]);

  return (
    <div className="flex-1 flex flex-col p-6 items-center justify-center text-center bg-transparent h-full relative overflow-hidden">
      <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
         <div className="absolute inset-0 rounded-full border border-white/5 animate-[pulse_3s_ease-in-out_infinite]" />
         <div className="absolute inset-4 rounded-full border border-white/10 animate-[pulse_2s_ease-in-out_infinite]" />
         <div className="absolute inset-8 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center">
           <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z" />
             <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l10 5 10-5M2 12l10 5 10-5" />
           </svg>
         </div>
      </div>
      <h2 className="font-editorial text-[32px] tracking-tight leading-tight mb-3 text-white">Интеграция профиля</h2>
      <p className="text-kts-muted px-4 leading-relaxed text-[15px] max-w-[280px]">Используем Telegram, чтобы сохранить прогресс внутри мини‑приложения.</p>
    </div>
  );
}

function VideoPreview({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    const int = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 2));
    }, 50);
    return () => clearInterval(int);
  }, []);
  return (
    <div className="mt-4 mb-4 flex-1 min-h-[300px] w-full max-w-[400px] mx-auto relative rounded-[32px] border border-white/10 p-2 shadow-2xl bg-[#0A0807]/40 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center">
       <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/80 via-transparent to-transparent z-10 pointer-events-none" />
       
       <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-[#18181A]/40 border border-white/5 flex flex-col text-white/50 text-sm italic z-0 backdrop-blur-md overflow-y-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] pt-10">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <div className="w-8 h-2 rounded-full bg-white/10" />
            <div className="w-4 h-4 rounded-full bg-white/10" />
          </div>
          {children}
       </div>

       <div className="absolute bottom-5 left-8 right-8 h-1 bg-white/10 rounded-full z-20 overflow-hidden backdrop-blur-md">
          <div className="h-full bg-white transition-all duration-75" style={{ width: `${progress}%` }} />
       </div>
    </div>
  );
}

export function Onboarding1({ onNext, onSkip }: { onNext: () => void, onSkip: () => void }) {
  return (
    <div className="flex-1 flex flex-col pt-6 pb-[120px] px-6 h-full relative z-0">
      <div className="flex flex-col mt-2">
        <h2 className="font-editorial text-[34px] tracking-tight leading-[1] mb-3 text-white">Соберём уход, а не список товаров</h2>
        <p className="text-kts-muted leading-relaxed text-[15px] opacity-90">Рутина будет разделена на утро, вечер и дополнительные шаги.</p>
      </div>

      <VideoPreview>
         <div className="flex flex-col w-full px-6 py-8 space-y-4 opacity-50 flex-1 justify-center">
           <div className="h-10 border border-white/10 rounded-xl w-full bg-white/5" />
           <div className="h-10 border border-white/10 rounded-xl w-[80%] bg-white/5" />
           <div className="h-10 border border-white/10 rounded-xl w-[90%] bg-white/5" />
         </div>
      </VideoPreview>

      <div className="absolute bottom-0 left-0 w-full h-[140px] pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/80 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-3 pointer-events-none">
        <div className="w-full max-w-[430px] mx-auto flex flex-col gap-2 pointer-events-auto">
          <Button onClick={onNext} className="w-full shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">Дальше</Button>
          <Button variant="ghost" className="h-[44px] text-white/50 hover:text-white" onClick={onSkip}>Пропустить</Button>
        </div>
      </div>
    </div>
  );
}

export function Onboarding2({ onNext, onSkip }: { onNext: () => void, onSkip: () => void }) {
  return (
    <div className="flex-1 flex flex-col pt-6 pb-[120px] px-6 h-full relative z-0">
      <div className="flex flex-col mt-2">
        <h2 className="font-editorial text-[34px] tracking-tight leading-[1] mb-3 text-white">Учтём кожу, бюджет и ограничения</h2>
        <p className="text-kts-muted leading-relaxed text-[15px] opacity-90">Ты сможешь исключить активы, выбрать бюджет и предпочитаемые магазины.</p>
      </div>

      <VideoPreview>
        <div className="grid grid-cols-2 gap-3 w-full px-6 pt-6 opacity-40 flex-1 content-start">
           <div className="h-14 border border-white/10 rounded-[16px] w-full bg-white/5" />
           <div className="h-14 border border-white/10 rounded-[16px] w-full bg-white/5" />
           <div className="h-14 border border-white/10 rounded-[16px] w-full bg-white/5" />
           <div className="h-14 border border-white/10 rounded-[16px] w-full bg-white/5" />
        </div>
      </VideoPreview>

      <div className="absolute bottom-0 left-0 w-full h-[140px] pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/80 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-3 pointer-events-none">
        <div className="w-full max-w-[430px] mx-auto flex flex-col gap-2 pointer-events-auto">
          <Button onClick={onNext} className="w-full shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">Дальше</Button>
        </div>
      </div>
    </div>
  );
}

export function Onboarding3({ onNext, onSkip }: { onNext: () => void, onSkip: () => void }) {
  return (
    <div className="flex-1 flex flex-col pt-6 pb-[120px] px-6 h-full relative z-0">
      <div className="flex flex-col mt-2">
        <h2 className="font-editorial text-[34px] tracking-tight leading-[1] mb-3 text-white">Покажем, где выгоднее купить</h2>
        <p className="text-kts-muted leading-relaxed text-[15px] opacity-90">Сравним цены, покажем лучшие предложения и поможем выбрать.</p>
      </div>

      <VideoPreview>
         <div className="flex items-end justify-center w-full px-8 pb-8 gap-2 h-full opacity-40">
            <div className="w-1/4 bg-white/20 h-[30%] rounded-t-sm" />
            <div className="w-1/4 bg-white/20 h-[50%] rounded-t-sm" />
            <div className="w-1/4 bg-white/20 h-[80%] rounded-t-sm" />
            <div className="w-1/4 bg-white/40 h-[60%] rounded-t-sm" />
         </div>
      </VideoPreview>

      <div className="absolute bottom-0 left-0 w-full h-[140px] pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/80 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-3 pointer-events-none">
        <div className="w-full max-w-[430px] mx-auto flex flex-col gap-2 pointer-events-auto">
          <Button onClick={onNext} className="w-full shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">Начать</Button>
        </div>
      </div>
    </div>
  );
}

export function PreQuestionnaireIntro({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col pt-6 pb-[120px] px-6 h-full relative z-0">
      <div className="flex flex-col mt-2 z-10 w-full mb-8">
         <div className="font-editorial uppercase tracking-widest text-[16px] opacity-80 mb-2">KTS Beauty</div>
         <button onClick={onBack} className="text-[12px] uppercase tracking-wider font-medium text-white/50 hover:text-white flex items-center gap-1 w-max">
            <ChevronLeft className="w-3 h-3" /> К онбордингу
         </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h2 className="font-editorial text-[42px] tracking-tight leading-[1] mb-4 text-white">Соберём персональный<br/>уход</h2>
        <p className="text-kts-muted leading-relaxed text-[16px] opacity-90 max-w-[280px]">Нужно всего несколько шагов, чтобы подобрать подходящую рутину.</p>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[140px] pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/80 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-3 pointer-events-none">
        <div className="w-full max-w-[430px] mx-auto flex flex-col gap-2 pointer-events-auto">
          <Button onClick={onNext} className="w-full shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">Начать анкету</Button>
          <Button variant="ghost" className="h-[44px] text-white/50 hover:text-white" onClick={onBack}>Заполнить позже</Button>
        </div>
      </div>
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
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 rounded-full border border-white/10 animate-[spin_3s_linear_infinite]" />
           <div className="absolute inset-2 rounded-full border border-white/20 border-t-white/80 animate-[spin_2s_ease-in-out_infinite]" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
           </div>
        </div>
        <h2 className="font-editorial text-[32px] tracking-tight leading-tight mb-8 text-white">Собираем<br/>твою рутину</h2>
        <div className="flex flex-col items-start gap-3 w-full max-w-[240px] mx-auto text-left">
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
      </div>
    </div>
  );
}

export function RoutineResultScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex-1 flex flex-col p-6 pb-[120px] h-full relative z-0">
      
      <div className="flex flex-col items-center justify-start text-center pt-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#18181A]/40 border border-white/10 backdrop-blur-md mb-6 relative">
           <span className="text-xl">✨</span>
           <div className="absolute inset-0 rounded-full bg-white/5 animate-ping opacity-50" />
        </div>
        <h2 className="font-editorial text-[34px] tracking-tight leading-[1] mb-2 text-white">Твоя рутина готова</h2>
        <p className="text-kts-muted mb-6 opacity-90 leading-snug text-[14px]">Персональный уход для твоей кожи</p>
        
        <div className="w-full bg-[#18181A]/40 border border-white/5 rounded-[24px] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] backdrop-blur-md space-y-4 max-w-[360px] text-left">
           <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5 text-[15px] text-white"><span className="text-white/60 text-lg">☼</span> Утро</div>
                <div className="text-white/60 text-[13px]">4 средства</div>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5 text-[15px] text-white"><span className="text-white/60 text-lg">☾</span> Вечер</div>
                <div className="text-white/60 text-[13px]">3 средства</div>
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
           </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-[140px] pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/80 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-3 pointer-events-none">
        <div className="w-full max-w-[430px] mx-auto flex flex-col gap-2 pointer-events-auto">
          <Button onClick={onFinish} className="w-full shadow-2xl backdrop-blur-md bg-kts-accent/90 border border-white/20">Открыть приложение</Button>
        </div>
      </div>
    </div>
  );
}
