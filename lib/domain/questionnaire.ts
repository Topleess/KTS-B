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

export type QuestionnaireStepId = "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7";

export const defaultAnswers: AppAnswers = {
  category: [],
  focus: [],
  skinType: "",
  restrictions: { sensitivity: {}, exclude: [] },
  age: "",
  experience: "",
  budget: "",
  stores: [],
};

export const QUESTIONNAIRE_STORAGE_KEY = "kts-answers";
export const ROUTINE_READY_STORAGE_KEY = "kts-has-routine";
