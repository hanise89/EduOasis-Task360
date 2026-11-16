"use client";

import { useAppStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useEffect } from "react";
import { LoginScreen } from "@/features/login/login-screen";
import { AppShell } from "@/components/layout/app-shell";

export default function Home() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const view = useAppStore((s) => s.view);

  // Sync view + taskId from URL query params for deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view") as any;
    const id = params.get("id");
    if (v) useAppStore.getState().setView(v);
    if (id && v === "tasks") useAppStore.getState().setSelectedTaskId(id);
    if (id && v === "performance") useAppStore.getState().setSelectedStaffId(id);
    // clean URL
    if (params.has("view") || params.has("id")) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Keep checking auth state
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: () => apiGet<{ user: typeof user }>("/api/auth/me"),
    enabled: !user,
  });

  useEffect(() => {
    if (sessionData?.user && !user) {
      setUser(sessionData.user);
    }
  }, [sessionData, user, setUser]);

  if (!user) {
    return <LoginScreen />;
  }

  return <AppShell />;
}
