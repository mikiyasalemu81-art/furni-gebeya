"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Listing } from "@/lib/listing-types";
import { useAuth } from "@/components/auth/auth-provider";
import {
  ArrowLeft,
  Heart,
  Phone,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Truck,
  Layers,
  Ruler,
  Calendar,
  Share2,
  Eye,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingGridSkeleton } from "@/components/skeletons/listing-card-skeleton";
import { formatDisplayPhone } from "@/lib/phone";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, openLogin } = useAuth();

  const [listing, setListing] = React.useState<Listing | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0);
  const [isFavorited, setIsFavorited] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTogglingFav, setIsTogglingFav] = React.useState(false);

  React.useEffect(() => {
    async function fetchListingData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setListing(data.listing);
        }

        // Check favorite status if logged in
        if (user) {
          const favRes = await fetch(`/api/favorites?listingId=${id}`);
          if (favRes.ok) {
            const favData = await favRes.json();
            setIsFavorited(Boolean(favData.isFavorited));
          }
        }
      } catch (e) {
        console.error("[Failed to load listing]", e);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchListingData();
    }
  }, [id, user]);

  const handleFavorite = async () => {
    if (!user) {
      openLogin();
      return;
    }
    setIsTogglingFav(true);
    const nextState = !isFavorited;
    setIsFavorited(nextState);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFavorited(data.isFavorited);
      } else {
        setIsFavorited(!nextState);
      }
    } catch {
      setIsFavorited(!nextState);
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Listing link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 space-y-6 max-w-5xl">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-black text-foreground">Listing Not Found</h2>
        <p className="text-xs text-muted-foreground">
          This furniture item may have been removed or is no longer available.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home Feed
          </Button>
        </Link>
      </div>
    );
  }

  const currentPhoto = listing.images[selectedPhotoIndex]?.url || listing.images[0]?.url;
  const isSold = listing.status === "sold";

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 space-y-8 max-w-5xl">
      {/* Back button and share */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="h-8 text-xs font-semibold gap-1.5 rounded-full"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleFavorite}
            disabled={isTogglingFav}
            className="h-8 text-xs font-semibold gap-1.5 rounded-full"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorited ? "fill-primary text-primary" : "text-muted-foreground"
              }`}
            />
            {isFavorited ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Photo Gallery (Left) & Product Details (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Photo Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-secondary shadow-md">
            <img
              src={currentPhoto}
              alt={listing.title}
              className={`h-full w-full object-cover transition-all ${
                isSold ? "grayscale contrast-125 opacity-75" : ""
              }`}
            />

            {/* SOLD Overlay */}
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <span className="rounded-2xl bg-red-600 px-6 py-2 text-sm font-black uppercase tracking-widest text-white shadow-2xl rotate-[-6deg]">
                  SOLD / የተሸጠ
                </span>
              </div>
            )}

            {/* Condition Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${
                  listing.condition === "new" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                }`}
              >
                {listing.condition === "new" ? "Brand New (አዲስ)" : "Used (ያገለገለ)"}
              </span>
            </div>
          </div>

          {/* Thumbnails (Up to 4 Photos) */}
          {listing.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                    selectedPhotoIndex === idx
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Contact */}
        <div className="space-y-6">
          {/* Header & Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold text-primary">{listing.category_name}</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {listing.views_count} views
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
              {listing.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span>
                {listing.city}
                {listing.subcity ? `, ${listing.subcity}` : ""}
                {listing.specific_location ? ` (${listing.specific_location})` : ""}
              </span>
            </div>
          </div>

          {/* Pricing Banner */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Price
              </span>
              {listing.price_type === "ask_price" ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-accent-blue">Contact for Price</span>
                  <span className="text-xs font-bold text-muted-foreground">(ዋጋ ይጠይቁ)</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-foreground">
                    {listing.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-primary">ETB</span>
                </div>
              )}
            </div>

            {listing.delivery_available && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Truck className="h-4 w-4" />
                <span>Delivery Available</span>
              </div>
            )}
          </div>

            {/* Seller / Artisan Card */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
              <Link
                href={`/profile/${listing.seller_id}`}
                className="flex items-center gap-4 group transition-colors"
              >
                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-secondary border border-border flex items-center justify-center flex-shrink-0 group-hover:ring-2 ring-primary">
                  {listing.seller_avatar_url ? (
                    <img src={listing.seller_avatar_url} alt={listing.seller_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-primary">{listing.seller_name.charAt(0)}</span>
                  )}
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                      {listing.seller_name}
                    </h3>
                    {listing.seller_is_verified && (
                      <span
                        className="rounded-full bg-emerald-500/15 p-0.5 text-emerald-600 dark:text-emerald-400"
                        title="Verified Supplier / Seller"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {listing.seller_role === "supplier" ? "Artisan / Timber Supplier" : "Furniture Seller"} • View Public Profile →
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {formatDisplayPhone(listing.seller_phone)}
                  </p>
                </div>
              </Link>

              {/* Direct Contact Actions */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Link
                  href={`/chat?recipientId=${listing.seller_id}&listingId=${listing.id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
                >
                  <MessageSquare className="h-4 w-4" />
                  In-App Chat
                </Link>

                <a
                  href={`tel:${listing.seller_phone}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 active:scale-95 transition-all border border-border"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  Call
                </a>

                <a
                  href={`sms:${listing.seller_phone}?body=Hello, I am interested in your listing: ${encodeURIComponent(
                    listing.title
                  )} on Furni Gebeya.`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 active:scale-95 transition-all border border-border"
                >
                  <Sparkles className="h-4 w-4 text-accent-cyan" />
                  SMS
                </a>
              </div>
            </div>

          {/* Specifications Table */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Specifications & Materials
            </h4>
            <div className="divide-y divide-border/60 text-xs">
              {listing.wood_type && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Wood Type</span>
                  <span className="font-bold text-foreground">{listing.wood_type}</span>
                </div>
              )}
              {listing.material && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Material / Finish</span>
                  <span className="font-bold text-foreground">{listing.material}</span>
                </div>
              )}
              {listing.dimensions && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Dimensions</span>
                  <span className="font-bold text-foreground">{listing.dimensions}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Condition</span>
                <span className="font-bold capitalize text-foreground">{listing.condition}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Location</span>
                <span className="font-bold text-foreground">{listing.city}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Description
            </h4>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line rounded-2xl bg-secondary/30 p-4 border border-border">
              {listing.description}
            </p>
          </div>
        </div>
      </div>

      {/* Similar Items & More from Supplier */}
      <div className="pt-8 border-t border-border space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground">
            More from {listing.seller_name}
          </h3>
          <Link
            href={`/profile/${listing.seller_id}`}
            className="text-xs font-bold text-primary hover:underline"
          >
            View Supplier Profile →
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Explore authentic furniture crafted by {listing.seller_name} in {listing.city}.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href={`/profile/${listing.seller_id}`}>
              <Button size="sm" variant="outline" className="text-xs">
                Visit Supplier Showcase
              </Button>
            </Link>
            <Link href="/">
              <Button size="sm" variant="ghost" className="text-xs">
                Browse Similar in {listing.category_name}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
