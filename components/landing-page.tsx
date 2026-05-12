"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  Globe,
  LayoutGrid,
  ListChecks,
  MessageSquareText,
  Share2,
  Sparkles,
  TrendingUp,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { AnimatedNumber } from "./animated-number";
import { Navbar } from "./navbar";
import { ThemeMode, useThemeMode } from "./theme-provider";

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type TaskCard = {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  offsetClassName: string;
  iconClassName: string;
  iconBgClassName: string;
};

type WorkflowStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type FooterLink = {
  label: string;
  href: string;
};

type SectionCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

const features: FeatureCard[] = [
  {
    icon: Brain,
    title: "AI Task Parsing",
    description: "Understands intent, extracts tasks, dates, owners, and context from natural language.",
  },
  {
    icon: BarChart3,
    title: "Smart Prioritization",
    description: "Ranks work by urgency, deadline pressure, and your productivity patterns.",
  },
  {
    icon: Sparkles,
    title: "Workflow Automations",
    description: "Connects 100+ tools and triggers actions across the systems your team already uses.",
  },
  {
    icon: TrendingUp,
    title: "Productivity Analytics",
    description: "Shows where time is going and where friction is slowing execution down.",
  },
];

const lightTaskCards: TaskCard[] = [
  {
    icon: CheckCircle2,
    label: "Task Created",
    title: "Marketing Sync",
    description: "Review Q3 assets",
    offsetClassName: "md:mt-0",
    iconClassName: "text-[#2563eb]",
    iconBgClassName: "bg-blue-50 text-[#2563eb]",
  },
  {
    icon: CalendarClock,
    label: "Deadline Assigned",
    title: "Mon, 10:00 AM",
    description: "Auto-scheduled",
    offsetClassName: "md:mt-4",
    iconClassName: "text-[#0ea5e9]",
    iconBgClassName: "bg-sky-50 text-[#0ea5e9]",
  },
  {
    icon: AlertCircle,
    label: "Priority Detected",
    title: "High Priority",
    description: "Based on context",
    offsetClassName: "md:mt-2",
    iconClassName: "text-amber-600",
    iconBgClassName: "bg-amber-50 text-amber-600",
  },
];

const lightWorkflowSteps: WorkflowStep[] = [
  {
    icon: MessageSquareText,
    title: "Natural Language",
    description: "You speak or type",
  },
  {
    icon: Sparkles,
    title: "AI Understanding",
    description: "Parsing intent",
  },
  {
    icon: ListChecks,
    title: "Task Structuring",
    description: "Assigning details",
  },
  {
    icon: LayoutGrid,
    title: "Live Dashboard",
    description: "Ready to execute",
  },
];

const darkWorkflowSteps: WorkflowStep[] = [
  {
    icon: MessageSquareText,
    title: "Natural Language",
    description: "You speak or type",
  },
  {
    icon: Sparkles,
    title: "AI Understanding",
    description: "Parsing intent",
  },
  {
    icon: ListChecks,
    title: "Task Structuring",
    description: "Assigning details",
  },
  {
    icon: LayoutGrid,
    title: "Automated Dashboard",
    description: "Visual execution",
  },
];

const stats = [
  {
    end: 2_400_000,
    label: "TASKS AUTOMATED",
    formatter: formatMillions,
  },
  {
    end: 180_000,
    label: "HOURS SAVED",
    formatter: formatThousands,
  },
  {
    end: 3.2,
    label: "PRODUCTIVITY INCREASE",
    formatter: (value: number) => `${value.toFixed(1)}×`,
  },
];

const lightCopy = {
  features: {
    eyebrow: "WHAT IT DOES",
    title: "Intelligent Workflow Engine",
    subtitle: "FlowAI converts casual requests into structured work, so your day becomes a clean sequence of next actions.",
  },
  workflow: {
    eyebrow: "HOW IT FLOWS",
    title: "The Journey of a Task",
    subtitle: "Watch how FlowAI handles the complexity so you don't have to.",
  },
  ctaEyebrow: "READY TO MOVE FASTER",
  ctaTitle: "Let AI Organize Your Day",
  ctaSubtitle: "Join thousands of high-performers who have reclaimed their time with FlowAI.",
  footerTagline: "Natural language into structured workflows.",
} as const;

