"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShieldCheck, User, Lock, ArrowRight, Users, BarChart3, Layers } from "lucide-react";
import type { User as UserType } from "@/types";

export function LoginScreen() {
  const setUser = useAppStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Sila isi e-mel dan kata laluan.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ user: UserType }>("/api/auth/login", { email, password });
      setUser(res.user);
      toast.success(`Selamat datang, ${res.user.name}`);
    } catch (err: any) {
      toast.error(err.message || "Log masuk gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuick(role: "GM" | "STAF") {
    setQuickLoading(role);
    try {
      const res = await apiPost<{ user: UserType }>("/api/auth/quick", { role });
      setUser(res.user);
      toast.success(`Log masuk pantas sebagai ${role === "GM" ? "General Manager" : "Staf"}: ${res.user.name}`);
    } catch (err: any) {
      toast.error(err.message || "Log masuk pantas gagal.");
    } finally {
      setQuickLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left brand panel */}
      <div className="lg:w-1/2 relative overflow-hidden bg-primary text-primary-foreground flex flex-col justify-between p-8 lg:p-14">
        <div className="absolute inset-0 swiss-grid opacity-[0.15]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-oasis-teal/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center shadow-lg">
              <Layers className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium tracking-wide text-primary-foreground/70">AL AMIN EDU OASIS</div>
              <div className="text-lg font-semibold tracking-tight">EDUOASIS TASK360</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl lg:text-5xl font-semibold leading-[1.05] tracking-tight text-balance"
          >
            Pemantauan prestasi staf yang <span className="text-accent">telus &amp; berasaskan data</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-primary-foreground/70 text-base lg:text-lg leading-relaxed"
          >
            Satu sistem tunggal untuk GM memberi tugasan, menjejak kemajuan kerja, dan menilai prestasi staf
            merentasi enam dimensi — sebelum masalah menjadi isu.
          </motion.p>

          <div className="mt-8 space-y-3">
            {[
              { icon: BarChart3, label: "6 Dimensi Prestasi dengan skor automatik" },
              { icon: Users, label: "Pemantauan beban kerja & akauntabiliti" },
              { icon: ShieldCheck, label: "Penilaian objektif, boleh dijelaskan & boleh diaudit" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-3 text-primary-foreground/85"
              >
                <div className="w-8 h-8 rounded-md bg-primary-foreground/10 flex items-center justify-center">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/50">
          v1.0 Prototaip · Klasifikasi: Sulit — Kegunaan Dalaman
        </div>
      </div>

      {/* Right login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Log Masuk</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Masuk ke akaun anda untuk meneruskan.
            </p>
          </div>

          <Card className="p-6 card-flat">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  E-mel
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@eduoasis.my"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Kata Laluan
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sedang log masuk..." : "Log Masuk"}
                {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="bg-card px-2 text-muted-foreground">Log masuk pantas untuk demo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleQuick("GM")}
                disabled={!!quickLoading}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                {quickLoading === "GM" ? (
                  <span className="text-xs">Memuat...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium">Sebagai GM</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuick("STAF")}
                disabled={!!quickLoading}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                {quickLoading === "STAF" ? (
                  <span className="text-xs">Memuat...</span>
                ) : (
                  <>
                    <User className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium">Sebagai Staf</span>
                  </>
                )}
              </Button>
            </div>

            <div className="mt-5 p-3 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Akaun demo:</span> rohana@eduoasis.my (GM) · aisyah@eduoasis.my (Staf) · Kata laluan: <span className="font-mono">demo123</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
