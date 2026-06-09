"use client";

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  ready?: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export type TelegramEnvironment = {
  webApp: TelegramWebApp | null;
  isTelegramEnvironment: boolean;
  initData: string;
  telegramUser: TelegramUser | null;
};

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp || null;
}

export function readTelegramEnvironment(): TelegramEnvironment {
  const webApp = getTelegramWebApp();
  return {
    webApp,
    isTelegramEnvironment: Boolean(webApp),
    initData: webApp?.initData || "",
    telegramUser: webApp?.initDataUnsafe?.user || null,
  };
}

export function readyTelegramWebApp(): string | null {
  const webApp = getTelegramWebApp();
  if (!webApp) return null;
  try {
    webApp.ready?.();
    webApp.expand?.();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Telegram WebApp initialization failed";
  }
}
