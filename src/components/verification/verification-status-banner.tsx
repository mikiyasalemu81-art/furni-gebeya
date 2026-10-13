"use client";

import * as React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationSubmitModal } from "@/components/verification/verification-submit-modal";

export function VerificationStatusBanner() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = React.useState(false);

  if (!user) return null;

  const isSupplierOrSeller = user.role === "supplier" || user.role === "seller";
  const status = user.verification_status || (user.is_verified ? "approved" : "unverified");

  // 1. Approved State -> Verified Badge
  if (status === "approved" || user.is_verified) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>
          <strong>Verified {user.role === "supplier" ? "Supplier & Artisan" : "Seller"}</strong>:
          Your business documents and identity have been approved by Furni Gebeya administration.
        </span>
      </div>
    );
  }

  // 2. Pending Approval State -> Cannot post
  if (status === "pending") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs text-foreground">
        <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <p className="font-bold text-primary text-sm">
            Pending approval
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Your verification request is currently under review by our administration team.
            Documents (National ID and Trade License) are securely queued. You will receive an SMS notification via AfroMessage once verified.
            <strong className="text-foreground ml-1">You cannot post listings until approved.</strong>
          </p>
        </div>
      </div>
    );
  }

  // 3. More Documents Requested State
  if (status === "more_documents_requested") {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                Additional Documents Requested
              </p>
              <p className="text-muted-foreground">
                Our administrators requested updated or clearer documents before approving your account.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs font-bold rounded-xl self-end sm:self-auto"
          >
            Re-upload Documents
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <VerificationSubmitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // 4. Rejected State
  if (status === "rejected") {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-destructive text-sm">
                Verification Request Rejected
              </p>
              <p className="text-muted-foreground">
                Your verification documents did not meet marketplace requirements. Please review guidelines and submit updated files.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setModalOpen(true)}
            className="gap-1 text-xs font-bold rounded-xl self-end sm:self-auto"
          >
            Re-apply
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <VerificationSubmitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // 5. Unverified Supplier/Seller Callout
  if (isSupplierOrSeller) {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-accent-cyan/30 bg-gradient-to-r from-accent-cyan/10 via-card to-background p-5 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-accent-cyan flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-foreground text-sm">
                Get Verified to Post Furniture
              </p>
              <p className="text-muted-foreground leading-relaxed">
                As a {user.role === "supplier" ? "Supplier / Woodcraft Artisan" : "Furniture Seller"}, you need to verify your National ID and Trade License before publishing listings.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-accent-cyan hover:bg-accent-cyan/90 text-black font-bold gap-1.5 text-xs rounded-xl shadow-sm self-start sm:self-auto"
          >
            <ShieldCheck className="h-4 w-4" />
            Submit Documents
          </Button>
        </div>
        <VerificationSubmitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return null;
}
