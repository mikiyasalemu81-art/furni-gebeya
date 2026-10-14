import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { UserProfile, SEEDED_ADMIN_USER } from "@/lib/auth-types";
import {
  ListingCondition,
  PriceType,
  ListingStatus,
  ListingImage,
  Listing,
  ListingFilters,
  CATEGORIES_LIST,
} from "@/lib/listing-types";

export type {
  ListingCondition,
  PriceType,
  ListingStatus,
  ListingImage,
  Listing,
  ListingFilters,
};
export { CATEGORIES_LIST };

// Live listings storage (clean state, zero demo listings)
export const INITIAL_DEMO_LISTINGS: Listing[] = [];

// In-memory listings map for dev resilience and instant reactivity
export const memoryListings = new Map<string, Listing>();

// Favorites store: Map<userId, Set<listingId>>
export const memoryFavorites = new Map<string, Set<string>>();

/**
 * Returns listings with filtering, searching, sorting, and pagination
 */
export async function getListings(
  filters: ListingFilters = {}
): Promise<{ listings: Listing[]; total: number; hasMore: boolean }> {
  const page = filters.page || 1;
  const limit = filters.limit || 12;

  let all = Array.from(memoryListings.values());

  // 1. Status Filter
  if (filters.status && filters.status !== "all") {
    all = all.filter((l) => l.status === filters.status);
  } else if (!filters.sellerId) {
    // By default for public feed, show active and sold items
    all = all.filter((l) => l.status === "active" || l.status === "sold");
  }

  // 2. Seller Filter (e.g. My Posts)
  if (filters.sellerId) {
    all = all.filter((l) => l.seller_id === filters.sellerId);
  }

  // 3. Category Filter
  if (filters.category && filters.category !== "all") {
    all = all.filter(
      (l) => l.category_slug === filters.category || l.category_id === filters.category
    );
  }

  // 4. City / Region Filter
  if (filters.city && filters.city !== "all") {
    all = all.filter((l) => l.city.toLowerCase() === filters.city!.toLowerCase());
  }

  // 5. Condition Filter (new or used)
  if (filters.condition && filters.condition !== "all") {
    all = all.filter((l) => l.condition === filters.condition);
  }

  // 6. Material Filter
  if (filters.material && filters.material !== "all") {
    const mat = filters.material.toLowerCase();
    all = all.filter(
      (l) =>
        (l.material && l.material.toLowerCase().includes(mat)) ||
        (l.wood_type && l.wood_type.toLowerCase().includes(mat))
    );
  }

  // 7. Verified Only Filter
  if (filters.verifiedOnly) {
    all = all.filter((l) => l.seller_is_verified);
  }

  // 8. Price Range Filter
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    all = all.filter((l) => l.price_type === "fixed" && l.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    all = all.filter((l) => l.price_type === "fixed" && l.price <= filters.maxPrice!);
  }

  // 9. Search Term (titles, descriptions, materials, cities)
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    all = all.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.wood_type && l.wood_type.toLowerCase().includes(q)) ||
        (l.material && l.material.toLowerCase().includes(q)) ||
        l.city.toLowerCase().includes(q) ||
        (l.subcity && l.subcity.toLowerCase().includes(q))
    );
  }

  // 10. Sorting
  if (filters.sort === "price_asc") {
    all.sort((a, b) => a.price - b.price);
  } else if (filters.sort === "price_desc") {
    all.sort((a, b) => b.price - a.price);
  } else if (filters.sort === "popular") {
    all.sort((a, b) => b.views_count - a.views_count);
  } else {
    // Default newest
    all.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const total = all.length;
  const start = (page - 1) * limit;
  const paginated = all.slice(start, start + limit);
  const hasMore = start + limit < total;

  return { listings: paginated, total, hasMore };
}

/**
 * Returns a single listing by ID and increments view count
 */
