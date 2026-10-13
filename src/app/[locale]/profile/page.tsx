"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { Link } from "@/i18n/routing";
import {
  User,
  ShieldCheck,
  Palette,
  Globe,
  Sparkles,
  Database,
  LogIn,
  LogOut,
  Edit3,
  MapPin,
  Briefcase,
  Store,
  Hammer,
  ShoppingBag,
  CheckCircle,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { ThemeSelectorDropdown } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton";
import { Button } from "@/components/ui/button";
import { formatDisplayPhone } from "@/lib/phone";
import { VerificationStatusBanner } from "@/components/verification/verification-status-banner";
import { VerificationSubmitModal } from "@/components/verification/verification-submit-modal";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const commonT = useTranslations("common");
  const { user, isLoading, openLogin, openEditProfile, openRoleSelection, logout } = useAuth();
  const [verifyModalOpen, setVerifyModalOpen] = React.useState(false);

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return {
          title: "System Administrator",
          icon: ShieldCheck,
          badge: "bg-red-500/15 text-red-500 border-red-500/30",
          desc: "Full administrative access across Furni Gebeya.",
        };
      case "supplier":
        return {
          title: "Artisan & Timber Supplier",
          icon: Hammer,
          badge: "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30",
          desc: "Crafts bespoke furniture and supplies timber (Wanza, Tid, Zigba).",
        };
      case "seller":
        return {
          title: "Furniture Showroom / Seller",
          icon: Store,
          badge: "bg-accent-blue/15 text-accent-blue border-accent-blue/30",
          desc: "Showcases and sells finished furniture pieces.",
        };
      default:
        return {
          title: "Furniture Buyer",
          icon: ShoppingBag,
          badge: "bg-primary/10 text-primary border-primary/20",
          desc: "Discovers and orders handcrafted furniture.",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 max-w-3xl">
        <ProfileSkeleton />
      </div>
    );
  }

  const roleMeta = user ? getRoleDisplay(user.role) : null;
  const RoleIcon = roleMeta ? roleMeta.icon : ShoppingBag;
  const isApproved = user?.is_verified || user?.verification_status === "approved";

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 space-y-6 max-w-3xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>

        {user && (
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        )}
      </div>

      {/* Verification Status Banner (Stage 3) */}
      <VerificationStatusBanner />

      {/* Admin Quick Entry Card if user has Admin role */}
      {user?.role === "admin" && (
        <div className="flex items-center justify-between rounded-3xl border border-red-500/30 bg-red-500/10 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/20 text-red-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                Administrator Access Active
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage the verification queue, review private documents, and track audit logs.
              </p>
            </div>
          </div>
          <Link href="/admin">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5 font-bold rounded-xl text-xs">
              Open Admin Console
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Authenticated User Card OR Guest Callout */}
      {user ? (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-2 border-primary/40 bg-secondary shadow-md flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              {isApproved && (
                <div
                  className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-white shadow"
                  title="Verified Account"
                >
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-xl sm:text-2xl font-black text-foreground">
                      {user.full_name}
                    </h2>
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground font-mono">
                    {formatDisplayPhone(user.phone_number)}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-center sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openEditProfile}
                    className="gap-1.5 text-xs font-semibold rounded-xl"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                </div>
              </div>

              {/* Role & Location Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {roleMeta && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${roleMeta.badge}`}
                  >
                    <RoleIcon className="h-3.5 w-3.5" />
                    {roleMeta.title}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {user.city}
                  {user.subcity ? `, ${user.subcity}` : ""}
                </span>
              </div>

              {/* Bio */}
              {user.bio ? (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1 italic">
                  "{user.bio}"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/70 pt-1">
                  No bio added yet. Click "Edit Profile" to share details about your workshop or preferences.
                </p>
              )}
            </div>
          </div>

          {/* Verification CTA button for sellers/suppliers */}
          {(user.role === "supplier" || user.role === "seller") && !isApproved && (
            <div className="rounded-2xl border border-accent-cyan/30 bg-accent-cyan/10 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-accent-cyan" />
                <span>
                  Verification Status:{" "}
                  <strong className="capitalize text-accent-cyan">
                    {user.verification_status || "Unverified"}
                  </strong>
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setVerifyModalOpen(true)}
                className="bg-accent-cyan text-black hover:bg-accent-cyan/90 font-bold h-8 text-xs rounded-xl"
              >
                Upload National ID & Trade License
              </Button>
            </div>
          )}

          {/* Quick Actions for Role Selection */}
          <div className="rounded-2xl bg-secondary/50 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                Account Role: <strong>{roleMeta?.title}</strong>
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={openRoleSelection}
              className="text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 h-8 rounded-lg"
            >
              Switch Role (Buyer / Seller / Supplier)
            </Button>
          </div>
        </div>
      ) : (
        /* Guest Callout */
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                Sign in to Furni Gebeya
              </h2>
              <p className="text-xs text-muted-foreground">
                Log in using your Ethiopian phone number and AfroMessage SMS OTP to manage your profile, select your role, and post furniture.
              </p>
            </div>
            <Button onClick={openLogin} className="gap-2 font-bold shadow-md">
              <LogIn className="h-4 w-4" />
              Sign In via Phone
            </Button>
          </div>
        </div>
      )}

      {/* Settings / Preferences Card */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("settings")}
        </h3>

        {/* Theme Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("themePreference")}
              </p>
              <p className="text-xs text-muted-foreground">
                Light, Dark (deep black), or System
              </p>
            </div>
          </div>
          <ThemeSelectorDropdown />
        </div>

        {/* Language Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("languagePreference")}
              </p>
              <p className="text-xs text-muted-foreground">
                English, አማርኛ (Amharic), Afaan Oromoo
              </p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Stage 3 Status */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent-cyan/15 text-accent-cyan">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Stage 3 Verification & Admin
              </p>
              <p className="text-xs text-muted-foreground">
                Private Supabase Storage, Signed URLs, AfroMessage notifications & audit logs
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-md">
            Stage 3 Active
          </span>
        </div>
      </div>

      <VerificationSubmitModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
      />
    </div>
  );
}
