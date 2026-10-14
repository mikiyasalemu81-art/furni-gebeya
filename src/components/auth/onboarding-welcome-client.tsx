"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Camera,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { BuiltByImako } from "@/components/brand/built-by-imako";

export function OnboardingWelcomeClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [currentScreen, setCurrentScreen] = React.useState(0);
  const [finishing, setFinishing] = React.useState(false);

  const screens = [
    {
      title: "1. What You Can Do in Your Role",
      subtitle: user?.role ? `Welcome, ${user.role.toUpperCase()}!` : "Your Marketplace Journey",
      icon: Sparkles,
      iconColor: "text-primary bg-primary/10",
      description:
        user?.role === "supplier"
          ? "As a Supplier, you can list custom and finished wooden furniture pieces, receive direct wholesale orders from shops, and chat with interested buyers across Ethiopia."
          : user?.role === "seller"
          ? "As a Showroom Seller, you can browse stock directly from certified timber suppliers and carpenters, as well as list furniture from your own showroom."
          : "As a Buyer, browse quality handcrafted furniture across Addis Ababa, compare timber specs, save favorites, and post custom requests on the Wanted Board.",
      tips: [
        "Direct connection to certified carpenters & workshops",
        "Transparent ETB pricing or 'Ask for price' options",
        "Support for local Ethiopian hardwood (Wanza, Zigba, Kerero)",
      ],
    },
    {
      title: "2. How to Take Great Furniture Photos",
      subtitle: "Photos make 90% of buying decisions",
      icon: Camera,
      iconColor: "text-accent-blue bg-accent-blue/10",
      description:
        "High quality photos attract serious buyers. We enforce a strict NO VIDEO rule to keep the marketplace fast and light for mobile users across Ethiopia.",
      tips: [
        "Photograph in natural morning or afternoon light (avoid dark rooms)",
        "Capture multiple perspectives: wide whole view, joinery details, and back",
        "Clean the piece and highlight the wood grain finish",
        "Maximum 4 compressed photos per listing (no video files)",
      ],
    },
    {
      title: "3. Contact Protection & 30-Day Free Trial",
      subtitle: "Safe, verified trading environment",
      icon: ShieldCheck,
      iconColor: "text-emerald-500 bg-emerald-500/10",
      description:
        "Your privacy and business security are protected with encrypted contact reveals and verified credentials.",
      tips: [
        "Suppliers and Sellers receive a 30-day free trial upon admin verification",
        "Direct contacts (Phone, Telegram, WhatsApp) are visible only to signed-in users",
        "Every contact reveal is logged to prevent spam",
        "Buyers enjoy permanent 100% free access without subscriptions",
      ],
    },
  ];

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await fetch("/api/auth/complete-onboarding", { method: "POST" });
      await refreshUser();
      router.push(`/${locale}`);
    } catch {
      router.push(`/${locale}`);
    } finally {
      setFinishing(false);
    }
  };

  const screen = screens[currentScreen];
  const Icon = screen.icon;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto">
      <div className="w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative">
        {/* Skip button */}
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="absolute top-6 right-6 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          Skip <X className="w-3.5 h-3.5" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {screens.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentScreen
                  ? "w-8 bg-primary"
                  : i < currentScreen
                  ? "w-4 bg-primary/40"
                  : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="space-y-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${screen.iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Screen {currentScreen + 1} of 3
            </span>
            <h1 className="text-xl font-black text-foreground mt-0.5">{screen.title}</h1>
            <p className="text-xs font-semibold text-muted-foreground">{screen.subtitle}</p>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed pt-1">
            {screen.description}
          </p>
        </div>

        {/* Bullet Tips */}
        <div className="bg-muted/40 border border-border rounded-2xl p-4 space-y-2">
          {screen.tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {currentScreen > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentScreen((c) => c - 1)}
              className="rounded-2xl h-12 px-4 gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}

          {currentScreen < screens.length - 1 ? (
            <Button
              type="button"
              onClick={() => setCurrentScreen((c) => c + 1)}
              className="flex-1 rounded-2xl h-12 text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              disabled={finishing}
              className="flex-1 rounded-2xl h-12 text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
            >
              {finishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Entering Marketplace...
                </>
              ) : (
                "Get Started & Explore"
              )}
            </Button>
          )}
        </div>

        {/* Built by Imako Solution Credit */}
        <div className="pt-2 border-t border-border/50">
          <BuiltByImako variant="splash" />
        </div>
      </div>
    </div>
  );
}
