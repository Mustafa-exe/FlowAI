import { DashboardPage } from "@/components/dashboard-page";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <DashboardPage />
    </Suspense>
  );
}