"use client";

import * as React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { UserRole } from "@/lib/auth-session";
import { ShoppingBag, Store, Hammer, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleOption {
  role: UserRole;
  title: string;
  amharicTitle: string;
  description: string;
  icon: React.ElementType;
  accentClass: string;
  badge: string;
}

const roleOptions: RoleOption[] = [
  {
    role: "buyer",
    title: "Buyer",
    amharicTitle: "ገዢ",
    description:
      "Looking for quality home, office, and living room furniture from trusted local creators and stores.",
    icon: ShoppingBag,
    accentClass: "border-primary text-primary",
    badge: "Browse & Buy",
  },
  {
    role: "seller",
    title: "Furniture Seller / Showroom",
    amharicTitle: "የቤት ዕቃዎች ሻጭ",
    description:
      "Retail showroom, furniture boutique, or importer selling ready-made sofas, dining sets, and beds.",
    icon: Store,
    accentClass: "border-accent-blue text-accent-blue",
    badge: "List & Sell",
  },
  {
    role: "supplier",
    title: "Artisan & Timber Supplier",
    amharicTitle: "አናፂ / የእንጨት አቅራቢ",
    description:
      "Carpenter, bespoke woodcraft workshop, or raw timber supplier (Wanza, Tid, Zigba) offering custom craftsmanship.",
    icon: Hammer,
    accentClass: "border-accent-cyan text-accent-cyan",
    badge: "Craft & Supply",
  },
];

export function RoleSelectionModal() {
  const { roleModalOpen, closeRoleSelection, updateUserRole, user } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("buyer");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!roleModalOpen) return null;

  const handleConfirmRole = async () => {
    setIsSubmitting(true);
    try {
      const ok = await updateUserRole(selectedRole);
      if (ok) {
        closeRoleSelection();
        // Trigger onboarding modal if not previously completed
        const completed = localStorage.getItem("furni_onboarding_completed");
        if (!completed) {
          window.dispatchEvent(new CustomEvent("furni_open_onboarding"));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            First-Time Setup
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            How will you use Furni Gebeya?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Select your account type to personalize your marketplace experience. You can adjust this later in settings.
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-3">
          {roleOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedRole === opt.role;

            return (
              <div
                key={opt.role}
                onClick={() => setSelectedRole(opt.role)}
                className={`group relative flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/40 dark:bg-primary/10"
                    : "border-border hover:border-border/80 hover:bg-secondary/40"
                }`}
              >
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {opt.title}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        ({opt.amharicTitle})
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleConfirmRole}
          disabled={isSubmitting}
          className="w-full h-12 text-sm font-bold gap-2 shadow-lg"
        >
          {isSubmitting ? "Setting your role..." : "Continue to Marketplace"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
