"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Sparkles, Scan, LayoutGrid, User, ChevronLeft } from "lucide-react";

export type AppAnswers = {
  category: string[];
  focus: string[];
  skinType: string;
  restrictions: { sensitivity: Record<string, boolean>; exclude: string[] };
  age: string;
  experience: string;
  budget: string;
  stores: string[];
};

export const defaultAnswers: AppAnswers = {
  category: [],
  focus: [],
  skinType: '',
  restrictions: { sensitivity: {}, exclude: [] },
  age: '',
  experience: '',
  budget: '',
  stores: [],
};

export function Button({ 
  variant = 'primary', 
  className, 
  children, 
  onClick,
  disabled 
}: { 
  variant?: 'primary' | 'secondary' | 'ghost', 
  className?: string, 
  children: React.ReactNode, 
  onClick?: () => void,
  disabled?: boolean
}) {
  const base = "h-[50px] px-6 rounded-full font-medium transition-all flex items-center justify-center text-[14px] select-none";
  const variants = {
    primary: disabled 
      ? "bg-gradient-to-b from-white/8 to-white/2 text-kts-muted border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] cursor-not-allowed opacity-70" 
      : "bg-gradient-to-br from-kts-accent to-kts-accent2 text-kts-btn-text shadow-lg shadow-kts-accent/10 active:scale-[0.98] cursor-pointer",
    secondary: disabled 
      ? "bg-kts-surface/30 text-kts-muted border border-kts-line/40 cursor-not-allowed" 
      : "bg-transparent text-kts-text border border-kts-line hover:bg-kts-surface/30 active:scale-[0.98] cursor-pointer",
    ghost: disabled
      ? "text-kts-muted/40 cursor-not-allowed"
      : "bg-kts-surface/10 text-kts-muted hover:text-kts-text active:scale-[0.98] cursor-pointer",
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}

export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BlurCTAFooter({
  children,
  className,
  contentRef,
}: {
  children: React.ReactNode;
  className?: string;
  contentRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <>
      <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-[156px] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/88 via-[#0A0807]/42 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/[0.04] via-transparent to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[7px] [mask-image:linear-gradient(to_top,black_40%,transparent)]" />
      </div>
      <div className={cn("pointer-events-none absolute bottom-0 left-0 z-20 w-full px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]", className)}>
        <div ref={contentRef} className="pointer-events-auto mx-auto flex w-full max-w-[430px] gap-3">
          {children}
        </div>
      </div>
    </>
  );
}

export function IconButton({ onClick, icon, disabled }: { onClick?: () => void, icon?: React.ReactNode, disabled?: boolean }) {
  return (
    <button 
      onClick={disabled ? undefined : onClick} 
      disabled={disabled}
      className={cn(
        "w-[50px] h-[50px] shrink-0 rounded-full flex items-center justify-center border transition-all backdrop-blur-xl",
        disabled ? "border-white/5 text-white/25 bg-white/[0.03] cursor-not-allowed" : "border-white/10 bg-white/[0.07] text-white hover:bg-white/10 active:scale-95 cursor-pointer"
      )}
    >
      {icon || <ChevronLeft className="w-5 h-5 -ml-0.5" />}
    </button>
  );
}

export function OptionCard({ 
  title, 
  desc, 
  selected, 
  onClick,
  icon,
}: { 
  title: string, 
  desc?: string, 
  selected?: boolean, 
  onClick?: () => void,
  icon?: React.ReactNode
}) {
  return (
    <div 
      onClick={onClick} 
      className={cn(
        "p-[16px] rounded-[24px] border transition-all cursor-pointer select-none flex flex-row items-center gap-3 relative overflow-hidden backdrop-blur-xl",
        selected 
          ? "bg-white/[0.13] border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_12px_34px_rgba(0,0,0,0.16)]" 
          : "bg-white/[0.055] border-white/8 hover:border-white/15 hover:bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
      )}
    >
      <div className="flex-1 flex flex-col z-10">
        <h4 className="text-[16px] font-medium tracking-tight mb-0.5 text-kts-text">{title}</h4>
        {desc && <p className="text-[13px] text-kts-muted leading-tight">{desc}</p>}
      </div>
      {icon && <div className="text-kts-muted shrink-0 mr-1">{icon}</div>}
    </div>
  );
}

export function Chip({ 
  label, 
  selected, 
  onClick 
}: { 
  label: string, 
  selected?: boolean, 
  onClick?: () => void 
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "h-8 px-4 inline-flex items-center gap-1.5 rounded-full border text-[13px] mb-1 font-medium whitespace-nowrap cursor-pointer select-none transition-colors backdrop-blur-md",
        selected 
          ? "bg-white/10 border-white/20 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
          : "bg-[#18181A]/40 border-white/5 text-kts-muted hover:text-white hover:border-white/10 hover:bg-white/5"
      )}
    >
      {label}
    </div>
  );
}

