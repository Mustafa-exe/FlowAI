"use client";

import { useEffect, useState } from "react";

export default function CurrentTimeLine({ startHour, hourHeight }: { startHour: number; hourHeight: number }) {
  const [top, setTop] = useState(0);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const offset = (now.getHours() - startHour + now.getMinutes() / 60) * hourHeight;
      setTop(offset);
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [hourHeight, startHour]);

  if (top < 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
      style={{ top: `${top}px` }}
    >
      <div className="-ml-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
      <div className="h-px flex-1 bg-red-500" />
    </div>
  );
}

