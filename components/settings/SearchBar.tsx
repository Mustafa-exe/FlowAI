"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SearchBar({ onDebouncedChange }: { onDebouncedChange: (value: string) => void }) {
  const [value, setValue] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onDebouncedChange(value), 300);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [onDebouncedChange, value]);

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#16161a] dark:text-zinc-100">
      <Search className="size-4 text-slate-400 dark:text-zinc-500" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search settings..."
        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        aria-label="Search settings"
      />
    </div>
  );
}

