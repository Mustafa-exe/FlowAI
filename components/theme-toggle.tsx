"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useThemeMode } from "./theme-provider";

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeMode();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
        isLight
          ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          : "border-white/10 bg-white/5 text-zinc-100 hover:border-white/15 hover:bg-white/10"
      }`}
    >
      {isLight ? <MoonStar className="size-4" /> : <SunMedium className="size-4" />}
      <span className={compact ? "sr-only" : "hidden sm:inline"}>{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}