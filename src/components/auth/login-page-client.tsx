"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Phone, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Please enter your Ethiopian phone number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code.");
        return;
      }

      // Store normalized phone in sessionStorage for verify page
      sessionStorage.setItem("furni_login_phone", data.normalizedPhone || phone);
      if (data.cooldownSeconds) {
        sessionStorage.setItem("furni_otp_cooldown", String(data.cooldownSeconds));
      }

      router.push(`/${locale}/login/verify`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto">
      <div className="w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
            <Phone className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Furni Gebeya Login
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter your phone number to receive a secure 6-digit verification code via AfroMessage SMS
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Ethiopian Phone Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-muted-foreground select-none">
                🇪🇹 +251
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="911 22 33 44 or 09..."
                autoFocus
                required
                className="w-full pl-20 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Supports Ethio Telecom (09...) and Safaricom Ethiopia (07...)
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full h-12 rounded-2xl text-sm font-bold gap-2 shadow-md shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending Code...
              </>
            ) : (
              <>
                Send Code <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Hashed codes • 5-min expiry • AfroMessage SMS</span>
        </div>
      </div>
    </div>
  );
}
