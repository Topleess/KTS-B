"use client";
import * as React from "react";
import { BottomNav, Button } from "./UI";

export function AppContainer({ view, children, onNavigate }: { view: string, children: React.ReactNode, onNavigate: (v: string) => void }) {
  return (
    <div className="flex-1 flex flex-col h-full bg-kts-bg">
      <div className="flex-1 overflow-y-auto hide-scrollbar relative">
        {children}
      </div>
      <BottomNav current={view} onNavigate={onNavigate} />
    </div>
  );
}

export function HomeView({ hasRoutine, onStart }: { hasRoutine: boolean, onStart: () => void }) {
  return (
    <div className="p-6 pb-[140px]">
      <h2 className="font-editorial text-[36px] tracking-tight mb-6 mt-4">Главная</h2>
      
      <div className="bg-kts-surface border border-kts-line rounded-[28px] p-6 shadow-sm mb-4 bg-gradient-to-br from-kts-surface to-kts-surface/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-kts-accent/10 rounded-full blur-[40px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <h3 className="text-[20px] font-medium tracking-tight mb-2">Рутина появится здесь</h3>
        <p className="text-kts-muted text-[14px] leading-relaxed mb-6 max-w-[240px]">Пройди анкету, чтобы собрать персональный уход, подходящий именно твоей коже.</p>
        <Button onClick={onStart} className="w-full">Начать анкету</Button>
      </div>

      <div className="bg-kts-surface/40 border border-kts-line/50 rounded-[24px] p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-kts-surface border border-kts-line flex shrink-0 items-center justify-center text-lg shadow-sm">✺</div>
        <div>
          <h4 className="font-medium text-[15px] mb-1">Скоро в приложении</h4>
          <p className="text-kts-muted text-[13px] leading-relaxed">Мониторинг цен, скан состава, отслеживание динамики кожи.</p>
        </div>
      </div>
    </div>
  );
}

export function RoutineView({ hasRoutine, onStart }: { hasRoutine: boolean, onStart: () => void }) {
  return (
    <div className="p-6 pb-[140px]">
      <h2 className="font-editorial text-[36px] tracking-tight mb-6 mt-4">Рутина</h2>
      {hasRoutine ? (
         <div className="space-y-4">
           {/* Simple Routine summary */}
           <div className="bg-kts-surface border border-kts-line rounded-[24px] p-5 flex justify-between items-center shadow-sm">
             <div><h4 className="font-medium text-[17px] mb-0.5">Утро</h4><p className="text-kts-muted text-[13px]">4 шага</p></div>
             <div className="w-10 h-10 rounded-full bg-kts-accent/10 text-kts-accent flex items-center justify-center text-xl">☼</div>
           </div>
           <div className="bg-kts-surface border border-kts-line rounded-[24px] p-5 flex justify-between items-center shadow-sm">
             <div><h4 className="font-medium text-[17px] mb-0.5">Вечер</h4><p className="text-kts-muted text-[13px]">3 шага</p></div>
             <div className="w-10 h-10 rounded-full bg-[#1A1A24] text-white flex items-center justify-center text-xl">☾</div>
           </div>
           <div className="bg-kts-surface border border-kts-line rounded-[24px] p-5 flex justify-between items-center shadow-sm">
             <div><h4 className="font-medium text-[17px] mb-0.5">1–2 раза в неделю</h4><p className="text-kts-muted text-[13px]">Глубокое очищение</p></div>
             <div className="w-10 h-10 rounded-full bg-kts-surface/50 border border-kts-line text-kts-muted flex items-center justify-center text-xl">◌</div>
           </div>
         </div>
      ) : (
         <div className="bg-kts-surface border border-kts-line rounded-[28px] p-6 shadow-sm text-center py-10">
           <div className="w-16 h-16 mx-auto rounded-full bg-kts-surface border border-kts-line flex items-center justify-center text-2xl mb-4 text-kts-muted">?</div>
           <h3 className="text-[18px] font-medium tracking-tight mb-2">Здесь пока пусто</h3>
           <p className="text-kts-muted text-[14px] leading-relaxed mb-6">Соберем уход специально для тебя.</p>
           <Button onClick={onStart}>Пройти анкету</Button>
         </div>
      )}
    </div>
  );
}

