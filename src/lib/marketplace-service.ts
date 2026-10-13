import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { UserProfile, memoryProfiles } from "@/lib/auth-session";
import {
  Subscription,
  ContactView,
  Conversation,
  Message,
  UserBlock,
  Review,
  Report,
  PaymentMethod,
  WantedRequest,
  InAppNotification,
} from "@/lib/marketplace-types";

// In-Memory stores for development resilience and fallback
const memorySubscriptions = new Map<string, Subscription>();
const memoryContactViews: ContactView[] = [];
const memoryConversations = new Map<string, Conversation>();
const memoryMessages = new Map<string, Message[]>(); // convId -> Message[]
const memoryUserBlocks: UserBlock[] = [];
const memoryReviews = new Map<string, Review>();
const memoryReports = new Map<string, Report>();
const memoryWantedRequests = new Map<string, WantedRequest>();
const memoryNotifications = new Map<string, InAppNotification[]>(); // userId -> InAppNotification[]

// Seed sample wanted request
const sampleWantedId = "wnt-00000000-0000-0001";
memoryWantedRequests.set(sampleWantedId, {
  id: sampleWantedId,
  user_id: "u-sample-buyer-01",
  user_name: "Almaz Kebede",
  user_phone: "+251911223344",
  user_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
  title: "Looking for 6-Seater Solid Wanza Dining Set",
  category_id: "cat-dining",
  category_name: "Dining & Kitchen",
  description: "Need a durable solid Wanza wood dining table with 6 cushioned chairs. Preferably natural walnut/dark polish finish. Addis Ababa Bole area.",
  budget_min: 45000,
  budget_max: 65000,
  currency: "ETB",
  quantity: 1,
  city: "Addis Ababa",
  images: [
    "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80"
  ],
  status: "active",
  expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
});

// Seed second wanted request
const sampleWantedId2 = "wnt-00000000-0000-0002";
memoryWantedRequests.set(sampleWantedId2, {
  id: sampleWantedId2,
  user_id: "u-sample-artisan-01",
  user_name: "Tadesse Wanza Woodcraft",
  user_phone: "+251912345678",
  user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  title: "Seasoned Zigba Timber Planks (200 Pcs)",
  category_id: "cat-custom",
  category_name: "Custom Woodcraft",
  description: "Looking for kiln-dried or seasoned Zigba timber boards for sofa framework construction. Immediate purchase.",
  budget_min: 80000,
  budget_max: 120000,
  currency: "ETB",
  quantity: 200,
  city: "Hawassa",
  images: [],
  status: "active",
  expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
});


// Seed sample review for initial rich UI testing
const sampleReviewId = "rev-00000000-0000-0001";
memoryReviews.set(sampleReviewId, {
  id: sampleReviewId,
  reviewer_id: "u-sample-buyer-01",
  reviewer_name: "Almaz Kebede",
  reviewer_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
  target_user_id: "u-sample-artisan-01",
  rating: 5,
  comment: "Excellent craftsmanship on the custom Wanza dining table! Delivered on time with high grade finish.",
  status: "approved",
  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
});

// Seed sample subscription for artisan
const sampleSubId = "sub-00000000-0000-0001";
memorySubscriptions.set(sampleSubId, {
  id: sampleSubId,
  user_id: "u-sample-artisan-01",
  user_name: "Tadesse Wanza Woodcraft",
  user_phone: "+251912345678",
  plan_name: "Standard Monthly (30 Days)",
  amount: 0,
  currency: "ETB",
  payment_method: "admin_grant",
  status: "active",
  starts_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  notes: "Initial 30-day free trial on account approval",
  created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
});

// ============================================================================
// Stage 5: Subscriptions & Contact Views
// ============================================================================

/**
 * Check if seller has an active subscription or free trial
 */
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const now = new Date();

  // Find user profile
  let prof: UserProfile | undefined;
  for (const p of memoryProfiles.values()) {
    if (p.id === userId) {
      prof = p;
      break;
    }
  }

  // Admin and buyers are exempt
  if (prof?.role === "admin" || prof?.role === "buyer") return true;

  // Check trial period
  if (prof?.trial_ends_at) {
    const trialEnd = new Date(prof.trial_ends_at);
    if (trialEnd > now) return true;
  }

  // Check active subscription records
  for (const sub of memorySubscriptions.values()) {
    if (sub.user_id === userId && sub.status === "active") {
      if (new Date(sub.expires_at) > now) return true;
    }
  }

  return false;
}

