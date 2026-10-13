"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import {
  Sparkles,
  MapPin,
  Clock,
  Plus,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WantedRequest } from "@/lib/marketplace-types";
import { CATEGORIES_LIST } from "@/lib/listing-types";
import { useAuth } from "@/components/auth/auth-provider";
import { WantedFormModal } from "@/components/wanted/wanted-form-modal";
import { WantedCardSkeleton } from "@/components/skeletons/advanced-skeletons";

export function WantedBoardClient({ locale }: { locale: string }) {
  const { user, openLogin } = useAuth();
  const [requests, setRequests] = React.useState<WantedRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedCity, setSelectedCity] = React.useState("all");

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/wanted", window.location.origin);
      if (selectedCategory !== "all") url.searchParams.set("category", selectedCategory);
      if (selectedCity !== "all") url.searchParams.set("city", selectedCity);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCity]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreated = (newReq: WantedRequest) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  const handleUpdateStatus = async (requestId: string, status: "fulfilled" | "closed") => {
    try {
      const res = await fetch("/api/wanted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          requestId,
          status,
        }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status } : r))
        );
      }
    } catch {
      alert("Failed updating request status.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Buyer Wanted Board / የፈላጊዎች ሰሌዳ
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Looking for Custom or Hard-to-Find Furniture?
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mt-1">
            Post what you are looking for. Verified carpenters, workshops, and furniture shops can respond directly with quotes and photos.
          </p>
        </div>

        <Button
          onClick={() => {
            if (!user) openLogin();
            else setModalOpen(true);
          }}
          className="shrink-0 rounded-2xl h-12 px-6 gap-2 text-sm font-bold shadow-md shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Post a Request
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-2xl p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-2">
          <Filter className="w-4 h-4" /> Filters:
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          {CATEGORIES_LIST.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_en}
            </option>
          ))}
        </select>

        {/* City Filter */}
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Ethiopian Cities</option>
          <option value="Addis Ababa">Addis Ababa</option>
          <option value="Hawassa">Hawassa</option>
          <option value="Adama">Adama</option>
          <option value="Bahir Dar">Bahir Dar</option>
          <option value="Dire Dawa">Dire Dawa</option>
        </select>
      </div>

      {/* Requests Feed */}
      {loading ? (
        <WantedCardSkeleton />
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl p-8 space-y-3">
          <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No active wanted requests found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Be the first to post a furniture piece you're searching for!
          </p>
          <Button
            onClick={() => {
              if (!user) openLogin();
              else setModalOpen(true);
            }}
            variant="outline"
            className="rounded-xl mt-2"
          >
            Post a Request
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {requests.map((req) => {
            const isOwner = user?.id === req.user_id;
            const daysLeft = Math.max(
              0,
              Math.ceil(
                (new Date(req.expires_at).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );

            return (
              <div
                key={req.id}
                className="bg-card border border-border rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                        {req.category_name}
                      </span>
                      <h3 className="text-base font-bold text-foreground leading-snug">
                        {req.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        req.status === "active"
                          ? "bg-green-500/10 text-green-600 border border-green-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/80 leading-relaxed mb-4 line-clamp-3">
                    {req.description}
                  </p>

                  {/* Reference Images */}
                  {req.images && req.images.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {req.images.map((img, i) => (
                        <div
                          key={i}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-border/80 bg-muted shrink-0"
                        >
                          <img
                            src={img}
                            alt="Reference furniture"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Key metadata badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {req.city}
                    </span>
                    <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-lg font-medium">
                      Qty: {req.quantity}
                    </span>
                    {req.budget_max && (
                      <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-lg font-bold text-foreground">
                        Budget: {req.budget_min ? `${req.budget_min.toLocaleString()} - ` : ""}
                        {req.budget_max.toLocaleString()} ETB
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-lg text-[11px]">
                      <Clock className="w-3 h-3" /> {daysLeft}d left
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Requested by: </span>
                    <span className="font-semibold text-foreground">{req.user_name}</span>
                  </div>

                  {isOwner ? (
                    <div className="flex items-center gap-1">
                      {req.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(req.id, "fulfilled")}
                            className="h-8 text-xs text-green-600 gap-1 rounded-xl"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(req.id, "closed")}
                            className="h-8 text-xs text-muted-foreground gap-1 rounded-xl"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Close
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <Button size="sm" asChild className="rounded-xl text-xs gap-1.5 h-9">
                      <Link
                        href={`/chat?recipientId=${req.user_id}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> I Can Supply This
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <WantedFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
