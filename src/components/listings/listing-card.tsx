"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Listing } from "@/lib/listing-types";
import { Heart, MapPin, ShieldCheck, Tag } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface ListingCardProps {
  listing: Listing;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  showOwnerControls?: boolean;
  onEdit?: (listing: Listing) => void;
  onToggleSold?: (listing: Listing) => void;
  onDelete?: (listing: Listing) => void;
}

export function ListingCard({
  listing,
  isFavorited = false,
  onToggleFavorite,
  showOwnerControls = false,
  onEdit,
  onToggleSold,
  onDelete,
}: ListingCardProps) {
  const { user, openLogin } = useAuth();
  const [fav, setFav] = React.useState(isFavorited);
  const [isTogglingFav, setIsTogglingFav] = React.useState(false);

  React.useEffect(() => {
    setFav(isFavorited);
  }, [isFavorited]);

  const coverImage =
    listing.images.find((img) => img.is_cover)?.url ||
    listing.images[0]?.url ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80";

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openLogin();
      return;
    }

    setIsTogglingFav(true);
    setFav(!fav); // optimistic update

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFav(data.isFavorited);
        if (onToggleFavorite) onToggleFavorite(listing.id);
      } else {
        setFav(fav); // rollback
      }
    } catch {
      setFav(fav); // rollback
    } finally {
      setIsTogglingFav(false);
    }
  };

  const isSold = listing.status === "sold";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      {/* Product Image Area */}
      <Link href={`/listings/${listing.id}`} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary">
        <img
          src={coverImage}
          alt={listing.title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isSold ? "grayscale contrast-125 opacity-75" : ""
          }`}
        />

        {/* SOLD Overlay Badge */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <span className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-xl rotate-[-6deg]">
              SOLD / የተሸጠ
            </span>
          </div>
        )}

        {/* Top Badges: Condition, New today, Price dropped, Good price */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5 max-w-[80%]">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
              listing.condition === "new"
                ? "bg-emerald-600/90 text-white"
                : "bg-amber-600/90 text-white"
            }`}
          >
            {listing.condition === "new" ? "New" : "Used"}
          </span>

          {/* New Today Badge (created within 24 hours) */}
          {new Date().getTime() - new Date(listing.created_at).getTime() < 24 * 60 * 60 * 1000 && (
            <span className="rounded-full bg-primary/95 text-primary-foreground px-2 py-0.5 text-[9px] font-bold shadow-xs">
              New today
            </span>
          )}

          {/* Price Dropped Badge */}
          {listing.old_price && listing.old_price > listing.price && (
            <span className="rounded-full bg-red-600/90 text-white px-2 py-0.5 text-[9px] font-bold shadow-xs">
              Price dropped
            </span>
          )}

          {/* Good Price Badge */}
          {listing.is_good_price && (
            <span className="rounded-full bg-cyan-600/90 text-white px-2 py-0.5 text-[9px] font-bold shadow-xs">
              Good price
            </span>
          )}

          {listing.wood_type && (
            <span className="hidden sm:inline-flex rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-md">
              {listing.wood_type.split("(")[0].trim()}
            </span>
          )}
        </div>

        {/* Top Right Action Buttons: Compare & Favorite */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Trigger compare logic if provider available
              const event = new CustomEvent("toggle-compare", { detail: listing });
              window.dispatchEvent(event);
            }}
            className="rounded-full bg-background/80 p-2 text-foreground backdrop-blur-md shadow-sm transition-transform hover:scale-110 active:scale-90"
            title="Compare item"
            aria-label="Compare"
          >
            <Tag className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>

          {/* Favorite Heart Button */}
          <button
            onClick={handleFavoriteClick}
            disabled={isTogglingFav}
            className="rounded-full bg-background/80 p-2 text-foreground backdrop-blur-md shadow-sm transition-transform hover:scale-110 active:scale-90"
            title={fav ? "Remove from Saved" : "Save Listing"}
            aria-label="Favorite"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                fav ? "fill-primary text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}
            />
          </button>
        </div>
      </Link>

      {/* Content Area */}
      <div className="mt-3 flex flex-1 flex-col justify-between space-y-2.5">
        <div className="space-y-1">
          {/* Category, City & Delivers to you */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold text-primary">{listing.category_name}</span>
            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
              {listing.delivery_available && (
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold">
                  Delivers to you
                </span>
              )}
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                {listing.city}
              </span>
            </div>
          </div>

          {/* Title */}
          <Link href={`/listings/${listing.id}`}>
            <h3 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary leading-snug">
              {listing.title}
            </h3>
          </Link>
        </div>

        {/* Bottom Price & Seller Info */}
        <div className="pt-2 border-t border-border/60 flex items-end justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Price
            </span>
            {listing.price_type === "ask_price" ? (
              <span className="text-sm font-black text-accent-blue">
                Ask for Price <span className="text-[10px] font-normal text-muted-foreground">(ዋጋ ይጠይቁ)</span>
              </span>
            ) : (
              <div className="flex flex-col">
                {listing.old_price && listing.old_price > listing.price && (
                  <span className="text-[11px] font-semibold text-muted-foreground line-through">
                    {listing.old_price.toLocaleString()} ETB
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-black text-foreground">
                    {listing.price.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-primary">ETB</span>
                </div>
              </div>
            )}
          </div>

          {/* Seller Verified & Badge Levels */}
          <div className="flex items-center gap-1">
            {listing.seller_is_top && (
              <div
                className="flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30"
                title="Top Rated Supplier"
              >
                ★ <span>Top</span>
              </div>
            )}
            {listing.seller_license_verified && (
              <div
                className="flex items-center gap-0.5 rounded-full bg-accent-blue/15 px-1.5 py-0.5 text-[9px] font-bold text-accent-blue border border-accent-blue/30"
                title="Trade License Verified"
              >
                <ShieldCheck className="h-3 w-3" />
                <span>License</span>
              </div>
            )}
            {listing.seller_id_verified && !listing.seller_license_verified && (
              <div
                className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                title="ID Verified"
              >
                <ShieldCheck className="h-3 w-3" />
                <span>ID</span>
              </div>
            )}
            {listing.seller_is_verified && !listing.seller_id_verified && !listing.seller_license_verified && (
              <div
                className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                title="Verified Artisan / Seller"
              >
                <ShieldCheck className="h-3 w-3" />
                <span>Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Owner Controls (in My Posts view) */}
        {showOwnerControls && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-border/80 text-xs">
            <button
              onClick={() => onEdit?.(listing)}
              className="flex-1 rounded-xl bg-secondary py-1.5 text-center font-bold text-foreground hover:bg-secondary/80 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onToggleSold?.(listing)}
              className={`flex-1 rounded-xl py-1.5 text-center font-bold text-white transition-colors ${
                isSold ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSold ? "Relist Active" : "Mark Sold"}
            </button>
            <button
              onClick={() => onDelete?.(listing)}
              className="rounded-xl bg-destructive/10 px-2.5 py-1.5 text-center font-bold text-destructive hover:bg-destructive/20 transition-colors"
              title="Delete Listing"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