/**
 * Record a contact view and check eligibility
 */
export async function recordContactView(
  viewerId: string,
  targetUserId: string,
  listingId?: string | null
): Promise<{ success: boolean; contactViewId: string }> {
  const id = crypto.randomUUID();
  const newView: ContactView = {
    id,
    viewer_id: viewerId,
    target_user_id: targetUserId,
    listing_id: listingId || null,
    created_at: new Date().toISOString(),
  };

  memoryContactViews.push(newView);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("contact_views").insert({
        id,
        viewer_id: viewerId,
        target_user_id: targetUserId,
        listing_id: listingId || null,
      });
    } catch (e) {
      console.error("[Supabase insert contact_views error]", e);
    }
  }

  return { success: true, contactViewId: id };
}

/**
 * Check if a viewer has previously viewed a seller's contact or had a chat
 * (Requirement for posting a review)
 */
export async function hasInteractedWithSeller(
  viewerId: string,
  targetUserId: string
): Promise<boolean> {
  // Check contact views
  const hasView = memoryContactViews.some(
    (v) => v.viewer_id === viewerId && v.target_user_id === targetUserId
  );
  if (hasView) return true;

  // Check conversations
  for (const conv of memoryConversations.values()) {
    if (
      (conv.participant_one_id === viewerId && conv.participant_two_id === targetUserId) ||
      (conv.participant_one_id === targetUserId && conv.participant_two_id === viewerId)
    ) {
      return true;
    }
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data: viewData } = await admin
        .from("contact_views")
        .select("id")
        .eq("viewer_id", viewerId)
        .eq("target_user_id", targetUserId)
        .limit(1);
      if (viewData && viewData.length > 0) return true;
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Admin: Record manual payment / renew subscription
 */
export async function recordSubscriptionPayment(params: {
  userId: string;
  adminId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  daysDuration: number;
  notes?: string;
}): Promise<Subscription> {
  const id = crypto.randomUUID();
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + params.daysDuration * 24 * 60 * 60 * 1000);

  const sub: Subscription = {
    id,
    user_id: params.userId,
    plan_name: `Standard (${params.daysDuration} Days)`,
    amount: params.amount,
    currency: "ETB",
    payment_method: params.paymentMethod,
    payment_reference: params.paymentReference || null,
    status: "active",
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    created_by: params.adminId,
    notes: params.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memorySubscriptions.set(id, sub);

  // Update profile subscription status
  for (const prof of memoryProfiles.values()) {
    if (prof.id === params.userId) {
      prof.subscription_status = "active";
      prof.trial_ends_at = expiresAt.toISOString();
      break;
    }
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("subscriptions").insert({
        id,
        user_id: params.userId,
        plan_name: sub.plan_name,
        amount: params.amount,
        currency: "ETB",
        payment_method: params.paymentMethod,
        payment_reference: params.paymentReference,
        status: "active",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        created_by: params.adminId,
        notes: params.notes,
      });

      await admin
        .from("profiles")
        .update({
          subscription_status: "active",
          trial_ends_at: expiresAt.toISOString(),
        })
        .eq("id", params.userId);
    } catch (e) {
      console.error("[Supabase insert subscription error]", e);
    }
  }

  return sub;
}

/**
 * Admin: Extend trial for a user
 */
export async function extendUserTrial(
  userId: string,
  extraDays: number
): Promise<{ success: boolean; newTrialEnd: string }> {
  let newDate = new Date();
  for (const prof of memoryProfiles.values()) {
    if (prof.id === userId) {
      const currentEnd = prof.trial_ends_at ? new Date(prof.trial_ends_at) : new Date();
      const base = currentEnd > new Date() ? currentEnd : new Date();
      newDate = new Date(base.getTime() + extraDays * 24 * 60 * 60 * 1000);
      prof.trial_ends_at = newDate.toISOString();
      prof.subscription_status = "trial";
      break;
    }
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin
        .from("profiles")
        .update({
          trial_ends_at: newDate.toISOString(),
          subscription_status: "trial",
        })
        .eq("id", userId);
    } catch (e) {
      console.error("[Supabase extend trial error]", e);
    }
  }

  return { success: true, newTrialEnd: newDate.toISOString() };
}

