"use client";

import { useState } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SegmentedControl from "@/components/ui/SegmentedControl";
import ThemeCard from "@/components/ui/ThemeCard";
import SkeletonRow from "@/components/ui/SkeletonRow";

const themes = [
  { id: "modern-light", name: "Modern Light", swatches: ["#f5f5f0", "#6366f1", "#0f172a"] },
  { id: "elegant-dark", name: "Elegant Dark", swatches: ["#0f0f11", "#f4f4f5", "#7c6ff7"] },
  { id: "aurora-mesh", name: "Aurora Mesh", swatches: ["#1e1b4b", "#22d3ee", "#fb7185"] },
  { id: "editorial-neutral", name: "Editorial Neutral", swatches: ["#d6cfc4", "#f5f0e8", "#1a1a18"] },
  { id: "soft-neon", name: "Soft Neon", swatches: ["#0a0a0f", "#22d3ee", "#7c3aed"] },
] as const;

export default function AppearanceSection({ isLoading, onDirty }: { isLoading: boolean; onDirty: () => void }) {
  const [compact, setCompact] = useState(false);
  const [fontSize, setFontSize] = useState("M");

  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#16161a]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-zinc-500">Appearance</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Theme & density</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Tune your workspace look and spacing.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">Theme</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((t, idx) => (
                <ThemeCard key={t.id} id={t.id} name={t.name} swatches={[...t.swatches]} onDirty={onDirty} defaultChecked={idx === 0} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#16161a]">
            <div>
              <p className="text-sm font-medium">Compact Mode</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Reduce spacing and card padding</p>
            </div>
            <ToggleSwitch
              checked={compact}
              onChange={(next) => {
                setCompact(next);
                onDirty();
              }}
              label="Compact mode"
            />
          </div>

          <SegmentedControl
            label="Font Size"
            value={fontSize}
            onChange={(v) => {
              setFontSize(v);
              onDirty();
            }}
            options={["S", "M", "L"]}
          />
        </div>
      )}
    </div>
  );
}

