"use client";

export default function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center py-3">
      <div className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
        {content}
      </div>
    </div>
  );
}