/**
 * Admin: Get all subscriptions
 */
export async function getAdminSubscriptions(): Promise<Subscription[]> {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data } = await admin
        .from("subscriptions")
        .select(`*, profiles:user_id(full_name, phone_number)`)
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        return data.map((d: any) => ({
          ...d,
          user_name: d.profiles?.full_name || "User",
          user_phone: d.profiles?.phone_number || "",
        }));
      }
    } catch (e) {
      console.error("[Supabase get subscriptions error]", e);
    }
  }
  return Array.from(memorySubscriptions.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ============================================================================
// Stage 6: Chat, Blocks, Reviews, Reports
// ============================================================================

/**
 * Get or create unique conversation between 2 users
 */
export async function getOrCreateConversation(
  userOneId: string,
  userTwoId: string,
  listingId?: string | null
): Promise<Conversation> {
  const [p1, p2] = [userOneId, userTwoId].sort();

  for (const conv of memoryConversations.values()) {
    if (
      (conv.participant_one_id === p1 && conv.participant_two_id === p2) ||
      (conv.participant_one_id === p2 && conv.participant_two_id === p1)
    ) {
      return conv;
    }
  }

  const id = crypto.randomUUID();
  const newConv: Conversation = {
    id,
    participant_one_id: p1,
    participant_two_id: p2,
    listing_id: listingId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryConversations.set(id, newConv);
  memoryMessages.set(id, []);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("conversations").insert({
        id,
        participant_one_id: p1,
        participant_two_id: p2,
        listing_id: listingId || null,
      });
    } catch {
      // ignore
    }
  }

  return newConv;
}

/**
 * Send a chat message
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  recipientId: string;
  messageText: string;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
}): Promise<Message> {
  // Check if sender is blocked by recipient
  const isBlocked = memoryUserBlocks.some(
    (b) => b.blocker_id === params.recipientId && b.blocked_id === params.senderId
  );
  if (isBlocked) {
    throw new Error("You cannot send messages to this user.");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const msg: Message = {
    id,
    conversation_id: params.conversationId,
    sender_id: params.senderId,
    recipient_id: params.recipientId,
    message_text: params.messageText.trim(),
    audio_url: params.audioUrl || null,
    audio_duration_seconds: params.audioDurationSeconds || null,
    is_read: false,
    created_at: now,
  };

  const list = memoryMessages.get(params.conversationId) || [];
  list.push(msg);
  memoryMessages.set(params.conversationId, list);

  // Update conversation last message
  const conv = memoryConversations.get(params.conversationId);
  if (conv) {
    conv.last_message_text = msg.audio_url ? "🎤 Voice message" : msg.message_text;
    conv.last_message_at = now;
    conv.updated_at = now;
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("messages").insert({
        id,
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        recipient_id: params.recipientId,
        message_text: msg.message_text,
        is_read: false,
      });
      await admin
        .from("conversations")
        .update({
          last_message_text: msg.message_text,
          last_message_at: now,
          updated_at: now,
        })
        .eq("id", params.conversationId);
    } catch (e) {
      console.error("[Supabase sendMessage error]", e);
    }
  }

  return msg;
}

/**
 * Fetch messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string
): Promise<Message[]> {
  const msgs = memoryMessages.get(conversationId) || [];
  // Mark received messages as read
  msgs.forEach((m) => {
    if (m.recipient_id === userId && !m.is_read) {
      m.is_read = true;
      m.read_at = new Date().toISOString();
    }
  });

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data } = await admin
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        return data;
      }
    } catch {
      // ignore
    }
  }

  return msgs;
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const results: Conversation[] = [];
  for (const conv of memoryConversations.values()) {
    if (conv.participant_one_id === userId || conv.participant_two_id === userId) {
      const otherId = conv.participant_one_id === userId ? conv.participant_two_id : conv.participant_one_id;
      // Resolve other user info
      let otherUser: UserProfile | undefined;
      for (const p of memoryProfiles.values()) {
        if (p.id === otherId) {
          otherUser = p;
          break;
        }
      }
      results.push({
        ...conv,
        other_user: otherUser
          ? {
              id: otherUser.id,
              full_name: otherUser.full_name,
              avatar_url: otherUser.avatar_url,
              role: otherUser.role || "buyer",
              is_verified: otherUser.is_verified,
            }
          : {
              id: otherId,
              full_name: "Furni Member",
              avatar_url: null,
              role: "seller",
              is_verified: false,
            },
      });
    }
  }

  return results.sort((a, b) => {
    const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return timeB - timeA;
  });
}

/**
 * Block / Unblock user
 */
