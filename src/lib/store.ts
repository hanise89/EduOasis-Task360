"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, PeriodKey } from "@/types";

export type ViewKey =
  | "dashboard"
  | "tasks"
  | "performance"
  | "workload"
  | "initiatives"
  | "reports"
  | "notifications"
  | "settings"
  | "profile";

interface AppState {
  user: User | null;
  view: ViewKey;
  selectedTaskId: string | null;
  selectedStaffId: string | null;
  period: PeriodKey;
  notifOpen: boolean;
  setUser: (u: User | null) => void;
  setView: (v: ViewKey) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedStaffId: (id: string | null) => void;
  setPeriod: (p: PeriodKey) => void;
  setNotifOpen: (open: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      view: "dashboard",
      selectedTaskId: null,
      selectedStaffId: null,
      period: "month",
      notifOpen: false,
      setUser: (u) => set({ user: u }),
      setView: (v) => set({ view: v }),
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setSelectedStaffId: (id) => set({ selectedStaffId: id }),
      setPeriod: (p) => set({ period: p }),
      setNotifOpen: (open) => set({ notifOpen: open }),
      logout: () => set({ user: null, view: "dashboard", selectedTaskId: null }),
    }),
    {
      name: "task360-app",
      partialize: (s) => ({ user: s.user, view: s.view, period: s.period }),
    }
  )
);
