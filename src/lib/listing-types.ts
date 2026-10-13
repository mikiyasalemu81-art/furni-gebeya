export type ListingCondition = "new" | "used";
export type PriceType = "fixed" | "ask_price";
export type ListingStatus = "active" | "sold" | "draft" | "archived";

export interface ListingImage {
  id?: string;
  url: string;
  is_cover: boolean;
  display_order: number;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_phone: string;
  seller_role: string;
  seller_is_verified: boolean;
  seller_id_verified?: boolean;
  seller_license_verified?: boolean;
  seller_is_top?: boolean;
  seller_avatar_url: string | null;
  category_id: string;
  category_slug: string;
  category_name: string;
  room?: "living_room" | "bedroom" | "office" | "kitchen" | "dining" | "outdoor";
  title: string;
  description: string;
  price: number;
  old_price?: number | null;
  is_good_price?: boolean;
  currency: string;
  price_type: PriceType;
  condition: ListingCondition;
  wood_type?: string | null;
  material?: string | null;
  dimensions?: string | null;
  color?: string | null;
  quantity?: number;
  city: string;
  subcity?: string | null;
  specific_location?: string | null;
  delivery_available: boolean;
  delivery_regions?: string[];
  status: ListingStatus;
  views_count: number;
  is_featured: boolean;
  images: ListingImage[];
  created_at: string;
  updated_at: string;
}

export interface ListingFilters {
  search?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: "new" | "used" | "all";
  material?: string;
  verifiedOnly?: boolean;
  sellerId?: string;
  status?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  page?: number;
  limit?: number;
}

export const CATEGORIES_LIST = [
  { id: "cat-living", slug: "living-room", name_en: "Living Room", name_am: "የሳሎን ዕቃዎች", name_om: "Mi'a Saaloonaa" },
  { id: "cat-bedroom", slug: "bedroom", name_en: "Bedroom", name_am: "የመኝታ ቤት ዕቃዎች", name_om: "Mi'a Kutaa Ciisichaa" },
  { id: "cat-dining", slug: "dining-room", name_en: "Dining & Kitchen", name_am: "የመመገቢያ እና ወጥ ቤት", name_om: "Minjaala Nyaataa fi Kushiinaa" },
  { id: "cat-office", slug: "office", name_en: "Office & Study", name_am: "የቢሮ ዕቃዎች", name_om: "Mi'a Waajjiraa" },
  { id: "cat-custom", slug: "custom-woodcraft", name_en: "Custom Woodcraft", name_am: "ብጁ የእንጨት ጥበብ", name_om: "Hojii Mukaa Aadaa" },
  { id: "cat-outdoor", slug: "outdoor", name_en: "Outdoor & Balcony", name_am: "የበረንዳ እና ግቢ", name_om: "Mi'a Dirree fi Balballaa" },
];
