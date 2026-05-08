"use client";

export default function SegmentedControl({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">{label}</p> : null}
      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active ? "bg-[var(--color-accent)] text-white" : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

