"use client";

export default function GoalChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="goal-chip inline-flex cursor-pointer items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm transition-all duration-150 dark:border-white/15 dark:bg-[#111114]">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

