"use client";
import * as React from "react";
import { motion } from "motion/react";
import Link from "next/link";

export function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const knobSize = 52;
  const padding = 12;

  React.useEffect(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.offsetWidth);
    }
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setTrackWidth(entry.contentRect.width);
      }
    });
    if (trackRef.current) observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, []);

  const rightConstrain = trackWidth > 0 ? trackWidth - knobSize - padding * 2 : 228;

  return (
    <div className="flex-1 flex flex-col text-[#fff6ef] p-6 relative z-0 h-full">
      <div className="absolute top-[10%] right-0 w-[350px] h-[350px] bg-[#d9b897] opacity-10 blur-[100px] pointer-events-none rounded-full translate-x-1/4 -translate-y-1/4 z-[-1]" />

      
      <div className="flex justify-between items-center mt-6">
        <div className="font-editorial tracking-[0.2em] text-[18px] uppercase text-[#f4e8da]">KTS Beauty</div>
      </div>
      
      <div className="flex-1" />
      
      <div className="mb-10 relative">
         <h1 className="font-editorial text-[44px] sm:text-[48px] leading-[0.98] tracking-[-0.03em] text-white">
           Пойми,<br/>что нужно<br/>твоей коже.
         </h1>
      </div>

      <div 
        ref={trackRef}
        className="w-full h-[64px] rounded-full border border-white/10 bg-white/[0.03] flex items-center p-1.5 backdrop-blur-md mt-auto relative overflow-hidden mb-5 shadow-lg"
      >
         <span className="absolute w-full text-center text-white/40 font-medium tracking-wide z-0 pointer-events-none text-[14px]">Проведи, чтобы начать</span>
         <motion.div
           drag="x"
           dragConstraints={{ left: 0, right: rightConstrain }}
           dragElastic={0}
           animate={{ x: done ? rightConstrain : 0 }}
           transition={{ duration: done ? 0.22 : 0, ease: "easeOut" }}
           onDragEnd={(e, info) => {
             if (info.offset.x >= rightConstrain * 0.72) {
               setDone(true);
               window.setTimeout(() => onNext(), 180);
             }
           }}
           className="w-[52px] h-[52px] bg-[#f5e9dd] rounded-full flex items-center justify-center text-[#201713] shadow-[0_4px_16px_rgba(0,0,0,0.3)] z-10 cursor-grab active:cursor-grabbing text-xl font-light"
         >
            →
         </motion.div>
      </div>
      
      <p className="text-[12px] text-center opacity-60 leading-[1.38] max-w-[332px] mx-auto mb-4 text-[#fffaf4] text-balance">
        Продолжая, вы принимаете <Link href="/legal/privacy" className="underline underline-offset-2 decoration-white/30 cursor-pointer hover:text-white hover:decoration-white/60">политику обработки данных</Link> и даёте согласие на <Link href="/legal/consent" className="underline underline-offset-2 decoration-white/30 cursor-pointer hover:text-white hover:decoration-white/60">их обработку</Link>
      </p>
    </div>
  );
}
