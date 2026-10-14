"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface BuiltByImakoProps {
  variant?: "splash" | "footer" | "settings" | "badge";
  className?: string;
  showAboutText?: boolean;
}

export function BuiltByImako({
  variant = "splash",
  className = "",
  showAboutText = false,
}: BuiltByImakoProps) {
  const t = useTranslations("common");
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Logo file and size selection based on variant
  const isLarge = variant === "splash";
  const logoSrc = isLarge ? "/brand/imako-logo-128.png" : "/brand/imako-logo-64.png";
  const logoSize = isLarge ? 30 : 24;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <a
        href="https://imakosolutions.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("imakoAria")}
        className="group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-muted-foreground/80 hover:text-foreground transition-all duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="text-[11px] sm:text-xs font-normal tracking-wide">
          {showAboutText ? t("aboutBuiltBy") : t("builtBy")}
        </span>

        <span className="relative flex items-center justify-center shrink-0">
          {/* Shimmer skeleton while logo is loading */}
          {!imageLoaded && (
            <span
              style={{ width: logoSize, height: logoSize }}
              className="absolute inset-0 rounded-full bg-muted-foreground/20 animate-pulse"
              aria-hidden="true"
            />
          )}

          <span
            style={{ width: logoSize, height: logoSize }}
            className="relative overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/20 dark:shadow-[0_0_10px_rgba(255,255,255,0.12)] transition-transform group-hover:scale-105"
          >
            <Image
              src={logoSrc}
              alt={t("imakoAlt")}
              width={logoSize}
              height={logoSize}
              priority={isLarge}
              onLoad={() => setImageLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </span>
        </span>

        {!showAboutText && (
          <span className="text-[11px] sm:text-xs font-semibold text-foreground/90 group-hover:text-primary transition-colors">
            {t("imakoSolution")}
          </span>
        )}
      </a>
    </div>
  );
}