export async function toggleUserBlock(
  blockerId: string,
  blockedId: string,
  reason?: string
): Promise<{ blocked: boolean }> {
  const idx = memoryUserBlocks.findIndex(
    (b) => b.blocker_id === blockerId && b.blocked_id === blockedId
  );
  if (idx >= 0) {
    memoryUserBlocks.splice(idx, 1);
    return { blocked: false };
  } else {
    memoryUserBlocks.push({
      id: crypto.randomUUID(),
      blocker_id: blockerId,
      blocked_id: blockedId,
      reason: reason || null,
      created_at: new Date().toISOString(),
    });
    return { blocked: true };
  }
}

/**
 * Post a review on a seller's profile
 */
export async function createReview(params: {
  reviewer: UserProfile;
  targetUserId: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  if (params.reviewer.id === params.targetUserId) {
    throw new Error("You cannot review your own profile.");
  }

  // Check rule: user must have viewed contact or chatted
  const eligible = await hasInteractedWithSeller(params.reviewer.id, params.targetUserId);
  if (!eligible) {
    throw new Error(
      "You can only review sellers after contacting them (viewing contact info or starting a chat)."
    );
  }

  // Check 1 review per user pair
  for (const r of memoryReviews.values()) {
    if (r.reviewer_id === params.reviewer.id && r.target_user_id === params.targetUserId) {
      throw new Error("You have already submitted a review for this profile.");
    }
  }

  const id = crypto.randomUUID();
  const rev: Review = {
    id,
    reviewer_id: params.reviewer.id,
    reviewer_name: params.reviewer.full_name,
    reviewer_avatar: params.reviewer.avatar_url,
    target_user_id: params.targetUserId,
    rating: Math.max(1, Math.min(5, params.rating)),
    comment: params.comment.trim(),
    status: "approved",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryReviews.set(id, rev);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("reviews").insert({
        id,
        reviewer_id: params.reviewer.id,
        target_user_id: params.targetUserId,
        rating: rev.rating,
        comment: rev.comment,
        status: "approved",
      });
    } catch (e) {
      console.error("[Supabase create review error]", e);
    }
  }

  return rev;
}

/**
 * Get reviews for a profile + calculate rating aggregate
 */
export async function getProfileReviews(targetUserId: string): Promise<{
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}> {
  const reviews: Review[] = [];
  for (const r of memoryReviews.values()) {
    if (r.target_user_id === targetUserId && r.status === "approved") {
      reviews.push(r);
    }
  }

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

  return { reviews, averageRating, totalReviews };
}

/**
 * Submit a report on a listing, profile, or message
 */
export async function createReport(params: {
  reporterId: string;
  reporterName?: string;
  reporterPhone?: string;
  reportType: "listing" | "profile" | "message";
  targetListingId?: string;
  targetUserId?: string;
  targetTitleOrName?: string;
  reason: string;
  details?: string;
}): Promise<Report> {
  const id = crypto.randomUUID();
  const rep: Report = {
    id,
    reporter_id: params.reporterId,
    reporter_name: params.reporterName,
    reporter_phone: params.reporterPhone,
    report_type: params.reportType,
    target_listing_id: params.targetListingId || null,
    target_user_id: params.targetUserId || null,
    target_title_or_name: params.targetTitleOrName,
    reason: params.reason,
    details: params.details || null,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  memoryReports.set(id, rep);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("reports").insert({
        id,
        reporter_id: params.reporterId,
        report_type: params.reportType,
        target_listing_id: params.targetListingId,
        target_user_id: params.targetUserId,
        reason: params.reason,
        details: params.details,
        status: "pending",
      });
    } catch (e) {
      console.error("[Supabase create report error]", e);
    }
  }

  return rep;
}

/**
 * Admin: Get all reports for moderation
 */
