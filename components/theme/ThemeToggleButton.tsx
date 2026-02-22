"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "two-line-theme";

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "dark" || value === "light" ? value : null;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export default function ThemeToggleButton() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = readStoredTheme() ?? "light";
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
  };

  const nextThemeLabel = theme === "light" ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-[2px] border-2 border-[var(--border-strong)] bg-[var(--panel-solid)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-strong)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      aria-label={`Switch to ${nextThemeLabel} mode`}
    >
      {nextThemeLabel}
    </button>
  );
}
