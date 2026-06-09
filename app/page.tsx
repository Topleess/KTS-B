"use client";

import React, { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { OnboardingCarousel, PreQuestionnaireIntro, GeneratingScreen, RoutineResultScreen } from "@/components/Screens";
import { QuestionnaireFlow } from "@/components/QuestionnaireScreens";
import { InternalApp } from "@/components/InternalApp";
import { generateRoutineFromQuestionnaire } from "@/lib/api/client";
import { AppAnswers, QUESTIONNAIRE_STORAGE_KEY, ROUTINE_READY_STORAGE_KEY, defaultAnswers } from "@/lib/domain/questionnaire";
import { AppTab } from "@/lib/mock-data";
import { AnimatePresence, motion } from "motion/react";

type AppView =
  | "welcome"
  | "onboarding"
  | "pre-q"
  | "questionnaire"
  | "generating"
  | "result"
  | AppTab;

export default function App() {
  const [view, setView] = useState<AppView>("welcome");
  const [onboardingInitialSlide, setOnboardingInitialSlide] = useState<"first" | "last">("first");
  const [QDirection, setQDirection] = useState(1);
  const [answers, setAnswers] = useState<AppAnswers>(() => {
    if (typeof window === "undefined") return defaultAnswers;
    const savedAnswers = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
    if (!savedAnswers) return defaultAnswers;
    try {
      return { ...defaultAnswers, ...JSON.parse(savedAnswers) };
    } catch {
      localStorage.removeItem(QUESTIONNAIRE_STORAGE_KEY);
      return defaultAnswers;
    }
  });
  const [hasRoutine, setHasRoutine] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ROUTINE_READY_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('kts-theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    localStorage.setItem(ROUTINE_READY_STORAGE_KEY, String(hasRoutine));
  }, [hasRoutine]);

  const handleClear = () => {
    localStorage.removeItem(QUESTIONNAIRE_STORAGE_KEY);
    localStorage.removeItem(ROUTINE_READY_STORAGE_KEY);
    setHasRoutine(false);
    setAnswers(defaultAnswers);
    document.documentElement.classList.add('dark');
    localStorage.setItem("kts-theme", "dark");
    setView('welcome');
  };

  const nav = (v: AppView, dir: number = 1) => {
    setQDirection(dir);
    setView(v);
  };

  const openOnboarding = (initialSlide: "first" | "last", dir: number = 1) => {
    setOnboardingInitialSlide(initialSlide);
    nav("onboarding", dir);
  };

  const handleQuestionnaireComplete = () => {
    nav("generating", 1);
    void generateRoutineFromQuestionnaire(answers)
      .then(() => setHasRoutine(true))
      .catch((error) => {
        console.error("Routine generation failed, keeping local fallback", error);
      });
  };

  const isAtmosphericView = view === "welcome" || view === "result";
  const shouldShowBrandPhoto = view === "welcome" || view === "onboarding" || view === "result";

  return (
    <div className="w-full h-full relative overflow-hidden bg-kts-bg">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out" 
        style={{ 
          backgroundImage: 'url(/assets/brand/beauty-portrait.jpg)',
          filter: isAtmosphericView ? 'blur(0px) brightness(0.92)' : 'blur(30px) brightness(0.22) saturate(0.35)',
          transform: view === 'welcome' ? 'scale(1)' : 'scale(1.12)',
          opacity: shouldShowBrandPhoto ? 1 : 0,
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/45 via-[#0A0807]/40 to-black pointer-events-none transition-opacity duration-1000" style={{ opacity: shouldShowBrandPhoto ? view === 'welcome' ? 1 : 0.98 : 0 }} />
      {view === "onboarding" && <div className="absolute inset-0 z-0 bg-kts-bg/78 pointer-events-none transition-opacity duration-1000" />}

      <div className="relative z-10 w-full h-full">
        <AnimatePresence initial={false} custom={QDirection} mode="wait">
          {(() => {
          switch (view) {
            case "welcome": return <motion.div key="w" className="h-full flex flex-col" exit={{ opacity: 0 }}><WelcomeScreen onNext={() => openOnboarding("first")} /></motion.div>;
            case "onboarding": return <motion.div key="ob" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><OnboardingCarousel initialSlide={onboardingInitialSlide} onNext={() => nav("pre-q")} onSkip={() => nav("pre-q")} onBack={() => nav("welcome", -1)} /></motion.div>;
            
            case "pre-q": return <motion.div key="pq" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><PreQuestionnaireIntro onNext={() => nav("questionnaire")} onBack={() => openOnboarding("last", -1)} onSkip={() => nav("routine")} /></motion.div>;
            
            case "questionnaire": return <motion.div key="questionnaire" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><QuestionnaireFlow answers={answers} setAnswers={setAnswers} onComplete={handleQuestionnaireComplete} onBackToIntro={() => nav("pre-q", -1)} onSkip={() => nav("routine", 1)} /></motion.div>;
            
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
