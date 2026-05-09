"use client";

import { motion } from "framer-motion";

export default function CheckmarkAnimation() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16">
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        stroke="#22c55e"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M20 32 L28 40 L44 24"
        stroke="#22c55e"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

