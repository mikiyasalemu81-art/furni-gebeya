"use client";

import * as React from "react";
import {
  Sparkles,
  Camera,
  ShieldCheck,
  PhoneCall,
  Clock,
  ArrowRight,
  Check,
  X,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string | null;
}

export function OnboardingModal({ isOpen, onClose, userRole }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to Furni Gebeya!",
      subtitle: "Connecting Suppliers, Showrooms, and Buyers across Ethiopia",
      icon: Sparkles,
      iconColor: "text-primary bg-primary/10",
      content: (
        <div className="space-y-3 text-xs text-muted-foreground">
          <p>
            Whether you craft artisanal dining sets from Ethiopian <strong>Wanza</strong> or run a modern Sheger showroom, our platform is built for you:
          </p>
          <div className="grid grid-cols-1 gap-2 pt-1">
            <div className="p-2.5 rounded-xl border border-border/80 bg-muted/40">
              <strong className="text-foreground block mb-0.5">🔨 Suppliers & Carpenters</strong>
              Post custom pieces, connect with retail shops, and supply raw timber.
            </div>
            <div className="p-2.5 rounded-xl border border-border/80 bg-muted/40">
              <strong className="text-foreground block mb-0.5">🏬 Showroom Sellers</strong>
              Source from workshops and list your showroom items directly to buyers.
            </div>
            <div className="p-2.5 rounded-xl border border-border/80 bg-muted/40">
              <strong className="text-foreground block mb-0.5">🛍️ Personal Buyers</strong>
              Browse authentic local pieces, chat in real-time, or post wanted requests.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Taking Good Furniture Photos",
      subtitle: "Photos sell furniture faster. Follow these simple tips:",
      icon: Camera,
      iconColor: "text-accent-blue bg-accent-blue/10",
      content: (
        <div className="space-y-2.5 text-xs text-muted-foreground">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-background border border-border/60">
            <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
            <p><strong className="text-foreground">Natural daylight:</strong> Photograph near windows or open doors to show authentic wood grains and fabric textures.</p>
          </div>
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-background border border-border/60">
            <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
            <p><strong className="text-foreground">Multiple angles (Max 4 photos):</strong> Capture front, side, wood joints, and finish details. No video needed.</p>
          </div>
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-background border border-border/60">
            <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
            <p><strong className="text-foreground">Automatic compression:</strong> We optimize your photos to under 1MB automatically so they load fast even on 3G.</p>
          </div>
        </div>
      ),
    },
    {
      title: "How Contact & Free Trial Work",
      subtitle: "Transparent, safe, and protected communication",
      icon: ShieldCheck,
      iconColor: "text-emerald-500 bg-emerald-500/10",
      content: (
        <div className="space-y-2.5 text-xs text-muted-foreground">
          <div className="p-2.5 rounded-xl bg-background border border-border/60 space-y-1">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <Clock className="w-4 h-4 text-primary" />
              <span>30-Day Free Trial</span>
            </div>
            <p>Every approved supplier and seller starts with a 30-day full access trial. Buyers are always 100% free.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-background border border-border/60 space-y-1">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <span>Protected Contacts & Realtime Chat</span>
            </div>
            <p>Phone numbers and social links are only visible to signed-in users, preventing scrapers and fraud.</p>
          </div>
        </div>
      ),
    },
  ];

  const currentData = steps[currentStep];
  const Icon = currentData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("furni_onboarding_completed", "true");
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("furni_onboarding_completed", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
        {/* Skip button on top right */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Step Header */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${currentData.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-foreground leading-tight">{currentData.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{currentData.subtitle}</p>
          </div>
        </div>

        {/* Step Body */}
        <div className="min-h-[170px] py-1">{currentData.content}</div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <span className="text-[11px] text-muted-foreground font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
          <Button onClick={handleNext} size="sm" className="gap-1.5 font-bold">
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="w-4 h-4" /> Got it!
              </>
            ) : (
              <>
                Next <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