export function ScanView() {
  const cards = [
    { t: "Фото кожи", d: "Определим проблемы и тип" },
    { t: "Состав продукта", d: "Разбор по фото INCI" },
    { t: "Продукт по фото", d: "Найдём средство и сравним цены" }
  ];
  return (
    <div className="p-6 pb-[140px]">
      <h2 className="font-editorial text-[36px] tracking-tight mb-6 mt-4">Скан</h2>
      <div className="space-y-4">
         {cards.map((c, i) => (
           <div key={i} className="bg-kts-surface border border-kts-line rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-end min-h-[140px]">
             <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
             <div className="absolute top-4 right-4 bg-kts-bg border border-kts-line px-2.5 py-1 rounded-full text-[10px] font-medium tracking-widest uppercase text-kts-muted">Скоро</div>
             <h4 className="font-medium text-[18px] mb-1 relative z-10">{c.t}</h4>
             <p className="text-kts-muted text-[13px] relative z-10">{c.d}</p>
           </div>
         ))}
      </div>
    </div>
  );
}

export function CatalogView() {
  return (
    <div className="p-6 pb-[140px] flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h2 className="font-editorial text-[36px] tracking-tight mb-4">Каталог</h2>
      <div className="w-20 h-20 mx-auto rounded-full bg-kts-surface border border-kts-line flex items-center justify-center text-3xl mb-4 text-kts-muted shadow-sm">
        ⌕
      </div>
      <h3 className="text-[18px] font-medium tracking-tight mb-2">Каталог появится здесь</h3>
      <p className="text-kts-muted text-[14px] leading-relaxed max-w-[260px]">Позже здесь будут продукты из магазинов, честные отзывы и сравнение цен.</p>
    </div>
  );
}

export function ProfileView({ onClear }: { onClear: () => void }) {
  const [theme, setTheme] = React.useState('light');
  
  React.useEffect(() => {
    setTheme(localStorage.getItem('kts-theme') || 'light');
  }, []);
  
  const toggleTheme = (newT: string) => {
    setTheme(newT);
    localStorage.setItem('kts-theme', newT);
    if (newT === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  return (
    <div className="p-6 pb-[140px]">
      <h2 className="font-editorial text-[36px] tracking-tight mb-6 mt-4">Профиль</h2>
      
      <div className="flex items-center gap-4 bg-kts-surface border border-kts-line rounded-[28px] p-5 shadow-sm mb-6">
         <div className="w-[60px] h-[60px] rounded-full bg-[#E5F2FF] text-[#0088CC] flex items-center justify-center font-medium text-[22px]">А</div>
         <div>
           <h3 className="text-[19px] font-medium tracking-tight mb-0.5">Аня</h3>
           <p className="text-[13px] text-kts-muted">Telegram Mini App</p>
         </div>
      </div>
      
      <div className="mb-6">
         <div className="text-kts-muted text-[11px] font-medium tracking-widest uppercase mb-3 px-2">Тема интерфейса</div>
         <div className="flex bg-kts-surface border border-kts-line p-1 rounded-full">
            <button 
              onClick={() => toggleTheme('light')} 
              className={`flex-1 py-2.5 rounded-full text-[14px] font-medium transition-all ${theme === 'light' ? 'bg-kts-bg shadow-sm text-kts-text' : 'text-kts-muted'}`}
            >Светлая</button>
            <button 
              onClick={() => toggleTheme('dark')} 
              className={`flex-1 py-2.5 rounded-full text-[14px] font-medium transition-all ${theme === 'dark' ? 'bg-kts-bg shadow-sm text-kts-text' : 'text-kts-muted'}`}
            >Тёмная</button>
         </div>
      </div>
      
      <div className="mb-8">
         <div className="text-kts-muted text-[11px] font-medium tracking-widest uppercase mb-3 px-2">Данные анкеты</div>
         <div className="bg-kts-surface border border-kts-line rounded-[24px] p-5 space-y-4">
           <div className="flex justify-between items-center"><span className="text-[14px] text-kts-muted">Тип кожи</span><span className="text-[14px] font-medium">Комбинированная</span></div>
           <div className="flex justify-between items-center"><span className="text-[14px] text-kts-muted">Бюджет</span><span className="text-[14px] font-medium">около 4 000 ₽</span></div>
         </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <Button variant="secondary">Обновить анкету</Button>
        <Button variant="ghost" onClick={onClear}>Очистить данные</Button>
      </div>
    </div>
  );
}
