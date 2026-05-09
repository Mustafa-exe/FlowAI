"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";
export type ThemeVariant = "modern-light" | "elegant-dark" | "aurora-mesh" | "editorial-neutral" | "soft-neon";
export type FontSizePreset = "S" | "M" | "L";

const variantMap: Record<ThemeVariant, { mode: ThemeMode; accent: string; tint: string }> = {
  "modern-light": { mode: "light", accent: "#2563eb", tint: "rgba(37,99,235,0.08)" },
  "elegant-dark": { mode: "dark", accent: "#7c6ff7", tint: "rgba(124,111,247,0.14)" },
  "aurora-mesh": { mode: "dark", accent: "#22d3ee", tint: "rgba(34,211,238,0.14)" },
  "editorial-neutral": { mode: "light", accent: "#8b5e3c", tint: "rgba(139,94,60,0.12)" },
  "soft-neon": { mode: "dark", accent: "#7c3aed", tint: "rgba(124,58,237,0.15)" },
};

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  themeVariant: ThemeVariant;
  setThemeVariant: (variant: ThemeVariant) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  fontSizePreset: FontSizePreset;
  setFontSizePreset: (preset: FontSizePreset) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>("modern-light");
  const [compactMode, setCompactMode] = useState(false);
  const [fontSizePreset, setFontSizePreset] = useState<FontSizePreset>("M");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("flowai-theme");
    const storedVariant = window.localStorage.getItem("flowai-theme-variant");
    const storedCompact = window.localStorage.getItem("flowai-compact-mode");
    const storedFontSize = window.localStorage.getItem("flowai-font-size");

    const initialVariant: ThemeVariant =
      storedVariant === "modern-light" ||
      storedVariant === "elegant-dark" ||
      storedVariant === "aurora-mesh" ||
      storedVariant === "editorial-neutral" ||
      storedVariant === "soft-neon"
        ? storedVariant
        : "modern-light";

    const initialCompact = storedCompact === "true";
    const initialFontSize: FontSizePreset =
      storedFontSize === "S" || storedFontSize === "M" || storedFontSize === "L" ? storedFontSize : "M";

    const initialTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : variantMap[initialVariant].mode;

    setTheme(initialTheme);
    setThemeVariant(initialVariant);
    setCompactMode(initialCompact);
    setFontSizePreset(initialFontSize);
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.dataset.themeVariant = initialVariant;
    document.documentElement.dataset.compact = initialCompact ? "true" : "false";
    document.documentElement.style.colorScheme = initialTheme;
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.style.setProperty("--color-accent", variantMap[initialVariant].accent);
    document.documentElement.style.setProperty("--accent", variantMap[initialVariant].accent);
    document.documentElement.style.setProperty("--accent-tint", variantMap[initialVariant].tint);
    document.documentElement.style.fontSize = initialFontSize === "S" ? "14px" : initialFontSize === "L" ? "17px" : "16px";
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themeVariant = themeVariant;
    document.documentElement.dataset.compact = compactMode ? "true" : "false";
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.setProperty("--color-accent", variantMap[themeVariant].accent);
    document.documentElement.style.setProperty("--accent", variantMap[themeVariant].accent);
    document.documentElement.style.setProperty("--accent-tint", variantMap[themeVariant].tint);
    document.documentElement.style.fontSize = fontSizePreset === "S" ? "14px" : fontSizePreset === "L" ? "17px" : "16px";
    window.localStorage.setItem("flowai-theme", theme);
    window.localStorage.setItem("flowai-theme-variant", themeVariant);
    window.localStorage.setItem("flowai-compact-mode", compactMode ? "true" : "false");
    window.localStorage.setItem("flowai-font-size", fontSizePreset);
  }, [mounted, theme, themeVariant, compactMode, fontSizePreset]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const applyThemeVariant = (variant: ThemeVariant) => {
    setThemeVariant(variant);
    setTheme(variantMap[variant].mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        themeVariant,
        setThemeVariant: applyThemeVariant,
        compactMode,
        setCompactMode,
        fontSizePreset,
        setFontSizePreset,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }

  return context;
}