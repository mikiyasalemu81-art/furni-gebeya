"use client";

import * as React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "next-intl";
import {
  Phone,
  ShieldCheck,
  X,
  ArrowRight,
  RefreshCw,
  KeyRound,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function PhoneLoginModal() {
  const { loginModalOpen, closeLogin, refreshUser } = useAuth();
  const t = useTranslations("common");

  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [normalizedPhone, setNormalizedPhone] = React.useState("");
  const [operator, setOperator] = React.useState<string | undefined>();
  const [otpCode, setOtpCode] = React.useState("");
  const [devHintCode, setDevHintCode] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Cooldown timer (60s)
  const [cooldown, setCooldown] = React.useState(0);
  // Expiry timer (5 minutes = 300s)
  const [expirySeconds, setExpirySeconds] = React.useState(300);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && expirySeconds > 0) {
      timer = setInterval(() => setExpirySeconds((e) => e - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  if (!loginModalOpen) return null;

  const handleSendOtp = async (phoneToUse?: string) => {
    const targetPhone = phoneToUse || phoneNumber;
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code.");
        if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
      } else {
        setNormalizedPhone(data.normalizedPhone);
        setOperator(data.operator);
        setCooldown(data.cooldownSeconds || 60);
        setExpirySeconds(300);
        setStep("otp");
        if (data.devCode) {
          setDevHintCode(data.devCode);
        }
        setSuccessMsg(`Code sent via SMS to ${data.normalizedPhone}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, code: otpCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect code. Please try again.");
      } else {
        await refreshUser();
        closeLogin();
        // Reset state
        setStep("phone");
        setPhoneNumber("");
        setOtpCode("");
      }
    } catch {
      setError("Network error during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminAccount = () => {
    setPhoneNumber("0911000000");
    handleSendOtp("0911000000");
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={closeLogin}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {step === "phone" ? <Phone className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            {step === "phone" ? "Sign in to Furni Gebeya" : "Verify Phone Number"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {step === "phone"
              ? "Enter your Ethiopian phone number to receive a one-time verification code."
              : `Enter the 6-digit code sent via AfroMessage to ${normalizedPhone}`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Phone Input Form */}
        {step === "phone" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Phone Number
              </label>
              <div className="relative flex items-center rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                <span className="flex items-center gap-1.5 border-r border-border px-3 py-2.5 text-xs font-bold text-muted-foreground bg-muted/30 rounded-l-xl">
                  🇪🇹 +251
                </span>
                <input
                  type="tel"
                  placeholder="0911 22 33 44 or 0712 34 56 78"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  autoFocus
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Works with <strong className="text-foreground">Ethio Telecom</strong> (09...) and <strong className="text-foreground">Safaricom</strong> (07...)
              </p>
            </div>

            <Button
              onClick={() => handleSendOtp()}
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full h-11 text-sm font-bold gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                <>
                  Send OTP Code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {/* Seeded Admin Dev Button */}
            <div className="pt-2 border-t border-border/60 text-center">
              <button
                type="button"
                onClick={fillAdminAccount}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Quick Test: Seeded Admin (+251911000000)
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === "otp" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  6-Digit OTP Code
                </label>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Expires in: <strong className="text-primary">{formatTimer(expirySeconds)}</strong>
                </span>
              </div>

              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                className="w-full text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-border bg-background py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                autoFocus
              />

              {devHintCode && (
                <div className="mt-2 rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 p-2 text-center text-[11px] text-accent-cyan">
                  ⚡ <strong>Dev Console Code:</strong> {devHintCode}
                  <button
                    onClick={() => setOtpCode(devHintCode)}
                    className="ml-2 underline font-semibold hover:text-foreground"
                  >
                    Auto-fill
                  </button>
                </div>
              )}
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={isLoading || otpCode.length !== 6 || expirySeconds <= 0}
              className="w-full h-11 text-sm font-bold gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Verify & Sign In
                </>
              )}
            </Button>

            {/* Resend and change phone actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-muted-foreground hover:text-foreground underline"
              >
                Change phone
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={() => handleSendOtp(normalizedPhone)}
                className={`font-semibold transition-colors ${
                  cooldown > 0
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-primary hover:underline"
                }`}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
