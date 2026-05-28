"use client";

import React, { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { OnboardingCarousel, PreQuestionnaireIntro, GeneratingScreen, RoutineResultScreen } from "@/components/Screens";
import { QStep1, QStep2, QStep3, QStep4, QStep5, QStep6, QStep7 } from "@/components/QuestionnaireScreens";
import { InternalApp } from "@/components/InternalApp";
import { AppAnswers, defaultAnswers } from "@/components/UI";
import { AppTab } from "@/lib/mock-data";
import { AnimatePresence, motion } from "motion/react";

const fadeVariants = {
  enter: () => ({
    opacity: 0,
    scale: 0.995,
  }),
  center: {
    zIndex: 1,
    opacity: 1,
    scale: 1,
  },
  exit: () => ({
    zIndex: 0,
    opacity: 0,
    scale: 1.003,
  })
};

function AnimatedQStep({ children, direction, stepKey }: { children: React.ReactNode, direction: number, stepKey: string }) {
  return (
    <motion.div
      key={stepKey}
      custom={direction}
      variants={fadeVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ opacity: { duration: 0.3, ease: "easeInOut" }, scale: { duration: 0.3, ease: "easeInOut" } }}
      className="h-full flex flex-col"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [view, setView] = useState("welcome");
  const [QDirection, setQDirection] = useState(1);
  const [answers, setAnswers] = useState<AppAnswers>(defaultAnswers);
  const [hasRoutine, setHasRoutine] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('kts-theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleClear = () => {
    localStorage.clear();
    setHasRoutine(false);
    setAnswers(defaultAnswers);
    document.documentElement.classList.add('dark');
    setView('welcome');
  };

  const nav = (v: string, dir: number = 1) => {
    setQDirection(dir);
    setView(v);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-kts-bg">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out" 
        style={{ 
          backgroundImage: 'url(/assets/brand/beauty-portrait.jpg)',
          filter: view === 'welcome' ? 'blur(0px) brightness(0.92)' : 'blur(18px) brightness(0.14) saturate(0.86)',
          transform: view === 'welcome' ? 'scale(1)' : 'scale(1.08)',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/45 via-[#0A0807]/40 to-black pointer-events-none transition-opacity duration-1000" style={{ opacity: view === 'welcome' ? 1 : 0.95 }} />

      <div className="relative z-10 w-full h-full">
        <AnimatePresence initial={false} custom={QDirection} mode="wait">
          {(() => {
          switch (view) {
            case "welcome": return <motion.div key="w" className="h-full flex flex-col" exit={{ opacity: 0 }}><WelcomeScreen onNext={() => nav("onboarding")} /></motion.div>;
            case "onboarding": return <motion.div key="ob" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><OnboardingCarousel onNext={() => nav("pre-q")} onSkip={() => nav("routine")} onBack={() => nav("welcome", -1)} /></motion.div>;
            
            case "pre-q": return <motion.div key="pq" className="h-full flex flex-col" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}><PreQuestionnaireIntro onNext={() => nav("q1")} onBack={() => nav("onboarding")} onSkip={() => nav("routine")} /></motion.div>;
            
            // Questionnaire Steps (Animated together)
            case "q1": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep1 stepIndex={1} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q2", 1)} onBack={() => nav("pre-q", -1)} onSkip={() => nav("routine", 1)} /></AnimatedQStep>;
            case "q2": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep2 stepIndex={2} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q3", 1)} onBack={() => nav("q1", -1)} onSkip={() => nav("routine", 1)} /></AnimatedQStep>;
            case "q3": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep3 stepIndex={3} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q4", 1)} onBack={() => nav("q2", -1)} onSkip={() => nav("routine", 1)} /></AnimatedQStep>;
            case "q4": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep4 stepIndex={4} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q5", 1)} onBack={() => nav("q3", -1)} onSkip={() => nav("routine", 1)} /></AnimatedQStep>;
            case "q5": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep5 stepIndex={5} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q6", 1)} onBack={() => nav("q4", -1)} onSkip={() => nav("routine", 1)} /></AnimatedQStep>;
            case "q6": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep6 stepIndex={6} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q7", 1)} onBack={() => nav("q5", -1)} onSkip={() => nav("routine", 1)} /></AnimatedQStep>;
            case "q7": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep7 stepIndex={7} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("generating", 1)} onBack={() => nav("q6", -1)} onSkip={() => nav("routine", 1)} /></AnimatedQStep>;
            
            // Generation & Result
            case "generating": return <motion.div key="gen" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><GeneratingScreen onNext={() => { setHasRoutine(true); nav("result"); }} /></motion.div>;
            case "result": return <motion.div key="res" className="h-full flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><RoutineResultScreen onFinish={() => nav("routine")} /></motion.div>;

            case "routine":
            case "scan":
            case "catalog":
            case "profile":
              return (
                <motion.div key="app" className="h-full flex flex-col relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <InternalApp initialTab={view as AppTab} hasRoutine={hasRoutine} onStartQuestionnaire={() => nav("pre-q", 1)} onClear={handleClear} />
                </motion.div>
              );
              
            default: return null;
          }
        })()}
      </AnimatePresence>
      </div>
    </div>
  );
}
