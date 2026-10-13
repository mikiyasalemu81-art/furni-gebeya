"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Home, Compass, MessageSquare, Layers, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user } = useAuth();

  // If user is a Buyer (or guest), middle tab shows "Saved"
  // If user is a Seller, Supplier, or Admin, middle tab shows "My Posts"
  const isSellerOrSupplier =
    user?.role === "seller" || user?.role === "supplier" || user?.role === "admin";

  const navItems = [
    {
      label: t("home"),
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Wanted",
      href: "/wanted",
      icon: Compass,
      isActive: pathname.startsWith("/wanted"),
    },
    {
      label: "Messages",
      href: "/chat",
      icon: MessageSquare,
      isActive: pathname.startsWith("/chat"),
    },
    isSellerOrSupplier
      ? {
          label: t("myPosts"),
          href: "/my-posts",
          icon: Layers,
          isActive: pathname.startsWith("/my-posts"),
        }
      : {
          label: "Saved",
          href: "/saved",
          icon: Heart,
          isActive: pathname.startsWith("/saved"),
        },
    {
      label: t("profile"),
      href: "/profile",
      icon: User,
      isActive: pathname.startsWith("/profile") && !pathname.includes("/profile/"),
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200 active:scale-95",
                item.isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active Indicator Top Pill */}
              {item.isActive && (
                <span className="absolute -top-[1px] h-[3px] w-6 rounded-full bg-primary shadow-xs" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                  item.isActive && "scale-105"
                )}
              />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
