"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations("theme");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full border border-border/50 text-muted-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="relative h-9 w-9 rounded-full border border-border/60 bg-card hover:bg-secondary transition-all hover:scale-105 active:scale-95"
      title={`${t("toggle")} (${theme === "dark" ? t("dark") : theme === "light" ? t("light") : t("system")})`}
      aria-label={t("toggle")}
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4 text-accent-cyan transition-transform rotate-0" />
      ) : theme === "light" ? (
        <Sun className="h-4 w-4 text-primary transition-transform rotate-0" />
      ) : (
        <Laptop className="h-4 w-4 text-accent-blue transition-transform" />
      )}
      <span className="sr-only">{t("toggle")}</span>
    </Button>
  );
}

export function ThemeSelectorDropdown() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations("theme");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const options = [
    { value: "light", label: t("light"), icon: Sun, color: "text-primary" },
    { value: "dark", label: t("dark"), icon: Moon, color: "text-accent-cyan" },
    { value: "system", label: t("system"), icon: Laptop, color: "text-accent-blue" },
  ];

  return (
    <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-xs">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary-foreground" : opt.color}`} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