const darkCopy = {
  features: {
    eyebrow: "WHAT IT DOES",
    title: "Precision Engineering for Your Daily Tasks",
    subtitle: "FlowAI translates conversation into structure, priority, and execution with minimal friction.",
  },
  workflow: {
    eyebrow: "HOW IT FLOWS",
    title: "The Journey of a Task",
    subtitle: "From thought to execution in milliseconds.",
  },
  ctaEyebrow: "READY TO MOVE FASTER",
  ctaTitle: "Let AI Organize Your Day",
  ctaSubtitle: "Join 50,000+ professionals who have reclaimed their focus. Experience the future of work today.",
  footerTagline: "Kinetic Precision Engineering.",
} as const;

const heroContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const gridRevealVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LandingPage() {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const copy = isDark ? darkCopy : lightCopy;

  return (
    <main className={isDark ? "bg-[#0d0d0f] text-zinc-100" : "bg-[#f0f4f8] text-slate-900"}>
      <Navbar />
      {isDark ? <DarkHero /> : <LightHero />}
      <StatsBar theme={theme} />
      <FeaturesSection theme={theme} copy={copy.features} />
      <WorkflowSection theme={theme} copy={copy.workflow} />
      <CtaSection theme={theme} copy={copy} />
      <SiteFooter theme={theme} copy={copy} />
    </main>
  );
}

