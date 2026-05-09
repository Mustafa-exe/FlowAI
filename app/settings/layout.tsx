"use client";

import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#111114] dark:text-zinc-100">
      <DashboardSidebar />
      {/* Padding handled inline since sidebar width is dynamic */}
      <div className="md:pl-[72px] lg:pl-60 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
