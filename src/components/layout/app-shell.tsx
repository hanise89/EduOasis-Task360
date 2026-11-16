"use client";

import { useAppStore, type ViewKey } from "@/lib/store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { GmDashboard } from "@/features/dashboard/gm-dashboard";
import { StaffDashboard } from "@/features/dashboard/staff-dashboard";
import { TasksView } from "@/features/tasks/tasks-view";
import { PerformanceView } from "@/features/performance/performance-view";
import { WorkloadView } from "@/features/workload/workload-view";
import { InitiativesView } from "@/features/initiatives/initiatives-view";
import { ReportsView } from "@/features/reports/reports-view";
import { NotificationsView } from "@/features/notifications/notifications-view";
import { SettingsView } from "@/features/settings/settings-view";
import { ProfileView } from "@/features/settings/profile-view";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export function AppShell() {
  const user = useAppStore((s) => s.user)!;
  const view = useAppStore((s) => s.view);
  const isGM = user.role === "GM";

  // background notification refetch
  useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<{ unreadCount: number }>("/api/notifications"),
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto scroll-slim pb-20 lg:pb-0">
            <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {renderView(view, isGM)}
            </div>
          </main>
        </div>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );

  function renderView(view: ViewKey, isGM: boolean) {
    switch (view) {
      case "dashboard":
        return isGM ? <GmDashboard /> : <StaffDashboard />;
      case "tasks":
        return <TasksView />;
      case "performance":
        return <PerformanceView />;
      case "workload":
        return isGM ? <WorkloadView /> : <AccessDenied />;
      case "initiatives":
        return <InitiativesView />;
      case "reports":
        return <ReportsView />;
      case "notifications":
        return <NotificationsView />;
      case "settings":
        return isGM ? <SettingsView /> : <AccessDenied />;
      case "profile":
        return <ProfileView />;
      default:
        return isGM ? <GmDashboard /> : <StaffDashboard />;
    }
  }
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center py-24 text-center">
      <div>
        <div className="text-4xl font-semibold text-muted-foreground/40 mb-2">403</div>
        <p className="text-muted-foreground">Anda tiada akses ke halaman ini.</p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="hidden lg:block mt-auto border-t border-border bg-muted/30">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">EDUOASIS TASK360</span>
          <span>·</span>
          <span>Al Amin Edu Oasis</span>
        </div>
        <div>v1.0 Prototaip · Sulit — Kegunaan Dalaman</div>
      </div>
    </footer>
  );
}