export function RetailerChip({ 
  label, 
  icon,
  imageSrc,
  selected, 
  onClick 
}: { 
  label: string; 
  icon?: React.ReactNode;
  imageSrc?: string;
  selected: boolean; 
  onClick: () => void 
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "h-11 px-3.5 inline-flex items-center gap-2 rounded-[16px] border text-[13px] font-medium whitespace-nowrap cursor-pointer select-none transition-all backdrop-blur-xl",
        selected 
          ? "bg-white/[0.14] border-white/25 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_0_18px_rgba(255,255,255,0.06)]" 
          : "bg-white/[0.055] border-white/8 text-kts-muted hover:text-white hover:border-white/15 hover:bg-white/[0.08]"
      )}
    >
      {imageSrc ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-white/90 p-0.5">
          <Image src={imageSrc} alt="" width={28} height={28} className="h-full w-full object-contain" />
        </span>
      ) : icon && <div className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</div>}
      {label}
    </div>
  );
}

export function Toggle({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string, 
  checked: boolean, 
  onChange: (v: boolean) => void 
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer select-none">
      <span className="text-[14px] font-medium leading-tight text-white/90">{label}</span>
      <div className={cn(
        "relative w-[42px] h-[24px] rounded-full transition-colors flex shrink-0 border",
        checked ? "bg-white border-white" : "bg-[#18181A]/60 flex border-white/10"
      )}>
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-sm transition-transform duration-200",
          checked ? "bg-kts-bg left-[calc(100%-1.1rem)]" : "bg-white/60 left-1"
        )} />
      </div>
    </label>
  );
}

export function ScreenHeader({ 
  step, 
  onBack,
  rightAction
}: { 
  step?: string, 
  onBack?: () => void,
  rightAction?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mt-2 mb-4 sticky top-0 bg-kts-bg/80 backdrop-blur-xl z-20 py-2 -mx-2 px-2">
      <div className="flex items-center gap-2">
        <div className="font-editorial uppercase tracking-widest text-[16px] opacity-80 pl-2">KTS Beauty</div>
      </div>
      {rightAction && <div className="pr-1">{rightAction}</div>}
    </div>
  );
}

export function BottomNav({ 
  current, 
  onNavigate 
}: { 
  current: string, 
  onNavigate: (id: string) => void 
}) {
  const items = [
    { id: 'routine', label: 'Рутина', icon: Sparkles },
    { id: 'scan', label: 'Скан', icon: Scan },
    { id: 'catalog', label: 'Каталог', icon: LayoutGrid },
    { id: 'profile', label: 'Профиль', icon: User },
  ];

  return (
    <div className="absolute bottom-6 left-0 w-full px-4 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav className="mx-auto max-w-[400px] pointer-events-auto flex justify-between items-center bg-white/[0.10] backdrop-blur-2xl border border-white/20 rounded-full px-2 py-2 shadow-[0_24px_48px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.22)]">
        {items.map((item) => {
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-12 rounded-full transition-all duration-300 relative",
                active ? "text-white" : "text-white/40 hover:text-white/80"
              )}
            >
              {active && <div className="absolute inset-0 bg-white/10 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />}
              <item.icon className={cn("w-[22px] h-[22px] z-10 transition-all", active ? "stroke-[2px] -translate-y-0.5" : "stroke-[1.5]")} />
              {active && <span className="absolute bottom-1 text-[9px] font-medium tracking-wide z-10 opacity-80">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
