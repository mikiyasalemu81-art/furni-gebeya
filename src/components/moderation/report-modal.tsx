"use client";

import * as React from "react";
import { Flag, X, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: "listing" | "profile" | "message";
  targetListingId?: string;
  targetUserId?: string;
  targetTitleOrName?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  reportType,
  targetListingId,
  targetUserId,
  targetTitleOrName,
}: ReportModalProps) {
  const [reason, setReason] = React.useState("Misleading description or incorrect price");
  const [details, setDetails] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          targetListingId,
          targetUserId,
          targetTitleOrName,
          reason,
          details,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit report");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please log in first.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Report {reportType === "listing" ? "Listing" : "Profile"}
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-[260px]">
              {targetTitleOrName || "Marketplace item"}
            </p>
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <p className="font-semibold text-foreground">Report Submitted</p>
            <p className="text-xs text-muted-foreground">
              Thank you for keeping Furni Gebeya trustworthy. Our moderators will review this shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Reason for reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Misleading description or incorrect price">Misleading description or price</option>
                <option value="Counterfeit or stolen item">Suspected fake or stolen woodcraft</option>
                <option value="Inappropriate or offensive media">Inappropriate or offensive content</option>
                <option value="Scam or fraudulent seller behavior">Scam or suspicious request for upfront money</option>
                <option value="Seller unreachable or fake phone number">Fake contact or unreachable phone</option>
                <option value="Other marketplace terms violation">Other violation</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Provide additional details or context for the moderation team..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
