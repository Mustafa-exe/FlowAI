import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, Sora } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { PreferencesSyncProvider } from "@/components/preferences-sync-provider";
import { ThemeProvider } from "@/components/theme-provider";

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const displayLightFont = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display-light",
  display: "swap",
});

const displayDarkFont = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display-dark",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowAI",
  description:
    "FlowAI is an AI-powered task automation platform that converts natural language into structured workflows.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayLightFont.variable} ${displayDarkFont.variable} font-body antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            <PreferencesSyncProvider>{children}</PreferencesSyncProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}