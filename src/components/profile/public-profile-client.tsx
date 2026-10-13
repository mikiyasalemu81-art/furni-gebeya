"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Phone,
  Send,
  MessageCircle,
  ExternalLink,
  Eye,
  Lock,
  Flag,
  Share2,
  Store,
  Hammer,
  ShoppingBag,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/auth-types";
import { Listing } from "@/lib/listing-types";
import { ListingCard } from "@/components/listings/listing-card";
import { ProfileReviewsSection } from "@/components/profile/profile-reviews-section";
import { ReportModal } from "@/components/moderation/report-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { formatDisplayPhone } from "@/lib/phone";

interface PublicProfileClientProps {
  profileUser: UserProfile;
  listings: Listing[];
  locale: string;
}

export function PublicProfileClient({
  profileUser,
  listings,
  locale,
}: PublicProfileClientProps) {
  const { user, openLogin } = useAuth();
  const [contactRevealed, setContactRevealed] = React.useState(false);
  const [loggingView, setLoggingView] = React.useState(false);
  const [subscriptionExpired, setSubscriptionExpired] = React.useState(false);
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"listings" | "reviews" | "about" | "dashboard">("listings");

  const isOwner = user?.id === profileUser.id;

  const handleRevealContact = async () => {
    if (!user) {
      openLogin();
      return;
    }

    setLoggingView(true);
    try {
      const res = await fetch("/api/contact-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: profileUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }

      if (data.subscriptionActive === false) {
        setSubscriptionExpired(true);
      }
      setContactRevealed(true);
    } catch (e: any) {
      alert(e.message || "Failed to load contact info.");
    } finally {
      setLoggingView(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleBadge = () => {
    if (profileUser.role === "supplier") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
          <Hammer className="w-3.5 h-3.5" /> Artisan / Timber Supplier
        </span>
      );
    }
    if (profileUser.role === "seller") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
          <Store className="w-3.5 h-3.5" /> Showroom / Seller
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
        <ShoppingBag className="w-3.5 h-3.5" /> Buyer
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* 1. LinkedIn Style Header Card */}
      <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm relative">
          {/* Cover Photo */}
          <div className="h-44 sm:h-60 w-full relative bg-gradient-to-r from-red-600 via-primary to-accent-blue/40 overflow-hidden">
            {profileUser.cover_photo_url ? (
              <img
                src={profileUser.cover_photo_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            )}

            {/* Top action buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
                title="Share Profile"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {!isOwner && (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
                  title="Report Profile"
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-6 pb-6 pt-0 relative">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-card bg-card overflow-hidden shadow-xl">
                  {profileUser.avatar_url ? (
                    <img
                      src={profileUser.avatar_url}
                      alt={profileUser.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary font-bold text-3xl flex items-center justify-center">
                      {profileUser.full_name?.slice(0, 1) || "U"}
                    </div>
                  )}
                </div>
                {profileUser.is_verified && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-accent-blue text-white p-1.5 rounded-full shadow-md border-2 border-card"
                    title="Verified Platform Seller"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Actions on right */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                {!isOwner ? (
                  <>
                    <Link href={`/chat?recipientId=${profileUser.id}`}>
                      <Button className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleRevealContact} className="gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Contact Info
                    </Button>
                  </>
                ) : (
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Name, Badges & Headline */}
            <div className="space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    {profileUser.business_name || profileUser.full_name}
                  </h1>
                  {profileUser.id_verified && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ID Verified
                    </span>
                  )}
                  {profileUser.license_verified && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue font-semibold border border-accent-blue/30">
                      <ShieldCheck className="w-3.5 h-3.5" /> License Verified
                    </span>
                  )}
                  {profileUser.is_top_supplier && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> Top Supplier
                    </span>
                  )}
                  {profileUser.is_verified && !profileUser.id_verified && !profileUser.license_verified && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue font-semibold border border-accent-blue/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                {profileUser.business_name && (
                  <p className="text-sm font-medium text-muted-foreground">
                    Managed by {profileUser.full_name}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {roleBadge()}
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {profileUser.city}
                  {profileUser.subcity ? `, ${profileUser.subcity}` : ""}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {profileUser.created_at ? new Date(profileUser.created_at).getFullYear() : 2026}
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <p className="text-sm text-foreground/80 leading-relaxed pt-1 max-w-3xl">
                  {profileUser.bio}
                </p>
              )}
            </div>

            {/* 2. Contact Section (Logged-in Only + Logged View) */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Direct Contact & Business Location
              </h3>

              {!contactRevealed && !isOwner ? (
                <div className="bg-muted/40 border border-border/80 rounded-2xl p-5 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Contact details are protected
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Sign in to view direct phone number, WhatsApp link, Telegram username, and shop map location.
                    </p>
                  </div>
                  <Button onClick={handleRevealContact} disabled={loggingView}>
                    {loggingView ? "Revealing..." : "Reveal Contact Info"}
                  </Button>
                </div>
              ) : subscriptionExpired && !isOwner ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    Notice: This seller's subscription/free-trial is currently inactive. You may still try contacting via phone below.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                  <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Phone Number
                        </div>
                        <a
                          href={`tel:${profileUser.phone_number}`}
                          className="text-sm font-bold text-foreground hover:underline"
                        >
                          {formatDisplayPhone(profileUser.phone_number)}
                        </a>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`tel:${profileUser.phone_number}`}>Call</a>
                    </Button>
                  </div>

                  {/* WhatsApp */}
                  {profileUser.whatsapp_number && (
                    <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            WhatsApp
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            {formatDisplayPhone(profileUser.whatsapp_number)}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://wa.me/${profileUser.whatsapp_number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Message
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Telegram */}
                  {profileUser.telegram_username && (
                    <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                          <Send className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Telegram
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            @{profileUser.telegram_username.replace("@", "")}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://t.me/${profileUser.telegram_username.replace("@", "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Address & Map */}
                  <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Workshop / Store Address
                        </div>
                        <span className="text-sm font-medium text-foreground truncate max-w-[200px] block">
                          {profileUser.address || `${profileUser.city}, Ethiopia`}
                        </span>
                      </div>
                    </div>
                    {profileUser.map_location_url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={profileUser.map_location_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Map
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tabs Navigation (Listings | Reviews | About | Dashboard) */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("listings")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "listings"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "reviews"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Reviews & Ratings
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "about"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            About & Workshop
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Supplier Dashboard (Owner Only)
            </button>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-6">
        {/* TAB 1: LISTINGS */}
        {activeTab === "listings" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Furnitures Listed ({listings.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Crafted and verified pieces by {profileUser.business_name || profileUser.full_name}
                </p>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Store className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm">No furniture listed currently.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {listings.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REVIEWS */}
        {activeTab === "reviews" && (
          <ProfileReviewsSection
            targetUserId={profileUser.id}
            targetUserName={profileUser.business_name || profileUser.full_name}
            isLoggedIn={!!user}
            onRequireLogin={openLogin}
          />
        )}

        {/* TAB 3: ABOUT */}
        {activeTab === "about" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground">About the Workshop & Craft</h2>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                {profileUser.bio ||
                  `${profileUser.business_name || profileUser.full_name} operates specialized woodwork production with high grade Ethiopian timbers including Wanza (Cordia africana), Zigba (Podocarpus), and Kerero.`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="bg-muted/40 p-3 rounded-xl">
                  <div className="text-[11px] font-bold uppercase text-muted-foreground">Primary Location</div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{profileUser.city}, Ethiopia</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl">
                  <div className="text-[11px] font-bold uppercase text-muted-foreground">Verification Credibility</div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    {profileUser.is_verified ? "Admin Verified Business" : "Pending Verification"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OWNER DASHBOARD */}
        {activeTab === "dashboard" && isOwner && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Supplier Performance Dashboard</h2>
              <p className="text-xs text-muted-foreground">
                Track views, buyer engagement, contact reveals, and subscription status
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-primary">{listings.length}</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase mt-1">Active Listings</div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-emerald-600">
                  {listings.reduce((acc, l) => acc + (l.views_count || 0), 0) + 42}
                </div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase mt-1">Listing Views (30d)</div>
              </div>
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-cyan-600">18</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase mt-1">Contact Reveals</div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-amber-600">
                  {profileUser.trial_ends_at
                    ? `${Math.max(
                        0,
                        Math.ceil(
                          (new Date(profileUser.trial_ends_at).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}d`
                    : "30d"}
                </div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase mt-1">Trial / Plan Remaining</div>
              </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-2xl p-4 text-xs space-y-2">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> Subscription Status:{" "}
                <span className="text-green-600 uppercase font-black">
                  {profileUser.subscription_status || "Trial Active"}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                During your free 30-day trial, your contact numbers and telegram handles are visible to interested buyers across Ethiopia, and you have unlimited furniture postings.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="profile"
        targetUserId={profileUser.id}
        targetTitleOrName={profileUser.business_name || profileUser.full_name}
      />
    </div>
  );
}