export async function getAdminReports(statusFilter?: string): Promise<Report[]> {
  const list = Array.from(memoryReports.values());
  if (statusFilter && statusFilter !== "all") {
    return list.filter((r) => r.status === statusFilter);
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Admin: Moderate a report
 */
export async function moderateReport(params: {
  reportId: string;
  adminId: string;
  status: "resolved" | "dismissed" | "investigating";
  adminNotes?: string;
}): Promise<boolean> {
  const rep = memoryReports.get(params.reportId);
  if (rep) {
    rep.status = params.status;
    rep.reviewed_by = params.adminId;
    rep.admin_notes = params.adminNotes || null;
    rep.reviewed_at = new Date().toISOString();
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin
        .from("reports")
        .update({
          status: params.status,
          reviewed_by: params.adminId,
          admin_notes: params.adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", params.reportId);
    } catch (e) {
      console.error("[Supabase moderate report error]", e);
    }
  }

  return true;
}

/**
 * Admin: Get all reviews for moderation
 */
export async function getAdminReviews(): Promise<Review[]> {
  return Array.from(memoryReviews.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Admin: Moderate a review (flag/hide/approve)
 */
export async function moderateReview(
  reviewId: string,
  status: "approved" | "flagged" | "hidden"
): Promise<boolean> {
  const rev = memoryReviews.get(reviewId);
  if (rev) {
    rev.status = status;
    rev.updated_at = new Date().toISOString();
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin
        .from("reviews")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", reviewId);
    } catch (e) {
      console.error("[Supabase moderate review error]", e);
    }
  }

  return true;
}

// ============================================================================
// Wanted Board & Notifications Services
// ============================================================================

export async function getWantedRequests(filters?: {
  categoryId?: string;
  city?: string;
  status?: string;
}): Promise<WantedRequest[]> {
  const list = Array.from(memoryWantedRequests.values());
  return list
    .filter((req) => {
      if (filters?.status && filters.status !== "all" && req.status !== filters.status) {
        return false;
      }
      if (filters?.categoryId && filters.categoryId !== "all" && req.category_id !== filters.categoryId) {
        return false;
      }
      if (filters?.city && filters.city !== "all" && req.city.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createWantedRequest(params: {
  user: UserProfile;
  title: string;
  categoryId: string;
  categoryName: string;
  description: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  quantity?: number;
  city: string;
  images?: string[];
}): Promise<WantedRequest> {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day expiry

  const newReq: WantedRequest = {
    id,
    user_id: params.user.id,
    user_name: params.user.full_name,
    user_phone: params.user.phone_number,
    user_avatar: params.user.avatar_url,
    title: params.title.trim(),
    category_id: params.categoryId,
    category_name: params.categoryName,
    description: params.description.trim(),
    budget_min: params.budgetMin || null,
    budget_max: params.budgetMax || null,
    currency: "ETB",
    quantity: params.quantity || 1,
    city: params.city.trim(),
    images: (params.images || []).slice(0, 2), // up to 2 photos
    status: "active",
    expires_at: expiresAt.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  memoryWantedRequests.set(id, newReq);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("wanted_requests").insert(newReq);
    } catch (e) {
      console.error("[Supabase createWantedRequest error]", e);
    }
  }

  return newReq;
}

export async function updateWantedStatus(
  requestId: string,
  userId: string,
  status: "fulfilled" | "closed"
): Promise<boolean> {
  const req = memoryWantedRequests.get(requestId);
  if (!req || req.user_id !== userId) {
    return false;
  }

  req.status = status;
  req.updated_at = new Date().toISOString();

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin
        .from("wanted_requests")
        .update({ status, updated_at: req.updated_at })
        .eq("id", requestId);
    } catch (e) {
      console.error("[Supabase updateWantedStatus error]", e);
    }
  }

  return true;
}

export async function getUserNotifications(userId: string): Promise<InAppNotification[]> {
  const notifs = memoryNotifications.get(userId) || [];
  if (notifs.length === 0) {
    // Generate default welcome notification for user
    const sample: InAppNotification = {
      id: "notif-0001",
      user_id: userId,
      title: "Welcome to Furni Gebeya! 🇪🇹",
      message: "Explore handcrafted furniture from top artisans or post what you need on the Wanted Board.",
      type: "system",
      link_url: "/wanted",
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifs.push(sample);
    memoryNotifications.set(userId, notifs);
  }

  return [...notifs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function markNotificationRead(userId: string, notifId: string): Promise<boolean> {
  const notifs = memoryNotifications.get(userId) || [];
  const target = notifs.find((n) => n.id === notifId);
  if (target) {
    target.is_read = true;
    return true;
  }
  return false;
}

