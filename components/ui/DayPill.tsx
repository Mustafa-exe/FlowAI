"use client";

export default function DayPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 w-10 rounded-full text-xs font-medium transition ${
        active
          ? "bg-[var(--color-accent)] text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-[#16161a] dark:text-zinc-400 dark:hover:bg-white/5"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

