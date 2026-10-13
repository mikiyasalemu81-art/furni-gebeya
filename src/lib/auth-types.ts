export type UserRole = "buyer" | "seller" | "supplier" | "admin";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "approved"
  | "rejected"
  | "more_documents_requested";

export type SubscriptionStatus = "trial" | "active" | "grace_period" | "expired" | "exempt";

export interface UserProfile {
  id: string;
  phone_number: string;
  phone?: string;
  full_name: string;
  avatar_url: string | null;
  cover_photo_url?: string | null;
  role: UserRole | null;
  business_name?: string | null;
  city: string;
  subcity?: string | null;
  address?: string | null;
  bio?: string | null;
  whatsapp_number?: string | null;
  telegram_username?: string | null;
  map_location_url?: string | null;
  is_verified: boolean;
  id_verified?: boolean;
  license_verified?: boolean;
  is_top_supplier?: boolean;
  avg_response_hours?: number;
  is_onboarded: boolean;
  onboarding_done?: boolean;
  verification_status: VerificationStatus;
  is_suspended?: boolean;
  suspended_reason?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  subscription_status?: SubscriptionStatus;
  created_at?: string;
}

export const SEEDED_ADMIN_USER: UserProfile = {
  id: "a0000000-0000-0000-0000-000000000001",
  phone_number: "+251911000000",
  full_name: "Furni Gebeya Administrator",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  role: "admin",
  business_name: "Furni Gebeya Platform HQ",
  city: "Addis Ababa",
  subcity: "Bole",
  address: "Bole Road, Mega Building 4th Floor",
  bio: "Official Platform Administrator for Furni Gebeya Marketplace. Overseeing verified carpenters, showrooms, and quality listings.",
  is_verified: true,
  is_onboarded: true,
  verification_status: "approved",
};
