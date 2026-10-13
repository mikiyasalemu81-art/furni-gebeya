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

// Rich Authentic Ethiopian Furniture Seed Data
export const INITIAL_DEMO_LISTINGS: Listing[] = [
  {
    id: "lst-001",
    seller_id: SEEDED_ADMIN_USER.id,
    seller_name: "Entoto Master Woodcraft",
    seller_phone: "+251911223344",
    seller_role: "supplier",
    seller_is_verified: true,
    seller_avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    category_id: "cat-dining",
    category_slug: "dining-room",
    category_name: "Dining & Kitchen",
    title: "Handcrafted Solid Wanza Wood 6-Seater Dining Table",
    description: "Authentic Ethiopian Wanza (Cordia africana) dining set. Hand-sanded and treated with natural matte beeswax finish. Comes with 6 ergonomic matching chairs.",
    price: 48500,
    currency: "ETB",
    price_type: "fixed",
    condition: "new",
    wood_type: "Wanza (ዋንዛ)",
    material: "Solid Hardwood & Velvet Cushions",
    dimensions: "200x100x78 cm",
    city: "Addis Ababa",
    subcity: "Kirkos",
    specific_location: "Shola Market, Workshop 12",
    delivery_available: true,
    status: "active",
    views_count: 342,
    is_featured: true,
    images: [
      { url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1000&auto=format&fit=crop&q=80", is_cover: true, display_order: 0 },
      { url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80", is_cover: false, display_order: 1 },
      { url: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=1000&auto=format&fit=crop&q=80", is_cover: false, display_order: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "lst-002",
    seller_id: SEEDED_ADMIN_USER.id,
    seller_name: "Bole Luxury Furniture Showroom",
    seller_phone: "+251911000000",
    seller_role: "seller",
    seller_is_verified: true,
    seller_avatar_url: SEEDED_ADMIN_USER.avatar_url,
    category_id: "cat-living",
    category_slug: "living-room",
    category_name: "Living Room",
    title: "Modern Emerald Green Velvet L-Shape Sectional Sofa",
    description: "Premium high-density orthopedic foam with stain-resistant velvet fabric and sturdy solid Tid wood frame. Includes 4 decorative accent cushions.",
    price: 68000,
    currency: "ETB",
    price_type: "fixed",
    condition: "new",
    wood_type: "Tid (ጥድ)",
    material: "Emerald Velvet Fabric & High-Density Foam",
    dimensions: "280x180x85 cm",
    city: "Addis Ababa",
    subcity: "Bole",
    specific_location: "Bole Atlas Road, Next to Edna Mall",
    delivery_available: true,
    status: "active",
    views_count: 512,
    is_featured: true,
    images: [
      { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80", is_cover: true, display_order: 0 },
      { url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1000&auto=format&fit=crop&q=80", is_cover: false, display_order: 1 },
      { url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1000&auto=format&fit=crop&q=80", is_cover: false, display_order: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "lst-003",
    seller_id: "u-artisan-02",
    seller_name: "Gibe Cultural Woodcraft",
    seller_phone: "+251922334455",
    seller_role: "supplier",
    seller_is_verified: true,
    seller_avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    category_id: "cat-custom",
    category_slug: "custom-woodcraft",
    category_name: "Custom Woodcraft",
    title: "Artisanal Coffee Ceremony Set (Rekebot & 6 Carved Stools)",
    description: "Traditional Ethiopian cultural coffee table hand-carved with historical Lalibela and Aksum geometric motifs. Includes 6 matching mini-stools (Barchuma). Custom engraving available.",
    price: 0,
    currency: "ETB",
    price_type: "ask_price",
    condition: "new",
    wood_type: "Zigba (ዝግባ)",
    material: "Hand-Carved Solid Wood & Brass Trim",
    dimensions: "110x60x45 cm",
    city: "Addis Ababa",
    subcity: "Arada",
    specific_location: "Piassa Heritage Craft Center",
    delivery_available: true,
    status: "active",
    views_count: 620,
    is_featured: true,
    images: [
      { url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=1000&auto=format&fit=crop&q=80", is_cover: true, display_order: 0 },
      { url: "https://images.unsplash.com/photo-1540518614846-7ede433c4b49?w=1000&auto=format&fit=crop&q=80", is_cover: false, display_order: 1 },
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "lst-004",
    seller_id: "u-seller-03",
    seller_name: "Hawassa Home Comforts",
    seller_phone: "+251933445566",
    seller_role: "seller",
    seller_is_verified: false,
    seller_avatar_url: null,
    category_id: "cat-bedroom",
    category_slug: "bedroom",
    category_name: "Bedroom",
    title: "King Size Platform Bed with Under-Bed Storage Drawers",
    description: "Sturdy king size bed frame crafted from Ethiopian Pine & Wanza. Four integrated smooth sliding storage drawers and tufted linen headboard.",
    price: 42000,
    currency: "ETB",
    price_type: "fixed",
    condition: "new",
    wood_type: "Wanza & Pine",
    material: "Solid Timber & Linen Tufting",
    dimensions: "200x180x110 cm",
    city: "Hawassa",
    subcity: "Tabor",
    specific_location: "Piazza Street, Hawassa",
    delivery_available: false,
    status: "active",
    views_count: 215,
    is_featured: false,
    images: [
      { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1000&auto=format&fit=crop&q=80", is_cover: true, display_order: 0 },
      { url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80", is_cover: false, display_order: 1 },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "lst-005",
    seller_id: "u-seller-04",
    seller_name: "Kazanchis Business Surplus",
    seller_phone: "+251944556677",
    seller_role: "seller",
    seller_is_verified: true,
    seller_avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    category_id: "cat-office",
    category_slug: "office",
    category_name: "Office & Study",
    title: "Heavy Duty Executive Office Desk with Cable Management",
    description: "Spacious L-shaped executive desk with 3 lockable drawers and integrated power socket grommets. Gently used for 6 months, excellent condition.",
    price: 24500,
    currency: "ETB",
    price_type: "fixed",
    condition: "used",
    wood_type: "Oak Veneer & Steel",
    material: "Hardwood Veneer & Black Metal Legs",
    dimensions: "180x90x75 cm",
    city: "Addis Ababa",
    subcity: "Kirkos",
    specific_location: "Kazanchis, Guinea Conakry Street",
    delivery_available: true,
    status: "active",
    views_count: 278,
    is_featured: false,
    images: [
      { url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80", is_cover: true, display_order: 0 },
    ],
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "lst-006",
    seller_id: SEEDED_ADMIN_USER.id,
    seller_name: "Kuriftu Outdoor & Resort Living",
    seller_phone: "+251911000000",
    seller_role: "seller",
    seller_is_verified: true,
    seller_avatar_url: SEEDED_ADMIN_USER.avatar_url,
    category_id: "cat-outdoor",
    category_slug: "outdoor",
    category_name: "Outdoor & Balcony",
    title: "Handmade Weatherproof Garden & Balcony Rattan Lounge Set",
    description: "Includes 2 deep lounge armchairs and 1 tempered glass coffee table. UV-resistant synthetic weave on rustproof aluminum frames.",
    price: 31000,
    currency: "ETB",
    price_type: "fixed",
    condition: "new",
    wood_type: "Treated Acacia & Rattan",
    material: "All-Weather Synthetic Wicker & Tempered Glass",
    dimensions: "Chairs: 75x70x80 cm, Table: 50x50x45 cm",
    city: "Bishoftu",
    subcity: "Kuriftu",
    specific_location: "Near Lake Kuriftu Resort",
    delivery_available: true,
    status: "active",
    views_count: 189,
    is_featured: false,
    images: [
      { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&auto=format&fit=crop&q=80", is_cover: true, display_order: 0 },
      { url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1000&auto=format&fit=crop&q=80", is_cover: false, display_order: 1 },
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "lst-007",
    seller_id: "u-seller-05",
    seller_name: "Adama Furniture House",
    seller_phone: "+251955667788",
    seller_role: "supplier",
    seller_is_verified: true,
    seller_avatar_url: null,
    category_id: "cat-bedroom",
    category_slug: "bedroom",
    category_name: "Bedroom",
    title: "Custom 4-Door Wardrobe with Full-Length Mirror",
    description: "High quality spacious bedroom wardrobe made of engineered wood and solid pine bracing. Includes hanging rods, shelves, and dual security lock drawers.",
    price: 38000,
    currency: "ETB",
    price_type: "fixed",
    condition: "new",
    wood_type: "Pine & Laminated MDF",
    material: "Laminated Hardboard & Mirrored Glass",
    dimensions: "200x180x60 cm",
    city: "Adama (Nazret)",
    subcity: "Posta Bet Area",
    specific_location: "Main Commercial Avenue, Adama",
    delivery_available: true,
    status: "active",
    views_count: 145,
    is_featured: false,
    images: [
      { url: "https://images.unsplash.com/photo-1558997519-83ea9252def8?w=1000&auto=format&fit=crop&q=80", is_cover: true, display_order: 0 },
    ],
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "lst-008",
    seller_id: SEEDED_ADMIN_USER.id,
    seller_name: "Bole Luxury Furniture Showroom",
    seller_phone: "+251911000000",
    seller_role: "seller",
    seller_is_verified: true,
    seller_avatar_url: SEEDED_ADMIN_USER.avatar_url,
    category_id: "cat-living",
    category_slug: "living-room",
    category_name: "Living Room",
    title: "Classic Leather Armchair (Vintage Brown)",
    description: "Genuine top-grain leather armchair with tufted backrest and solid walnut stained legs. Beautiful vintage patina, perfect for library or executive lounge.",
    price: 34000,
    currency: "ETB",
    price_type: "fixed",
    condition: "used",
    wood_type: "Walnut Stained Wanza",
    material: "Top-Grain Cowhide Leather & Solid Wood Frame",
    dimensions: "90x85x95 cm",
    city: "Addis Ababa",
    subcity: "Bole",
    specific_location: "Bole Rwanda Embassy Area",
    delivery_available: true,
    status: "sold", // Marked Sold demo item!
    views_count: 490,
    is_featured: false,
    images: [
      { url: "https://images.unsplash.com/photo-1580481077195-c3a821a5060f?w=1000&auto=format&fit=crop&q=80", is_cover: true, display_order: 0 },
    ],
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// In-memory listings map for dev resilience and instant reactivity
export const memoryListings = new Map<string, Listing>(
  INITIAL_DEMO_LISTINGS.map((l) => [l.id, l])
);

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
    seller_role: seller.role,
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
