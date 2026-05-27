"use client";

import React, { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { TgInitScreen, Onboarding1, Onboarding2, Onboarding3, PreQuestionnaireIntro, GeneratingScreen, RoutineResultScreen } from "@/components/Screens";
import { QStep1, QStep2, QStep3, QStep4, QStep5, QStep6, QStep7 } from "@/components/QuestionnaireScreens";
import { AppContainer, HomeView, RoutineView, ScanView, CatalogView, ProfileView } from "@/components/MainScreens";
import { AppAnswers, defaultAnswers } from "@/components/UI";
import { AnimatePresence, motion } from "motion/react";

const fadeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 30 : -30,
    opacity: 0,
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
      transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
      className="absolute inset-0 flex flex-col"
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

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('kts-theme') || 'dark'; // Force dark as default
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
    document.documentElement.classList.add('dark'); // Restore dark
    setView('welcome');
  };

  const nav = (v: string, dir: number = 1) => {
    setQDirection(dir);
    setView(v);
  };

  const isQ = view.startsWith("q");

  return (
    <div className="w-full h-full relative overflow-hidden bg-kts-bg">
      {/* The global anchor background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out" 
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1616683693504-3ea7e9ad6ece?q=80&w=800&auto=format&fit=crop)',
          filter: view === 'welcome' ? 'blur(0px) brightness(0.95)' : 'blur(16px) brightness(0.2)' 
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-transparent to-[#0A0807]/90 pointer-events-none transition-opacity duration-1000" style={{ opacity: view === 'welcome' ? 1 : 0.6 }} />

      <div className="relative z-10 w-full h-full">
        <AnimatePresence initial={false} custom={QDirection} mode="popLayout">
          {(() => {
          switch (view) {
            case "welcome": return <motion.div key="w" className="h-full flex flex-col" exit={{ opacity: 0 }}><WelcomeScreen onNext={() => nav("tg-init")} /></motion.div>;
            case "tg-init": return <motion.div key="tg" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><TgInitScreen onNext={() => nav("onboarding-1")} /></motion.div>;
            
            case "onboarding-1": return <motion.div key="o1" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Onboarding1 onNext={() => nav("onboarding-2")} onSkip={() => nav("home")} /></motion.div>;
            case "onboarding-2": return <motion.div key="o2" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Onboarding2 onNext={() => nav("onboarding-3")} onSkip={() => nav("home")} /></motion.div>;
            case "onboarding-3": return <motion.div key="o3" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Onboarding3 onNext={() => nav("pre-q")} onSkip={() => nav("home")} /></motion.div>;
            
            case "pre-q": return <motion.div key="pq" className="h-full flex flex-col" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}><PreQuestionnaireIntro onNext={() => nav("q1")} onBack={() => nav("onboarding-3")} /></motion.div>;
            
            // Questionnaire Steps (Animated together)
            case "q1": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep1 stepIndex={1} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q2", 1)} onBack={() => nav("pre-q", -1)} onSkip={() => nav("generating", 1)} /></AnimatedQStep>;
            case "q2": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep2 stepIndex={2} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q3", 1)} onBack={() => nav("q1", -1)} onSkip={() => nav("generating", 1)} /></AnimatedQStep>;
            case "q3": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep3 stepIndex={3} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q4", 1)} onBack={() => nav("q2", -1)} onSkip={() => nav("generating", 1)} /></AnimatedQStep>;
            case "q4": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep4 stepIndex={4} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q5", 1)} onBack={() => nav("q3", -1)} onSkip={() => nav("generating", 1)} /></AnimatedQStep>;
            case "q5": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep5 stepIndex={5} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q6", 1)} onBack={() => nav("q4", -1)} onSkip={() => nav("generating", 1)} /></AnimatedQStep>;
            case "q6": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep6 stepIndex={6} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("q7", 1)} onBack={() => nav("q5", -1)} onSkip={() => nav("generating", 1)} /></AnimatedQStep>;
            case "q7": return <AnimatedQStep stepKey={view} direction={QDirection}><QStep7 stepIndex={7} direction={QDirection} answers={answers} setAnswers={setAnswers} onNext={() => nav("generating", 1)} onBack={() => nav("q6", -1)} onSkip={() => nav("generating", 1)} /></AnimatedQStep>;
            
            // Generation & Result
            case "generating": return <motion.div key="gen" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><GeneratingScreen onNext={() => { setHasRoutine(true); nav("result"); }} /></motion.div>;
            case "result": return <motion.div key="res" className="h-full flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><RoutineResultScreen onFinish={() => nav("routine")} /></motion.div>;

            // Main App Views inside Container
            case "home":
            case "routine":
            case "scan":
            case "catalog":
            case "profile":
              return (
                <motion.div key="app" className="h-full flex flex-col relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AppContainer view={view} onNavigate={(v) => nav(v)}>
                    {view === "home" && <HomeView hasRoutine={hasRoutine} onStart={() => nav("pre-q", 1)} />}
                    {view === "routine" && <RoutineView hasRoutine={hasRoutine} onStart={() => nav("pre-q", 1)} />}
                    {view === "scan" && <ScanView />}
                    {view === "catalog" && <CatalogView />}
                    {view === "profile" && <ProfileView onClear={handleClear} />}
                  </AppContainer>
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
