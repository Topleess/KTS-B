"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

import { TelegramProvider } from "@/lib/telegram/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  const handleAuthSettled = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["api"] });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider onAuthSettled={handleAuthSettled}>{children}</TelegramProvider>
    </QueryClientProvider>
  );
}