export async function getListingById(id: string): Promise<Listing | null> {
  const listing = memoryListings.get(id);
  if (!listing) return null;

  listing.views_count += 1;
  memoryListings.set(id, listing);
  return listing;
}

/**
 * Creates a new listing
 */
export async function createListing(
  seller: UserProfile,
  payload: {
    title: string;
    description: string;
    category_id: string;
    price_type: PriceType;
    price?: number;
    condition: ListingCondition;
    wood_type?: string;
    material?: string;
    dimensions?: string;
    city: string;
    subcity?: string;
    specific_location?: string;
    delivery_available?: boolean;
    images: string[]; // array of image URLs (max 4)
  }
): Promise<Listing> {
  if (payload.images.length > 4) {
    throw new Error("A maximum of 4 photos can be uploaded per listing.");
  }
  if (payload.images.length === 0) {
    throw new Error("At least one photo is required for your listing.");
  }

  const category =
    CATEGORIES_LIST.find(
      (c) => c.id === payload.category_id || c.slug === payload.category_id
    ) || CATEGORIES_LIST[0];

  const listingId = `lst-${Date.now()}`;
  const now = new Date().toISOString();

  const formattedImages: ListingImage[] = payload.images.map((url, index) => ({
    url,
    is_cover: index === 0,
    display_order: index,
  }));

  const newListing: Listing = {
    id: listingId,
    seller_id: seller.id,
    seller_name: seller.business_name || seller.full_name,
    seller_phone: seller.phone_number,
    seller_role: seller.role || "seller",
    seller_is_verified: seller.is_verified,
    seller_avatar_url: seller.avatar_url,
    category_id: category.id,
    category_slug: category.slug,
    category_name: category.name_en,
    title: payload.title.trim(),
    description: payload.description.trim(),
    price: payload.price_type === "fixed" ? Number(payload.price) || 0 : 0,
    currency: "ETB",
    price_type: payload.price_type,
    condition: payload.condition,
    wood_type: payload.wood_type?.trim() || null,
    material: payload.material?.trim() || null,
    dimensions: payload.dimensions?.trim() || null,
    city: payload.city,
    subcity: payload.subcity?.trim() || null,
    specific_location: payload.specific_location?.trim() || null,
    delivery_available: Boolean(payload.delivery_available),
    status: "active",
    views_count: 0,
    is_featured: false,
    images: formattedImages,
    created_at: now,
    updated_at: now,
  };

  memoryListings.set(listingId, newListing);

  // Supabase insert if connected
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("listings").insert({
        id: listingId,
        seller_id: seller.id,
        category_id: category.id,
        title: newListing.title,
        description: newListing.description,
        price: newListing.price,
        currency: "ETB",
        price_type: newListing.price_type,
        condition: newListing.condition,
        wood_type: newListing.wood_type,
        material: newListing.material,
        dimensions: newListing.dimensions,
        city: newListing.city,
        subcity: newListing.subcity,
        specific_location: newListing.specific_location,
        delivery_available: newListing.delivery_available,
        status: "active",
      });

      for (const img of formattedImages) {
        await admin.from("listing_images").insert({
          listing_id: listingId,
          image_url: img.url,
          is_cover: img.is_cover,
          display_order: img.display_order,
        });
      }
    } catch (e) {
      console.warn("[Failed to persist listing in Supabase, stored in memory]", e);
    }
  }

  return newListing;
}

/**
 * Updates an existing listing
 */
