import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EDUOASIS TASK360 — Sistem Pemantauan Prestasi Staf & Tugasan",
  description:
    "Sistem dalaman Al Amin Edu Oasis untuk pemantauan prestasi staf dan tugasan merentasi enam dimensi penilaian.",
  keywords: ["EDUOASIS", "TASK360", "prestasi staf", "pengurusan tugasan", "Al Amin Edu Oasis"],
  authors: [{ name: "Al Amin Edu Oasis" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${mono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
