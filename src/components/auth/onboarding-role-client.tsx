"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Hammer, Store, ShoppingBag, ArrowRight, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { UserRole } from "@/lib/auth-session";

export function OnboardingRoleClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { user, updateUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("buyer");
  const [loading, setLoading] = React.useState(false);

  const roles = [
    {
      id: "supplier" as UserRole,
      title: "Supplier / Artisan (አምራች / የእንጨት ባለሙያ)",
      description: "You manufacture, craft, or supply finished furniture or raw timber in bulk/pieces.",
      icon: Hammer,
      badge: "Needs Document Verification Later",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    {
      id: "seller" as UserRole,
      title: "Seller / Showroom (የሱቅ ባለቤት / ሻጭ)",
      description: "You operate a showroom or store, buy from artisans/suppliers, and list furniture for retail.",
      icon: Store,
      badge: "Needs Document Verification Later",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    {
      id: "buyer" as UserRole,
      title: "Personal Buyer (ገዢ)",
      description: "You want to furnish your home, office, or apartment. Browse, chat, save, and post wanted requests.",
      icon: ShoppingBag,
      badge: "Instant Access (No Verification Needed)",
      badgeColor: "bg-green-500/10 text-green-600 border-green-500/20",
    },
  ];

  const handleContinue = async () => {
    setLoading(true);
    try {
      const ok = await updateUserRole(selectedRole);
      if (ok) {
        router.push(`/${locale}/onboarding/welcome`);
      }
    } catch {
      alert("Failed to save role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto">
      <div className="w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
            Step 1 of 2
          </span>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Choose Your Marketplace Role
          </h1>
          <p className="text-xs text-muted-foreground">
            Select how you intend to use Furni Gebeya. You can update your profile details anytime.
          </p>
        </div>

        <div className="space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                    : "border-border hover:border-border/80 bg-background"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">{r.title}</h3>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedRole(r.id)}
                        className="accent-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {r.description}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${r.badgeColor} mt-1`}
                    >
                      {r.badge}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          disabled={loading}
          className="w-full h-12 rounded-2xl text-sm font-bold gap-2 shadow-md shadow-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving Role...
            </>
          ) : (
            <>
              Continue to Onboarding <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