export async function updateListing(
  seller: UserProfile,
  listingId: string,
  payload: Omit<Partial<Listing>, "images"> & { images?: string[] }
): Promise<Listing | null> {
  const existing = memoryListings.get(listingId);
  if (!existing) return null;

  // Security check: only listing owner or admin can update
  if (existing.seller_id !== seller.id && seller.role !== "admin") {
    throw new Error("Unauthorized: You can only edit your own listings.");
  }

  if (payload.title !== undefined) existing.title = payload.title.trim();
  if (payload.description !== undefined) existing.description = payload.description.trim();
  if (payload.category_id !== undefined) {
    const cat = CATEGORIES_LIST.find((c) => c.id === payload.category_id || c.slug === payload.category_id);
    if (cat) {
      existing.category_id = cat.id;
      existing.category_slug = cat.slug;
      existing.category_name = cat.name_en;
    }
  }
  if (payload.price_type !== undefined) existing.price_type = payload.price_type;
  if (payload.price !== undefined) existing.price = Number(payload.price) || 0;
  if (payload.condition !== undefined) existing.condition = payload.condition;
  if (payload.wood_type !== undefined) existing.wood_type = payload.wood_type;
  if (payload.material !== undefined) existing.material = payload.material;
  if (payload.dimensions !== undefined) existing.dimensions = payload.dimensions;
  if (payload.city !== undefined) existing.city = payload.city;
  if (payload.subcity !== undefined) existing.subcity = payload.subcity;
  if (payload.specific_location !== undefined) existing.specific_location = payload.specific_location;
  if (payload.delivery_available !== undefined) existing.delivery_available = payload.delivery_available;

  if (payload.images && payload.images.length > 0) {
    if (payload.images.length > 4) {
      throw new Error("Maximum 4 photos allowed per listing.");
    }
    existing.images = payload.images.map((url, idx) => ({
      url,
      is_cover: idx === 0,
      display_order: idx,
    }));
  }

  existing.updated_at = new Date().toISOString();
  memoryListings.set(listingId, existing);

  return existing;
}

/**
 * Toggles status between 'active' and 'sold'
 */
export async function markListingSold(
  seller: UserProfile,
  listingId: string,
  isSold: boolean
): Promise<Listing | null> {
  const listing = memoryListings.get(listingId);
  if (!listing) return null;

  if (listing.seller_id !== seller.id && seller.role !== "admin") {
    throw new Error("Unauthorized to update listing status.");
  }

  listing.status = isSold ? "sold" : "active";
  listing.updated_at = new Date().toISOString();
  memoryListings.set(listingId, listing);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("listings").update({ status: listing.status }).eq("id", listingId);
    } catch (e) {
      console.warn("[Failed to update status in Supabase]", e);
    }
  }

  return listing;
}

/**
 * Deletes a listing
 */
export async function deleteListing(
  seller: UserProfile,
  listingId: string
): Promise<boolean> {
  const listing = memoryListings.get(listingId);
  if (!listing) return false;

  if (listing.seller_id !== seller.id && seller.role !== "admin") {
    throw new Error("Unauthorized to delete this listing.");
  }

  memoryListings.delete(listingId);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("listings").delete().eq("id", listingId);
    } catch (e) {
      console.warn("[Failed to delete listing in Supabase]", e);
    }
  }

  return true;
}

/**
 * Favorites / Saved items management
 */
export async function toggleFavorite(userId: string, listingId: string): Promise<boolean> {
  let userFavs = memoryFavorites.get(userId);
  if (!userFavs) {
    userFavs = new Set<string>();
    memoryFavorites.set(userId, userFavs);
  }

  if (userFavs.has(listingId)) {
    userFavs.delete(listingId);
    return false; // un-favorited
  } else {
    userFavs.add(listingId);
    return true; // favorited
  }
}

export async function isListingFavorited(userId: string, listingId: string): Promise<boolean> {
  const userFavs = memoryFavorites.get(userId);
  return Boolean(userFavs && userFavs.has(listingId));
}

export async function getUserFavorites(userId: string): Promise<Listing[]> {
  const userFavs = memoryFavorites.get(userId);
  if (!userFavs || userFavs.size === 0) return [];

  const result: Listing[] = [];
  for (const id of userFavs) {
    const l = memoryListings.get(id);
    if (l) result.push(l);
  }
  return result;
}
