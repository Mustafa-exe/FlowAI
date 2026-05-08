"use client";

const suggestions = [
  "Add task: ...",
  "What's due today?",
  "Show pending tasks",
  "Mark task complete",
  "Schedule focus block",
  "Summarize my week",
];

export default function SuggestionPills({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
      {suggestions.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className="h-8 flex-shrink-0 whitespace-nowrap rounded-full border border-slate-200 px-3 text-xs text-slate-500 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] dark:border-white/10 dark:text-zinc-400"
        >
          {value}
        </button>
      ))}
    </div>
  );
}

