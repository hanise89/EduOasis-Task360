"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { apiGet } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { User } from "@/types";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15 * 1000,
            retry: 1,
          },
        },
      })
  );
  const setUser = useAppStore((s) => s.setUser);

  // hydrate session on mount
  useEffect(() => {
    let mounted = true;
    apiGet<{ user: User | null }>("/api/auth/me")
      .then((r) => {
        if (mounted) setUser(r.user);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      mounted = false;
    };
  }, [setUser]);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
