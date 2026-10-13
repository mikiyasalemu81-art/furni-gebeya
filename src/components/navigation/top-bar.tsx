"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/components/auth/auth-provider";
import { Armchair, Sparkles, LogIn, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const t = useTranslations("common");
  const { user, openLogin } = useAuth();

  const getRoleBadge = (role?: string | null) => {
    switch (role) {
      case "admin":
        return { label: "Admin", bg: "bg-red-500/15 text-red-500 border-red-500/30" };
      case "supplier":
        return { label: "Supplier", bg: "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30" };
      case "seller":
        return { label: "Seller", bg: "bg-accent-blue/15 text-accent-blue border-accent-blue/30" };
      default:
        return { label: "Buyer", bg: "bg-primary/10 text-primary border-primary/20" };
    }
  };

  const roleInfo = user ? getRoleBadge(user.role) : null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 transition-colors">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform active:scale-98 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-accent-blue shadow-md shadow-primary/20 text-white">
            <Armchair className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-foreground">
              Furni<span className="text-primary">Gebeya</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium line-clamp-1 hidden xs:block">
              {t("tagline")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/wanted" className="hover:text-foreground transition-colors">
            Wanted Board
          </Link>
          <Link href="/chat" className="hover:text-foreground transition-colors">
            Messages
          </Link>
          {user?.role === "seller" || user?.role === "supplier" || user?.role === "admin" ? (
            <Link href="/my-posts" className="hover:text-foreground transition-colors">
              My Posts
            </Link>
          ) : (
            <Link href="/saved" className="hover:text-foreground transition-colors">
              Saved
            </Link>
          )}
        </nav>

        {/* Right Controls: User Profile / Sign In, Language Switcher, Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-border/70 bg-card p-1 sm:pr-3 text-xs font-semibold hover:border-primary/50 transition-all"
            >
              <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate text-foreground font-bold">
                {user.full_name}
              </span>
              {roleInfo && (
                <span
                  className={`hidden md:inline-flex border rounded-full px-2 py-0.2 text-[10px] font-semibold ${roleInfo.bg}`}
                >
                  {roleInfo.label}
                </span>
              )}
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={openLogin}
              className="gap-1.5 rounded-full px-3.5 text-xs font-bold shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Button>
          )}

          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
