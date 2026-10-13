"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  PlusCircle,
  Layers,
  LogIn,
  ShieldCheck,
  Clock,
  Lock,
  Heart,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { Listing } from "@/lib/listing-types";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFormModal } from "@/components/listings/listing-form-modal";
import { ListingGridSkeleton } from "@/components/skeletons/listing-card-skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { VerificationStatusBanner } from "@/components/verification/verification-status-banner";

export default function MyPostsPage() {
  const t = useTranslations("myPosts");
  const { user, openLogin } = useAuth();

  const [activeTab, setActiveTab] = React.useState<"all" | "active" | "sold">("all");
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modal for Create / Edit
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingListing, setEditingListing] = React.useState<Listing | null>(null);

  const fetchUserListings = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("sellerId", user.id);
      if (activeTab !== "all") params.set("status", activeTab);

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (e) {
      console.error("[Failed to load user listings]", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab]);

  React.useEffect(() => {
    fetchUserListings();
  }, [fetchUserListings]);

  // If user is a Buyer: show the Saved Items recommendation as per the spec
  if (user && user.role === "buyer") {
    return (
      <div className="container mx-auto px-4 py-12 text-center space-y-4 max-w-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Heart className="h-8 w-8 fill-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Buyer Account</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          As a registered Buyer, your saved and favorite furniture pieces are managed in your <strong>Saved</strong> tab.
          If you want to sell or supply handcrafted furniture, switch your role to <strong>Seller</strong> or <strong>Supplier</strong> in Profile settings.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/saved">
            <Button className="gap-2 font-bold w-full sm:w-auto">
              <Heart className="h-4 w-4" />
              Go to Saved Furniture
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" className="gap-2 font-bold w-full sm:w-auto">
              Manage Role in Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isApproved = Boolean(user && (user.is_verified || user.role === "admin"));
  const isPending = user?.verification_status === "pending";

  const handleOpenCreate = () => {
    setEditingListing(null);
    setModalOpen(true);
  };

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setModalOpen(true);
  };

  const handleToggleSold = async (listing: Listing) => {
    const isSold = listing.status === "sold";
    try {
      const res = await fetch(`/api/listings/${listing.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSold: !isSold }),
      });
      if (res.ok) {
        fetchUserListings();
      }
    } catch (e) {
      console.error("[Failed to update status]", e);
    }
  };

  const handleDelete = async (listing: Listing) => {
    if (!confirm(`Are you sure you want to delete "${listing.title}"?`)) return;

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUserListings();
      }
    } catch (e) {
      console.error("[Failed to delete listing]", e);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t("title")}
            </h1>
            {isApproved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track, publish, update, and mark your furniture pieces as sold.
          </p>
        </div>

        {/* "+ New listing" Button */}
        {user ? (
          <div className="flex flex-col items-end gap-1">
            <Button
              onClick={handleOpenCreate}
              disabled={!isApproved}
              className={`gap-2 font-bold shadow-md ${
                !isApproved ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {!isApproved ? <Lock className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              <span>+ New listing</span>
            </Button>
            {!isApproved && (
              <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3 animate-pulse" />
                {isPending ? "Pending verification approval" : "Verification required to post"}
              </span>
            )}
          </div>
        ) : (
          <Button onClick={openLogin} className="gap-2 font-bold shadow-sm">
            <LogIn className="h-4 w-4" />
            Sign In to Post
          </Button>
        )}
      </div>

      {/* Verification Status Banner (Stage 3 Integration) */}
      <VerificationStatusBanner />

      {/* Filter Tabs (All, Active, Sold) */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {[
          { id: "all", label: "All Posts" },
          { id: "active", label: "Active Listings" },
          { id: "sold", label: "Sold" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? "bg-secondary text-foreground font-black shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings Content */}
      <div className="space-y-4">
        {isLoading ? (
          <ListingGridSkeleton count={4} />
        ) : listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-base font-bold text-foreground">No listings found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isApproved
                ? "Click '+ New listing' to post your handcrafted or showroom furniture."
                : "Upload your business verification documents to unlock listing publication."}
            </p>
            {isApproved && (
              <Button onClick={handleOpenCreate} className="gap-2 text-xs font-bold mt-2">
                <PlusCircle className="h-4 w-4" />
                Create First Listing
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                showOwnerControls={true}
                onEdit={handleEdit}
                onToggleSold={handleToggleSold}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <ListingFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchUserListings()}
        initialData={editingListing}
      />
    </div>
  );
}
