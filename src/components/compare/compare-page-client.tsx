"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import {
  Scale,
  X,
  ShieldCheck,
  MapPin,
  Check,
  ArrowLeft,
  Truck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/components/compare/compare-provider";
import { CompareTableSkeleton } from "@/components/skeletons/advanced-skeletons";

export function ComparePageClient({ locale }: { locale: string }) {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <CompareTableSkeleton />
      </div>
    );
  }

  if (compareList.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Scale className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No furniture pieces to compare</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tap the tag/compare icon on any furniture card while browsing to compare prices, timber types, dimensions, and seller badges side by side.
        </p>
        <Button asChild className="rounded-2xl">
          <Link href="/">Browse Furniture Feed</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            Furniture Comparison ({compareList.length}/3)
          </h1>
          <p className="text-xs text-muted-foreground">
            Side-by-side evaluation of specifications, timber, pricing, and workshop credibility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearCompare} className="rounded-xl text-xs">
            Clear All
          </Button>
          <Button asChild size="sm" className="rounded-xl text-xs">
            <Link href="/">Add More Items</Link>
          </Button>
        </div>
      </div>

      {/* Comparison Table Container */}
      <div className="overflow-x-auto pb-4">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="p-4 w-44 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Feature / Piece
              </th>
              {compareList.map((item) => (
                <th key={item.id} className="p-4 min-w-[200px] align-top">
                  <div className="relative group space-y-2">
                    <button
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-background/90 text-muted-foreground hover:text-red-500 shadow-md border border-border"
                      title="Remove from comparison"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <Link href={`/listings/${item.id}`} className="block">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-secondary">
                        <img
                          src={
                            item.images.find((i) => i.is_cover)?.url ||
                            item.images[0]?.url ||
                            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"
                          }
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-2 line-clamp-2 leading-snug hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {/* Price Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                Price
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4">
                  {item.price_type === "ask_price" ? (
                    <span className="text-sm font-black text-accent-blue">Ask for Price</span>
                  ) : (
                    <div>
                      <span className="text-lg font-black text-foreground">
                        {item.price.toLocaleString()}
                      </span>{" "}
                      <span className="text-xs font-bold text-primary">ETB</span>
                      {item.old_price && item.old_price > item.price && (
                        <div className="text-[11px] text-muted-foreground line-through">
                          {item.old_price.toLocaleString()} ETB
                        </div>
                      )}
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Condition Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                Condition
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4 font-semibold capitalize text-foreground">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.condition === "new"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {item.condition}
                  </span>
                </td>
              ))}
            </tr>

            {/* Wood / Material Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                Timber / Material
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4 font-medium text-foreground">
                  {item.wood_type || item.material || "Standard Ethiopian Hardwood"}
                </td>
              ))}
            </tr>

            {/* Dimensions Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                Dimensions (L×W×H)
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4 font-mono text-xs text-foreground">
                  {item.dimensions || "Contact seller for exact dimensions"}
                </td>
              ))}
            </tr>

            {/* Color & Finish Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                Color & Finish
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4 font-medium text-foreground">
                  {item.color || "Natural Polish"}
                </td>
              ))}
            </tr>

            {/* Location Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                City / Location
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4 text-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    {item.city}
                    {item.subcity ? `, ${item.subcity}` : ""}
                  </span>
                </td>
              ))}
            </tr>

            {/* Delivery Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                Delivery Option
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4">
                  {item.delivery_available ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-xl">
                      <Truck className="w-3.5 h-3.5" /> Delivers across regions
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Self-pickup only</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Seller Badge & Credibility Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                Seller Credibility
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4 space-y-1">
                  <div className="font-bold text-foreground text-xs">{item.seller_name}</div>
                  <div className="flex flex-wrap items-center gap-1">
                    {item.seller_is_top && (
                      <span className="text-[10px] font-bold bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/30">
                        ★ Top Supplier
                      </span>
                    )}
                    {item.seller_license_verified && (
                      <span className="text-[10px] font-bold bg-accent-blue/15 text-accent-blue px-2 py-0.5 rounded-full border border-accent-blue/30 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> License Verified
                      </span>
                    )}
                    {item.seller_id_verified && !item.seller_license_verified && (
                      <span className="text-[10px] font-bold bg-green-500/15 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> ID Verified
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Direct Action Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-4 font-bold text-xs uppercase text-muted-foreground bg-muted/20">
                Action
              </td>
              {compareList.map((item) => (
                <td key={item.id} className="p-4">
                  <Button asChild size="sm" className="w-full rounded-xl text-xs font-bold">
                    <Link href={`/listings/${item.id}`}>View Item Details</Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
