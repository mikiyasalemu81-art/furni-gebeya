"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { formatDisplayPhone } from "@/lib/phone";

export function LoginVerifyClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [phone, setPhone] = React.useState("");
  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(60);
  const [expirySeconds, setExpirySeconds] = React.useState(300); // 5 minutes

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    const storedPhone = sessionStorage.getItem("furni_login_phone");
    if (!storedPhone) {
      router.push(`/${locale}/login`);
      return;
    }
    setPhone(storedPhone);

    const storedCooldown = sessionStorage.getItem("furni_otp_cooldown");
    if (storedCooldown) {
      setCooldown(Number(storedCooldown));
    }
  }, [locale, router]);

  // Cooldown timer
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // 5-minute expiry timer
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expirySeconds > 0) {
      timer = setInterval(() => setExpirySeconds((e) => e - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [expirySeconds]);

  const verifyCode = React.useCallback(
    async (codeToVerify: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code: codeToVerify }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invalid verification code.");
          // Clear boxes on error
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
          return;
        }

        await refreshUser();

        // Redirect rules from spec:
        // no role -> role selection, onboarding not done -> welcome, otherwise -> Home
        if (data.needsRoleSelection || !data.profile?.role) {
          router.push(`/${locale}/onboarding/role`);
        } else if (data.needsWelcome || !data.profile?.onboarding_done) {
          router.push(`/${locale}/onboarding/welcome`);
        } else {
          router.push(`/${locale}`);
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [phone, locale, router, refreshUser]
  );

  const handleDigitChange = (index: number, val: string) => {
    // Handle paste of 6 digits
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, "").slice(0, 6);
      if (pasted.length === 6) {
        const newDigits = pasted.split("");
        setDigits(newDigits);
        inputRefs.current[5]?.focus();
        verifyCode(pasted);
        return;
      }
    }

    const cleanChar = val.slice(-1).replace(/\D/g, "");
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    // Auto advance to next input
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when complete
    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, locale }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
      } else {
        setCooldown(data.cooldownSeconds || 60);
        setExpirySeconds(300);
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error. Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const formatExpiry = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto">
      <div className="w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Enter 6-Digit Code
          </h1>
          <p className="text-xs text-muted-foreground">
            Sent via SMS to{" "}
            <span className="font-bold text-foreground">
              {phone ? formatDisplayPhone(phone) : "your phone"}
            </span>
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 6 Separate Code Boxes with Autofill Support */}
        <div className="flex items-center justify-between gap-2 sm:gap-2.5">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              pattern="\d*"
              maxLength={index === 0 ? 6 : 1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className="w-12 h-14 text-center text-xl font-black rounded-2xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs"
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Expires in: <strong className="text-foreground font-mono">{formatExpiry(expirySeconds)}</strong></span>
          {cooldown > 0 ? (
            <span>Resend in <strong className="text-primary font-mono">{cooldown}s</strong></span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary font-bold hover:underline flex items-center gap-1"
            >
              {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Resend code
            </button>
          )}
        </div>

        <Button
          onClick={() => verifyCode(digits.join(""))}
          disabled={loading || digits.join("").length !== 6}
          className="w-full h-12 rounded-2xl text-sm font-bold gap-2 shadow-md shadow-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </>
          ) : (
            "Verify & Sign In"
          )}
        </Button>

        <div className="pt-2 text-center">
          <Link
            href={`/login`}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change phone number
          </Link>
        </div>
      </div>
    </div>
  );
}
