import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f1f2f8] text-slate-900 dark:bg-[#07080d] dark:text-zinc-100">{children}</div>;
}

