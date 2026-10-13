// ============================================================================
// Types for Stage 5, 6, and 7
// ============================================================================

export type PaymentMethod =
  | "manual_bank_transfer"
  | "telebirr"
  | "cbe_birr"
  | "chapa_pending"
  | "admin_grant";

export interface Subscription {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_reference?: string | null;
  status: "active" | "expired" | "cancelled" | "pending";
  starts_at: string;
  expires_at: string;
  created_by?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactView {
  id: string;
  viewer_id: string;
  viewer_name?: string;
  viewer_phone?: string;
  target_user_id: string;
  listing_id?: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  listing_id?: string | null;
  last_message_text?: string | null;
  last_message_at?: string | null;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
    is_verified: boolean;
  };
  listing?: {
    id: string;
    title: string;
    price: number;
    price_type: string;
    cover_image?: string;
  } | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  audio_url?: string | null;
  audio_duration_seconds?: number | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string | null;
  target_user_id: string;
  rating: number; // 1 to 5
  comment: string;
  status: "approved" | "flagged" | "hidden";
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_phone?: string;
  report_type: "listing" | "profile" | "message";
  target_listing_id?: string | null;
  target_user_id?: string | null;
  target_title_or_name?: string;
  reason: string;
  details?: string | null;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  reviewed_by?: string | null;
  admin_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface WantedRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_avatar?: string | null;
  title: string;
  category_id: string;
  category_name: string;
  description: string;
  budget_min?: number | null;
  budget_max?: number | null;
  currency: string;
  quantity: number;
  city: string;
  images: string[]; // up to 2 photos
  status: "active" | "fulfilled" | "closed";
  expires_at: string; // 30 days from creation
  created_at: string;
  updated_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "verification" | "trial" | "chat" | "wanted" | "system";
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
}

