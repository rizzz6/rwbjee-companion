"use client";

import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Menu,
  X,
  Home,
  GraduationCap,
  TrendingUp,
  BarChart3,
  BookOpen,
  Calculator,
  LucideIcon
} from 'lucide-react'
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";

// Centralized navigation links - single source of truth
const NAV_LINKS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/#home', icon: Home, label: 'Home' },
  { href: '/colleges', icon: GraduationCap, label: 'Colleges' },
  { href: '/predictor', icon: TrendingUp, label: 'Predictor' },
  { href: '/marks-calculator', icon: Calculator, label: 'Marks Calc' },
  { href: '/cutoffs', icon: BarChart3, label: 'Cutoffs' },
  { href: '/blog', icon: BookOpen, label: 'Blog' },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';

    // Use View Transitions API if supported (Chrome 111+, Edge 111+, Safari 18+)
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // Calculate exact center of the button for precise circular reveal
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Set CSS custom properties for circle center
      document.documentElement.style.setProperty('--x', `${x}px`);
      document.documentElement.style.setProperty('--y', `${y}px`);

      (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      // Instant fallback for unsupported browsers (Firefox, older browsers)
      setTheme(newTheme);
    }
  };

  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // 1. Exact Size Skeleton (34px height, 84px width)
  if (!mounted) {
    return (
      <div
        className="h-[34px] w-[84px] rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 animate-pulse"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggleTheme}
      // 2. Force the button to match the skeleton exactly
      className="inline-flex h-[34px] w-[84px] items-center justify-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus-ring"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/70 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
              r/wbjee Companion
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-gray-700 dark:text-gray-200">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded focus-ring px-1"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
              <ThemeToggle />
            </nav>

            <button
              aria-label="Toggle navigation"
              className="md:hidden p-2 rounded border border-gray-200 dark:border-gray-700 focus-ring"
              onClick={() => setOpen(v => !v)}
            >
              <LazyMotion features={domAnimation}>
                <m.div
                  animate={{ rotate: open ? 90 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {open ? <X className="w-6 h-6 text-gray-700 dark:text-gray-200" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />}
                </m.div>
              </LazyMotion>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu moved OUTSIDE header to fix nested backdrop-filter bug */}
      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {open && (
            <m.div
              className="md:hidden fixed top-16 left-0 w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-xl px-4 pb-4 z-40"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <nav className="flex flex-col gap-3 text-gray-700 dark:text-gray-200">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                ))}
                <ThemeToggle />
              </nav>
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </>
  );
}

