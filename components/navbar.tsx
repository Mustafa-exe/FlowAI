"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { useThemeMode } from "./theme-provider";

const navigation = [
  { label: "Features", href: "#features", id: "features" },
  { label: "Demo", href: "#demo", id: "demo" },
  { label: "Pricing", href: "#pricing", id: "pricing" },
  { label: "Contact", href: "#contact", id: "contact" },
];

export function Navbar() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("features");

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  useEffect(() => {
    const targets = navigation
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-35% 0px -50% 0px",
        threshold: [0.2, 0.35, 0.5, 0.65],
      },
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  const headerClassName = isDark
    ? scrolled
      ? "border-b border-white/8 bg-[#0d0d0f]/80 backdrop-blur-xl"
      : "bg-transparent"
    : "border-b border-slate-200 bg-white/92 backdrop-blur-xl";

  const textClassName = isDark ? "text-zinc-100" : "text-slate-900";
  const mutedTextClassName = isDark ? "text-zinc-300/80" : "text-slate-600";
  const navLinkClassName = isDark
    ? "text-zinc-300/80 hover:text-zinc-100"
    : "text-slate-600 hover:text-slate-900";
  const buttonClassName = isDark
    ? "bg-[#7c6ff7] text-white shadow-[0_18px_40px_-24px_rgba(124,111,247,0.7)] hover:bg-[#8f84ff]"
    : "bg-[#2563eb] text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.45)] hover:bg-[#1d4ed8]";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${headerClassName}`}>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className={`inline-flex size-10 items-center justify-center rounded-full border transition ${
              isDark ? "border-white/10 bg-white/5 text-zinc-100" : "border-slate-200 bg-white text-slate-900"
            }`}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link
            href="#hero"
            className={`justify-self-center text-lg font-semibold tracking-[-0.04em] ${textClassName}`}
          >
            FlowAI
          </Link>

          <div className="justify-self-end">
            <ThemeToggle compact />
          </div>
        </div>

        <div className="hidden h-20 items-center justify-between gap-8 lg:flex">
          <Link href="#hero" className={`text-lg font-semibold tracking-[-0.04em] ${textClassName}`}>
            FlowAI
          </Link>

          <nav className="flex items-center gap-10">
            {navigation.map((item) => {
              const active = activeSection === item.id;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  data-active={active}
                  className={`relative pb-3 text-sm font-medium transition after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform data-[active=true]:text-current data-[active=true]:after:scale-x-100 ${navLinkClassName}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className={`inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                isDark
                  ? "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${buttonClassName}`}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`lg:hidden ${isDark ? "border-t border-white/8 bg-[#0f0f12]/96" : "border-t border-slate-200 bg-white/96"}`}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 sm:px-8">
              {navigation.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    activeSection === item.id
                      ? isDark
                        ? "bg-white/8 text-zinc-100"
                        : "bg-slate-100 text-slate-900"
                      : mutedTextClassName
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`mt-2 inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  isDark ? "border-white/10 bg-white/5 text-zinc-100" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${buttonClassName}`}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}