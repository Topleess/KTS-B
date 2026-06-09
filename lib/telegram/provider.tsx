"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import type { ApiAuthResponse, ApiAuthUser } from "@/lib/api/contracts";
import {
  readTelegramEnvironment,
  readyTelegramWebApp,
  type TelegramUser,
} from "@/lib/telegram/web-app";

type TelegramContextValue = {
  isTelegramEnvironment: boolean;
  telegramUser: TelegramUser | null;
  initData: string;
  isReady: boolean;
  authError: string | null;
  authUser: ApiAuthUser | null;
};

const TelegramContext = React.createContext<TelegramContextValue>({
  isTelegramEnvironment: false,
  telegramUser: null,
  initData: "",
  isReady: false,
  authError: null,
  authUser: null,
});

export function useTelegram() {
  return React.useContext(TelegramContext);
}

export function TelegramProvider({
  children,
  onAuthSettled,
}: {
  children: React.ReactNode;
  onAuthSettled?: () => void;
}) {
  const [state, setState] = React.useState<TelegramContextValue>({
    isTelegramEnvironment: false,
    telegramUser: null,
    initData: "",
    isReady: false,
    authError: null,
    authUser: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const environment = readTelegramEnvironment();
      const initError = readyTelegramWebApp();

      setState((current) => ({
        ...current,
        isTelegramEnvironment: environment.isTelegramEnvironment,
        telegramUser: environment.telegramUser,
        initData: environment.initData,
        authError: initError,
      }));

      try {
        let auth: ApiAuthResponse | null = null;
        if (environment.initData) {
          auth = await apiFetch<ApiAuthResponse>("/auth/telegram", {
            method: "POST",
            body: JSON.stringify({ init_data: environment.initData }),
            devUser: false,
          });
        } else if (process.env.NODE_ENV !== "production") {
          auth = await apiFetch<ApiAuthResponse>("/auth/dev-login", {
            method: "POST",
            devUser: false,
          });
        } else {
          try {
            auth = await apiFetch<ApiAuthResponse>("/me", { devUser: false });
          } catch {
            auth = null;
          }
        }

        if (!cancelled) {
          setState({
            isTelegramEnvironment: environment.isTelegramEnvironment,
            telegramUser: environment.telegramUser,
            initData: environment.initData,
            isReady: true,
            authError: initError,
            authUser: auth?.user || null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            isTelegramEnvironment: environment.isTelegramEnvironment,
            telegramUser: environment.telegramUser,
            initData: environment.initData,
            isReady: true,
            authError: error instanceof Error ? error.message : "Telegram auth failed",
            authUser: null,
          });
        }
      } finally {
        if (!cancelled) onAuthSettled?.();
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [onAuthSettled]);

  const value = React.useMemo(() => state, [state]);

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}
