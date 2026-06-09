"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Sparkles, Scan, LayoutGrid, User, ChevronLeft } from "lucide-react";

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
  const base = "h-12 px-5 rounded-[16px] font-medium transition-all flex items-center justify-center text-[14px] select-none outline-none focus-visible:ring-2 focus-visible:ring-kts-accent/60 active:scale-[0.98]";
  const variants = {
    primary: disabled 
      ? "bg-gradient-to-b from-white/8 to-white/2 text-kts-muted border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] cursor-not-allowed opacity-70" 
      : "bg-kts-accent text-kts-btn-text shadow-sm cursor-pointer",
    secondary: disabled 
      ? "bg-kts-surface/30 text-kts-muted border border-kts-line/40 cursor-not-allowed" 
      : "bg-kts-surface/70 text-kts-text border border-kts-line hover:bg-kts-surface cursor-pointer",
    ghost: disabled
      ? "text-kts-muted/40 cursor-not-allowed"
      : "bg-transparent text-kts-muted hover:text-kts-text cursor-pointer",
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}

export function SurfaceCard({
  children,
  className,
  as: Comp = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Comp className={cn("rounded-[18px] border border-kts-line bg-kts-surface/78 shadow-sm", className)}>
      {children}
    </Comp>
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

export function ScreenScaffold({
  children,
  className,
  bottomInset = "var(--screen-bottom)",
}: {
  children: React.ReactNode;
  className?: string;
  bottomInset?: string;
}) {
  return (
    <div
      className={cn("min-h-full px-[var(--screen-x)] pt-[var(--screen-top)]", className)}
      style={{ paddingBottom: bottomInset }}
    >
      {children}
    </div>
  );
}

export function FixedActionBar({
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
      <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-[120px] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-kts-bg via-kts-bg/84 to-transparent" />
      </div>
      <div className={cn("pointer-events-none absolute bottom-0 left-0 z-20 w-full px-[var(--screen-x)] pb-[calc(14px+var(--safe-bottom))] pt-3", className)}>
        <div ref={contentRef} className="pointer-events-auto mx-auto flex w-full max-w-[430px] gap-3">
          {children}
        </div>
      </div>
    </>
  );
}

export const BlurCTAFooter = FixedActionBar;

export function IconButton({ onClick, icon, disabled }: { onClick?: () => void, icon?: React.ReactNode, disabled?: boolean }) {
  return (
    <button 
      onClick={disabled ? undefined : onClick} 
      disabled={disabled}
      className={cn(
        "h-12 w-12 shrink-0 rounded-[16px] flex items-center justify-center border transition-all outline-none focus-visible:ring-2 focus-visible:ring-kts-accent/60 active:scale-95",
        disabled ? "border-kts-line text-kts-muted/35 bg-kts-surface/30 cursor-not-allowed" : "border-kts-line bg-kts-surface/70 text-kts-text hover:bg-kts-surface cursor-pointer"
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
    <button
      type="button"
      onClick={onClick} 
      className={cn(
        "w-full p-4 rounded-[18px] border transition-all cursor-pointer select-none flex flex-row items-center gap-3 relative overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-kts-accent/60 active:scale-[0.99]",
        selected 
          ? "bg-kts-accent text-kts-btn-text border-kts-accent shadow-sm" 
          : "bg-kts-surface/72 border-kts-line hover:bg-kts-surface"
      )}
    >
      <div className="flex-1 flex flex-col z-10">
        <h4 className={cn("text-[16px] font-medium mb-0.5", selected ? "text-kts-btn-text" : "text-kts-text")}>{title}</h4>
        {desc && <p className={cn("text-[13px] leading-tight", selected ? "text-kts-btn-text/75" : "text-kts-muted")}>{desc}</p>}
      </div>
      {icon && <div className={cn("shrink-0 mr-1", selected ? "text-kts-btn-text/80" : "text-kts-muted")}>{icon}</div>}
    </button>
  );
}

export const SelectionCard = OptionCard;

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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 px-4 inline-flex items-center gap-1.5 rounded-full border text-[13px] mb-1 font-medium whitespace-nowrap cursor-pointer select-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-kts-accent/60",
        selected 
          ? "bg-kts-accent border-kts-accent text-kts-btn-text" 
          : "bg-kts-surface/72 border-kts-line text-kts-muted hover:text-kts-text hover:bg-kts-surface"
      )}
    >
      {label}
    </button>
  );
}

export const SelectionChip = Chip;

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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 px-3.5 inline-flex items-center gap-2 rounded-[16px] border text-[13px] font-medium whitespace-nowrap cursor-pointer select-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-kts-accent/60",
        selected 
          ? "bg-kts-accent border-kts-accent text-kts-btn-text" 
          : "bg-kts-surface/72 border-kts-line text-kts-muted hover:text-kts-text hover:bg-kts-surface"
      )}
    >
      {imageSrc ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-white/90 p-0.5">
          <Image src={imageSrc} alt="" width={28} height={28} className="h-full w-full object-contain" />
        </span>
      ) : icon && <div className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</div>}
      {label}
    </button>
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
    { id: 'routine', label: 'Уход', icon: Sparkles },
    { id: 'scan', label: 'Скан', icon: Scan },
    { id: 'catalog', label: 'Каталог', icon: LayoutGrid },
    { id: 'profile', label: 'Профиль', icon: User },
  ];

  return (
    <div className="absolute bottom-0 left-0 z-50 w-full pb-[calc(10px+var(--safe-bottom))] pointer-events-none">
      <nav className="mx-[72px] mt-1.5 h-[var(--bottom-nav-height)] pointer-events-auto flex justify-between items-center rounded-full border border-kts-accent/22 bg-kts-surface/82 px-[5px] py-[9px] shadow-[0_14px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl">
        {items.map((item) => {
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                active ? "text-kts-btn-text" : "text-kts-muted hover:text-kts-text"
              )}
            >
              {active && <div className="absolute inset-0 rounded-full bg-kts-accent shadow-sm" />}
              <item.icon className={cn("z-10 h-[21px] w-[21px] transition-all", active ? "stroke-[2px]" : "stroke-[1.45]")} />
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
