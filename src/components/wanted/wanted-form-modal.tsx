"use client";

import * as React from "react";
import { Plus, X, Upload, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES_LIST } from "@/lib/listing-types";
import { compressImage } from "@/lib/image-compression";
import { WantedRequest } from "@/lib/marketplace-types";

interface WantedFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (request: WantedRequest) => void;
}

export function WantedFormModal({ isOpen, onClose, onCreated }: WantedFormModalProps) {
  const [title, setTitle] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(CATEGORIES_LIST[0].id);
  const [categoryName, setCategoryName] = React.useState(CATEGORIES_LIST[0].name_en);
  const [description, setDescription] = React.useState("");
  const [budgetMin, setBudgetMin] = React.useState<number | "">("");
  const [budgetMax, setBudgetMax] = React.useState<number | "">("");
  const [quantity, setQuantity] = React.useState(1);
  const [city, setCity] = React.useState("Addis Ababa");
  const [images, setImages] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selId = e.target.value;
    const cat = CATEGORIES_LIST.find((c) => c.id === selId);
    setCategoryId(selId);
    if (cat) {
      setCategoryName(cat.name_en);
      if (!title) {
        setTitle(`Looking for custom ${cat.name_en} furniture`);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 2) {
      alert("You can attach up to 2 reference photos for a wanted request.");
      return;
    }

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file, 1200, 1200, 0.82);

        const formData = new FormData();
        formData.append("file", compressed);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        }
      }
      setImages((prev) => [...prev, ...newUrls].slice(0, 2));
    } catch (err: any) {
      alert(err.message || "Failed uploading photos.");
    } finally {
      setUploading(false);
    }
  };


  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !city.trim()) {
      alert("Please provide a title, description, and city.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wanted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          categoryId,
          categoryName,
          description,
          budgetMin: budgetMin || null,
          budgetMax: budgetMax || null,
          quantity: Number(quantity) || 1,
          city,
          images,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      onCreated(data.request);
      onClose();
    } catch (err: any) {
      alert(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Post a Wanted Request</h3>
            <p className="text-xs text-muted-foreground">
              Notify carpenters and shops across Ethiopia of what you need
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en} ({c.name_am})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              What piece are you looking for?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 6-Seater Wanza Dining Table or L-shape Sofa"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Description & Specifications
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe required dimensions, wood type (Wanza, Zigba, Kerero), fabric color, or finish..."
              rows={3}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Quantity Needed
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Addis Ababa, Hawassa"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Min Budget (ETB, Optional)
              </label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 30000"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Max Budget (ETB, Optional)
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 50000"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Reference Photos (Up to 2) */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Reference Photos (Max 2)
            </label>
            <div className="flex items-center gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                  <img src={url} alt="Reference" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {images.length < 2 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-semibold">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {uploading && (
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Compressing & uploading...
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? "Posting..." : "Post Request (Active for 30 Days)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
