"use client";

import * as React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  X,
  ShieldCheck,
  Building,
  MapPin,
  UploadCloud,
  FileCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ethiopianCities = [
  "Addis Ababa",
  "Hawassa",
  "Adama (Nazret)",
  "Bahir Dar",
  "Dire Dawa",
  "Bishoftu",
  "Mekelle",
  "Jimma",
  "Gondar",
  "Other City / Region",
];

export function VerificationSubmitModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, refreshUser } = useAuth();

  const [businessName, setBusinessName] = React.useState("");
  const [city, setCity] = React.useState("Addis Ababa");
  const [address, setAddress] = React.useState("");

  const [idFrontPath, setIdFrontPath] = React.useState<string | null>(null);
  const [idBackPath, setIdBackPath] = React.useState<string | null>(null);
  const [tradeLicensePath, setTradeLicensePath] = React.useState<string | null>(null);

  const [uploadingDoc, setUploadingDoc] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setBusinessName(user.business_name || user.full_name || "");
      setCity(user.city || "Addis Ababa");
      setAddress(user.address || "");
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: "id_front" | "id_back" | "trade_license"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadingDoc(docType);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const res = await fetch("/api/verification/upload-doc", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload document.");
      } else {
        if (docType === "id_front") setIdFrontPath(data.path);
        if (docType === "id_back") setIdBackPath(data.path);
        if (docType === "trade_license") setTradeLicensePath(data.path);
      }
    } catch {
      setError("Network error while uploading document.");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmit = async () => {
    if (!businessName.trim() || !address.trim()) {
      setError("Business name and workshop/store address are required.");
      return;
    }

    if (!idFrontPath || !idBackPath || !tradeLicensePath) {
      setError(
        "All 3 documents are required: National ID (Front), National ID (Back), and Trade License."
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName.trim(),
          city,
          address: address.trim(),
          id_front_path: idFrontPath,
          id_back_path: idBackPath,
          trade_license_path: tradeLicensePath,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed.");
      } else {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      }
    } catch {
      setError("Network error while submitting verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-cyan/15 text-accent-cyan">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Supplier & Seller Verification
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Upload your Ethiopian National ID and official Trade License. All documents are stored in a{" "}
            <strong className="text-foreground">private encrypted bucket</strong> and viewed exclusively by verified administrators.
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 rounded-2xl bg-secondary/80 border border-border p-3 text-xs text-muted-foreground">
          <Lock className="h-4 w-4 text-accent-cyan flex-shrink-0" />
          <span>
            Government documents are strictly private. Short-lived signed URLs are generated only during admin review.
          </span>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Verification submitted successfully! Review pending.</span>
          </div>
        )}

        {/* Business Details */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Workshop / Business / Showroom Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Entoto Custom Woodcraft or Bole Furniture Gallery"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                City / Region
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ethiopianCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Physical Address / Workshop Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Merkato, Berbere Ber, Shed 42"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Private Document Upload Cards */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Required Verification Documents (Private Storage)
          </h4>

          {/* Document 1: ID Front */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">1. National ID (Front)</p>
              <p className="text-[11px] text-muted-foreground">
                Fayda / Resident ID card front side
              </p>
              {idFrontPath && (
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <FileCheck className="h-3 w-3" /> Encrypted & Stored
                </span>
              )}
            </div>
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "id_front")}
                  disabled={uploadingDoc === "id_front"}
                />
                <Button
                  size="sm"
                  variant={idFrontPath ? "secondary" : "outline"}
                  type="button"
                  className="h-8 text-xs font-semibold gap-1.5"
                  disabled={uploadingDoc === "id_front"}
                >
                  {uploadingDoc === "id_front" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5" />
                  )}
                  {idFrontPath ? "Replace File" : "Upload Front"}
                </Button>
              </label>
            </div>
          </div>

          {/* Document 2: ID Back */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">2. National ID (Back)</p>
              <p className="text-[11px] text-muted-foreground">
                Fayda / Resident ID card reverse side
              </p>
              {idBackPath && (
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <FileCheck className="h-3 w-3" /> Encrypted & Stored
                </span>
              )}
            </div>
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "id_back")}
                  disabled={uploadingDoc === "id_back"}
                />
                <Button
                  size="sm"
                  variant={idBackPath ? "secondary" : "outline"}
                  type="button"
                  className="h-8 text-xs font-semibold gap-1.5"
                  disabled={uploadingDoc === "id_back"}
                >
                  {uploadingDoc === "id_back" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5" />
                  )}
                  {idBackPath ? "Replace File" : "Upload Back"}
                </Button>
              </label>
            </div>
          </div>

          {/* Document 3: Trade License */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">3. Official Trade License (የንግድ ፈቃድ)</p>
              <p className="text-[11px] text-muted-foreground">
                Ministry of Trade / City Administration license
              </p>
              {tradeLicensePath && (
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <FileCheck className="h-3 w-3" /> Encrypted & Stored
                </span>
              )}
            </div>
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "trade_license")}
                  disabled={uploadingDoc === "trade_license"}
                />
                <Button
                  size="sm"
                  variant={tradeLicensePath ? "secondary" : "outline"}
                  type="button"
                  className="h-8 text-xs font-semibold gap-1.5"
                  disabled={uploadingDoc === "trade_license"}
                >
                  {uploadingDoc === "trade_license" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Building className="h-3.5 w-3.5" />
                  )}
                  {tradeLicensePath ? "Replace File" : "Upload License"}
                </Button>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !idFrontPath ||
              !idBackPath ||
              !tradeLicensePath ||
              !businessName.trim()
            }
            className="gap-2 font-bold"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Submit for Verification
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
