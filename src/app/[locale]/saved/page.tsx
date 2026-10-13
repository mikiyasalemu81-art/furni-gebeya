"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Listing } from "@/lib/listing-types";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingGridSkeleton } from "@/components/skeletons/listing-card-skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { Heart, ShoppingBag, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SavedPage() {
  const { user, openLogin } = useAuth();
  const [favorites, setFavorites] = React.useState<Listing[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchFavorites = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (e) {
      console.error("[Failed to fetch favorites]", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFav = (listingId: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== listingId));
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Saved Furniture
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Keep track of your favorite handcrafted tables, sofas, beds, and artisan pieces.
        </p>
      </div>

      {/* Guest Notice */}
      {!user && (
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
          <Heart className="h-10 w-10 text-primary mx-auto opacity-75" />
          <h2 className="text-lg font-bold text-foreground">Sign in to save furniture</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Log in with your phone number to bookmark items and access them across all your devices.
          </p>
          <Button onClick={openLogin} className="gap-2 font-bold shadow-sm">
            <LogIn className="h-4 w-4" />
            Sign In with Phone
          </Button>
        </div>
      )}

      {/* Content */}
      {user && (
        <>
          {isLoading ? (
            <ListingGridSkeleton count={4} />
          ) : favorites.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">No saved furniture yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Click the heart icon on any furniture card while exploring the marketplace to save pieces here.
                </p>
              </div>
              <Link href="/">
                <Button className="gap-2 font-bold">
                  Browse Marketplace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {favorites.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorited={true}
                  onToggleFavorite={handleToggleFav}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