function LightHero() {
  const router = useRouter();
  const [command, setCommand] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = command.trim();
    if (!text) return;
    router.push(`/dashboard/chat?prompt=${encodeURIComponent(text)}`);
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at top, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0.97) 45%, rgba(248, 250, 252, 1) 100%)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-slate-200/70" />
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div variants={heroContainerVariants} initial="hidden" animate="show" className="max-w-3xl lg:pt-4">
            <motion.p
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#2563eb] shadow-[0_12px_34px_-24px_rgba(37,99,235,0.25)]"
            >
              <Sparkles className="size-3 sm:size-4" />
              AI-Powered Productivity
            </motion.p>

            <motion.h1
              variants={fadeUpVariants}
              className="mt-6 sm:mt-8 max-w-4xl font-display-light text-[clamp(2.2rem,5vw,7rem)] font-semibold leading-[0.88] tracking-[-0.06em] text-slate-900 text-balance"
            >
              Automate Your Workflow with <span className="text-[#2563eb]">AI</span>
            </motion.h1>

            <motion.p variants={fadeUpVariants} className="mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-slate-600 text-balance">
              Transform natural language into structured tasks, smart scheduling, and streamlined productivity. The future of work is conversational.
            </motion.p>

            <motion.form variants={fadeUpVariants} onSubmit={onSubmit} className="mt-10 flex max-w-2xl flex-col gap-2 sm:flex-row sm:gap-3">
              <label className="sr-only" htmlFor="light-command">
                Describe a workflow
              </label>
              <input
                id="light-command"
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Schedule a meeting or create a task..."
                className="h-12 sm:h-14 flex-1 rounded-full border border-slate-200 bg-white/95 px-4 sm:px-6 text-sm sm:text-base text-slate-900 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.2)] outline-none transition placeholder:text-slate-400 focus:border-[#2563eb]"
              />
              <button
                type="submit"
                className="inline-flex h-12 sm:h-14 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-4 sm:px-7 text-sm sm:text-base font-semibold text-white transition hover:bg-[#1d4ed8] whitespace-nowrap"
              >
                <span className="hidden sm:inline">Generate</span>
                <span className="inline sm:hidden">Go</span>
                <ArrowRight className="size-4" />
              </button>
            </motion.form>

            <motion.div variants={fadeUpVariants} className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Get Started
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-[#2563eb]/30 hover:text-[#2563eb]"
              >
                Watch Demo
              </Link>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUpVariants} initial="hidden" animate="show" className="relative hidden w-full max-w-md lg:block lg:ml-auto lg:max-w-xl">
            <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.25)]">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.34em] text-[#2563eb]">
                  <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                  Live Task Parsing
                </span>
                <Sparkles className="size-4 text-[#2563eb]" />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 text-[#2563eb]" />
                    <div>
                      <p className="text-base font-semibold text-slate-900">Marketing Sync</p>
                      <p className="mt-1 text-sm text-slate-500">Review Q3 assets and finalize handoff</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                    <ArrowUpRight className="size-3.5" />
                    High Priority
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3 text-sm text-slate-500">
                  <CalendarClock className="size-4 text-[#0ea5e9]" />
                  <span>Tomorrow, 6:00 PM</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="h-3 rounded-full bg-slate-100 p-1">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, delay: 0.2 }}
                    className="h-full origin-left rounded-full bg-[#0ea5e9]"
                    style={{ width: "82%" }}
                  />
                </div>
                <div className="h-3 rounded-full bg-slate-100 p-1">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, delay: 0.3 }}
                    className="h-full origin-left rounded-full bg-[#2563eb]"
                    style={{ width: "64%" }}
                  />
                </div>
                <div className="h-3 rounded-full bg-slate-100 p-1">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, delay: 0.4 }}
                    className="h-full origin-left rounded-full bg-amber-300"
                    style={{ width: "48%" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DarkHero() {
  const router = useRouter();
  const [command, setCommand] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = command.trim();
    if (!text) return;
    router.push(`/dashboard/chat?prompt=${encodeURIComponent(text)}`);
  };

  return (
    <section id="hero" className="relative overflow-hidden bg-[#0d0d0f] px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-8 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div variants={heroContainerVariants} initial="hidden" animate="show" className="max-w-3xl">
          <motion.p
            variants={fadeUpVariants}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#7c6ff7]"
          >
            <Sparkles className="size-4" />
            Workflow Intelligence
          </motion.p>

          <motion.h1
            variants={fadeUpVariants}
            className="mt-8 font-display-dark text-[clamp(3.6rem,8.5vw,7.4rem)] font-semibold leading-[0.88] tracking-[-0.07em] text-zinc-100 text-balance"
          >
            Let <span className="text-[#7c6ff7]">AI</span> Organize
            <span className="block">Your Day</span>
          </motion.h1>

          <motion.p variants={fadeUpVariants} className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400 text-balance">
            FlowAI turns conversations into structured workflows, live deadlines, and immediate execution without the manual drag.
          </motion.p>

          <motion.form variants={fadeUpVariants} onSubmit={onSubmit} className="mt-10 flex max-w-2xl flex-col gap-2 sm:flex-row sm:gap-3">
            <label className="sr-only" htmlFor="dark-command">
              Describe a workflow
            </label>
            <input
              id="dark-command"
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Schedule a meeting or create a task..."
              className="h-12 sm:h-14 flex-1 rounded-full border border-white/10 bg-white/5 px-4 sm:px-6 text-sm sm:text-base text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-[#7c6ff7] focus:bg-white/8"
            />
            <button
              type="submit"
              className="inline-flex h-12 sm:h-14 items-center justify-center gap-2 rounded-full bg-[#7c6ff7] px-4 sm:px-7 text-sm sm:text-base font-semibold text-white transition hover:bg-[#8f84ff] whitespace-nowrap"
            >
              <span className="hidden sm:inline">Generate</span>
              <span className="inline sm:hidden">Go</span>
              <ArrowRight className="size-4" />
            </button>
          </motion.form>

          <motion.div variants={fadeUpVariants} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-[#7c6ff7] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#8f84ff]"
            >
              Get Started
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-100 transition hover:border-white/15 hover:bg-white/10"
            >
              Watch Demo
            </Link>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUpVariants} initial="hidden" animate="show" className="relative hidden w-full max-w-md lg:block lg:ml-auto lg:max-w-xl">
          <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 bg-[#16161a] p-4 sm:p-5 shadow-[0_30px_100px_-45px_rgba(0,0,0,0.95)]">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.34em] text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live Task Parsing
              </span>
              <Sparkles className="size-4 text-[#7c6ff7]" />
            </div>

            <div className="mt-6 rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 text-[#22d3ee]" />
                  <div>
                    <p className="text-base font-semibold text-white">Portfolio Redesign</p>
                    <p className="mt-1 text-sm text-zinc-400">Design review for the homepage launch</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full border border-[#7c6ff7]/30 bg-[#7c6ff7]/15 px-3 py-1 text-xs font-semibold text-[#c7bfff]">
                  <ArrowUpRight className="size-3.5" />
                  High Priority
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3 text-sm text-zinc-400">
                <CalendarClock className="size-4 text-[#22d3ee]" />
                <span>Tomorrow, 6:00 PM</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="h-3 rounded-full bg-white/6 p-1">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.2 }}
                  className="h-full origin-left rounded-full bg-[#22d3ee]"
                  style={{ width: "82%" }}
                />
              </div>
              <div className="h-3 rounded-full bg-white/6 p-1">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.3 }}
                  className="h-full origin-left rounded-full bg-[#7c6ff7]"
                  style={{ width: "64%" }}
                />
              </div>
              <div className="h-3 rounded-full bg-white/6 p-1">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.4 }}
                  className="h-full origin-left rounded-full bg-amber-300"
                  style={{ width: "48%" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsBar({ theme }: { theme: ThemeMode }) {
  const isDark = theme === "dark";
  const textAccentClassName = isDark ? "text-[#7c6ff7]" : "text-[#2563eb]";
  const cardClassName = isDark ? "border-white/8 bg-[#111114]" : "border-slate-200/60 bg-white";
  const dividerClassName = isDark ? "sm:border-white/8" : "sm:border-slate-200/60";
  const labelClassName = isDark ? "text-zinc-500" : "text-slate-500";

  return (
    <section id="stats" className={`-mt-px border-y ${isDark ? "border-white/8" : "border-slate-200/60"} ${cardClassName}`}>
      <div className="mx-auto grid max-w-7xl gap-0 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
            className={`flex flex-col items-center justify-center gap-3 py-8 text-center ${index < stats.length - 1 ? `sm:border-r ${dividerClassName}` : ""}`}
          >
            <div className={`text-4xl font-semibold tracking-[-0.04em] sm:text-5xl ${textAccentClassName}`}>
              <AnimatedNumber end={stat.end} formatter={stat.formatter} />
            </div>
            <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${labelClassName}`}>{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection({ theme, copy }: { theme: ThemeMode; copy: SectionCopy }) {
  const isDark = theme === "dark";
  const alignClassName = isDark ? "text-left" : "text-center";
  const eyebrowClassName = isDark ? "text-[#7c6ff7]" : "text-[#2563eb]";
  const titleClassName = isDark ? "font-display-dark text-zinc-100" : "font-display-light text-slate-900";
  const subtitleClassName = isDark ? "text-zinc-400" : "text-slate-600";
  const cardClassName = isDark
    ? "border-white/10 bg-[#16161a]"
    : "border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.22)]";
  const iconShellClassName = isDark ? "bg-white/5 text-[#7c6ff7]" : "bg-blue-50 text-[#2563eb]";
  const hoverShadow = isDark ? "0 28px 80px -36px rgba(0,0,0,0.9)" : "0 28px 80px -36px rgba(15,23,42,0.28)";
  const hoverBorderClassName = isDark ? "hover:border-[#7c6ff7]/25" : "hover:border-[#2563eb]/20";

  return (
    <section id="features" className="px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading theme={theme} copy={copy} align={alignClassName} eyebrowClassName={eyebrowClassName} titleClassName={titleClassName} subtitleClassName={subtitleClassName} />

        <motion.div
          variants={gridRevealVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                variants={itemRevealVariants}
                whileHover={{ scale: 1.02, y: -4, boxShadow: hoverShadow }}
                transition={{ duration: 0.2 }}
                className={`rounded-[1.5rem] border p-6 transition-colors ${cardClassName} ${hoverBorderClassName}`}
              >
                <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${iconShellClassName}`}>
                  <Icon className="size-5" />
                </div>

                <h3 className={`mt-6 text-xl font-semibold tracking-[-0.04em] ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
                  {feature.title}
                </h3>
                <p className={`mt-3 text-sm leading-6 ${subtitleClassName}`}>{feature.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function WorkflowSection({ theme, copy }: { theme: ThemeMode; copy: SectionCopy }) {
  const isDark = theme === "dark";
  const steps = isDark ? darkWorkflowSteps : lightWorkflowSteps;
  const eyebrowClassName = isDark ? "text-[#7c6ff7]" : "text-[#2563eb]";
  const titleClassName = isDark ? "font-display-dark text-zinc-100" : "font-display-light text-slate-900";
  const subtitleClassName = isDark ? "text-zinc-400" : "text-slate-600";
  const cardClassName = isDark
    ? "border-white/10 bg-[#16161a]"
    : "border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.22)]";
  const iconShellClassName = isDark ? "bg-white/5 text-[#7c6ff7]" : "bg-blue-50 text-[#2563eb]";
  const stepNumberClassName = isDark ? "text-zinc-500" : "text-slate-500";
  const stepTextClassName = isDark ? "text-zinc-400" : "text-slate-600";
  const stepTitleClassName = isDark ? "text-zinc-100" : "text-slate-900";
  const connectorClassName = isDark ? "border-white/15" : "border-slate-300";
  const hoverShadow = isDark ? "0 28px 80px -36px rgba(0,0,0,0.9)" : "0 28px 80px -36px rgba(15,23,42,0.28)";

  return (
    <section id="demo" className="px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading theme={theme} copy={copy} align={isDark ? "text-left" : "text-center"} eyebrowClassName={eyebrowClassName} titleClassName={titleClassName} subtitleClassName={subtitleClassName} />

        <motion.div
          variants={gridRevealVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.22 }}
          className="mt-14 grid gap-6 xl:grid-cols-4"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            const last = index === steps.length - 1;

            return (
              <motion.article
                key={step.title}
                variants={itemRevealVariants}
                whileHover={{ scale: 1.02, y: -4, boxShadow: hoverShadow }}
                transition={{ duration: 0.2 }}
                className={`relative rounded-[1.5rem] border p-6 ${cardClassName}`}
              >
                <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${last && isDark ? "bg-[#7c6ff7] text-white" : iconShellClassName}`}>
                  <Icon className="size-5" />
                </div>

                <p className={`mt-6 text-xs font-semibold uppercase tracking-[0.34em] ${stepNumberClassName}`}>0{index + 1}</p>
                <h3 className={`mt-3 text-xl font-semibold tracking-[-0.04em] ${stepTitleClassName}`}>{step.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${stepTextClassName}`}>{step.description}</p>

                {!last ? (
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7, delay: 0.2 + index * 0.12 }}
                    className={`absolute right-[-1.75rem] top-1/2 hidden h-px w-14 origin-left border-t border-dashed xl:block ${connectorClassName}`}
                  />
                ) : null}
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function CtaSection({ theme, copy }: { theme: ThemeMode; copy: typeof lightCopy | typeof darkCopy }) {
  const isDark = theme === "dark";

  if (isDark) {
    return (
      <section id="pricing" className="px-6 py-28 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#7c6ff7]">{copy.ctaEyebrow}</p>
          <h2 className="mt-6 font-display-dark text-[clamp(2.8rem,6vw,5.3rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-zinc-100 text-balance">
            {copy.ctaTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400 text-balance">{copy.ctaSubtitle}</p>
          <Link
            href="/onboarding"
            className="mt-10 inline-flex items-center justify-center rounded-full border border-[#7c6ff7] bg-[#7c6ff7] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#8f84ff]"
          >
            Start Automating
          </Link>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="pricing" className="px-6 py-24 sm:px-8 lg:px-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl rounded-[2rem] bg-[#2563eb] px-6 py-16 text-center text-white shadow-[0_30px_90px_-35px_rgba(37,99,235,0.48)] sm:px-12 lg:px-16"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/80">{copy.ctaEyebrow}</p>
        <h2 className="mt-6 font-display-light text-[clamp(2.8rem,6vw,5.2rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-white text-balance">
          {copy.ctaTitle}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/85 text-balance">{copy.ctaSubtitle}</p>
        <Link
          href="/onboarding"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#2563eb] transition hover:bg-slate-100"
        >
          Start Automating
        </Link>
      </motion.div>
    </section>
  );
}

function SiteFooter({ theme, copy }: { theme: ThemeMode; copy: typeof lightCopy | typeof darkCopy }) {
  const isDark = theme === "dark";
  const productLinks: FooterLink[] = isDark
    ? [
        { label: "Features", href: "#features" },
        { label: "Integrations", href: "#demo" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "#contact" },
      ]
    : [
        { label: "Features", href: "#features" },
        { label: "Integrations", href: "#demo" },
        { label: "Pricing", href: "#pricing" },
      ];
  const companyLinks: FooterLink[] = isDark
    ? [
        { label: "About Us", href: "#hero" },
        { label: "Careers", href: "#contact" },
        { label: "Blog", href: "#features" },
        { label: "Contact", href: "#contact" },
      ]
    : [
        { label: "About Us", href: "#hero" },
        { label: "Careers", href: "#contact" },
        { label: "Blog", href: "#features" },
      ];
  const legalLinks: FooterLink[] = isDark
    ? [
        { label: "Privacy Policy", href: "#contact" },
        { label: "Terms of Service", href: "#contact" },
        { label: "Security", href: "#contact" },
      ]
    : [
        { label: "Privacy Policy", href: "#contact" },
        { label: "Terms of Service", href: "#contact" },
      ];
  const footerBorderClassName = isDark ? "border-white/8" : "border-slate-200";
  const mutedTextClassName = isDark ? "text-zinc-400" : "text-slate-600";
  const titleClassName = isDark ? "text-zinc-100" : "text-slate-900";
  const iconButtonClassName = isDark
    ? "border-white/10 bg-white/5 text-zinc-100 hover:border-white/15 hover:bg-white/10"
    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900";
  const linkClassName = isDark ? "text-zinc-400 hover:text-zinc-100" : "text-slate-600 hover:text-slate-900";

  return (
    <footer id="contact" className="px-6 pb-14 pt-20 sm:px-8 lg:px-10">
      <div className={`mx-auto max-w-7xl border-t pt-12 ${footerBorderClassName}`}>
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:max-w-xs">
            <Link href="#hero" className={`inline-flex items-baseline gap-2 text-xl font-semibold tracking-[-0.05em] ${titleClassName}`}>
              FlowAI
            </Link>
            <p className={`mt-4 text-sm leading-6 ${mutedTextClassName}`}>{copy.footerTagline}</p>

            <div className="mt-6 flex items-center gap-3">
              <div className={`inline-flex size-10 items-center justify-center rounded-full border ${iconButtonClassName}`} aria-hidden="true">
                <Globe className="size-4" />
              </div>
              <div className={`inline-flex size-10 items-center justify-center rounded-full border ${iconButtonClassName}`} aria-hidden="true">
                <Youtube className="size-4" />
              </div>
              <div className={`inline-flex size-10 items-center justify-center rounded-full border ${iconButtonClassName}`} aria-hidden="true">
                <Sparkles className="size-4" />
              </div>
            </div>

            {isDark ? <p className="mt-6 text-xs uppercase tracking-[0.34em] text-[#7c6ff7]">{copy.footerTagline}</p> : null}
          </div>

          <FooterColumn title="PRODUCT" links={productLinks} isDark={isDark} />
          <FooterColumn title="COMPANY" links={companyLinks} isDark={isDark} />
          <FooterColumn title="LEGAL" links={legalLinks} isDark={isDark} />
        </div>

        <div className={`mt-12 flex flex-col gap-4 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between ${footerBorderClassName}`}>
          <p className={mutedTextClassName}>© 2024 FlowAI Inc. All rights reserved.</p>

          {isDark ? (
            <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">{copy.footerTagline}</p>
          ) : (
            <div className="flex items-center gap-3 text-slate-500">
              <Share2 className="size-4" />
              <Globe className="size-4" />
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links, isDark }: { title: string; links: FooterLink[]; isDark: boolean }) {
  const linkClassName = isDark ? "text-zinc-400 hover:text-zinc-100" : "text-slate-600 hover:text-slate-900";

  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>{title}</p>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={`transition ${linkClassName}`}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeading({
  copy,
  align,
  eyebrowClassName,
  titleClassName,
  subtitleClassName,
}: {
  theme: ThemeMode;
  copy: SectionCopy;
  align: string;
  eyebrowClassName: string;
  titleClassName: string;
  subtitleClassName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55 }}
      className={`max-w-3xl ${align === "text-center" ? "mx-auto text-center" : "text-left"}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${eyebrowClassName}`}>{copy.eyebrow}</p>
      <h2 className={`mt-4 text-[clamp(2.3rem,5vw,4.25rem)] leading-[0.94] tracking-[-0.05em] text-balance ${titleClassName}`}>{copy.title}</h2>
      <p className={`mt-5 text-base leading-7 sm:text-lg ${subtitleClassName}`}>{copy.subtitle}</p>
    </motion.div>
  );
}

function formatMillions(value: number) {
  if (value < 1_000_000) {
    return formatThousands(value);
  }

  const scaled = value / 1_000_000;
  const label = scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1);
  return `${label}M+`;
}

function formatThousands(value: number) {
  if (value < 1_000) {
    return `${Math.round(value)}`;
  }

  const scaled = value / 1_000;
  const label = scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1);
  return `${label}K+`;
}