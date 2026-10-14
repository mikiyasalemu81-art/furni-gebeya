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
  id: "f300348f-53dd-4157-9198-6baeedcd5803",
  phone_number: "+251907173634",
  full_name: "Furni Gebeya Master Admin",
  avatar_url: null,
  role: "admin",
  business_name: "Furni Gebeya Headquarters",
  city: "Addis Ababa",
  subcity: "Bole",
  address: "Bole, Addis Ababa",
  bio: "Master administrator for Furni Gebeya Marketplace. Overseeing verified suppliers, showrooms, and quality listings.",
  is_verified: true,
  is_onboarded: true,
  verification_status: "approved",
};
