"use client";

import * as React from "react";
import { Listing, CATEGORIES_LIST, PriceType, ListingCondition } from "@/lib/listing-types";
import { compressImage } from "@/lib/image-compression";
import {
  X,
  UploadCloud,
  Camera,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sparkles,
  Check,
  Tag,
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

interface ListingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (listing: Listing) => void;
  initialData?: Listing | null;
}

export function ListingFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}: ListingFormModalProps) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(CATEGORIES_LIST[0].id);
  const [priceType, setPriceType] = React.useState<PriceType>("fixed");
  const [price, setPrice] = React.useState<string>("");
  const [condition, setCondition] = React.useState<ListingCondition>("new");
  const [woodType, setWoodType] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [dimensions, setDimensions] = React.useState("");
  const [city, setCity] = React.useState("Addis Ababa");
  const [subcity, setSubcity] = React.useState("");
  const [deliveryAvailable, setDeliveryAvailable] = React.useState(false);

  // Images state (max 4)
  const [images, setImages] = React.useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [showMoreDetails, setShowMoreDetails] = React.useState(false);

  // Autosave Draft in local storage
  React.useEffect(() => {
    if (!isOpen || isEditing) return;
    const savedDraft = localStorage.getItem("furni_listing_draft");
    if (savedDraft) {
      try {
        const d = JSON.parse(savedDraft);
        if (d.title) setTitle(d.title);
        if (d.price) setPrice(d.price);
        if (d.categoryId) setCategoryId(d.categoryId);
        if (d.city) setCity(d.city);
        if (d.woodType) setWoodType(d.woodType);
        if (d.description) setDescription(d.description);
      } catch {}
    }
  }, [isOpen, isEditing]);

  // Persist draft on edit
  React.useEffect(() => {
    if (!isOpen || isEditing) return;
    const draft = { title, price, categoryId, city, woodType, description };
    localStorage.setItem("furni_listing_draft", JSON.stringify(draft));
  }, [title, price, categoryId, city, woodType, description, isOpen, isEditing]);

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategoryId(initialData.category_id);
      setPriceType(initialData.price_type);
      setPrice(initialData.price > 0 ? initialData.price.toString() : "");
      setCondition(initialData.condition);
      setWoodType(initialData.wood_type || "");
      setMaterial(initialData.material || "");
      setDimensions(initialData.dimensions || "");
      setCity(initialData.city);
      setSubcity(initialData.subcity || "");
      setDeliveryAvailable(initialData.delivery_available);
      setImages(initialData.images.map((img) => img.url));
      setShowMoreDetails(true);
    } else {
      const savedDraft = localStorage.getItem("furni_listing_draft");
      if (!savedDraft) {
        setTitle("");
        setDescription("");
        setCategoryId(CATEGORIES_LIST[0].id);
        setPriceType("fixed");
        setPrice("");
        setCondition("new");
        setWoodType("");
        setMaterial("");
        setDimensions("");
        setCity("Addis Ababa");
        setSubcity("");
        setDeliveryAvailable(false);
        setImages([]);
      }
    }
    setError(null);
  }, [initialData, isOpen]);

  // Quick Post auto-suggest title based on category & timber
  const handleAutoSuggestTitle = () => {
    const cat = CATEGORIES_LIST.find((c) => c.id === categoryId);
    const catName = cat?.name_en || "Furniture";
    const timber = woodType ? `Solid ${woodType.split("(")[0].trim()}` : "Custom Handcrafted";
    setTitle(`${timber} ${catName}`);
  };

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      setError("Maximum 4 photos allowed per listing.");
      return;
    }

    setError(null);
    setUploadingImage(true);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Client-side validation: Reject video files explicitly
        if (file.type.startsWith("video/")) {
          throw new Error("Videos are not allowed. Please upload furniture photos only.");
        }

        // 2. Client-side image compression down to < 1MB
        const compressed = await compressImage(file, 1200, 1200, 0.82);

        // 3. Upload to Cloudinary endpoint
        const formData = new FormData();
        formData.append("file", compressed);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Failed to upload photo to Cloudinary.");
        }

        newUrls.push(data.url);
      }

      setImages((prev) => [...prev, ...newUrls].slice(0, 4));
    } catch (err: any) {
      setError(err.message || "Error processing image upload.");
    } finally {
      setUploadingImage(false);
      // Reset input value
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please provide a title for the furniture listing.");
      return;
    }

    if (!description.trim()) {
      setError("Please write a short description.");
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least 1 photo (maximum 4).");
      return;
    }

    if (priceType === "fixed" && (!price || parseFloat(price) <= 0)) {
      setError("Please enter a valid price in ETB or choose 'Ask for Price'.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        price_type: priceType,
        price: priceType === "fixed" ? parseFloat(price) : 0,
        condition,
        wood_type: woodType.trim() || undefined,
        material: material.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        city,
        subcity: subcity.trim() || undefined,
        delivery_available: deliveryAvailable,
        images,
      };

      const url = isEditing ? `/api/listings/${initialData!.id}` : "/api/listings";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save listing.");
      } else {
        onSuccess(data.listing);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Network error while saving listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto space-y-6">
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
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            {isEditing ? "Edit Furniture Listing" : "Post Furniture for Sale"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isEditing
              ? "Update details, pricing, and photographs for this listing."
              : "Share your handcrafted or modern furniture with buyers across Ethiopia."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photos Upload Area (Max 4 Photos, Client Compressed, No Video) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Photographs (Max 4 photos • No video)
              </label>
              <span className="text-[11px] text-muted-foreground font-semibold">
                {images.length}/4 uploaded
              </span>
            </div>

            {/* Thumbnail Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-secondary group shadow-xs"
                >
                  <img src={url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-red-600 transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Photo Button (if < 4) */}
              {images.length < 4 && (
                <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-colors p-2 text-center group">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                      <span className="text-[11px] font-bold text-foreground">Add Photo</span>
                      <span className="text-[9px] text-muted-foreground">Auto-compressed</span>
                    </>
                  )}
                </label>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              ⚡ Photos are compressed in-browser before Cloudinary upload. Strictly photographs only; videos are rejected.
            </p>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  Listing Title *
                </label>
                <button
                  type="button"
                  onClick={handleAutoSuggestTitle}
                  className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-suggest Title
                </button>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern Solid Wanza Dining Table with 6 Chairs"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en} ({c.name_am})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing: Price vs Ask Price & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-secondary/30 border border-border">
            {/* Price Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Pricing Method *
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as PriceType)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              >
                <option value="fixed">Fixed Price (በዋጋ)</option>
                <option value="ask_price">Ask for Price (ዋጋ ይጠይቁ)</option>
              </select>
            </div>

            {/* Price Input (Disabled if ask_price) */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Amount (ETB) {priceType === "fixed" ? "*" : ""}
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="100"
                  disabled={priceType === "ask_price"}
                  value={priceType === "ask_price" ? "" : price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={priceType === "ask_price" ? "Contact for Price" : "45000"}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed pr-10 font-mono font-bold"
                />
                <span className="absolute right-3 text-[10px] font-bold text-muted-foreground">
                  ETB
                </span>
              </div>
            </div>

            {/* Condition: New or Used */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Condition *
              </label>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setCondition("new")}
                  className={`rounded-xl py-1.5 text-xs font-bold transition-all ${
                    condition === "new"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  New (አዲስ)
                </button>
                <button
                  type="button"
                  onClick={() => setCondition("used")}
                  className={`rounded-xl py-1.5 text-xs font-bold transition-all ${
                    condition === "used"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Used (ያገለገለ)
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible 'Add more details' Section (Quick Post) */}
          <div className="border border-border/80 rounded-2xl p-4 bg-muted/20 space-y-3">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="flex items-center justify-between w-full text-xs font-bold text-foreground text-left"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
                {showMoreDetails ? "Hide additional details" : "Add more details (Dimensions, Wood Type, Delivery)"}
              </span>
              <span className="text-[10px] text-primary">{showMoreDetails ? "▲ Collapse" : "▼ Expand (Optional)"}</span>
            </button>

            {showMoreDetails && (
              <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in">
                {/* Materials & Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Wood Type / Timber
                    </label>
                    <input
                      type="text"
                      value={woodType}
                      onChange={(e) => setWoodType(e.target.value)}
                      placeholder="e.g. Wanza (ዋንዛ), Tid, Zigba"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Material / Finish
                    </label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="e.g. Solid Wood, Velvet, Leather"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Dimensions (L x W x H)
                    </label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="e.g. 200x100x75 cm"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Subcity / Neighborhood */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Subcity / Specific Neighborhood
                  </label>
                  <input
                    type="text"
                    value={subcity}
                    onChange={(e) => setSubcity(e.target.value)}
                    placeholder="e.g. Bole Medhanialem, Merkato, Kazanchis"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe craftsmanship, wood finishing, warranty, or delivery options..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Delivery Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="delivery_available"
                    checked={deliveryAvailable}
                    onChange={(e) => setDeliveryAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="delivery_available" className="text-xs text-foreground font-semibold cursor-pointer">
                    Delivery available to buyer's destination
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadingImage} className="gap-2 font-bold">
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEditing ? "Save Changes" : "Publish Listing"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
