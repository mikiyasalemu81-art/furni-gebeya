"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  SlidersHorizontal,
  BedDouble,
  Sofa,
  Utensils,
  Briefcase,
  Hammer,
  TreePine,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Listing, CATEGORIES_LIST } from "@/lib/listing-types";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingGridSkeleton } from "@/components/skeletons/listing-card-skeleton";
import { Button } from "@/components/ui/button";

const ethiopianCities = [
  "All Cities",
  "Addis Ababa",
  "Hawassa",
  "Adama (Nazret)",
  "Bahir Dar",
  "Dire Dawa",
  "Bishoftu",
  "Mekelle",
  "Jimma",
  "Gondar",
];

const materialsList = [
  "All Materials",
  "Wanza (ዋንዛ)",
  "Tid (ጥድ)",
  "Zigba (ዝግባ)",
  "Solid Hardwood",
  "Velvet Fabric",
  "Leather",
  "Metal / Steel",
  "Rattan / Wicker",
];

export default function HomePage() {
  const t = useTranslations("home");
  const commonT = useTranslations("common");

  // Filter States
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedCity, setSelectedCity] = React.useState<string>("All Cities");
  const [selectedCondition, setSelectedCondition] = React.useState<"all" | "new" | "used">("all");
  const [selectedMaterial, setSelectedMaterial] = React.useState<string>("All Materials");
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [minPrice, setMinPrice] = React.useState<string>("");
  const [maxPrice, setMaxPrice] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");

  // Modal for extra filters (mobile friendly)
  const [filterModalOpen, setFilterModalOpen] = React.useState(false);

  // Data & Pagination
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Categories metadata
  const categoryIcons = [
    { slug: "living-room", icon: Sofa },
    { slug: "bedroom", icon: BedDouble },
    { slug: "dining-room", icon: Utensils },
    { slug: "office", icon: Briefcase },
    { slug: "custom-woodcraft", icon: Hammer },
    { slug: "outdoor", icon: TreePine },
  ];

  const fetchListingsData = React.useCallback(
    async (targetPage = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedCity !== "All Cities") params.set("city", selectedCity);
        if (selectedCondition !== "all") params.set("condition", selectedCondition);
        if (selectedMaterial !== "All Materials") params.set("material", selectedMaterial);
        if (verifiedOnly) params.set("verifiedOnly", "true");
        if (minPrice && parseFloat(minPrice) > 0) params.set("minPrice", minPrice);
        if (maxPrice && parseFloat(maxPrice) > 0) params.set("maxPrice", maxPrice);
        params.set("sort", sortBy);
        params.set("page", targetPage.toString());
        params.set("limit", "12");

        const res = await fetch(`/api/listings?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setListings((prev) => [...prev, ...data.listings]);
          } else {
            setListings(data.listings || []);
          }
          setTotalCount(data.total || 0);
          setHasMore(Boolean(data.hasMore));
          setPage(targetPage);
        }
      } catch (err) {
        console.error("[Failed to fetch listings]", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      searchTerm,
      selectedCategory,
      selectedCity,
      selectedCondition,
      selectedMaterial,
      verifiedOnly,
      minPrice,
      maxPrice,
      sortBy,
    ]
  );

  React.useEffect(() => {
    fetchListingsData(1, false);
  }, [fetchListingsData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListingsData(1, false);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedCity("All Cities");
    setSelectedCondition("all");
    setSelectedMaterial("All Materials");
    setVerifiedOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedCity !== "All Cities" ? 1 : 0) +
    (selectedCondition !== "all" ? 1 : 0) +
    (selectedMaterial !== "All Materials" ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0);

  const [homeSubTab, setHomeSubTab] = React.useState<"for_you" | "latest" | "featured" | "near_me">("for_you");

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 space-y-6 max-w-7xl">
      {/* 4 Home Sub-Tabs: For you | Latest | Featured | Near me */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
        {[
          { id: "for_you", label: "For you" },
          { id: "latest", label: "Latest" },
          { id: "featured", label: "Featured" },
          { id: "near_me", label: "Near me" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setHomeSubTab(tab.id as any);
              if (tab.id === "latest") setSortBy("newest");
              if (tab.id === "featured") setSortBy("popular");
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              homeSubTab === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-secondary p-6 sm:p-10 border border-border shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-accent-cyan/15 blur-3xl dark:bg-accent-cyan/20" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ethiopian Furniture Marketplace</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            {t("heroTitle")}
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {t("heroSubtitle")}
          </p>

          {/* Interactive Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="relative flex items-center rounded-2xl border border-border bg-background/95 p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary backdrop-blur-md">
              <Search className="ml-3 h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, wood (Wanza, Tid, Zigba), sofa, desk, city..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterModalOpen(true)}
                  className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                <Button type="submit" size="sm" className="h-9 px-4 text-xs font-bold rounded-xl">
                  Search
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Browse by Category
          </h2>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All Categories
            </button>
          )}
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all flex-shrink-0 ${
              selectedCategory === "all"
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span>All Categories</span>
          </button>

          {CATEGORIES_LIST.map((cat) => {
            const iconObj = categoryIcons.find((c) => c.slug === cat.slug);
            const Icon = iconObj ? iconObj.icon : Sofa;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all flex-shrink-0 ${
                  isSelected
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-primary"}`} />
                <span>{cat.name_en}</span>
                <span className="text-[10px] font-normal opacity-80">({cat.name_am})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter Chips & Sorting Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Left: Active Filter Pills & Verified Only Switch */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Verified Only Toggle */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
              verifiedOnly
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified Artisans Only</span>
            {verifiedOnly && <Check className="h-3 w-3" />}
          </button>

          {/* Condition Quick Filters */}
          <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
            {(["all", "new", "used"] as const).map((cond) => (
              <button
                key={cond}
                onClick={() => setSelectedCondition(cond)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize transition-all ${
                  selectedCondition === cond
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cond === "all" ? "All Conditions" : cond}
              </button>
            ))}
          </div>

          {/* Clear Filters Button if any active */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline pl-1"
            >
              <X className="h-3 w-3" />
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Right: Sort By Selector & Results Count */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground">
            <strong>{totalCount}</strong> pieces found
          </span>

          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs shadow-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </section>

      {/* Listings Grid with Skeleton Loaders */}
      <section className="space-y-6">
        {isLoading ? (
          <ListingGridSkeleton count={8} />
        ) : listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3">
            <Sofa className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-base font-bold text-foreground">No furniture found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We couldn't find any listings matching your search criteria. Try removing some filters or searching for another term.
            </p>
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs font-bold">
              Reset All Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {listings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>

            {/* Pagination / Load More Button */}
            {hasMore && (
              <div className="pt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchListingsData(page + 1, true)}
                  disabled={isLoadingMore}
                  className="rounded-2xl px-6 py-2.5 font-bold text-xs gap-2 shadow-xs"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      Loading more furniture...
                    </>
                  ) : (
                    <>Load More Listings</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Comprehensive Filter Modal (City, Material, Price Range) */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">Filter Marketplace</h3>
              </div>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* City / Region Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">City / Region</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ethiopianCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Material / Timber Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Wood Type & Material</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {materialsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Price Range (ETB)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min Price (ETB)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
                <input
                  type="number"
                  placeholder="Max Price (ETB)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground underline"
              >
                Clear all
              </button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setFilterModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setFilterModalOpen(false);
                    fetchListingsData(1, false);
                  }}
                  className="font-bold text-xs"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
