"use client";

import * as React from "react";
import Link from "next/link";
import { Armchair } from "lucide-react";
import { useTranslations } from "next-intl";
import { BuiltByImako } from "@/components/brand/built-by-imako";

export function Footer() {
  const t = useTranslations("common");
  const navT = useTranslations("nav");

  return (
    <footer className="hidden md:block w-full border-t border-border/80 bg-card/30 backdrop-blur-xs mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border/50">
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-blue text-white shadow-xs">
              <Armchair className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-sm text-foreground tracking-tight">
                Furni Gebeya
              </span>
              <p className="text-xs text-muted-foreground">
                {t("tagline")}
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              {navT("home")}
            </Link>
            <Link href="/wanted" className="hover:text-primary transition-colors">
              Wanted Board
            </Link>
            <Link href="/my-posts" className="hover:text-primary transition-colors">
              {navT("myPosts")}
            </Link>
            <Link href="/profile" className="hover:text-primary transition-colors">
              {navT("profile")}
            </Link>
          </nav>

          {/* Built by Imako Credit */}
          <BuiltByImako variant="footer" />
        </div>

        {/* Bottom copyright row */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/70">
          <span>
            © {new Date().getFullYear()} Furni Gebeya. All rights reserved.
          </span>
          <span className="text-[11px]">
            Ethiopia's Artisan & Furniture Marketplace
          </span>
        </div>
      </div>
    </footer>
  );
}
