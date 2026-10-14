"use client";

import * as React from "react";
import { Armchair } from "lucide-react";
import { useTranslations } from "next-intl";
import { BuiltByImako } from "@/components/brand/built-by-imako";

export function PwaSplash() {
  const t = useTranslations("common");
  const [visible, setVisible] = React.useState(true);
  const [shouldRender, setShouldRender] = React.useState(true);

  React.useEffect(() => {
    // Only show splash screen once per tab session or in PWA standalone mode
    const hasSeenSplash = sessionStorage.getItem("furni_splash_seen");
    if (hasSeenSplash) {
      setShouldRender(false);
      setVisible(false);
      return;
    }

    sessionStorage.setItem("furni_splash_seen", "true");

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 500); // Wait for fade-out transition
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-background px-6 pt-16 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      {/* Top spacer */}
      <div className="w-full h-8" />

      {/* Center Furni Gebeya Branding */}
      <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary to-accent-blue shadow-xl shadow-primary/25 text-white">
          <Armchair className="h-10 w-10 animate-bounce duration-1000 motion-reduce:animate-none" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Furni Gebeya
          </h1>
          <p className="text-xs text-muted-foreground font-medium max-w-xs">
            {t("tagline")}
          </p>
        </div>
      </div>

      {/* Bottom Center Credit: Built by Imako Solution */}
      <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-700 motion-reduce:animate-none">
        <BuiltByImako variant="splash" />
      </div>
    </div>
  );
}
