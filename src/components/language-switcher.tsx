"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const languageList = [
  { code: "en", label: "English", short: "EN", native: "English" },
  { code: "am", label: "Amharic", short: "አማ", native: "አማርኛ" },
  { code: "om", label: "Oromo", short: "OM", native: "Afaan Oromoo" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const t = useTranslations("common");

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (locale: "en" | "am" | "om") => {
    setIsOpen(false);
    router.replace(pathname, { locale });
  };

  const activeLang =
    languageList.find((l) => l.code === currentLocale) || languageList[0];

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:bg-secondary hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={t("language")}
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 text-accent-blue" />
        <span>{activeLang.short}</span>
        <span className="hidden sm:inline text-muted-foreground font-normal text-[11px]">
          ({activeLang.native})
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-border bg-card p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("language")}
          </div>
          {languageList.map((lang) => {
            const isSelected = currentLocale === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code as any)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors text-left",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <div className="flex flex-col">
                  <span>{lang.native}</span>
                  <span
                    className={cn(
                      "text-[10px]",
                      isSelected
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {lang.label}
                  </span>
                </div>
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
