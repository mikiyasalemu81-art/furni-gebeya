"use client";

import * as React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  X,
  Camera,
  MapPin,
  User,
  FileText,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
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

const addisSubcities = [
  "Bole",
  "Kirkos",
  "Yeka",
  "Nifas Silk-Lafto",
  "Arada",
  "Lideta",
  "Gulele",
  "Kolfe Keranio",
  "Akaki Kality",
  "Lemi Kura",
];

export function ProfileEditModal() {
  const { editModalOpen, closeEditProfile, user, updateUserProfileData } = useAuth();

  const [fullName, setFullName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [city, setCity] = React.useState("Addis Ababa");
  const [subcity, setSubcity] = React.useState("");
  const [bio, setBio] = React.useState("");

  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setAvatarUrl(user.avatar_url || null);
      setCity(user.city || "Addis Ababa");
      setSubcity(user.subcity || "");
      setBio(user.bio || "");
    }
  }, [user, editModalOpen]);

  if (!editModalOpen || !user) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Failed to upload photo via Cloudinary.");
      } else {
        setAvatarUrl(data.url);
      }
    } catch {
      setError("Network error while uploading photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError("Please provide a name.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const success = await updateUserProfileData({
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        city,
        subcity: subcity.trim() || null,
        bio: bio.trim() || null,
      });

      if (!success) {
        setError("Failed to save profile changes.");
      }
    } catch {
      setError("Unexpected error while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeEditProfile}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Edit Profile
          </h2>
          <p className="text-xs text-muted-foreground">
            Update your public profile information on Furni Gebeya
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center justify-center gap-3 mb-6">
          <div className="relative group">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/40 bg-secondary shadow-md flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-md hover:bg-primary-hover active:scale-95 transition-all"
              title="Upload photo via Cloudinary"
            >
              {isUploadingPhoto ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center">
            <span className="text-[11px] font-semibold text-accent-blue flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              Photo processed via Cloudinary
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Full Name / Business Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Abebe Balcha or Entoto Woodcraft"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              City / Region
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ethiopianCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Subcity / Neighborhood */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Subcity / Specific Area
            </label>
            <input
              type="text"
              value={subcity}
              onChange={(e) => setSubcity(e.target.value)}
              placeholder="e.g. Bole Medhanialem, Merkato, or Piassa"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Bio / Workshop Description
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell buyers about your craftsmanship, furniture specialties, or shop location..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
          <Button variant="ghost" onClick={closeEditProfile} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isUploadingPhoto} className="gap-2">
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
